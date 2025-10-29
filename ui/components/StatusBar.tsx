import React from 'react'

type Props = {
  status: 'idle'|'scanning'|'done'|'error'
  totals?: { info: number; warn: number; error: number; all: number }
  error?: string
}
export default function StatusBar({ status, totals, error }: Props) {
  const label = status === 'idle' ? 'Idle' : status === 'scanning' ? 'Scanning…' : status === 'done' ? 'Completed' : 'Error'
  return (
    <div className="p-3 flex items-center justify-between">
      <div className="text-gray-600">{label}</div>
      {status === 'scanning' && <div className="animate-pulse">Идёт анализ…</div>}
      {status === 'done' && totals && (
        <div className="text-gray-600">Всего: {totals.all} • ⚠︎ {totals.warn} • ⓘ {totals.info} • ⛔ {totals.error}</div>
      )}
      {status === 'error' && <div className="text-red-600">{error}</div>}
    </div>
  )
}
