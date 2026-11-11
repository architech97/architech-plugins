import type { WorkflowInput } from '../../generatedWorkflow'
import { sampleResidence } from '../../fixtures/sampleResidence'
import { enabled, field, numberInRange, option, resultRow } from '../folioSupport'

const strings = ['Element edges', 'Heights as spot elevations', 'Levels', 'Grids', 'Opening sizes', 'Openings and wall ends',
  'Overall', 'Room clear sizes', 'Setting-out across walls']
const presets: [RegExp, string[]][] = [
  [/outside of building/i, ['Openings and wall ends', 'Overall', 'Grids']],
  [/room sizes/i, ['Room clear sizes']],
  [/doors and windows/i, ['Openings and wall ends']],
  [/across walls/i, ['Setting-out across walls']],
  [/^grids/i, ['Grids']],
]
const eligible = sampleResidence.views.filter(({ kind }) => ['FloorPlan', 'CeilingPlan', 'Elevation', 'Section'].includes(kind))
const lengthsByView: Record<number, number[]> = { 11: [3150, 4200, 6000], 12: [2800, 3600, 5600], 13: [3300, 6600, 9200], 14: [3100, 6200, 12400], 15: [2250, 4500, 9400] }

export const settings = () => [
  option('Sample view', eligible.map(({ name }) => name)),
  { label: 'Row spacing in mm on paper', initial: '8' },
  option('Dimension type', ['Linear, 2.5 mm', 'Linear, 3.5 mm']),
]

export default function result({ fields }: WorkflowInput) {
  const name = field(fields, 'Sample view', eligible[0].name)
  const view = eligible.find((entry) => entry.name === name) ?? eligible[0]
  const row = numberInRange(field(fields, /^row spacing/i, '8'), 0.01, 1000)
  if (!Number.isFinite(row)) return 'Row spacing must be a positive number in paper millimetres.'
  const preset = field(fields, 'Dimension', 'Outside of building: openings, overall and grids')
  const manual = strings.filter((item) => enabled(fields, item))
  const activeStrings = manual.length || /custom/i.test(preset) ? manual : presets.find(([label]) => label.test(preset))?.[1] ?? []
  if (!activeStrings.length) return 'Choose at least one dimension string.'
  const plan = /plan/i.test(view.kind)
  const rows = activeStrings.map((item, index) => {
    if (!plan && ['Room clear sizes', 'Openings and wall ends', 'Setting-out across walls'].includes(item)) return resultRow(item, 'Skipped, this string requires a plan')
    if (item === 'Room clear sizes' && /pick walls|witness line/i.test(field(fields, 'scope'))) return resultRow(item, 'Skipped, this string needs rooms in scope')
    const values = lengthsByView[view.id] ?? lengthsByView[11]
    const measured = values[index % values.length]
    const offset = (index + 1) * row
    const side = item === 'Setting-out across walls' ? field(fields, 'mode', 'To core faces') :
      item === 'Openings and wall ends' || item === 'Overall' ? field(fields, 'Facade side', 'Outside (room-aware)') : ''
    return resultRow(item, measured + ' mm, row at ' + Number(offset.toFixed(2)) + ' mm on paper' + (side ? ', ' + side : ''))
  })
  if (enabled(fields, /^radius on curved edges/i)) rows.push(resultRow('Radius on curved edges', 'Unavailable in Revit 2024. The installed option requires Revit 2025 or later.'))
  const accepted = rows.filter(({ value }) => !/^(Skipped|Unavailable)/.test(value)).length
  return { summary: 'Prepared ' + accepted + ' sample dimension strings for ' + name + '.',
    rows: [resultRow('Dimension type', field(fields, 'Dimension type', 'Linear, 2.5 mm')), ...rows] }
}
