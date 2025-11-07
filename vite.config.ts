/// <reference types="node" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    root: 'ui',
    base: './',
    plugins: [react()],

    // максимально упрощаем окружение
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      // ВАЖНО: уничтожаем любые упоминания import.meta*
      'import.meta.env': '{}',
      'import.meta.url': '""'
    },

    esbuild: { target: 'ES2020' },

    build: {
      target: 'ES2020',
      outDir: '../dist',
      emptyOutDir: false,
      sourcemap: isDev,
      modulePreload: false,        // никаких <link rel="modulepreload">

      // 1 файл IIFE
      lib: {
        entry: resolve(__dirname, 'ui/main.tsx'),
        name: 'DesignLintUI',
        formats: ['iife'],
        fileName: () => 'ui.js'
      },

      rollupOptions: {
        // ВАЖНО: ничего не external — всё внутрь (react, react-dom и т.п.)
        external: [],
        output: {
          format: 'iife',
          inlineDynamicImports: true,  // запрещаем code-split и dynamic import
          hoistTransitiveImports: false
        },
        treeshake: false
      },

      cssCodeSplit: false,   // tailwind внутрь js
      minify: !isDev
    },

    // чтобы Vite не выносил react в optimizeDeps
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client']
    }
  }
})
