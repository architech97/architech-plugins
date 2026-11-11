import type { DemoDefinition } from '../../types'

export const definition: DemoDefinition = {
  id: 'split-floor-ceiling', productSlug: 'split-floor-ceiling',
  ribbon: { tab: 'Arch Forge', panel: 'Finishes', button: 'Split Floor Ceiling' },
  kind: 'crafted',
  width: 1060,
  title: 'Split Floor / Ceiling',
  summary: 'Review separate sketch regions and the dependent IDs for each floor or ceiling before applying the split.',
  basis: [
    'The selection, dependency choices and result follow the installed Split Floor / Ceiling command.',
    'The preview retains openings inside their regions. If the sample deletion reports an unreviewed ID, only that host rolls back.',
  ],
  steps: [
    { id: 'configure', title: 'Pick floors and ceilings', hint: 'Choose the ground floor, first floor or ceiling sketch.', target: 'floor-picks' },
    { id: 'preview', title: 'Review separate regions', hint: 'Preview the pieces and the dependent IDs by source.', target: 'floor-preview' },
    { id: 'apply', title: 'Review the deletion guard', hint: 'Choose whether to skip hosts with dependents or allow the listed IDs, then inspect the receipt.', target: 'floor-finish' },
  ],
  load: () => import('./Dialog'),
}
