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
          nodeId: c.id,
          nodeName: c.name,
          nodeType: c.type,
          path: getNodePath(c),
          rule: 'component-name-duplicate',
          message: `Дубликат локального компонента с именем "${name}"`,
          severity: 'warn'
        })
      )
    }
  }
  return findings
}
