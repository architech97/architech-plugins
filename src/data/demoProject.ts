export const DEMO_PROJECT = {
  code: 'AT-01',
  name: 'Sample Residence',
  revision: 'P02',
  stage: 'Coordination',
  units: 'Metric',
} as const

export const PROJECT_WORKFLOW = [
  { id: 'room-to-view', phase: 'Model', title: 'Generate room views', detail: 'Select rooms and choose plans, elevations and sheet layouts.' },
  { id: 'room-to-finishes', phase: 'Finish', title: 'Review room finishes', detail: 'Choose materials and approve the rooms in the creation plan.' },
  { id: 'sheet-manager', phase: 'Document', title: 'Prepare the drawing set', detail: 'Preview a new numbering rule on the floor plan sheets.' },
  { id: 'warnings-inspector', phase: 'Review', title: 'Triage model warnings', detail: 'Find critical issues, isolate elements and export the sample report.' },
] as const
