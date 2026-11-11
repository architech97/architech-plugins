import type { WorkflowInput, WorkflowRecord } from '../../generatedWorkflow'
import { GENERATED_SAMPLE, sampleResidence } from '../../fixtures/sampleResidence'
import { cell, enabled, field, option, resultRow } from '../folioSupport'

const conversion = ['Drafting View', 'Legend', 'Ceiling Plan', 'Floor Plan']
const manage = ['Duplicate', 'Apply template', 'Rename', 'Set parameter']
const copies = ['Duplicate', 'Duplicate with detailing', 'Duplicate as dependent']
const getName = (record: WorkflowRecord) => cell(record, 'View') || record.label
const sample = (record: WorkflowRecord) => sampleResidence.views.find(({ name }) => name === getName(record))

export const settings = (windowName: string, tab: number) => {
  if (windowName === 'sourceviewpicker') return []
  if (tab === 0) return [option('Conversion target', conversion), option('Template legend to duplicate', ['Graphic Standards', 'Door and Window Key'])]
  if (tab === 1) return [
    option('Manage operation', manage), option('Duplication mode', copies),
    option('Template to apply', ['<None>', ...GENERATED_SAMPLE.TEMPLATES]),
    { label: 'Find in view name', initial: '' }, { label: 'Replace in view name', initial: '' },
    { label: 'View name prefix', initial: '' }, { label: 'View name suffix', initial: '' },
    option('Writable view parameter', ['Sub-Discipline', 'Comments', 'View Group']), { label: 'New view parameter value', initial: 'Architecture' },
  ]
  return [option('Hide-state source view', sampleResidence.views.map(({ name }) => name))]
}

export default function result({ action, fields, records }: WorkflowInput) {
  if (!records.length) return 'Tick the sample views to include.'
  if (action === 'Use this view') return { summary: 'Picked a sample source view.', rows: [resultRow('Source view', getName(records[0]))] }
  if (action === 'Convert views') {
    const target = field(fields, 'Conversion target', conversion[0])
    const invalid = records.filter((record) => {
      const kind = sample(record)?.kind || ''
      return target === 'Ceiling Plan' ? kind !== 'FloorPlan' : target === 'Floor Plan' ? kind !== 'CeilingPlan' : target === 'Legend' && kind !== 'DraftingView'
    })
    if (invalid.length) return 'The selected sample views do not share the ' + target + ' conversion. Choose compatible views.'
    const suffix = field(fields, /^add to the name/i) || ' - ' + target
    const rows = records.map((record) => resultRow(getName(record), getName(record) + suffix + ', ' + target +
      (target === 'Drafting View' ? enabled(fields, /^rebuild as native/i, true) ? ', Native lines and regions' : ', CAD import retained' :
        target === 'Legend' ? ', Base legend: ' + field(fields, 'Template legend to duplicate') : ', Same sample level and crop')))
    return { summary: 'Prepared ' + rows.length + ' sample conversions to ' + target + '.', rows }
  }
  if (action === 'Duplicate views') {
    const mode = field(fields, 'Manage operation', manage[0])
    const rows = records.map((record) => {
      const name = getName(record)
      if (mode === 'Apply template') {
        const current = cell(record, 'Template') || '<None>'
        return resultRow(name, current + ' → ' + field(fields, 'Template to apply', '<None>'))
      }
      if (mode === 'Rename') {
        const find = field(fields, 'Find in view name')
        const next = field(fields, 'View name prefix') + (find ? name.replaceAll(find, field(fields, 'Replace in view name')) : name) + field(fields, 'View name suffix')
        return resultRow(name, next === name ? 'Unchanged' : name + ' → ' + next)
      }
      if (mode === 'Set parameter') {
        const parameter = field(fields, 'Writable view parameter', 'Sub-Discipline')
        const controlled = !!cell(record, 'Template') && parameter === 'Sub-Discipline'
        return resultRow(name, controlled ? 'Skipped, sample template controls ' + parameter : parameter + ' = ' + field(fields, 'New view parameter value'))
      }
      const choice = field(fields, 'Duplication mode', copies[0])
      const unsupported = choice === copies[2] && sample(record)?.kind === 'ThreeD'
      return resultRow(name, unsupported ? 'Skipped, this sample 3D view cannot be dependent' : name + ' - Copy, ' + choice)
    })
    return { summary: 'Prepared ' + mode.toLowerCase() + ' for the selected sample views.', rows }
  }
  if (action === 'Hide in views') {
    const source = field(fields, 'Hide-state source view', sampleResidence.views[0].name)
    const hide = enabled(fields, /^hidden elements/i, true)
    const graphics = enabled(fields, /^visibility\/graphics/i)
    if (!hide && !graphics) return 'Choose hidden elements or visibility/graphics to copy.'
    const mode = field(fields, 'HideAction', 'Hide what the source hides')
    const rows = records.map((record) => resultRow(getName(record), getName(record) === source ? 'Source view, unchanged' :
      [hide && mode, graphics && (cell(record, 'Template') ? 'Visibility/Graphics kept, controlled by template' : 'Copy category and link display settings')].filter(Boolean).join(', ')))
    return { summary: 'Prepared hide-state transfer from ' + source + '.', rows }
  }
  return undefined
}
