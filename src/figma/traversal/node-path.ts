export function getNodePath(node: BaseNode): string {
  const names: string[] = []
  let n: BaseNode | null = node
  while (n) {
    names.unshift(n.name || n.type)
    n = n.parent as BaseNode | null
  }
  if (names[0] === 'Document' || names[0] === 'DOCUMENT') names.shift()
  return names.join(' / ')
}