import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted', width: 1180, title: 'VP Manager',
  summary: 'Align viewports, adjust crops, update titles and numbers, pin or move viewports, and place sample views.',
  basis: ['The five runtime sections, initial controls and grid columns follow VpManagerWindow and the installed native opening.', 'Coordinates, crop sizes, pin state and placements are fictional and update inside the browser fixture.'],
  steps: [
    { id: 'configure', title: 'Tick the viewports', hint: 'Choose a job and tick the viewports in its scope.', target: 'folio-configure', },
    { id: 'run', title: 'Apply the sample plan', hint: 'Review the changed positions, numbers, crop or placement before running.', target: 'vpmanager-run', },
    { id: 'review', title: 'Read the updated viewport table', hint: 'Inspect the refreshed table and last sample operation.', },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
