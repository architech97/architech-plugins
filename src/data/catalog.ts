import generated from './tools.generated.json'
import dialogData from './dialogs.generated.json'
import { EXTRAS } from './extras'
import { PROBLEMS } from './problems'
import { RIBBON_PRODUCTS } from './ribbonProducts'
import type { DialogShot, Product } from './types'

/** Dialog page addresses that differ from the product slug (kept so existing links keep working). */
export const DEMO_BY_KEY: Record<string, string> = {
  DocSheetManager: 'sheet-manager',
  WarningsInspector: 'warnings-inspector',
  PurgeMerge: 'purge-merge',
  RoomFinishes: 'room-to-finishes',
  OneParameter: 'one-parameter',
  RoomViews: 'room-to-view',
  ModelChecker: 'model-health',
}

// Where a ribbon tooltip is older than the dialog, the dialog's own subtitle is used.
const TAGLINES: Record<string, string> = {
  RoomViews: 'Plans, a 3D view and elevations for every ticked room, then place them on sheets.',
}

/** Real dialog images by product slug, and the inventory dialogs that could not be shown, straight from the inventory. */
const DIALOGS = dialogData.tools as unknown as Record<string, DialogShot[]>
export const NOT_SHOWN = dialogData.skipped as { id: string; slug: string; title: string; why: string }[]

/** A product gets a dialog page only when it has real dialog images. */
const withDialogs = <T extends Omit<Product, 'dialogs' | 'demo'>>(p: T, demo: string) => {
  const dialogs = DIALOGS[p.slug] ?? []
  return { ...p, dialogs, demo: dialogs.length ? demo : undefined }
}

const tools: Product[] = (generated as Omit<Product, 'status' | 'dialogs'>[]).map((t) => withDialogs({
  ...t,
  tagline: TAGLINES[t.key] ?? t.tagline,
  status: 'available' as const,
  problem: PROBLEMS[t.key],
  platform: 'Windows, Autodesk Revit',
}, DEMO_BY_KEY[t.key] ?? t.slug))

const SUITE_ORDER = ['folio', 'forge', 'sentinel', 'i3d', 'ai']

export const PRODUCTS: Product[] = [...tools, ...[...RIBBON_PRODUCTS, ...EXTRAS].map((p) => withDialogs(p, p.slug))].sort(
  (a, b) => SUITE_ORDER.indexOf(a.suite) - SUITE_ORDER.indexOf(b.suite) || a.panel.localeCompare(b.panel) || a.name.localeCompare(b.name),
)

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug)
export const productByDemo = (demo: string) => PRODUCTS.find((p) => p.demo === demo)

/** The Revit add-ins themselves, from the registry. Suite launchers, the point-cloud toggle and desktop apps are not counted. */
export const REVIT_TOOLS = tools

const shown = PRODUCTS.flatMap((p) => p.dialogs)

/** One number story, counted from the images on the site. Suite counts sum to `revitTools`. */
export const STATS = {
  products: PRODUCTS.length,
  revitTools: tools.length,
  suiteTools: (suite: string) => tools.filter((t) => t.suite === suite).length,
  /** Distinct dialogs shown; a dialog pictured in several states counts once. */
  dialogs: new Set(shown.map((d) => d.id)).size,
  /** Pictures shown: every dialog state, counted once whatever its themes. */
  views: shown.length,
  screenshots: shown.filter((d) => d.real).length,
  light: shown.filter((d) => d.light).length,
  demos: PRODUCTS.filter((product) => product.demo).length,
  softwares: new Set(PRODUCTS.flatMap((p) => p.software)).size,
}

export { HERO_SIZES } from './featured'

/** Short search text for one product. */
export const searchText = (p: Product) =>
  [p.name, p.panel, p.tagline, p.description, p.software.join(' '), p.suite].join(' ').toLowerCase()
