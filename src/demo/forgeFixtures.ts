import type { WorkflowInput, WorkflowRecord, WorkflowResult } from './generatedWorkflow'
import { sampleResidence } from './fixtures/sampleResidence'

const HOST = 'This model'
const LINKS = ['Sample Residence – Architecture.rvt', 'Sample Residence – Interiors.rvt']
const ROOM_FIELDS = ['Room Number', 'Room Name', 'Department', 'Floor Finish']
const TEXT_FIELDS = ['Comments', 'Mark', 'Room Data', 'Department', 'Finish Code']
const FAMILIES = ['Door – Single Flush', 'Door – Double Flush', 'Window – Fixed', 'Dining Chair']
const LEVELS = ['Level 01', 'Level 02', 'Roof']
const SCOPE_CATEGORIES = ['Doors', 'Furniture', 'Casework', 'Windows']
export const FINISH_VIEWS = ['Level 01 – Floor Plan', 'Level 01 – Ceiling Plan', 'North Elevation']
const FINISH_TYPES = [
  ['FL-01 Porcelain 12 mm', 'FL-02 Engineered Oak 18 mm'],
  ['CL-01 Gypsum 12.5 mm', 'CL-02 Acoustic Tile 600 × 600'],
  ['WL-01 Timber Lining 25 mm', 'WL-02 Gypsum Lining 15 mm'],
]
export const finishTypes = (view: string) => FINISH_TYPES[FINISH_VIEWS.indexOf(view)] ?? FINISH_TYPES[0]

type Setting = { label: string; initial: string; choices?: string[] }
const SETTINGS: Record<string, Setting[]> = {
  'fr-to-finishes': [{ label: 'Active view', initial: FINISH_VIEWS[0], choices: FINISH_VIEWS }],
  'family-param-transfer': [{ label: 'Target family', initial: FAMILIES[1], choices: FAMILIES }],
  'parameter-mapping': [
    { label: 'Category', initial: 'Doors', choices: SCOPE_CATEGORIES },
    { label: 'Source parameter', initial: 'Type Mark', choices: ['Type Mark', 'Mark', 'Comments', 'Fire Rating'] },
    { label: 'Target parameter', initial: 'Comments', choices: TEXT_FIELDS },
    { label: 'Family / type filter', initial: 'Single Flush', choices: ['Single Flush', 'Double Flush', 'Dining Chair', 'Fixed Window'] },
  ],
  'room-level-assigner': [{ label: 'Target level', initial: 'Use sample row targets', choices: ['Use sample row targets', ...LEVELS] }],
}
export const forgeSettings = (slug: string) => SETTINGS[slug] ?? []

const PREPARATION: Record<string, { label: string; caption: string; fields: string[]; ready: string }> = {
  'assign-room-properties': { label: 'Add', caption: 'Add mapping', fields: ['Rooms from', 'Room property', 'On', 'Element parameter'], ready: 'Mapping added. Review it before choosing Assign.' },
  'family-param-transfer': { label: 'Load parameters', caption: 'Load parameters', fields: ['SrcMode', 'Shared parameter file', 'Loaded source family', 'Source RFA file'], ready: 'Sample definitions loaded. Check the parameters to transfer.' },
  'parameter-mapping': { label: 'Load', caption: 'Load categories', fields: ['Category', 'Filter by family and type', 'Family / type filter'], ready: 'Sample category loaded. Review the source and target parameters.' },
}
export const forgePreparation = (slug: string) => PREPARATION[slug]

const OPTIONS: Record<string, Record<string, string[]>> = {
  'assign-room-properties': { 'rooms from': [HOST, ...LINKS], 'room property': ROOM_FIELDS, on: ['Instance', 'Type'], 'element parameter': TEXT_FIELDS },
  'copy-param-from-link': { 'rooms from': [HOST, ...LINKS], 'element category': SCOPE_CATEGORIES, 'room text property': ROOM_FIELDS, 'element parameter': TEXT_FIELDS },
  'family-param-transfer': { 'loaded source family': FAMILIES },
  'parameter-mapping': { 'project schemes': ['Door type marks → Comments', 'Furniture finish codes → Finish Code', 'Window marks → Room Data'] },
}
export const forgeChoices = (slug: string, label: string) => OPTIONS[slug]?.[label.toLowerCase()]

const FAMILY_PARAMS = [
  { name: 'Hardware Set', kind: 'Shared', binding: 'Type', type: 'Text', group: 'Identity Data' },
  { name: 'Clear Opening Width', kind: 'Family', binding: 'Type', type: 'Length', group: 'Dimensions' },
  { name: 'Fire Rating', kind: 'Shared', binding: 'Type', type: 'Text', group: 'Identity Data' },
]
const SHARED_PARAMS = [
  { name: 'Fire Rating', type: 'Text', group: 'Life Safety' },
  { name: 'Finish Code', type: 'Text', group: 'Finishes' },
  { name: 'Room Department', type: 'Text', group: 'Room Data' },
]
export function forgeCell(slug: string, column: string, row: number) {
  if (slug === 'family-param-transfer') {
    const item = FAMILY_PARAMS[row]
    return item && ({ parameter: item.name, kind: item.kind, binding: item.binding, type: item.type, group: item.group } as Record<string, string>)[column]
  }
  if (slug === 'shared-param-manager') {
    const item = SHARED_PARAMS[row]
    return item && ({ 'parameter name': item.name, 'data type': item.type, group: item.group } as Record<string, string>)[column]
  }
}

const ELEMENTS = [
  { id: 'D-101', category: 'Doors', family: 'Single Flush', room: '101', name: 'Living Room', department: 'Residential', finish: 'FL-02', typeMark: 'DR-01' },
  { id: 'D-102', category: 'Doors', family: 'Single Flush', room: '102', name: 'Kitchen', department: 'Residential', finish: 'FL-01', typeMark: 'DR-01' },
  { id: 'D-104', category: 'Doors', family: 'Double Flush', room: '', name: '', department: '', finish: '', typeMark: 'DR-02' },
  { id: 'F-111', category: 'Furniture', family: 'Dining Chair', room: '103', name: 'Dining Room', department: 'Residential', finish: 'FL-02', typeMark: 'FF-03' },
  { id: 'F-112', category: 'Furniture', family: 'Dining Chair', room: '103', name: 'Dining Room', department: 'Residential', finish: 'FL-02', typeMark: 'FF-03', nested: true },
  { id: 'CW-107', category: 'Casework', family: 'Base Cabinet', room: '102', name: 'Kitchen', department: 'Residential', finish: 'FL-01', typeMark: 'CW-01' },
  { id: 'WIN-105', category: 'Windows', family: 'Fixed Window', room: '105', name: 'Primary Bedroom', department: 'Residential', finish: 'FL-02', typeMark: 'WN-01' },
]
const row = (label: string, value: string) => ({ label, value })
const change = (label: string, before: string, after: string) => ({ label, value: before + ' → ' + after, before, after })
const record = (label: string, columns: Record<string, string>): WorkflowRecord => ({ label, columns })
const isIncluded = (records: WorkflowRecord[], id: string) => !records.length || records.some(item => item.columns['Sample ID'] === id)
const elementLabel = (element: typeof ELEMENTS[number]) => element.id + ' · ' + element.family
const currentValue = (element: typeof ELEMENTS[number], parameter: string) => parameter === 'Mark' ? element.id
  : parameter === 'Comments' ? 'Review ' + element.family : '—'
const elementRecord = (element: typeof ELEMENTS[number], parameter: string) => record(elementLabel(element), {
  'Sample ID': element.id, Category: element.category, Parameter: parameter, 'Current value': currentValue(element, parameter),
})

export function forgeResult({ slug, action, fields, records }: WorkflowInput): WorkflowResult | string | undefined {
  const get = (label: string) => fields.find(field => field.label.toLowerCase() === label.toLowerCase())?.value ?? ''
  if (slug === 'fr-to-finishes') {
    const view = get('Active view') || FINISH_VIEWS[0]
    const mode = ['Floor', 'Ceiling', 'Wall'][FINISH_VIEWS.indexOf(view)] ?? 'Floor'
    const type = get('Finish type')
    const rawOffset = get('Height offset')
    const offset = Number(rawOffset)
    if (!type || !rawOffset.trim() || !Number.isFinite(offset)) return 'Choose a finish type and enter a numeric height offset.'
    const approximation = get('Use rectangular bounding-box walls (approximation)') === 'On'
    const remove = get('Delete successfully converted source regions') === 'On'
    const joined = mode === 'Floor' && get('Join the new Floors with bordering Walls') === 'On'
    const scope = sampleResidence.regions.filter(region => isIncluded(records, String(region.id)))
    const rows = scope.map(region => {
      const label = region.name + ' · ' + region.id
      const before = region.kind + ' region · ' + region.type
      const innerLoop = region.id === 9102
      const reason = region.masking ? 'Masking regions are not converted' :
        mode === 'Wall' && innerLoop && !approximation ? 'Exact wall profile cannot include this opening' : ''
      const after = reason ? 'Skipped · ' + reason :
        mode + ' · ' + type + ' · ' + offset + ' mm offset' +
        (innerLoop ? mode === 'Wall' ? ' · rectangular approximation' : ' · opening retained' : '') +
        (joined ? ' · join bordering walls' : '') +
        (remove ? ' · remove converted source' : ' · keep source region')
      return change(label, before, after)
    })
    const count = rows.filter(result => !result.after.startsWith('Skipped')).length
    return {
      summary: count + ' of ' + scope.length + ' selected sample regions can create ' + mode.toLowerCase() + ' geometry in ' + view + '.',
      rows, records: scope.map(region => record(region.name + ' · ' + region.id, { 'Sample ID': String(region.id), Type: region.type })),
    }
  }
  if (slug === 'assign-room-properties' || slug === 'copy-param-from-link') {
    const assign = slug === 'assign-room-properties'
    const source = get('Rooms from')
    const target = get('Element parameter')
    const property = get(assign ? 'Room property' : 'Room text property')
    const typeBinding = assign && get('On') === 'Type'
    if (!source || !target || !property) return 'Choose a room source, a room property and an element parameter.'
    const scope = ELEMENTS.filter(element => (assign ? !element.nested || get('Include nested family components') === 'On'
      : element.category === get('Element category') && !element.nested) && isIncluded(records, element.id))
    const value = (element: typeof ELEMENTS[number]) => property === 'Room Name' ? element.name : property === 'Department' ? element.department
      : property === 'Floor Finish' ? element.finish : element.room && (source === HOST ? element.room : `L-${element.room}`)
    const conflict = typeBinding && scope.find(element => value(element) &&
      scope.some(peer => peer.family === element.family && value(peer) && value(peer) !== value(element)))
    if (conflict) return conflict.family + ' spans sample rooms with different proposed values. Use an Instance mapping or a shared room value.'
    const rows = scope.map(element => {
      const next = value(element)
      const before = currentValue(element, target)
      return change(elementLabel(element), before, next || 'Unchanged · no containing source room')
    })
    return { summary: source + ' · ' + property + ' → ' + target + ' · ' + (typeBinding ? 'Type' : 'Instance') +
      ' · ' + scope.filter(element => value(element)).length + ' sample values ready.',
      rows, records: scope.map(element => elementRecord(element, target)) }
  }
  if (slug === 'family-param-transfer') {
    const mode = get('SrcMode') || 'Shared parameter file'
    const source = mode === 'Loaded family' ? get('Loaded source family') : mode === 'Browse .rfa' ? get('Source RFA file') : get('Shared parameter file')
    const target = get('Target family')
    if (source === target) return 'Choose a destination family different from the source.'
    const definitions = mode === 'Shared parameter file' ? records.filter(record => record.columns.Kind === 'Shared') : records
    if (!definitions.length) return 'Choose a sample parameter that is available from the selected source.'
    const rows = definitions.map(definition => {
      const name = definition.columns.Parameter || definition.label
      const exists = target === FAMILIES[1] && name === 'Fire Rating'
      const before = exists ? 'Shared definition with matching GUID' : 'Definition absent'
      const after = exists ? 'Unchanged · matching shared GUID' : name + ' · ' + definition.columns.Type + ' · ' + definition.columns.Binding +
        (definition.columns.Kind === 'Shared' ? ' · source GUID retained' : ' · family definition')
      return change(definition.label, before, after)
    })
    return { summary: 'Review ' + definitions.length + ' definitions from ' + (source || 'the sample source') + ' for ' + target + '.',
      rows, records: definitions }
  }
  if (slug === 'parameter-mapping') {
    const target = get('Target parameter')
    const source = get('Source parameter')
    const manual = get('Manual value') === 'On'
    const custom = get('Manual text value')
    if (manual && !custom.trim()) return 'Enter a manual text value or turn off Manual value.'
    if (!manual && source === target) return 'Choose a different source and target parameter.'
    const scope = ELEMENTS.filter(element => !element.nested && element.category === get('Category') &&
      (get('Filter by family and type') !== 'On' || element.family === get('Family / type filter')) && isIncluded(records, element.id))
    if (!scope.length) return 'No sample elements match the category and family/type filter.'
    const rows = scope.map(element => {
      const next = manual ? custom : source === 'Type Mark' ? element.typeMark : source === 'Mark' ? element.id : source === 'Comments' ? `Coordinate ${element.name || element.family}` : element.category === 'Doors' ? '60 min' : ''
      return change(elementLabel(element), currentValue(element, target), next ? get('Prefix') + next + get('Suffix') : 'Unchanged · source value missing')
    })
    return { summary: 'Review ' + rows.length + ' ' + get('Category').toLowerCase() + ' parameter mappings for ' + target + '.',
      rows, records: scope.map(element => elementRecord(element, target)) }
  }
  if (slug === 'shared-param-manager') {
    return { summary: `${action} · prepared the sample shared-parameter definition list.`, rows: records.map(record => row(record.columns['Parameter Name'] || record.label,
      [record.columns['Data Type'], record.columns.Group, record.columns.GUID].filter(Boolean).join(' · '))) }
  }
  if (slug === 'room-height-adjust' || slug === 'room-level-assigner') {
    const height = slug === 'room-height-adjust'
    const active = get('Scope') === 'Active view'
    const target = get('Target level')
    const scope = active ? records.filter(record => (record.columns.Level || record.columns['Current Level']) === 'Level 01') : records
    return { summary: `${scope.length} sample room${scope.length === 1 ? '' : 's'} in ${active ? 'the Level 01 active view' : 'the selected model scope'}.`, rows: scope.map(record => {
      const from = height ? record.columns['Height now'] : record.columns['Current Level']
      const to = height ? record.columns['New height'] : target && target !== 'Use sample row targets' ? target : record.columns['Target Level']
      return row(record.label, from === to ? `${from} · already matches` : `${from} → ${to}${height ? ` · ${record.columns.Change}` : ' · room number retained'}`)
    }) }
  }
}
