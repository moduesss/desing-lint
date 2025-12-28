import type { Finding, LintConfig } from '../../utils/types';

export type FindingDraft = Omit<Finding, 'id' | 'ruleId' | 'level' | 'severity'>;

export type RuleContext = {
  root: DocumentNode;
  config: LintConfig;
};

export type RuleEvaluator = (ctx: RuleContext) => Promise<FindingDraft[]> | FindingDraft[];

type UnsafeInfo = {
  node: BaseNode;
  reasons: string[];
};

const unsafeNodes = new Map<string, UnsafeInfo>();
const variableResolutionCache = new Map<string, Promise<boolean>>();

export function resetUnsafeNodes(): void {
  unsafeNodes.clear();
  variableResolutionCache.clear();
}

export function markNodeUnsafe(node: BaseNode, reason: string): void {
  const info = unsafeNodes.get(node.id);
  if (info) {
    if (!info.reasons.includes(reason)) info.reasons.push(reason);
    return;
  }
  const reasons = [reason];
  unsafeNodes.set(node.id, { node, reasons });
  // Minimal debug log with nodeId and reason; avoids UI spam.
  // eslint-disable-next-line no-console
  console.warn('[Design Lint] broken-variable-binding', node.id, reason);
}

export function isNodeUnsafe(node: BaseNode): boolean {
  return unsafeNodes.has(node.id);
}

export function getUnsafeNodes(): UnsafeInfo[] {
  return Array.from(unsafeNodes.values());
}

async function safeAccess<T>(node: BaseNode, reason: string, action: () => Promise<T> | T): Promise<T | null> {
  try {
    return await action();
  } catch (err) {
    const message = `${reason}: ${String(err)}`;
    markNodeUnsafe(node, message);
    return null;
  }
}

function isIgnorableVariableError(message: string): boolean {
  const msg = message.toLowerCase();
  return msg.includes('documentaccess') || msg.includes('getvariablebyid');
}

async function resolveVariable(aliasId: string | null | undefined, owner?: BaseNode): Promise<boolean> {
  if (!aliasId) return false;
  const cached = variableResolutionCache.get(aliasId);
  if (cached) return cached;

  const resolver = (figma as any).variables?.getVariableByIdAsync;
  if (typeof resolver !== 'function') {
    const fallback = Promise.resolve(true); // cannot validate; assume present
    variableResolutionCache.set(aliasId, fallback);
    return fallback;
  }

  const promise = (async () => {
    try {
      const resolved = await resolver.call((figma as any).variables, aliasId);
      if (!resolved && owner) {
        markNodeUnsafe(owner, `Variable alias ${aliasId} is missing`);
      }
      return !!resolved;
    } catch (err) {
      const message = String(err);
      if (isIgnorableVariableError(message)) return true;
      if (owner) {
        markNodeUnsafe(owner, `Variable alias ${aliasId} failed: ${message}`);
      }
      return false;
    }
  })();

  variableResolutionCache.set(aliasId, promise);
  return promise;
}

export function getComponentKey(node: ComponentNode): string | null {
  const anyNode = node as ComponentNode & { key?: string };
  return typeof anyNode.key === 'string' ? anyNode.key : null;
}

export function getPageName(node: BaseNode): string | undefined {
  let current: BaseNode | null = node;
  while (current && current.type !== 'PAGE') {
    current = current.parent;
  }
  if (current && current.type === 'PAGE') {
    return current.name;
  }
  return undefined;
}

export function areVariantsInSameSet(a: ComponentNode, b: ComponentNode): boolean {
  const pa = a.parent;
  const pb = b.parent;
  if (!pa || !pb) return false;
  return pa === pb && pa.type === 'COMPONENT_SET';
}

export async function resolveMainComponent(instance: InstanceNode): Promise<ComponentNode | null> {
  if (typeof instance.getMainComponentAsync === 'function') {
    return instance.getMainComponentAsync();
  }
  return instance.mainComponent;
}

export function collectTextFamiliesAndSizes(node: TextNode): { families: Set<string>; sizes: Set<number> } {
  const families = new Set<string>();
  const sizes = new Set<number>();
  const segments = node.getStyledTextSegments(['fontName', 'fontSize']);
  for (const segment of segments) {
    const fontName = (segment as any).fontName as FontName | typeof figma.mixed;
    if (fontName && fontName !== figma.mixed && typeof fontName === 'object' && 'family' in fontName) {
      families.add(fontName.family);
    }
    const size = (segment as any).fontSize as number | typeof figma.mixed;
    if (typeof size === 'number') sizes.add(size);
  }
  return { families, sizes };
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort();
    const parts: string[] = [];
    for (const key of keys) {
      parts.push(`${JSON.stringify(key)}:${stableStringify(obj[key])}`);
    }
    return `{${parts.join(',')}}`;
  }
  return JSON.stringify(value);
}

function normalizeVariableAlias(alias: VariableAlias | undefined): string | null {
  if (!alias || typeof alias.id !== 'string') return null;
  return alias.id;
}

async function normalizeBoundVariables(map: { [key: string]: VariableAlias } | undefined, owner?: BaseNode): Promise<Record<string, string> | null> {
  if (!map) return null;
  const result: Record<string, string> = {};
  for (const key of Object.keys(map)) {
    const aliasId = normalizeVariableAlias(map[key]);
    if (!aliasId) continue;
    const exists = await resolveVariable(aliasId, owner);
    if (!exists) continue;
    result[key] = aliasId;
  }
  return Object.keys(result).length ? result : null;
}

function extractStyleBindings(node: BaseNode): Record<string, string> | null {
  const anyNode = node as unknown as Record<string, unknown>;
  const result: Record<string, string> = {};
  const readStyleId = (value: unknown): string | null => {
    if (value === figma.mixed) return 'mixed';
    if (typeof value === 'string') return value;
    return null;
  };

  const styleFields = [
    'fillStyleId',
    'strokeStyleId',
    'textStyleId',
    'effectStyleId',
    'gridStyleId',
    'backgroundStyleId',
  ];
  for (const field of styleFields) {
    if (field in anyNode) {
      const styleId = readStyleId((anyNode as any)[field]);
      if (styleId !== null) result[field] = styleId;
    }
  }
  return Object.keys(result).length ? result : null;
}

async function extractPaintBindings(node: BaseNode, paints?: ReadonlyArray<Paint> | typeof figma.mixed): Promise<string[] | null> {
  if (!Array.isArray(paints)) return null;
  const items: string[] = [];
  for (const paint of paints) {
    const bindings = await normalizeBoundVariables((paint as any).boundVariables, node);
    if (bindings) {
      const payload = await safeAccess(node, 'paint boundVariables', () => Promise.resolve(stableStringify({ type: paint.type, bindings })));
      if (payload) items.push(payload);
    }
  }
  if (!items.length) return null;
  items.sort();
  return items;
}

async function extractEffectBindings(node: BaseNode, effects?: ReadonlyArray<Effect> | typeof figma.mixed): Promise<string[] | null> {
  if (!Array.isArray(effects)) return null;
  const items: string[] = [];
  for (const effect of effects) {
    const bindings = await normalizeBoundVariables((effect as any).boundVariables, node);
    if (bindings) {
      const payload = await safeAccess(node, 'effect boundVariables', () => Promise.resolve(stableStringify({ type: effect.type, bindings })));
      if (payload) items.push(payload);
    }
  }
  if (!items.length) return null;
  items.sort();
  return items;
}

export async function extractVariableBindings(node: BaseNode): Promise<Record<string, unknown> | null> {
  const anyNode = node as any;
  const result: Record<string, unknown> = {};
  const nodeBindings = await safeAccess(node, 'node boundVariables', () => normalizeBoundVariables(anyNode.boundVariables, node));
  if (nodeBindings) result.node = nodeBindings;

  const fillBindings = await safeAccess(node, 'fills boundVariables', () => extractPaintBindings(node, anyNode.fills));
  if (fillBindings) result.fills = fillBindings;

  const strokeBindings = await safeAccess(node, 'strokes boundVariables', () => extractPaintBindings(node, anyNode.strokes));
  if (strokeBindings) result.strokes = strokeBindings;

  const effectBindings = await safeAccess(node, 'effects boundVariables', () => extractEffectBindings(node, anyNode.effects));
  if (effectBindings) result.effects = effectBindings;

  return Object.keys(result).length ? result : null;
}

function extractAutoLayout(node: BaseNode): Record<string, unknown> | null {
  const anyNode = node as any;
  if (!('layoutMode' in anyNode)) return null;

  const result: Record<string, unknown> = {};
  const fields = [
    'layoutMode',
    'primaryAxisSizingMode',
    'counterAxisSizingMode',
    'primaryAxisAlignItems',
    'counterAxisAlignItems',
    'counterAxisAlignContent',
    'itemSpacing',
    'counterAxisSpacing',
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'paddingBottom',
    'itemReverseZIndex',
    'layoutWrap',
    'strokesIncludedInLayout',
    'layoutSizingHorizontal',
    'layoutSizingVertical',
  ];
  for (const field of fields) {
    if (field in anyNode) {
      const value = anyNode[field];
      if (value !== undefined) result[field] = value;
    }
  }

  if ('gridRowCount' in anyNode) {
    result.gridRowCount = anyNode.gridRowCount;
    result.gridColumnCount = anyNode.gridColumnCount;
    result.gridRowGap = anyNode.gridRowGap;
    result.gridColumnGap = anyNode.gridColumnGap;
    if (Array.isArray(anyNode.gridRowSizes)) {
      result.gridRowSizes = anyNode.gridRowSizes.map((size: GridTrackSize) => ({
        type: size.type,
        value: size.value,
      }));
    }
    if (Array.isArray(anyNode.gridColumnSizes)) {
      result.gridColumnSizes = anyNode.gridColumnSizes.map((size: GridTrackSize) => ({
        type: size.type,
        value: size.value,
      }));
    }
  }

  return Object.keys(result).length ? result : null;
}

function extractAutoLayoutChild(node: BaseNode): Record<string, unknown> | null {
  const anyNode = node as any;
  const result: Record<string, unknown> = {};
  const fields = [
    'layoutAlign',
    'layoutGrow',
    'layoutPositioning',
    'layoutSizingHorizontal',
    'layoutSizingVertical',
  ];
  for (const field of fields) {
    if (field in anyNode) {
      const value = anyNode[field];
      if (value !== undefined) result[field] = value;
    }
  }
  return Object.keys(result).length ? result : null;
}

function extractGridChild(node: BaseNode): Record<string, unknown> | null {
  const anyNode = node as any;
  const result: Record<string, unknown> = {};
  const fields = [
    'gridRowAnchorIndex',
    'gridColumnAnchorIndex',
    'gridRowSpan',
    'gridColumnSpan',
  ];
  for (const field of fields) {
    if (field in anyNode) {
      const value = anyNode[field];
      if (value !== undefined) result[field] = value;
    }
  }
  return Object.keys(result).length ? result : null;
}

function normalizeVariantProperties(variantProps: { [key: string]: string } | null | undefined): Record<string, string> | null {
  if (!variantProps) return null;
  const result: Record<string, string> = {};
  for (const key of Object.keys(variantProps).sort()) {
    result[key] = variantProps[key];
  }
  return Object.keys(result).length ? result : null;
}

async function serializeComponentPropertyDefinitions(component: ComponentNode, defs: ComponentPropertyDefinitions): Promise<Array<Record<string, unknown>>> {
  const items: Array<Record<string, unknown>> = [];
  const keys = Object.keys(defs).sort();
  for (const key of keys) {
    const def = defs[key];
    const entry: Record<string, unknown> = {
      name: key,
      type: def.type,
      defaultValue: def.defaultValue,
    };
    if (Array.isArray(def.preferredValues)) {
      entry.preferredValues = def.preferredValues.map(value => ({
        type: value.type,
        key: value.key,
      }));
    }
    if (Array.isArray(def.variantOptions)) {
      entry.variantOptions = def.variantOptions.slice();
    }
    const boundVars = await normalizeBoundVariables(def.boundVariables, component);
    if (boundVars) entry.boundVariables = boundVars;
    items.push(entry);
  }
  return items;
}

export async function getComponentPropertyDefinitionsFor(component: ComponentNode): Promise<ComponentPropertyDefinitions | null> {
  const parent = component.parent;
  if (parent && parent.type === 'COMPONENT_SET') {
    return safeAccess(component, 'componentSet.componentPropertyDefinitions', () => Promise.resolve(parent.componentPropertyDefinitions));
  }
  return safeAccess(component, 'component.componentPropertyDefinitions', () => Promise.resolve(component.componentPropertyDefinitions));
}

async function buildNodeSignature(node: BaseNode): Promise<Record<string, unknown>> {
  if (isNodeUnsafe(node)) {
    return { type: node.type, unsafe: true };
  }
  const signature: Record<string, unknown> = { type: node.type };

  const styles = extractStyleBindings(node);
  if (styles) signature.styles = styles;

  const variables = await extractVariableBindings(node);
  if (variables) signature.variables = variables;

  const autoLayout = extractAutoLayout(node);
  if (autoLayout) signature.autoLayout = autoLayout;

  const autoLayoutChild = extractAutoLayoutChild(node);
  if (autoLayoutChild) signature.autoLayoutChild = autoLayoutChild;

  const gridChild = extractGridChild(node);
  if (gridChild) signature.gridChild = gridChild;

  if (node.type === 'INSTANCE') {
    const main = await resolveMainComponent(node as InstanceNode);
    signature.instanceMain = main ? (getComponentKey(main) || main.id) : null;
  }

  if ('children' in node) {
    const children = (node as BaseNode & ChildrenMixin).children;
    const childSignatures: Array<Record<string, unknown>> = [];
    for (const child of children) {
      childSignatures.push(await buildNodeSignature(child));
    }
    signature.children = childSignatures;
  }

  return signature;
}

export async function buildComponentSignature(component: ComponentNode): Promise<string> {
  const defs = await getComponentPropertyDefinitionsFor(component);
  const definitions = defs ? await serializeComponentPropertyDefinitions(component, defs) : [];
  const variantProps = normalizeVariantProperties((component as any).variantProperties);
  const tree = await buildNodeSignature(component);
  const signature: Record<string, unknown> = {
    componentProperties: definitions,
    tree,
  };
  if (variantProps) signature.variantProperties = variantProps;
  return stableStringify(signature);
}
