import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({

  build: {
    chunkSizeWarningLimit: 1000 // Increase limit to 1000 KB
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://chatty-serageldien-project.vercel.app', // Use the actual deployed backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },

  plugins: [react()],
})
