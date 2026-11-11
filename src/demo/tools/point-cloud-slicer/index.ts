import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted',
  width: 1060,
  title: 'Point Cloud Slicer',
  summary: 'Generate level-based section boxes and cropped plans, then rerun with different offsets to update the same owned views.',
  basis: [
    'The installed dialog defaults to all levels, 3D section boxes, −150 mm bottom, +300 mm top and 500 mm planar buffer.',
    'The browser models level-based view identity, renamed owned views, legacy name collisions and numeric slice extents.',
  ],
  steps: [
    { id: 'levels', title: 'Tick the building levels', hint: 'Select the storeys to slice, or keep all three sample levels ticked.', target: 'slice-levels' },
    { id: 'options', title: 'Choose slice offsets and outputs', hint: 'Set the clearances and choose a 3D section box, cropped floor plan, or both.', target: 'slice-options' },
    { id: 'generate', title: 'Generate Slices', hint: 'Check the resulting view IDs and run again to update the Forge-owned views.', target: 'slice-generate' },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
