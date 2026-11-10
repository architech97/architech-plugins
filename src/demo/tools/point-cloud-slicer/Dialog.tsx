import { useState } from 'react'
import type { DemoContext } from '../../types'
import { DialogShell, MiniView, Receipt } from '../../kit'
import { Btn, Check, TextBox } from '../../ui'
import { sampleResidence } from '../../fixtures/sampleResidence'
import '../../demos/suiteWorkflow.css'
import './style.css'

const LEVELS = sampleResidence.levels.map((level, index, all) => ({
  ...level, elevation: level.elevation * 1000, height: all[index + 1] ? Math.round((all[index + 1].elevation - level.elevation) * 1000) : 3048,
}))
type Kind = '3D' | 'Plan'
type View = { id: number; name: string; levelId: number; kind: Kind; owned: boolean; low: number; high: number; buffer: number }
const INITIAL_VIEWS: View[] = [
  { id: 5801, name: 'PC_Slice - Level 01', levelId: LEVELS[0].id, kind: '3D', owned: false, low: 0, high: 3300, buffer: 0 },
  { id: 5802, name: 'Survey Section · First Floor', levelId: LEVELS[1].id, kind: '3D', owned: true, low: 3200, high: 6600, buffer: 0 },
]
const OFFSETS = [
  { label: 'Bottom Offset', value: '-150' },
  { label: 'Top Offset', value: '300' },
  { label: 'XY Planar Buffer', value: '500' },
]

export default function PointCloudSlicer({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [selected, setSelected] = useState(LEVELS.map(level => level.id))
  const [offsets, setOffsets] = useState(OFFSETS.map(offset => offset.value))
  const [boxes, setBoxes] = useState(true)
  const [plans, setPlans] = useState(false)
  const [views, setViews] = useState(INITIAL_VIEWS)
  const [receipt, setReceipt] = useState<{ label: string; detail?: string }[]>([])
  const [message, setMessage] = useState('')
  const [generation, setGeneration] = useState(0)
  const activeLevels = LEVELS.filter(level => selected.includes(level.id))
  const [bottom, top, buffer] = offsets.map(Number)
  const previewLevels = activeLevels.map(level => ({ ...level, low: level.elevation + bottom, high: level.elevation + level.height + top }))
  const invalid = offsets.findIndex(value => !value.trim() || !Number.isFinite(Number(value)))
  const collapsed = 16000 + buffer * 2 <= 0
  const validLevels = invalid < 0 ? previewLevels.filter(level => Number.isFinite(level.low) && Number.isFinite(level.high) && level.low < level.high) : []
  const validation = invalid >= 0 ? OFFSETS[invalid].label + ' is not a finite number. Enter a value in mm.' :
    !activeLevels.length ? 'Please select at least one building level to slice.' :
    !boxes && !plans ? 'Select at least one output view type (3D Section Box or Floor Plan).' :
    collapsed || !Number.isFinite(buffer * 2) ? 'The planar buffer must leave positive sample extents.' : ''

  function configure(step: 'levels' | 'options') {
    setReceipt([])
    setMessage('')
    rewind(step === 'levels' ? 'options' : 'generate')
    done('levels')
    if (step === 'options') done('options')
  }

  function generate() {
    if (validation) {
      setReceipt([])
      setMessage(validation)
      return
    }
    const next = [...views]
    const rows: typeof receipt = []
    const names = new Set(views.map(view => view.name.toLowerCase()))
    let nextId = Math.max(...views.map(view => view.id)) + 1
    for (const level of previewLevels) {
      if (!validLevels.includes(level)) {
        rows.push({ label: level.name + ' · skipped', detail: 'The offsets leave no height to slice.' })
        continue
      }
      const kinds: Kind[] = [...(boxes ? ['3D' as const] : []), ...(plans ? ['Plan' as const] : [])]
      for (const kind of kinds) {
        const existing = next.find(view => view.owned && view.kind === kind && view.levelId === level.id)
        const baseName = (kind === '3D' ? 'PC_Slice - ' : 'PC_Plan - ') + level.name
        let name = existing?.name ?? baseName
        for (let index = 2; !existing && names.has(name.toLowerCase()); index++) name = baseName + ' (' + index + ')'
        const output: View = { id: existing?.id ?? nextId++, name, kind, levelId: level.id, owned: true, low: level.low, high: level.high, buffer }
        if (existing) next[next.indexOf(existing)] = output
        else {
          names.add(name.toLowerCase())
          next.push(output)
        }
        rows.push({ label: (existing ? 'Updated · ' : 'Created · ') + name, detail: 'ID ' + output.id + ' · ' +
          (kind === '3D' ? 'Section box' : 'Crop and view range') + ' ' + output.low + ' to ' + output.high + ' mm · XY buffer ' + buffer + ' mm' })
      }
    }
    const count = validLevels.length * (Number(boxes) + Number(plans))
    setReceipt(rows)
    setViews(next)
    setMessage('')
    setGeneration(generation + 1)
    done('levels')
    done('options')
    if (count) done('generate')
    notify({ kind: validLevels.length < activeLevels.length ? 'warning' : 'success', text: 'Created/updated ' + count + ' sample slice view(s).' })
  }

  return <DialogShell theme={theme} onTheme={setTheme} title="Point Cloud Slicer" subtitle="Detected 1 sample point cloud instance: Residence Survey.rcp"
    onClose={close} footer={<><span className="ad-status">{selected.length} of {LEVELS.length} levels selected</span>
      <Btn onClick={close}>Close</Btn><Btn primary demo="slice-generate" onClick={generate}>Generate Slices</Btn></>}>
    <div className="forge-slice-layout">
      <section className="ad-card suite-flow-fields" data-demo="slice-levels" aria-label="Building levels to slice">
        <b className="ad-label">Building levels to slice</b>
        <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Sample building levels">
          <table className="ad-table"><thead><tr>{['Slice', 'Level Name', 'Elevation', 'Story Height'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{LEVELS.map(level => <tr key={level.id}>
              <td><Check title={'Slice ' + level.name} checked={selected.includes(level.id)} onChange={checked => {
                setSelected(checked ? [...selected, level.id] : selected.filter(id => id !== level.id))
                configure('levels')
              }} /></td>
              <td>{level.name}</td><td>{level.elevation} mm</td><td>{level.height} mm</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="ad-row">
          <Btn sm onClick={() => { setSelected(LEVELS.map(level => level.id)); configure('levels') }}>Select all</Btn>
          <Btn sm onClick={() => { setSelected([]); configure('levels') }}>Clear all</Btn>
        </div>
      </section>
      <section className="ad-card suite-flow-fields" data-demo="slice-options" aria-label="Slice offsets and output view options">
        <b className="ad-label">Slice offsets</b>
        {OFFSETS.map(({ label }, index) => <label key={label}>{label} (mm)
          <TextBox value={offsets[index]} inputMode="decimal" maxLength={18} onChange={event => {
            setOffsets(offsets.map((value, field) => field === index ? event.target.value : value))
            configure('options')
          }} /></label>)}
        <b className="ad-label">Output view options</b>
        <Check label="Generate 3D Section Box Slices" checked={boxes} onChange={checked => { setBoxes(checked); configure('options') }} />
        <Check label="Generate Cropped 2D Floor Plans" checked={plans} onChange={checked => { setPlans(checked); configure('options') }} />
      </section>
    </div>
    {message && <p className="suite-flow-error" role="alert">{message}</p>}
    {!validation && <MiniView variant="coord" phase={receipt.length ? 'after' : 'preview'} actionKey={generation} title="Sample storey slice extents">
      {previewLevels.map((level, index) => <g key={level.id} data-motion transform={'translate(36 ' + (24 + 73 * index) + ')'}>
        <rect width="528" height="60" rx="4" fill="var(--d-accent)" fillOpacity=".13" stroke="var(--d-accent)" />
        <text x="12" y="23" fill="currentColor">{level.name}</text>
        <text x="12" y="43" fill="currentColor">{validLevels.includes(level) ? level.low + ' to ' + level.high + ' mm · XY buffer ' + buffer + ' mm' : 'Offsets leave no height to slice'}</text>
      </g>)}
    </MiniView>}
    {!!receipt.length && <Receipt title="Sample slice result" entries={receipt} />}
    <details className="ad-card">
      <summary>Sample project browser · {views.length} views</summary>
      <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Sample view inventory">
        <table className="ad-table"><thead><tr>{['ID', 'Name', 'Kind', 'Ownership'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{views.map(view => <tr key={view.id}>
            <td>{view.id}</td><td>{view.name}</td><td>{view.kind}</td><td>{view.owned ? 'Forge-owned slice' : 'Legacy · retained'}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </details>
  </DialogShell>
}
