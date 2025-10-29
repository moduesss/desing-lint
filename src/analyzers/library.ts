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
          nodeId: inst.id,
          nodeName: inst.name,
          nodeType: inst.type,
          path: getNodePath(inst),
          rule: 'detached-instance',
          message: 'Инстанс отсоединён от компонента',
          severity: 'error',
        })
      }
    }
  }

  return findings
}
