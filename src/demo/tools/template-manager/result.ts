import type { WorkflowInput } from '../../generatedWorkflow'
import { GENERATED_SAMPLE, sampleResidence } from '../../fixtures/sampleResidence'
import { enabled, field, option, resultRow } from '../folioSupport'

const sourceViews = ['Level 01 – Floor Plan', 'North Elevation', 'Interior Plan 1:50']
const targets = ['Level 02 – Floor Plan', 'Section A–A', 'Interior RCP 1:50']
const filters = ['Fire rated partitions', 'Existing to remain', 'Doors by phase']
const links = GENERATED_SAMPLE.LINKS

export const actions = (windowName: string) => windowName === 'importsoffwindow' ? ['Hide', 'Delete'] : []

export const settings = (windowName: string, tab: number) => {
  if (windowName === 'templatetransferwindow' && tab === 1) return [
    option('Apply to view templates', GENERATED_SAMPLE.TEMPLATES),
    option('Copy from link (source)', links),
    { ...option('Copy to links (targets)', links), initial: links[1] },
  ]
  if (windowName === 'filtertemplatewindow') return [option('Source view or template', sourceViews), option('Filters to copy', filters), option('Destination view or template', targets)]
  if (windowName === 'transfervsoptionswindow') return [option('Source view', sourceViews), option('Destination view', targets)]
  if (windowName === 'importsoffwindow') return [option('Target view or template', targets)]
  return []
}

export default function result({ action, fields, records, windowName }: WorkflowInput) {
  if (action === 'Transfer Selected Templates') {
    const source = field(fields, /pick an open model/i)
    const target = field(fields, /^copy to$/i)
    if (!source || !target || source === target) return 'Choose a destination model different from the source.'
    if (!records.length) return 'Tick a view template to transfer.'
    const mode = field(fields, /template already exists|conflict/i, 'Overwrite')
    const duplicate = GENERATED_SAMPLE.TEMPLATES[0]
    return {
      summary: 'Prepared the template transfer from ' + source + ' to ' + target + '.',
      rows: records.map((record) => resultRow(record.label, record.label !== duplicate ? 'Copy new template' :
        mode === 'Skip' ? 'Existing destination template kept' : mode === 'Rename' ? 'Copy as ' + record.label + ' (2)' : 'Overwrite existing destination template')),
    }
  }
  if (action === 'Copy Overrides Between Links') {
    const source = field(fields, 'Copy from link (source)', links[0])
    const target = field(fields, 'Copy to links (targets)', links[1])
    const template = field(fields, 'Apply to view templates', GENERATED_SAMPLE.TEMPLATES[0])
    if (source === target) return 'A source link cannot also be its target.'
    const skip = enabled(fields, /^skip target links/i) && target === links[1]
    return { summary: skip ? 'Kept existing overrides on the sample target link.' : 'Prepared copying link overrides within ' + template + '.',
      rows: [resultRow('Source', source), resultRow('Target', target), resultRow('Result',
        skip ? 'Skipped, target already has overrides' : 'Link display copied where supported, Revit 2024 limits custom link overrides')] }
  }
  if (windowName === 'filtertemplatewindow') {
    const source = field(fields, 'Source view or template', sourceViews[0])
    const target = field(fields, 'Destination view or template', targets[0])
    const filter = field(fields, 'Filters to copy', filters[0])
    return { summary: 'Prepared the selected filter for the sample destination picker.',
      rows: [resultRow('Source', source), resultRow('Filter', filter), resultRow('Destination preview', target + ', Filter order and visibility reviewed')] }
  }
  if (windowName === 'transfervsoptionswindow') {
    const source = field(fields, 'Source view', sourceViews[0])
    const target = field(fields, 'Destination view', targets[0])
    const choices = fields.filter(({ label, value }) => /^(element hide|visibility \/ graphics|assign the source view template)/i.test(label) && value === 'On')
    if (!choices.length) return 'Choose at least one visibility, hide-state or template option.'
    return { summary: 'Prepared visibility transfer from ' + source + ' to ' + target + '.',
      rows: choices.map(({ label }) => resultRow(label.split(')')[0].replace(/\s*\([^)]*$/, ''), 'Included in the preview')) }
  }
  if (windowName === 'importsoffwindow') {
    const remove = action === 'Delete' || /^delete/i.test(field(fields, 'Mode'))
    const target = field(fields, 'Target view or template', targets[0])
    const imports = sampleResidence.cadImports.filter(({ attachment }) => attachment === 'Embedded CAD')
    return {
      summary: remove ? 'Prepared deletion of ' + imports.length + ' project-level sample CAD imports.' : 'Prepared category visibility changes for ' + target + '.',
      rows: [...imports.map(({ name }) => resultRow(name, remove ? 'Delete embedded project import' : 'Hide its imported category')),
        resultRow('Nested imports and CAD links', 'Left in place')],
    }
  }
  return undefined
}
