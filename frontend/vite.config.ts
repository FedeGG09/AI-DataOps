import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite se compila en local y en Cloudflare con el mismo código.
 * Cloudflare aporta CF_PAGES_COMMIT_SHA y CF_PAGES_BRANCH durante el build.
 * No contiene claves: en Pages la Function usa bindings seguros, en Vite proxy local.
 */
const commit = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || 'local'
const branch = process.env.CF_PAGES_BRANCH || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'local'
const platform = process.env.CF_PAGES === '1' ? 'Cloudflare Pages' : process.env.GITHUB_ACTIONS === 'true' ? 'GitHub Actions' : 'Desarrollo local'

export default defineConfig({
  plugins: [react()],
  define: {
    __GUARDIAN_COMMIT__: JSON.stringify(commit),
    __GUARDIAN_BRANCH__: JSON.stringify(branch),
    __GUARDIAN_PLATFORM__: JSON.stringify(platform),
  },
  // Proxy sólo para npm run dev. Pages utiliza frontend/functions/api/[[path]].js.
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
})
