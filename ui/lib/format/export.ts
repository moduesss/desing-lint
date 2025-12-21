import type { ScanReport } from './types'

export function toSlack(report: ScanReport): string {
  const lines: string[] = []
  lines.push(`*Design Lint Report*`)
  lines.push(`Totals: ${report.totals.all} (⚠︎ ${report.totals.warn}, ⓘ ${report.totals.info}, ⛔ ${report.totals.error})`)
  lines.push(`—`)
  for (const f of report.findings.slice(0, 50)) {
    lines.push(`• ${f.message}  _(${f.rule} • ${f.nodeType})_`)
  }
  if (report.findings.length > 50) lines.push(`…и ещё ${report.findings.length - 50} пунктов`)
  return lines.join('\n')
}

export function toJira(report: ScanReport): string {
  const header = `||Severity||Rule||Node||Path||`
  const rows = report.findings.slice(0, 100).map(f =>
    `|${f.severity}|${f.rule}|${f.nodeType} ${escapePipes(f.nodeName)}|${escapePipes(f.path)}|`
  )
  if (report.findings.length > 100) rows.push(`|…|…|…|…|`)
  return [header, ...rows].join('\n')
}

function escapePipes(s: string) { return s.replace(/\|/g, '\\|') }
