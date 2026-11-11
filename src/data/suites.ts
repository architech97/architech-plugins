import type { Suite, SuiteId } from './types'

export const SUITES: Suite[] = [
  {
    id: 'folio', name: 'Arch Folio', short: 'Folio', color: 'var(--suite-folio)',
    focus: 'Documentation & publishing',
    summary: 'Prepare views, organise sheets and viewports, refine annotation and dimensions, and publish deliverables.',
  },
  {
    id: 'forge', name: 'Arch Forge', short: 'Forge', color: 'var(--suite-forge)',
    focus: 'Modelling & data',
    summary: 'Coordinate rooms, build finishes, manage parameters and prepare Scan-to-BIM models.',
  },
  {
    id: 'sentinel', name: 'Arch Sentinel', short: 'Sentinel', color: 'var(--suite-sentinel)',
    focus: 'Model health & standards',
    summary: 'Review warnings, enforce BEP standards, clean up content and coordinate linked models.',
  },
  {
    id: 'i3d', name: 'ArchiTECH I3D', short: 'I3D', color: 'var(--suite-i3d)',
    focus: 'Photo & mesh to Revit family',
    summary: 'Turn a product photo or an existing mesh into a dimensioned, textured 3D asset and place it in Revit.',
  },
  {
    id: 'ai', name: 'ArchiTECH MCP Connector', short: 'MCP', color: 'var(--suite-ai)',
    focus: 'MCP and AI across design tools',
    summary: 'The ArchiTECH MCP Connector and ArchiTECH Assistant bring guarded, verifiable AI automation to Revit, Rhino, SketchUp, AutoCAD and Blender.',
  },
]

export const suiteById = (id: SuiteId) => SUITES.find((s) => s.id === id)!
