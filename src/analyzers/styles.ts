/// <reference types="@figma/plugin-typings" />
import { Finding } from '../utils/types'
import { getNodePath } from '../utils/node-path'
import { walk } from '../utils/traversal'
import type { DesignTokens } from '../utils/tokens'
import { normalizeHex } from '../utils/tokens'

function solidFills(n: GeometryMixin): Paint[] {
  if (!n.fills || !Array.isArray(n.fills)) return []
  return (n.fills as Paint[]).filter(f => f.type === 'SOLID')
}

function paintToHex(p: SolidPaint): string | null {
  const { r, g, b } = p.color
  const to255 = (x: number) => Math.round(x * 255)
  const hex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
  return `#${hex(to255(r))}${hex(to255(g))}${hex(to255(b))}`
}

function hasLocalFillWithoutStyle(n: GeometryMixin): boolean {
  return solidFills(n).length > 0 && (!('fillStyleId' in n) || n.fillStyleId === '')
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

export function checkStyleInconsistencies(root: DocumentNode, tokens?: DesignTokens): Finding[] {
  const findings: Finding[] = []
  const colorSet = new Set<string>(
    Object.values(tokens?.colors ?? {}).map(normalizeHex)
  )
  const radiusSet = new Set<number>(Object.values(tokens?.radii ?? {}))
  const textArr = Object.values(tokens?.text ?? {})

  for (const page of root.children) {
    for (const node of walk(page)) {
      // базовые проверки связности стилей
      if ('fills' in node && hasLocalFillWithoutStyle(node as unknown as GeometryMixin)) {
        findings.push({
          id: `style:fill:${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          path: getNodePath(node),
          rule: 'unlinked-fill',
          message: 'Заливка без подключённого стиля',
          severity: 'warn'
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
          severity: 'warn'
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
          severity: 'info'
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
          severity: 'info'
        })
      }

      // проверки на соответствие эталонам
      if (tokens && 'fills' in node) {
        const solids = solidFills(node as unknown as GeometryMixin) as SolidPaint[]
        for (const p of solids) {
          const hex = paintToHex(p)
          if (hex && colorSet.size && !colorSet.has(hex)) {
            findings.push({
              id: `tokens:color:${node.id}:${hex}`,
              nodeId: node.id,
              nodeName: node.name,
              nodeType: node.type,
              path: getNodePath(node),
              rule: 'color-not-in-tokens',
              message: `Цвет ${hex} отсутствует в токенах`,
              severity: 'warn'
            })
          }
        }
      }

      if (tokens && 'cornerRadius' in node) {
        const r = (node as unknown as CornerMixin).cornerRadius as number | typeof figma.mixed
        if (typeof r === 'number' && radiusSet.size && !radiusSet.has(r)) {
          findings.push({
            id: `tokens:radius:${node.id}:${r}`,
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            path: getNodePath(node),
            rule: 'radius-not-in-tokens',
            message: `Радиус ${r}px отсутствует в токенах`,
            severity: 'warn'
          })
        }
      }

      if (tokens && node.type === 'TEXT') {
        const t = node as TextNode
        const fontOk = textArr.length === 0 || textArr.some(tt => tt.fontFamily === t.fontName.family)
        const sizeOk = textArr.length === 0 || textArr.some(tt => tt.fontSize === t.fontSize)
        if (!fontOk || !sizeOk) {
          findings.push({
            id: `tokens:text:${node.id}`,
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            path: getNodePath(node),
            rule: 'text-not-in-tokens',
            message: `Типографика не соответствует токенам (семейство/кегль)`,
            severity: 'warn'
          })
        }
      }
    }
  }
  return findings
}
