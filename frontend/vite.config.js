import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
      manualChunks: undefined, // Remove manualChunks
      advancedChunks: {
        groups: [{ name: 'vendor', test:  /[\\/]node_modules[\\/](react|react-dom)[\\/]/ }]
          }
      }
    }
  },
  optimizeDeps: {
    rolldownOptions: {
      jsx: 'automatic',
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
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
