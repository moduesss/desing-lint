import React from 'react'

type Props = { onRun: () => void; onExport: () => void }
export default function Header({ onRun, onExport }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
      <div className="text-sm font-semibold">Design Lint</div>
      <div className="space-x-2">
        <button onClick={onRun} className="px-3 py-1.5 rounded-md border">Run Scan</button>
        <button onClick={onExport} className="px-3 py-1.5 rounded-md border">Export JSON</button>
      </div>
    </div>
  )
}
