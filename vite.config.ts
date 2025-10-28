import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy para llamadas directas a la API externa (evita CORS en desarrollo)
      '/api-lotemovil': {
        target: 'https://lotemovil.tecnoaccion.com.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-lotemovil/, '/api/public'),
        secure: false,
      },
      // Proxy para las funciones serverless en desarrollo
      // En producción Vercel maneja esto automáticamente
      '/api/extracto': {
        target: 'http://localhost:3000',
        changeOrigin: false,
        // En desarrollo, usar directamente la función local
        bypass: (req, res) => {
          // Simular la función serverless localmente
          return '/api/extracto';
        }
      }
    }
  }
})