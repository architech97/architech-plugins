import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted', width: 1000, title: 'Make Pattern',
  summary: 'Open the native export-only state, or simulate selected linework to create a sample fill pattern and download a PAT definition.',
  basis: ['The export-only opening follows the observed native dialog after cancelling selection. The sample view uses the observed imperial scale 1:96 and INCH export units.', 'The browser uses bounded sample linework and pattern definitions, with the original name and overwrite validations.'],
  steps: [
    { id: 'configure', title: 'Choose an existing pattern', hint: 'Type AR-04 Diagonal Hatch into Select Pattern to Export.', target: 'pattern-configure', },
    { id: 'run', title: 'Export a PAT definition', hint: 'Choose Export PAT File and inspect the downloaded sample grid.', target: 'pattern-export', },
    { id: 'review', title: 'Review the sample pattern', hint: 'Inspect the receipt. Change the sample Revit selection to explore creation.', },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
