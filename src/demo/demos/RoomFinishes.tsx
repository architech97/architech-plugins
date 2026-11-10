import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Check, Select, Expander } from '../ui'
import { ROOMS, FLOOR_TYPES, CEILING_TYPES, WALL_TYPES } from '../sample'
import { downloadCsv } from './craftedTools'
import type { DemoContext } from '../types'

// Simulation of Arch Forge > Finishes > Room to Finishes: the setup dialog, then the review screen
// that lists each room, finish kind and intended action. Only approved rows are applied.
const PICKED = ROOMS.filter((r) => ['101', '102', '103', '105'].includes(r.number))
const CHOOSE = '<Choose a type>'
const MODES = ['Create missing — keep existing generated finishes', 'Update generated — preserve edited or dependent elements', 'Review orphaned / edited generated finishes — read only']
const isWritable = (row: PlanRow) => row.ok && (row.action === 'Create' || row.action === 'Update')

interface PlanRow { key: string; room: string; kind: 'Floor' | 'Ceiling' | 'Wall lining'; action: string; status: string; reason: string; ok: boolean }

export default function RoomFinishes({ theme, setTheme, done, notify, close }: DemoContext) {
  const [mode, setMode] = useState('Create missing — keep existing generated finishes')
  const [floor, setFloor] = useState(true), [ceiling, setCeiling] = useState(true), [wall, setWall] = useState(true)
  const [floorType, setFloorType] = useState(CHOOSE), [ceilingType, setCeilingType] = useState(CHOOSE), [wallType, setWallType] = useState(CHOOSE)
  const [alignTop, setAlignTop] = useState(true), [notch, setNotch] = useState(false), [atTop, setAtTop] = useState(true)
  const [islands, setIslands] = useState(true), [separation, setSeparation] = useState(false)
  const [screen, setScreen] = useState<'setup' | 'review' | 'done'>('setup')
  const [approved, setApproved] = useState<Set<string>>(new Set())
  const [sync, setSync] = useState(false)
  const [preset, setPreset] = useState<{ mode: string; kinds: boolean[]; types: string[]; options: boolean[] } | null>(null)
  const readOnly = mode === MODES[2]

  const ready = readOnly || (!floor || floorType !== CHOOSE) && (!ceiling || ceilingType !== CHOOSE) && (!wall || wallType !== CHOOSE) && (floor || ceiling || wall)
  const pickType = (which: 'floor' | 'ceiling' | 'wall') => (v: string) => {
    const next = { floor: floorType, ceiling: ceilingType, wall: wallType, [which]: v }
    ;({ floor: setFloorType, ceiling: setCeilingType, wall: setWallType })[which](v)
    if ((!floor || next.floor !== CHOOSE) && (!ceiling || next.ceiling !== CHOOSE) && (!wall || next.wall !== CHOOSE)) done('types')
  }

  const plan: PlanRow[] = useMemo(() => {
    if (readOnly) return [
      { key: 'orphan', room: 'Former room 106', kind: 'Floor', action: 'Review only', status: 'Review', ok: false, reason: 'The source room no longer exists. Generated floor retained.' },
      { key: 'edited', room: '103 Dining', kind: 'Wall lining', action: 'Review only', status: 'Review', ok: false, reason: 'Generated lining was edited after creation. Geometry retained.' },
    ]
    const update = mode === MODES[1]
    const rows: PlanRow[] = []
    PICKED.forEach((room) => {
      const name = room.number + ' ' + room.name
      if (floor) rows.push({
        key: room.number + 'F', room: name, kind: 'Floor', action: 'Create', status: 'Ready', ok: true,
        reason: [floorType, alignTop ? 'top face aligned to room base' : 'placed from room base', notch && 'extended into door openings'].filter(Boolean).join(' · '),
      })
      if (ceiling) {
        const existing = room.number === '102'
        rows.push({
          key: room.number + 'C', room: name, kind: 'Ceiling',
          action: existing ? (update ? 'Update' : 'Keep existing') : 'Create',
          status: existing && !update ? 'Exists' : 'Ready', ok: true,
          reason: existing && !update ? 'A generated ceiling already exists for this room and phase' : ceilingType + (atTop ? ' · at room top' : ' · using finish offset'),
        })
      }
      if (wall) {
        const unsupported = room.number === '105'
        const edited = update && room.number === '103'
        rows.push({
          key: room.number + 'W', room: name, kind: 'Wall lining',
          action: unsupported ? 'Skip' : edited ? 'Preserve edited' : 'Create', status: unsupported || edited ? 'Review' : 'Ready', ok: !unsupported && !edited,
          reason: unsupported ? 'Curtain wall boundary skipped' : edited ? 'Existing generated lining has manual edits'
            : [wallType, islands && 'islands and columns included', separation && 'room separation lines included'].filter(Boolean).join(' · '),
        })
      }
    })
    return rows
  }, [floor, ceiling, wall, floorType, ceilingType, wallType, alignTop, notch, atTop, islands, separation, mode, readOnly])

  const openReview = () => {
    setApproved(new Set(plan.filter(isWritable).map((row) => row.key)))
    setScreen('review')
    done('review')
  }
  const apply = () => {
    const selected = plan.filter((row) => approved.has(row.key))
    const created = selected.filter((row) => row.action === 'Create').length
    const updated = selected.length - created
    const synchronized = new Set(selected.map((row) => row.room)).size
    setScreen('done')
    notify({ kind: 'success', text: 'Sample finishes: ' + created + ' created, ' + updated + ' updated.' + (sync ? ' Synchronized finish fields for ' + synchronized + ' rooms.' : '') })
    done('apply')
  }
  const savePreset = () => {
    setPreset({ mode, kinds: [floor, ceiling, wall], types: [floorType, ceilingType, wallType], options: [alignTop, notch, atTop, islands, separation, sync] })
    notify({ kind: 'success', text: 'Saved the configuration in this sample session.' })
  }
  const loadPreset = () => {
    if (!preset) return
    setMode(preset.mode)
    ;[setFloor, setCeiling, setWall].forEach((setter, index) => setter(preset.kinds[index]))
    ;[setFloorType, setCeilingType, setWallType].forEach((setter, index) => setter(preset.types[index]))
    ;[setAlignTop, setNotch, setAtTop, setIslands, setSeparation, setSync].forEach((setter, index) => setter(preset.options[index]))
    notify({ kind: 'info', text: 'Loaded the sample configuration.' })
  }
  const exportPlan = () => {
    downloadCsv('room-finish-plan-sample.csv', ['Room', 'Kind', 'Action', 'Status', 'Reason', 'Approved'],
      plan.map((row) => [row.room, row.kind, row.action, row.status, row.reason, approved.has(row.key) ? 'Yes' : 'No']))
    notify({ kind: 'success', text: 'Downloaded the sample finish plan as CSV.' })
  }

  if (screen !== 'setup') {
    return (
      <RevitDialog theme={theme} onTheme={setTheme} eyebrow="Arch Forge / Finishes" title={readOnly ? 'Review generated finishes' : 'Review finish plan'} caption={`${PICKED.length} rooms · ${plan.length} planned rows`} onClose={close}
        footer={<>
          <span className="ad-status">{screen === 'done' ? 'Applied. Review the new finishes in the model.' : readOnly ? 'Read-only review. The sample elements remain in the model.' : `${approved.size} of ${plan.length} rows approved`}</span>
          <Btn onClick={exportPlan}>Download plan CSV</Btn>
          {screen === 'review' ? <>
            <Btn onClick={() => setScreen('setup')}>Back</Btn>
            {!readOnly && <Btn primary demo="apply" disabled={approved.size === 0} onClick={apply}>Apply reviewed plan</Btn>}
          </> : <Btn primary onClick={close}>Close</Btn>}
        </>}>
        {screen === 'done' && <div className="ad-result">Applied {approved.size} approved rows.{sync && ' Synchronized the corresponding room finish fields.'} Rows you left unticked retain their original values.</div>}
        <div className="ad-table-wrap" style={{ maxHeight: 400 }}>
          <table className="ad-table">
            <thead><tr><th>Apply</th><th>Room</th><th>Kind</th><th>Action</th><th>Status</th><th>Reason / review</th></tr></thead>
            <tbody>{plan.map((r) => (
              <tr key={r.key} className={approved.has(r.key) ? 'sel' : ''}>
                <td>{isWritable(r) && screen !== 'done'
                  ? <Check checked={approved.has(r.key)} onChange={(value) => {
                    const next = new Set(approved)
                    if (value) next.add(r.key); else next.delete(r.key)
                    setApproved(next)
                  }} title={'Apply ' + r.room + ' ' + r.kind} />
                  : approved.has(r.key) ? 'Applied' : '—'}</td>
                <td>{r.room}</td><td>{r.kind}</td><td>{r.action}</td>
                <td><span className={`ad-pill ${r.status === 'Ready' ? 'ok' : r.status === 'Exists' ? 'info' : 'warn'}`}>{r.status}</span></td>
                <td className="wrap" style={{ minWidth: 220 }}>{r.reason}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </RevitDialog>
    )
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} eyebrow="Arch Forge / Finishes" title="Room to Finishes" caption={`${PICKED.length} rooms selected in Revit`} onClose={close}
      footer={<>
        <span className="ad-status">{readOnly ? 'Ready to review retained finishes.' : ready ? 'Ready to review the creation plan.' : 'Choose a type for every finish you create.'}</span>
        <Btn onClick={close}>Cancel</Btn>
        <Btn primary demo="review" disabled={!ready} onClick={openReview}>Review plan</Btn>
      </>}>
      <div className="ad-grid2 crafted-layout" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div className="ad-row"><span className="ad-h" style={{ width: 80 }}>Run mode</span>
            <Select label="Run mode" value={mode} onChange={setMode} width="100%" options={MODES} />
          </div>
          <div className="ad-row">
            <Btn sm disabled={!preset} onClick={loadPreset}>Load preset…</Btn>
            <Btn sm onClick={savePreset}>Save preset…</Btn>
            <span className="ad-note">{preset ? 'Sample session preset available' : 'Custom configuration · not saved'}</span>
          </div>
          {readOnly ? <p className="ad-note">Review generated finishes with missing source rooms or manual edits.</p> : <>
          <Expander header="Room finish schedule fields and reviewed legacy adoption">
            <Check label="Synchronize Room Floor / Ceiling / Wall Finish fields after successful creation" checked={sync} onChange={setSync} />
          </Expander>
          <div className="ad-h" style={{ marginTop: 4 }}>1&nbsp; Choose finishes and types</div>
          <span className="ad-note">Choose each type explicitly. Open a type list and start typing to jump to a matching name.</span>
          <div className="ad-card" style={{ display: 'grid', gap: 8 }}>
            <Check label="Create floors" checked={floor} onChange={setFloor} />
            <Select label="Floor finish type" value={floorType} onChange={pickType('floor')} options={[CHOOSE, ...FLOOR_TYPES]} width="100%" demo="floor-type" />
            <div data-demo="floor-pos">
              <Expander header="Position and door thresholds">
                <Check label="Align top face with room base" checked={alignTop} onChange={setAlignTop} />
                <Check label="Extend into door openings" checked={notch} onChange={(v) => { setNotch(v); if (v) done('option') }} />
              </Expander>
            </div>
          </div>
          <div className="ad-card" style={{ display: 'grid', gap: 8 }}>
            <Check label="Create ceilings" checked={ceiling} onChange={setCeiling} />
            <Select label="Ceiling finish type" value={ceilingType} onChange={pickType('ceiling')} options={[CHOOSE, ...CEILING_TYPES]} width="100%" />
            <Expander header="Vertical position"><Check label="Place at room top (account for thickness)" checked={atTop} onChange={setAtTop} /></Expander>
          </div>
          <div className="ad-card" style={{ display: 'grid', gap: 8 }}>
            <Check label="Create wall linings" checked={wall} onChange={setWall} />
            <Select label="Wall lining type" value={wallType} onChange={pickType('wall')} options={[CHOOSE, ...WALL_TYPES]} width="100%" />
            <Expander header="Boundary rules">
              <Check label="Finish internal islands and columns" checked={islands} onChange={setIslands} />
              <Check label="Include room separation lines" checked={separation} onChange={setSeparation} />
            </Expander>
            <span className="ad-note">Basic walls and columns are supported. Curtain and stacked walls are skipped.</span>
          </div>
          </>}
        </div>
        <div className="ad-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="ad-h">2&nbsp; Review scope</div>
          <span className="ad-label">Selected rooms</span>
          <span className="ad-note" style={{ color: 'var(--d-text-2)' }}>{PICKED.map((r) => `${r.number} ${r.name}`).join(', ')}</span>
          <span className="ad-label">Creation plan</span>
          <span className="ad-note" style={{ color: 'var(--d-text-2)' }}>{[floor && `${PICKED.length} floors`, ceiling && `${PICKED.length} ceilings`, wall && 'wall linings along wall, column' + (separation ? ' and separation-line' : '') + ' boundaries'].filter(Boolean).join(' · ') || 'Nothing selected'}</span>
          <div className="ad-h" style={{ marginTop: 6 }}>Review before applying</div>
          <span className="ad-note">The next screen lists each room, finish kind, existing elements and intended action. Only approved rows are applied.</span>
          <span className="ad-note">Edited, pinned, copied or dependent generated elements are preserved. New linings are unjoined and do not redefine room boundaries.</span>
        </div>
      </div>
    </RevitDialog>
  )
}
