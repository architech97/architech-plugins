export const DEFAULT_KEEP_AS_TYPED = 'GWB, MDF, MR, FR, UNO, U.N.O., TYP, mm, cm, m, SS, AFF, FFL'

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

export function changeCase(value: string, mode: string, keep: string) {
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

export function cleanText(value: string, mode: string) {
  switch (mode) {
    case 'Collapse spaces': return value.replace(/[ \t\u00a0]{2,}/g, ' ').replace(/[ \t]+(?=\r?$)/gm, '')
    case 'Remove empty lines': return value.split(/\r\n?|\n/).filter((line) => line.trim()).join('\n')
    case 'Join lines': return value.split(/\r\n?|\n/).map((line) => line.trim()).filter(Boolean).join(' ')
    case 'Straighten quotes': return value.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    default: return value.trim()
  }
}

export function replaceText(value: string, find: string, replacement: string, matchCase: boolean, wholeWord: boolean) {
  if (!find) return value
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = wholeWord ? '(?<![\\p{L}\\p{N}_])' + escaped + '(?![\\p{L}\\p{N}_])' : escaped
  return value.replace(new RegExp(pattern, matchCase ? 'gu' : 'giu'), () => replacement)
}
