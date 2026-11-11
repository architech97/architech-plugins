import type { DialogShot } from '../data/types'
import type { DemoStep } from './types'

export type LauncherSuite = 'folio' | 'forge' | 'sentinel'
export interface LauncherTool { slug: string; name: string; description: string; keywords: string }
interface LauncherPanel { label: string; tools: LauncherTool[] }
interface LauncherDefinition { slug: string; title: string; subtitle: string; placeholder: string; example: string; examplePanel: string; panels: LauncherPanel[] }

// Ribbon order and descriptions from Layout.cs and the three native Home catalogues.
export const SUITE_HOME: Record<LauncherSuite, LauncherDefinition> = {
  folio: {
    slug: "folio-home", title: "Folio Home",
    subtitle: "Documentation and publishing tools for Revit",
    placeholder: "Search tools, e.g. RCP or PDF", example: "PDF", examplePanel: "View Templates",
    panels: [
      { label: "Views", tools: [
        { slug: "room-to-view", name: "Room to View", description: "Create and coordinate room plans, RCPs, elevations and 3D views, then place the package on sheets.", keywords: "interiors room package ceiling bathroom kitchen bedroom hotel" },
        { slug: "detail-view", name: "Detail View", description: "Create wall sections and ceiling, floor or wall detail callouts from cut lines.", keywords: "section callout joinery construction detail" },
        { slug: "view-manager", name: "View Manager", description: "Duplicate, rename and template views; convert supported view types or hide elements in many views.", keywords: "drafting legend floor reflected ceiling rcp dependent hide" },
      ] },
      { label: "View Templates", tools: [
        { slug: "template-manager", name: "Template Manager", description: "Transfer templates and filters, copy view graphics and element visibility, or manage CAD import visibility.", keywords: "transfer template transfer filter v/g visibility graphics hide unhide CAD imports off linked model office standards" },
        { slug: "graphic-overviews", name: "Graphic Overviews", description: "Document line, fill and material graphic standards as drafting views arranged on a sheet.", keywords: "standards legend lineweights line styles materials" },
      ] },
      { label: "Annotation", tools: [
        { slug: "text-tag-align", name: "Text/Tag Align", description: "Align selected text notes and tags in the active view.", keywords: "annotation align notes leaders" },
        { slug: "reorder-pro", name: "Reorder Pro", description: "Preview element renumbering with filters, ordering modes, spreadsheet exchange and saved profiles.", keywords: "mark number sequence order room door furniture" },
        { slug: "spell-check", name: "Spell Check", description: "Check Revit text for spelling and review suggestions.", keywords: "spelling words dictionary notes report" },
        { slug: "manage-text", name: "Manage Text", description: "Transform text case, find and replace, or merge and arrange selected notes into lines, stacks and tables.", keywords: "transform text merge text uppercase lowercase titlecase notes prefix suffix find replace spacing" },
        { slug: "spot-elevation-line", name: "Spot Elev Override", description: "Override line patterns of spot-elevation annotations across views.", keywords: "spot elevation line pattern graphics" },
      ] },
      { label: "Detailing", tools: [
        { slug: "manage-dimension", name: "Manage Dimension", description: "Merge compatible dimensions into a chain, create dimensions along a detail line, or re-anchor witness lines.", keywords: "dimension merge dimension with line combine chain witness references detail line reanchor re-anchor" },
        { slug: "auto-dimension", name: "Auto Dimension", description: "Create supported plan dimensions for rooms, facade openings and wall setting-out, with Keep/Undo review.", keywords: "automatic room clear size facade wall setting out" },
        { slug: "split-region-with-line", name: "Split Region with Line", description: "Split filled or masking regions along a detail line while preserving their type.", keywords: "filled region masking hatch split" },
        { slug: "make-pattern", name: "Make Pattern", description: "Create Revit fill patterns from linework or filled regions, and export PAT files.", keywords: "hatch fill pattern pat material drafting" },
      ] },
      { label: "Schedules", tools: [
        { slug: "excel-to-schedule", name: "Excel to Schedule", description: "Bring a formatted Excel worksheet into a Revit schedule table or refresh the existing table.", keywords: "spreadsheet worksheet table xlsx csv specification" },
        { slug: "update-schedule", name: "Update Schedule", description: "Export editable model/schedule parameters, review spreadsheet changes and write values back.", keywords: "bim data room door furniture parameters spreadsheet import export" },
      ] },
      { label: "Sheets", tools: [
        { slug: "sheet-manager", name: "Sheet Manager", description: "Create, duplicate and organize sheets. Review renumbering and renaming in the grid or through Excel.", keywords: "sheet maker sheet renamer placeholders batch sheet number sheet name spreadsheet xlsx title block revisions drawing set" },
        { slug: "vp-manager", name: "VP Manager", description: "Align viewports, match crops, manage titles and detail numbers, pin or move between sheets.", keywords: "viewport align crop title detail number pin move" },
      ] },
      { label: "Publish", tools: [
        { slug: "sheet-export", name: "Sheet Export", description: "Preflight and publish sheets/views with profiles, naming, export formats and output records.", keywords: "pdf dwg dgn dwf nwc ifc image xml publish drawing register export" },
      ] },
    ],
  },
  forge: {
    slug: "forge-home", title: "Forge Home",
    subtitle: "Rooms, finishes and BIM data tools for Revit",
    placeholder: "Search tools, e.g. ceiling or point cloud", example: "point cloud", examplePanel: "Scan to BIM",
    panels: [
      { label: "Rooms", tools: [
        { slug: "room-level-assigner", name: "Room Level Assigner", description: "Move selected rooms to a reviewed level while checking room data, extents and tags.", keywords: "reassign storey story relocate room schedule" },
        { slug: "room-height-adjust", name: "Room Height Adjust", description: "Preview and adjust room upper limits to the ceilings above them.", keywords: "room volume ceiling underside limit offset height" },
        { slug: "match-opening", name: "Match Opening", description: "Compare linked wall openings with the host and review where to create or resize openings.", keywords: "coordination structural link door window penetration clearance" },
      ] },
      { label: "Finishes", tools: [
        { slug: "room-to-finishes", name: "Room to Finishes", description: "Create or update finish floors, wall linings and ceilings from selected rooms.", keywords: "interiors room boundaries floor skirting ceiling finishes lining finish schedule" },
        { slug: "fr-to-finishes", name: "FR to Finishes", description: "Convert filled regions in a plan, section or elevation into modelled finish elements.", keywords: "filled region detail 2D floor wall ceiling RCP" },
        { slug: "split-floor-ceiling", name: "Split Floor / Ceiling", description: "Split separate loops in a floor or ceiling sketch into individual elements. Review dependent deletions before applying.", keywords: "slab split sketch loops openings tags hosted families" },
        { slug: "replace-materials", name: "Replace Materials", description: "Scan material use and replace the reviewed layer or parameter references in scope.", keywords: "palette finish specification compound layers wall floor ceiling type" },
      ] },
      { label: "Parameters", tools: [
        { slug: "shared-param-manager", name: "Shared Param Manager", description: "Organize shared parameter definitions and bind them to project categories.", keywords: "shared parameter GUID TXT Excel categories bindings standards" },
        { slug: "parameter-manager", name: "Parameter Manager", description: "Manage project and family parameter definitions, formulas, categories and profiles.", keywords: "rename duplicate family parameters Excel CSV formulas" },
        { slug: "parameter-mapping", name: "Parameter Mapping", description: "Map source parameter values to target parameters across selected categories, families and types.", keywords: "copy map values scheme preset category family type" },
        { slug: "one-parameter", name: "One Parameter", description: "Preview and bulk-edit values for one parameter, including find and replace, prefixes and suffixes.", keywords: "bulk update rename values text instance type" },
        { slug: "family-param-transfer", name: "Family Param Transfer", description: "Copy parameter definitions between loaded families or RFA files.", keywords: "family shared definition GUID RFA copy transfer" },
        { slug: "assign-room-properties", name: "Assign Room Properties", description: "Write reviewed room values to parameters on elements located in those rooms.", keywords: "FF&E furniture room data room number finish codes host link mapping" },
        { slug: "copy-param-from-link", name: "Copy Param from Link", description: "Copy one room text parameter from the host or a selected link onto target elements.", keywords: "linked rooms phase map room name room number text" },
      ] },
      { label: "Scan to BIM", tools: [
        { slug: "point-cloud-slicer", name: "Point Cloud Slicer", description: "Create or update level-based 3D section boxes and floor plan crops for a point cloud.", keywords: "Scan to BIM survey RCP RCS slice levels story section box" },
        { slug: "point-cloud-on-off", name: "Point Cloud On/Off", description: "Toggle the active view's point-cloud visibility. The original command checks the view and its template.", keywords: "hide show toggle pointcloud scan visibility graphics undo" },
        { slug: "deviation-inspector", name: "Deviation Inspector", description: "Sample distances from a point cloud to model surfaces and review deviations against a tolerance.", keywords: "scan survey quality QA P95 mean maximum tolerance compare geometry" },
      ] },
    ],
  },
  sentinel: {
    slug: "sentinel-home", title: "Sentinel Home",
    subtitle: "Model health, coordination and BIM standards tools",
    placeholder: "Search tools, e.g. warnings or worksets", example: "warnings", examplePanel: "Model Health",
    panels: [
      { label: "Model Health", tools: [
        { slug: "model-health", name: "Model Health", description: "Audit the active model with inventory reports and rule checksets. Review the results in a dashboard, HTML report or Excel.", keywords: "model checker health score bim audit report checkset xlsx inventory performance" },
        { slug: "warnings-inspector", name: "Warnings Inspector", description: "Group Revit warnings by severity and frequency, locate affected elements and export the findings.", keywords: "warning severity failure element id inspect select isolate" },
        { slug: "in-place-inspector", name: "In-Place Inspector", description: "Find in-place families, review instance counts and isolate a family's instances in 3D.", keywords: "in place inplace families instance count sync performance" },
        { slug: "in-place-converter", name: "In-Place Converter", description: "Export selected in-place solids as loadable Generic Model families while retaining the original elements.", keywords: "in place inplace convert family rfa generic model solids" },
        { slug: "mirrored-auditor", name: "Mirrored Auditor", description: "Review mirrored instances and hand or facing flips. Isolate findings or export them for coordination.", keywords: "mirror flip hand facing door window handedness" },
        { slug: "structural-qa", name: "Structural QA", description: "Screen column-to-grid offsets and beam-end contacts. Review the geometric findings before coordination.", keywords: "structural quality columns beams grid alignment connection framing" },
      ] },
      { label: "Coordination", tools: [
        { slug: "section-box", name: "Section Box", description: "Crop a 3D view around selected elements and choose the padding and target view.", keywords: "3d crop zoom cutaway isolate section bounding box" },
        { slug: "coord-plan", name: "Coord Plan", description: "Create a floor plan for coordination with grids, levels, site context and linked models visible.", keywords: "coordination floor plan grids levels site survey project base point" },
        { slug: "navis-view", name: "Navis View", description: "Create a 3D coordination view with graphics configured for Navisworks. Use batch mode to create views by workset or category.", keywords: "navisworks export coordination 3d isometric batch workset" },
        { slug: "scope-box-synchronizer", name: "Scope Box Sync", description: "Compare host scope boxes against a linked master model, review differences and sync coordinated extents.", keywords: "scope boxes copy align synchronize links extents view range" },
      ] },
      { label: "Links", tools: [
        { slug: "links-inspector", name: "Links Inspector", description: "Review Revit and CAD links, their load and pin states, and the views that own CAD imports.", keywords: "rvt dwg cad link path loaded attached pinned embedded manage links" },
        { slug: "pin-unpin-links", name: "Pin-Unpin Links", description: "Check link placement and pin or unpin Revit and CAD links in one operation.", keywords: "pin unpin protect dwg rvt lock link placement" },
      ] },
      { label: "Standards", tools: [
        { slug: "model-query-pro", name: "Model Query Pro", description: "Find model elements with parameter rules. Open Review Center for scoped audits, comparisons and accepted exceptions.", keywords: "model query review center architecture interiors pre-handover filters parameter regex" },
        { slug: "parameter-colorizer", name: "Parameter Colorizer", description: "Preview parameter values by category and color elements in the active view to spot missing or inconsistent values.", keywords: "parameter color colour graphics missing data qa active view" },
        { slug: "workset-manager", name: "Workset Manager", description: "Compare family and type worksets with BIM rules and assign worksets in bulk in a workshared model.", keywords: "worksets worksharing bep compliance assign families xlsx" },
        { slug: "family-name-editor", name: "Family Name Editor", description: "Review and batch-rename loadable families using category-specific naming rules or find and replace.", keywords: "family naming standard prefix suffix rename compliance bep" },
        { slug: "family-name-synchronizer", name: "Family Name Sync", description: "Compare project families with a container model and sync selected names using Type Mark or bracketed suffixes.", keywords: "family naming match container type mark sync rename library" },
        { slug: "filter-usage-checker", name: "Filter Usage Checker", description: "Find where view filters are used, identify unused filters and apply changes across views and templates.", keywords: "view filter usage template add remove unused graphics" },
      ] },
      { label: "Clean Up", tools: [
        { slug: "duplicates-resolver", name: "Duplicates Resolver", description: "Find family instances of the same type in the same location. Choose the instance to keep before merging or deleting duplicates.", keywords: "duplicate overlaps repeated family instances same position merge delete" },
        { slug: "off-axis-resolver", name: "Off-Axis Resolver", description: "Find elements slightly off axis, review the measured deviations and apply selected corrections.", keywords: "off axis offaxis skew angle orthogonal walls lines alignment" },
        { slug: "purge-and-merge", name: "Purge & Merge", description: "Review used and unused project content. Purge selected items or merge duplicate definitions and redirect their references.", keywords: "purge cleanup merge materials line styles filled regions patterns filters templates unused" },
        { slug: "group-manager", name: "Group Manager", description: "Inspect detail and model groups, find their instances and review which model groups to ungroup.", keywords: "detail groups model groups instances ungroup select isolate" },
        { slug: "compliance-guard", name: "Compliance Guard", description: "Review CAD-style line candidates, check asset pinning and inspect Workset1 usage.", keywords: "compliance cad line styles sketches model lines pin workset1 cleanup" },
      ] },
    ],
  },
}

export function suiteHomeSteps(suite: LauncherSuite): DemoStep[] {
  const { example, examplePanel } = SUITE_HOME[suite]
  return [
    { id: 'browse', title: 'Browse the ribbon', hint: 'Choose ' + examplePanel + ' or another ribbon category.', target: 'suite-home-category' },
    { id: 'search', title: 'Find a tool by task', hint: 'Return to All tools and search for ' + example + ', or search inside the current category.', target: 'suite-home-search' },
    { id: 'select', title: 'Inspect the tool preview', hint: 'Choose a matching tool and check its description and availability.', target: 'suite-home-match' },
    { id: 'open', title: 'Open the sample tool', hint: 'Use the ready project context and open the selected browser demo.', target: 'suite-home-open' },
  ]
}

// The native WPF regression harness rendered these with fictional model data.
const folioMedia = 'media/dialogs/folio-home/folio-home-'
export const FOLIO_HOME_PREVIEWS: DialogShot[] = [
  { title: 'WPF fixture, All tools', dark: folioMedia + 'dark.png', light: folioMedia + 'light.png', source: 'reconstructed', w: 1080, h: 652 },
  { title: 'WPF fixture, Compact window', dark: folioMedia + 'dark-minimum.png', light: folioMedia + 'light-minimum.png', source: 'reconstructed', w: 846, h: 530 },
  { title: 'WPF fixture, No active model', light: folioMedia + 'no-model.png', source: 'reconstructed', w: 1080, h: 652 },
  { title: 'WPF fixture, Tool unavailable', dark: folioMedia + 'unavailable.png', source: 'reconstructed', w: 846, h: 530 },
  { title: 'WPF fixture, No search results', dark: folioMedia + 'empty.png', source: 'reconstructed', w: 846, h: 530 },
]
