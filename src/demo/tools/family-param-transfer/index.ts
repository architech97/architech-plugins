import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted',
  width: 1050,
  title: 'Family Param Transfer',
  basis: [
    'The native tool preserves the shared definition GUID and skips an existing definition with that GUID.',
    'All element values and results come from the fictional sample project.',
  ],
  steps: [
    { id: 'configure', title: 'Load definitions', hint: 'Choose a source mode and prepare the sample shared file, loaded family or RFA.', target: 'family-source' },
    { id: 'run', title: 'Review source and target', hint: 'Tick definitions, choose a target loaded family or RFA, then choose Transfer.', target: 'family-transfer' },
    { id: 'apply', title: 'Confirm the transfer', hint: 'Review the captured source and target and inspect the resulting sample definitions.', target: 'family-transfer' },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
