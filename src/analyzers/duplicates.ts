import { Finding } from '../utils/types'
import { getNodePath } from '../utils/node-path'

export function findComponentNameDuplicates(root: DocumentNode): Finding[] {
  const map = new Map<string, ComponentNode[]>()
  for (const page of root.children) {
    for (const n of page.findAll(node => node.type === 'COMPONENT')) {
      const c = n as ComponentNode
      const arr = map.get(c.name) || []
      arr.push(c)
      map.set(c.name, arr)
    }
  }
  const findings: Finding[] = []
  for (const [name, comps] of map) {
    if (comps.length > 1) {
      comps.forEach(c =>
        findings.push({
          id: `dup:${c.id}`,
          ruleId: 'component-name-duplicate',
          level: 'structural',
          severity: 'warn',
          message: `Дубликат локального компонента с именем "${name}"`,
          nodeId: c.id,
          path: getNodePath(c),
          items: [{ label: c.name, nodeId: c.id, path: getNodePath(c) }]
        })
      )
    }
  }
  return findings
}
