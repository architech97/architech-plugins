import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted',
  width: 1040,
  title: 'Room Height Adjust',
  summary: 'Scan rooms against the ceiling above them, review the proposed heights and adjust the ticked sample rooms.',
  basis: [
    'The scope, partial-ceiling ticks, columns and Reload action follow the installed Room Height Adjust dialog.',
    'The sample exercises the fresh-preview guard and reads back Upper Limit and Limit Offset together after applying.',
  ],
  steps: [
    { id: 'scope', title: 'Choose a scope', hint: 'The active view starts with Level 01. Choose Whole model to include Level 02.', target: 'height-scope' },
    { id: 'review', title: 'Review rooms and select rows', hint: 'Compare Height now and New height. Partial ceilings start unticked.', target: 'height-rows' },
    { id: 'apply', title: 'Adjust Heights', hint: 'Apply a current preview and read back the two height fields in the receipt.', target: 'height-apply' },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
