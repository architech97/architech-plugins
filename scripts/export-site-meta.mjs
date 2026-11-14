// Rewrites the tiny JSON the pages import, from the live catalogue.
// Run after a product, name or tagline change: node scripts/export-site-meta.mjs
import { createServer } from 'vite'
import { writeFileSync } from 'node:fs'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { PRODUCTS, STATS } = await server.ssrLoadModule('/src/data/catalog.ts')
  const counts = {
    products: STATS.products,
    revitTools: STATS.revitTools,
    suiteHomes: STATS.suiteHomes,
    utilities: STATS.utilities,
    desktopApps: STATS.desktopApps,
    connectors: STATS.connectors,
  }
  const pages = PRODUCTS.map((product) => ({
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    demo: product.demo ?? null,
    windows: product.dialogs.length,
  }))
  const json = (value) => JSON.stringify(value, null, 2) + '\n'
  writeFileSync(new URL('../src/data/counts.generated.json', import.meta.url), json(counts))
  writeFileSync(new URL('../src/data/pageIndex.generated.json', import.meta.url), json(pages))
  console.log(`wrote ${pages.length} pages, ${counts.products} products`)
} finally {
  await server.close()
}
