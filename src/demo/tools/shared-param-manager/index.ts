import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted',
  width: 1050,
  title: 'Shared Param Manager',
  summary: 'Browse a sample definitions file, add or select definitions, and bind them to the chosen project categories.',
  basis: [
    'The definitions grid, save guard and Category → Binding Mode → Parameter group sequence follow the installed Shared Param Manager.',
    'The browser keeps the file and project bindings separate. Existing categories extend for the same GUID and binding mode.',
  ],
  steps: [
    { id: 'file', title: 'Load a sample definitions file', hint: 'Choose Browse… to load the fictional shared parameter file.', target: 'shared-browse' },
    { id: 'definitions', title: 'Select definitions', hint: 'Tick Finish Code or add a definition, then save before binding.', target: 'shared-rows' },
    { id: 'bind', title: 'Bind Selected…', hint: 'Choose categories, Instance or Type and the parameter group. Review the resulting binding.', target: 'shared-bind' },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
