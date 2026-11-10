// Sample BIM data for the simulations: an invented two-storey residence. Not a real project.

export interface Sheet { id: number; number: string; name: string; titleBlock: string; revision: string; views: number; inSheetList: boolean; placeholder: boolean; drawnBy?: string; checkedBy?: string; addedRevisions?: string[] }
export const SHEETS: Sheet[] = [
  { id: 101, number: 'A-000', name: 'Cover Sheet', titleBlock: 'A1 Landscape', revision: 'P02', views: 1, inSheetList: true, placeholder: false },
  { id: 102, number: 'A-001', name: 'Drawing List', titleBlock: 'A1 Landscape', revision: 'P02', views: 1, inSheetList: true, placeholder: false },
  { id: 103, number: 'A-101', name: 'Ground Floor Plan', titleBlock: 'A1 Landscape', revision: 'P02', views: 2, inSheetList: true, placeholder: false },
  { id: 104, number: 'A-102', name: 'First Floor Plan', titleBlock: 'A1 Landscape', revision: 'P02', views: 2, inSheetList: true, placeholder: false },
  { id: 105, number: 'A-103', name: 'Roof Plan', titleBlock: 'A1 Landscape', revision: 'P01', views: 1, inSheetList: true, placeholder: false },
  { id: 106, number: 'A-201', name: 'Elevations - North and South', titleBlock: 'A1 Landscape', revision: 'P01', views: 2, inSheetList: true, placeholder: false },
  { id: 107, number: 'A-202', name: 'Elevations - East and West', titleBlock: 'A1 Landscape', revision: 'P01', views: 2, inSheetList: true, placeholder: false },
  { id: 108, number: 'A-301', name: 'Sections A-A and B-B', titleBlock: 'A1 Landscape', revision: 'P01', views: 2, inSheetList: true, placeholder: false },
  { id: 109, number: 'A-401', name: 'Ground Floor Reflected Ceiling Plan', titleBlock: 'A1 Landscape', revision: '—', views: 1, inSheetList: true, placeholder: false },
  { id: 110, number: 'A-501', name: 'Kitchen Interior Elevations', titleBlock: 'A1 Landscape', revision: '—', views: 4, inSheetList: true, placeholder: false },
  { id: 111, number: 'A-601', name: 'Door and Window Schedules', titleBlock: 'A1 Landscape', revision: '—', views: 2, inSheetList: true, placeholder: false },
  { id: 112, number: 'A-701', name: 'Wall Details', titleBlock: '—', revision: '—', views: 0, inSheetList: true, placeholder: true },
]

export interface Room { id: number; number: string; name: string; level: string; area: number; status: 'Ready' | 'Review'; note: string; straightWalls?: number }
export const ROOMS: Room[] = [
  { id: 201, number: '101', name: 'Living Room', level: 'Level 01', area: 32.4, straightWalls: 5, status: 'Ready', note: '' },
  { id: 202, number: '102', name: 'Kitchen', level: 'Level 01', area: 14.8, status: 'Ready', note: '' },
  { id: 203, number: '103', name: 'Dining', level: 'Level 01', area: 16.2, status: 'Ready', note: '' },
  { id: 204, number: '104', name: 'Powder Room', level: 'Level 01', area: 3.1, status: 'Ready', note: '' },
  { id: 205, number: '105', name: 'Entrance Hall', level: 'Level 01', area: 9.6, straightWalls: 3, status: 'Review', note: 'Curved boundary segment: skipped for elevations' },
  { id: 206, number: '201', name: 'Master Bedroom', level: 'Level 02', area: 21.0, status: 'Ready', note: '' },
  { id: 207, number: '202', name: 'Bedroom 2', level: 'Level 02', area: 14.2, status: 'Ready', note: '' },
  { id: 208, number: '203', name: 'Bathroom', level: 'Level 02', area: 7.4, status: 'Ready', note: '' },
  { id: 209, number: '204', name: 'Study', level: 'Level 02', area: 10.5, status: 'Ready', note: '' },
]

export type Severity = 'Critical' | 'Warning' | 'Info'
export interface WarningGroup { id: number; severity: Severity; description: string; count: number; elements: number[] }
// Revit's own warning messages; counts and element IDs are sample values.
export const WARNINGS: WarningGroup[] = [
  { id: 1, severity: 'Critical', description: 'There are identical instances in the same place. This will result in double counting in schedules.', count: 14, elements: [348211, 348212, 348390, 348391, 351002, 351003, 352117, 352118] },
  { id: 2, severity: 'Critical', description: 'Highlighted walls overlap. One of them may be ignored when Revit finds room boundaries. Use Cut Geometry to embed one wall within the other.', count: 9, elements: [301144, 301178, 302210, 302245, 303001, 303017] },
  { id: 3, severity: 'Critical', description: 'Room is not in a properly enclosed region', count: 2, elements: [410022, 410031] },
  { id: 4, severity: 'Warning', description: 'Highlighted floors overlap.', count: 6, elements: [288410, 288412, 288530, 288531] },
  { id: 5, severity: 'Warning', description: 'Multiple Rooms are in the same enclosed region. The correct area and perimeter will be assigned to one Room and the others will display "Not Enclosed".', count: 3, elements: [410044, 410045, 410051] },
  { id: 6, severity: 'Warning', description: 'Highlighted room separation lines overlap.', count: 4, elements: [512003, 512004, 512019, 512020] },
  { id: 7, severity: 'Warning', description: 'Line is slightly off axis and may cause inaccuracies.', count: 37, elements: [620001, 620014, 620027, 620033, 620048] },
  { id: 8, severity: 'Warning', description: 'Wall is slightly off axis and may cause inaccuracies.', count: 11, elements: [301500, 301502, 301517] },
  { id: 9, severity: 'Critical', description: 'Elements have duplicate "Mark" values.', count: 8, elements: [355210, 355211, 355240, 355241] },
]

export interface PurgeItem { id: number; tag: string; name: string; info: string; detail: string; used: boolean }
// The tool scans these kinds: Materials, Fill patterns, View filters, View templates, Line patterns,
// Line styles, Filled regions, Text note types, Model and Detail groups (plus opt-in unplaced rooms and areas).
export const PURGE: PurgeItem[] = [
  { id: 901, tag: 'MAT', name: 'Concrete - Cast In Situ', info: 'Material', detail: 'Used in 6 types', used: true },
  { id: 902, tag: 'MAT', name: 'Concrete - Cast In Situ 1', info: 'Material', detail: 'Duplicate copy', used: false },
  { id: 903, tag: 'MAT', name: 'Glass - Clear 2', info: 'Material', detail: 'Not referenced', used: false },
  { id: 904, tag: 'PAT', name: 'Diagonal crosshatch 3mm', info: 'Drafting pattern', detail: 'Not referenced', used: false },
  { id: 905, tag: 'PAT', name: 'Tile 300x300', info: 'Model pattern', detail: 'Used by 2 materials', used: true },
  { id: 906, tag: 'V-F', name: 'Fire Rated Walls - OLD', info: 'View filter', detail: 'On 0 views or templates', used: false },
  { id: 907, tag: 'V-F', name: 'Demolition', info: 'View filter', detail: 'On 4 views', used: true },
  { id: 908, tag: 'V-T', name: 'Arch Plan 1:100 copy', info: 'View template', detail: 'Assigned to 0 views', used: false },
  { id: 909, tag: 'L-P', name: 'IMPORT-DASHED2', info: 'Line pattern', detail: 'Brought in by a CAD import', used: false },
  { id: 910, tag: 'L-S', name: 'IMPORT-A-WALL', info: 'Line style', detail: 'Brought in by a CAD import', used: false },
  { id: 911, tag: 'L-S', name: '<Thin Lines>', info: 'Line style', detail: 'System line style', used: true },
  { id: 912, tag: 'F-R', name: 'Solid Black 2', info: 'Filled region type', detail: 'Not referenced', used: false },
  { id: 913, tag: 'TXT', name: '2.5mm Arial copy', info: 'Text note type', detail: 'Not referenced', used: false },
  { id: 914, tag: 'D-G', name: 'Kitchen Island Detail', info: 'Detail group', detail: 'Not placed', used: false },
  { id: 915, tag: 'TXT', name: '2.5mm Arial', info: 'Text note type', detail: 'Project default', used: true },
]
export const PURGE_KINDS: Record<string, string> = {
  MAT: 'Materials', PAT: 'Fill patterns', 'V-F': 'View filters', 'V-T': 'View templates', 'L-P': 'Line patterns',
  'L-S': 'Line styles', 'F-R': 'Filled regions', TXT: 'Text note types', 'M-G': 'Model groups', 'D-G': 'Detail groups',
}

export interface ParamElement { id: number; category: string; family: string; type: string; values: Record<string, string>; activeView?: boolean }
export const PARAM_CATEGORIES = ['Doors', 'Windows', 'Furniture']
export const PARAMS: Record<string, { name: string; isType: boolean }[]> = {
  Doors: [{ name: 'Comments', isType: false }, { name: 'Mark', isType: false }, { name: 'Fire Rating', isType: true }, { name: 'Type Comments', isType: true }],
  Windows: [{ name: 'Comments', isType: false }, { name: 'Mark', isType: false }, { name: 'Type Mark', isType: true }],
  Furniture: [{ name: 'Comments', isType: false }, { name: 'Mark', isType: false }],
}
export const ELEMENTS: ParamElement[] = [
  { id: 355210, activeView: true, category: 'Doors', family: 'Single-Flush', type: '900 x 2100mm', values: { Comments: 'internal', Mark: 'D01', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 355211, category: 'Doors', family: 'Single-Flush', type: '900 x 2100mm', values: { Comments: 'internal', Mark: 'D02', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 355240, activeView: true, category: 'Doors', family: 'Single-Flush', type: '800 x 2100mm', values: { Comments: 'internal - bathroom', Mark: 'D03', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 355241, category: 'Doors', family: 'Double-Glass', type: '1800 x 2100mm', values: { Comments: 'external', Mark: 'D04', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 355300, activeView: true, category: 'Doors', family: 'Single-Flush', type: '900 x 2100mm', values: { Comments: 'internal', Mark: 'D05', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 361001, category: 'Windows', family: 'Fixed', type: '1200 x 1500mm', values: { Comments: 'living', Mark: 'W01', 'Type Mark': 'W-A' } },
  { id: 361002, activeView: true, category: 'Windows', family: 'Casement', type: '600 x 1200mm', values: { Comments: 'kitchen', Mark: 'W02', 'Type Mark': 'W-B' } },
  { id: 371010, activeView: true, category: 'Furniture', family: 'Sofa', type: '3 Seater', values: { Comments: 'FF&E', Mark: 'F01' } },
]

export const FLOOR_TYPES = ['Finish - Porcelain Tile 10mm', 'Finish - Engineered Oak 15mm', 'Finish - Screed 40mm']
export const CEILING_TYPES = ['Gypsum Board 12.5mm', 'Acoustic Tile 600x600']
export const WALL_TYPES = ['Interior - Plaster Lining 15mm', 'Interior - Ceramic Tile 12mm']
export const TEMPLATES = ['<None>', 'Interior Plan 1:50', 'Interior RCP 1:50', 'Interior Elevation 1:25', '3D Room Review']
export const SCALES = ['1:20', '1:25', '1:50', '1:100']

// Canonical fictional fixture. Never populated from the user's open Revit document.
export interface ResidenceLevel { id: number; name: string; elevation: number }
export interface ResidenceView { id: number; name: string; kind: string; level: string; spotCount: number; sheet: string }
export interface ResidenceLink { id: number; name: string; kind: 'Revit' | 'CAD'; loaded: boolean; pinned: boolean; instances: number; path: string; view: string; attachment: string; status: string; verdict: string }
export interface ResidenceInPlaceFamily { id: number; name: string; category: string; instances: number; owner: string; workset: string }
export interface ResidenceRegion { id: number; name: string; kind: 'Filled' | 'Masking'; type: string; dependents: number; dependentIds: number[]; masking: boolean }
export interface ResidenceFloorCeiling { id: number; name: string; kind: 'Floor' | 'Ceiling'; type: string; level: string; loops: number; sketchLoops: number[][][]; dependents: number; dependentIds: number[] }
const levels: ResidenceLevel[] = [{ id: 1, name: 'Level 01', elevation: 0 }, { id: 2, name: 'Level 02', elevation: 3.3 }, { id: 3, name: 'Roof', elevation: 6.6 }]
const views: ResidenceView[] = [
  { id: 11, name: 'Level 01 – Floor Plan', kind: 'FloorPlan', level: 'Level 01', spotCount: 8, sheet: 'A-101' },
  { id: 12, name: 'Level 02 – Floor Plan', kind: 'FloorPlan', level: 'Level 02', spotCount: 6, sheet: 'A-102' },
  { id: 13, name: 'North Elevation', kind: 'Elevation', level: 'Level 01', spotCount: 5, sheet: 'A-201' },
  { id: 14, name: 'Section A–A', kind: 'Section', level: 'Level 01', spotCount: 4, sheet: 'A-301' },
  { id: 15, name: 'Coordination Plan', kind: 'FloorPlan', level: 'Level 01', spotCount: 0, sheet: '' },
  { id: 16, name: 'Navisworks', kind: 'ThreeD', level: '', spotCount: 0, sheet: '' },
]
export const LINK_FIXTURES: ResidenceLink[] = [
  { id: 7101, name: 'Sample Residence – Architecture.rvt', kind: 'Revit', loaded: true, pinned: true, instances: 1, path: 'C:/Sample Residence/Architecture.rvt', view: '(Model-wide)', attachment: 'Overlay', status: 'Loaded', verdict: 'OK' },
  { id: 7102, name: 'Sample Residence – Structure.rvt', kind: 'Revit', loaded: true, pinned: true, instances: 1, path: 'C:/Sample Residence/Structure.rvt', view: '(Model-wide)', attachment: 'Overlay', status: 'Loaded', verdict: 'OK' },
  { id: 7103, name: 'Sample Residence – MEP.rvt', kind: 'Revit', loaded: true, pinned: false, instances: 1, path: 'C:/Sample Residence/MEP.rvt', view: '(Model-wide)', attachment: 'Attachment', status: 'Loaded', verdict: 'Review' },
  { id: 7104, name: 'Sample Residence – Landscape.rvt', kind: 'Revit', loaded: false, pinned: true, instances: 1, path: 'C:/Sample Residence/Landscape.rvt', view: '(Model-wide)', attachment: 'Overlay', status: 'Unloaded', verdict: 'Review' },
  { id: 7201, name: 'Site Survey.dwg', kind: 'CAD', loaded: true, pinned: true, instances: 1, path: 'C:/Sample Residence/Site Survey.dwg', view: '(Model-wide)', attachment: 'Linked CAD', status: 'Linked CAD', verdict: 'OK' },
  { id: 7202, name: 'Kitchen Detail.dwg', kind: 'CAD', loaded: true, pinned: false, instances: 1, path: '(Embedded)', view: 'Level 01 – Floor Plan', attachment: 'Embedded CAD', status: 'Embedded CAD', verdict: 'Fail' },
  { id: 7203, name: 'Boundary.dwg', kind: 'CAD', loaded: true, pinned: false, instances: 1, path: 'C:/Sample Residence/Boundary.dwg', view: '(Model-wide)', attachment: 'Linked CAD', status: 'Linked CAD', verdict: 'Review' },
]
export const IN_PLACE_FAMILIES: ResidenceInPlaceFamily[] = [
  { id: 8101, name: 'Kitchen bulkhead', category: 'Generic Models', instances: 24, owner: 'Sample Architect', workset: 'Interiors' },
  { id: 8102, name: 'Entrance canopy', category: 'Roofs', instances: 8, owner: 'Sample Architect', workset: 'Architecture' },
  { id: 8103, name: 'Feature wall', category: 'Walls', instances: 7, owner: 'Sample Architect', workset: 'Interiors' },
  { id: 8104, name: 'Vanity surround', category: 'Casework', instances: 6, owner: 'Sample Architect', workset: 'Interiors' },
  { id: 8105, name: 'Stair soffit', category: 'Generic Models', instances: 5, owner: 'Sample Architect', workset: 'Architecture' },
  { id: 8106, name: 'Window reveal', category: 'Generic Models', instances: 4, owner: 'Sample Architect', workset: 'Architecture' },
  { id: 8107, name: 'Pergola beam', category: 'Structural Framing', instances: 3, owner: 'Sample Architect', workset: 'Structure' },
  { id: 8108, name: 'Garden planter', category: 'Planting', instances: 2, owner: 'Sample Architect', workset: 'Architecture' },
  { id: 8109, name: 'Stone niche', category: 'Generic Models', instances: 0, owner: 'Sample Architect', workset: 'Interiors' },
]
const regions: ResidenceRegion[] = [
  { id: 9101, name: 'Tile', kind: 'Filled', type: 'Tile 300x300', dependents: 1, dependentIds: [9191], masking: false },
  { id: 9102, name: 'Screed', kind: 'Filled', type: 'Diagonal crosshatch 3mm', dependents: 0, dependentIds: [], masking: false },
  { id: 9103, name: 'Masking region', kind: 'Masking', type: 'Masking Region', dependents: 0, dependentIds: [], masking: true },
]
const loop = (x: number) => [[x, 0], [x + 4, 0], [x + 4, 3], [x, 3]]
const floorCeilings: ResidenceFloorCeiling[] = [
  { id: 9201, name: 'Ground floor finish', kind: 'Floor', type: FLOOR_TYPES[0], level: 'Level 01', loops: 2, sketchLoops: [loop(0), loop(5)], dependents: 1, dependentIds: [9291] },
  { id: 9202, name: 'First floor finish', kind: 'Floor', type: FLOOR_TYPES[1], level: 'Level 02', loops: 3, sketchLoops: [loop(0), loop(5), loop(10)], dependents: 0, dependentIds: [] },
  { id: 9301, name: 'Ground floor ceiling', kind: 'Ceiling', type: CEILING_TYPES[0], level: 'Level 01', loops: 2, sketchLoops: [loop(0), loop(5)], dependents: 0, dependentIds: [] },
]
const worksets = ['Architecture', 'Interiors', 'Structure', 'Shared Levels and Grids'].map((name, i) => ({ id: 51 + i, name, visible: true, isOpen: true }))
export const sampleResidence = {
  fictional: true as const, name: 'Sample Residence', label: 'Sample data, fictional', levels, rooms: ROOMS, views, sheets: SHEETS,
  families: ELEMENTS.map(({ family, category, type }, i) => ({ id: 6000 + i, name: family, category, types: [type] })),
  types: ELEMENTS.map(({ type, family }, i) => ({ id: 6100 + i, name: type, family })), parameters: PARAMS, elements: ELEMENTS,
  links: LINK_FIXTURES, cadImports: LINK_FIXTURES.filter((link) => link.kind === 'CAD'), inPlaceFamilies: IN_PLACE_FAMILIES,
  regions, filledRegions: regions.filter((r) => !r.masking), maskingRegions: regions.filter((r) => r.masking), floorCeilings,
  floors: floorCeilings.filter((f) => f.kind === 'Floor'), ceilings: floorCeilings.filter((f) => f.kind === 'Ceiling'),
  walls: [
    { id: 301144, name: 'Entry partition', type: 'Interior – GWB 125 mm', level: 'Level 01', lengthMm: 4200, heightMm: 3000, start: [0, 0], end: [4200, 0] },
    { id: 301178, name: 'Kitchen service wall', type: 'Interior – GWB 150 mm', level: 'Level 01', lengthMm: 3600, heightMm: 3000, start: [4200, 0], end: [4200, 3600] },
    { id: 302210, name: 'Bedroom separation', type: 'Interior – Acoustic 150 mm', level: 'Level 02', lengthMm: 3400, heightMm: 2850, start: [0, 3600], end: [3400, 3600] },
  ],
  detailLines: [{ id: 9401, name: 'Split detail line', start: [0, 0], end: [15, 10] }],
  spotElevations: views.flatMap((view) => Array.from({ length: view.spotCount }, (_, i) => ({ id: view.id * 100 + i, viewId: view.id, view: view.name, value: i * .15, pattern: 'Solid' }))),
  linePatterns: [{ id: -1, name: 'Solid' }, { id: 9501, name: 'Dash' }, { id: 9502, name: 'Hidden' }],
  textTypes: ['2.5 mm Arial', '3.5 mm Arial', '2.5 mm Segoe UI'],
  textNotes: ['EXISTING WALL TO REMAIN', 'NEW  PARTITION', 'SEE “DETAIL A-501”', '12mm GWB above FFL.', 'FINISH FLOOR LEVEL', 'WALL LINING', 'REFER TO STRUCTURE', 'TYPICAL DETAIL'].map((text, i) => ({ id: 9601 + i, text, sheet: i < 4 ? 'A-101' : 'A-102', type: '2.5 mm Arial' })),
  worksets, categories: ['Walls', 'Doors', 'Windows', 'Floors', 'Structural Columns', 'Structural Framing'],
  warnings: WARNINGS, materials: ['Paint – Warm White', 'Concrete – Exposed', 'Oak – Natural', 'Porcelain – Matt Grey'],
  existingCoordPlan: 'Coordination Plan', existingNavisView: 'Navisworks',
}
export const SAMPLE_RESIDENCE = sampleResidence
/** Legacy generated-dialog choice labels are derived here, alongside the typed records. */
export const GENERATED_SAMPLE = {
  LEVELS: levels.map((v) => v.name), CATEGORIES: sampleResidence.categories, VIEWS: views.map((v) => v.name), ROOMS: ROOMS.map((r) => r.name),
  TEMPLATES: TEMPLATES.filter((t) => t !== '<None>'), PARAMETERS: ['Comments', 'Mark', 'Fire Rating', 'Type Mark', 'Finish', 'Department'],
  LINKS: LINK_FIXTURES.filter((l) => l.kind === 'Revit' && l.loaded).map((l) => l.name), MATERIALS: sampleResidence.materials,
  FAMILIES: sampleResidence.families.map((f) => f.name), TYPES: sampleResidence.types.map((t) => t.name),
  ROOM_PROPERTIES: ['Room Number', 'Room Name', 'Department', 'Level'], WORKSETS: worksets.map((w) => w.name), TEXT_TYPES: sampleResidence.textTypes,
}
