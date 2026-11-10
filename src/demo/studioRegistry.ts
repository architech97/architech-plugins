import type { DemoDefinition } from './types'

type StudioDefinition = Pick<DemoDefinition, 'title' | 'summary' | 'basis' | 'steps' | 'load'>

export const studioDemos: Partial<Record<string, StudioDefinition>> = {
  'architech-i3d': {
    title: 'Size and export a Revit family with I3D',
    summary: 'Size a chair or Dragon fixture, choose its material and mesh budget, then review a sample export receipt.',
    basis: [
      'The demo follows the Desktop Source, Asset, Engine, Material and Result stages with prepared chair and Dragon fixtures.',
      'I3D uses a known dimension to set scale. In the Revit route, the result reports file save, family load and instance placement separately.',
      'The chair image is a native Material-stage capture before export. The separate Dragon placement image records a Revit validation run. Browser actions use fictional project data and download a JSON receipt.',
    ],
    steps: [
      { id: 'source', title: 'Use a sample source', hint: 'Choose the prepared chair mesh, Dragon photo or prepared Dragon mesh.', target: 'i3d-source' },
      { id: 'scale', title: 'Set the known height', hint: 'Try a new height in millimetres and lock the scale.', target: 'i3d-scale' },
      { id: 'engine', title: 'Prepare the sample geometry', hint: 'Set the mesh quality, then prepare the selected fixture.', target: 'i3d-engine' },
      { id: 'material', title: 'Choose material and detail', hint: 'Review texture, drawing detail and simplification, then Apply and continue.', target: 'i3d-material' },
      { id: 'export', title: 'Choose an export target', hint: 'Review the settings and request export for Revit, Rhino or AutoCAD.', target: 'i3d-export' },
      { id: 'approve', title: 'Review the export receipt', hint: 'For Revit, approve the simulated export and check saved, loaded and placed separately. The CAD targets report a sample file save.', target: 'i3d-approve' },
    ],
    load: () => import('./StudioDemo').then(({ I3d }) => ({ default: I3d })),
  },
  'architech-assistant': {
    title: 'Approve and verify a one-wall update',
    summary: 'Read the active view, then use Build to review a Comments change and verify the stored value.',
    basis: [
      'Ask, Search and Build reflect the Assistant’s separate modes.',
      'The Build scenario follows the scoped parameter preview, Deny or Approve once, and readback workflow in the Assistant and the separate Revit Connector.',
      'Ask uses prepared reference answers. Search and Build share the fictional Sample Residence model and Comments value in the browser.',
      'The native capture records a separate active-view readback. Browser approvals and receipts describe sample state.',
    ],
    steps: [
      { id: 'context', title: 'Read the active view', hint: 'Run the read-only Search example and confirm the sample view is Cover.', target: 'assistant-context' },
      { id: 'build-mode', title: 'Open Build', hint: 'Switch to Build to review a change in the same browser fixture.', target: 'assistant-build-mode' },
      { id: 'proposal', title: 'Preview a one-wall change', hint: 'Enter a Comments value and preview the typed parameter update.', target: 'assistant-propose' },
      { id: 'decision', title: 'Review the approval request', hint: 'Deny the write or approve this single operation.', target: 'assistant-decide' },
      { id: 'readback', title: 'Verify the exact value', hint: 'Read the stored sample value. If you denied the write, reopen the proposal to try approval.', target: 'assistant-readback' },
    ],
    load: () => import('./StudioDemo').then(({ Assistant }) => ({ default: Assistant })),
  },
}
