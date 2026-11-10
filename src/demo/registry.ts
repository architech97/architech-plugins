import type { DemoDefinition, ToolDefinition } from './types'
import type { Product } from '../data/types'
import { PRODUCTS } from '../data/catalog'
import { LAYOUTS, generatedSteps } from './generatedRegistry'
import { connectorDemos } from './connectorRegistry'
import { studioDemos } from './studioRegistry'
import { suiteHomeSteps } from './suiteHomeCatalog'


// Legacy hand-built demos stay explicit. New implementations are discovered from
// tools/<product-slug>/index.ts(x), without adding another registry entry.
const CRAFTED: Omit<DemoDefinition, 'kind'>[] = [
  {
    id: 'excel-to-schedule', productSlug: 'excel-to-schedule', width: 1040,
    ribbon: { tab: 'Arch Folio', panel: 'Schedules', button: 'Excel to Schedule' },
    title: 'Excel to Schedule',
    summary: 'Choose an Excel region, preview the cells and review a relink of a placed sample schedule.',
    basis: [
      'The workbook, worksheet, options and preview panes follow the installed Revit 2024 dialog.',
      'The sample uses the workbook region, target eligibility and relink rules from the native command. Existing schedule IDs and placements carry through the simulated refresh.',
    ],
    steps: [
      { id: 'workbook', title: 'Open the sample workbook', hint: 'Browse for a fictional workbook and inspect its worksheet tabs.', target: 'excel-workbook' },
      { id: 'region', title: 'Choose an Excel region', hint: 'Try a print area or named region and compare the cell preview.', target: 'excel-region' },
      { id: 'worksheet', title: 'Tick one worksheet', hint: 'Leave one worksheet checked when choosing an existing target.', target: 'excel-worksheets' },
      { id: 'target', title: 'Choose an existing schedule', hint: 'Review ownership and sheet placements before choosing a target.', target: 'excel-existing' },
      { id: 'refresh', title: 'Confirm the refresh', hint: 'Review the source and target, then check the retained sample schedule identity.', target: 'excel-confirm' },
    ],
    load: () => import('./demos/ExcelToSchedule'),
  },
  {
    id: 'replace-materials', productSlug: 'replace-materials', width: 900,
    ribbon: { tab: 'Arch Forge', panel: 'Finishes', button: 'Replace Materials' },
    title: 'Replace Materials',
    summary: 'Set material, categories and scope, scan the impact, then apply the reviewed sample replacements.',
    basis: ['The controls and impact-scan requirement follow the deployed Revit 2024 dialog and scoped material replacement rules.'],
    steps: [
      { id: 'configure', title: 'Set replacement scope', hint: 'Choose the two materials, work scope and type handling.', target: 'replace-configure' },
      { id: 'scan', title: 'Scan impact', hint: 'Check how many elements and types the current settings affect.', target: 'replace-scan' },
      { id: 'replace', title: 'Apply the reviewed replacement', hint: 'Run the sample replacement with a current impact scan.', target: 'replace-apply' },
    ],
    load: () => import('./demos/ReplaceMaterials'),
  },
  {
    id: 'match-opening', productSlug: 'match-opening', width: 1040,
    ribbon: { tab: 'Arch Forge', panel: 'Rooms', button: 'Match Opening' },
    title: 'Match Opening',
    summary: 'Scan a linked model, review opening differences and apply the selected sample changes.',
    basis: ['The scan, tolerances, opening review and apply order follow the deployed Match Opening dialog.'],
    steps: [
      { id: 'scan', title: 'Scan the linked openings', hint: 'Choose a linked model and check the scan settings.', target: 'opening-scan' },
      { id: 'select', title: 'Review the candidates', hint: 'Tick a Create or Resize row in the sample comparison.', target: 'opening-select' },
      { id: 'apply', title: 'Apply selected changes', hint: 'Review and confirm any host replacement before applying.', target: 'opening-apply' },
    ],
    load: () => import('./demos/MatchOpening'),
  },
  {
    id: 'point-cloud-on-off', productSlug: 'point-cloud-on-off', width: 820,
    ribbon: { tab: 'Arch Forge', panel: 'Scan to BIM', button: 'Point Cloud On/Off' },
    title: 'Point Cloud On/Off',
    summary: 'Toggle point clouds in the sample view and restore the previous visibility with Undo.',
    basis: ['The native split-button command toggles the Point Clouds category in the active view. A view template or unsupported view can block the toggle.'],
    steps: [
      { id: 'view', title: 'Choose a sample view', hint: 'Compare a working view with a view that cannot change point-cloud visibility.', target: 'pointcloud-view' },
      { id: 'toggle', title: 'Toggle the point cloud', hint: 'Run Point Cloud On/Off in a supported sample view.', target: 'pointcloud-toggle' },
      { id: 'undo', title: 'Restore the previous view', hint: 'Undo the sample visibility change.', target: 'pointcloud-undo' },
    ],
    load: () => import('./demos/PointCloudVisibility'),
  },

  {
    id: 'manage-text', productSlug: 'manage-text', width: 1106,
    ribbon: { tab: 'Arch Folio', panel: 'Annotation', button: 'Manage Text' },
    title: 'Manage Text',
    summary: 'Find, replace, tidy, re-type and merge text notes. Review exactly which notes would change before applying.',
    basis: [
      'The tool rail, scope controls and preview follow the installed Arch Folio Manage Text dialog.',
      'This browser simulation works on fictional Sample Residence notes. Excel editing uses a prepared sample. Picking and applying changes stay in the browser.',
    ],
    steps: [
      { id: 'configure', title: 'Set a text operation', hint: 'In Case & tidy-up, select lower or try Tidy spaces and lines.', target: 'manage-text-configure' },
      { id: 'preview', title: 'Review the changes', hint: 'Choose Refresh and compare Before with After. Tick the rows you want to keep.', target: 'manage-text-refresh' },
      { id: 'apply', title: 'Apply ticked changes', hint: 'Choose Apply and read the receipt for the sample notes.', target: 'manage-text-apply' },
    ],
    load: () => import('./demos/ManageText'),
  },
  {
    id: 'sheet-export', productSlug: 'sheet-export', width: 1080,
    ribbon: { tab: 'Arch Folio', panel: 'Publish', button: 'Sheet Export' },
    title: 'Sheet Export: publish a drawing set',
    summary: 'Select sheets, configure export formats and review the filenames before downloading a sample drawing register.',
    basis: [
      'Selection, Format and Create stages follow ArchSheetExportWindow.xaml and use the AT-01 sample sheets.',
      'The browser generates a CSV output manifest and drawing register. The Revit add-in produces drawing files and an optional XLSX register.',
    ],
    steps: [
      { id: 'selection', title: 'Select sheets', hint: 'Tick individual sheets or use Tick shown, then continue to Format.', target: 'tick-shown' },
      { id: 'format', title: 'Set export formats', hint: 'Choose PDF or other formats. Try combining the sheets into one PDF, then continue to Create.', target: 'continue-format' },
      { id: 'export', title: 'Review and run the export', hint: 'Check the filenames, run the sample export and download its manifest or drawing register.', target: 'run-sheet-export' },
    ],
    load: () => import('./demos/SheetExport'),
  },
  {
    id: 'parameter-manager', productSlug: 'parameter-manager', width: 1080,
    ribbon: { tab: 'Arch Forge', panel: 'Parameters', button: 'Parameter Manager' },
    title: 'Parameter Manager: define and bind a project parameter',
    summary: 'Create a project parameter, assign categories and export the resulting definitions.',
    basis: [
      'Parameters and Categories use the names, data types and category bindings shown in ParameterManagerWindow.xaml.',
      'The exercise applies changes to a browser fixture and downloads a CSV of its definitions.',
    ],
    steps: [
      { id: 'add', title: 'Draft a parameter', hint: 'Use Add Parameter and review the name, data type and instance or type setting.', target: 'add-parameter' },
      { id: 'categories', title: 'Open Categories', hint: 'Switch to Categories to assign the new definition.', target: 'parameter-categories' },
      { id: 'bind', title: 'Choose its categories', hint: 'Tick one or more categories, such as Doors and Windows.', target: 'assign-categories' },
      { id: 'apply', title: 'Apply the definition', hint: 'Apply and check the receipt for the name, binding and categories.', target: 'apply-parameter' },
      { id: 'csv', title: 'Export the definitions', hint: 'Download a sample CSV to inspect the new definition and the existing rows.', target: 'parameter-csv' },
    ],
    load: () => import('./demos/ParameterManager'),
  },
  {
    id: 'sheet-manager', productSlug: 'sheet-manager', width: 1060,
    ribbon: { tab: 'Arch Folio', panel: 'Sheets', button: 'Sheet Manager' },
    title: 'Sheet Manager: renumber a sheet set',
    summary: 'Check an occupied sheet number, then issue the Ground Floor and First Floor plans as GA-101 and GA-102.',
    basis: [
      'The browser dialog follows SheetManagerWindow.xaml and uses the fictional Sample Residence sheet list.',
      'The sample shortcuts load exact inputs for the clash and issue cases. The preview and receipt report changes to the browser fixture.',
      'In Revit the renumber command skips occupied numbers and groups the successful changes into one Undo step.',
    ],
    steps: [
      { id: 'tick', title: 'Load the two floor plans', hint: 'Load A-101 Ground Floor Plan and A-102 First Floor Plan to open Renumber / Rename.', target: 'sheet-sample' },
      { id: 'collision', title: 'Check an occupied number', hint: 'Try changing A-101 to A-102. The First Floor Plan already uses A-102, so the preview blocks the change.', target: 'sheet-collision' },
      { id: 'rule', title: 'Set the GA issue rule', hint: 'Replace the A- prefix with GA- for both floor plans.', target: 'sheet-issue' },
      { id: 'preview', title: 'Review the two new numbers', hint: 'Confirm GA-101 and GA-102 in Preview, then mark it reviewed.', target: 'preview' },
      { id: 'run', title: 'Apply and check the receipt', hint: 'Run Renumber / rename. Check the old and new numbers, sheet names, revision and view counts.', target: 'run' },
    ],
    load: () => import('./demos/SheetManager'),
  },
  {
    id: 'warnings-inspector', productSlug: 'warnings-inspector', width: 1080,
    ribbon: { tab: 'Arch Sentinel', panel: 'Model Health', button: 'Warnings Inspector' },
    title: 'Warnings Inspector: critical warnings first',
    summary: 'Review grouped warnings by severity class and frequency, search descriptions or an element ID, inspect a group and isolate its elements, then export the scan.',
    basis: ['Stat tiles, filters, columns and review panel from WarningsWindow.xaml.', 'Severity classes Critical / Warning / Info and sort options Priority first / Most frequent / Description from the code-behind.', 'Warning texts are Revit\'s own messages; counts and element IDs are sample values.'],
    steps: [
      { id: 'filter', title: 'Show critical warnings', hint: 'Set Severity class to Critical.', target: 'severity' },
      { id: 'pick', title: 'Review a warning group', hint: 'Click a row to read its full description and affected element IDs.', target: 'grid' },
      { id: 'isolate', title: 'Isolate the affected elements', hint: 'Press Isolate affected elements to review them in the view.', target: 'isolate' },
      { id: 'search', title: 'Search by element ID', hint: 'Type an element ID from the list (for example 301178) into the search box.', target: 'search' },
      { id: 'export', title: 'Export the report', hint: 'Download the sample CSV. It includes every warning group, even those hidden by filters.', target: 'export' },
    ],
    load: () => import('./demos/WarningsInspector'),
  },
  {
    id: 'purge-merge', productSlug: 'purge-and-merge', width: 1060,
    ribbon: { tab: 'Arch Sentinel', panel: 'Clean Up', button: 'Purge and Merge' },
    title: 'Purge & Merge: clean up unused content',
    summary: 'Scan reusable content kinds at once, see what is used or unused, tick a safe selection and purge it in one undoable step.',
    basis: ['Columns, Show filters, type tags and footer actions from PurgeWindow.xaml.', 'Type tags MAT, PAT, V-F, V-T, L-P, L-S, F-R, TXT, M-G, D-G from the Type column tooltip.', 'The sample purge calls out referenced entries before confirmation and protects the system line style.'],
    steps: [
      { id: 'scan', title: 'Read the scan', hint: 'Unused entries are listed by default. Tick Used to see referenced ones too.', target: 'show-used' },
      { id: 'search', title: 'Find CAD-import leftovers', hint: 'Search "IMPORT" to find line styles and patterns brought in by CAD imports.', target: 'search' },
      { id: 'select', title: 'Select what is safe', hint: 'Use Select all visible, or tick rows one by one.', target: 'select-visible' },
      { id: 'purge', title: 'Purge selected', hint: 'Review the deletion scope, including any in-use entries, before confirming.', target: 'purge' },
    ],
    load: () => import('./demos/PurgeMerge'),
  },
  {
    id: 'room-to-finishes', productSlug: 'room-to-finishes', width: 1000,
    ribbon: { tab: 'Arch Forge', panel: 'Finishes', button: 'Room to Finishes' },
    title: 'Room to Finishes: floors, ceilings and wall linings',
    summary: 'Choose the finishes and their types, review the scope and creation plan, then approve the plan row by row before anything is created.',
    basis: ['Run modes, finish options, expanders and the Review scope panel from FinishingWindow.xaml.', 'The review step (each room, finish kind and intended action; only approved rows are applied) from FinishReviewWindow.', 'Basic walls and columns are supported; curtain and stacked walls are skipped.'],
    steps: [
      { id: 'types', title: 'Choose finish types', hint: 'Pick a floor type, a ceiling type and a wall lining type.', target: 'floor-type' },
      { id: 'option', title: 'Set a position option', hint: 'Open Position and door thresholds and tick Extend into door openings.', target: 'floor-pos' },
      { id: 'review', title: 'Review the plan', hint: 'Press Review plan to see each room, finish kind and intended action.', target: 'review' },
      { id: 'apply', title: 'Apply the approved rows', hint: 'Untick anything you do not want, then Apply reviewed plan.', target: 'apply' },
    ],
    load: () => import('./demos/RoomFinishes'),
  },
  {
    id: 'one-parameter', productSlug: 'one-parameter', width: 1000,
    ribbon: { tab: 'Arch Forge', panel: 'Parameters', button: 'One Parameter' },
    title: 'One Parameter: preview, edit and write one parameter',
    summary: 'Pick a category and a parameter, preview every element\'s value, edit the proposed values with find/replace, prefix or suffix, then write the ticked rows.',
    basis: ['Scope, category, parameter list, edit tools and preview grid from OneParameterWindow.xaml.', 'Replace in preview edits proposed values only; nothing is written until Apply Changes.', 'A type parameter is written once per type.'],
    steps: [
      { id: 'category', title: 'Pick a category', hint: 'Choose Doors in the CATEGORY list.', target: 'category' },
      { id: 'param', title: 'Pick a parameter', hint: 'Click Comments in the PARAMETER list.', target: 'params' },
      { id: 'replace', title: 'Edit in the preview', hint: 'Find "internal", replace with "Internal door", then Replace in preview.', target: 'replace' },
      { id: 'apply', title: 'Apply the ticked rows', hint: 'Apply Changes writes the ticked rows in one transaction.', target: 'apply' },
    ],
    load: () => import('./demos/OneParameter'),
  },
  {
    id: 'room-to-view', productSlug: 'room-to-view', width: 1080,
    ribbon: { tab: 'Arch Folio', panel: 'Views', button: 'Room to View' },
    title: 'Room to View: room packages in one run',
    summary: 'Tick rooms, choose which views to make (floor plan, ceiling plan, 3D, elevations) with crop, scale and template, then create them.',
    basis: ['Steps (Rooms, Floor Plan, Ceiling Plan, 3D View, Elevations, Masking, Place on Sheet) and options from RoomToViewWindow.xaml.', 'Elevation layouts: all walls, 4 elevations on a shared marker, or by direction (N/E/S/W).', 'Views are named from the room number and name; curved boundaries are skipped for elevations.'],
    steps: [
      { id: 'rooms', title: 'Tick the rooms', hint: 'Tick Kitchen and Living Room (or use Tick shown).', target: 'rooms' },
      { id: 'floor', title: 'Set the floor plan', hint: 'Open Floor Plan to set the crop, scale and view template.', target: 'nav:Floor Plan' },
      { id: 'elev', title: 'Choose elevations', hint: 'Open Elevations and choose one of the three layouts.', target: 'nav:Elevations' },
      { id: 'create', title: 'Create the views', hint: 'Press Create to generate the views for every ticked room.', target: 'create' },
    ],
    load: () => import('./demos/RoomToView'),
  },
  {
    id: 'model-health', productSlug: 'model-health', width: 980,
    ribbon: { tab: 'Arch Sentinel', panel: 'Model Health', button: 'Model Health' },
    title: 'Model Health: export and review a report',
    summary: 'Select inventory sections, run a sample health check, review its findings and download a section CSV.',
    basis: [
      'ReportSelectionForm and ExportProgressForm supply the code-built WPF option labels, inventory categories and cancellation behavior.',
      'CheckSetRunner supplies Model Check Reviews and the Result, Severity and Reason override fields. The dashboard follows the desktop export’s searchable and sortable section tables.',
      'All model counts, receipts and downloadable CSV rows use the fictional AT-01 fixture.',
    ],
    steps: [
      { id: 'categories', title: 'Choose inventory categories', hint: 'Keep the defaults or tick the model inventory sections you want to export.', target: 'health-categories' },
      { id: 'run', title: 'Run the sample check', hint: 'Choose Run check to collect the selected inventory. Use Cancel after current section to see a partial receipt.', target: 'health-run' },
      { id: 'review', title: 'Review the findings', hint: 'Mark a failure reviewed, edit an override or leave the results as they are, then finish the review.', target: 'health-review' },
      { id: 'dashboard', title: 'Open the dashboard', hint: 'Check the sample receipt and open the dashboard to explore exported sections.', target: 'health-dashboard' },
      { id: 'download', title: 'Download a section CSV', hint: 'Pick an inventory section, filter its rows and download the sample CSV.', target: 'health-download' },
    ],
    load: () => import('./demos/ModelHealthExport'),
  },
]


const SUITE_TAB: Record<string, string> = { folio: 'Arch Folio', forge: 'Arch Forge', sentinel: 'Arch Sentinel' }

interface ToolModule { definition?: DemoDefinition; default?: ToolDefinition }
interface DiscoveredTool {
  path: string
  importModule: () => Promise<ToolModule>
  definition?: DemoDefinition
  pending?: Promise<void>
  error?: unknown
  descriptor?: DemoDefinition
  fallback?: DemoDefinition
}

// Keep this glob lazy: importing the registry must not import tool UI, fixtures or CSS.
// Metadata is resolved only when a routed demo asks for it through demoById.
const toolModules = import.meta.glob<ToolModule>('./tools/*/index.{ts,tsx}')
const discovered = new Map<string, DiscoveredTool>()
for (const [path, importModule] of Object.entries(toolModules).sort(([a], [b]) => a.localeCompare(b))) {
  const slug = path.split('/')[2]
  // A named TSX dialog wins over a legacy metadata-only TS index. Both files
  // remain on disk; this resolves integration conflicts without deleting work.
  const previous = discovered.get(slug)
  if (!previous || path.endsWith('.tsx')) discovered.set(slug, { path, importModule })
}

function loadDiscovered(tool: DiscoveredTool, slug: string): Promise<void> {
  if (!tool.pending) {
    tool.pending = tool.importModule().then((module) => {
      const candidate = module.definition ?? module.default
      if (!candidate || typeof candidate !== 'object') {
        throw new Error(`${tool.path} must export definition or a default ToolDefinition.`)
      }
      if (module.definition && module.definition.productSlug !== slug) {
        throw new Error(`${tool.path} exports a definition for a different product slug.`)
      }
      // Legacy metadata-only indexes inherit their generated dialog and folder
      // result workflow. Complete named definitions supply their own dialog.
      const definition: DemoDefinition = { ...tool.fallback!, ...candidate }
      if (typeof definition.load !== 'function' || !Array.isArray(definition.steps)
        || !Array.isArray(definition.basis)) {
        throw new Error(`${tool.path} does not resolve to a complete DemoDefinition.`)
      }
      tool.definition = definition
      // Gallery entries hold the same descriptor object; hydrate it once, before
      // mounting the player, so every consumer can read the tool's real metadata.
      if (tool.descriptor) Object.assign(tool.descriptor, definition)
    }).catch((error: unknown) => { tool.error = error })
  }
  return tool.pending
}

function discoveredDescriptor(product: Product, tool: DiscoveredTool): DemoDefinition {
  const fallback = defineFallback(product)
  tool.fallback = fallback
  const descriptor: DemoDefinition = {
    ...fallback,
    kind: 'crafted',
    load: async () => {
      await loadDiscovered(tool, product.slug)
      if (tool.error) throw tool.error
      return tool.definition!.load()
    },
  }
  tool.descriptor = descriptor
  return descriptor
}

function defineDemo(product: Product): DemoDefinition {
  const crafted = CRAFTED.find((entry) => entry.productSlug === product.slug)
  if (crafted) return { ...crafted, kind: 'crafted' }

  const tool = discovered.get(product.slug)
  if (tool) return discoveredDescriptor(product, tool)
  return defineFallback(product)
}

function defineFallback(product: Product): DemoDefinition {
  const ribbon = { tab: SUITE_TAB[product.suite] ?? product.software[0] ?? product.name, panel: product.panel, button: product.name }
  const base = { id: product.demo ?? product.slug, productSlug: product.slug, ribbon, summary: product.tagline }
  if (product.panel === 'Start' && (product.suite === 'folio' || product.suite === 'forge' || product.suite === 'sentinel')) {
    const suite = product.suite
    return {
      ...base,
      kind: 'crafted',
      width: 1080,
      title: product.name,
      summary: 'Browse the ribbon groups, find a tool and review whether it can open in the sample context.',
      basis: ['The launcher matches the installed Revit 2024 layout, panel order and tool labels. Opening a tool leads to its browser simulation.'],
      steps: suiteHomeSteps(suite),
      load: async () => ({ default: (await import('./demos/SuiteHome')).makeSuiteHome(suite) }),
    }
  }
  const studio = studioDemos[product.slug] ?? connectorDemos[product.slug]
  if (studio) return { ...base, kind: 'workflow', width: 1020, frame: 'app', ...studio }

  const layouts = LAYOUTS[product.slug]
  if (layouts?.length) {
    return {
      ...base,
      kind: 'replica',
      width: Math.min(1180, layouts[0].w),
      title: product.name,
      basis: [
        `The explorer reconstructs the ${product.name} dialog from exported layout positions, labels and tooltips.`,
        'Try the controls on representative sample rows. The installed tool performs the corresponding Revit operations.',
      ],
      steps: generatedSteps(product.slug),
      load: async () => (await import('./GeneratedDemo')).loadGenerated(product.slug),
    }
  }

  return {
    ...base,
    kind: 'workflow',
    width: 660,
    title: product.name,
    basis: [
      `This sample scenario follows the command documented by ${product.name}.`,
      'The browser shows illustrative inputs and outcomes for Sample Residence.',
    ],
    steps: [
      { id: 'configure', title: 'Choose a sample input', hint: 'Pick an option to see how it affects the outcome.', target: 'flow-choice' },
      { id: 'run', title: 'Run the command', hint: 'Apply the command to the selected sample input.', target: 'flow-run' },
      { id: 'review', title: 'Review the result', hint: 'Inspect the sample results and mark them reviewed.', target: 'flow-review' },
    ],
    load: async () => ({ default: (await import('./FlowDemo')).makeCommand(product) }),
  }
}

export const DEMOS = PRODUCTS.map(defineDemo)
const byId = new Map(DEMOS.map((demo) => [demo.id, demo]))
const byProduct = new Map(DEMOS.map((demo) => [demo.productSlug, demo]))

/** Route metadata is ready before DemoPlayer mounts; the route's existing Suspense
 * boundary handles a tool's first lazy import. Gallery discovery remains synchronous. */
export const demoById = (id: string): DemoDefinition | undefined => {
  const demo = byId.get(id)
  if (!demo) return undefined
  const tool = discovered.get(demo.productSlug)
  if (!tool || tool.descriptor !== demo) return demo
  if (tool.error) throw tool.error
  if (!tool.definition) throw loadDiscovered(tool, demo.productSlug)
  return demo
}
export const demoForProduct = (slug: string) => byProduct.get(slug)
