import type { WorkflowInput } from '../../generatedWorkflow'
import { enabled, field, resultRow } from '../folioSupport'

const scanSources = ['Text notes in views', 'Text notes on sheet', 'View name (internal)', "Viewport 'Title on Sheet'",
  'Titleblock string parameters', 'Sheet (ViewSheet) string parameters', 'Tags (IndependentTag, Keynotes, etc.)',
  'Dimension overrides (text)', 'Schedules (title / header / body / footer)']
const sampleTerms = [
  { sheet: 'A-101', source: scanSources[0], word: 'CONCETE', suggestion: 'CONCRETE', context: 'EXPOSED CONCETE FINISH' },
  { sheet: 'A-101', source: scanSources[7], word: 'APROX', suggestion: 'APPROX', context: 'APROX 1200' },
  { sheet: 'A-102', source: scanSources[3], word: 'PARTITON', suggestion: 'PARTITION', context: 'PARTITON SETOUT' },
  { sheet: 'A-501', source: scanSources[0], word: 'SEPERATION', suggestion: 'SEPARATION', context: 'SEPERATION JOINT' },
]

export const settings = () => [{ label: 'Custom dictionary (one word per line)', initial: '' }, { label: 'Project-specific words (one word per line)', initial: '' }]

export default function result({ fields, records }: WorkflowInput) {
  if (!records.length) return 'Tick at least one sample sheet to scan.'
  const chosenSources = scanSources.filter((source) => enabled(fields, source, true))
  if (!chosenSources.length) return 'Enable at least one text source under What to Scan.'
  const approved = new Set([
    field(fields, /^custom dictionary/i),
    field(fields, /^project-specific words/i),
  ].flatMap((text) => text.split(/[\s,;]+/)).map((word) => word.toUpperCase()).filter(Boolean))
  const sheets = new Set(records.map(({ label }) => label.split(' ')[0]))
  const matches = sampleTerms.filter(({ sheet, source, word }) => sheets.has(sheet) && chosenSources.includes(source) && !approved.has(word))
  return {
    summary: 'Found ' + matches.length + ' sample spelling issues across ' + sheets.size + ' sheets.',
    rows: matches.length ? matches.map(({ sheet, source, word, suggestion, context }) => resultRow(sheet + ', ' + source,
      word + ' → ' + suggestion + ', ' + context)) : [resultRow('Result', 'No unfamiliar sample terms in the chosen sheets and sources.')],
  }
}
