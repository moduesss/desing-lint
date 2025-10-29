import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'ui',
  plugins: [react()],
  esbuild: { target: 'es2018' },
  build: {
    target: 'es2018',
    outDir: '../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: 'ui/index.html',
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
        entryFileNames: 'ui.[hash].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500 // чтобы не видеть варнинг в dev
  },
})
