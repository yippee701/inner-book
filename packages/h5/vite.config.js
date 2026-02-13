import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 根据部署域名决定 base：inner-book.top 用 /，其他（如 GitHub Pages）用 /know-yourself/
const base = process.env.VITE_BASE ?? (
  process.env.VITE_APP_DOMAIN === 'inner-book.top' ? '/' : '/inner-book/'
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
  root: __dirname,
  resolve: {
    alias: {
      '@know-yourself/core': path.resolve(__dirname, '../core/src/index.js'),
      '@know-yourself/core/adapters': path.resolve(__dirname, '../core/src/adapters/index.js'),
      '@know-yourself/core/api/mockData': path.resolve(__dirname, '../core/src/api/mockData.js'),
      '@know-yourself/core/utils/trackError': path.resolve(__dirname, '../core/src/utils/trackError.js'),
    },
  },
})
