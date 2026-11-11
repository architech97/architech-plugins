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

      const { module: { PRODUCTS, STATS } } = await runnerImport<{
        PRODUCTS: { slug: string; demo?: string; name: string; tagline: string }[]
        STATS: { revitTools: number; dialogs: number }
      }>('/src/data/catalog.ts', { root: this.environment.config.root })

      // Each route gets its own title and description, so crawlers and link previews see the page, not the shell.
      const suffix = ' · ArchiTECH Automation'
      const meta = new Map<string, { title: string; description: string }>([
        ['demos', { title: 'Demo library' + suffix, description: `Browser walkthroughs of ${STATS.revitTools} Revit tools by Navneet Singh, grouped by job. Sample data; nothing is sent or saved.` }],
        ['plugins', { title: 'Plugins' + suffix, description: `The ${STATS.revitTools} Revit tools in Arch Folio, Arch Forge and Arch Sentinel, with ArchiTECH I3D, ArchiTECH Assistant and the ArchiTECH MCP Connector.` }],
        ['connect', { title: 'Discuss a workflow' + suffix, description: 'Tell me about a repetitive BIM task, ask how one of these tools works, or suggest an improvement.' }],
        ['coverage', { title: 'Dialog coverage' + suffix, description: `What each walkthrough covers across ${STATS.dialogs} dialogs, what it is based on, and what is not simulated yet.` }],
      ])
      for (const product of PRODUCTS) {
        meta.set(`plugins/${product.slug}`, { title: product.name + suffix, description: product.tagline })
        if (product.demo) meta.set(`demos/${product.demo}`, { title: product.name + ' walkthrough' + suffix, description: `Try ${product.name} in your browser on sample data. ${product.tagline}` })
      }
      const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

      const routes = new Set(['demos', 'plugins', 'connect', 'coverage', 'pricing', 'custom-development'])
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
        const info = meta.get(route)
        const titled = !info ? html : html
          .replace(/<title>[^<]*<\/title>/, () => `<title>${escape(info.title)}</title>`)
          .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*"/g, (_, tag) => tag + escape(info.description) + '"')
          .replace(/(<meta property="og:title" content=")[^"]*"/, (_, tag) => tag + escape(info.title) + '"')
        return titled
          .replace(/(<meta property="og:url" content=")[^"]*"/, (_, tag) => tag + canonical + '"')
          .replace('</head>', `  <link rel="canonical" href="${canonical}" />\n  </head>`)
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
