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

      const { module: { PRODUCTS, STATS, HERO_SIZES } } = await runnerImport<{
        HERO_SIZES: string
        PRODUCTS: { slug: string; demo?: string; name: string; tagline: string; dialogs: { dark: [string, number, number, number] }[] }[]
        STATS: { revitTools: number; dialogs: number }
      }>('/src/data/catalog.ts', { root: this.environment.config.root })

      // Each route gets its own title and description, so crawlers and link previews see the page, not the shell.
      const suffix = ' | Navneet Singh · ArchiTECH'
      const meta = new Map<string, { title: string; description: string }>([
        ['demos', { title: 'Dialog library' + suffix, description: `${STATS.dialogs} dialogs of ${STATS.revitTools} Revit tools by Navneet Singh and the ArchiTECH desktop apps, as built, grouped by job.` }],
        ['plugins', { title: 'Plugins' + suffix, description: `The ${STATS.revitTools} Revit tools in Arch Folio, Arch Forge and Arch Sentinel, with ArchiTECH I3D, ArchiTECH Assistant and the ArchiTECH MCP Connector.` }],
        ['connect', { title: 'Get in touch' + suffix, description: 'Tell me about a repetitive BIM task, ask how one of these tools works, or suggest an improvement.' }],
        ['coverage', { title: 'How the pictures were made' + suffix, description: `Every one of the ${STATS.dialogs} dialogs pictured on this site, what each picture is, and what is not shown.` }],
        ['pricing', { title: 'Discuss a tool' + suffix, description: 'Pricing depends on the tool, host application and deployment scope. This legacy route continues to the workflow contact page.' }],
        ['custom-development', { title: 'Discuss a custom workflow' + suffix, description: 'Describe a repetitive BIM task or integration requirement. This legacy route continues to the workflow contact page.' }],
      ])
      const legacyRedirects = new Map<string, string>([
        ['pricing', 'connect'],
        ['custom-development', 'connect'],
      ])
      for (const product of PRODUCTS) {
        meta.set(`plugins/${product.slug}`, { title: product.name + suffix, description: product.tagline })
        if (product.demo) meta.set(`demos/${product.demo}`, { title: product.name + ' dialogs' + suffix, description: `The dialogs of ${product.name}, as built. ${product.tagline}` })
      }
      const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

      const routes = new Set(['demos', 'plugins', 'connect', 'coverage', 'pricing', 'custom-development'])
      for (const product of PRODUCTS) {
        routes.add(`plugins/${product.slug}`)
        if (product.demo) routes.add(`demos/${product.demo}`)
      }

      const template = String(shell.source)
      // The home page's largest picture is drawn by script; preloading it lets it arrive with the script, not after it.
      const [heroSrc, heroWidth] = PRODUCTS.find((product) => product.slug === 'sheet-export')!.dialogs[0].dark
      const heroPreload = `  <link rel="preload" as="image" fetchpriority="high" href="${base + heroSrc}" imagesrcset="${base + heroSrc.replace('.webp', '-720.webp')} 720w, ${base + heroSrc} ${heroWidth}w" imagesizes="${HERO_SIZES}" />\n`
      const page = (route = '') => {
        const canonicalRoute = legacyRedirects.get(route) ?? route
        const canonical = SITE_ORIGIN + AUTOMATION_PATH + (canonicalRoute ? canonicalRoute + '/' : '')
        const html = base === AUTOMATION_PATH
          ? template.replace(/\s*<meta name="robots" content="noindex, nofollow" \/>/, '')
          : template
        const info = meta.get(route)
        const titled = !info ? html : html
          .replace(/<title>[^<]*<\/title>/, () => `<title>${escape(info.title)}</title>`)
          .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*"/g, (_, tag) => tag + escape(info.description) + '"')
          .replace(/(<meta property="og:title" content=")[^"]*"/, (_, tag) => tag + escape(info.title) + '"')
        const indexed = legacyRedirects.has(route)
          ? titled.replace('</head>', '  <meta name="robots" content="noindex, follow" />\n  </head>')
          : titled
        return indexed
          .replace(/(<meta property="og:url" content=")[^"]*"/, (_, tag) => tag + canonical + '"')
          .replace('</head>', `  <link rel="canonical" href="${canonical}" />\n${route ? '' : heroPreload}  </head>`)
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
