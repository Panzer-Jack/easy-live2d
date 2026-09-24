import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { alias: { '#runtime': fileURLToPath(new URL(process.env.LIVE2D_BASELINE ? '../core/.cache/baseline/index.js' : '../core/dist/index.js', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 4178, strictPort: true },
})
