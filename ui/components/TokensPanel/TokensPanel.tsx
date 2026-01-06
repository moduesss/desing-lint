import React from 'react'

export default function TokensPanel() {
  const [raw, setRaw] = React.useState<string>('{\n  "colors": { "primary": "#1D4ED8" },\n  "radii": { "sm": 4, "md": 8 },\n  "text": { "body": { "fontFamily": "Inter", "fontSize": 14 } }\n}')
  const [ok, setOk] = React.useState<string>('')

  React.useEffect(() => {
    const h = (e: MessageEvent) => {
      const msg = (e.data || {}).pluginMessage
      if (!msg) return
      if (msg.type === 'TOKENS_OK') setOk('Токены сохранены')
      if (msg.type === 'TOKENS_ERR') setOk('Ошибка: ' + msg.payload?.message)
    }
    window.addEventListener('message', h)
    return () => window.removeEventListener('message', h)
  }, [])

  const load = () => parent.postMessage({ pluginMessage: { type: 'LOAD_TOKENS', payload: { json: raw } } }, '*')
  const clear = () => parent.postMessage({ pluginMessage: { type: 'CLEAR_TOKENS' } }, '*')

  return (
    <div className="p-3 border-t space-y-2">
      <div className="text-sm font-medium">Design Tokens</div>
      <textarea
        className="w-full h-28 p-2 border rounded font-mono text-[12px]"
        value={raw}
        onChange={e => setRaw(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="px-3 py-1.5 border rounded" onClick={load}>Load Tokens</button>
        <button className="px-3 py-1.5 border rounded" onClick={clear}>Clear</button>
        <div className="text-xs text-gray-500 self-center">{ok}</div>
      </div>
    </div>
  )
}
