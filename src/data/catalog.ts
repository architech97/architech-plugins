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
  FamilyNameEditor: 'Audit and rename loadable family names against the naming convention in the BIM execution plan (BEP).',
  WorksetManager: 'Bulk-assign elements to worksets using the prefix and category rules in the BIM execution plan.',
  TemplateManager: 'Transfer view templates, view filters, Visibility/Graphics and hidden elements, and turn imported CAD off, from one window.',
  ModelQueryPro: 'Query model data, or open Review Center for a scoped review of warnings, rooms and furniture (FF&E).',
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

/** House style for the tools' own text: UK spelling, en dashes, no shouted labels, no unexplained abbreviations. */
const SENTENCE_LABEL = /(^|: )([A-Z][A-Z/&]*(?: [A-Z/&]+){0,4}):(?= )/g
export function copyEdit(text: string) {
  return text
    .replace(SENTENCE_LABEL, (_, lead: string, label: string) => lead + label.charAt(0) + label.slice(1).toLowerCase().replace(/^\/g\b/, '/G') + ':')
    .replace(/ - /g, ' – ')
    .replace(/\bincl\. /g, 'including ')
    .replace(/\bcustomizable\b/g, 'adjustable')
    .replace(/\bColorize model elements\b/g, 'Colour model elements')
    .replace(/\bKEEPS\b/g, 'keeps')
    .replace(/(?<!Keep )\bcolors\b/g, 'colours')
}
const tidy = (line: string) => { const s = copyEdit(line.trim()); return /[.!?)]$/.test(s) ? s : s + '.' }
const edited = <T extends { tagline: string; description: string; capabilities: string[]; safeguards: string[] }>(p: T): T =>
  ({ ...p, tagline: tidy(p.tagline), description: copyEdit(p.description), capabilities: p.capabilities.map(copyEdit), safeguards: p.safeguards.map(copyEdit) })

const tools: Product[] = (generated as Omit<Product, 'status' | 'dialogs'>[]).map(edited).map((t) => withDialogs({
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
