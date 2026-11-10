import generated from './tools.generated.json'
import reconstructed from './dialogReconstructions.json'
import { EXTRAS } from './extras'
import { PROBLEMS } from './problems'
import type { DialogShot, Product } from './types'

/** Interactive demos available today, by tool key. More are added through src/demo/registry.ts. */
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

const reconstructedDialogs = reconstructed as Record<string, DialogShot[]>

const tools: Product[] = (generated as Omit<Product, 'status'>[]).map((t) => ({
  ...t,
  dialogs: [...t.dialogs, ...(reconstructedDialogs[t.slug] ?? [])],
  tagline: TAGLINES[t.key] ?? t.tagline,
  status: 'available',
  problem: PROBLEMS[t.key],
  demo: DEMO_BY_KEY[t.key] ?? t.slug,   // every tool has a live demo: hand-built, or generated from its dialog
  platform: 'Windows · Autodesk Revit',
}))

const SUITE_ORDER = ['folio', 'forge', 'sentinel', 'i3d', 'ai']

export const PRODUCTS: Product[] = [...tools, ...EXTRAS.map((e) => ({ ...e, demo: e.slug }))].sort(
  (a, b) => SUITE_ORDER.indexOf(a.suite) - SUITE_ORDER.indexOf(b.suite) || a.panel.localeCompare(b.panel) || a.name.localeCompare(b.name),
)

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug)
export const productByDemo = (demo: string) => PRODUCTS.find((p) => p.demo === demo)

export const STATS = {
  products: PRODUCTS.length,
  revitTools: tools.length,
  dialogs: tools.reduce((n, t) => n + t.dialogs.length, 0),
  demos: tools.length + EXTRAS.length,
  crafted: Object.keys(DEMO_BY_KEY).length,
  softwares: new Set(PRODUCTS.flatMap((p) => p.software)).size,
}

/** Short search text for one product. */
export const searchText = (p: Product) =>
  [p.name, p.panel, p.tagline, p.description, p.software.join(' '), p.suite].join(' ').toLowerCase()
