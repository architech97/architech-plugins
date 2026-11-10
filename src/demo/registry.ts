import type { DemoDefinition } from './types'
import type { Product } from '../data/types'
import { PRODUCTS } from '../data/catalog'
import { LAYOUTS, generatedSteps } from './generatedRegistry'
import { connectorDemos } from './connectorRegistry'
import { studioDemos } from './studioRegistry'


// Every interactive demo. To add one: write src/demo/demos/<Name>.tsx (a component that takes
// DemoContext), add an entry here, and map the tool key to its id in src/data/catalog.ts.
const CRAFTED: Omit<DemoDefinition, 'kind'>[] = [
  {
    id: 'sheet-manager', productSlug: 'sheet-manager', width: 1060,
    ribbon: { tab: 'Arch Folio', panel: 'Sheets', button: 'Sheet Manager' },
    title: 'Sheet Manager: renumber a sheet set',
    summary: 'Tick sheets, build a renumber rule with prefix and sequence, check the live preview and clash check, then run it as one Undo step.',
    basis: ['Dialog layout, section names, columns and button labels from SheetManagerWindow.xaml.', 'Renumber rules (find/replace, prefix, suffix, sequence start/step/digits) and the clash check from the Renumber / Rename section.', 'A number already in use is skipped; one Undo reverses the whole run.'],
    steps: [
      { id: 'tick', title: 'Tick the floor plans', hint: 'Search "Plan" and use Tick shown, or tick the rows yourself.', target: 'tick-shown' },
      { id: 'section', title: 'Open Renumber / Rename', hint: 'Choose Renumber / Rename in the TOOLS list.', target: 'nav:Renumber / Rename' },
      { id: 'rule', title: 'Build the number rule', hint: 'In the NUMBER column, Find "A-" and Replace with "GA-". Tokens such as {Seq} also work.', target: 'num-find' },
      { id: 'preview', title: 'Check the preview', hint: 'The PREVIEW lists every change and flags any number already in use.', target: 'preview' },
      { id: 'run', title: 'Run it', hint: 'Press the Renumber / rename button. In Revit this is one Undo step.', target: 'run' },
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
      { id: 'export', title: 'Export the report', hint: 'Export all warnings (.xlsx) writes every group, including ones the filters hide.', target: 'export' },
    ],
    load: () => import('./demos/WarningsInspector'),
  },
  {
    id: 'purge-merge', productSlug: 'purge-and-merge', width: 1060,
    ribbon: { tab: 'Arch Sentinel', panel: 'Clean Up', button: 'Purge and Merge' },
    title: 'Purge & Merge: clean up unused content',
    summary: 'Scan reusable content kinds at once, see what is used or unused, tick a safe selection and purge it in one undoable step.',
    basis: ['Columns, Show filters, type tags and footer actions from PurgeWindow.xaml.', 'Type tags MAT, PAT, V-F, V-T, L-P, L-S, F-R, TXT, M-G, D-G from the Type column tooltip.', 'Purge selected deletes every ticked entry in one undoable step.'],
    steps: [
      { id: 'scan', title: 'Read the scan', hint: 'Unused entries are listed by default. Tick Used to see referenced ones too.', target: 'show-used' },
      { id: 'search', title: 'Find CAD-import leftovers', hint: 'Search "IMPORT" to find line styles and patterns brought in by CAD imports.', target: 'search' },
      { id: 'select', title: 'Select what is safe', hint: 'Use Select all visible, or tick rows one by one.', target: 'select-visible' },
      { id: 'purge', title: 'Purge selected', hint: 'Purge selected deletes the ticked entries in one undoable step.', target: 'purge' },
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
]


const SUITE_TAB: Record<string, string> = { folio: 'Arch Folio', forge: 'Arch Forge', sentinel: 'Arch Sentinel' }

function defineDemo(product: Product): DemoDefinition {
  const crafted = CRAFTED.find((entry) => entry.productSlug === product.slug)
  if (crafted) return { ...crafted, kind: 'crafted' }

  const ribbon = { tab: SUITE_TAB[product.suite] ?? product.software[0] ?? product.name, panel: product.panel, button: product.name }
  const base = { id: product.demo ?? product.slug, productSlug: product.slug, ribbon, summary: product.tagline }
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
        'Controls use sample values, and actions simulate what the tool would do on a model.',
      ],
      steps: generatedSteps(product.slug),
      load: async () => ({ default: (await import('./GeneratedDemo')).makeGenerated(product.slug, product.tagline) }),
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

export const demoById = (id: string) => byId.get(id)
export const demoForProduct = (slug: string) => byProduct.get(slug)
