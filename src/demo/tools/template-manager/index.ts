import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted', width: 1180, title: 'Template Manager',
  summary: 'Transfer templates, filters, graphics and CAD visibility through the current four runtime tools.',
  basis: ['Templates from model, Filters, V/G and hidden elements and Imports off match the deployed wrapper and child workflows.', 'Skip is the native default for same-named templates. Each browser tool retains its choices and updates fictional sample data.'],
  steps: [
    { id: 'configure', title: 'Choose a template workflow', hint: 'Select a tool and configure the source, destinations and conflict rule.', target: 'folio-configure', },
    { id: 'run', title: 'Run the sample transfer', hint: 'Review the selected templates, filters or visibility targets, then run.', target: 'template-run', },
    { id: 'review', title: 'Read the activity log', hint: 'Check which sample definitions changed and which were kept.', },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
