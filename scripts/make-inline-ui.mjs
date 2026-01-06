// Build a single inline HTML string for figma.showUI by embedding dist/ui.js
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '..', 'dist')
const uiJsPath = resolve(distDir, 'ui.js')
const uiCssPath = resolve(distDir, 'design-lint.css')
const uiHtmlPath = resolve(distDir, 'ui.html')

const js = await readFile(uiJsPath, 'utf8')
const sanitizedJs = js.replaceAll('</script>', '<\\/script>')

let css = ''
try {
  css = await readFile(uiCssPath, 'utf8')
} catch {
  console.warn('[inline-ui] dist/style.css not found, continuing without inline CSS')
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${css ? `<style>${css}</style>` : ''}
</head>
<body>
  <div id="root"></div>
  <script>${sanitizedJs}</script>
</body>
</html>
`

await mkdir(distDir, { recursive: true })
await writeFile(uiHtmlPath, html, 'utf8')
console.log(`[inline-ui] wrote ${uiHtmlPath}`)
