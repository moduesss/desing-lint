import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    root: 'ui',
    base: './',
    plugins: [react()],
    esbuild: { target: 'es2020' }, 
    build: {
      target: 'es2020',
      outDir: '../dist',
      emptyOutDir: false,
      sourcemap: isDev,
      lib: {
        entry: resolve(__dirname, 'ui/main.tsx'),
        name: 'DesignLintUI',
        formats: ['iife'],
        fileName: () => 'ui.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
      cssCodeSplit: false,   
      minify: !isDev,
    },
  }
})
