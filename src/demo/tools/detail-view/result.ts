import type { WorkflowInput } from '../../generatedWorkflow'
import { sampleResidence } from '../../fixtures/sampleResidence'
import { cell, enabled, field, numberInRange, option, resultRow } from '../folioSupport'

const detailTabs = ['Wall section', 'Ceiling detail', 'Floor detail', 'Wall detail']
const heights = [[-300, 3200], [2600, 3200], [-300, 300], [900, 1500]]
const targets = ['A-701, Wall Details', 'A-702, Level Details', 'Create new sample sheet']
const placed = ['Wall Section, Level 01', 'Ceiling Detail, Level 01', 'Floor Detail, Level 02']

export const settings = (_window: string, tab: number) => tab === 5 ? [
  option('Target sheet', targets),
  option('Layout', ['One view per sheet', 'Two views per sheet']),
] : []

export default function result({ action, fields, priorFields = [], records, tab = 0 }: WorkflowInput) {
  if (!records.length) return 'Tick at least one sample level or view.'
  if (action === 'Place on sheets') {
    const target = field(fields, 'Target sheet', targets[0])
    const layout = field(fields, 'Layout', 'One view per sheet')
    const capacity = layout === 'Two views per sheet' ? 2 : 1
    return {
      summary: 'Prepared ' + records.length + ' sample view placements.',
      rows: records.map((record, index) => {
        const view = cell(record, 'View') || placed[index % placed.length]
        const existing = cell(record, 'Placed On', 'Placed on')
        const indexOnSheet = Math.floor(index / capacity)
        const sheet = indexOnSheet === 0 && !target.startsWith('Create') ? target : 'New sample sheet ' + (indexOnSheet + 1)
        return resultRow(view, sheet + ', Slot ' + (index % capacity + 1) +
          (existing && existing !== 'Unplaced' ? ', Place a copy with detailing' : ''))
      }),
    }
  }
  const detailKinds = detailTabs.flatMap((label, index) => index === 0 || enabled([...priorFields, ...fields], 'Make the ' + label.toLowerCase(), true) ? [index] : [])
  const configured = heights.map(([lower, upper], index) => {
    const settings = tab === index + 1 ? fields : priorFields.filter((field) => field.tab === index + 1)
    const extents = settings.filter(({ label }) => /^\+?\s*mm$/i.test(label))
    return {
      lower: numberInRange(extents[0]?.value ?? String(lower), -20000, 20000),
      upper: numberInRange(extents[1]?.value ?? String(upper), -20000, 20000),
      name: field(settings, /^(name|leave blank)/i),
    }
  })
  const invalid = detailKinds.find((index) => !(configured[index].upper > configured[index].lower))
  if (invalid !== undefined) return detailTabs[invalid] + ': enter a top extent above the bottom extent.'
  const rows = records.flatMap((record) => {
    const level = record.label
    const base = (sampleResidence.levels.find(({ name }) => name === level)?.elevation ?? 0) * 1000
    return detailKinds.map((index) => {
      const { lower, upper, name } = configured[index]
      return resultRow(level + ', ' + (name || detailTabs[index]),
        'From ' + (base + lower) + ' to ' + (base + upper) + ' mm elevation' + (index === 0 ? ', Section' : ', Callout in the wall section'))
    })
  })
  return { summary: 'Prepared ' + rows.length + ' sample detail views across ' + records.length + ' levels.', rows }
}
