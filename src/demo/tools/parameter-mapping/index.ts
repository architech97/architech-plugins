import type { ToolDefinition } from '../../types'

export default {
  basis: [
    'The category, optional type filter and value controls follow the installed Parameter Mapping dialog.',
    'All element values and results come from the fictional sample project.',
  ],
  steps: [
    { id: 'configure', title: 'Load the sample category', hint: 'Choose a category, optional family/type filter and the source and target. Choose Load categories.', target: 'gen-configure' },
    { id: 'run', title: 'Review parameter mappings', hint: 'Select Apply Mapping to inspect changes. Try a prefix, suffix or Manual value before previewing again.', target: 'gen-run' },
    { id: 'apply', title: 'Apply the ticked rows', hint: 'Review the sample result and choose Apply to sample.', target: 'gen-apply' },
    { id: 'review', title: 'Review the result', hint: 'Inspect the sample receipt and mark it reviewed.', target: 'gen-review' },
  ],
} satisfies ToolDefinition
