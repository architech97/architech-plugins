/** The one wording for catalogue counts. Pages, meta tags and stats.json all use these strings. */
export interface CatalogueCounts {
  products: number
  revitTools: number
  suiteHomes: number
  utilities: number
  desktopApps: number
  connectors: number
}

export function catalogueSentence(counts: CatalogueCounts) {
  const utility = counts.utilities === 1 ? '1 ribbon utility' : `${counts.utilities} ribbon utilities`
  return `${counts.products} products: ${counts.revitTools} Revit add-ins, ${counts.suiteHomes} suite homes, ${utility}, ${counts.desktopApps} desktop apps and ${counts.connectors} connectors`
}

export function browseAllLabel(products: number) {
  return `Browse all ${products} products`
}

/** Hosts or names of products that have no dialog picture yet. */
export function awaitingDialogSentence(labels: readonly string[], connectors: boolean) {
  if (!labels.length) return ''
  const list = labels.length === 1 ? labels[0]
    : labels.length === 2 ? `${labels[0]} and ${labels[1]}`
    : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
  return connectors
    ? `Dialog pictures for the ${list} connectors are still to come.`
    : `Dialog pictures for ${list} are still to come.`
}

/** What each published number means. Home reads this from /automation/stats.json. */
export const COUNT_DEFINITIONS = {
  products: 'Every catalogue entry. The five groups below add up to this number.',
  revitTools: 'Revit add-ins on the Arch Folio, Arch Forge and Arch Sentinel ribbons. Suite home windows, the point-cloud toggle, desktop apps and connectors are not included.',
  suiteHomes: 'The Folio Home, Forge Home and Sentinel Home windows.',
  utilities: 'Ribbon utilities that are not add-ins. Currently the Point Cloud On/Off toggle.',
  desktopApps: 'Desktop applications: ArchiTECH I3D and ArchiTECH Assistant.',
  connectors: 'MCP connectors for Revit, Rhino, SketchUp, AutoCAD and Blender.',
  productsWithDialogs: 'Products with at least one real dialog picture on the site.',
  galleryPages: 'Dialog gallery pages. One per product that has dialog pictures. This is not a count of browser demos.',
  demos: 'Same number as galleryPages. Kept so existing readers of stats.json keep working. It counts products with a dialog gallery, not browser demos.',
  browserDemos: 'Browser demos you can use on the product page: I3D, the Assistant and the Revit MCP Connector.',
  dialogs: 'Distinct dialogs shown. A dialog pictured in several states counts once.',
  views: 'Pictures shown. Every dialog state counts once, whatever its theme.',
  screenshots: 'Pictures that are screenshots of the installed build. The other pictures are renders of the product’s own window code with sample data.',
} as const
