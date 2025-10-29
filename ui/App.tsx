import React from 'react'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import Results from './components/Results'
import TokensPanel from './components/TokensPanel'
import type { ScanReport } from './lib/types'
import { toSlack, toJira } from './lib/export'

export default function App() {
  const [status, setStatus] = React.useState<'idle'|'scanning'|'done'|'error'>('idle')
  const [report, setReport] = React.useState<ScanReport | null>(null)
  const [error, setError] = React.useState<string>('')

  React.useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage
      if (!msg) return
      switch (msg.type) {
        case 'STATUS': setStatus(msg.payload.status); break
        case 'SCAN_DONE': setReport(msg.payload); setStatus('done'); break
        case 'ERROR': setStatus('error'); setError(msg.payload.message); break
        case 'EXPORTED': alert('Отчёт сохранён в clientStorage'); break
      }
    }
  }, [])

  const runScan = () => parent.postMessage({ pluginMessage: { type: 'RUN_SCAN' } }, '*')
  const exportJson = () => {
    if (!report) return
    parent.postMessage({ pluginMessage: { type: 'EXPORT_JSON', payload: { report } } }, '*')
    navigator.clipboard.writeText(JSON.stringify(report, null, 2))
  }
  const copySlack = () => { if (report) navigator.clipboard.writeText(toSlack(report)) }
  const copyJira  = () => { if (report) navigator.clipboard.writeText(toJira(report)) }

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <Header onRun={runScan} onExport={exportJson} onSlack={copySlack} onJira={copyJira} />
      <StatusBar status={status} totals={report?.totals} error={error} />
      <Results report={report} />
      <TokensPanel />
      <div className="p-3 text-gray-400">v0.2.0 • Tokens + Tailwind + Slack/Jira</div>
    </div>
  )
}
