export const WORKBOOK_FILE = 'AT-01 Schedules.xlsx'
export const WORKBOOKS = {
  issued: { label: 'Coordination copy · P02', path: 'Coordination/P02/' + WORKBOOK_FILE },
  incoming: { label: 'Incoming copy · P03', path: 'Incoming/P03/' + WORKBOOK_FILE },
} as const
export type WorkbookId = keyof typeof WORKBOOKS
export type Worksheet = {
  id: string
  name: string
  cells: string[][]
  printArea: string
  named: Record<string, string>
  printTitles: [number, number]
}
export type Region = { firstRow: number; lastRow: number; firstColumn: number; lastColumn: number }
export type TablePreview = { region: string; rows: string[][]; columns: number; firstColumn: number; titleRows: number; outside: boolean }

const doorRows = [
  ['Door Mark', 'Location', 'Width (mm)', 'Fire Rating'],
  ['D-101', 'Entry', '1000', '60 min'],
  ['D-102', 'Kitchen', '900', '30 min'],
]
const finishes: Worksheet = {
  id: 'finishes', name: 'Room Finish Schedule',
  cells: [['Room', 'Floor', 'Wall'], ['101 Entry', 'Terrazzo', 'Warm White'], ['102 Kitchen', 'Porcelain', 'Warm White'], ['103 Living', 'Oak', 'Limewash']],
  printArea: 'A1:C3', named: { FinishIssue: 'A2:C4' }, printTitles: [0, 0],
}
const windows: Worksheet = {
  id: 'windows', name: 'Window Schedule',
  cells: [['Window Mark', 'Location', 'Glazing'], ['W-101', 'Living', 'Clear'], ['W-102', 'Kitchen', 'Frosted']],
  printArea: 'A1:C3', named: {}, printTitles: [0, 0],
}

export function workbookSheets(workbook: WorkbookId): Worksheet[] {
  const incoming = workbook === 'incoming'
  return [{
    id: 'doors', name: 'Door Schedule',
    cells: incoming ? [doorRows[0], doorRows[1], ['D-102', 'Kitchen', '900', '60 min'], ['D-103', 'Terrace', '1050', '30 min']] : doorRows,
    printArea: incoming ? 'A1:D4' : 'A1:D3', named: { IssueRows: incoming ? 'A2:D4' : 'A2:D3' }, printTitles: [0, 0],
  }, finishes, windows]
}

export function columnName(index: number): string {
  let name = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + (n - 1) % 26) + name
  return name
}

function parseCell(value: string) {
  const parts = value.trim().match(/^\$?([A-Z]{1,3})\$?([1-9]\d{0,6})$/i)
  if (!parts) return undefined
  const column = [...parts[1].toUpperCase()].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1
  const row = Number(parts[2]) - 1
  return column < 16384 && row < 1048576 ? { row, column } : undefined
}

export function readRegionSyntax(text: string): Region | null | undefined {
  const raw = text.trim()
  if (!raw || /^all$/i.test(raw) || raw === '@PrintArea' || raw.startsWith('@Name:') && raw.length > 6) return null
  const ends = raw.split(':')
  if (ends.length !== 2) return undefined
  const first = parseCell(ends[0])
  const last = parseCell(ends[1])
  if (!first || !last) return undefined
  return {
    firstRow: Math.min(first.row, last.row), lastRow: Math.max(first.row, last.row),
    firstColumn: Math.min(first.column, last.column), lastColumn: Math.max(first.column, last.column),
  }
}

export function regionOptions(sheet: Worksheet) {
  return [
    { id: 'All', label: 'Entire used worksheet', detail: 'All cells in the worksheet’s used range' },
    { id: '@PrintArea', label: 'Excel print area', detail: sheet.printArea },
    ...Object.entries(sheet.named).map(([name, range]) => ({ id: '@Name:' + name, label: 'Named region: ' + name, detail: range })),
  ]
}

export function readPreview(sheet: Worksheet, input: string, repeatTitles: boolean): TablePreview | string {
  const token = input.trim()
  const named = token.startsWith('@Name:') ? token.slice(6) : undefined
  const reference = token === '@PrintArea' ? sheet.printArea : named
    ? Object.entries(sheet.named).find(([name]) => name.toLowerCase() === named.toLowerCase())?.[1] : token
  if (reference === undefined) return 'Excel region is missing: ' + named + '. Restore it or choose another region.'
  const range = readRegionSyntax(reference)
  if (range === undefined) return 'The cell range is not understood. Use A1:F20, or leave it empty.'
  const maxRow = sheet.cells.length - 1
  const maxColumn = sheet.cells[0].length - 1
  const { firstRow, firstColumn, lastRow, lastColumn } = range ?? { firstRow: 0, firstColumn: 0, lastRow: maxRow, lastColumn: maxColumn }
  if ((lastRow - firstRow + 1) * (lastColumn - firstColumn + 1) > 40000) return 'This region exceeds 40,000 cells. Choose a smaller region or split the table.'
  const bottom = Math.min(lastRow, maxRow)
  const right = Math.min(lastColumn, maxColumn)
  if (firstRow > bottom || firstColumn > right) return 'This region contains no worksheet cells.'
  const slice = (start: number, end: number) => sheet.cells.slice(start, end + 1).map((row) => row.slice(firstColumn, right + 1))
  let titles: string[][] = []
  if (repeatTitles) {
    const [topTitle, bottomTitle] = sheet.printTitles
    if (bottomTitle < firstRow) titles = slice(topTitle, bottomTitle)
    else if (topTitle > bottom) return 'Excel print-title rows are below this region. Choose a region containing them or disable title-row inclusion.'
    else if (topTitle < firstRow || bottomTitle > bottom) return 'Excel print-title rows partially overlap the chosen region.'
  }
  return {
    region: columnName(firstColumn) + (firstRow + 1) + ':' + columnName(right) + (bottom + 1),
    rows: [...titles, ...slice(firstRow, bottom)], columns: right - firstColumn + 1, firstColumn,
    titleRows: titles.length, outside: firstRow > 0 || firstColumn > 0 || bottom < maxRow || right < maxColumn,
  }
}

export type ExistingTable = {
  id: string
  name: string
  kind: 'architech' | 'other' | 'sticky' | 'drafting'
  workbook?: WorkbookId
  worksheet?: string
  range: string
  repeatTitles: boolean
  sheets: string[]
}

export const INITIAL_TABLES: ExistingTable[] = [
  { id: 'SCH-101', name: 'Door Schedule', kind: 'architech', workbook: 'issued', worksheet: 'doors', range: '@Name:IssueRows', repeatTitles: true, sheets: ['A-601', 'A-602'] },
  { id: 'SCH-102', name: 'Room Finish Schedule', kind: 'architech', workbook: 'issued', worksheet: 'finishes', range: '@PrintArea', repeatTitles: false, sheets: ['A-603'] },
  { id: 'SCH-104', name: 'Door Hardware — Native', kind: 'other', range: '', repeatTitles: false, sheets: ['A-601'] },
  { id: 'SCH-105', name: 'Consultant Finish Table — Sticky', kind: 'sticky', range: '', repeatTitles: false, sheets: ['A-604'] },
]

export const tableLabel = (table: ExistingTable) => `${table.name} [${table.sheets.length} sheet(s)] [${table.kind === 'architech' ? 'ArchiTECH Excel table' : 'Other schedule'}]`

// Both fixture paths have the same file name; accept the fallback only when the tab has one marker.
export function linkedTable(tables: ExistingTable[], workbook: WorkbookId, worksheet: string) {
  const candidates = tables.filter((table) => table.kind === 'architech' && table.worksheet === worksheet)
  return candidates.find((table) => table.workbook === workbook) ?? (candidates.length === 1 ? candidates[0] : undefined)
}
