import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    root: 'ui',
    plugins: [react()],
    // UI можно собирать под ES2020 (поддерживает BigInt)
    esbuild: { target: 'es2020' },
    build: {
      target: 'es2020',
      outDir: '../dist',
      emptyOutDir: false,
      minify: !isDev,
      sourcemap: true,
      rollupOptions: {
        input: 'ui/index.html',
        output: {
          // фиксированное имя в dev, с хешем в prod
          entryFileNames: isDev ? 'ui.js' : 'ui.[hash].js',
          chunkFileNames: isDev ? 'chunks/[name].js' : 'chunks/[name].[hash].js',
          assetFileNames: isDev ? 'assets/[name][extname]' : 'assets/[name].[hash][extname]'
        }
      },
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1500
    }
  }
})
