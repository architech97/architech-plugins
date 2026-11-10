import type { ToolDefinition } from '../../types'

export default {
  basis: [
    'The native copy uses a chosen room source and category, retains unmatched elements and requires review before overwriting values.',
    'All element values and results come from the fictional sample project.',
  ],
  steps: [
    { id: 'configure', title: 'Choose source and destination', hint: 'Pick a sample link or This model, element category, room text property and target parameter.', target: 'gen-configure' },
    { id: 'run', title: 'Review the copy', hint: 'Check matching elements and the no-room case before applying.', target: 'gen-run' },
    { id: 'apply', title: 'Apply the ticked rows', hint: 'Review the sample result and choose Apply to sample.', target: 'gen-apply' },
    { id: 'review', title: 'Review the result', hint: 'Inspect the sample receipt and mark it reviewed.', target: 'gen-review' },
  ],
} satisfies ToolDefinition
