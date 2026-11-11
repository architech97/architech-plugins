import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted',
  width: 1100,
  title: 'Deviation Inspector',
  summary: 'Analyze sample scan-to-model distances, inspect the classified elements and clear the sample heatmap.',
  basis: [
    'Sampling settings, evaluation metrics and result thresholds follow the installed Deviation Inspector.',
    'Distances and projection yields are fictional. Projection yield is a proportion of retrieved sample points.',
  ],
  steps: [
    { id: 'settings', title: 'Check sampling options', hint: 'Choose a tolerance and open Sampling and result metric to compare P95, Mean and Maximum.', target: 'deviation-settings' },
    { id: 'analyze', title: 'Analyze the sample scan', hint: 'Read the heatmap and check that unmeasured rows never pass.', target: 'deviation-analyze' },
    { id: 'inspect', title: 'Inspect one element', hint: 'Select an element row and choose Show in 3D.', target: 'deviation-grid' },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
