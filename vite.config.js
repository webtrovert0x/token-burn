import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@wagmi/core/tempo': path.resolve(__dirname, 'src/tempo-stub.js'),
    },
  },
  define: {
    'process.env': {},
  },
})
