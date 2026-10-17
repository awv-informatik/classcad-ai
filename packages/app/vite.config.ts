import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The app goes where @classcad/mcp serves it from (packages/mcp/app → its dist/app) and where the relay takes it.
// Relative addresses: it works at the root of an address and in a folder alike.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'] },
  build: { outDir: '../mcp/app', emptyOutDir: true },
})
