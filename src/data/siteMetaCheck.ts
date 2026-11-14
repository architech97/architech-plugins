import counts from './counts.generated.json'
import pages from './pageIndex.generated.json'
import { PRODUCTS, STATS } from './catalog'
import { pageMeta } from './pageMeta'

type PageRecord = { slug: string; name: string; tagline: string; demo: string | null; windows: number }

/** The JSON the pages import has to match the catalogue, or the build stops. */
export function assertSiteMeta() {
  const problems: string[] = []
  const expect: [number, number, string][] = [
    [counts.products, STATS.products, 'products'],
    [counts.revitTools, STATS.revitTools, 'revitTools'],
    [counts.suiteHomes, STATS.suiteHomes, 'suiteHomes'],
    [counts.utilities, STATS.utilities, 'utilities'],
    [counts.desktopApps, STATS.desktopApps, 'desktopApps'],
    [counts.connectors, STATS.connectors, 'connectors'],
  ]
  for (const [published, actual, label] of expect) {
    if (published !== actual) problems.push(`${label} is ${published} in counts.generated.json and ${actual} in the catalogue`)
  }
  const records = pages as PageRecord[]
  if (records.length !== PRODUCTS.length) problems.push(`page index has ${records.length} rows and the catalogue has ${PRODUCTS.length}`)
  const bySlug = new Map(records.map((page) => [page.slug, page]))
  for (const product of PRODUCTS) {
    const page = bySlug.get(product.slug)
    if (!page) {
      problems.push(`missing ${product.slug}`)
      continue
    }
    if (page.name !== product.name || page.tagline !== product.tagline || (page.demo ?? undefined) !== product.demo || page.windows !== product.dialogs.length) {
      problems.push(`stale ${product.slug}`)
    }
  }
  if (problems.length) {
    throw new Error('Published site meta does not match the catalogue: ' + problems.join('; ') + '. Run node scripts/export-site-meta.mjs')
  }
}

/** Counts the parent site can read at /automation/stats.json. */
export function publishedStats() {
  return {
    products: STATS.products,
    revitTools: STATS.revitTools,
    suiteHomes: STATS.suiteHomes,
    utilities: STATS.utilities,
    desktopApps: STATS.desktopApps,
    connectors: STATS.connectors,
    dialogs: STATS.dialogs,
    views: STATS.views,
    demos: STATS.demos,
    productsWithoutDialogs: PRODUCTS.filter((product) => product.dialogs.length === 0).map((product) => ({
      slug: product.slug,
      name: product.name,
    })),
  }
}

/** Every built route gets a title and a description that no other route uses. */
export function assertUniqueMeta(routes: string[]) {
  const titles = new Map<string, string>()
  const descriptions = new Map<string, string>()
  for (const route of routes) {
    const meta = pageMeta(route)
    const previousTitle = titles.get(meta.title)
    if (previousTitle !== undefined) throw new Error(`Duplicate title "${meta.title}" on ${route} and ${previousTitle}`)
    titles.set(meta.title, route)
    const previousDescription = descriptions.get(meta.description)
    if (previousDescription !== undefined) throw new Error(`Duplicate description on ${route} and ${previousDescription}`)
    descriptions.set(meta.description, route)
  }
}
