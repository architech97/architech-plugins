/** Four tools that take one project from rooms to a reviewed drawing set. */
export const PROJECT_WORKFLOW = [
  { id: 'room-to-view', phase: 'Model', title: 'Generate room views', detail: 'Select rooms and choose plans, elevations and sheet layouts.' },
  { id: 'room-to-finishes', phase: 'Finish', title: 'Review room finishes', detail: 'Choose materials and approve the rooms in the creation plan.' },
  { id: 'sheet-manager', phase: 'Document', title: 'Prepare the drawing set', detail: 'Duplicate, renumber and rename many sheets from one list.' },
  { id: 'warnings-inspector', phase: 'Review', title: 'Triage model warnings', detail: 'Find critical issues, isolate elements and export the report.' },
] as const
