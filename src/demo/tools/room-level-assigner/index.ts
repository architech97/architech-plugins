import type { ToolDefinition } from '../../types'

export default {
  kind: 'crafted',
  width: 1040,
  title: 'Room Level Assigner',
  summary: 'Choose a target level for each selected room and review the implications of recreating it with a new ID.',
  basis: [
    'The scope, editable Target Level column and recreation confirmation follow the installed tool.',
    'The fixture demonstrates preservation of room data and rollback where a target has no enclosure.',
  ],
  steps: [
    { id: 'scope', title: 'Choose rooms to load', hint: 'Use Active view or Entire model. Search by room name or number.', target: 'relevel-scope' },
    { id: 'target', title: 'Set the target levels', hint: 'Choose a different level for a selected room. Try Roof to exercise the enclosure guard.', target: 'relevel-grid' },
    { id: 'apply', title: 'Reassign Levels', hint: 'Confirm that the new room receives a new ID, then check the result.', target: 'relevel-apply' },
  ],
  load: () => import('./Dialog'),
} satisfies ToolDefinition
