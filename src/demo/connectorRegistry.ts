import { createElement } from 'react'
import { DEMO_PROJECT } from '../data/demoProject'
import { SHEETS } from './sample'
import type { DemoContext, DemoDefinition, DemoStep } from './types'

export type Scene = 'sheet' | 'drawing' | 'rhino' | 'sketchup' | 'blender'
type Point = [number, number, number]
export type Result = {
  title: string
  rows: [string, string][]
  failed?: boolean
}
export type Scenario = {
  title: string
  host: string
  summary: string
  basis: string[]
  file: string
  scene: Scene
  tool: string
  action: string
  request: (option: number) => string
  arguments: (option: number) => object
  inspect: (option: number) => Result
  option?: { label: string; values: string[] }
  approval?: boolean
}

export const SHEET_CHOICES = ['A-302', 'A-303', 'A-301']
export const EXISTING_SHEETS = SHEETS.filter(({ number }) => number === 'A-101' || number === 'A-301')
export const RHINO_DIMENSIONS: Point[] = [[1200, 600, 300], [900, 450, 600]]
export const SKETCHUP_HEIGHTS = [300, -300]
export const BLOCKS = [
  { label: 'DOOR-0900', layer: 'A-DOOR', points: [[140, 116], [221, 113], [265, 175], [335, 116]] },
  { label: 'CHAIR-01', layer: 'A-FURN', points: [[280, 123], [305, 123], [280, 150], [305, 150]] },
  { label: 'DESK-1200', layer: 'A-FURN', points: [[291, 136], [187, 86]] },
]
export const CAMERA_POINTS: Point[][] = [
  [[0.8, 0.8, 1.55], [2.5, 0.85, 1.55], [5.2, 1.7, 1.55]],
  [[0.8, 0.8, 0.65], [1.6, 3.9, 0.65], [5.2, 1.7, 0.65]],
]
export const OBSTACLES = [
  { name: 'Sofa', min: [1, 3.6, 0], max: [3.4, 4.5, 0.9] },
  { name: 'Coffee table', min: [2.1, 2.5, 0], max: [3.3, 3.15, 0.45] },
]

function inspectCamera(option: number): Result {
  const points = CAMERA_POINTS[option]
  const clearance = Math.min(...points.slice(1).flatMap((end, segment) => {
    const start = points[segment]
    return Array.from({ length: 51 }, (_, sample) => {
      const position = start.map((value, axis) => value + (end[axis] - value) * sample / 50)
      return Math.min(...OBSTACLES.map(({ min, max }) =>
        Math.hypot(...position.map((value, axis) => Math.max(min[axis] - value, 0, value - max[axis]))),
      ))
    })
  }))
  const required = 0.08
  const blocked = clearance < required
  return {
    title: blocked ? 'Path refused at clearance check' : 'Sample camera path accepted',
    rows: [
      ['Sampled clearance', (clearance * 1000).toFixed(0) + ' mm'],
      ['Required clearance', Math.round(required * 1000) + ' mm'],
      ['Camera result', blocked ? 'No camera path created' : '3 waypoints · 97 frames'],
    ],
    failed: blocked,
  }
}

const SCENARIOS: Record<string, Scenario> = {
  'revit-mcp': {
    title: 'Create and verify a Revit sheet',
    host: 'Revit',
    summary: 'Choose a sheet number, review the document-bound call and confirm the new sheet in the sample index.',
    basis: ['The Revit bridge accepts a document fingerprint beside the tool arguments. Model writes use a native approval gate and a separate readback.'],
    file: DEMO_PROJECT.name + '.rvt',
    scene: 'sheet',
    tool: 'bridge_run',
    approval: true,
    action: 'Approve once',
    option: { label: 'Sheet number', values: ['A-302 · Available', 'A-303 · Available', 'A-301 · In use'] },
    request: (option) => 'Create sheet ' + SHEET_CHOICES[option] + ' named Building Sections using the A1 title block.',
    arguments: (option) => ({
      capability_id: 'create.sheet',
      arguments: { number: SHEET_CHOICES[option], name: 'Building Sections', title_block: 'A1', on_collision: 'error' },
      expected_document_fingerprint: { documentId: 'sample-residence' },
    }),
    inspect: (option) => {
      const number = SHEET_CHOICES[option]
      const existing = SHEETS.find((sheet) => sheet.number === number)
      if (existing) return {
        title: 'Duplicate sheet number refused',
        rows: [['Requested number', number], ['Existing sheet', existing.name], ['Sample changes', 'No sheet created']],
        failed: true,
      }
      return {
        title: 'Sheet found in sample index',
        rows: [['Sheet number', number], ['Sheet name', 'Building Sections'], ['Title block', 'A1']],
      }
    },
  },
  'autocad-mcp': {
    title: 'Count blocks in an AutoCAD drawing',
    host: 'AutoCAD',
    summary: 'Run a read-only takeoff against a sample drawing and inspect the quantities by block and layer.',
    basis: ['AutoCAD get_block_takeoff reads ModelSpace block references, groups them by name and layer, and returns counts and attribute samples. This scene uses synthetic block references.'],
    file: DEMO_PROJECT.name + ' - Fit-out.dwg',
    scene: 'drawing',
    tool: 'get_block_takeoff',
    action: 'Run sample takeoff',
    request: () => 'Count doors, desks and chairs in ModelSpace. Group the result by block name and layer.',
    arguments: () => ({}),
    inspect: () => ({
      title: BLOCKS.reduce((count, block) => count + block.points.length, 0) + ' block references',
      rows: BLOCKS.map(({ label, layer, points }) => [label + ' · ' + layer, String(points.length)]),
    }),
  },
  'rhino-mcp': {
    title: 'Create a Rhino solid and check its bounds',
    host: 'Rhino',
    summary: 'Choose a plinth profile, approve the geometry call and inspect the measured solid.',
    basis: ['Rhino create_geometry takes primitives in document units. The native bridge checks writes against the intended document and can independently verify an analytic box.'],
    file: DEMO_PROJECT.name + ' - Plinth Study.3dm',
    scene: 'rhino',
    tool: 'create_geometry',
    approval: true,
    action: 'Approve once',
    option: { label: 'Plinth profile', values: ['1200 × 600 × 300 mm', '900 × 450 × 600 mm'] },
    request: (option) => 'Create a ' + RHINO_DIMENSIONS[option].join(' × ') + ' mm box on the Plinths layer.',
    arguments: (option) => {
      const [width, depth, height] = RHINO_DIMENSIONS[option]
      return { shape: 'box', layer: 'Plinths', corner: [0, 0, 0], width, depth, height }
    },
    inspect: (option) => ({
      title: 'Solid found in sample document',
      rows: [
        ['Layer', 'Plinths'],
        ['Measured bounds', RHINO_DIMENSIONS[option].join(' × ') + ' mm'],
        ['Computed volume', (RHINO_DIMENSIONS[option].reduce((volume, length) => volume * length, 1) / 1e9).toFixed(3) + ' m³'],
      ],
    }),
  },
  'sketchup-mcp': {
    title: 'Check signed extrusion in SketchUp',
    host: 'SketchUp',
    summary: 'Create the same sample group above or below its origin and verify the resulting world-space limits.',
    basis: ['SketchUp create_component interprets box dimensions in millimetres. Positive height extends along +Z and negative height extends along −Z from the requested origin. The bounding-box tool reads back the resulting extent.'],
    file: DEMO_PROJECT.name + ' - Massing.skp',
    scene: 'sketchup',
    tool: 'create_component',
    approval: true,
    action: 'Approve once',
    option: { label: 'Extrusion', values: ['Above origin · +300 mm', 'Below origin · −300 mm'] },
    request: (option) => 'Create a 100 × 200 mm group with a ' + SKETCHUP_HEIGHTS[option] + ' mm signed extrusion at the world origin.',
    arguments: (option) => ({ name: 'Study Mass', shape: 'box', width: 100, depth: 200, height: SKETCHUP_HEIGHTS[option], position: [0, 0, 0] }),
    inspect: (option) => ({
      title: 'World-space limits measured',
      rows: [
        ['Group', 'Study Mass'],
        ['Minimum XYZ', '0, 0, ' + Math.min(0, SKETCHUP_HEIGHTS[option]) + ' mm'],
        ['Maximum XYZ', '100, 200, ' + Math.max(0, SKETCHUP_HEIGHTS[option]) + ' mm'],
      ],
    }),
  },
  'blender-mcp': {
    title: 'Review a Blender camera path',
    host: 'Blender',
    summary: 'Check a sample walkthrough for obstacle clearance, then view a recorded Blender output.',
    basis: ['The Blender connector checks camera path intersections and sampled clearance before writing the path, without an approval dialog. The browser uses simple obstacle boxes. The recording comes from the furnished-room Blender validation project.'],
    file: DEMO_PROJECT.name + ' - Walkthrough.blend',
    scene: 'blender',
    tool: 'architech_blender_camera_path',
    action: 'Check sample path',
    option: { label: 'Camera route', values: ['Eye-level passage', 'Low route through sofa'] },
    request: () => 'Set up an editable walkthrough camera and check for at least 80 mm of obstacle clearance.',
    arguments: (option) => ({
      name: 'Walkthrough',
      points: CAMERA_POINTS[option],
      clearance_m: 0.08,
      frames_per_segment: 48,
      obstacles: OBSTACLES.map(({ name }) => name),
    }),
    inspect: inspectCamera,
  },
}

type ConnectorDefinition = Pick<DemoDefinition, 'title' | 'summary' | 'basis' | 'steps' | 'load'>

function buildDefinition(scenario: Scenario): ConnectorDefinition {
  const steps: DemoStep[] = [
    { id: 'prepare', title: 'Prepare the tool call', hint: 'Review the request and see the arguments the connector would receive.', target: 'connector-prepare' },
    { id: 'apply', title: scenario.action, hint: scenario.approval ? 'Approve the sample write, or deny it and review it again.' : 'Run the operation on the sample fixture.', target: 'connector-apply' },
    { id: 'inspect', title: 'Inspect the result', hint: 'Read the values produced by this sample run.', target: 'connector-inspect' },
  ]
  async function load() {
    const { default: ConnectorDemo } = await import('./ConnectorDemo')
    return { default: (context: DemoContext) => createElement(ConnectorDemo, { ...context, scenario }) }
  }
  return { title: scenario.title, summary: scenario.summary, basis: scenario.basis, steps, load }
}

export const connectorDemos: Partial<Record<string, ConnectorDefinition>> = Object.fromEntries(
  Object.entries(SCENARIOS).map(([slug, scenario]) => [slug, buildDefinition(scenario)]),
)
