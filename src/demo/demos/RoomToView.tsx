import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Check, Radio, Select, TextBox, SearchBox } from '../ui'
import './crafted.css'
import { ROOMS, SCALES, TEMPLATES as SAMPLE_TEMPLATES } from '../sample'
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
const TEMPLATES = SAMPLE_TEMPLATES.map((name) => name === '<None>' ? '(None)' : name)

export default function RoomToView({ theme, setTheme, done, notify, close }: DemoContext) {
  const [step, setStep] = useState<Step>('Rooms')
  const [ticked, setTicked] = useState<Set<number>>(new Set())
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('All levels')
  const [scope, setScope] = useState('Whole model')
  const [opt, setOpt] = useState({ ceilingCrop: true, boxPadding: '300', floor: false, floorCrop: true, floorOffset: '100', floorScale: '1:50', floorTemplate: '(None)', ceiling: false, ceilingTemplate: '(None)', threeD: false, elev: false, layout: 'all', n: true, e: true, s: true, w: true, elevScale: '1:25', elevTemplate: '(None)', mask: false })
  const [created, setCreated] = useState<Record<string, string>>({})
  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [perRoom, setPerRoom] = useState(true)
  const [layout, setLayout] = useState('Plan + 4 elevations')
  const [placeTicked, setPlaceTicked] = useState<Set<string>>(new Set())

  const [status, setStatus] = useState('Tick Include on each step you want made.')

  const rooms = useMemo(() => ROOMS.filter((r) => (scope === 'Whole model' || r.level === 'Level 01') &&
    (level === 'All levels' || r.level === level) && (!q || `${r.number} ${r.name} ${r.level}`.toLowerCase().includes(q.toLowerCase()))), [q, level, scope])
  const set = <K extends keyof typeof opt>(k: K, v: typeof opt[K]) => setOpt((o) => ({ ...o, [k]: v }))
  const tick = (id: number, v: boolean) => { const t = new Set(ticked); if (v) t.add(id); else t.delete(id); setTicked(t); if (t.size >= 1) done('rooms') }

  const planned = useMemo(() => {
    const names: string[] = []
    ROOMS.filter((r) => ticked.has(r.id)).forEach((r) => {
      const base = `${r.number} ${r.name}`
      if (opt.floor) names.push(`${base} - Floor Plan`)
      if (opt.ceiling) names.push(`${base} - Ceiling Plan`)
      if (opt.threeD) names.push(`${base} - 3D`)
      if (opt.elev) {
        if (opt.layout === 'dir') (['n', 'e', 's', 'w'] as const).forEach((d) => opt[d] && names.push(`${base} - Elevation ${({ n: 'North', e: 'East', s: 'South', w: 'West' })[d]}`))
        else (opt.layout === 'all' ? ['A', 'B', 'C', 'D', 'E'].slice(0, r.straightWalls ?? 4) : ['A', 'B', 'C', 'D']).forEach((x) => names.push(`${base} - Elevation ${x}`))
      }
    })
    return names
  }, [ticked, opt])

  const numeric = (value: string) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
  const validOptions = (!opt.floor || !opt.floorCrop || numeric(opt.floorOffset)) && (!opt.threeD || numeric(opt.boxPadding))
  const newViews = planned.filter((view) => !created[view])
  const selectedRooms = ROOMS.filter((room) => ticked.has(room.id))
  const curved = selectedRooms.filter((room) => room.status === 'Review' && opt.elev)
  const viewKind = (view: string) => view.slice(view.lastIndexOf(' - ') + 3)
  const preflight = () => {
    const message = selectedRooms.length + ' rooms checked. ' + newViews.length + ' new views planned.' + (curved.length ? ' Curved boundaries skipped for ' + curved.map((room) => room.name).join(', ') + '.' : '')
    setStatus(message)
    notify({ kind: curved.length ? 'warning' : 'info', text: message })
  }
  const create = () => {
    const settingsFor = (view: string) => {
      const kind = viewKind(view)
      if (kind === 'Floor Plan') return [opt.floorScale, opt.floorTemplate, opt.floorCrop ? 'Crop: ' + opt.floorOffset + ' mm' : 'No room crop'].join(' · ')
      if (kind === 'Ceiling Plan') return [opt.ceilingTemplate, opt.ceilingCrop ? 'Room crop' : 'No room crop'].join(' · ')
      if (kind === '3D') return 'Section box padding: ' + opt.boxPadding + ' mm'
      return [opt.elevScale, opt.elevTemplate, opt.mask ? 'Room interior masked' : 'No interior mask'].join(' · ')
    }
    setCreated({ ...created, ...Object.fromEntries(newViews.map((view) => [view, settingsFor(view)])) })
    setPlaceTicked(new Set(newViews))
    const message = 'Created ' + newViews.length + ' new sample views.'
    setStatus(message)
    notify({ kind: 'success', text: message })
    curved.forEach((room) => notify({ kind: 'warning', text: room.number + ' ' + room.name + ': ' + room.note + '.' }))
    done('create')
    setStep('Place on Sheet')
  }
  const place = () => {
    const next = { ...placed }
    const skipped: string[] = []
    for (const view of placeTicked) {
      const sheet = perRoom ? 'INT-' + view.split(' ')[0] : 'INT-001'
      const existing = Object.keys(next).filter((name) => next[name] === sheet)
      const kind = viewKind(view)
      const group = kind.startsWith('Elevation') ? 'elev' : kind.endsWith('Plan') ? 'plan' : 'other'
      const fits = layout === '4 in a 2 × 2 grid' ? existing.length < 4
        : group === 'elev' ? existing.filter((name) => viewKind(name).startsWith('Elevation')).length < 4
          : group === 'plan' && !existing.some((name) => viewKind(name).endsWith('Plan'))
      if (fits) next[view] = sheet
      else skipped.push(view)
    }
    setPlaced(next)
    setPlaceTicked(new Set(skipped))
    const count = placeTicked.size - skipped.length
    const message = 'Placed ' + count + ' sample views. ' + skipped.length + ' did not fit the selected layout.'
    setStatus(message)
    notify({ kind: skipped.length ? 'warning' : 'success', text: message })
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="Room to View" caption="Plans, a 3D view and elevations for every ticked room, then place them on sheets" onClose={close}
      footer={<>
        <span className="ad-status">{status}</span>
        <Btn onClick={close}>Close</Btn>
        {step === 'Place on Sheet' && Object.keys(created).length > 0
          ? <Btn primary disabled={placeTicked.size === 0} onClick={place}>Place selected views</Btn>
          : <Btn primary demo="create" disabled={!newViews.length || !validOptions} onClick={create}>Create</Btn>}

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
          {!validOptions && <p className="ad-result">Enter a non-negative numeric crop offset or section box padding.</p>}

          {step === 'Rooms' && <>
            <div className="ad-row">
              <Select label="Scope" value={scope} onChange={setScope} options={['Whole model', 'View when opened']} width="min(180px, 100%)" />
              <SearchBox value={q} onChange={setQ} placeholder="Search room number, name or level..." width="min(260px, 100%)" />
              <Select label="Level" value={level} onChange={setLevel} options={['All levels', 'Level 01', 'Level 02']} width={120} />
              <Btn sm disabled={!ticked.size} onClick={preflight}>Preflight</Btn>
              <Btn sm onClick={() => { const t = new Set(ticked); rooms.forEach((r) => t.add(r.id)); setTicked(t); if (t.size) done('rooms') }}>Tick shown</Btn>
              <Btn sm onClick={() => setTicked(new Set())}>Clear ticks</Btn>
            </div>
            {scope === 'View when opened' && <p className="ad-note">The sample view is the Level 01 floor plan. Ticks survive scope changes.</p>}
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
            <Select label="Floor plan view template" value={opt.floorTemplate} onChange={(v) => set('floorTemplate', v)} options={TEMPLATES} width="min(240px, 100%)" />
          </div>}

          {step === 'Ceiling Plan' && <div className="ad-card" style={{ display: 'grid', gap: 9, maxWidth: 520 }}>
            <Check label="Include Ceiling Plan" checked={opt.ceiling} onChange={(v) => set('ceiling', v)} />
            <Check label="Match crop to room boundary" checked={opt.ceilingCrop} onChange={(value) => set('ceilingCrop', value)} />
            <span className="ad-label">View template</span>
            <Select label="Ceiling plan view template" value={opt.ceilingTemplate} onChange={(v) => set('ceilingTemplate', v)} options={TEMPLATES} width="min(240px, 100%)" />
          </div>}

          {step === '3D View' && <div className="ad-card" style={{ display: 'grid', gap: 9, maxWidth: 520 }}>
            <Check label="Include 3D view with section box" checked={opt.threeD} onChange={(v) => set('threeD', v)} />
            <div className="ad-row"><span className="ad-note" style={{ width: 120 }}>Box padding (mm):</span><TextBox style={{ width: 80 }} value={opt.boxPadding} onChange={(event) => set('boxPadding', event.target.value)} aria-label="Box padding" /></div>
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
            <Select label="Elevation view template" value={opt.elevTemplate} onChange={(v) => set('elevTemplate', v)} options={TEMPLATES} width="min(240px, 100%)" />
          </div>}

          {step === 'Masking' && <div className="ad-card" style={{ display: 'grid', gap: 9, maxWidth: 560 }}>
            <Check label="Mask each elevation to the room interior" checked={opt.mask} onChange={(v) => set('mask', v)} />
            <span className="ad-note">Hides everything outside the room: past the wall finish, below the floor finish top, and above the ceiling finish (the ceiling finish stays visible). Needs Elevations ticked.</span>
          </div>}

          {step === 'Place on Sheet' && (Object.keys(created).length === 0
            ? <div className="ad-card"><span className="ad-note">Create the views first; the new views are listed here to place on sheets.</span></div>
            : <>
              <span className="ad-label">1&nbsp; Select views</span>
              <div className="ad-table-wrap" style={{ maxHeight: 220 }}>
                <table className="ad-table">
                  <thead><tr><th>Pick</th><th>View</th><th>Settings</th><th>Placement</th></tr></thead>
                  <tbody>{Object.entries(created).map(([view, settings]) => (
                    <tr key={view} className={placeTicked.has(view) ? 'sel' : ''}>
                      <td>{!placed[view] && <Check checked={placeTicked.has(view)} onChange={(checked) => {
                        const next = new Set(placeTicked)
                        if (checked) next.add(view); else next.delete(view)
                        setPlaceTicked(next)
                      }} title={'Place ' + view} />}</td>
                      <td>{view}</td><td>{settings}</td><td>{placed[view] || 'Unplaced'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="ad-grid2 crafted-layout">
                <div className="ad-card" style={{ display: 'grid', gap: 6 }}>
                  <span className="ad-label">2&nbsp; New sheet</span>
                  <Check label="Keep each room on its own new sheet" checked={perRoom} onChange={setPerRoom} />
                </div>
                <div className="ad-card" style={{ display: 'grid', gap: 6 }}>
                  <span className="ad-label">3&nbsp; Layout</span>
                  <Select label="Layout on each sheet" value={layout} onChange={setLayout} options={['Plan + 4 elevations', '4 in a 2 × 2 grid']} width="100%" />
                  <span className="ad-note">Views that exceed the sample sheet capacity remain unplaced.</span>
                </div>
              </div>
            </>)}
        </div>
      </div>
    </RevitDialog>
  )
}
