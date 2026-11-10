import { sentinelCell, sentinelChoices } from './sentinelFixtures'
import { forgeCell, forgeChoices } from './forgeFixtures'

import { GENERATED_SAMPLE } from './fixtures/sampleResidence'
const { LEVELS, CATEGORIES, VIEWS, ROOMS, TEMPLATES, PARAMETERS, LINKS, MATERIALS, FAMILIES, TYPES, ROOM_PROPERTIES, WORKSETS, TEXT_TYPES } = GENERATED_SAMPLE

const CHOICES: [RegExp, string[]][] = [
  [/a preset ticks the strings/, ['Outside of building: openings, overall and grids', 'Room sizes: clear width and length', 'Doors and windows: positions in each room', 'Across walls: setting-out', 'Grids: grid to grid', 'Custom']],
  [/facade side|which side of the wall/, ['Outside (room-aware)', 'Inside (room-aware)', "Wall’s exterior side"]],
  [/pattern name/, ['AR-02 Brick Running Bond', 'AR-04 Diagonal Hatch', 'FN-01 Timber Boards']],
  [/export units|units written/, ['Millimeters', 'Inches']],
  [/section type/, ['Wall Section', 'Building Section', 'Detail Section']],
  [/section head|callout head/, ['Section Head – Filled', 'Section Head – Open', 'No head']],
  [/callout type/, ['Detail View', 'Wall Section', 'Drafting View']],
  [/^bottom|^top|^level$|^level:/, LEVELS],
  [/unplaced views|already on a sheet/, ['Unplaced views', 'All views']],
  [/font size|from workbook/, ['From workbook', '2.5 mm', '3.5 mm', '5 mm']],
  [/text type|move notes/, TEXT_TYPES],
  [/which dimensions/, ['All linear dimensions', 'Single dimensions', 'Dimension strings']],
  [/sweep direction/, ['Left to right', 'Right to left', 'Bottom to top', 'Top to bottom']],
  [/view scale/, ['1:20', '1:50', '1:100', '1:200']],
  [/elevation type/, ['Interior Elevation', 'Building Elevation']],
  [/line style/, ['Thin Lines', 'Medium Lines', 'Beyond']],
  [/export profile|^profile$/, ['Issue – PDF and DWG', 'Review – PDF', 'Coordination – IFC']],
  [/no margin|margin/, ['No Margin', 'Centered', 'User Defined']],
  [/printer|system default/, ['(Use system default)', 'Microsoft Print to PDF']],
  [/raster quality/, ['Low', 'Medium', 'High', 'Presentation']],
  [/^colors?|^color$/, ['Color', 'Grayscale', 'Black Lines']],
  [/existing files|stop if a file/, ['Stop if a file exists', 'Overwrite existing files', 'Skip existing files']],
  [/available parameters/, ['All', 'Sheet parameters', 'Project information']],
  [/^copies/, ['1', '2', '3']],
  [/^duplicate|how to duplicate/, ['Duplicate', 'Duplicate with detailing', 'Duplicate as dependent']],
  [/if a template already|overwrite replaces/, ['Overwrite', 'Skip', 'Rename']],
  [/rooms from/, ['This model', ...LINKS]],
  [/pick an open model|model the templates|copy to|source revit link|master link|copy from link/, LINKS],
  [/annotation crop|crop region visible/, ['Leave unchanged', 'Show', 'Hide']],
  [/^reference/, ['A-101 · Level 01 – Floor Plan', 'A-102 · Level 02 – Floor Plan', 'A-201 · North Elevation']],
  [/convert to/, ['Drafting View', 'Legend', 'Detail View']],
  [/view template|template legend/, TEMPLATES],
  [/room (text )?property/, ROOM_PROPERTIES],
  [/point cloud/, ['Sample Residence – Scan.rcp', 'Level 01 – Registered Scan.rcs']],
  [/project schemes|schemes saved/, ['Door hardware → Comments', 'Room finish → Finish', 'Window type → Type Mark']],
  [/work scope/, ['Selection', 'Active view', 'Selected rooms', 'Whole model']],
  [/type changes/, ['Duplicate system types in scope', 'Edit shared types (review full reach)']],
  [/^material|find material|replace with material/, MATERIALS],
  [/floor finish type/, ['FL-01 Porcelain 12 mm', 'FL-02 Engineered Oak 18 mm', 'FL-03 Terrazzo 20 mm']],
  [/ceiling finish type/, ['CL-01 Gypsum 12.5 mm', 'CL-02 Acoustic Tile 600 × 600']],
  [/run mode|create missing/, ['Create missing — keep existing generated finishes', 'Review existing finishes']],
  [/names to review|types includes/, ['Families', 'Types', 'Families and Types']],
  [/review profile|review preset/, ['General model review', 'Room coordination', 'FF&E review']],
  [/base scope/, ['Active view', 'Current selection', 'Whole model']],
  [/created phase/, ['Existing', 'New Construction']],
  [/design option/, ['Main Model', 'Option 01 – Courtyard', 'Option 02 – Garden']],
  [/^match$/, ['ALL (AND)', 'ANY (OR)']],
  [/column-to-grid/, ['Column-to-grid alignment', 'Beam endpoint contact']],
  [/severity class/, ['All classes', 'Critical', 'Warning', 'Info']],
  [/^sort by/, ['Priority first', 'Most frequent', 'Description']],
  [/workset/, WORKSETS],
  [/^on$/, ['Instance', 'Type']],
  [/category/, CATEGORIES],
  [/parameter|write to/, PARAMETERS],
  [/^value$/, ['Existing', 'Proposed', 'Verified']],
  [/view type/, ['All views', 'Floor Plan', 'Ceiling Plan', 'Section', 'Elevation', 'Drafting View']],
]

const MODEL_CHOICES: Record<string, readonly string[][]> = {
  'family-param-transfer': [['Door – Single Flush.rfa', 'Door – Double Flush.rfa']],
  'family-name-synchronizer': [['Sample Residence – Family Container.rvt', 'Sample Residence – Architecture.rvt']],
  'fr-to-finishes': [['FL-01 Porcelain 12 mm', 'FL-02 Engineered Oak 18 mm', 'FL-03 Terrazzo 20 mm']],
  'detail-view': [LEVELS],
  'parameter-manager': [['All disciplines', 'Common', 'Structural', 'Mechanical'], ['Instance', 'Type']],
  'model-query-pro': [CATEGORIES, PARAMETERS],
  'view-manager': [['All types', 'Floor Plan', 'Ceiling Plan', 'Elevation', 'Section'], TEMPLATES],
  'vp-manager': [['All sheets', 'A-101 · Ground Floor Plan', 'A-102 · First Floor Plan']],
  'sheet-export': [['Issue – PDF and DWG', 'Review – PDF', 'Coordination – IFC']],
  'template-manager': [LINKS],
}

export function fixtureChoices(slug: string, label: string, captured: string, tip: string, ordinal: number, windowName?: string): string[] {
  const forge = forgeChoices(slug, label)
  if (forge) return forge
  const sentinel = sentinelChoices(slug, windowName, ordinal)
  if (sentinel) return sentinel
  const context = [captured, label, tip].filter(Boolean).join(' ').toLowerCase()
  const match = CHOICES.find(([pattern]) => pattern.test(context))?.[1]
  const fallback = MODEL_CHOICES[slug]?.[ordinal] ?? MODEL_CHOICES[slug]?.[0]
  return [...new Set([captured, ...(match ?? fallback ?? VIEWS.slice(0, 3))].filter(Boolean))]
}

const COMMON_COLUMNS: Record<string, string[]> = {
  '#': ['1', '2', '3', '4', '5', '6'],
  number: ['101', '102', '103', '201', '202', '203'],
  worksheet: ['Door Schedule', 'Room Finish Schedule', 'Window Schedule', 'Material Takeoff', 'Sheet Index', 'Equipment Register'],
  'in the model': ['Not imported', 'Existing schedule', 'Existing schedule', 'Not imported'],
  schedule: ['Door Schedule', 'Room Finish Schedule', 'Window Schedule', 'Material Takeoff'],
  name: ROOMS,
  room: ROOMS,
  'room name': ROOMS,
  level: LEVELS,
  'current level': LEVELS,
  'target level': ['Level 02', 'Level 01', 'Level 02'],
  'family name': FAMILIES,
  family: FAMILIES,
  'family and type': FAMILIES.map((name, index) => `${name} : ${TYPES[index]}`),
  'type name': TYPES,
  type: TYPES,
  category: CATEGORIES,
  'category name': CATEGORIES,
  'element id': ['348211', '348390', '351002', '352117', '355210', '361001'],
  view: VIEWS,
  'view type': ['Floor Plan', 'Floor Plan', 'Elevation', 'Section', 'Ceiling Plan', '3D View'],
  'view (sheet)': VIEWS,
  template: TEMPLATES,
  sheet: ['A-101', 'A-102', 'A-201', 'A-301', 'A-111', 'A-901'],
  scale: ['1:50', '1:50', '1:100', '1:25', '1:50', '1:100'],
  'scale 1:': ['50', '50', '100', '25', '50', '100'],
  'placed on': ['A-301', 'Unplaced', 'A-302', 'Unplaced'],
  'detail #': ['1', '2', '1', '3', '1', '2'],
  'viewport type': ['Title with Line', 'Title without Line', 'No Title'],
  'title on sheet': VIEWS,
  pinned: ['Yes', 'No', 'Yes', 'No'],
  crop: ['Visible', 'Hidden', 'Visible'],
  area: ['32.4 m²', '14.8 m²', '16.2 m²', '18.1 m²', '13.5 m²', '5.2 m²'],
  status: ['Ready', 'Ready', 'Review', 'Ready', 'Ready', 'Review'],
  'qa status': ['Within tolerance', 'Review', 'Within tolerance', 'Review'],
  preflight: ['Ready', 'Ready', 'Review'],
  'review notes': ['Room enclosed', 'Boundaries resolved', 'Linked wall at entry'],
  parameter: PARAMETERS,
  'parameter name': PARAMETERS,
  'type of parameter': ['Text', 'Text', 'Integer', 'Text', 'Material', 'Text'],
  'data type': ['Text', 'Length', 'Number', 'Yes/No', 'Material', 'Text'],
  discipline: ['Common', 'Common', 'Structural', 'Common'],
  'group under': ['Identity Data', 'Dimensions', 'Materials and Finishes', 'Constraints'],
  'instance/type': ['Instance', 'Type', 'Instance', 'Instance', 'Type', 'Instance'],
  group: ['Identity Data', 'Dimensions', 'Materials and Finishes'],
  binding: ['Instance', 'Type', 'Instance'],
  kind: ['Shared', 'Family', 'Shared', 'Family'],
  workset: WORKSETS,
  'expected workset': ['Architecture', 'Interiors', 'Architecture', 'Structure'],
  count: ['12', '4', '27', '1', '8', '3'],
  elements: ['12', '4', '27', '1', '8', '3'],
  instances: ['4', '2', '6', '3', '1', '5'],
  copies: ['2', '3', '2', '2', '4', '2'],
  'in scope': ['4', '2', '5', '1'],
  'in model': ['12', '6', '11', '3'],
  'text type': TEXT_TYPES,
  font: ['Arial', 'Arial', 'Arial Narrow'],
  size: ['2.5 mm', '3.5 mm', '5.0 mm'],
}

const TOOL_COLUMNS: Record<string, Record<string, string[]>> = {
  'excel-to-schedule': { name: ['Door Schedule', 'Room Finish Schedule', 'Window Schedule'], label: ['Door Mark', 'Finish Code', 'Type Mark'], value: ['D-101', 'FN-02', 'W-103'], isselected: ['Yes', 'No', 'Yes'], use: ['Create', 'Refresh', 'Create'], ischecked: ['Yes', 'No', 'Yes'] },
  'manage-text': { before: ['EXISTING WALL TO REMAIN', 'NEW  PARTITION', 'SEE “DETAIL A-501”'], after: ['Existing wall to remain', 'New partition', 'See “detail A-501”'], note: ['Entry wall note', 'Kitchen partition note', 'Section reference'] },
  'reorder-pro': { order: ['1', '2', '3', '4', '5', '6'], 'current value': ['D-04', 'D-02', 'D-06', 'D-01'], numbering: ['D-01', 'D-02', 'D-03', 'D-04'], name: ['Entry door', 'Kitchen door', 'Terrace door'], notes: ['Writable Mark', 'Already matches', 'Writable Mark'] },
  'update-schedule': { 'rows matched': ['12', '6', '10'], 'rows not found': ['0', '1', '0'], 'values changing': ['3', '1', '2'], 'columns not writable': ['0', '1', '0'], 'element / type': ['D-101 · Single Flush', '101 · Living Room', 'W-103 · Fixed Window'], 'now in revit': ['Internal', 'Paint – White', 'W-03'], 'from the file': ['Internal door', 'Paint – Warm White', 'W-103'], 'applies to': ['Instance', 'Instance', 'Type'] },
  'sheet-export': { 'sample value': ['A-101', 'Ground Floor Plan', 'P02', 'Sample Residence'], prefix: ['ARCH-', ''], suffix: ['', '-P02'], separator: ['_', '-', ' '] },
  'deviation-inspector': { result: ['Within tolerance', 'Above tolerance', 'Unmeasured'], samples: ['88', '74', '0'], 'avg deviation': ['3.4 mm', '18.2 mm', '—'], median: ['3.1 mm', '16.5 mm', '—'], p95: ['8.1 mm', '26.1 mm', '—'], maximum: ['11.2 mm', '38.0 mm', '—'], 'projection yield': ['94%', '81%', '0%'], sampling: ['Measured', 'Measured', 'No valid projected points'] },
  'match-opening': { 'source id': ['729614', '729721', '729866'], source: ['M-101 · Supply riser', 'M-106 · Return duct', 'M-112 · Exhaust duct'], 'host wall': ['W-101 · Core wall', 'W-108 · Service wall', 'W-120 · Wet wall'], 'host opening': ['O-101', 'O-108', 'Missing'], 'cut / host width': ['450 / 450 mm', '600 / 550 mm', '300 / — mm'], 'cut / host height': ['300 / 300 mm', '500 / 450 mm', '300 / — mm'], action: ['Keep', 'Resize', 'Create'], result: ['Matched', 'Review clearance', 'Missing opening'] },
  'point-cloud-slicer': { slice: ['Yes', 'Yes', 'No'], 'level name': LEVELS, elevation: ['0 mm', '3150 mm', '6300 mm'], 'story height': ['3150 mm', '3150 mm', '2900 mm'] },
  'room-height-adjust': { 'height now': ['3150 mm', '3150 mm', '3150 mm'], 'new height': ['2750 mm', '2600 mm', '2800 mm'], change: ['−400 mm', '−550 mm', '−350 mm'] },
  'shared-param-manager': { description: ['Fire rating in minutes', 'Finish schedule code', 'Room department'], guid: ['1f729a56-5e2c-45c2-b2f4-9c7e36d9cbf8', '588325fe-1edc-4323-921b-091697aa3671', '1b793e25-f46f-4f02-a785-b2c4f2218111'] },
  'compliance-guard': { 'category / type': ['Lines / Detail Lines', 'Revit Links / Coordination', 'Walls / Basic Wall'], 'sop issue': ['Imported CAD line style', 'Unpinned coordination link', 'Assigned to Workset1'], 'element / style name': ['CAD-A-WALL', 'Sample Residence – Structure.rvt', 'W-101 · Core wall'], 'view / location': ['A-501 · Typical Details', '3D – Coordination', 'Level 01'] },
  'duplicates-resolver': { 'family : type': FAMILIES.map((family, index) => `${family} : ${TYPES[index]}`), 'keep as primary': ['348211', '348390', '351002'], extras: ['348212', '348391, 348392', '351003'], 'location (ft)': ['(12.04, 8.13, 0.00)', '(19.85, 3.28, 0.00)', '(23.95, 11.81, 10.33)'], notes: ['Same family and type', 'Matching transform', 'Review hosted instance'], inspect: ['Plan', '3D', 'Plan'] },
  'family-name-editor': { 'expected name': ['AR-WAL-Interior 115', 'AR-DOR-Single Flush', 'AR-WIN-Fixed Window'], types: ['3', '4', '2'], prefix: ['AR-WAL-', 'AR-DOR-', 'AR-WIN-'], suffix: ['-INT', '-EXT', '—'] },
  'family-name-synchronizer': { match: ['Mapped', 'Mapped', 'Needs review'], 'match?': ['Yes', 'Yes', 'Review'], 'matched by': ['Type Mark', 'Type Mark', 'No Type Mark'], 'current name': ['Door_Single', 'Window_Fixed', 'Rectangular_Column'], 'container name': ['AR-DOR-Single Flush', 'AR-WIN-Fixed', 'ST-COL-Rectangular'] },
  'filter-usage-checker': { filter: ['QA – Fire Rated Doors', 'MEP – Linked Coordination', 'ARCH – Unclassified Walls'], 'views + templates': ['7', '3', '0'], views: ['5', '2', '0'], templates: ['2', '1', '0'] },
  'group-manager': { 'group type name': ['Unit 01 – Furniture', 'Typical Toilet Layout', 'Kitchen Base Cabinets'], members: ['12', '8', '17'], 'type id': ['350004', '350051', '350109'], 'instance ids': ['352211, 352260', '352412, 352413', '352516'], actions: ['Inspect', 'Review members', 'Inspect'] },
  'in-place-converter': { 'in-place family name': ['Entry canopy', 'Cast-in-place stair plinth', 'Reception niche'], 'level / host': ['Level 01 · Exterior', 'Level 01 · Stair', 'Level 02 · Lobby'], solids: ['2', '1', '3'], 'approx volume': ['0.38 m³', '1.24 m³', '0.16 m³'] },
  'mirrored-auditor': { 'mirror status': ['Mirrored', 'Not mirrored', 'Mirrored'], 'hand flipped': ['Yes', 'No', 'No'], 'facing flipped': ['No', 'No', 'Yes'] },
  'model-query-pro': { 'review class': ['Room coordination', 'Warning', 'FF&E'], finding: ['Room boundary not enclosed', 'Overlapping walls', 'Missing Type Mark'], comparison: ['Expected enclosed', 'Unique geometry', 'Type Mark required'], state: ['Review', 'Review', 'Open'], check: ['Room enclosure', 'Duplicate walls', 'FF&E metadata'], outcome: ['Complete', 'Complete', 'Complete'], reviewed: ['18', '22', '13'], issues: ['2', '1', '3'], errors: ['0', '0', '0'], 'read ms': ['18', '12', '24'], 'matched rule value': ['Door', 'Window', 'Wall'] },
  'off-axis-resolver': { route: ['Adjust line', 'Rotate instance', 'Review only'], current: ['89.4°', '0.8°', '179.1°'], target: ['90.0°', '0.0°', '180.0°'], deviation: ['0.6°', '0.8°', '0.9°'], class: ['Wall', 'Family instance', 'Grid'], reason: ['Within 1° correction range', 'Within 1° correction range', 'Hosted element requires review'] },
  'parameter-colorizer': { value: ['30 min', '60 min', '90 min', '120 min', 'Unspecified'], color: ['#8AB8E6', '#79C7B0', '#E4BC72', '#D48682', '#9A9DA1'] },
  'scope-box-synchronizer': { 'scope box name': ['Core – Level 01', 'Building Overall', 'East Wing'], status: ['Drift detected', 'Matched', 'Missing in host'], 'host match': ['Core – Level 01', 'Building Overall', '—'], 'drift (mm)': ['45', '0', '—'], 'source link extents': ['14.5 × 9.2 × 6.3 m', '23.0 × 14.5 × 9.4 m', '7.2 × 8.6 × 6.3 m'] },
  'structural-qa': { 'measured deviation / reference': ['3 mm · Grid A/1', '12 mm · Grid B/2', '4 mm · Grid C/1'] },
  'workset-manager': { 'family prefix': ['AR-DOR-', 'AR-WIN-', 'ST-COL-', 'ST-BEA-'] },
}

const SELECT_HEADERS = new Set(['[]', 'apply', 'fix', 'select', 'rename?', 'sync', 'ungroup'])
const THREE_RECORD_TOOLS = new Set(['compliance-guard', 'deviation-inspector', 'duplicates-resolver', 'family-name-editor', 'family-name-synchronizer', 'filter-usage-checker', 'group-manager', 'in-place-converter', 'match-opening', 'mirrored-auditor', 'model-query-pro', 'off-axis-resolver', 'point-cloud-slicer', 'room-height-adjust', 'scope-box-synchronizer', 'shared-param-manager', 'structural-qa', 'update-schedule'])
export const fixtureRowLimit = (slug: string) => slug === 'compliance-guard' || slug === 'parameter-colorizer' ? 5 : slug === 'off-axis-resolver' ? 4 : slug === 'family-param-transfer' || THREE_RECORD_TOOLS.has(slug) ? 3 : 6
export const isSelectionColumn = (header: string, width: number, index: number) => SELECT_HEADERS.has(header.toLowerCase()) || (!header && width < 70 && index === 0)
export function fixtureCell(slug: string, header: string, row: number, variant?: string): string {
  const key = header.toLowerCase().trim()
  if (!key) return ''
  const sentinel = sentinelCell(slug, key, row, variant)
  if (sentinel !== undefined) return sentinel
  const forge = forgeCell(slug, key, row)
  if (forge !== undefined) return forge
  const aliases: Record<string, string> = {
    'family & type': 'family and type', 'category / type': 'category', 'id': 'element id',
    'assign categories': 'category', categories: 'category', 'level name': 'level', 'sheet name': 'view',
    'room number': 'number', 'description': 'parameter',
  }
  const values = TOOL_COLUMNS[slug]?.[key] ?? COMMON_COLUMNS[key] ?? COMMON_COLUMNS[aliases[key]]
  return values?.[row % values.length] ?? '—'
}

const RUN_OUTCOMES: Record<string, readonly [unit: string, result: string, defaultCount: number]> = {
  'assign-room-properties': ['elements', 'Prepared room-property writes from containing rooms; unmatched elements stay unchanged.', 12],
  'auto-dimension': ['views', 'Created dimension strings from the selected references; references outside the crop were skipped.', 2],
  'compliance-guard': ['candidates', 'Classified the audit findings by CAD line style, pin status, or Workset1 assignment.', 3],
  'copy-param-from-link': ['elements', 'Mapped the chosen room text property to the writable destination parameter.', 8],
  'detail-view': ['cuts', 'Created section and callout previews from the sampled cut lines.', 3],
  'deviation-inspector': ['elements', 'Classified the measured results against the tolerance; unmeasured records remain unresolved.', 3],
  'duplicates-resolver': ['groups', 'Kept the primary instance for each eligible group; review-only extras stay unchanged.', 3],
  'excel-to-schedule': ['worksheets', 'Mapped the selected worksheets to schedule names, preserving their column headings.', 2],
  'family-name-editor': ['families', 'Checked names against the convention and prepared the eligible rename targets.', 3],
  'family-name-synchronizer': ['families', 'Matched project families by Type Mark; families without a match stay unchanged.', 3],
  'family-param-transfer': ['definitions', 'Transferred the parameter definition with its data type and binding.', 1],
  'filter-usage-checker': ['filters', 'Summarized view and template usage so unused and drifting filters can be reviewed.', 3],
  'fr-to-finishes': ['regions', 'Converted closed filled-region boundaries using the selected finish type and level.', 3],
  'graphic-overviews': ['drafting views', 'Created a graphic standards legend with the current text type and spacing.', 1],
  'group-manager': ['group types', 'Prepared the group report with instance counts, member counts, and type IDs.', 3],
  'in-place-converter': ['families', 'Prepared Generic Model family copies from the solids; the source instances stay in place.', 3],
  'make-pattern': ['patterns', 'Built the pattern definition from the selected linework using the current scale and angle.', 1],
  'manage-dimension': ['dimensions', 'Reviewed the references and prepared the selected dimension operation.', 6],
  'manage-text': ['notes', 'Applied the selected text operation to the preview records.', 3],
  'match-opening': ['openings', 'Compared link dimensions with host openings; matched openings stay unchanged.', 3],
  'mirrored-auditor': ['elements', 'Reviewed hand and facing orientation; only eligible mirrored elements are changed.', 3],
  'model-query-pro': ['findings', 'Read the sample scope and returned matching evidence for the chosen review profile.', 3],
  'off-axis-resolver': ['elements', 'Compared the measured angle with the nearest orthogonal axis and separated review-only cases.', 3],
  'parameter-colorizer': ['value groups', 'Applied the sample colour scheme by parameter value, with a separate unassigned group.', 5],
  'parameter-manager': ['definitions', 'Prepared the checked parameter edits with binding and category details.', 3],
  'parameter-mapping': ['elements', 'Copied compatible source values to the mapped destination parameters.', 6],
  'point-cloud-slicer': ['levels', 'Prepared one 3D view and one floor plan per level, each clipped to its storey.', 2],
  'reorder-pro': ['elements', 'Recomputed the numbering preview; already-correct values and ineligible targets stay unchanged.', 3],
  'replace-materials': ['types', 'Prepared the in-scope material changes and retained the original material in excluded categories.', 4],
  'room-height-adjust': ['rooms', 'Prepared lower upper limits from the first valid ceiling above each room.', 3],
  'room-level-assigner': ['rooms', 'Prepared the chosen target-level reassignment and retained room numbers.', 3],
  'scope-box-synchronizer': ['scope boxes', 'Compared the host and master-link extents; matching boxes stay unchanged.', 3],
  'section-box': ['3D views', 'Applied the bounding box of the sample selection with the requested padding.', 1],
  'shared-param-manager': ['definitions', 'Prepared a shared-parameter definition file with the displayed data types and groups.', 3],
  'sheet-export': ['sheets', 'Prepared the publishing set with the chosen output settings and sheet file names.', 3],
  'spell-check': ['sheets', 'Checked note and sheet text against the project dictionary and flagged terms for review.', 3],
  'structural-qa': ['elements', 'Reviewed the selected structural check and flagged results outside tolerance.', 3],
  'template-manager': ['templates', 'Prepared the template transfer with the selected source, destination, and conflict rule.', 2],
  'text-tag-align': ['annotations', 'Moved the sample notes and tags onto the primary reference in the active view.', 4],
  'update-schedule': ['changes', 'Prepared the spreadsheet value updates; unmatched rows and read-only columns were skipped.', 3],
  'view-manager': ['views', 'Prepared the requested operation for the selected project views.', 3],
  'vp-manager': ['viewports', 'Prepared the selected viewport operation while retaining the reference viewport.', 3],
  'workset-manager': ['element types', 'Compared existing worksets with prefix and category rules and prepared eligible reassignments.', 4],
}

export function fixtureResult(slug: string, action: string, count?: number, setting?: string): string {
  const outcome = RUN_OUTCOMES[slug]
  if (!outcome) return `${action} completed on the sample project.`
  const [unit, detail, defaultCount] = outcome
  const scope = count ?? defaultCount
  const unitLabel = scope === 1 ? (unit.endsWith('ies') ? unit.slice(0, -3) + 'y' : unit.replace(/s$/, '')) : unit
  return `${action} · ${scope} ${unitLabel} in scope. ${detail}${setting ? ` Setting: ${setting}.` : ''}`
}
