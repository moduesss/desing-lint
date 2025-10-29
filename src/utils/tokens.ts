export type DesignTokens = {
  colors?: Record<string, string>               // ex: { primary: "#1D4ED8", gray100: "#F3F4F6" }
  radii?: Record<string, number>                // ex: { sm: 4, md: 8, lg: 12 }
  text?: Record<string, {                       // ex: { body: { fontFamily:"Inter", fontSize:14, lineHeight:"AUTO" } }
    fontFamily: string
    fontSize: number
    lineHeight?: number | 'AUTO'
    fontStyle?: string
  }>
}
export function normalizeHex(hex: string): string {
  const v = hex.trim().toUpperCase()
  return v.startsWith('#') ? v : `#${v}`
}
