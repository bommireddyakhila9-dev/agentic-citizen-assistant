import { defineConfig } from 'vite'

// Vite natively compiles JSX using high-speed esbuild, completely eliminating
// the need for heavy Babel plugins that caused the missing '@babel/types' error.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
