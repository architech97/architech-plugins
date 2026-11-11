import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted',
  width: 1050,
  title: 'Assign Room Properties',
  basis: [
    'The native command adds mappings before review and rejects conflicting values targeting the same type parameter.',
    'All element values and results come from the fictional sample project.',
  ],
  steps: [
    { id: 'configure', title: 'Add room mappings', hint: 'Choose categories and add one or more Room property → Element parameter mappings.', target: 'assign-configure' },
    { id: 'run', title: 'Review assignments', hint: 'Choose Assign and compare the current and proposed values.', target: 'assign-preview' },
    { id: 'apply', title: 'Apply the ticked rows', hint: 'Review the sample result and choose Apply to sample.', target: 'gen-apply' },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
