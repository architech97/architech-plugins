import type { WorkflowField, WorkflowRecord, WorkflowResult } from './generatedWorkflow'

export const DEFAULT_KEEP_AS_TYPED = 'GWB, MDF, MR, FR, UNO, U.N.O., TYP, mm, cm, m, SS, AFF, FFL'
const CLEANING = ['Trim ends', 'Collapse spaces', 'Remove empty lines', 'Join lines', 'Straighten quotes']

export function folioTextSettings(operation: string, mode: string) {
  if (operation === 'Tidy spaces and lines') return [{ label: 'Cleanup', choices: CLEANING, initial: CLEANING[0] }]
  if (operation === 'Find & replace') return [
    { label: 'Find', initial: '' },
    { label: 'Replace with', initial: '' },
    { label: 'Match case', choices: ['Off', 'On'], initial: 'Off' },
    { label: 'Whole word', choices: ['Off', 'On'], initial: 'Off' },
  ]
  return operation === 'Change case' && !['UPPER', 'lower'].includes(mode)
    ? [{ label: 'Keep as typed', initial: DEFAULT_KEEP_AS_TYPED }]
    : []
}

function preserveTerms(original: string, changed: string, exceptions: string) {
  if (original.length !== changed.length) return changed
  const keep = exceptions.split(',').map((term) => term.trim()).filter(Boolean)
  const mixedCase = /\p{Ll}/u.test(original)
  const chars = changed.split('')
  for (const token of original.matchAll(/\p{L}+(?:\.\p{L}+)*\.?/gu)) {
    const start = token.index
    const [word] = token
    const listed = keep.find((term) => [word, word.replace(/\.$/, '')].some((candidate) => candidate.toLowerCase() === term.toLowerCase()))
    const unit = start > 0 && /\d/.test(original[start - 1])
    const acronym = mixedCase && word.length > 1 && !/\p{Ll}/u.test(word)
    const preserve = listed ?? (unit || acronym ? word : '')
    for (let index = 0; index < preserve.length; index++) chars[start + index] = preserve[index]
  }
  return chars.join('')
}

function changeCase(value: string, mode: string, keep: string) {
  if (mode === 'UPPER') return value.toUpperCase()
  const lower = value.toLowerCase()
  if (mode === 'lower') return lower
  const changed = mode === 'Title Case'
    ? lower.replace(/\p{L}+/gu, (word) => word[0].toUpperCase() + word.slice(1))
    : mode === 'Sentence case'
      ? lower.replace(/(^|[.!?\r\n][^\p{L}\p{N}]*)(\p{L})/gu, (_, prefix: string, letter: string) => prefix + letter.toUpperCase())
      : lower.charAt(0).toUpperCase() + lower.slice(1)
  return preserveTerms(value, changed, keep)
}

function cleanText(value: string, mode: string) {
  switch (mode) {
    case 'Collapse spaces': return value.replace(/[ \t\u00a0]{2,}/g, ' ').replace(/[ \t]+(?=\r?$)/gm, '')
    case 'Remove empty lines': return value.split(/\r\n?|\n/).filter((line) => line.trim()).join('\n')
    case 'Join lines': return value.split(/\r\n?|\n/).map((line) => line.trim()).filter(Boolean).join(' ')
    case 'Straighten quotes': return value.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    default: return value.trim()
  }
}

export function folioTextTransform(fields: WorkflowField[]): ((before: string, name: string) => string) | string {
  const get = (label: string, fallback = '') => fields.find((field) => field.label === label)?.value ?? fallback
  const operation = get('Op', 'Change case')
  const mode = get('Case', 'UPPER')
  const find = get('Find')
  if (operation === 'Find & replace' && !find) return 'Type the text to find.'
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const exact = get('Whole word') === 'On'
  const pattern = new RegExp(exact ? `\\b${escaped}\\b` : escaped, get('Match case') === 'On' ? 'g' : 'gi')
  return (before, name) => {
    if (operation === 'Tidy spaces and lines') return cleanText(before, get('Cleanup', CLEANING[0]))
    if (operation === 'Find & replace') return before.replace(pattern, () => get('Replace with'))
    if (operation === 'Apply an Excel file') return name === 'Entry wall note' ? 'Existing wall to remain. Verify opening.' : before
    return changeCase(before, mode, get('Keep as typed', DEFAULT_KEEP_AS_TYPED))
  }
}

export function folioTextResult(fields: WorkflowField[], records: WorkflowRecord[]): WorkflowResult | string {
  const transform = folioTextTransform(fields)
  if (typeof transform === 'string') return transform
  const notes = records.map((record) => {
    const before = record.columns.Before
    const name = record.columns.Note || record.label
    if (!before) return { label: name, before: '', after: '' }
    return { label: name, before, after: transform(before, name) }
  })
  const changed = notes.filter(({ before, after }) => before !== after).length
  return {
    summary: changed ? `Prepared text changes for ${changed} of ${notes.length} sample notes.` : 'The selected operation leaves the sample notes unchanged.',
    rows: notes.map(({ label, before, after }) => ({ label, value: before === after ? before + ', unchanged' : before + ' → ' + after })),
  }
}
