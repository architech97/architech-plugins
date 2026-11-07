import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Check, Radio, Select, TextBox, SearchBox, Progress } from '../ui'
import { ROOMS, SCALES, TEMPLATES } from '../sample'
import type { DemoContext } from '../types'

// Simulation of Arch Folio > Views > Room to View. Step names and options follow the shipping
// dialog. View names below are illustrative: the tool names views from the room number and name.
const STEPS = [
  ['Rooms', 'Tick the rooms to make views for.'],
  ['Floor Plan', 'A floor plan cropped to the room.'],
  ['Ceiling Plan', 'A reflected ceiling plan cropped to the room.'],
  ['3D View', 'A 3D view with a section box around the room.'],
  ['Elevations', 'Interior elevations of the room walls.'],
  ['Masking', 'Mask each elevation to the room interior.'],
  ['Place on Sheet', 'Put the new views on sheets in a layout.'],
] as const
type Step = (typeof STEPS)[number][0]

export default function RoomToView({ theme, setTheme, done, notify, close }: DemoContext) {
  const [step, setStep] = useState<Step>('Rooms')
  const [ticked, setTicked] = useState<Set<number>>(new Set())
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('All levels')
  const [opt, setOpt] = useState({ floor: true, floorCrop: true, floorOffset: '100', floorScale: '1:50', floorTemplate: '<None>', ceiling: true, ceilingTemplate: '<None>', threeD: false, elev: true, layout: 'four', n: true, e: true, s: true, w: true, elevScale: '1:25', elevTemplate: '<None>', mask: false })
  const [created, setCreated] = useState<string[]>([])
  const [placeTicked, setPlaceTicked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(0)
  const [status, setStatus] = useState('Tick Include on each step you want made.')

  const rooms = useMemo(() => ROOMS.filter((r) => (level === 'All levels' || r.level === level) && (!q || `${r.number} ${r.name} ${r.level}`.toLowerCase().includes(q.toLowerCase()))), [q, level])
  const set = (k: keyof typeof opt, v: unknown) => setOpt((o) => ({ ...o, [k]: v }))
  const tick = (id: number, v: boolean) => { const t = new Set(ticked); v ? t.add(id) : t.delete(id); setTicked(t); if (t.size >= 1) done('rooms') }

  const planned = useMemo(() => {
    const names: string[] = []
    ROOMS.filter((r) => ticked.has(r.id)).forEach((r) => {
      const base = `${r.number} ${r.name}`
      if (opt.floor) names.push(`${base} - Floor Plan`)
      if (opt.ceiling) names.push(`${base} - Ceiling Plan`)
      if (opt.threeD) names.push(`${base} - 3D`)
      if (opt.elev && r.status !== 'Review') {
        if (opt.layout === 'dir') (['n', 'e', 's', 'w'] as const).forEach((d) => opt[d] && names.push(`${base} - Elevation ${({ n: 'North', e: 'East', s: 'South', w: 'West' })[d]}`))
        else ['A', 'B', 'C', 'D'].forEach((x) => names.push(`${base} - Elevation ${x}`))
      }
    })
    return names
  }, [ticked, opt])

  const create = () => {
    let p = 0; setBusy(1)
    const t = window.setInterval(() => {
      p += 12.5; setBusy(Math.min(100, p))
      if (p >= 100) {
        window.clearInterval(t); setBusy(0)
        setCreated(planned); setPlaceTicked(new Set(planned))
        const skipped = ROOMS.filter((r) => ticked.has(r.id) && r.status === 'Review' && opt.elev)
        setStatus(`Created ${planned.length} views for ${ticked.size} rooms in one undo step.`)
        notify({ kind: 'success', text: `Created ${planned.length} views for ${ticked.size} rooms (simulated). The whole batch is one undo step.` })
        skipped.forEach((r) => notify({ kind: 'warning', text: `${r.number} ${r.name}: ${r.note}.` }))
        done('create'); setStep('Place on Sheet')
      }
    }, 140)
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="Room to View" caption="Plans, a 3D view and elevations for every ticked room, then place them on sheets" onClose={close}
      footer={<>
        <span className="ad-status">{status}</span>
        <Btn onClick={close}>Close</Btn>
        {step === 'Place on Sheet' && created.length > 0
          ? <Btn primary disabled={placeTicked.size === 0} onClick={() => { notify({ kind: 'success', text: `Placed ${placeTicked.size} views on new sheets, one room per sheet (simulated). Views that do not fit stay unplaced and are named in the report.` }); setStatus(`Placed ${placeTicked.size} views.`) }}>Place selected views</Btn>
          : <Btn primary demo="create" disabled={ticked.size === 0 || planned.length === 0 || busy > 0} onClick={create}>Create</Btn>}
      </>}>
      <div className="ad-split" style={{ margin: '-16px -20px', minHeight: 500 }}>
        <nav className="ad-nav" aria-label="Room to View steps">
          <span className="ad-label" style={{ padding: '2px 10px 8px' }}>Steps</span>
          {STEPS.map(([s]) => (
            <button key={s} className={s === step ? 'on' : ''} data-demo={`nav:${s}`} onClick={() => { setStep(s); if (s === 'Floor Plan') done('floor'); if (s === 'Elevations') done('elev') }}>{s}</button>
          ))}
        </nav>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div><div className="ad-h">{step}</div><div className="ad-note">{STEPS.find(([s]) => s === step)![1]}</div></div>
          {busy > 0 && <Progress value={busy} />}

          {step === 'Rooms' && <>
            <div className="ad-row">
              <SearchBox value={q} onChange={setQ} placeholder="Search room number, name or level..." width={260} />
              <Select label="Level" value={level} onChange={setLevel} options={['All levels', 'Level 01', 'Level 02']} width={120} />
              <Btn sm onClick={() => notify({ kind: 'info', text: 'Preflight checks each ticked room before anything is made.' })}>Preflight</Btn>
              <Btn sm onClick={() => { const t = new Set(ticked); rooms.forEach((r) => t.add(r.id)); setTicked(t); if (t.size) done('rooms') }}>Tick shown</Btn>
              <Btn sm onClick={() => setTicked(new Set())}>Clear ticks</Btn>
            </div>
            <div className="ad-table-wrap" style={{ maxHeight: 300 }} data-demo="rooms">
              <table className="ad-table">
                <thead><tr><th /><th>Number</th><th>Name</th><th>Level</th><th>Area</th><th>Preflight</th><th>Review notes</th></tr></thead>
                <tbody>{rooms.map((r) => (
                  <tr key={r.id} className={ticked.has(r.id) ? 'sel' : ''} onClick={() => tick(r.id, !ticked.has(r.id))}>
                    <td onClick={(e) => e.stopPropagation()}><Check checked={ticked.has(r.id)} onChange={(v) => tick(r.id, v)} title={`Tick room ${r.number}`} /></td>
                    <td>{r.number}</td><td>{r.name}</td><td>{r.level}</td><td className="num">{r.area.toFixed(1)} m²</td>
                    <td><span className={`ad-pill ${r.status === 'Ready' ? 'ok' : 'warn'}`}>{r.status}</span></td><td className="wrap">{r.note}</td>
                  </tr>))}</tbody>
              </table>
            </div>
            <span className="ad-note">{ticked.size} rooms ticked · {planned.length} views planned</span>
          </>}

          {step === 'Floor Plan' && <div className="ad-card" style={{ display: 'grid', gap: 9, maxWidth: 520 }}>
            <Check label="Include Floor Plan" checked={opt.floor} onChange={(v) => set('floor', v)} />
            <Check label="Match crop to room boundary" checked={opt.floorCrop} onChange={(v) => set('floorCrop', v)} />
            <div className="ad-row"><span className="ad-note" style={{ width: 90 }}>Offset (mm):</span><TextBox style={{ width: 80 }} value={opt.floorOffset} onChange={(e) => set('floorOffset', e.target.value)} aria-label="Floor plan crop offset" /></div>
            <div className="ad-row"><span className="ad-note" style={{ width: 90 }}>View scale:</span><Select label="Floor plan scale" value={opt.floorScale} onChange={(v) => set('floorScale', v)} options={SCALES} width={90} /></div>
            <span className="ad-label">View template</span>
            <Select label="Floor plan view template" value={opt.floorTemplate} onChange={(v) => set('floorTemplate', v)} options={TEMPLATES} width={240} />
          </div>}

          {step === 'Ceiling Plan' && <div className="ad-card" style={{ display: 'grid', gap: 9, maxWidth: 520 }}>
            <Check label="Include Ceiling Plan" checked={opt.ceiling} onChange={(v) => set('ceiling', v)} />
            <Check label="Match crop to room boundary" checked onChange={() => {}} />
            <span className="ad-label">View template</span>
            <Select label="Ceiling plan view template" value={opt.ceilingTemplate} onChange={(v) => set('ceilingTemplate', v)} options={TEMPLATES} width={240} />
          </div>}

          {step === '3D View' && <div className="ad-card" style={{ display: 'grid', gap: 9, maxWidth: 520 }}>
            <Check label="Include 3D view with section box" checked={opt.threeD} onChange={(v) => set('threeD', v)} />
            <div className="ad-row"><span className="ad-note" style={{ width: 120 }}>Box padding (mm):</span><TextBox style={{ width: 80 }} defaultValue="300" aria-label="Box padding" /></div>
          </div>}

          {step === 'Elevations' && <div className="ad-card" style={{ display: 'grid', gap: 9 }}>
            <Check label="Include Elevations" checked={opt.elev} onChange={(v) => set('elev', v)} />
            <span className="ad-label">Layout</span>
            <Radio name="layout" label="All walls — one parallel elevation per straight wall" checked={opt.layout === 'all'} onChange={() => set('layout', 'all')} />
            <Radio name="layout" label="4 elevations — one shared marker aligned to a primary wall" checked={opt.layout === 'four'} onChange={() => set('layout', 'four')} />
            <Radio name="layout" label="Four elevations by direction (North, East, South, West)" checked={opt.layout === 'dir'} onChange={() => set('layout', 'dir')} />
            {opt.layout === 'dir' && <div className="ad-row">{(['n', 'e', 's', 'w'] as const).map((d) => <Check key={d} label={({ n: 'North', e: 'East', s: 'South', w: 'West' })[d]} checked={opt[d]} onChange={(v) => set(d, v)} />)}</div>}
            <span className="ad-note">Distance into the room from the finish boundary. Curved boundaries are skipped.</span>
            <div className="ad-row"><span className="ad-note" style={{ width: 90 }}>View scale:</span><Select label="Elevation scale" value={opt.elevScale} onChange={(v) => set('elevScale', v)} options={SCALES} width={90} /></div>
            <span className="ad-label">View template</span>
            <Select label="Elevation view template" value={opt.elevTemplate} onChange={(v) => set('elevTemplate', v)} options={TEMPLATES} width={240} />
          </div>}

          {step === 'Masking' && <div className="ad-card" style={{ display: 'grid', gap: 9, maxWidth: 560 }}>
            <Check label="Mask each elevation to the room interior" checked={opt.mask} onChange={(v) => set('mask', v)} />
            <span className="ad-note">Hides everything outside the room: past the wall finish, below the floor finish top, and above the ceiling finish (the ceiling finish stays visible). Needs Elevations ticked.</span>
          </div>}

          {step === 'Place on Sheet' && (created.length === 0
            ? <div className="ad-card"><span className="ad-note">Create the views first; the new views are listed here to place on sheets.</span></div>
            : <>
              <span className="ad-label">1&nbsp; Select views</span>
              <div className="ad-table-wrap" style={{ maxHeight: 220 }}>
                <table className="ad-table"><thead><tr><th /><th>Type</th><th>View</th></tr></thead>
                  <tbody>{created.map((v) => (
                    <tr key={v} className={placeTicked.has(v) ? 'sel' : ''}><td><Check checked={placeTicked.has(v)} onChange={(c) => { const t = new Set(placeTicked); c ? t.add(v) : t.delete(v); setPlaceTicked(t) }} title={`Place ${v}`} /></td>
                      <td>{v.includes('Floor') ? 'Floor Plan' : v.includes('Ceiling') ? 'Ceiling Plan' : v.includes('3D') ? '3D View' : 'Elevation'}</td><td>{v}</td></tr>))}</tbody></table>
              </div>
              <div className="ad-grid2">
                <div className="ad-card" style={{ display: 'grid', gap: 6 }}><span className="ad-label">2&nbsp; Sheet and viewport title</span><Radio name="sheet" label="Create new sheet" checked onChange={() => {}} /><Check label="Keep each room on its own new sheet" checked onChange={() => {}} /></div>
                <div className="ad-card" style={{ display: 'grid', gap: 6 }}><span className="ad-label">3&nbsp; Layout</span><Select label="Layout on each sheet" value="Plan + 4 elevations" onChange={() => {}} options={['Plan + 4 elevations', 'Grid', 'Same spot as reference sheet']} width="100%" /><span className="ad-note">Nothing is scaled automatically. A view that does not fit stays unplaced and is named in the report.</span></div>
              </div>
            </>)}
        </div>
      </div>
    </RevitDialog>
  )
}
