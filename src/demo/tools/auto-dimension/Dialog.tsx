import { useState } from 'react'
import type { DemoContext } from '../../types'
import type { WorkflowResult } from '../../generatedWorkflow'
import { Btn, Check } from '../../ui'
import { PreviewTable, Receipt, ScopeRadios } from '../../kit'
import { FolioChoice, FolioFrame, FolioPreview, FolioText } from '../folioFrame'
import { sampleResidence } from '../../fixtures/sampleResidence'
import evaluate from './result'

const sections = [
  { title: 'Strings', summary: 'What to dimension in this view: element edges, levels, grids, openings, and walls and rooms in a plan.' },
  { title: 'Views', summary: 'Run the same strings on more views at once, with one Keep or Undo for all.' },
  { title: 'Placement', summary: 'Which side the strings go, row spacing, dimension type, and replacing earlier runs.' },
]
const presets = [
  { label: 'Outside of building: openings, overall and grids', strings: ['Openings and wall ends', 'Overall'], scope: 'Every wall and room in this view' },
  { label: 'Room sizes: clear width and length', strings: ['Room clear sizes'], scope: 'Pick rooms and their walls' },
  { label: 'Doors and windows: positions in each room', strings: ['Openings and wall ends'], scope: 'Pick rooms and their walls' },
  { label: 'Across walls: setting-out', strings: ['Setting-out across walls'], scope: 'Pick walls' },
  { label: 'Elevation: floor and ceiling datums, openings, grids and edges', strings: ['Heights as spot elevations', 'Grids', 'Opening sizes', 'Element edges'], scope: 'Every wall and room in this view' },
  { label: 'Elements I select: their edges', strings: ['Element edges'], scope: 'Elements I select or pick' },
  { label: 'Grids: grid to grid', strings: ['Grids'], scope: 'Every wall and room in this view' },
]
const kinds = ['Element edges', 'Heights as spot elevations', 'Levels', 'Grids', 'Opening sizes', 'Openings and wall ends', 'Overall', 'Room clear sizes', 'Setting-out across walls']
const available = sampleResidence.views.filter(({ kind }) => ['FloorPlan', 'CeilingPlan', 'Elevation', 'Section'].includes(kind))
const scopes = ['Pick walls', 'Pick rooms and their walls', 'Every wall and room in this view', 'Elements I select or pick', 'Witness line across walls']

export default function AutoDimension(ctx: DemoContext) {
  const [section, setSection] = useState(0)
  const [activeView, setActiveView] = useState(available[0].name)
  const [preset, setPreset] = useState(presets[0].label)
  const [scope, setScope] = useState(scopes[2])
  const [strings, setStrings] = useState(presets[0].strings)
  const [facade, setFacade] = useState('Outside (room-aware)')
  const [faces, setFaces] = useState('To core faces')
  const [facadeGrids, setFacadeGrids] = useState(true)
  const [mep, setMep] = useState(false)
  const [ticked, setTicked] = useState<(string | number)[]>([available[0].id])
  const [viewType, setViewType] = useState('All view types')
  const [rowSpace, setRowSpace] = useState('8')
  const [smallGap, setSmallGap] = useState('0.5')
  const [across, setAcross] = useState('Above the drawing')
  const [down, setDown] = useState('Left of the drawing')
  const [measure, setMeasure] = useState('The elements themselves')
  const [lineStyle, setLineStyle] = useState('Thin Lines')
  const [chain, setChain] = useState('One chain, with an overall')
  const [dimensionType, setDimensionType] = useState('Linear, 2.5 mm')
  const [replace, setReplace] = useState(true)
  const [skipExisting, setSkipExisting] = useState(true)
  const [showCore, setShowCore] = useState(false)
  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [previous, setPrevious] = useState<Record<string, string>>()
  const [pending, setPending] = useState<WorkflowResult>()
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<string[]>([])
  const batch = scope === scopes[2]
  const targetViews = batch ? available.filter(({ id }) => ticked.includes(id)) : available.filter(({ name }) => name === activeView)
  const flags = kinds.map((label) => ({ label, value: strings.includes(label) ? 'On' : 'Off' }))
  const outputs = targetViews.map((view) => evaluate({ slug: 'auto-dimension', action: 'Dimension', records: [], fields: [
    ...flags, { label: 'Dimension', value: 'Custom' }, { label: 'scope', value: scope }, { label: 'Sample view', value: view.name },
    { label: 'Facade side', value: facade }, { label: 'mode', value: faces }, { label: 'Row spacing in mm on paper', value: rowSpace },
    { label: 'Dimension type', value: dimensionType },
  ] }))
  const issue = outputs.find((output) => typeof output === 'string')
  const preview = outputs.flatMap((output, index) => typeof output === 'string' ? [] : output.rows.map((row) => ({
    label: targetViews[index].name + ', ' + row.label, value: row.value,
  })))
  const problem = !targetViews.length ? 'Tick the views to dimension.' : !strings.length ? 'Choose at least one dimension string.' :
    !Number.isFinite(Number(smallGap)) || Number(smallGap) < 0 ? 'Smallest gap must be a nonnegative number in paper millimetres.' :
      typeof issue === 'string' ? issue : ''
  function change() {
    if (pending && previous) { setPlaced(previous); setPrevious(undefined) }
    setPending(undefined)
    setError('')
  }
  function dimension() {
    if (problem) { setError(problem); return }
    const candidates = preview.filter(({ label }) => !label.endsWith('Dimension type'))
    const changed = candidates.filter(({ label }) => replace || !placed[label] || !skipExisting)
    const before = { ...placed }
    const next = { ...placed }
    for (const { label, value } of changed) {
      let key = label, copy = 2
      while (!replace && next[key]) key = label + ' (copy ' + copy++ + ')'
      next[key] = [value, measure, measure === 'Detail lines' && lineStyle, across + ' / ' + down, chain,
        'Minimum gap ' + smallGap + ' mm on paper', mep && 'Equipment included', facadeGrids && 'Grids and columns included', showCore && 'Core reference lines shown'].filter(Boolean).join(', ')
    }
    setPrevious(before)
    setPlaced(next)
    setPending({ summary: 'Created ' + changed.length + ' sample strings. Choose Keep or Undo for the whole run.', rows: changed })
    ctx.done('configure'); ctx.done('row'); ctx.done('run')
  }
  return <FolioFrame ctx={ctx} title="Auto Dimension" sections={sections} section={section} onSection={(index) => { change(); setSection(index) }}
    footer={<><span className="ad-status">{problem || Object.keys(placed).length + ' strings in the sample fixture.'}</span><Btn onClick={ctx.close}>Close</Btn>
      <Btn primary demo="autodim-run" disabled={!!problem || !!pending} onClick={dimension}>{targetViews.length > 1 ? 'Dimension ' + targetViews.length + ' views' : 'Dimension'}</Btn></>}>
    <FolioChoice label="Sample active view" options={available.map(({ name }) => name)} value={activeView} onChange={(name) => {
      change(); setActiveView(name); const view = available.find((row) => row.name === name)
      if (view) setTicked([view.id])
    }} />
    {section === 0 && <>
      <section className="ad-card folio-runtime-stack"><FolioChoice label="Dimension" value={preset} options={[...presets.map(({ label }) => label), 'Custom']} onChange={(name) => {
        change(); setPreset(name); const choice = presets.find(({ label }) => label === name)
        if (choice) { setStrings(choice.strings); setScope(choice.scope) }
      }} /><ScopeRadios label="On what" value={scope} options={scopes} onChange={(value) => { change(); setScope(value) }} /></section>
      <section className="ad-card folio-runtime-stack"><b className="ad-label">What to dimension</b>
        {kinds.map((label) => <Check key={label} label={label} checked={strings.includes(label)} onChange={(value) => {
          change(); setPreset('Custom'); setStrings(value ? [...strings, label] : strings.filter((item) => item !== label))
        }} />)}
        <Check label="Also lights, sockets and equipment" checked={mep} onChange={(value) => { change(); setMep(value) }} />
        <Check label="Radius on curved edges (Revit 2025 and later)" checked={false} disabled onChange={() => {}} />
        <Check label="Also grids and columns" checked={facadeGrids} onChange={(value) => { change(); setFacadeGrids(value) }} />
        <FolioChoice label="Facade side" options={['Outside (room-aware)', 'Inside (room-aware)', "Wall's exterior side"]} value={facade} onChange={(value) => { change(); setFacade(value) }} />
        <ScopeRadios label="Setting-out across walls" value={faces} options={['To core faces', 'To finish faces', 'To centrelines']} onChange={(value) => { change(); setFaces(value) }} />
      </section>
    </>}
    {section === 1 && (!batch ? <p className="ad-note">Picking walls, rooms or a witness line works in this plan only. To dimension more plans in one run, choose Every wall and room in this view under Strings.</p> : <>
      <FolioChoice label="View type filter" options={['All view types', 'FloorPlan', 'Elevation', 'Section']} value={viewType} onChange={setViewType} />
      <PreviewTable rows={available.filter((view) => viewType === 'All view types' || view.kind === viewType)} caption="Views to dimension" columns={[{ key: 'name', label: 'VIEW NAME' }, { key: 'kind', label: 'TYPE' }]}
        getId={(row) => row.id} ticked={ticked} onTicked={(ids) => { change(); setTicked(ids) }} />
    </>)}
    {section === 2 && <section className="ad-card folio-runtime-stack"><div className="folio-runtime-fields">
      <FolioChoice label="Strings across" options={['Above the drawing', 'Below the drawing']} value={across} onChange={(value) => { change(); setAcross(value) }} />
      <FolioChoice label="Strings down" options={['Left of the drawing', 'Right of the drawing']} value={down} onChange={(value) => { change(); setDown(value) }} />
      <FolioChoice label="Measure to" options={['The elements themselves', 'Detail lines']} value={measure} onChange={(value) => { change(); setMeasure(value) }} />
      {measure === 'Detail lines' && <FolioChoice label="Detail line style" options={['Thin Lines', 'Medium Lines', 'Invisible Lines']} value={lineStyle} onChange={(value) => { change(); setLineStyle(value) }} />}
      <FolioChoice label="Strings as" options={['One chain, with an overall', 'Separate dimensions, with an overall']} value={chain} onChange={(value) => { change(); setChain(value) }} />
      <FolioText label="Smallest gap in mm on paper" value={smallGap} onChange={(value) => { change(); setSmallGap(value) }} />
      <FolioText label="Row spacing in mm on paper" value={rowSpace} onChange={(value) => { change(); setRowSpace(value) }} />
      <FolioChoice label="Dimension type" options={['Linear, 2.5 mm', 'Linear, 3.5 mm']} value={dimensionType} onChange={(value) => { change(); setDimensionType(value) }} /></div>
      <Check label="Replace earlier Auto Dimension strings of the kinds ticked; strings you moved or retexted are kept" checked={replace} onChange={(value) => { change(); setReplace(value) }} />
      <Check label="Leave what is already dimensioned alone" checked={skipExisting} onChange={(value) => { change(); setSkipExisting(value) }} />
      <Check label="Show core reference lines" checked={showCore} onChange={(value) => { change(); setShowCore(value) }} />
    </section>}
    {!pending && <FolioPreview rows={preview} />}
    {error && <p role="alert" className="folio-runtime-error">{error}</p>}
    {pending && <section className="ad-result folio-runtime-stack" data-demo="autodim-review" aria-label="Keep or undo sample dimensions"><p role="status">{pending.summary}</p><FolioPreview rows={pending.rows} />
      <div className="ad-row"><Btn primary onClick={() => { setReceipt(pending.rows.map(({ label, value }) => label + ', ' + value)); setPending(undefined); setPrevious(undefined); ctx.done('apply'); ctx.done('review') }}>Keep</Btn>
        <Btn onClick={() => { setPlaced(previous ?? {}); setPending(undefined); setPrevious(undefined); setReceipt(['Undid the last sample dimension run.']) }}>Undo</Btn></div></section>}
    {receipt.length > 0 && <Receipt entries={receipt} title="Last sample run" />}
  </FolioFrame>
}
