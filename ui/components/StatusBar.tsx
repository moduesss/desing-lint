import React from 'react'

type Props = {
  status: 'idle'|'scanning'|'done'|'error'
  totals?: { info: number; warn: number; error: number; all: number }
  error?: string
}
export default function StatusBar({ status, totals, error }: Props) {
  const label =
    status === 'idle' ? 'Idle' :
    status === 'scanning' ? 'Scanning…' :
    status === 'done' ? 'Completed' : 'Error'

  return (
    <div className="px-3 py-2 flex items-center justify-between">
      <div className="text-gray-600">{label}</div>
      {status === 'scanning' && (
        <div className="badge animate-pulse">Идёт анализ…</div>
      )}
      {status === 'done' && totals && (
        <div className="flex items-center gap-2 text-gray-600">
          <span className="badge">Всего: {totals.all}</span>
          <span className="badge">⚠︎ {totals.warn}</span>
          <span className="badge">ⓘ {totals.info}</span>
          <span className="badge">⛔ {totals.error}</span>
        </div>
      )}
      {status === 'error' && <div className="text-red-600">{error}</div>}
    </div>
  )
}
