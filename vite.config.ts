import { defineConfig, runnerImport, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Staging is served from https://<user>.github.io/architech-plugins/ ; a custom domain later sets BASE=/.
const base = process.env.BASE ?? '/architech-plugins/'

const staticRoutes: Plugin = {
  name: 'architech-static-routes',
  apply: 'build',
  generateBundle: {
    order: 'post',
    async handler(_options, bundle) {
      const shell = bundle['index.html']
      if (shell?.type !== 'asset') this.error('The built page shell is missing.')

      const { module: { PRODUCTS } } = await runnerImport<{
        PRODUCTS: { slug: string; demo?: string }[]
      }>('/src/data/catalog.ts', { root: this.environment.config.root })

      const routes = new Set(['demos', 'plugins', 'pricing', 'custom-development'])
      for (const product of PRODUCTS) {
        routes.add(`plugins/${product.slug}`)
        if (product.demo) routes.add(`demos/${product.demo}`)
      }

      // GitHub Pages serves these directory indexes with a successful response on direct visits.
      for (const route of routes) {
        this.emitFile({ type: 'asset', fileName: `${route}/index.html`, source: shell.source })
      }
    },
  },
}

export default defineConfig({
  base,
  plugins: [react(), staticRoutes],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
  },
})
