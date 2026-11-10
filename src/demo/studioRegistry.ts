import type { DemoDefinition } from './types'

type StudioDefinition = Pick<DemoDefinition, 'title' | 'summary' | 'basis' | 'steps' | 'load'>

export const studioDemos: Partial<Record<string, StudioDefinition>> = {
  'architech-i3d': {
    title: 'Size and export a Revit family with I3D',
    summary: 'Choose a reference or mesh, set its dimensions and appearance, then review a sample export and placement.',
    basis: [
      'The demo follows the Desktop Source, Asset, Engine, Material and Result stages with a prepared Dragon fixture.',
      'I3D uses a known dimension to set scale and reports file save, family load and instance placement separately.',
      'The source image and the desktop and Revit captures come from I3D’s sample materials and validation work. Browser actions use a separate fictional project and simulate export.',
    ],
    steps: [
      { id: 'source', title: 'Use a sample source', hint: 'Choose the sample photo or prepared mesh.', target: 'i3d-source' },
      { id: 'scale', title: 'Set the known height', hint: 'Try a new height in millimetres and lock the scale.', target: 'i3d-scale' },
      { id: 'engine', title: 'Prepare the sample geometry', hint: 'See how the chosen source reaches the geometry stage.', target: 'i3d-engine' },
      { id: 'material', title: 'Choose the appearance', hint: 'Pick Photo texture or Untextured before reviewing export.', target: 'i3d-material' },
      { id: 'export', title: 'Request export and placement', hint: 'Check the category and dimensions before requesting the sample export.', target: 'i3d-export' },
      { id: 'approve', title: 'Review the three results', hint: 'Approve the simulated export and check saved, loaded and placed separately.', target: 'i3d-approve' },
    ],
    load: () => import('./StudioDemo').then(({ I3d }) => ({ default: I3d })),
  },
  'architech-assistant': {
    title: 'Approve and verify a one-wall update',
    summary: 'Explore Ask and Search, then use Build to review a Comments change and verify the stored value.',
    basis: [
      'Ask, Search and Build reflect the Assistant’s separate modes.',
      'The Build scenario follows the scoped parameter preview, Deny or Approve once, and readback workflow in the Assistant and the separate Revit Connector.',
      'The Ask answers are prepared references. Search and Build read and update the same fictional wall and Comments value in this browser session.',
    ],
    steps: [
      { id: 'proposal', title: 'Preview a one-wall change', hint: 'Enter a Comments value and preview the typed parameter update.', target: 'assistant-propose' },
      { id: 'decision', title: 'Review the approval request', hint: 'Deny the write or approve this single operation.', target: 'assistant-decide' },
      { id: 'readback', title: 'Verify the exact value', hint: 'Read the stored sample value. If you denied the write, reopen the proposal to try approval.', target: 'assistant-readback' },
    ],
    load: () => import('./StudioDemo').then(({ Assistant }) => ({ default: Assistant })),
  },
}
