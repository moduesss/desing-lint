import React from 'react'
import type { ScanReport } from '../lib/types'

type Props = { report: ScanReport | null }

export default function Results({ report }: Props) {
  if (!report) return <div className="p-3 text-gray-500">Нажмите «Run Scan», чтобы начать</div>
  if (report.findings.length === 0) return <div className="p-3">Чисто ✨ Несоответствий не найдено</div>

  return (
    <div className="divide-y">
      {report.findings.map(f => (
        <div key={f.id} className="p-3 hover:bg-gray-50 flex items-start gap-2">
          <div className="mt-0.5">
            {f.severity === 'error' ? '⛔' : f.severity === 'warn' ? '⚠︎' : 'ⓘ'}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-[13px] break-words">{f.message}</div>
            <div className="text-gray-500 text-[12px] break-words">{f.rule} • {f.nodeType} • {f.path}</div>
          </div>
          <div className="ml-auto">
            <button
              className="text-[12px] px-2 py-1 border rounded"
              onClick={() => parent.postMessage({ pluginMessage: { type: 'HIGHLIGHT', payload: { nodeId: f.nodeId } } }, '*')}
            >Show</button>
          </div>
        </div>
      ))}
    </div>
  )
}
