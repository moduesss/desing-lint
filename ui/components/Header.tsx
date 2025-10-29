import React from 'react'

type Props = {
  onRun: () => void
  onExport: () => void
  onSlack: () => void
  onJira: () => void
}
export default function Header({ onRun, onExport, onSlack, onJira }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="font-semibold text-gray-900">Design Lint</div>
        <div className="flex items-center gap-2">
          <button onClick={onRun} className="btn btn-primary">Run Scan</button>
          <button onClick={onExport} className="btn">Export JSON</button>
          <button onClick={onSlack} className="btn">Copy Slack</button>
          <button onClick={onJira} className="btn">Copy Jira</button>
        </div>
      </div>
    </div>
  )
}
