import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted',
  width: 1180,
  title: 'View Manager',
  summary: 'Convert, duplicate, template, rename and review view settings using the deployed tool’s six sections.',
  basis: ['The six section titles, selection grid and operation controls follow ViewManagerWindow.xaml and its runtime SectionNav.', 'The exercise edits fictional Sample Residence views in the browser.'],
  steps: [
    { id: 'configure', title: 'Choose a view job', hint: 'Choose a section and tick the sample views you want to change.', target: 'folio-configure', },
    { id: 'run', title: 'Apply the previewed operation', hint: 'Review the preview, then run the command.', target: 'viewmanager-run', },
    { id: 'review', title: 'Read back the result', hint: 'Inspect the refreshed view table and last sample operation.', },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
