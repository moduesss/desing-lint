import type { LintReport } from '../types'

export function toSlack(report: LintReport): string {
  const lines: string[] = []
  lines.push(`*Design Lint Report*`)
  lines.push(`Totals: ${report.totals.total} (⚠︎ ${report.totals.warns}, ⓘ ${report.totals.infos}, ⛔ ${report.totals.errors})`)
  lines.push(`—`)
  for (const f of report.findings.slice(0, 50)) {
    lines.push(`• ${f.message}  _(${f.ruleId} • ${f.level})_`)
  }
  if (report.findings.length > 50) lines.push(`…и ещё ${report.findings.length - 50} пунктов`)
  return lines.join('\n')
}

export function toJira(report: LintReport): string {
  const header = `||Severity||Rule||Path||`
  const rows = report.findings.slice(0, 100).map(f =>
    `|${f.severity}|${f.ruleId}|${escapePipes(f.path || '')}|`
  )
  if (report.findings.length > 100) rows.push(`|…|…|…|`)
  return [header, ...rows].join('\n')
}

function escapePipes(s: string) { return s.replace(/\|/g, '\\|') }
