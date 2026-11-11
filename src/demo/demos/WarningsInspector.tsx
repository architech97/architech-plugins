import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Select, SearchBox } from '../ui'
import { WARNINGS, type Severity } from '../sample'
import { downloadCsv } from './craftedTools'
import type { DemoContext } from '../types'

// Simulation of Arch Sentinel > Model Health > Warnings Inspector. Tiles, filters, columns, sort
// options and the review panel follow the shipping dialog. Warning texts are Revit's own messages;
// the counts and element IDs are sample values.
const RANK: Record<Severity, number> = { Critical: 0, Warning: 1, Info: 2 }
const FAILURE_DEFINITIONS: Partial<Record<number, string>> = {
  1: 'OverlapFailures.DuplicateInstances',
  2: 'OverlapFailures.WallsOverlap',
  3: 'RoomFailures.RoomNotEnclosed',
  6: 'OverlapFailures.RoomSeparationLinesOverlap',
  7: 'InaccurateFailures.InaccurateLine',
  8: 'InaccurateFailures.InaccurateWall',
}
const classification = (id: number) => FAILURE_DEFINITIONS[id]
  ? 'Native failure definition (sample mapping)'
  : id === 9 ? 'Description fallback, review required' : 'Unmapped native warning, review required'

export default function WarningsInspector({ theme, setTheme, done, notify, close }: DemoContext) {
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('All')
  const [sort, setSort] = useState('Priority first')
  const [selected, setSelected] = useState<number | null>(null)
  const [isolated, setIsolated] = useState<number[]>([])
  const [stale, setStale] = useState(false)
  const [status, setStatus] = useState('Modeless review - keep working in Revit')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let r = WARNINGS.filter((w) => (severity === 'All' || w.severity.toUpperCase() === severity)
      && (!q || (/^\d+$/.test(q) ? w.elements.some((id) => String(id) === q) : w.description.toLowerCase().includes(q))))
    r = [...r].sort((a, b) => sort === 'Most frequent' ? b.count - a.count || RANK[a.severity] - RANK[b.severity]
      : sort === 'Description' ? a.description.localeCompare(b.description)
        : RANK[a.severity] - RANK[b.severity] || b.count - a.count)
    return r
  }, [query, severity, sort])

  const total = WARNINGS.reduce((n, w) => n + w.count, 0)
  const critical = WARNINGS.filter((w) => w.severity === 'Critical').reduce((n, w) => n + w.count, 0)
  const unique = new Set(WARNINGS.flatMap((w) => w.elements)).size
  const sel = rows.find((w) => w.id === selected) ?? rows[0]
  const sevClass = (s: Severity) => (s === 'Critical' ? 'err' : s === 'Warning' ? 'warn' : 'info')

  return (
    <RevitDialog theme={theme} onTheme={setTheme} eyebrow="Arch Sentinel / Model Health" title="Warnings Inspector" caption="Sample Residence.rvt | Modeless review - keep working in Revit" onClose={close}
      footer={<>
        <span className="ad-status">{status}</span>
        <Btn disabled={!isolated.length} onClick={() => { setIsolated([]); setStatus('Temporary isolation cleared in the sample view.') }}>Reset isolation</Btn>
        <Btn demo="export" disabled={stale} onClick={() => {
          downloadCsv('warnings-inspector-sample.csv', ['Severity', 'Description', 'Warning count', 'Affected element IDs', 'Sample failure definition', 'Classification source'],
            WARNINGS.map((group) => [group.severity, group.description, group.count, group.elements.join(' '), FAILURE_DEFINITIONS[group.id] ?? '', classification(group.id)]))
          notify({ kind: 'success', text: 'Downloaded all ' + WARNINGS.length + ' sample warning groups, including groups hidden by filters.' })
          done('export')
        }}>Download all sample warnings (CSV)</Btn>
        <Btn onClick={close}>Close</Btn>
      </>}>
      <div className="ad-stats">
        <div className="ad-stat"><span className="ad-label">Total warnings</span><b>{total}</b></div>
        <div className="ad-stat"><span className="ad-label">Critical class</span><b style={{ color: 'var(--d-error)' }}>{critical}</b></div>
        <div className="ad-stat"><span className="ad-label">Warning types</span><b>{WARNINGS.length}</b></div>
        <div className="ad-stat"><span className="ad-label">Unique affected elements</span><b>{unique}</b></div>
      </div>
      <div className="ad-row" style={{ alignItems: 'flex-end' }}>
        <label style={{ display: 'grid', gap: 4, flex: '1 1 260px' }}><span className="ad-note">Search warnings or element ID</span>
          <SearchBox value={query} onChange={(v) => { setQuery(v); if (/^\d{5,}$/.test(v.trim()) && WARNINGS.some((w) => w.elements.some((id) => String(id) === v.trim()))) done('search') }} placeholder="Description or element ID" demo="search" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}><span className="ad-note">Severity class</span>
          <Select label="Severity class" value={severity} onChange={(v) => { setSeverity(v); if (v === 'CRITICAL') done('filter') }} options={['All', 'CRITICAL', 'WARNING', 'INFO']} width={150} demo="severity" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}><span className="ad-note">Sort by</span>
          <Select label="Sort by" value={sort} onChange={setSort} options={['Priority first', 'Most frequent', 'Description']} width={140} />
        </label>
        <Btn onClick={() => { setQuery(''); setSeverity('All') }}>Clear filters</Btn>
        <Btn onClick={() => { setStale(false); setSelected(null); setStatus('Refreshed ' + WARNINGS.length + ' warning groups in the sample model.'); notify({ kind: 'info', text: 'Sample scan refreshed. Filters are retained.' }) }}>Refresh scan</Btn>
      </div>
      <span className="ad-note">{rows.length} of {WARNINGS.length} warning types, {rows.reduce((count, row) => count + row.count, 0)} occurrences in this view</span>
      <div className="ad-grid2 crafted-layout" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', alignItems: 'stretch' }}>
        <div className="ad-table-wrap" style={{ maxHeight: 290 }} data-demo="grid">
          <table className="ad-table">
            <thead><tr><th>Severity</th><th>Warning description</th><th>Warnings</th><th>Elements</th></tr></thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className={sel?.id === w.id ? 'sel' : ''} onClick={() => { setSelected(w.id); done('pick') }}>
                  <td><span className={`ad-pill ${sevClass(w.severity)}`}>{w.severity}</span></td>
                  <td className="wrap" style={{ minWidth: 220 }}><button className="crafted-row-action" type="button" onClick={() => { setSelected(w.id); done('pick') }}>{w.description}</button></td>
                  <td className="num">{w.count}</td><td className="num">{w.elements.length}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} style={{ padding: 18 }}><div className="ad-h">No warnings match</div><div className="ad-note">Clear the search or the severity filter.</div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ad-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="ad-label">Review selected warning</span>
          {sel ? <>
            <span className={`ad-pill ${sevClass(sel.severity)}`} style={{ alignSelf: 'flex-start' }}>{sel.severity}</span>
            <span style={{ color: 'var(--d-text)' }}>{sel.description}</span>
            <span className="ad-note">{sel.count} warnings, {sel.elements.length} unique elements</span>
            <span className="ad-note">{classification(sel.id)}{FAILURE_DEFINITIONS[sel.id] ? ', ' + FAILURE_DEFINITIONS[sel.id] : ''}</span>
            <span className="ad-label">Affected element IDs</span>
            <textarea readOnly className="ad-input" style={{ height: 64, padding: 8, resize: 'none' }} value={sel.elements.join(', ')} aria-label="Affected element IDs" />
            <span className="ad-note">Review the geometry and design intent before making a correction. Known warnings use native failure IDs. Fallback classifications are marked for review.</span>
            <Btn demo="isolate" disabled={stale} onClick={() => { setIsolated(sel.elements); setStatus(`${sel.elements.length} elements isolated in the active view (temporary).`); notify({ kind: 'success', text: `Isolated ${sel.elements.length} affected elements in the active view (temporary hide/isolate).` }); done('isolate') }}>Isolate affected elements</Btn>
            <Btn disabled={stale} onClick={() => notify({ kind: 'info', text: `Selected ${sel.elements.length} elements in the sample view.` })}>Select in Revit</Btn>
          </> : <span className="ad-note">Pick a warning group to read its full description and affected elements.</span>}
        </div>
      </div>
      <div className="ad-row">
        <span className="ad-note">Browser exercise, the native report exports an XLSX workbook</span>
        <Btn sm disabled={stale} onClick={() => {
          setStale(true)
          setStatus('Model changed after this sample scan. Refresh before selecting, isolating or exporting results.')
          notify({ kind: 'warning', text: 'Sample scan marked stale. Refresh scan to restore the result actions.' })
        }}>Simulate a model edit</Btn>
      </div>
    </RevitDialog>
  )
}
