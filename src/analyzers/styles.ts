/// <reference types="@figma/plugin-typings" />
import { Finding } from '../utils/types'
import { getNodePath } from '../utils/node-path'
import { walk } from '../utils/traversal'
import type { DesignTokens } from '../utils/tokens'
import { normalizeHex } from '../utils/tokens'

// Локальные "лайт"-типы
type EffectKind = { type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR' }
type EffectLike = { effects?: ReadonlyArray<EffectKind>; effectStyleId?: string | typeof figma.mixed }
type GeometryLike = { fills?: readonly Paint[]; fillStyleId?: string | typeof figma.mixed }
type CornersLike = { cornerRadius: number | typeof figma.mixed }

// helpers
function solidFills(n: GeometryLike): SolidPaint[] {
  if (!n.fills || !Array.isArray(n.fills)) return []
  return (n.fills as Paint[]).filter((f): f is SolidPaint => f.type === 'SOLID')
}
function paintToHex(p: SolidPaint): string {
  const { r, g, b } = p.color
  const to255 = (x: number) => Math.round(x * 255)
  const hex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
  return `#${hex(to255(r))}${hex(to255(g))}${hex(to255(b))}`
}
function hasLocalFillWithoutStyle(n: GeometryLike): boolean {
  return solidFills(n).length > 0 && (!('fillStyleId' in n) || n.fillStyleId === '' || n.fillStyleId === undefined)
}
function hasLocalTextStyle(t: TextNode): boolean {
  return t.textStyleId === '' || t.fillStyleId === ''
}
function hasLocalEffectWithoutStyle(n: EffectLike): boolean {
  const hasEff = Array.isArray(n.effects) && n.effects.length > 0
  const hasId = n.effectStyleId !== '' && n.effectStyleId !== undefined
  return hasEff && !hasId
}
function hasLocalCorner(n: CornersLike): boolean {
  const r = n.cornerRadius
  return typeof r === 'number' && r > 0
}
function getTextFamilyAndSize(t: TextNode): { family: string | null; size: number | null } {
  let family: string | null = null
  let size: number | null = null
  const fn = t.fontName
  if (fn !== figma.mixed && typeof fn === 'object' && 'family' in fn) family = (fn as FontName).family
  const fs = t.fontSize
  if (fs !== figma.mixed && typeof fs === 'number') size = fs
  return { family, size }
}

export function checkStyleInconsistencies(root: DocumentNode, tokens?: DesignTokens): Finding[] {
  const findings: Finding[] = []
  const addFinding = (ruleId: string, severity: 'error' | 'warn' | 'info', node: BaseNode, message: string, extraId: string) => {
    const path = getNodePath(node)
    const label = 'name' in node ? node.name : ruleId;
    findings.push({
      id: `${ruleId}:${extraId}`,
      ruleId,
      level: 'stylistic',
      severity,
      message,
      nodeId: node.id,
      path,
      items: [{ label, nodeId: node.id, path }],
    })
  }

  // ❗ Без ?. и ?? — совместимо с ES2018
  const colorsObj = tokens && tokens.colors ? tokens.colors : {}
  const radiiObj  = tokens && tokens.radii  ? tokens.radii  : {}
  const textObj   = tokens && tokens.text   ? tokens.text   : {}

  const colorSet = new Set<string>(Object.values(colorsObj).map(normalizeHex))
  const radiusSet = new Set<number>(Object.values(radiiObj))
  const textArr = Object.values(textObj)

  for (const page of root.children) {
    for (const node of walk(page)) {
      // БАЗОВЫЕ ПРОВЕРКИ
      if ('fills' in node && hasLocalFillWithoutStyle(node as unknown as GeometryLike)) {
        addFinding('unlinked-fill', 'warn', node, 'Заливка без подключённого стиля', node.id)
      }
      if (node.type === 'TEXT' && hasLocalTextStyle(node as TextNode)) {
        addFinding('unlinked-text-style', 'warn', node, 'Текст без подключённых стилей (типографика/цвет)', node.id)
      }
      if ('effects' in node && hasLocalEffectWithoutStyle(node as unknown as EffectLike)) {
        addFinding('unlinked-effect', 'info', node, 'Эффект (тень/блюр) без стиля', node.id)
      }
      if ('cornerRadius' in node && hasLocalCorner(node as unknown as CornersLike)) {
        addFinding('local-corner-radius', 'info', node, 'Локальный радиус скругления (проверьте соответствие токенам)', node.id)
      }

      // СРАВНЕНИЕ С ТОКЕНАМИ
      if (tokens && 'fills' in node) {
        const solids = solidFills(node as unknown as GeometryLike)
        for (const p of solids) {
          const hex = normalizeHex(paintToHex(p))
          if (colorSet.size && !colorSet.has(hex)) {
            addFinding('color-not-in-tokens', 'warn', node, `Цвет ${hex} отсутствует в токенах`, `${node.id}:${hex}`)
          }
        }
      }
      if (tokens && 'cornerRadius' in node) {
        const r = (node as unknown as CornersLike).cornerRadius
        if (typeof r === 'number' && radiusSet.size && !radiusSet.has(r)) {
          addFinding('radius-not-in-tokens', 'warn', node, `Радиус ${r}px отсутствует в токенах`, `${node.id}:${r}`)
        }
      }
      if (tokens && node.type === 'TEXT') {
        const { family, size } = getTextFamilyAndSize(node as TextNode)
        const fontOk = textArr.length === 0 || (family !== null && textArr.some(tt => tt.fontFamily === family))
        const sizeOk = textArr.length === 0 || (size !== null && textArr.some(tt => tt.fontSize === size))
        if (!fontOk || !sizeOk) {
          addFinding('text-not-in-tokens', 'warn', node, 'Типографика не соответствует токенам (семейство/кегль)', `${node.id}`)
        }
      }
    }
  }
  return findings
}
