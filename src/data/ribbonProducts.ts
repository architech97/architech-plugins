import type { Product } from './types'

const revit = {
  software: ['Revit'],
  revit: ['2024'],
  platform: 'Windows, Autodesk Revit',
  status: 'available',
} satisfies Pick<Product, 'software' | 'revit' | 'platform' | 'status'>

// Each suite's own Home window: search, browse by panel, preview, open. The search examples are the window's own placeholder text.
const homes = [
  {
    suite: 'folio', slug: 'folio-home', name: 'Folio Home', key: 'FolioHome',
    tagline: 'The documentation suite: views, sheets, viewports, annotation, dimensions and publishing, from one searchable home.',
    problem: 'A drawing set means the same actions repeated across many views and sheets. Folio turns each of those repeats into one tool.',
    area: 'views, sheets, annotation and publishing',
  },
  {
    suite: 'forge', slug: 'forge-home', name: 'Forge Home', key: 'ForgeHome',
    tagline: 'The modelling and data suite: rooms, finishes, parameters and Scan-to-BIM, from one searchable home.',
    problem: 'Finishes, room data and parameters are slow to build and hard to keep consistent by hand, element by element.',
    area: 'rooms, finishes, parameters and Scan-to-BIM',
    search: 'ceiling or point cloud',
  },
  {
    suite: 'sentinel', slug: 'sentinel-home', name: 'Sentinel Home', key: 'SentinelHome',
    tagline: 'The model-health suite: warnings, standards, links and clean-up, from one searchable home.',
    problem: 'A model gets slower and harder to trust as warnings, duplicates and unused content build up unseen.',
    area: 'model health, coordination, links, standards and clean-up',
    search: 'warnings or worksets',
  },
] as const

export const RIBBON_PRODUCTS: Omit<Product, 'dialogs'>[] = [
  ...homes.map(({ area, ...home }) => ({
    ...revit,
    ...home,
    panel: 'Start',
    description: `Every tool in the suite for ${area}, in one window: search by name or task, browse by ribbon panel, preview a tool, and open it.`,
    capabilities: [
      'search' in home ? `Search by tool name or task, for example ${home.search}.` : 'Search by tool name or task.',
      'Browse the suite by its ribbon panels, with a tool count for each.',
      'Preview what a tool does before opening it.',
      'Shows the open model and Revit version, in a dark or light theme.',
    ],
    safeguards: ['A tool opens only when the active Revit document and view allow it.'],
  })),
  {
    ...revit,
    slug: 'point-cloud-on-off',
    key: 'PointCloudVisibility',
    name: 'Point Cloud On/Off',
    suite: 'forge',
    panel: 'Scan to BIM',
    tagline: 'Toggle point-cloud visibility in the active Revit view.',
    description: 'Open the Point Cloud Tools split button and toggle the Point Clouds category in the active view. Revit records the change as one undoable transaction.',
    capabilities: ['Toggle point clouds in the current view.', 'Restore the previous visibility with Undo.'],
    safeguards: ['A controlling view template or an unsupported view can block the change.'],
    problem: 'Clear the scan from a working view temporarily while modelling or checking documentation.',
  },
]
