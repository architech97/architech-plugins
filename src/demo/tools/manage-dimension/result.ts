import type { WorkflowInput } from '../../generatedWorkflow'
import { enabled, field, option, resultRow } from '../folioSupport'

const sections = ['Dimension elements', 'Edit existing dimensions', 'Audit']
const scopes = ['Dimensions I pick or select', 'All dimensions in this view', 'All dimensions in views I pick…', 'All dimensions in every view and sheet']
const views = ['Level 01 – Floor Plan', 'North Elevation', 'Section A–A']
const dims = [
  { label: 'D-481 · Level 01 – Floor Plan', length: 3300, kind: 'Typed value', detail: '3,400 typed over 3,300 mm', eligible: true },
  { label: 'D-482 · Level 01 – Floor Plan', length: 1450, kind: 'Added text', detail: 'V.I.F. suffix', eligible: true },
  { label: 'D-503 · North Elevation', length: 3150, kind: 'Locked', detail: 'Locked dimension · leave as drawn', eligible: false },
  { label: 'D-508 · Section A–A', length: 450, kind: 'Detail lines', detail: 'Already referenced to user-drawn detail lines', eligible: false },
]

export const settings = (window: string) => window === 'ticklistwindow' ? [option('View to include', views)]
  : [
    option('Tools', sections),
    option('Scope', scopes),
    option('View to include', views),
    option('Dimension type', ['Linear · 2.5 mm', 'Linear · 3.5 mm', 'Linear · 2.5 mm architectural tick']),
    option('Parallel merge', ['Keep strings on one line', 'Also join parallel strings that are off the line']),
  ]

export default function result({ windowName, fields }: WorkflowInput) {
  const view = field(fields, 'View to include', views[0])
  if (windowName === 'ticklistwindow') return { summary: 'Selected a sample view for the current job.', rows: [resultRow('View', view)] }
  const job = field(fields, 'Tools', sections[0])
  const scope = field(fields, 'Scope', scopes[0])
  const type = field(fields, 'Dimension type', 'Linear · 2.5 mm')
  const inScope = dims.filter(({ label }) => scope === scopes[3] || label.includes(scope === scopes[2] ? view : views[0]))
  if (job === 'Audit') {
    const issues = inScope.filter(({ kind }) => kind !== 'Detail lines')
    return { summary: 'Found ' + issues.length + ' audit findings in the sample scope.',
      rows: issues.map(({ label, kind, detail }) => resultRow(label, kind + ' · ' + detail)) }
  }
  if (job === 'Edit existing dimensions') {
    const operation = field(fields, 'Do', 'Merge strings into one')
    if (operation === 'Change dimension type') {
      return { summary: 'Prepared the sample dimension type change.',
        rows: inScope.map(({ label, kind }) => resultRow(label, kind === 'Locked' ? 'Skipped · locked' : 'Linear · 2.5 mm → ' + type)) }
    }
    const editable = inScope.filter(({ eligible }) => eligible)
    if (operation === 'Rebuild on detail lines') return {
      summary: 'Prepared ' + editable.length + ' rebuilds on detail lines. Rebuilt dimensions retain the measured value and stop following moved elements.',
      rows: inScope.map(({ label, detail, length, eligible }) => resultRow(label, eligible ? length + ' mm · New witness detail lines' : 'Skipped · ' + detail)),
    }
    if (editable.length < 2) return 'At least two eligible sample dimension strings are needed to merge.'
    const parallel = /^also join/i.test(field(fields, 'Parallel merge'))
    if (!parallel) return { summary: 'The two sample strings are parallel and off the line.',
      rows: [resultRow('Merge review', 'Skipped · enable Also join parallel strings that are off the line to snap them onto the first string.')] }
    return { summary: 'Prepared one combined dimension string on the first selected line.',
      rows: editable.map(({ label, length }) => resultRow(label, length + ' mm · Witness positions retained')) }
  }
  const picked = field(fields, 'What') === 'The elements I select'
  const cut = field(fields, 'CutLine', 'Click two points')
  const overall = enabled(fields, /^add an overall dimension/i)
  return { summary: 'Prepared a sample dimension string through the ' + (picked ? 'selected elements.' : 'picked cut line.'),
    rows: [
      resultRow('References', picked ? 'Selected wall and joinery edges' : cut + ' · 4 witness detail lines'),
      resultRow('Dimensions', '115 mm + 3170 mm + 115 mm' + (overall ? ' · Overall 3400 mm' : '')),
      resultRow('Placement', field(fields, 'Place', 'Just outside the elements') + ' · ' + type),
    ] }
}
