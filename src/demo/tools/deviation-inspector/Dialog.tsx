import { useId, useState } from 'react'
import type { DemoContext } from '../../types'
import { DialogShell, MiniView } from '../../kit'
import { Btn, Expander, Radio, SearchBox, Select, TextBox } from '../../ui'
import { downloadCsv } from '../../demos/craftedTools'
import '../../demos/suiteWorkflow.css'

const CLOUDS = ['Residence Survey.rcp', 'Interior Survey.rcp']
const METRICS = ['95th percentile', 'Mean', 'Maximum']
const ELEMENTS = [
  { id: 301144, category: 'Walls', name: 'Interior Partition 115 mm', level: 'Level 01', count: 93, initial: 2, increment: .09 },
  { id: 301178, category: 'Walls', name: 'Concrete Core 200 mm', level: 'Level 01', count: 81, initial: 9, increment: .28 },
  { id: 311202, category: 'Structural Columns', name: 'C-01, 300 × 300', level: 'Level 02', count: 50, initial: 29, increment: .55 },
  { id: 311205, category: 'Structural Columns', name: 'C-02, 350 × 350', level: 'Level 02', count: 4, initial: 1, increment: .1 },
  { id: 301184, category: 'Walls', name: 'Service Core 200 mm', level: 'Level 02', count: 0, initial: 0, increment: 0 },
]
type Result = ReturnType<typeof evaluate>
const mm = (value: number | undefined) => value === undefined ? '—' : value.toFixed(1) + ' mm'
const colours = { PASS: 'var(--d-success)', WARNING: 'var(--d-warning)', FAIL: 'var(--d-error)' }

function evaluate(element: typeof ELEMENTS[number], cloud: string, tolerance: number, limit: number, spacing: number, metric: string) {
  const retrieved = Math.min(limit, Math.round((element.count + 3) * Math.min(1, 30.48 / spacing)))
  const measured = Math.max(0, retrieved - 3)
  const initial = element.initial + (cloud === CLOUDS[0] ? 0 : 3)
  const distances = Array.from({ length: measured }, (_, i) => initial + i * element.increment)
  const mean = measured ? distances.reduce((sum, value) => sum + value, 0) / measured : undefined
  const midpoint = Math.floor(measured / 2)
  const median = measured ? measured % 2 ? distances[midpoint] : (distances[midpoint - 1] + distances[midpoint]) / 2 : undefined
  const p95 = distances[Math.ceil(measured * .95) - 1]
  const maximum = distances.at(-1)
  const value = metric === METRICS[1] ? mean : metric === METRICS[2] ? maximum : p95
  const result = !measured || value === undefined ? 'NOT MEASURED' : measured < 5 ? 'INSUFFICIENT SAMPLES' :
    value <= tolerance ? 'PASS' : value <= 35 ? 'WARNING' : 'FAIL'
  return { ...element, measured, retrieved, mean, median, p95, maximum, result, cap: retrieved === limit }
}

export default function DeviationInspector({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const id = useId()
  const [cloud, setCloud] = useState(CLOUDS[0])
  const [tolerance, setTolerance] = useState('15')
  const [limit, setLimit] = useState('100')
  const [spacing, setSpacing] = useState('30.48')
  const [metric, setMetric] = useState(METRICS[0])
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Result[]>([])
  const [selected, setSelected] = useState<number>()
  const [isolated, setIsolated] = useState<number>()
  const [heatmap, setHeatmap] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState(0)
  const [message, setMessage] = useState('')
  const shown = result.filter(row => [row.id, row.name, row.category, row.result].some(field => String(field).toLowerCase().includes(query.trim().toLowerCase())))
  const visual = isolated ? result.filter(row => row.id === isolated) : result

  function configure() {
    setResult([])
    setHeatmap(false)
    setIsolated(undefined)
    setSelected(undefined)
    setError('')
    setMessage('')
    rewind('analyze')
    done('settings')
  }

  function analyze() {
    const t = Number(tolerance), n = Number(limit), s = Number(spacing)
    if (!Number.isFinite(t) || t <= 0) { setError('Enter a finite positive tolerance in mm.'); return }
    if (!Number.isInteger(n) || n < 5 || n > 2000 || !Number.isFinite(s) || s <= 0) {
      setError('Choose 5–2000 sample points per element and a finite positive spacing in mm.')
      return
    }
    const rows = ELEMENTS.map(element => evaluate(element, cloud, t, n, s, metric))
    setResult(rows)
    setHeatmap(true)
    setSelected(undefined)
    setIsolated(undefined)
    setError('')
    setMessage(rows.filter(row => row.result === 'PASS').length + ' of ' + rows.length + ' sample elements passed at ' + t + ' mm (' + metric + ').')
    setAnalysis(analysis + 1)
    done('settings')
    done('analyze')
    notify({ kind: 'info', text: 'Sample analysis complete, review measured and unmeasured rows.' })
  }

  return <DialogShell theme={theme} onTheme={setTheme} title="Deviation Inspector" subtitle="Browser simulation, fictional Scan to BIM measurements"
    onClose={close} footer={<><span className="ad-status">{heatmap ? 'Sample heatmap shown' : 'Original sample graphics'}</span>
      <Btn disabled={!heatmap} onClick={() => { setHeatmap(false); setMessage('Original graphic overrides restored in the sample heatmap view.') }}>Clear Colours</Btn>
      <Btn disabled={!result.length} onClick={() => downloadCsv('AT-01-deviation-inspection.csv',
        ['Element ID', 'Category', 'Family and type', 'Level', 'Result', 'Valid projections', 'Retrieved points', 'Mean', 'Median', 'P95', 'Maximum', 'Projection yield'],
        result.map(row => [String(row.id), row.category, row.name, row.level, row.result, String(row.measured), String(row.retrieved),
          mm(row.mean), mm(row.median), mm(row.p95), mm(row.maximum), row.retrieved ? (row.measured / row.retrieved * 100).toFixed(0) + '%' : 'N/A']))}>Export sample CSV</Btn>
      <Btn disabled={selected === undefined} onClick={() => { setIsolated(selected); done('inspect'); setMessage('Isolated sample element ' + selected + ' in the preview.') }}>Show in 3D</Btn>
      <Btn onClick={close}>Close</Btn></>}>
    <div className="ad-card suite-flow-fields" data-demo="deviation-settings">
      <div className="ad-row">
        <label className="suite-flow-control">Point cloud <Select label="Point cloud" options={CLOUDS} value={cloud} onChange={value => { setCloud(value); configure() }} /></label>
        <label className="suite-flow-control">Tolerance (mm) <TextBox value={tolerance} inputMode="decimal" maxLength={18} onChange={event => { setTolerance(event.target.value); configure() }} /></label>
        <Btn primary demo="deviation-analyze" onClick={analyze}>Analyze</Btn>
      </div>
      <Expander header="Sampling and result metric">
        <div className="ad-row">
          <label className="suite-flow-control">Maximum points / element <TextBox inputMode="numeric" value={limit} maxLength={8} onChange={event => { setLimit(event.target.value); configure() }} /></label>
          <label className="suite-flow-control">Spacing (mm) <TextBox inputMode="decimal" value={spacing} maxLength={18} onChange={event => { setSpacing(event.target.value); configure() }} /></label>
          <label className="suite-flow-control">Evaluate <Select label="Evaluate" options={METRICS} value={metric} onChange={value => { setMetric(value); configure() }} /></label>
        </div>
      </Expander>
      {error && <p className="suite-flow-error" role="alert">{error}</p>}
    </div>
    {message && <p role="status">{message}</p>}
    {!!result.length && <>
      <section className="ad-card suite-flow-fields" data-demo="deviation-grid" aria-label="Deviation results">
        <div className="ad-row"><SearchBox placeholder="Filter sample results" value={query} onChange={setQuery} />
          {isolated && <Btn sm onClick={() => { setIsolated(undefined); setMessage('Showing all sampled elements.') }}>Show all</Btn>}</div>
        <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Deviation results table">
          <table className="ad-table"><thead><tr>{['Element ID', 'Category', 'Family and type', 'Level', 'Result', 'Samples', 'Avg deviation', 'Median', 'P95', 'Maximum', 'Projection yield', 'Sampling'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{shown.map(row => <tr key={row.id} className={selected === row.id ? 'sel' : undefined}>
              <td><Radio name={id + '-element'} label={String(row.id)} checked={selected === row.id} onChange={() => setSelected(row.id)} /></td>
              <td>{row.category}</td><td>{row.name}</td><td>{row.level}</td><td>{row.result}</td><td>{row.measured}</td>
              <td>{mm(row.mean)}</td><td>{mm(row.median)}</td><td>{mm(row.p95)}</td><td>{mm(row.maximum)}</td>
              <td>{row.retrieved ? Math.round(row.measured / row.retrieved * 100) + '%' : 'N/A'}</td>
              <td>{row.cap ? 'At sample cap' : row.measured ? row.measured + ' valid projections' : 'No valid projections'}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className="ad-note">Projection yield counts valid projections among retrieved points. It does not measure spatial coverage.</p>
      </section>
      <MiniView variant="coord" kind={isolated ? '3d' : 'plan'} phase="after" actionKey={analysis} title={isolated ? 'Sample isolated element' : 'Sample heatmap'}>
        {visual.map((row, index) => <g key={row.id} data-motion transform={'translate(' + (20 + index * 116) + ' 68)'}>
          <rect width="98" height="102" rx="5" fill={heatmap ? colours[row.result as keyof typeof colours] ?? 'var(--d-muted)' : 'var(--d-card)'}
            fillOpacity={heatmap ? '.28' : '.65'} stroke="var(--d-border-strong)" />
          <text x="9" y="34" fill="currentColor">{row.id}</text>
          <text x="9" y="58" fill="currentColor">{heatmap && row.result.length < 13 ? row.result : heatmap ? 'Unresolved' : 'Original'}</text>
        </g>)}
      </MiniView>
    </>}
  </DialogShell>
}
