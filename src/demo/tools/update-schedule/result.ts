import type { WorkflowInput } from '../../generatedWorkflow'
import { cell, enabled, resultRow } from '../folioSupport'

export default function result({ fields, records }: WorkflowInput) {
  if (!records.length) return 'Load the sample import preview and select value changes.'
  const overwrite = enabled(fields, /^also overwrite/i)
  let written = 0
  let conflicts = 0
  const rows = records.map((record) => {
    const worksheet = cell(record, 'Worksheet')
    const element = cell(record, 'Element / type')
    const parameter = cell(record, 'Parameter')
    const appliesTo = cell(record, 'Applies to')
    const current = cell(record, 'Now in Revit')
    const next = cell(record, 'From the file')
    const label = [worksheet, element, parameter].filter(Boolean).join(', ') || record.label
    if (!next || current === next) return resultRow(label, next ? 'Unchanged' : 'Blank workbook cell, skipped')
    const conflict = element.startsWith('101') || /^paint/i.test(current)
    if (conflict) conflicts++
    if (conflict && !overwrite) return resultRow(label, 'Conflict, kept current value ' + current)
    written++
    return resultRow(label, (current || 'Blank') + ' → ' + next + (conflict ? ', overwrote conflict' : '') +
      (appliesTo === 'Type' ? ', applies to every sample instance of this type' : ''))
  })
  return { summary: 'Prepared ' + written + ' sample value changes, ' + (overwrite ? conflicts + ' conflicts included.' : conflicts + ' conflicts skipped.'), rows }
}
