import type { Product } from './types'

const revit = {
  software: ['Revit'],
  revit: ['2024'],
  platform: 'Windows, Autodesk Revit',
  status: 'available',
} satisfies Pick<Product, 'software' | 'revit' | 'platform' | 'status'>

const homes = [
  { suite: 'folio', slug: 'folio-home', name: 'Folio Home', key: 'FolioHome', tagline: 'Documentation and publishing tools for Revit.' },
  { suite: 'forge', slug: 'forge-home', name: 'Forge Home', key: 'ForgeHome', tagline: 'Rooms, finishes and BIM data tools for Revit.' },
  { suite: 'sentinel', slug: 'sentinel-home', name: 'Sentinel Home', key: 'SentinelHome', tagline: 'Model health, coordination and BIM standards tools.' },
] as const

export const RIBBON_PRODUCTS: Omit<Product, 'dialogs'>[] = [
  ...homes.map((home) => ({
    ...revit,
    ...home,
    panel: 'Start',
    description: 'Search the suite by name or task, browse ribbon panels, preview a tool, and open it when the active Revit context allows it.',
    capabilities: ['Browse the suite by ribbon panel.', 'Search by tool name or workflow.', 'Review the selected tool and its availability.'],
    safeguards: ['Tool availability depends on the active Revit document and command context.'],
    problem: 'Find the right command when several tools share a ribbon tab.',
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
