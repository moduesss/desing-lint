// esbuild.config.mjs
import esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

const config = {
  entryPoints: ['src/code.ts'],
  outfile: 'dist/code.js',      // ← ФАЙЛ, КОТОРЫЙ ЖДЁТ ФИГМА
  bundle: true,
  platform: 'browser',
  target: ['es2018'],
  format: 'iife',
  globalName: 'DesignLintWorker',
  loader: { '.html': 'text' },  // чтобы импортировать inline-HTML как строку
  sourcemap: isWatch ? 'inline' : false,
  logLevel: 'info'
}

if (isWatch) {
  const ctx = await esbuild.context(config)
  await ctx.watch()
  console.log('[esbuild] watching src/code.ts → dist/code.js')
} else {
  await esbuild.build(config)
  console.log('[esbuild] built dist/code.js')
}
