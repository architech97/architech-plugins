import { ELEMENTS, ROOMS } from '../sample'

export const ROOM_PROPERTIES = ['Room Number', 'Room Name', 'Department', 'Floor Finish', 'Ceiling Finish', 'Wall Finish']
export const ELEMENT_PARAMETERS = ['Comments', 'Mark', 'Room Data', 'Department', 'Finish Code']
export const roomPropertyName = (name: string) => name === 'Room Name' ? 'Name' : name === 'Room Number' ? 'Number' : name
export const roomPropertyLabel = (name: string) => roomPropertyName(name) + ' · built-in'
export const elementParameterLabel = (name: string) => name + (['Comments', 'Mark', 'Department'].includes(name) ? ' · built-in' : ' · project')
export const ROOM_SOURCES = ['Current Model', 'Sample Residence – Architecture.rvt', 'Sample Residence – Interiors.rvt']
export const EMPTY_CHOICE = '— Choose —'
export interface RoomMapping { id: number; source: string; target: string; isType: boolean }
export const ROOM_DATA_STAGE_CATEGORIES = ['Furniture', 'Furniture Systems', 'Casework', 'Generic Models', 'Lighting Fixtures']
export interface RoomDataSettings { enabled: boolean; category: string; nested: boolean; mappings: RoomMapping[] }
export const INITIAL_ROOM_DATA: RoomDataSettings = { enabled: false, category: ROOM_DATA_STAGE_CATEGORIES[0], nested: false, mappings: [] }
export interface RoomDataElement { id: number; category: string; family: string; type: string; room: string; nested?: boolean; values: Record<string, string> }
export const ROOM_DATA_ELEMENTS: RoomDataElement[] = [
  ...ELEMENTS.map(element => ({ ...element, room: ({ 355210: '101', 355211: '102', 355240: '101', 355241: '', 355300: '103', 361001: '105', 361002: '102', 371010: '101' } as Record<number, string>)[element.id] ?? '' })),
  { id: 371011, category: 'Furniture', family: 'Sofa', type: '3 Seater', room: '103', nested: true, values: { Comments: 'Nested cushion', Mark: 'F02' } },
]
export const ROOM_DATA_CATEGORIES = [...new Set(ROOM_DATA_ELEMENTS.map(element => element.category))].sort()
export interface RoomDataRow { key: string; id: number; room: string; element: string; mapping: RoomMapping; before: string; after: string; status: string; writable: boolean }
export const roomTypeKey = (element: RoomDataElement) => [element.category, element.family, element.type].join('|')
export function roomProperty(number: string, property: string, source: string, roomValues?: Record<string, string>) {
  const room = ROOMS.find(item => item.number === number)
  if (!room) return ''
  const prefix = source === ROOM_SOURCES[0] ? '' : 'L-'
  const values: Record<string, string> = {
    'Room Number': prefix + number, 'Room Name': room.name, Department: 'Residential',
    'Floor Finish': number === '102' ? 'FL-01' : 'FL-02', 'Ceiling Finish': 'CL-01', 'Wall Finish': 'WL-01',
  }
  return roomValues?.[number + ':' + property] ?? values[property] ?? ''
}
export function roomDataPlan(model: RoomDataElement[], categories: string[], mappings: RoomMapping[], source: string, includeNested: boolean, eligibleRooms?: string[], roomValues?: Record<string, string>): RoomDataRow[] | string {
  const scope = model.filter(element => categories.includes(element.category) && (!element.nested || includeNested) && (!eligibleRooms || eligibleRooms.includes(element.room)))
  for (const mapping of mappings.filter(mapping => mapping.isType)) {
    const values = new Map<string, string>()
    for (const element of scope.filter(element => element.room)) {
      const key = roomTypeKey(element)
      const value = roomProperty(element.room, mapping.source, source, roomValues)
      if (values.has(key) && values.get(key) !== value) return element.family + ' · ' + element.type + ' spans rooms with different proposed values for ' + mapping.target + '. Use an Instance mapping or a common room value.'
      values.set(key, value)
    }
  }
  return scope.flatMap(element => mappings.map(mapping => {
    const value = roomProperty(element.room, mapping.source, source, roomValues)
    const writable = Boolean(value)
    return { key: element.id + ':' + mapping.id, id: element.id, room: element.room || '—', element: element.family + ' · ' + element.type, mapping,
      before: element.values[mapping.target] ?? '', after: value, writable, status: writable ? 'Ready' : 'No containing source room · unchanged' }
  }))
}
export function applyRoomData(model: RoomDataElement[], selected: RoomDataRow[]) {
  return model.map(element => {
    const updates = selected.filter(row => row.writable && (row.id === element.id || row.mapping.isType &&
      roomTypeKey(model.find(item => item.id === row.id)!) === roomTypeKey(element)))
    return updates.length ? { ...element, values: { ...element.values, ...Object.fromEntries(updates.map(row => [row.mapping.target, row.after])) } } : element
  })
}
