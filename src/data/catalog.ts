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

// One plain, outcome-first line per tool. Each restates the tool's own shipped description; nothing is added.
const TAGLINES: Record<string, string> = {
  // Sentinel
  ComplianceGuard: 'Find CAD-style lines, unpinned grids, levels and links, and content left on Workset1, then clean them up after review.',
  GroupManager: 'Dissolve detail and model groups in bulk, keeping every member element.',
  OffAxis: 'Find elements that drifted a fraction of a degree off orthogonal, and straighten them in one undoable step.',
  PurgeMerge: 'Purge unused materials, patterns, filters and templates, or merge the duplicates that CAD imports leave behind.',
  CoordPlan: 'Build a clean coordination floor plan in one step: grids, levels, base points and links shown, imports and annotation hidden.',
  NavisView: 'Set up the Navisworks export view the same way every time, or a batch of them by workset or category.',
  ScopeBoxSync: 'Keep scope boxes in step with the master link model, and move every dependent view with them.',
  SectionBox: 'Crop a 3D view tightly around the selected elements, with the padding you choose.',
  PinUnpinLinks: 'Pin every Revit link and CAD import in bulk, so nothing gets dragged out of place by accident.',
  InPlaceConverter: 'Save in-place solids as reusable Generic Model families, keeping the originals.',
  InPlaceInspector: 'Find the in-place families that cost sync time, then isolate, convert or delete them.',
  MirroredAuditor: 'Find mirrored doors, windows and equipment, tell valid flips from true mirroring, and resolve them.',
  ModelChecker: 'Check the model against the rules you choose and review it in a searchable HTML dashboard.',
  StructuralQA: 'Screen columns against their grids and beam ends against their supports, within 5 mm.',
  FamilyNameEditor: 'Audit and rename loadable family names against the naming convention in the BIM execution plan (BEP).',
  FilterUsageChecker: 'See where every view filter is used, find the unused ones, and add or remove filters across views and templates.',
  ModelQueryPro: 'Query model data, or open Review Center for a scoped review of warnings, rooms and furniture (FF&E).',
  ParameterColorizer: 'Colour elements by any parameter value to spot gaps and errors at a glance.',
  WorksetManager: 'Bulk-assign elements to worksets using the prefix and category rules in the BIM execution plan.',
  // Forge
  SplitFloorCeiling: 'Split a floor or ceiling drawn as several regions into separate elements, keeping their parameters.',
  AssignRoomProperties: 'Write room data onto every element inside each room, from this model or a linked one.',
  FamilyParamTransfer: 'Copy parameter definitions from one family to another, keeping shared-parameter GUIDs.',
  OneParameter: "Find and replace, prefix or suffix one parameter's values across the model, with a preview first.",
  ParameterManager: 'Create, edit and bind project parameters, set formulas, and round-trip them through Excel.',
  SharedParamManager: 'Edit shared-parameter files and bind their definitions to model categories, in one window.',
  MatchOpening: 'Match wall openings to a structural or architectural link: preview the matches, then create or resize them.',
  RoomLevelAssigner: 'Move rooms to another level, keeping their number, name, parameters and position.',
  DeviationInspector: 'Measure how far walls and columns sit from the point cloud, and colour them by deviation.',
  // Folio
  ManageText: 'Change case, find and replace, merge, align and re-type text notes across the whole model.',
  ReorderPro: 'Renumber elements in the order you choose, with a preview before a single value is written.',
  SpellCheck: 'Check spelling on sheets and elements, and review the results in an interactive report.',
  TextTagAlign: 'Align text notes and tags into a clean column or row.',
  DocAutoDimension: 'Dimension plans, ceiling plans, elevations, sections and drafting views automatically, one view or a batch.',
  ManageDimension: 'Cut-through dimensioning, merging and project-wide dimension audits, from one palette.',
  MakePattern: 'Turn drawn linework into a Revit fill pattern, and export it as a .pat file.',
  SheetExport: 'Batch-export sheets and views to PDF, DWG, IFC, NWC and more, with an optional drawing register.',
  ExcelToSchedule: 'Bring an Excel worksheet into Revit as a schedule that looks the same, and refresh it in place.',
  UpdateSchedule: 'Edit element parameters and schedules in Excel, then import the values back into Revit.',
  DocSheetManager: 'Duplicate, renumber, rename and revise many sheets at once, from one list.',
  DocVpManager: 'Align, crop, renumber and move viewports across many sheets at once, from one list.',
  TemplateManager: 'Transfer view templates, view filters, Visibility/Graphics and hidden elements, and turn imported CAD off, from one window.',
  GraphicOverviews: "Document the project's line styles, patterns, line weights and materials on a sheet, automatically.",
  DetailView: 'Draw a cut line and get a wall section with its floor, ceiling and wall detail callouts, on every level you pick.',
  RoomViews: 'Plans, a 3D view and elevations for every ticked room, then place them on sheets.',
  DocViewManager: 'Convert, duplicate, apply templates to and rename many views at once, from one list.',
}

/** A sentence goes under "Checks" only when it is about safety: undo, previews, confirmation, what is kept or never touched. */
const SAFETY = /undo|ctrl\+z|restored|retained|never (?:deleted|used|modified)|nothing is deleted|confirm|asked first|preview before|before any of them|left alone|are left out|not modified|not guaranteed|evidence only|candidates only|cannot pass|is listed|are listed|reported by name|skipped and named|labelled for review|stored locally|requires? (?:an explicit|reviewed)|only when|is kept|so its sheet placement/i
/** Sentences that act first and mention undo second stay with the actions. */
const ACTION_FIRST = /^(Tick|Filter|Isolate|The two import|Pick|Select)\b/
/** Notes about the tool's own history that a visitor does not need. */
const DROP = new Set(['Each tab is the same tool as its old button.', 'Four workflows.'])
const regroup = <T extends { description: string; capabilities: string[]; safeguards: string[] }>(p: T): T => {
  const at = (s: string) => { const i = p.description.indexOf(s.slice(0, 40)); return i < 0 ? Infinity : i }
  const all = [...p.capabilities, ...p.safeguards].filter((s) => !DROP.has(s)).sort((a, b) => at(a) - at(b))
  const safeguards = all.filter((s) => SAFETY.test(s) && !ACTION_FIRST.test(s))
  const capabilities = all.filter((s) => !safeguards.includes(s))
  if (!capabilities.length && safeguards.length) capabilities.push(safeguards.shift()!)
  return { ...p, capabilities, safeguards }
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

const tools: Product[] = (generated as Omit<Product, 'status' | 'dialogs'>[]).map(regroup).map(edited).map((t) => withDialogs({
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
