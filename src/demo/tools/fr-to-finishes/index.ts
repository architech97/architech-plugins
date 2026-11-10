import type { ToolDefinition } from '../../types'

export default {
  basis: [
    'FR to Finishes follows the active view, the finish type and the treatment of source regions in the native dialog.',
    'All element values and results come from the fictional sample project.',
  ],
  steps: [
    { id: 'configure', title: 'Choose a filled-region conversion', hint: 'Set the active sample view, finish type and height offset. The view determines Floor, Ceiling or Wall.', target: 'gen-configure' },
    { id: 'run', title: 'Convert sample regions', hint: 'Compare the source boundary with the proposed finish. The preview explains which regions remain unchanged.', target: 'gen-run' },
    { id: 'apply', title: 'Apply the ticked rows', hint: 'Review the sample result and choose Apply to sample.', target: 'gen-apply' },
    { id: 'review', title: 'Review the result', hint: 'Inspect the sample receipt and mark it reviewed.', target: 'gen-review' },
  ],
} satisfies ToolDefinition
