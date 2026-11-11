import { useState } from 'react'
import { RevitDialog, Btn, Check } from './ui'
import { downloadCsv } from './demos/craftedTools'
import type { DemoContext } from './types'

interface CommandCase {
  input: string
  choices: { option: string; rows: [string, string][] }[]
  action: string
  preview?: string
  downloadable?: boolean
}

const CASES: Record<string, CommandCase> = {
  'coord-plan': {
    input: 'Existing Coordination Plan',
    choices: [
      { option: 'Rebuild at Level 01', rows: [['View', 'Coordination Plan, Level 01'], ['Display', '1:100, Coarse, Hidden Line'], ['Visible', 'Grids, levels, site and Revit links'], ['Hidden', 'CAD imports and annotation']] },
      { option: 'Keep existing plan', rows: [['View', 'Coordination Plan, Level 01'], ['Result', 'Existing view retained']] },
    ],
    action: 'Confirm view setup',
    preview: 'Rebuild the existing sample coordination view?'
  },
  'navis-view': {
    input: 'Ribbon mode',
    choices: [
      { option: 'Standard click', rows: [['View', 'Navisworks, Isometric'], ['Revit links', 'Hidden'], ['Detail', 'Medium, Fine for MEP'], ['Section box', 'On']] },
      { option: 'Shift-click', rows: [['View', 'Navisworks, Isometric'], ['Revit links', 'Visible'], ['Detail', 'Medium, Fine for MEP'], ['Section box', 'On']] },
      { option: 'Ctrl-click, by workset', rows: [['Architecture', 'Navisworks - Architecture, Created'], ['Structure', 'Navisworks - Structure, Skipped (exists)'], ['Revit links', 'Hidden']] },
      { option: 'Ctrl-click, by model category', rows: [['Walls', 'Navisworks - Walls, Created'], ['Floors', 'Navisworks - Floors, Created'], ['Revit links', 'Hidden']] },
    ],
    action: 'Create or open views',
  },
  'links-inspector': {
    input: 'Report',
    choices: [
      { option: 'Top-level Revit links', rows: [['Structure.rvt', 'Loaded, Attachment, 1 of 1 pinned'], ['MEP.rvt', 'Unloaded, Overlay, 0 placements']] },
      { option: 'CAD imports', rows: [['Site-survey.dwg', 'Linked, Level 01'], ['Old-layout.dwg', 'Embedded, Lobby plan, Review']] },
    ],
    action: 'Scan links and imports',
    downloadable: true,
  },
  'pin-unpin-links': {
    input: 'Action and scope',
    choices: [
      { option: 'Pin Revit links', rows: [['Structure.rvt', 'Pinned'], ['Interiors.rvt', 'Unpinned → Pinned'], ['Site-survey.dwg', 'Outside scope']] },
      { option: 'Pin CAD imports', rows: [['Structure.rvt', 'Outside scope'], ['Interiors.rvt', 'Outside scope'], ['Site-survey.dwg', 'Unpinned → Pinned']] },
      { option: 'Unpin all links', rows: [] },
      { option: 'Pin all links', rows: [] },
    ],
    action: 'Review pin state change',
    preview: 'Review affected placements before applying the sample pin state.'
  },
  'in-place-inspector': {
    input: 'Review focus',
    choices: [
      { option: 'All in-place families', rows: [['Reception Millwork', 'Casework, 18 instances, Review for conversion'], ['Lobby Bulkhead', 'Generic Models, 2 instances, Review'], ['Test Plinth', 'Generic Models, 0 instances, Unused']] },
      { option: 'Inspect Reception Millwork', rows: [['Family', 'Reception Millwork, Casework'], ['Instances', '18'], ['Result', 'Sample 3D isolation view for review']] },
    ],
    action: 'Review families',
    downloadable: true,
  },
  'split-floor-ceiling': {
    input: 'Selected elements',
    choices: [
      { option: 'Floor F-104, two regions', rows: [['Region A', 'Created, finish and phase copied'], ['Region B', 'Created, opening retained'], ['Original F-104', 'Replaced by both regions']] },
      { option: 'Ceiling C-221, one region', rows: [['C-221', 'Skipped, single sketch region']] },
      { option: 'Floor F-110, shape edited', rows: [['F-110', 'Skipped, shape-edited slab']] },
      { option: 'Floor F-112, two regions and a hosted tag', rows: [['F-112', 'Skipped by default, hosted tag would be deleted']] },
    ],
    action: 'Review selected element',
  },
  'spot-elevation-line': {
    input: 'Sample line pattern',
    choices: [
      { option: 'Dash', rows: [['Ground Floor Plan', '6 spot elevations, Dash'], ['North Elevation', '4 spot elevations, Dash']] },
      { option: 'Dot', rows: [] },
      { option: 'Solid', rows: [] },
      { option: 'Clear line pattern override', rows: [] },
    ],
    action: 'Review line pattern',
    preview: 'Review the spot elevation views and pattern before applying.'
  },
  'split-region-with-line': {
    input: 'Sample cutting line',
    choices: [
      { option: 'Line A, crosses the region', rows: [['Region A', 'Created, concrete hatch retained'], ['Region B', 'Created, boundary style retained'], ['Original region', 'Replaced once both regions are created']] },
      { option: 'Line B, misses the region', rows: [['Original region', 'Retained, cutting line does not intersect']] },
    ],
    action: 'Split selected region',
  },
}

interface CommandSpec { slug: string; name: string; tagline: string; safeguards: string[] }

const LINKS = [
  { name: 'Structure.rvt', kind: 'RVT', pinned: true },
  { name: 'Interiors.rvt', kind: 'RVT', pinned: false },
  { name: 'Site-survey.dwg', kind: 'CAD', pinned: false },
]
const SPOT_VIEWS = [
  { name: 'Ground Floor Plan', spots: 6 },
  { name: 'North Elevation', spots: 4 },
]

export function makeCommand(spec: CommandSpec) {
  const example = CASES[spec.slug]
  return function Command({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
    const [choice, setChoice] = useState(0)
    const [result, setResult] = useState<[string, string][] | null>(null)
    const [reviewed, setReviewed] = useState(false)
    const [confirm, setConfirm] = useState(false)
    const [scope, setScope] = useState('Whole project')
    const [allowDependents, setAllowDependents] = useState(false)
    const [links, setLinks] = useState(LINKS)
    const [patterns, setPatterns] = useState<Record<string, string>>({})
    const selected = example.choices[choice]
    const isPin = spec.slug === 'pin-unpin-links'
    const isSpot = spec.slug === 'spot-elevation-line'
    const isFloor = spec.slug === 'split-floor-ceiling'
    const dependent = isFloor && choice === 3
    const needsConfirmation = (spec.slug === 'coord-plan' && choice === 0) || isPin || isSpot || (dependent && allowDependents)
    const pin = choice !== 2
    const affectsLink = (kind: string) => choice >= 2 || kind === (choice === 0 ? 'RVT' : 'CAD')
    const spotTargets = scope === 'Active view' ? SPOT_VIEWS.slice(0, 1)
      : scope === 'Selected sheets / views' ? SPOT_VIEWS.slice(1) : SPOT_VIEWS
    const pinCount = links.filter((link) => affectsLink(link.kind) && link.pinned !== pin).length
    const summary = isPin ? pinCount + ' placements would change.'
      : isSpot ? spotTargets.reduce((total, view) => total + view.spots, 0) + ' spot elevations across ' + spotTargets.length + ' sample view(s).'
        : dependent ? 'The hosted tag for F-112 would be deleted.' : example.preview

    const run = () => {
      if (needsConfirmation && !confirm) {
        done('configure')
        setConfirm(true)
        return
      }
      let rows = selected.rows
      if (isPin) {
        rows = links.map((link) => [link.name, !affectsLink(link.kind) ? 'Outside scope' :
          link.pinned === pin ? (pin ? 'Already pinned' : 'Already unpinned') : pin ? 'Unpinned → Pinned' : 'Pinned → Unpinned'])
        setLinks(links.map((link) => affectsLink(link.kind) ? { ...link, pinned: pin } : link))
      }
      if (isSpot) {
        const pattern = choice === 3 ? 'By view, override cleared' : selected.option
        rows = spotTargets.map((view) => [view.name, view.spots + ' spot elevations, ' + pattern])
        setPatterns({ ...patterns, ...Object.fromEntries(spotTargets.map((view) => [view.name, pattern])) })
      }
      if (dependent && allowDependents) rows = [['Region A', 'Created'], ['Region B', 'Created'], ['Hosted tag', 'Deleted with original floor']]
      setResult(rows)
      setConfirm(false)
      setReviewed(false)
      done('configure')
      done('run')
      notify({ kind: 'info', text: spec.name + ': sample result ready for review.' })
    }
    const changeInputs = () => {
      setResult(null)
      setReviewed(false)
      rewind('configure')
    }
    return (
      <RevitDialog theme={theme} onTheme={setTheme} title={spec.name} caption="Illustrative command, Sample Residence" onClose={close}
        footer={result === null
          ? <><span className="ad-status">{confirm ? 'Review pending' : 'Sample model'}</span>
            <Btn onClick={confirm ? () => setConfirm(false) : close}>{confirm ? 'Cancel' : 'Close'}</Btn>
            <Btn primary demo="flow-run" onClick={run}>{confirm ? 'Confirm sample action' : example.action}</Btn></>
          : <><span className="ad-status">{reviewed ? 'Sample result reviewed' : 'Sample result'}</span>
            {example.downloadable && <Btn onClick={() => downloadCsv(spec.slug + '-sample.csv', ['Item', 'Sample outcome'], result)}>Download sample CSV</Btn>}
            <Btn onClick={changeInputs}>Change inputs</Btn>
            <Btn primary disabled={reviewed} demo="flow-review" onClick={() => { setReviewed(true); done('review'); notify({ kind: 'success', text: 'Sample result reviewed.' }) }}>Mark reviewed</Btn></>}>
        <p className="ad-h">{spec.tagline}</p>
        {result !== null ? (
          <dl className="crafted-result" aria-label="Sample command results">
            {result.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
          </dl>
        ) : confirm ? (
          <div className="ad-result" role="status"><strong>Review sample action</strong><p>{summary}</p></div>
        ) : <>
          <label className="crafted-choice"><span className="ad-label">{example.input}</span>
            <select className="ad-select" data-demo="flow-choice" value={choice} onChange={(event) => { setChoice(Number(event.target.value)); setAllowDependents(false); done('configure') }}>
              {example.choices.map(({ option }, index) => <option key={option} value={index}>{option}</option>)}
            </select>
          </label>
          {isSpot && <label className="crafted-choice"><span className="ad-label">Apply to</span>
            <select className="ad-select" value={scope} onChange={(event) => setScope(event.target.value)}>
              <option>Active view</option><option>Selected sheets / views</option><option>Whole project</option>
            </select>
          </label>}
          {dependent && <Check label="Allow deletion of the hosted sample tag" checked={allowDependents} onChange={setAllowDependents} />}
          {isPin && <dl className="crafted-result">{links.map((link) => <div key={link.name}><dt>{link.name}</dt><dd>{link.pinned ? 'Pinned' : 'Unpinned'}</dd></div>)}</dl>}
          {isSpot && <dl className="crafted-result">{SPOT_VIEWS.map((view) => <div key={view.name}><dt>{view.name}</dt><dd>{patterns[view.name] ?? 'By view'}</dd></div>)}</dl>}
        </>}
        {spec.safeguards[0] && <p className="ad-status">{spec.safeguards[0]}</p>}
      </RevitDialog>
    )
  }
}
