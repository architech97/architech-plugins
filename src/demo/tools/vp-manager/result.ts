import type { WorkflowInput, WorkflowRecord } from '../../generatedWorkflow'
import { sampleResidence } from '../../fixtures/sampleResidence'
import { cell, enabled, field, numberInRange, option, resultRow } from '../folioSupport'

const sheets = sampleResidence.sheets.filter(({ placeholder }) => !placeholder).map(({ number, name }) => number + ', ' + name)
const references = sampleResidence.views.slice(0, 4).map(({ sheet, name }) => sheet + ', ' + name)
const flags = ['Leave unchanged', 'Show', 'Hide']
const detailType = ['Title with Line', 'Title without Line', 'No Title']
const sheet = (record: WorkflowRecord) => cell(record, 'Sheet')
const view = (record: WorkflowRecord) => cell(record, 'View') || record.label

export const settings = (_window: string, tab: number) => {
  if (tab === 0) return [option('Reference viewport', references), option('Reference edge', ['Left edge', 'Right edge', 'Top edge', 'Bottom edge', 'Center'])]
  if (tab === 1) return [option('Crop reference viewport', references)]
  if (tab === 2) return [
    option('Target viewport type', detailType),
    option('Reading order', ['Left to right', 'Top to bottom']),
    { label: 'Title to set', initial: '' }, { label: 'Title prefix', initial: '' }, { label: 'Title suffix', initial: '' },
  ]
  if (tab === 3) return [option('Move to target sheet', sheets)]
  return [option('Target sheet', sheets), option('Sheet layout', ['One view per sheet', 'Two views per sheet'])]
}

export default function result({ action, fields, records }: WorkflowInput) {
  if (!records.length) return 'Tick the sample viewports or views to include.'
  if (action === 'Align viewports') {
    if (records.length < 2) return 'Tick at least two viewports: the reference and the ones to line up with it.'
    const ref = field(fields, 'Reference viewport', references[0])
    const refSheet = ref.split(', ')[0]
    const refView = ref.split(', ')[1]
    if (!records.some((record) => sheet(record) === refSheet && view(record) === refView)) return 'Include the reference viewport in the ticked scope.'
    const mode = field(fields, 'AlignMode', 'Same position on its sheet as the reference (other sheets)')
    const edge = /^to the reference/i.test(mode)
    const same = /^same position/i.test(mode)
    const rows = records.map((record) => {
      const sameSheet = sheet(record) === refSheet
      if (sameSheet && view(record) === refView) return resultRow(record.label, 'Reference viewport, kept in place')
      if (edge !== sameSheet) return resultRow(record.label, 'Skipped, ' + (edge ? 'not on ' + refSheet : 'already on the reference sheet'))
      const target = edge ? field(fields, 'Reference edge') : same ? 'Same sheet position' : 'Matching model coordinates'
      const choices = [enabled(fields, /^also match the crop/i) && 'Crop matched', enabled(fields, /^also match the viewport type/i) && 'Viewport type matched',
        enabled(fields, /^also align viewport titles/i) && (cell(record, 'Pinned') === 'Yes' ? 'Pinned title kept' : 'Title position matched')].filter(Boolean)
      return resultRow(record.label, [target, ...choices].join(', '))
    })
    return { summary: 'Prepared viewport alignment to ' + ref + '.', rows }
  }
  if (action === 'Copy crop') {
    const marginText = field(fields, /^grow crop by/i)
    const margin = marginText.trim() ? numberInRange(marginText, -5000, 5000) : 0
    if (!Number.isFinite(margin)) return 'Enter a numeric crop margin between −5,000 and 5,000.'
    const ref = enabled(fields, /^match crop to/i) ? field(fields, 'Crop reference viewport', references[0]) : ''
    const region = field(fields, 'Crop region visible', flags[0])
    const annotation = field(fields, 'Annotation crop', flags[0])
    if (!margin && !ref && region === flags[0] && annotation === flags[0]) return 'Choose a crop reference, margin or visibility setting.'
    const rows = records.map((record) => {
      const scale = parseInt(cell(record, 'Scale').replace(/^1:/, ''), 10) || 50
      const amount = enabled(fields, /^paper mm/i) ? margin * scale : margin
      return resultRow(record.label, [
        ref && 'Copy crop from ' + ref, amount && 'Crop margin ' + amount + ' model mm',
        region !== flags[0] && 'Crop region: ' + region, annotation !== flags[0] && 'Annotation crop: ' + annotation,
      ].filter(Boolean).join(', '))
    })
    return { summary: 'Prepared crop changes for ' + rows.length + ' sample views.', rows }
  }
  if (action === 'Renumber viewports') {
    const mode = field(fields, 'TitleAction', 'Viewport type:')
    if (/^viewport type/i.test(mode)) {
      const type = field(fields, 'Target viewport type', detailType[0])
      return { summary: 'Prepared viewport type changes.', rows: records.map((record) =>
        resultRow(record.label, cell(record, 'Viewport type') === type ? type + ', Unchanged' : cell(record, 'Viewport type') + ' → ' + type)) }
    }
    if (/^title on sheet/i.test(mode)) {
      const rows = records.map((record) => {
        const old = cell(record, 'Title on sheet') || view(record)
        const find = field(fields, 'Find')
        const next = field(fields, 'Title to set') || (find ? old.replaceAll(find, field(fields, 'Replace')) : old)
        return resultRow(record.label, old + ' → ' + field(fields, 'Title prefix') + next + field(fields, 'Title suffix'))
      })
      return { summary: 'Prepared title changes for the ticked sample viewports.', rows }
    }
    const start = numberInRange(field(fields, 'Start', '1'), -99999, 99999)
    const step = numberInRange(field(fields, 'Step', '1'), -99999, 99999)
    if (!Number.isInteger(start) || !Number.isInteger(step) || step === 0) return 'Start and step must be whole numbers, and step cannot be 0.'
    const nextNumber = enabled(fields, /^continue after highest/i)
    const bySheet = new Map<string, number>()
    const numericDetail = (record: WorkflowRecord) => Number(cell(record, 'Detail #')) || 0
    const ordered = field(fields, 'Reading order') === 'Top to bottom' ? [...records].reverse() : records
    const rows = ordered.map((record) => {
      const number = sheet(record)
      const max = Math.max(...records.filter((item) => sheet(item) === number).map(numericDetail))
      const proposed = bySheet.get(number) ?? (nextNumber ? max + 1 : start)
      bySheet.set(number, proposed + (nextNumber ? 1 : step))
      return resultRow(record.label, cell(record, 'Detail #') + ' → ' + (nextNumber ? '' : field(fields, 'Prefix')) + proposed)
    })
    return { summary: 'Prepared numbering in ' + field(fields, 'Reading order', 'Left to right').toLowerCase() + ' order per sample sheet.', rows }
  }
  if (action === 'Pin viewports') {
    const mode = field(fields, 'PinAction', 'Pin the ticked viewports')
    const move = /^move/i.test(mode)
    const pin = !/^unpin/i.test(mode)
    const target = field(fields, 'Move to target sheet', sheets[0])
    const rows = records.map((record) => resultRow(record.label, move
      ? target.startsWith(sheet(record) + ',') ? 'Already on target sheet' : 'Move to ' + target + ', Pin, rotation and centre retained'
      : (cell(record, 'Pinned') === 'Yes') === pin ? 'Already ' + (pin ? 'pinned' : 'unpinned') : pin ? 'Unpinned → Pinned' : 'Pinned → Unpinned'))
    return { summary: 'Prepared ' + (move ? 'sheet moves' : 'pin-state changes') + ' for the sample viewports.', rows }
  }
  if (action === 'Place on sheets') {
    const target = field(fields, 'Target sheet', sheets[0])
    const layout = field(fields, 'Sheet layout', 'One view per sheet')
    const perSheet = layout === 'Two views per sheet' ? 2 : 1
    return { summary: 'Prepared viewport placement using ' + layout.toLowerCase() + '.',
      rows: records.map((record, index) => resultRow(view(record), (index < perSheet ? target : 'New sample sheet ' + (Math.floor(index / perSheet) + 1)) +
        ', Slot ' + (index % perSheet + 1) + (sheet(record) ? ', Copy with detailing' : ''))) }
  }
  return undefined
}
