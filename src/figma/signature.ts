import { getComponentKey, resolveMainComponent } from './figmaUtils';
import { isNodeUnsafe, safeAccess } from './safeAccess';
import { extractStyleBindings, extractVariableBindings, normalizeBoundVariables } from './variables';

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

async function serializeComponentPropertyDefinitions(
  component: ComponentNode,
  defs: ComponentPropertyDefinitions,
): Promise<Array<Record<string, unknown>>> {
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
