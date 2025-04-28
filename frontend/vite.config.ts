import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  
  return {
  plugins: [react()],
  server: {
    port: 5173,
      proxy: isDevelopment 
        ? {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
          }
        : undefined, // No proxy in production
    },
    define: {
      // Make environment variables available to client code
      'import.meta.env.VITE_API_URL': isDevelopment 
        ? JSON.stringify('/api') // Use relative path in development (with proxy)
        : JSON.stringify(process.env.VITE_API_URL || 'https://api.spokify.com'), // Use absolute URL in production
    }
  }
})
