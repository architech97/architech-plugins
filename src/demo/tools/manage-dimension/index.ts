import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted', width: 1120, title: 'Manage Dimension',
  summary: 'Explore Dimension elements, Edit existing dimensions and Audit, with sample picks and live measurements.',
  basis: ['The runtime rail and mode controls follow ManageDimensionWindow.xaml and code-behind.', 'Sample dimension edits, merge results and audit clearing are stored only in the browser fixture.'],
  steps: [
    { id: 'configure', title: 'Choose the dimension job', hint: 'Choose Dimension elements, Edit existing dimensions or Audit.', target: 'folio-configure', },
    { id: 'run', title: 'Run the sample operation', hint: 'Review the witness positions or audit scope, then run the command.', target: 'managedim-run', },
    { id: 'review', title: 'Read the refreshed dimensions', hint: 'Inspect the merged strings, rebuilt references or audit findings.', },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
