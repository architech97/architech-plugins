import type { WorkflowInput } from '../../generatedWorkflow'
import { enabled, field, numberInRange, resultRow } from '../folioSupport'

const kinds = ['Line styles', 'Line patterns', 'Line weights', 'Region types', 'Drafting patterns', 'Materials']
const dimensionGroups: [string[], string][] = [
  [['Line styles', 'Line patterns', 'Line weights'], 'Line width,Line spacing'],
  [['Region types', 'Drafting patterns'], 'Region width,Region height,Region spacing'],
  [['Materials'], 'Box width,Box height,Box spacing,Column width'],
]
const defaultScales = '10,25,50,100,200,500,1000'
const dimensionsByKind: Record<string, string[]> = {
  'Line styles': ['Line width', 'Line spacing'],
  'Line patterns': ['Line width', 'Line spacing'],
  'Line weights': ['Line width', 'Line spacing'],
  'Region types': ['Region width', 'Region height', 'Region spacing'],
  'Drafting patterns': ['Region width', 'Region height', 'Region spacing'],
  Materials: ['Box width', 'Box height', 'Column width'],
}

export default function result({ fields: currentFields, priorFields = [] }: WorkflowInput) {
  const fields = [...priorFields, ...currentFields]
  const selected = kinds.filter((name) => enabled(fields, name, true))
  if (!selected.length) return 'Tick at least one overview to create.'
  for (const [choices, labels] of dimensionGroups) {
    if (!choices.some((choice) => selected.includes(choice))) continue
    for (const label of labels.split(',')) {
      const value = field(fields, label, '50')
      if (!Number.isFinite(numberInRange(value, 0.01, 100000))) return label + ' must be a positive number in centimetres.'
    }
  }
  const scaleText = field(fields, 'Line-weight view scales', defaultScales)
  const scales = [...new Set(scaleText.split(/[,;\s]+/).filter(Boolean).map((value) => Number(value.replace(/^1:/, ''))))]
  if (selected.includes('Line weights') && (!scales.length || scales.some((n) => !Number.isInteger(n) || n < 1 || n > 24000))) {
    return 'Enter positive whole-number line-weight scales, for example 25, 50, 100.'
  }
  const text = field(fields, 'Text type', 'Arial 2.5 mm')
  const rows = selected.flatMap((name) => {
    const layout = dimensionsByKind[name].flatMap((label) => {
      const value = field(fields, label)
      return value ? [label + ' ' + value + ' cm'] : []
    })
    if (name === 'Line weights') return scales.map((scale) => resultRow('Line weights · 1:' + scale, ['16 weights', text, ...layout].join(' · ')))
    return [resultRow(name, ['Drafting view', text, ...layout].join(' · '))]
  })
  return { summary: 'Prepared ' + rows.length + ' sample drafting views.',
    rows: [...rows, resultRow('New sheet', enabled(fields, 'Place the views on a new sheet', true) ? 'Graphic Standards · ' + rows.length + ' view placements planned' : 'No sheet placement')] }
}
