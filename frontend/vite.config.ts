import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend API URL - change this to your Render URL after deploy
const API_URL = process.env.VITE_API_URL || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/analyze': {
        target: API_URL,
        changeOrigin: true,
      },
      '/candidates': {
        target: API_URL,
        changeOrigin: true,
      },
    },
  },
})
