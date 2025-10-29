import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'ui',
  base: './',              
  plugins: [react()],
  esbuild: { target: 'es2020' }, 
  build: {
    target: 'es2020',
    outDir: '../dist',
    emptyOutDir: false,
    sourcemap: true,
  }
})
