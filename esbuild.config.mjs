import esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

/** @type {esbuild.BuildOptions} */
const base = {
  entryPoints: ['src/code.ts'],
  outfile: 'dist/code.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  logLevel: 'info',
  sourcemap: isWatch ? 'inline' : false,
  define: { 'process.env.NODE_ENV': '"production"' }
}

if (isWatch) {
  const ctx = await esbuild.context(base)
  await ctx.watch()
  console.log('[esbuild] watching code.ts...')
} else {
  await esbuild.build(base)
}
