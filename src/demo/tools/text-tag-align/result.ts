import type { WorkflowInput } from '../../generatedWorkflow'
import { field, option, resultRow } from '../folioSupport'

const notes = [
  { id: 'AT-201', name: 'Floor finish tag', x: 14, y: 36, shoulder: '17, 42' },
  { id: 'AT-202', name: 'Wall type tag', x: 28, y: 30, shoulder: '32, 36' },
  { id: 'AT-203', name: 'Partition note', x: 46, y: 44, shoulder: '54, 45' },
  { id: 'AT-204', name: 'Tile note', x: 72, y: 24, shoulder: '70, 31' },
]

export const settings = () => [option('Primary reference', notes.map(({ name }) => name))]

export default function result({ action, fields }: WorkflowInput) {
  const horizontal = action === 'Align Horizontally'
  const reference = notes.find(({ name }) => name === field(fields, 'Primary reference')) ?? notes[0]
  const rows = notes.filter((note) => note !== reference).map(({ id, name, x, y, shoulder }) => resultRow(id + ' · ' + name,
    '(' + x + ', ' + y + ') → (' + (horizontal ? x : reference.x) + ', ' + (horizontal ? reference.y : y) + ') mm · Shoulder kept at (' + shoulder + ') mm'))
  return { summary: 'Aligned ' + rows.length + ' sample heads to ' + reference.name + '. Leader shoulders and ends stayed in place.',
    rows: [resultRow('Reference', reference.name + ' · ' + (horizontal ? 'Y = ' + reference.y : 'X = ' + reference.x) + ' mm'), ...rows] }
}
