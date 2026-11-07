import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Select, SearchBox } from '../ui'
import { WARNINGS, type Severity } from '../sample'
import type { DemoContext } from '../types'

// Simulation of Arch Sentinel > Model Health > Warnings Inspector. Tiles, filters, columns, sort
// options and the review panel follow the shipping dialog. Warning texts are Revit's own messages;
// the counts and element IDs are sample values.
const RANK: Record<Severity, number> = { Critical: 0, Warning: 1, Info: 2 }

export default function WarningsInspector({ theme, setTheme, done, notify, close }: DemoContext) {
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('All severities')
  const [sort, setSort] = useState('Priority first')
  const [selected, setSelected] = useState<number | null>(null)
  const [status, setStatus] = useState('Modeless review - keep working in Revit')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let r = WARNINGS.filter((w) => (severity === 'All severities' || w.severity === severity)
      && (!q || w.description.toLowerCase().includes(q) || w.elements.some((id) => String(id).includes(q))))
    r = [...r].sort((a, b) => sort === 'Most frequent' ? b.count - a.count || RANK[a.severity] - RANK[b.severity]
      : sort === 'Description' ? a.description.localeCompare(b.description)
        : RANK[a.severity] - RANK[b.severity] || b.count - a.count)
    return r
  }, [query, severity, sort])

  const total = WARNINGS.reduce((n, w) => n + w.count, 0)
  const critical = WARNINGS.filter((w) => w.severity === 'Critical').reduce((n, w) => n + w.count, 0)
  const unique = new Set(WARNINGS.flatMap((w) => w.elements)).size
  const sel = WARNINGS.find((w) => w.id === selected)
  const sevClass = (s: Severity) => (s === 'Critical' ? 'err' : s === 'Warning' ? 'warn' : 'info')

  return (
    <RevitDialog theme={theme} onTheme={setTheme} eyebrow="Arch Sentinel / Model Health" title="Warnings Inspector" caption="Sample Residence.rvt | Modeless review - keep working in Revit" onClose={close}
      footer={<>
        <span className="ad-status">{status}</span>
        <Btn onClick={() => { setStatus('Temporary hide/isolate cleared in the active view.'); notify({ kind: 'info', text: 'Reset isolation: the temporary hide/isolate in the active view is cleared.' }) }}>Reset isolation</Btn>
        <Btn demo="export" onClick={() => { notify({ kind: 'success', text: `Exported ${WARNINGS.length} warning groups (${total} warnings) to a two-sheet .xlsx, including groups hidden by filters. Excel is not required.` }); done('export') }}>Export all warnings (.xlsx)</Btn>
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
          <Select label="Severity class" value={severity} onChange={(v) => { setSeverity(v); setSelected(null); if (v === 'Critical') done('filter') }} options={['All severities', 'Critical', 'Warning', 'Info']} width={150} demo="severity" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}><span className="ad-note">Sort by</span>
          <Select label="Sort by" value={sort} onChange={setSort} options={['Priority first', 'Most frequent', 'Description']} width={140} />
        </label>
        <Btn onClick={() => { setQuery(''); setSeverity('All severities') }}>Clear filters</Btn>
        <Btn onClick={() => notify({ kind: 'info', text: 'Refresh scan: read the current warnings from the model again.' })}>Refresh scan</Btn>
      </div>
      <span className="ad-note">{rows.length} of {WARNINGS.length} warning groups shown</span>
      <div className="ad-grid2" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', alignItems: 'stretch' }}>
        <div className="ad-table-wrap" style={{ maxHeight: 290 }} data-demo="grid">
          <table className="ad-table">
            <thead><tr><th>Severity</th><th>Warning description</th><th>Warnings</th><th>Elements</th></tr></thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className={selected === w.id ? 'sel' : ''} onClick={() => { setSelected(w.id); done('pick') }}>
                  <td><span className={`ad-pill ${sevClass(w.severity)}`}>{w.severity}</span></td>
                  <td className="wrap" style={{ minWidth: 220 }}>{w.description}</td>
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
            <span className="ad-note">{sel.count} warnings · {sel.elements.length} elements</span>
            <span className="ad-label">Affected element IDs</span>
            <textarea readOnly className="ad-input" style={{ height: 64, padding: 8, resize: 'none' }} value={sel.elements.join(', ')} aria-label="Affected element IDs" />
            <span className="ad-note">Review the geometry and design intent before making a correction. Known warnings use native failure IDs. Fallback classifications are marked for review.</span>
            <Btn demo="isolate" onClick={() => { setStatus(`${sel.elements.length} elements isolated in the active view (temporary).`); notify({ kind: 'success', text: `Isolated ${sel.elements.length} affected elements in the active view (temporary hide/isolate).` }); done('isolate') }}>Isolate affected elements</Btn>
            <Btn onClick={() => notify({ kind: 'info', text: `Selected ${sel.elements.length} elements in Revit.` })}>Select in Revit</Btn>
          </> : <span className="ad-note">Pick a warning group to read its full description and affected elements.</span>}
        </div>
      </div>
    </RevitDialog>
  )
}
