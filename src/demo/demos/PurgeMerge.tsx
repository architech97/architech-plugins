import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Check, SearchBox, Select } from '../ui'
import { PURGE, PURGE_KINDS, type PurgeItem } from '../sample'
import { downloadCsv } from './craftedTools'
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
  const [review, setReview] = useState<'purge' | 'merge' | null>(null)
  const [survivor, setSurvivor] = useState('901')
  const [status, setStatus] = useState('Scan complete. Unused entries are shown; tick Used to see referenced ones.')

  const shown = useMemo(() => items.filter((i) => ((i.used && showUsed) || (!i.used && showUnused))
    && (kinds.size === 0 || kinds.has(i.tag))
    && (!q || `${i.name} ${i.info} ${i.detail} ${PURGE_KINDS[i.tag]}`.toLowerCase().includes(q.toLowerCase()))), [items, showUsed, showUnused, kinds, q])

  const selected = items.filter((item) => ticked.has(item.id))
  const deletable = selected.filter((item) => item.id !== 911)
  const duplicates = items.filter((item) => item.id === 901 || item.id === 902)
  const hidden = selected.filter((item) => !shown.includes(item)).length
  const purge = () => {
    const remove = new Set(deletable.map((item) => item.id))
    setItems(items.filter((item) => !remove.has(item.id)))
    setTicked(new Set())
    setReview(null)
    const message = 'Purged ' + remove.size + ' entries from the sample scan.'
    setStatus(message)
    notify({ kind: 'success', text: message })
    done('purge')
  }
  const merge = () => {
    const remove = duplicates.find((item) => String(item.id) !== survivor)
    if (!remove) return
    const referenced = duplicates.some((item) => item.used)
    setItems(items.filter((item) => item.id !== remove.id).map((item) => String(item.id) === survivor && referenced
      ? { ...item, used: true, detail: 'Used in 6 types' } : item))
    setTicked(new Set([...ticked].filter((id) => id !== remove.id)))
    setReview(null)
    const message = 'Merged the sample concrete material pair. Six type references point to the surviving material.'
    setStatus(message)
    notify({ kind: 'success', text: message })
  }
  const exportScan = () => {
    downloadCsv('purge-merge-sample.csv', ['Type', 'Name', 'Info', 'Detail', 'In use', 'Element ID'],
      items.map((item) => [PURGE_KINDS[item.tag], item.name, item.info, item.detail, item.used ? 'Yes' : 'No', item.id + 120000]))
    notify({ kind: 'success', text: 'Downloaded the full sample scan as CSV.' })
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="Purge & Merge" caption={`${items.length} entries scanned · ${items.filter((i) => !i.used).length} unused`} onClose={close}
      footer={<>
        <span className="ad-status">{status}</span>
        {review ? <>
          <Btn onClick={() => setReview(null)}>Cancel</Btn>
          {review === 'purge'
            ? <Btn primary disabled={!deletable.length} onClick={purge}>Confirm sample purge</Btn>
            : <Btn primary onClick={merge}>Merge sample pair</Btn>}
        </> : <>
          <Btn demo="select-visible" onClick={() => { const next = new Set(ticked); shown.forEach((item) => next.add(item.id)); setTicked(next); if (next.size) done('select') }}>Select all visible</Btn>
          <Btn onClick={() => setTicked(new Set())}>Clear</Btn>
          <Btn onClick={exportScan}>Download sample CSV</Btn>
          <Btn disabled={duplicates.length !== 2 || (kinds.size > 0 && !kinds.has('MAT'))} onClick={() => setReview('merge')}>Merge duplicates...</Btn>
          <Btn primary demo="purge" disabled={!ticked.size} onClick={() => setReview('purge')}>Purge selected</Btn>
          <Btn onClick={close}>Close</Btn>
        </>}

      </>}>
      {review === 'purge' && <div className="ad-result" role="status">
        <strong>Review sample purge</strong>
        <p>{deletable.length} eligible entries · {selected.filter((item) => item.used).length} in use · {hidden} hidden by filters</p>
        {selected.some((item) => item.id === 911) && <p>The sample system line style &lt;Thin Lines&gt; is protected.</p>}
        {selected.map((item) => <div key={item.id}>{item.name}{item.used ? ' · In use' : ''}</div>)}
      </div>}
      {review === 'merge' && <div className="ad-result">
        <strong>Choose the surviving concrete material</strong>
        <p>The sample has six references to the original material. The merge redirects them before removing the duplicate.</p>
        <Select label="Surviving material" value={duplicates.find((item) => String(item.id) === survivor)?.name ?? ''} options={duplicates.map((item) => item.name)} onChange={(name) => setSurvivor(String(duplicates.find((item) => item.name === name)?.id))} />
      </div>}
      <div className="ad-row" style={{ display: review ? 'none' : undefined }}>
        <div style={{ position: 'relative' }}>
          <Btn sm onClick={() => setCatsOpen(!catsOpen)} aria-expanded={catsOpen}>{kinds.size ? `Categories (${kinds.size})` : 'Categories'} ▾</Btn>
          {catsOpen && (
            <div className="ad-card" style={{ position: 'absolute', zIndex: 3, top: 32, left: 0, width: 230, display: 'grid', gap: 4, boxShadow: '0 12px 30px rgba(0,0,0,.4)' }}>
              <span className="ad-label">Categories</span>
              {Object.entries(PURGE_KINDS).map(([tag, label]) => (
                <Check key={tag} label={`${label}`} checked={kinds.has(tag)} onChange={(v) => { const k = new Set(kinds); if (v) k.add(tag); else k.delete(tag); setKinds(k) }} />
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
      <div className="ad-table-wrap" style={{ maxHeight: 360, display: review ? 'none' : undefined }}>
        <table className="ad-table">
          <thead><tr><th>Sel</th><th>Type</th><th>Name</th><th>Info</th><th>Detail</th><th>In Use</th><th>ID</th></tr></thead>
          <tbody>
            {shown.map((i) => (
              <tr key={i.id} className={ticked.has(i.id) ? 'sel' : ''} onClick={() => { const t = new Set(ticked); if (t.has(i.id)) t.delete(i.id); else t.add(i.id); setTicked(t); if (t.size) done('select') }}>
                <td onClick={(e) => e.stopPropagation()}><Check checked={ticked.has(i.id)} onChange={(v) => { const t = new Set(ticked); if (v) t.add(i.id); else t.delete(i.id); setTicked(t); if (t.size) done('select') }} title={`Include ${i.name} in Purge selected`} /></td>
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
