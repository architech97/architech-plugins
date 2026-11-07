import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Check, SearchBox, Progress } from '../ui'
import { PURGE, PURGE_KINDS, type PurgeItem } from '../sample'
import type { DemoContext } from '../types'

// Simulation of Arch Sentinel > Clean Up > Purge and Merge. Columns, Show filters, type tags and
// footer actions follow the shipping dialog; entries are sample content.
export default function PurgeMerge({ theme, setTheme, done, notify, close }: DemoContext) {
  const [items, setItems] = useState<PurgeItem[]>(PURGE)
  const [showUnused, setShowUnused] = useState(true)
  const [showUsed, setShowUsed] = useState(false)
  const [kinds, setKinds] = useState<Set<string>>(new Set())
  const [catsOpen, setCatsOpen] = useState(false)
  const [q, setQ] = useState('')
  const [ticked, setTicked] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(0)
  const [status, setStatus] = useState('Scan complete. Unused entries are shown; tick Used to see referenced ones.')

  const shown = useMemo(() => items.filter((i) => ((i.used && showUsed) || (!i.used && showUnused))
    && (kinds.size === 0 || kinds.has(i.tag))
    && (!q || `${i.name} ${i.info} ${i.detail} ${PURGE_KINDS[i.tag]}`.toLowerCase().includes(q.toLowerCase()))), [items, showUsed, showUnused, kinds, q])

  const purge = () => {
    const n = ticked.size
    const usedTicked = items.filter((i) => ticked.has(i.id) && i.used).length
    setBusy(1)
    let p = 0
    const t = window.setInterval(() => {
      p += 20; setBusy(p)
      if (p >= 100) {
        window.clearInterval(t)
        setItems((all) => all.filter((i) => !ticked.has(i.id)))
        setTicked(new Set()); setBusy(0)
        setStatus(`Purged ${n} entries in one undoable step.`)
        notify({ kind: 'success', text: `Purged ${n} entries in one undoable step (simulated). Ctrl+Z in Revit restores them.` })
        if (usedTicked) notify({ kind: 'warning', text: `${usedTicked} of them were in use: deleting a used entry removes it from the model.` })
        done('purge')
      }
    }, 160)
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="Purge & Merge" caption={`${items.length} entries scanned · ${items.filter((i) => !i.used).length} unused`} onClose={close}
      footer={<>
        <span className="ad-status">{status}</span>
        <Btn demo="select-visible" onClick={() => { const t = new Set(ticked); shown.forEach((i) => t.add(i.id)); setTicked(t); if (t.size) done('select') }}>Select all visible</Btn>
        <Btn onClick={() => setTicked(new Set())}>Clear</Btn>
        <Btn onClick={() => notify({ kind: 'success', text: 'Exported every scanned entry to Documents\\Model Health Reports (simulated).' })}>Export to Excel</Btn>
        <Btn onClick={() => notify({ kind: 'info', text: 'Merge duplicates rescans the ticked categories for duplicate names: pick the survivor and every reference is redirected before the rest are deleted.' })}>Merge duplicates...</Btn>
        <Btn primary demo="purge" disabled={ticked.size === 0 || busy > 0} onClick={purge}>Purge selected</Btn>
        <Btn onClick={close}>Close</Btn>
      </>}>
      <div className="ad-row">
        <div style={{ position: 'relative' }}>
          <Btn sm onClick={() => setCatsOpen(!catsOpen)} aria-expanded={catsOpen}>{kinds.size ? `Categories (${kinds.size})` : 'Categories'} ▾</Btn>
          {catsOpen && (
            <div className="ad-card" style={{ position: 'absolute', zIndex: 3, top: 32, left: 0, width: 230, display: 'grid', gap: 4, boxShadow: '0 12px 30px rgba(0,0,0,.4)' }}>
              <span className="ad-label">Categories</span>
              {Object.entries(PURGE_KINDS).map(([tag, label]) => (
                <Check key={tag} label={`${label}`} checked={kinds.has(tag)} onChange={(v) => { const k = new Set(kinds); v ? k.add(tag) : k.delete(tag); setKinds(k) }} />
              ))}
              <div className="ad-row" style={{ marginTop: 4 }}><Btn sm onClick={() => setKinds(new Set(Object.keys(PURGE_KINDS)))}>Select all</Btn><Btn sm onClick={() => setKinds(new Set())}>Clear</Btn></div>
            </div>
          )}
        </div>
        <span className="ad-note">Show:</span>
        <Check label="Unused" checked={showUnused} onChange={setShowUnused} />
        <Check label="Used" checked={showUsed} onChange={(v) => { setShowUsed(v); done('scan') }} demo="show-used" />
        <SearchBox value={q} onChange={(v) => { setQ(v); if (/import/i.test(v)) done('search') }} placeholder="Search items..." width={220} demo="search" />
        <span className="ad-note" style={{ marginLeft: 'auto' }}>{shown.length} shown · {ticked.size} ticked</span>
      </div>
      {busy > 0 && <Progress value={busy} />}
      <div className="ad-table-wrap" style={{ maxHeight: 360 }}>
        <table className="ad-table">
          <thead><tr><th>Sel</th><th>Type</th><th>Name</th><th>Info</th><th>Detail</th><th>In Use</th><th>ID</th></tr></thead>
          <tbody>
            {shown.map((i) => (
              <tr key={i.id} className={ticked.has(i.id) ? 'sel' : ''} onClick={() => { const t = new Set(ticked); t.has(i.id) ? t.delete(i.id) : t.add(i.id); setTicked(t); if (t.size) done('select') }}>
                <td onClick={(e) => e.stopPropagation()}><Check checked={ticked.has(i.id)} onChange={(v) => { const t = new Set(ticked); v ? t.add(i.id) : t.delete(i.id); setTicked(t); if (t.size) done('select') }} title={`Include ${i.name} in Purge selected`} /></td>
                <td><span className="ad-pill info" title={PURGE_KINDS[i.tag]}>{i.tag}</span></td>
                <td>{i.name}</td><td>{i.info}</td><td>{i.detail}</td>
                <td>{i.used ? <span className="ad-pill warn">Used</span> : <span className="ad-pill ok">Unused</span>}</td>
                <td className="num">{i.id + 120000}</td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7} style={{ padding: 16 }} className="ad-note">Nothing matches the filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </RevitDialog>
  )
}
