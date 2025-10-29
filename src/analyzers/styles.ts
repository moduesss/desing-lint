/// <reference types="@figma/plugin-typings" />

import { Finding } from '../utils/types'
import { getNodePath } from '../utils/node-path'
import { walk } from '../utils/traversal'

function hasLocalFillWithoutStyle(n: GeometryMixin): boolean {
  return !!n.fills
    && Array.isArray(n.fills)
    && n.fills.some((f: Paint) => f.type === 'SOLID')
    && (!('fillStyleId' in n) || n.fillStyleId === '')
}

function hasLocalTextStyle(t: TextNode): boolean {
  return t.textStyleId === '' || t.fillStyleId === ''
}

function hasLocalEffectWithoutStyle(n: EffectMixin): boolean {
  return !!n.effects?.length && (!('effectStyleId' in n) || n.effectStyleId === '')
}

function hasLocalCorner(n: CornerMixin): boolean {
  const r = n.cornerRadius as number | typeof figma.mixed
  return typeof r === 'number' && r > 0
}

export function checkStyleInconsistencies(root: DocumentNode): Finding[] {
  const findings: Finding[] = []

  for (const page of root.children) {
    for (const node of walk(page)) {
      if ('fills' in node && hasLocalFillWithoutStyle(node as unknown as GeometryMixin)) {
        findings.push({
          id: `style:fill:${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          path: getNodePath(node),
          rule: 'unlinked-fill',
          message: 'Заливка без подключённого стиля',
          severity: 'warn',
        })
      }

      if (node.type === 'TEXT' && hasLocalTextStyle(node as TextNode)) {
        findings.push({
          id: `style:text:${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          path: getNodePath(node),
          rule: 'unlinked-text-style',
          message: 'Текст без подключённых стилей (типографика/цвет)',
          severity: 'warn',
        })
      }

      if ('effects' in node && hasLocalEffectWithoutStyle(node as unknown as EffectMixin)) {
        findings.push({
          id: `style:effect:${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          path: getNodePath(node),
          rule: 'unlinked-effect',
          message: 'Эффект (тень/блюр) без стиля',
          severity: 'info',
        })
      }

      if ('cornerRadius' in node && hasLocalCorner(node as unknown as CornerMixin)) {
        findings.push({
          id: `style:corner:${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          path: getNodePath(node),
          rule: 'local-corner-radius',
          message: 'Локальный радиус скругления (проверьте соответствие токенам)',
          severity: 'info',
        })
      }
    }
  }

  return findings
}
