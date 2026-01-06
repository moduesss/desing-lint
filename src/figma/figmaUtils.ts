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
