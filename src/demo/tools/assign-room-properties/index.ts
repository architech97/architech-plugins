import type { ToolDefinition } from '../../types'

export default {
  basis: [
    'The native command adds mappings before review and rejects conflicting values targeting the same type parameter.',
    'All element values and results come from the fictional sample project.',
  ],
  steps: [
    { id: 'configure', title: 'Add the room mapping', hint: 'Choose the room source and property, Instance or Type, and an element parameter. Choose Add mapping.', target: 'gen-configure' },
    { id: 'run', title: 'Review assignments', hint: 'Compare the current parameter values against the room values before applying.', target: 'gen-run' },
    { id: 'apply', title: 'Apply the ticked rows', hint: 'Review the sample result and choose Apply to sample.', target: 'gen-apply' },
    { id: 'review', title: 'Review the result', hint: 'Inspect the sample receipt and mark it reviewed.', target: 'gen-review' },
  ],
} satisfies ToolDefinition
