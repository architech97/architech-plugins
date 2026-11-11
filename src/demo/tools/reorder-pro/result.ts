import type { WorkflowInput } from '../../generatedWorkflow'
import { cell, enabled, field, numberInRange, resultRow } from '../folioSupport'

function seededOrder(id: string, seed: number) {
  let score = seed
  for (const char of id) score = Math.imul(score ^ char.charCodeAt(0), 16777619)
  return score >>> 0
}

export const actions = () => ['Apply', 'Clear values']

export default function result({ action, fields, records }: WorkflowInput) {
  if (!records.length) return 'Tick at least one eligible sample element.'
  const parameter = field(fields, 'Write to', 'Mark')
  if (action === 'Clear values') {
    return { summary: 'Prepared clearing ' + parameter + ' on ' + records.length + ' sample elements.',
      rows: records.map((record) => resultRow(record.label, (cell(record, 'Current Value') || 'Blank') + ' → Blank')) }
  }
  const start = numberInRange(field(fields, 'Start at', '1'), -999999999, 999999999)
  const step = numberInRange(field(fields, 'Step', '1'), 1, 999999999)
  const digits = numberInRange(field(fields, /^digits/i, '2'), 0, 8)
  if (![start, step, digits].every(Number.isInteger)) return 'Enter a whole start number, a positive whole step and between 0 and 8 digits.'
  const order = field(fields, 'Order', 'Element id')
  const seed = numberInRange(field(fields, 'Seed').trim() || '0', -2147483648, 2147483647)
  if (order === 'Random' && !Number.isInteger(seed)) return 'Enter a whole-number seed for Random order.'
  const key = (record: (typeof records)[number]) => cell(record, 'Id', 'Element ID') || record.label
  const numericId = (record: (typeof records)[number]) => Number(key(record)) || Number(cell(record, 'Order')) || 0
  const ordered = order === 'Random' ? [...records].sort((a, b) => seededOrder(key(a), seed) - seededOrder(key(b), seed)) :
    order === 'Element id' ? [...records].sort((a, b) => numericId(a) - numericId(b)) : records
  const prefix = field(fields, 'Prefix')
  const suffix = field(fields, 'Suffix')
  const separator = field(fields, 'Separator')
  const incremental = enabled(fields, 'Increment each element', true)
  const rows = ordered.map((record, index) => {
    const value = start + (incremental ? index : 0) * step
    const number = (value < 0 ? '-' : '') + String(Math.abs(value)).padStart(digits, '0')
    const next = [prefix, number, suffix].filter(Boolean).join(separator)
    const before = cell(record, 'Current Value') || 'Blank'
    return resultRow(record.label, before === next ? before + ', unchanged' : before + ' → ' + next)
  })
  const changed = rows.filter(({ value }) => !value.endsWith('unchanged')).length
  return { summary: 'Prepared ' + changed + ' changes to ' + parameter + ' across ' + records.length + ' sample elements.',
    rows: [resultRow('Numbering order', order + (order === 'Random' ? ', Seed ' + seed : '')), ...rows] }
}
