import { useState } from 'react'
import { DEMO_PROJECT } from '../../data/demoProject'
import type { DemoContext } from '../types'
import { Btn, Check, RevitDialog, SearchBox, Select, TextBox } from '../ui'
import './suiteWorkflow.css'
import './forgeDemo.css'

const LINKS = ['Sample Residence – Structure.rvt', 'Sample Residence – MEP.rvt']
const OPENINGS = [
  { id: 'OP-101', source: 'Supply riser', wall: 'Core wall W-101', link: LINKS[0], width: 450, height: 300, center: 12, host: 'O-101', hostWidth: 450, hostHeight: 300 },
  { id: 'OP-106', source: 'Return duct', wall: 'Service wall W-108', link: LINKS[0], width: 600, height: 500, center: 18, host: 'O-108', hostWidth: 550, hostHeight: 450, native: true },
  { id: 'OP-112', source: 'Exhaust duct', wall: 'Wet wall W-120', link: LINKS[0], width: 300, height: 300, center: 0 },
  { id: 'OP-121', source: 'Plumbing sleeve', wall: 'Core wall W-123', link: LINKS[1], width: 280, height: 280, center: 20, host: 'O-123', hostWidth: 220, hostHeight: 220, native: true, dependent: true },
  { id: 'OP-126', source: 'Branch duct', wall: 'Riser wall W-128', link: LINKS[1], width: 360, height: 320, center: 0 },
]
type Opening = typeof OPENINGS[number]
type Row = { opening: Opening; width: number; height: number; action: 'Keep' | 'Resize' | 'Create' | 'Review'; reason: string }
const actionable = (row: Row) => row.action === 'Create' || row.action === 'Resize'
const FIELDS = { side: ['Each side (mm)', '0'], top: ['Top (mm)', '0'], center: ['Match tolerance (mm)', '300'], size: ['Size tolerance (mm)', '5'] } as const
type Options = Record<keyof typeof FIELDS, string>
const DEFAULTS: Options = { side: '0', top: '0', center: '300', size: '5' }

export default function MatchOpening({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [link, setLink] = useState(LINKS[0])
  const [options, setOptions] = useState(DEFAULTS)
  const [model, setModel] = useState(OPENINGS)
  const [rows, setRows] = useState<Row[]>()
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [receipt, setReceipt] = useState<{ created: number; resized: number }>()
  const applyRows = rows?.filter(row => actionable(row) && selected.includes(row.opening.id)) ?? []
  const visible = rows?.filter(({ opening, action }) => `${opening.id} ${opening.source} ${opening.wall} ${action}`.toLowerCase().includes(query.toLowerCase().trim()))

  const invalidate = () => {
    setRows(undefined); setSelected([]); setError(''); setConfirm(false); setReceipt(undefined)
    rewind('scan')
  }

  const scan = () => {
    invalidate()
    const numbers = Object.fromEntries(Object.entries(options).map(([name, value]) => [name, value.trim() ? Number(value) : NaN])) as Record<keyof Options, number>
    if (!(numbers.center > 0 && numbers.center <= 5000)) { setError('Match tolerance must be greater than 0 and no more than 5000 mm.'); return }
    if (!(['side', 'top', 'size'] as const).every(name => numbers[name] >= 0 && numbers[name] <= 1000)) { setError('Size tolerance and side and top clearance must each be 0 to 1000 mm.'); return }
    const next = model.filter(opening => opening.link === link).map((opening): Row => {
      const width = opening.width + numbers.side * 2
      const height = opening.height + numbers.top
      const item = { opening, width, height }
      if (!opening.host) return { ...item, action: 'Create', reason: 'No host opening at this location' }
      if (opening.center > numbers.center) return { ...item, action: 'Review', reason: 'Existing opening is outside the centre tolerance' }
      if (Math.abs(width - (opening.hostWidth ?? 0)) <= numbers.size && Math.abs(height - (opening.hostHeight ?? 0)) <= numbers.size) return { ...item, action: 'Keep', reason: 'Dimensions are within tolerance' }
      if (opening.dependent) return { ...item, action: 'Review', reason: 'Dependent elements protect this host opening' }
      return { ...item, action: 'Resize', reason: opening.native ? 'Native opening replacement requires confirmation' : 'Update reviewed dimensions' }
    })
    setRows(next)
    setSelected(next.filter(row => row.action === 'Create').map(row => row.opening.id))
    done('scan')
  }

  const apply = () => {
    const changes = new Map(applyRows.map(row => [row.opening.id, row]))
    if (!changes.size) return
    const created = applyRows.filter(row => row.action === 'Create').length
    setModel(model.map(opening => {
      const row = changes.get(opening.id)
      return row ? { ...opening, center: 0, host: `HOST-${opening.id}`, hostWidth: row.width, hostHeight: row.height } : opening
    }))
    setReceipt({ created, resized: changes.size - created })
    setRows(undefined); setSelected([]); setConfirm(false)
    done('select'); done('apply')
    notify({ kind: 'success', text: `${changes.size} opening changes applied to the sample model.` })
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} eyebrow="Arch Forge / Rooms" title="Match Opening"
      caption={`Browser simulation, ${DEMO_PROJECT.code} ${DEMO_PROJECT.name}`} onClose={close}
      footer={<>
        <span className="ad-status">{rows ? `${applyRows.length} changes checked` : 'Scan before applying'}</span>
        <Btn onClick={close}>Close</Btn>
        <Btn demo="opening-scan" onClick={scan}>Scan Openings</Btn>
        <Btn primary demo="opening-apply" disabled={!applyRows.length || confirm}
          onClick={() => applyRows.some(row => row.action === 'Resize' && row.opening.native) ? setConfirm(true) : apply()}>Match Openings</Btn>
      </>}>
      <div className="ad-card suite-flow-fields">
        <label><span>Source Revit link</span><Select label="Source Revit link" value={link} options={LINKS} onChange={value => { setLink(value); invalidate() }} /></label>
        <div className="ad-row">{(Object.keys(FIELDS) as (keyof Options)[]).map(name => <label className="suite-flow-control" key={name}>
          <span>{FIELDS[name][0]}</span><TextBox aria-label={FIELDS[name][0]} inputMode="decimal" value={options[name]} onKeyDown={event => { if (event.key === 'Enter') scan() }}
            onChange={event => { setOptions({ ...options, [name]: event.target.value }); invalidate() }} />
        </label>)}</div>
      </div>
      {error && <p className="suite-flow-error" role="alert">{error}</p>}
      {rows && <section className="ad-card suite-flow-fields" data-demo="opening-select" aria-label="Opening scan results">
        <div className="ad-row"><SearchBox placeholder="Filter by ID, wall or action" value={query} onChange={setQuery} />
          <Check label="Select all proposed changes" checked={rows.filter(actionable).length > 0 && rows.filter(actionable).every(row => selected.includes(row.opening.id))}
            onChange={checked => { setSelected(checked ? rows.filter(actionable).map(row => row.opening.id) : []); setConfirm(false); if (checked) done('select') }} /></div>
        <div className="ad-table-wrap suite-flow-table" tabIndex={0} aria-label="Source and host openings">
          <table className="ad-table"><thead><tr><th scope="col">Apply</th><th scope="col">Source / host wall</th><th scope="col">Cut / host size</th><th scope="col">Action</th><th scope="col">Result</th></tr></thead>
            <tbody>{visible?.map(({ opening, action, width, height, reason }) => <tr key={opening.id}>
              <td>{action === 'Resize' || action === 'Create' ? <Check title={`Apply ${opening.id}`} checked={selected.includes(opening.id)} onChange={checked => {
                setSelected(checked ? [...selected, opening.id] : selected.filter(id => id !== opening.id)); setConfirm(false); if (checked) done('select')
              }} /> : '—'}</td><td>{opening.id}, {opening.source}<br />{opening.wall}</td>
              <td>{width} × {height} mm<br />{opening.host ? `${opening.hostWidth} × ${opening.hostHeight} mm` : 'No host opening'}</td><td>{action}</td><td>{reason}</td>
            </tr>)}</tbody>
          </table>
          {!visible?.length && <p className="suite-flow-note">No openings match this filter.</p>}
        </div>
      </section>}
      {confirm && <div className="ad-card suite-flow-receipt" role="status"><strong>Confirm native opening replacement</strong>
        <p>Recreated native openings receive a new ID. Protected openings with dependent elements are skipped.</p>
        <div className="ad-row"><Btn onClick={() => setConfirm(false)}>Cancel</Btn><Btn primary onClick={apply}>Replace</Btn></div>
      </div>}
      {receipt && <p className="ad-result" role="status">{receipt.created} openings created, {receipt.resized} resized. Scan again to check the updated sample.</p>}
    </RevitDialog>
  )
}
