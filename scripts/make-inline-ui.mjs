// scripts/make-inline-ui.mjs
import fs from 'node:fs'
import path from 'node:path'

const distDir = path.resolve('dist')
const jsPath  = path.join(distDir, 'ui.js')
const outHtml = path.join(distDir, 'index.html')

// 1) читаем ui.js из Vite
if (!fs.existsSync(jsPath)) {
  console.error('[make-inline-ui] dist/ui.js not found. Run Vite build first.')
  process.exit(1)
}
let js = fs.readFileSync(jsPath, 'utf8')

// 2) подчистим import.meta (на всякий)
js = js.replace(/\bimport\.meta(\.env|\.(url))?/g, '({})')

// 3) гарантированно оборачиваем в IIFE (если вдруг не обернут)
function ensureIIFE(code) {
  const t = code.trimStart()
  const starts = t.slice(0, 2)
  const already = starts === '((' || starts === '!(' || starts === '+(' || starts === '~('
  return already ? code : `(function(){\n${code}\n})();`
}
js = ensureIIFE(js)

// 4) собираем минимальный, заведомо корректный HTML
const html =
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Design Lint</title>
    <style>
      /* мини-стаб чтобы видеть, что HTML жив */
      html,body,#root{height:100%} body{margin:0;font:14px Inter,system-ui,Arial}
    </style>
  </head>
  <body>
    <div id="root">HTML loaded…</div>
    <script>
${js}
    </script>
  </body>
</html>`

fs.writeFileSync(outHtml, html)
console.log('[make-inline-ui] wrote', outHtml)
