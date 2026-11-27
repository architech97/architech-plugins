import { readFileSync } from 'node:fs'
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
        PRODUCTS: {
          slug: string
          demo?: string
          dialogs: { dark: [string, number, number, 0 | 1] }[]
        }[]
      }>('/src/data/catalog.ts', { root })
      const { module: metaCheck } = await runnerImport<{
        assertSiteMeta: () => void
        assertUniqueMeta: (routes: string[]) => void
        publishedStats: () => unknown
      }>('/src/data/siteMetaCheck.ts', { root })
      const { module: metaModule } = await runnerImport<{
        pageMeta: (route: string) => { title: string; description: string }
      }>('/src/data/pageMeta.ts', { root })
      const { module: images } = await runnerImport<{
        imagePreload: (image: [string, number, number, 0 | 1], slot?: number, sizes?: string) => { href: string; srcSet?: string; sizes?: string }
        leadShot: (dialogs: { dark: [string, number, number, 0 | 1]; real?: 1 }[]) => { dark: [string, number, number, 0 | 1] } | undefined
        thumbProps: (image: [string, number, number, 0 | 1]) => { src: string }
      }>('/src/components/dialogImage.ts', { root })
      metaCheck.assertSiteMeta()
      const { PRODUCTS, HERO_SIZES } = catalog
      const { pageMeta } = metaModule
      const hero = JSON.parse(readFileSync(new URL('./src/data/hero.generated.json', import.meta.url), 'utf8')) as { dark: [string, number, number, 0 | 1] }

      const legacyRedirects = new Map<string, string>([
        ['pricing', 'connect'],
        ['custom-development', 'connect'],
      ])
      const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
      const link = (preload: { href: string; srcSet?: string; sizes?: string } | undefined) => {
        if (!preload) return ''
        const srcSet = preload.srcSet ? ` imagesrcset="${preload.srcSet}"` : ''
        const sizes = preload.sizes ? ` imagesizes="${preload.sizes}"` : ''
        return `<link rel="preload" as="image" fetchpriority="high" href="${preload.href}"${srcSet}${sizes} />`
      }
      const productBySlug = (slug: string) => PRODUCTS.find((product) => product.slug === slug)
      const productByDemo = (demo: string) => PRODUCTS.find((product) => product.demo === demo)
      const preloadFor = (route: string) => {
        if (!route) return link(images.imagePreload(hero.dark, 420, HERO_SIZES))
        if (route === 'demos') {
          const product = productBySlug('room-to-finishes') ?? PRODUCTS.find((item) => item.dialogs.length)
          return product ? link({ href: images.thumbProps(product.dialogs[0].dark).src }) : ''
        }
        const plugin = route.startsWith('plugins/') ? productBySlug(route.slice('plugins/'.length)) : undefined
        const demo = route.startsWith('demos/') ? productByDemo(route.slice('demos/'.length)) : undefined
        const shot = images.leadShot((plugin ?? demo)?.dialogs ?? [])
        return shot ? link(images.imagePreload(shot.dark)) : ''
      }

      const routes = new Set(['demos', 'plugins', 'connect', 'coverage', 'pricing', 'custom-development'])
      for (const product of PRODUCTS) {
        routes.add(`plugins/${product.slug}`)
        if (product.demo) routes.add(`demos/${product.demo}`)
      }
      metaCheck.assertUniqueMeta(['', ...routes])
      this.emitFile({ type: 'asset', fileName: 'stats.json', source: JSON.stringify(metaCheck.publishedStats(), null, 2) + '\n' })

      const template = String(shell.source)
      const page = (route = '') => {
        const canonicalRoute = legacyRedirects.get(route) ?? route
        const canonical = SITE_ORIGIN + AUTOMATION_PATH + (canonicalRoute ? canonicalRoute + '/' : '')
        const ogImage = SITE_ORIGIN + AUTOMATION_PATH + (route ? `og/${route}.png` : 'og/home.png')
        const html = base === AUTOMATION_PATH
          ? template.replace(/\s*<meta name="robots" content="noindex, nofollow" \/>/, '')
          : template
        const info = pageMeta(route)
        const titled = html
          .replace(/<title>[^<]*<\/title>/, () => `<title>${escape(info.title)}</title>`)
          .replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*"/g, (_, tag) => tag + escape(info.description) + '"')
          .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"/g, (_, tag) => tag + escape(info.title) + '"')
          .replace(/(<meta property="og:image:alt" content=")[^"]*"/, (_, tag) => tag + escape(info.description) + '"')
          .replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*"/g, (_, tag) => tag + ogImage + '"')
        const indexed = legacyRedirects.has(route)
          ? titled.replace('</head>', '  <meta name="robots" content="noindex, follow" />\n  </head>')
          : titled
        const withHead = indexed
          .replace(/(<meta property="og:url" content=")[^"]*"/, (_, tag) => tag + canonical + '"')
          .replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />', `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    ${preloadFor(route)}`)
          .replace('</head>', `    <link rel="canonical" href="${canonical}" />\n  </head>`)
        const sources: string[] = []
        const moved = withHead
          .replace(/\n?\s*<link rel="modulepreload"[^>]*>/g, '')
          .replace(/\n?\s*<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src: string) => {
            sources.push(src)
            return ''
          })
        // The module is the page's behaviour. Painting uses the prerendered HTML and CSS.
        // A 500 kB script discovered during parse shares the slow connection with that
        // CSS, so the first text waits. Start the script once the largest paint has settled.
        const boot = sources.length
          ? `<script>(function(){var srcs=${JSON.stringify(sources)};var started=false;function boot(){if(started)return;started=true;srcs.forEach(function(src){var s=document.createElement("script");s.type="module";s.fetchPriority="low";s.src=src;document.body.appendChild(s)})}var last=0;function arm(){if(started)return;if(!last||performance.now()-last<150){setTimeout(arm,160);return}boot()}try{new PerformanceObserver(function(){last=performance.now();setTimeout(arm,160)}).observe({type:"largest-contentful-paint",buffered:true})}catch(e){}addEventListener("load",function(){setTimeout(arm,160)});setTimeout(boot,4000)})()</script>\n`
          : ''
        return boot ? moved.replace('</body>', `${boot}</body>`) : moved
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
    modulePreload: false,
  },
})
