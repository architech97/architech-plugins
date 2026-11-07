// Sample BIM data for the simulations: an invented two-storey residence. Not a real project.

export interface Sheet { id: number; number: string; name: string; titleBlock: string; revision: string; views: number; inSheetList: boolean; placeholder: boolean }
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

export interface Room { id: number; number: string; name: string; level: string; area: number; status: 'Ready' | 'Review'; note: string }
export const ROOMS: Room[] = [
  { id: 201, number: '101', name: 'Living Room', level: 'Level 01', area: 32.4, status: 'Ready', note: '' },
  { id: 202, number: '102', name: 'Kitchen', level: 'Level 01', area: 14.8, status: 'Ready', note: '' },
  { id: 203, number: '103', name: 'Dining', level: 'Level 01', area: 16.2, status: 'Ready', note: '' },
  { id: 204, number: '104', name: 'Powder Room', level: 'Level 01', area: 3.1, status: 'Ready', note: '' },
  { id: 205, number: '105', name: 'Entrance Hall', level: 'Level 01', area: 9.6, status: 'Review', note: 'Curved boundary segment: skipped for elevations' },
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
  { id: 7, severity: 'Info', description: 'Line is slightly off axis and may cause inaccuracies.', count: 37, elements: [620001, 620014, 620027, 620033, 620048] },
  { id: 8, severity: 'Info', description: 'Wall is slightly off axis and may cause inaccuracies.', count: 11, elements: [301500, 301502, 301517] },
  { id: 9, severity: 'Warning', description: 'Elements have duplicate "Mark" values.', count: 8, elements: [355210, 355211, 355240, 355241] },
]

export interface PurgeItem { id: number; tag: string; name: string; info: string; detail: string; used: boolean }
// The tool scans these kinds: Materials, Fill patterns, View filters, View templates, Line patterns,
// Line styles, Filled regions, Text note types, Model and Detail groups (plus opt-in unplaced rooms and areas).
export const PURGE: PurgeItem[] = [
  { id: 901, tag: 'MAT', name: 'Concrete - Cast In Situ', info: 'Material', detail: 'Used in 6 types', used: true },
  { id: 902, tag: 'MAT', name: 'Concrete - Cast In Situ 1', info: 'Material', detail: 'Imported copy', used: false },
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
]
export const PURGE_KINDS: Record<string, string> = {
  MAT: 'Materials', PAT: 'Fill patterns', 'V-F': 'View filters', 'V-T': 'View templates', 'L-P': 'Line patterns',
  'L-S': 'Line styles', 'F-R': 'Filled regions', TXT: 'Text note types', 'M-G': 'Model groups', 'D-G': 'Detail groups',
}

export interface ParamElement { id: number; category: string; family: string; type: string; values: Record<string, string> }
export const PARAM_CATEGORIES = ['Doors', 'Windows', 'Furniture']
export const PARAMS: Record<string, { name: string; isType: boolean }[]> = {
  Doors: [{ name: 'Comments', isType: false }, { name: 'Mark', isType: false }, { name: 'Fire Rating', isType: true }, { name: 'Type Comments', isType: true }],
  Windows: [{ name: 'Comments', isType: false }, { name: 'Mark', isType: false }, { name: 'Type Mark', isType: true }],
  Furniture: [{ name: 'Comments', isType: false }, { name: 'Mark', isType: false }],
}
export const ELEMENTS: ParamElement[] = [
  { id: 355210, category: 'Doors', family: 'Single-Flush', type: '900 x 2100mm', values: { Comments: 'internal', Mark: 'D01', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 355211, category: 'Doors', family: 'Single-Flush', type: '900 x 2100mm', values: { Comments: 'internal', Mark: 'D02', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 355240, category: 'Doors', family: 'Single-Flush', type: '800 x 2100mm', values: { Comments: 'internal - bathroom', Mark: 'D03', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 355241, category: 'Doors', family: 'Double-Glass', type: '1800 x 2100mm', values: { Comments: 'external', Mark: 'D04', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 355300, category: 'Doors', family: 'Single-Flush', type: '900 x 2100mm', values: { Comments: 'internal', Mark: 'D05', 'Fire Rating': '—', 'Type Comments': '' } },
  { id: 361001, category: 'Windows', family: 'Fixed', type: '1200 x 1500mm', values: { Comments: 'living', Mark: 'W01', 'Type Mark': 'W-A' } },
  { id: 361002, category: 'Windows', family: 'Casement', type: '600 x 1200mm', values: { Comments: 'kitchen', Mark: 'W02', 'Type Mark': 'W-B' } },
  { id: 371010, category: 'Furniture', family: 'Sofa', type: '3 Seater', values: { Comments: 'FF&E', Mark: 'F01' } },
]

export const FLOOR_TYPES = ['Finish - Porcelain Tile 10mm', 'Finish - Engineered Oak 15mm', 'Finish - Screed 40mm']
export const CEILING_TYPES = ['Gypsum Board 12.5mm', 'Acoustic Tile 600x600']
export const WALL_TYPES = ['Interior - Plaster Lining 15mm', 'Interior - Ceramic Tile 12mm']
export const TEMPLATES = ['<None>', 'Interior Plan 1:50', 'Interior RCP 1:50', 'Interior Elevation 1:25', '3D Room Review']
export const SCALES = ['1:20', '1:25', '1:50', '1:100']
