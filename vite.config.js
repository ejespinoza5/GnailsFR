import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // El frontend llama a /api y Vite lo reenvía al backend.
      // Así navegador, frontend y API comparten origen y la cookie
      // de sesión funciona con SameSite=Strict sin trucos.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:4000',
          changeOrigin: false,
        },
      },
    },
  }
})
