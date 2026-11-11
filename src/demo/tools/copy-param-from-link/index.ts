import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted',
  width: 560,
  title: 'Copy Param from Link',
  summary: 'Choose a room source, category and two text parameters, then review the sample values to copy.',
  basis: [
    'The deployed dialog opens on Current Model, Doors, Name · built-in and Comments · built-in, with Copy enabled.',
    'Changing the source clears the room property. Changing the category clears the target parameter.',
    'All element values and results come from the fictional sample project.',
  ],
  steps: [
    { id: 'configure', title: 'Choose source and destination', hint: 'Review Current Model or pick a sample link, element category, room text property and target parameter.', target: 'copy-configure' },
    { id: 'run', title: 'Review the copy', hint: 'Choose Copy and compare the current and proposed values.', target: 'copy-preview' },
    { id: 'apply', title: 'Apply the ticked rows', hint: 'Review the sample result and choose Apply to sample.', target: 'gen-apply' },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
