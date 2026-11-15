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

      const root = this.environment.config.root
      const { module: catalog } = await runnerImport<{
        HERO_SIZES: string
        PRODUCTS: { slug: string; demo?: string; dialogs: { dark: [string, number, number, number] }[] }[]
        STATS: { revitTools: number }
      }>('/src/data/catalog.ts', { root })
      const { module: metaCheck } = await runnerImport<{
        assertSiteMeta: () => void
        assertUniqueMeta: (routes: string[]) => void
        publishedStats: () => { revitTools: number }
      }>('/src/data/siteMetaCheck.ts', { root })
      const { module: metaModule } = await runnerImport<{
        pageMeta: (route: string) => { title: string; description: string }
      }>('/src/data/pageMeta.ts', { root })
      metaCheck.assertSiteMeta()
      const { PRODUCTS, HERO_SIZES } = catalog
      const { pageMeta } = metaModule

      const legacyRedirects = new Map<string, string>([
        ['pricing', 'connect'],
        ['custom-development', 'connect'],
      ])
      const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

      const routes = new Set(['demos', 'plugins', 'connect', 'coverage', 'pricing', 'custom-development'])
      for (const product of PRODUCTS) {
        routes.add(`plugins/${product.slug}`)
        if (product.demo) routes.add(`demos/${product.demo}`)
      }
      metaCheck.assertUniqueMeta(['', ...routes])
      this.emitFile({ type: 'asset', fileName: 'stats.json', source: JSON.stringify(metaCheck.publishedStats(), null, 2) + '\n' })

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
        const info = pageMeta(route)
        const titled = html
          .replace(/<title>[^<]*<\/title>/, () => `<title>${escape(info.title)}</title>`)
          .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*"/g, (_, tag) => tag + escape(info.description) + '"')
          .replace(/(<meta property="og:title" content=")[^"]*"/, (_, tag) => tag + escape(info.title) + '"')
          .replace(/(<meta property="og:image:alt" content=")[^"]*"/, (_, tag) => tag + escape(`Tools that finish the drawing set: ${metaCheck.publishedStats().revitTools} Revit add-ins by Navneet Singh.`) + '"')
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
