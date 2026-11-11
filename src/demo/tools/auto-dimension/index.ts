import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted', width: 1160, title: 'Auto Dimension',
  summary: 'Configure strings, choose views and control placement, then Keep or Undo a sample dimension run.',
  basis: ['Strings, Views and Placement match the runtime sections and native option labels in AutoDimensionWindow.', 'The browser uses fictional sample measurements and implements the Keep or Undo workflow.'],
  steps: [
    { id: 'configure', title: 'Choose strings and views', hint: 'Set the dimension strings, target views and placement options.', target: 'folio-configure', },
    { id: 'run', title: 'Dimension the sample', hint: 'Run Dimension to inspect the sample strings.', target: 'autodim-run', },
    { id: 'review', title: 'Keep or undo the run', hint: 'Choose Keep to retain the sample strings, or Undo to restore the previous fixture.', target: 'autodim-review', },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
