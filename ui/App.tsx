import React from 'react'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import Results from './components/Results'
import TokensPanel from './components/TokensPanel' // если используешь
import type { ScanReport } from './lib/types'
import { toSlack, toJira } from './lib/export'     // если используешь

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
    <div className="min-h-full bg-gray-50">
      <Header onRun={runScan} onExport={exportJson} onSlack={copySlack} onJira={copyJira} />
      <main className="max-h-[calc(100vh-48px)] overflow-auto">
        <StatusBar status={status} totals={report?.totals} error={error} />
        <Results report={report} />
        {typeof TokensPanel !== 'undefined' && <TokensPanel />}
        <div className="px-3 py-4 text-gray-400">v0.2.0 • Tailwind UI</div>
      </main>
    </div>
  )
}
