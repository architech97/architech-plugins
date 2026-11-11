import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted', width: 1080, title: 'Graphic Overviews',
  summary: 'Choose overview kinds, configure line, region and material dimensions, then create sample drafting views.',
  basis: ['Four runtime sections, initial checked kinds, field units and default dimensions follow GraphicOverviewsWindow.', 'The browser stores fictional drafting-view results and sample sheet placements.'],
  steps: [
    { id: 'configure', title: 'Choose overview kinds', hint: 'Set the overview kinds, sizes and line-weight scales.', target: 'folio-configure', },
    { id: 'run', title: 'Create the sample overviews', hint: 'Review the number of drafting views and choose Create.', target: 'overviews-create', },
    { id: 'review', title: 'Read the created view list', hint: 'Inspect the new sample drafting views and sheet placements.', },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
