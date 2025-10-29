import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'ui',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: 'ui/index.html',
      output: {
        entryFileNames: 'ui.[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
