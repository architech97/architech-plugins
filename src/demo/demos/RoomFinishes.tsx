import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Check, Select, Expander, Progress } from '../ui'
import { ROOMS, FLOOR_TYPES, CEILING_TYPES, WALL_TYPES } from '../sample'
import type { DemoContext } from '../types'

// Simulation of Arch Forge > Finishes > Room to Finishes: the setup dialog, then the review screen
// that lists each room, finish kind and intended action. Only approved rows are applied.
const PICKED = ROOMS.filter((r) => ['101', '102', '103', '105'].includes(r.number))
const CHOOSE = '<Choose a type>'

interface PlanRow { key: string; room: string; kind: 'Floor' | 'Ceiling' | 'Wall lining'; action: string; status: string; reason: string; ok: boolean }

export default function RoomFinishes({ theme, setTheme, done, notify, close }: DemoContext) {
  const [mode, setMode] = useState('Create missing — keep existing generated finishes')
  const [floor, setFloor] = useState(true), [ceiling, setCeiling] = useState(true), [wall, setWall] = useState(true)
  const [floorType, setFloorType] = useState(CHOOSE), [ceilingType, setCeilingType] = useState(CHOOSE), [wallType, setWallType] = useState(CHOOSE)
  const [alignTop, setAlignTop] = useState(true), [notch, setNotch] = useState(false), [atTop, setAtTop] = useState(true)
  const [islands, setIslands] = useState(true), [separation, setSeparation] = useState(false)
  const [screen, setScreen] = useState<'setup' | 'review' | 'done'>('setup')
  const [approved, setApproved] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(0)

  const ready = (!floor || floorType !== CHOOSE) && (!ceiling || ceilingType !== CHOOSE) && (!wall || wallType !== CHOOSE) && (floor || ceiling || wall)
  const pickType = (which: 'floor' | 'ceiling' | 'wall') => (v: string) => {
    const next = { floor: floorType, ceiling: ceilingType, wall: wallType, [which]: v }
    ;({ floor: setFloorType, ceiling: setCeilingType, wall: setWallType })[which](v)
    if (Object.values(next).every((t) => t !== CHOOSE)) done('types')
  }

  const plan: PlanRow[] = useMemo(() => {
    const rows: PlanRow[] = []
    PICKED.forEach((r) => {
      const name = `${r.number} ${r.name}`
      if (floor) rows.push({ key: r.number + 'F', room: name, kind: 'Floor', action: 'Create', status: 'Ready', ok: true, reason: `${floorType}${notch ? ', extended into door openings' : ''}` })
      if (ceiling) rows.push({ key: r.number + 'C', room: name, kind: 'Ceiling', action: r.number === '102' ? 'Keep existing' : 'Create', status: r.number === '102' ? 'Exists' : 'Ready', ok: true, reason: r.number === '102' ? 'A generated ceiling already exists for this room and phase' : `${ceilingType} at room top` })
      if (wall) rows.push({ key: r.number + 'W', room: name, kind: 'Wall lining', action: r.number === '105' ? 'Skip' : 'Create', status: r.number === '105' ? 'Review' : 'Ready', ok: r.number !== '105', reason: r.number === '105' ? 'Boundary segment on a curtain wall: curtain and stacked walls are skipped' : `${wallType}${islands ? ', internal islands and columns included' : ''}` })
    })
    return rows
  }, [floor, ceiling, wall, floorType, ceilingType, wallType, notch, islands])

  const openReview = () => {
    setApproved(new Set(plan.filter((p) => p.ok && p.action === 'Create').map((p) => p.key)))
    setScreen('review'); done('review')
  }
  const apply = () => {
    const n = approved.size
    let p = 0; setBusy(1)
    const t = window.setInterval(() => {
      p += 25; setBusy(p)
      if (p >= 100) {
        window.clearInterval(t); setBusy(0); setScreen('done')
        const by = (k: string) => plan.filter((r) => approved.has(r.key) && r.kind === k).length
        notify({ kind: 'success', text: `Created ${by('Floor')} floors, ${by('Ceiling')} ceilings and ${by('Wall lining')} wall linings (simulated). One undoable step per element kind.` })
        done('apply')
      }
    }, 180)
    void n
  }

  if (screen !== 'setup') {
    return (
      <RevitDialog theme={theme} onTheme={setTheme} eyebrow="Arch Forge / Finishes" title="Review finish plan" caption={`${PICKED.length} rooms · ${plan.length} planned rows`} onClose={close}
        footer={<>
          <span className="ad-status">{screen === 'done' ? 'Applied. Review the new finishes in the model.' : `${approved.size} of ${plan.length} rows approved`}</span>
          <Btn onClick={() => notify({ kind: 'info', text: 'Export CSV writes the reviewed plan with every room, kind, action and reason.' })}>Export CSV...</Btn>
          {screen === 'review' ? <>
            <Btn onClick={() => setScreen('setup')}>Back</Btn>
            <Btn primary demo="apply" disabled={approved.size === 0 || busy > 0} onClick={apply}>Apply reviewed plan</Btn>
          </> : <Btn primary onClick={close}>Close</Btn>}
        </>}>
        {busy > 0 && <Progress value={busy} />}
        {screen === 'done' && <div className="ad-result">Applied {approved.size} approved rows. Rows you left unticked were not changed.</div>}
        <div className="ad-table-wrap" style={{ maxHeight: 400 }}>
          <table className="ad-table">
            <thead><tr><th>Apply</th><th>Room</th><th>Kind</th><th>Action</th><th>Status</th><th>Reason / review</th></tr></thead>
            <tbody>{plan.map((r) => (
              <tr key={r.key} className={approved.has(r.key) ? 'sel' : ''}>
                <td><Check checked={approved.has(r.key)} onChange={(v) => { if (!r.ok || r.action !== 'Create' || screen === 'done') return; const a = new Set(approved); v ? a.add(r.key) : a.delete(r.key); setApproved(a) }} title={`Apply ${r.room} ${r.kind}`} /></td>
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
        <span className="ad-status">{ready ? 'Ready to review the creation plan.' : 'Choose a type for every finish you create.'}</span>
        <Btn onClick={close}>Cancel</Btn>
        <Btn primary demo="review" disabled={!ready} onClick={openReview}>Review plan</Btn>
      </>}>
      <div className="ad-grid2" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div className="ad-row"><span className="ad-h" style={{ width: 80 }}>Run mode</span>
            <Select label="Run mode" value={mode} onChange={setMode} width="100%" options={['Create missing — keep existing generated finishes', 'Update generated — preserve edited or dependent elements', 'Review orphaned / edited generated finishes — read only']} />
          </div>
          <div className="ad-row"><Btn sm onClick={() => notify({ kind: 'info', text: 'Load preset… reads a saved finish configuration.' })}>Load preset…</Btn><Btn sm onClick={() => notify({ kind: 'info', text: 'Save preset… stores this configuration for reuse.' })}>Save preset…</Btn><span className="ad-note">Custom configuration · not saved</span></div>
          <Expander header="Room finish schedule fields and reviewed legacy adoption">
            <Check label="Synchronize Room Floor / Ceiling / Wall Finish fields after successful creation" checked={false} onChange={() => {}} />
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
