import { defineConfig, runnerImport, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { AUTOMATION_PATH, SITE_ORIGIN } from './src/data/contact.ts'

// The GitHub Pages preview uses its repository base. The unified site mounts Automation at /automation/.
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

      const template = String(shell.source)
      const page = (route = '') => {
        const canonical = SITE_ORIGIN + AUTOMATION_PATH + (route ? route + '/' : '')
        const html = base === AUTOMATION_PATH
          ? template.replace(/\s*<meta name="robots" content="noindex, nofollow" \/>/, '')
          : template
        return html.replace('</head>', `  <link rel="canonical" href="${canonical}" />\n  </head>`)
      }

      // GitHub Pages serves these directory indexes with a successful response on direct visits.
      shell.source = page()
      for (const route of routes) {
        this.emitFile({ type: 'asset', fileName: `${route}/index.html`, source: page(route) })
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
