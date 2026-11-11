import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted', width: 1180, title: 'Update Schedule',
  summary: 'Export editable schedules, review an import, edit parameters in a grid and inspect the updated schedule rows.',
  basis: ['Export, Import, Edit in Grid and Schedule Preview follow the current runtime SectionNav and native controls.', 'Downloadable workbooks, prepared imports and edited values contain only fictional Sample Residence data.'],
  steps: [
    { id: 'configure', title: 'Tick a schedule', hint: 'In Export, tick Door Schedule and choose Excel workbook or CSV.', target: 'folio-configure', },
    { id: 'run', title: 'Export the sample schedule', hint: 'Download the editable sample schedule.', target: 'schedule-export', },
    { id: 'review', title: 'Inspect the output', hint: 'Inspect the activity log, then explore Import, Edit in Grid and Schedule Preview.', },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
