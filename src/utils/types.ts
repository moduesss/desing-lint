export type Severity = 'info' | 'warn' | 'error'

export type Finding = {
  id: string
  nodeId: string
  nodeName: string
  nodeType: NodeType
  path: string
  rule: string
  message: string
  severity: Severity
}

export type ScanReport = {
  startedAt: number
  finishedAt: number
  totals: { info: number; warn: number; error: number; all: number }
  findings: Finding[]
}
