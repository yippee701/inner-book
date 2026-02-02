import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 根据部署域名决定 base：inner-book.top 用 /，其他（如 GitHub Pages）用 /know-yourself/
// 构建时通过环境变量区分，例如：VITE_APP_DOMAIN=inner-book.top npm run build
const base = process.env.VITE_BASE ?? (
  process.env.VITE_APP_DOMAIN === 'inner-book.top' ? '/' : '/inner-book/'
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
