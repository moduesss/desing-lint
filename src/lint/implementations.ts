import type { Finding, LintConfig } from '../utils/types';
import { getNodePath } from '../utils/node-path';

type FindingDraft = Omit<Finding, 'id' | 'ruleId' | 'level' | 'severity'>;

type RuleContext = {
  root: DocumentNode;
  config: LintConfig;
};

type RuleEvaluator = (ctx: RuleContext) => Promise<FindingDraft[]> | FindingDraft[];

function getComponentKey(node: ComponentNode): string | null {
  const anyNode = node as ComponentNode & { key?: string };
  return typeof anyNode.key === 'string' ? anyNode.key : null;
}

function getPageName(node: BaseNode): string | undefined {
  let current: BaseNode | null = node;
  while (current && current.type !== 'PAGE') {
    current = current.parent;
  }
  if (current && current.type === 'PAGE') {
    return current.name;
  }
  return undefined;
}

function areVariantsInSameSet(a: ComponentNode, b: ComponentNode): boolean {
  const pa = a.parent;
  const pb = b.parent;
  if (!pa || !pb) return false;
  return pa === pb && pa.type === 'COMPONENT_SET';
}

async function resolveMainComponent(instance: InstanceNode): Promise<ComponentNode | null> {
  if (typeof instance.getMainComponentAsync === 'function') {
    return instance.getMainComponentAsync();
  }
  return instance.mainComponent;
}

function collectTextFamiliesAndSizes(node: TextNode): { families: Set<string>; sizes: Set<number> } {
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

function normalizeBoundVariables(map?: { [key: string]: VariableAlias }): Record<string, string> | null {
  if (!map) return null;
  const result: Record<string, string> = {};
  for (const key of Object.keys(map)) {
    const aliasId = normalizeVariableAlias(map[key]);
    if (aliasId) result[key] = aliasId;
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

function extractPaintBindings(paints?: ReadonlyArray<Paint> | typeof figma.mixed): string[] | null {
  if (!Array.isArray(paints)) return null;
  const items: string[] = [];
  for (const paint of paints) {
    const bindings = normalizeBoundVariables((paint as any).boundVariables);
    if (bindings) {
      items.push(stableStringify({ type: paint.type, bindings }));
    }
  }
  if (!items.length) return null;
  items.sort();
  return items;
}

function extractEffectBindings(effects?: ReadonlyArray<Effect> | typeof figma.mixed): string[] | null {
  if (!Array.isArray(effects)) return null;
  const items: string[] = [];
  for (const effect of effects) {
    const bindings = normalizeBoundVariables((effect as any).boundVariables);
    if (bindings) {
      items.push(stableStringify({ type: effect.type, bindings }));
    }
  }
  if (!items.length) return null;
  items.sort();
  return items;
}

function extractVariableBindings(node: BaseNode): Record<string, unknown> | null {
  const anyNode = node as any;
  const result: Record<string, unknown> = {};
  const nodeBindings = normalizeBoundVariables(anyNode.boundVariables);
  if (nodeBindings) result.node = nodeBindings;

  const fillBindings = extractPaintBindings(anyNode.fills);
  if (fillBindings) result.fills = fillBindings;

  const strokeBindings = extractPaintBindings(anyNode.strokes);
  if (strokeBindings) result.strokes = strokeBindings;

  const effectBindings = extractEffectBindings(anyNode.effects);
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

function serializeComponentPropertyDefinitions(defs: ComponentPropertyDefinitions): Array<Record<string, unknown>> {
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
    const boundVars = normalizeBoundVariables(def.boundVariables);
    if (boundVars) entry.boundVariables = boundVars;
    items.push(entry);
  }
  return items;
}

function getComponentPropertyDefinitionsFor(component: ComponentNode): ComponentPropertyDefinitions {
  const parent = component.parent;
  if (parent && parent.type === 'COMPONENT_SET') {
    return parent.componentPropertyDefinitions;
  }
  return component.componentPropertyDefinitions;
}

async function buildNodeSignature(node: BaseNode): Promise<Record<string, unknown>> {
  const signature: Record<string, unknown> = { type: node.type };

  const styles = extractStyleBindings(node);
  if (styles) signature.styles = styles;

  const variables = extractVariableBindings(node);
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

async function buildComponentSignature(component: ComponentNode): Promise<string> {
  const definitions = serializeComponentPropertyDefinitions(getComponentPropertyDefinitionsFor(component));
  const variantProps = normalizeVariantProperties((component as any).variantProperties);
  const tree = await buildNodeSignature(component);
  const signature: Record<string, unknown> = {
    componentProperties: definitions,
    tree,
  };
  if (variantProps) signature.variantProperties = variantProps;
  return stableStringify(signature);
}

export const RULE_IMPLEMENTATIONS: Record<string, RuleEvaluator> = {
  'text-mixed-font-family': ({ root }) => {
    const findings: FindingDraft[] = [];
    const textNodes = root.findAll(n => n.type === 'TEXT') as TextNode[];
    for (const node of textNodes) {
      const { families } = collectTextFamiliesAndSizes(node);
      if (families.size > 1) {
        findings.push({
          message: 'Text node uses multiple font families.',
          page: getPageName(node),
          nodeId: node.id,
          path: getNodePath(node),
        });
      }
    }
    return findings;
  },
  'text-mixed-color-or-decoration': ({ root }) => {
    const findings: FindingDraft[] = [];
    const textNodes = root.findAll(n => n.type === 'TEXT') as TextNode[];
    for (const node of textNodes) {
      const hasMixedStyle = node.textStyleId === figma.mixed;
      if (!hasMixedStyle) continue;
      const { families, sizes } = collectTextFamiliesAndSizes(node);
      const fontFamilyConsistent = families.size === 1;
      const fontSizeConsistent = sizes.size === 1;
      if (fontFamilyConsistent && fontSizeConsistent) {
        findings.push({
          message: 'Text node mixes color or decoration while keeping font family and size consistent.',
          page: getPageName(node),
          nodeId: node.id,
          path: getNodePath(node),
        });
      }
    }
    return findings;
  },
  'instance-size-override': async ({ root }) => {
    const findings: FindingDraft[] = [];
    const instances = root.findAll(n => n.type === 'INSTANCE') as InstanceNode[];
    for (const node of instances) {
      const main = await resolveMainComponent(node);
      if (!main) continue;
      if (node.width !== main.width || node.height !== main.height) {
        findings.push({
          message: `Instance size differs from its master "${main.name}".`,
          page: getPageName(node),
          nodeId: node.id,
          path: getNodePath(node),
          component: main.name,
        });
      }
    }
    return findings;
  },
  'instance-detached': async ({ root }) => {
    const findings: FindingDraft[] = [];
    const instances = root.findAll(n => n.type === 'INSTANCE') as InstanceNode[];
    for (const node of instances) {
      const main = await resolveMainComponent(node);
      if (main === null) {
        findings.push({
          message: 'Instance is detached from its master component.',
          page: getPageName(node),
          nodeId: node.id,
          path: getNodePath(node),
        });
      }
    }
    return findings;
  },
  'component-true-duplicate': ({ root, config }) => {
    const findings: FindingDraft[] = [];
    const groups = config.designSystem?.semanticComponents;
    if (!groups) return findings;

    const allComponents = root.findAll(n => n.type === 'COMPONENT') as ComponentNode[];
    const byId = new Map<string, ComponentNode>();
    const byKey = new Map<string, ComponentNode>();
    for (const comp of allComponents) {
      byId.set(comp.id, comp);
      const key = getComponentKey(comp);
      if (key) byKey.set(key, comp);
    }

    for (const groupId of Object.keys(groups)) {
      const group = groups[groupId];
      const semanticId = group.id || groupId;
      const members: ComponentNode[] = [];
      const seen = new Set<string>();
      for (const id of group.componentIds || []) {
        const comp = byId.get(id);
        if (comp && !seen.has(comp.id)) {
          members.push(comp);
          seen.add(comp.id);
        }
      }
      for (const key of group.componentKeys || []) {
        const comp = byKey.get(key);
        if (comp && !seen.has(comp.id)) {
          members.push(comp);
          seen.add(comp.id);
        }
      }

      const intentionalIds = new Set(group.intentionalComponentIds || []);
      const intentionalKeys = new Set(group.intentionalComponentKeys || []);
      const filtered = members.filter(m => {
        const key = getComponentKey(m);
        if (intentionalIds.has(m.id)) return false;
        if (key && intentionalKeys.has(key)) return false;
        return true;
      });

      if (filtered.length < 2) continue;

      for (const comp of filtered) {
        const hasDuplicate = filtered.some(other => other !== comp && !areVariantsInSameSet(comp, other));
        if (!hasDuplicate) continue;
        findings.push({
          message: `Component belongs to semantic group "${semanticId}" and has true duplicates.`,
          page: getPageName(comp),
          nodeId: comp.id,
          path: getNodePath(comp),
          component: semanticId,
        });
      }
    }

    return findings;
  },
  'component-structural-duplicate': async ({ root }) => {
    const findings: FindingDraft[] = [];
    const allComponents = root.findAll(n => n.type === 'COMPONENT') as ComponentNode[];
    const groups = new Map<string, ComponentNode[]>();

    for (const comp of allComponents) {
      const signature = await buildComponentSignature(comp);
      const parent = comp.parent;
      const logicalName = parent && parent.type === 'COMPONENT_SET' ? parent.name : comp.name;
      const key = `${logicalName}::${signature}`;
      const list = groups.get(key) || [];
      list.push(comp);
      groups.set(key, list);
    }

    const getCreatedAt = (comp: ComponentNode): number => {
      const value = (comp as any).createdAt;
      return typeof value === 'number' ? value : Number.POSITIVE_INFINITY;
    };

    for (const comps of groups.values()) {
      if (comps.length < 2) continue;
      const sorted = comps.slice().sort((a, b) => {
        const ca = getCreatedAt(a);
        const cb = getCreatedAt(b);
        if (ca !== cb) return ca - cb;
        return a.id.localeCompare(b.id);
      });
      const [original, ...candidates] = sorted;
      const duplicates = candidates.filter(comp => !areVariantsInSameSet(original, comp));
      if (!duplicates.length) continue;

      const parent = original.parent;
      const logicalName = parent && parent.type === 'COMPONENT_SET' ? parent.name : original.name;
      findings.push({
        message: 'Component master is structurally identical to another master component.',
        page: getPageName(original),
        component: logicalName,
        items: duplicates.map(comp => ({
          label: comp.name,
          nodeId: comp.id,
          path: getNodePath(comp),
          page: getPageName(comp),
        })),
      });
    }

    return findings;
  },
};
