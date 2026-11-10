import type { ToolDefinition } from '../../types'

export default {
  basis: [
    'The native tool preserves the shared definition GUID and skips an existing definition with that GUID.',
    'All element values and results come from the fictional sample project.',
  ],
  steps: [
    { id: 'configure', title: 'Load definitions', hint: 'Choose Shared parameter file, Loaded family or Browse .rfa, then choose Load parameters.', target: 'gen-configure' },
    { id: 'run', title: 'Review the selected definitions', hint: 'Tick one or more definitions, choose the target family and select Transfer. Existing matching GUIDs are retained.', target: 'gen-run' },
    { id: 'apply', title: 'Apply the ticked rows', hint: 'Review the sample result and choose Apply to sample.', target: 'gen-apply' },
    { id: 'review', title: 'Review the result', hint: 'Inspect the sample receipt and mark it reviewed.', target: 'gen-review' },
  ],
} satisfies ToolDefinition
