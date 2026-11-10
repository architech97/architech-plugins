export const NESTED_SAMPLE_FAMILY = 'AT-01 Double Flush Door.rfa'
export const NESTED_MODES = ['Instance parameters', 'Type parameters'] as const
export type NestedMode = typeof NESTED_MODES[number]
type Parameter = { name: string; dataType: string; mode: NestedMode }
type NestedRow = Parameter & { id: string; family: string; type: string; associated?: string }
export type NestedModel = { rows: NestedRow[]; host: Parameter[] }
export type AssociationResult = { count: number; issues: string[] }

export const INITIAL_NESTED_MODEL: NestedModel = {
  rows: [
    { id: 'frame-inset', family: 'Frame insert', type: '90 mm', name: 'Inset', dataType: 'Length', mode: NESTED_MODES[0] },
    { id: 'glass-thickness', family: 'Glazing panel', type: 'Clear', name: 'Panel Thickness', dataType: 'Length', mode: NESTED_MODES[0], associated: 'Panel Thickness' },
    { id: 'handle-clearance', family: 'Handle set', type: 'Lever', name: 'Clearance', dataType: 'Length', mode: NESTED_MODES[0] },
    { id: 'handle-label', family: 'Handle set', type: 'Lever', name: 'Label Text', dataType: 'Text', mode: NESTED_MODES[0] },
    { id: 'frame-width', family: 'Frame insert', type: '90 mm', name: 'Frame Width', dataType: 'Length', mode: NESTED_MODES[1] },
    { id: 'glass-code', family: 'Glazing panel', type: 'Clear', name: 'Finish Code', dataType: 'Text', mode: NESTED_MODES[1] },
  ],
  host: [
    { name: 'Inset', dataType: 'Length', mode: NESTED_MODES[0] },
    { name: 'Panel Thickness', dataType: 'Length', mode: NESTED_MODES[0] },
    { name: 'Clearance', dataType: 'Length', mode: NESTED_MODES[1] },
    { name: 'Frame Width', dataType: 'Length', mode: NESTED_MODES[1] },
  ],
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
export const defaultNestedSelection = (rows: NestedRow[], mode: NestedMode) => rows.filter(row => row.mode === mode && !row.associated).map(row => row.id)

export function nestedAssociationMessage({ count, issues }: AssociationResult) {
  return `Associated ${count} nested parameter(s)${issues.length ? `; ${issues.length} issue(s).` : '.'}`
}

export function associateNestedParameters(model: NestedModel, mode: NestedMode, checked: string[], createMissing: boolean) {
  const host = [...model.host]
  const issues: string[] = []
  let count = 0
  const rows = model.rows.map(row => {
    if (row.mode !== mode || !checked.includes(row.id)) return row
    const named = host.find(item => sameName(item.name, row.name))
    const matches = named?.mode === row.mode && named.dataType === row.dataType
    if (!matches) {
      if (!createMissing) { issues.push(`${row.name}: matching family parameter missing`); return row }
      if (named) { issues.push(`${row.name}: the host parameter has a different data type or binding`); return row }
      host.push({ name: row.name, dataType: row.dataType, mode: row.mode })
    }
    const associated = named?.name ?? row.name
    if (row.associated && sameName(row.associated, associated)) return row
    count++
    return { ...row, associated }
  })
  return { model: { rows, host }, receipt: { count, issues } }
}
