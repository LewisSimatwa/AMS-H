import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    proxy: {
      '/backend': {
        target: process.env.VITE_PHP_API_URL || '${API_BASE_URL}',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, '/backend/api'),
      },
      '/api/analytics': {
        target: process.env.VITE_FLASK_API_URL || 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  }
})