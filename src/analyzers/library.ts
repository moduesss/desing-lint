/// <reference types="@figma/plugin-typings" />
import { Finding } from '../utils/types'
import { getNodePath } from '../utils/node-path'

export function checkLibraryLinks(root: DocumentNode): Finding[] {
  const findings: Finding[] = []

  for (const page of root.children) {
    // Детаченные инстансы
    for (const n of page.findAll((node: SceneNode) => node.type === 'INSTANCE')) {
      const inst = n as InstanceNode
      if (!inst.mainComponent) {
        findings.push({
          id: `lib:detached:${inst.id}`,
          ruleId: 'detached-instance',
          level: 'structural',
          severity: 'error',
          message: 'Инстанс отсоединён от компонента',
          nodeId: inst.id,
          path: getNodePath(inst),
          items: [{ label: inst.name, nodeId: inst.id, path: getNodePath(inst) }],
        })
      }
    }
  }

  return findings
}
