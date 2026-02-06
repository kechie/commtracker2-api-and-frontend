import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  optimizeDeps: {
    include: ['recharts'],
    rolldownOptions: {
      jsx: 'automatic',
    },
  },
  plugins: [
    react(),
    {
      name: 'silence-rolldown-warning',
      enforce: 'post',
      config(config) {
        if (config.optimizeDeps) {
          config.optimizeDeps.esbuildOptions = {};
        }
      },
    },
  ],
})
