import esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

/** @type {esbuild.BuildOptions} */
const base = {
  entryPoints: ['src/code.ts'],
  outfile: 'dist/code.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2018'],
  logLevel: 'info',
  loader: { '.html': 'text' },
  sourcemap: isWatch ? 'inline' : false,
  define: { 'process.env.NODE_ENV': '"development"' },

  // ВАЖНО: чтобы можно было `import uiHtml from '../dist/index.html'`
  loader: { '.html': 'text' }
}

if (isWatch) {
  const ctx = await esbuild.context(base)
  await ctx.watch()
  console.log('[esbuild] watching code.ts → dist/code.js')
} else {
  await esbuild.build(base)
  console.log('[esbuild] built code.ts → dist/code.js')
}
