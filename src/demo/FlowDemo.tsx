import { useState } from 'react'
import { RevitDialog, Btn } from './ui'
import type { DemoContext } from './types'

interface CommandCase {
  input: string
  choices: { option: string; rows: [string, string][] }[]
  action: string
}

const CASES: Record<string, CommandCase> = {
  'coord-plan': {
    input: 'Existing Coordination Plan',
    choices: [
      { option: 'Rebuild at Level 01', rows: [['View', 'Coordination Plan · Level 01'], ['Display', '1:100 · Coarse · Hidden Line'], ['Visible', 'Grids, levels, site and Revit links'], ['Hidden', 'CAD imports and annotation']] },
      { option: 'Keep existing plan', rows: [['View', 'Coordination Plan · Level 01'], ['Result', 'Existing view retained']] },
    ],
    action: 'Confirm view setup',
  },
  'navis-view': {
    input: 'Ribbon mode',
    choices: [
      { option: 'Standard click', rows: [['View', 'Navisworks · Isometric'], ['Revit links', 'Hidden'], ['Detail', 'Medium · Fine for MEP'], ['Section box', 'On']] },
      { option: 'Shift-click', rows: [['View', 'Navisworks · Isometric'], ['Revit links', 'Visible'], ['Detail', 'Medium · Fine for MEP'], ['Section box', 'On']] },
      { option: 'Ctrl-click · by workset', rows: [['Architecture', 'Navisworks - Architecture · Created'], ['Structure', 'Navisworks - Structure · Skipped (exists)'], ['Revit links', 'Hidden']] },
    ],
    action: 'Create or open views',
  },
  'links-inspector': {
    input: 'Report',
    choices: [
      { option: 'Top-level Revit links', rows: [['Structure.rvt', 'Loaded · Attachment · 1 of 1 pinned'], ['MEP.rvt', 'Unloaded · Overlay · 0 placements']] },
      { option: 'CAD imports', rows: [['Site-survey.dwg', 'Linked · Level 01'], ['Old-layout.dwg', 'Embedded · Lobby plan · Review']] },
    ],
    action: 'Scan links and imports',
  },
  'pin-unpin-links': {
    input: 'Action and scope',
    choices: [
      { option: 'Pin Revit links', rows: [['Structure.rvt', 'Pinned'], ['Interiors.rvt', 'Unpinned → Pinned'], ['Site-survey.dwg', 'Outside scope']] },
      { option: 'Pin CAD imports', rows: [['Structure.rvt', 'Outside scope'], ['Interiors.rvt', 'Outside scope'], ['Site-survey.dwg', 'Unpinned → Pinned']] },
      { option: 'Unpin all links', rows: [['Structure.rvt', 'Pinned → Unpinned'], ['Interiors.rvt', 'Already unpinned'], ['Site-survey.dwg', 'Already unpinned']] },
    ],
    action: 'Apply pin state',
  },
  'in-place-inspector': {
    input: 'Review focus',
    choices: [
      { option: 'All in-place families', rows: [['Reception Millwork', 'Casework · 18 instances · Review for conversion'], ['Lobby Bulkhead', 'Generic Models · 2 instances · Review'], ['Test Plinth', 'Generic Models · 0 instances · Unused']] },
      { option: 'Inspect Reception Millwork', rows: [['Family', 'Reception Millwork · Casework'], ['Instances', '18'], ['Result', 'Sample 3D isolation view for review']] },
    ],
    action: 'Review families',
  },
  'model-health': {
    input: 'Sample rule check',
    choices: [
      { option: 'Model warnings', rows: [['Overlapping walls', '3 · Review'], ['Duplicate marks', '2 · Review'], ['Report', 'Model Health · Warnings']] },
      { option: 'Link inventory', rows: [['Revit links', '2 loaded · 1 unloaded'], ['Embedded CAD', '1 · Review'], ['Report', 'Model Health · Links']] },
    ],
    action: 'Run selected check',
  },
  'split-floor-ceiling': {
    input: 'Selected elements',
    choices: [
      { option: 'Floor F-104 · two regions', rows: [['Region A', 'Created · finish and phase copied'], ['Region B', 'Created · opening retained'], ['Original F-104', 'Replaced by both regions']] },
      { option: 'Ceiling C-221 · one region', rows: [['C-221', 'Skipped · single sketch region']] },
      { option: 'Floor F-110 · shape edited', rows: [['F-110', 'Skipped · shape-edited slab']] },
    ],
    action: 'Split selected element',
  },
  'spot-elevation-line': {
    input: 'Sample line pattern',
    choices: [
      { option: 'Dash', rows: [['Ground Floor Plan', '6 spot elevations · Dash'], ['North Elevation', '4 spot elevations · Dash']] },
      { option: 'Dot', rows: [['Ground Floor Plan', '6 spot elevations · Dot'], ['North Elevation', '4 spot elevations · Dot']] },
    ],
    action: 'Apply line pattern',
  },
  'split-region-with-line': {
    input: 'Sample cutting line',
    choices: [
      { option: 'Line A · crosses the region', rows: [['Region A', 'Created · concrete hatch retained'], ['Region B', 'Created · boundary style retained'], ['Original region', 'Replaced once both regions are created']] },
      { option: 'Line B · misses the region', rows: [['Original region', 'Retained · cutting line does not intersect']] },
    ],
    action: 'Split selected region',
  },
}

interface CommandSpec { slug: string; name: string; tagline: string; safeguards: string[] }

export function makeCommand(spec: CommandSpec) {
  const example = CASES[spec.slug]
  return function Command({ theme, setTheme, done, notify, close }: DemoContext) {
    const [choice, setChoice] = useState(0)
    const [result, setResult] = useState<number | null>(null)
    const run = () => {
      setResult(choice)
      done('configure')
      done('run')
      notify({ kind: 'info', text: `${spec.name}: sample result ready for review.` })
    }
    return (
      <RevitDialog theme={theme} onTheme={setTheme} title={spec.name} caption="Illustrative command · Sample Residence" onClose={close}
        footer={result === null
          ? <><span className="ad-status">Sample model</span><Btn onClick={close}>Close</Btn><Btn primary demo="flow-run" onClick={run}>{example.action}</Btn></>
          : <><span className="ad-status">Sample result</span><Btn onClick={() => setResult(null)}>Change inputs</Btn><Btn primary demo="flow-review" onClick={() => { done('review'); notify({ kind: 'success', text: 'Sample result reviewed.' }) }}>Mark reviewed</Btn></>}>
        <p className="ad-h">{spec.tagline}</p>
        {result === null ? (
          <label className="flow-command-input"><span className="ad-label">{example.input}</span>
            <select className="ad-select" data-demo="flow-choice" value={choice} onChange={(e) => { setChoice(Number(e.target.value)); done('configure') }}>
              {example.choices.map(({ option }, index) => <option key={option} value={index}>{option}</option>)}
            </select>
          </label>
        ) : (
          <dl className="flow-command-results">
            {example.choices[result].rows.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
          </dl>
        )}
        {spec.safeguards[0] && <p className="ad-status">{spec.safeguards[0]}</p>}
      </RevitDialog>
    )
  }
}
