import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Check, Radio, Select, TextBox, SearchBox } from '../ui'
import './crafted.css'
import { ELEMENTS, PARAMS, PARAM_CATEGORIES } from '../sample'
import type { DemoContext } from '../types'

// Simulation of Arch Forge > Parameters > One Parameter. Replace in preview edits proposed values
// only; Apply Changes writes the ticked rows in one transaction. A type parameter is written once per type.
export default function OneParameter({ theme, setTheme, done, notify, close }: DemoContext) {
  const [scope, setScope] = useState<'model' | 'view'>('model')
  const [category, setCategory] = useState('')
  const [param, setParam] = useState('')
  const [psearch, setPsearch] = useState('')
  const [find, setFind] = useState(''), [replace, setReplace] = useState(''), [prefix, setPrefix] = useState(''), [suffix, setSuffix] = useState('')
  const [proposed, setProposed] = useState<Record<number, string>>({})
  const [ticked, setTicked] = useState<Set<number>>(new Set())
  const [values, setValues] = useState(() => Object.fromEntries(ELEMENTS.map((e) => [e.id, { ...e.values }])) as Record<number, Record<string, string>>)
  const [status, setStatus] = useState('Pick a category and a parameter to begin.')

  const rows = useMemo(() => ELEMENTS.filter((e) => e.category === category && (scope === 'model' || e.activeView === true)), [category, scope])
  const pdef = (PARAMS[category] ?? []).find((p) => p.name === param)
  const visibleParams = (PARAMS[category] ?? []).filter((p) => p.name.toLowerCase().includes(psearch.toLowerCase()))
  const current = (id: number) => values[id]?.[param] ?? ''
  const prop = (id: number) => proposed[id] ?? current(id)

  const typeKey = (element: typeof ELEMENTS[number]) => JSON.stringify([element.category, element.family, element.type])
  const pickCategory = (c: string) => { setCategory(c); setParam(''); setPsearch(''); setProposed({}); setTicked(new Set()); setStatus(c ? 'Pick a parameter.' : 'Pick a category and a parameter to begin.'); if (c) done('category') }
  const pickParam = (p: string) => {
    setParam(p); setProposed({}); setTicked(new Set(rows.map((r) => r.id)))
    setStatus(`${rows.length} elements · ${PARAMS[category].find((x) => x.name === p)?.isType ? 'type parameter: written once per type' : 'instance parameter'}`)
    done('param')
  }
  const replaceInPreview = () => {
    if (!find) return
    const next = { ...proposed }
    let count = 0
    for (const row of rows) {
      const before = prop(row.id)
      const after = before.replaceAll(find, () => replace)
      if (after !== before) { next[row.id] = after; count++ }
    }
    setProposed(next)
    notify({ kind: 'info', text: count + ' preview values edited. Apply Changes writes the selected rows.' })
    if (count) done('replace')
  }
  const addAffix = (which: 'prefix' | 'suffix') => {
    const affix = which === 'prefix' ? prefix : suffix
    if (!affix) return
    setProposed(Object.fromEntries(rows.map((row) => {
      const before = prop(row.id)
      return [row.id, which === 'prefix' ? affix + before : before + affix]
    })))
    if (rows.length) done('replace')
  }
  const changeScope = (next: 'model' | 'view') => {
    setScope(next)
    setProposed({})
    setTicked(new Set(ELEMENTS.filter((element) => element.category === category && (next === 'model' || element.activeView === true)).map((element) => element.id)))
    setStatus(next === 'model' ? 'Whole model sample scope.' : 'Active view scope: sample Ground Floor Plan.')
  }
  const changed = rows.filter((row) => ticked.has(row.id) && prop(row.id) !== current(row.id))
  const apply = () => {
    const requested = new Map<string | number, string>()
    const conflicts = new Set<string | number>()
    for (const row of changed) {
      const key = pdef?.isType ? typeKey(row) : row.id
      const value = prop(row.id)
      if (requested.has(key) && requested.get(key) !== value) conflicts.add(key)
      requested.set(key, value)
    }
    conflicts.forEach((key) => requested.delete(key))
    if (conflicts.size) {
      notify({ kind: 'warning', text: 'Skipped ' + conflicts.size + ' type(s) because checked rows requested different values.' })
    }
    if (requested.size === 0) {
      setStatus('Conflicting values. Set one proposed value per shared type.')
      return
    }
    setValues((existing) => Object.fromEntries(ELEMENTS.map((row) => {
      const value = requested.get(pdef?.isType ? typeKey(row) : row.id)
      return [row.id, value === undefined ? existing[row.id] : { ...existing[row.id], [param]: value }]
    })))
    setProposed((previous) => Object.fromEntries(rows.filter((row) => conflicts.has(typeKey(row))).map((row) => [row.id, previous[row.id]])))
    const message = 'Wrote ' + requested.size + (pdef?.isType ? ' type' : ' instance') + ' value(s) in one sample transaction.'
    setStatus(message)
    notify({ kind: 'success', text: message })
    done('apply')
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="One Parameter" onClose={close}
      footer={<>
        <span className="ad-status">{status}</span>
        <Btn onClick={close}>Close</Btn>
        <Btn primary demo="apply" disabled={changed.length === 0} onClick={apply}>Apply Changes</Btn>
      </>}>
      <div className="ad-grid2 crafted-layout" style={{ gridTemplateColumns: '220px minmax(0,1fr)', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="ad-label">Scope</span>
          <div className="ad-row"><Radio name="scope" label="Whole model" checked={scope === 'model'} onChange={() => changeScope('model')} /><Radio name="scope" label="Active view" checked={scope === 'view'} onChange={() => changeScope('view')} /></div>
          <span className="ad-label">Category</span>
          <Select label="Category" value={category || '—'} onChange={(v) => pickCategory(v === '—' ? '' : v)} options={['—', ...PARAM_CATEGORIES]} width="100%" demo="category" />
          <span className="ad-label">Parameter</span>
          <SearchBox value={psearch} onChange={setPsearch} placeholder="Search parameters…" />
          <div className="ad-list" style={{ minHeight: 170 }} data-demo="params" role="listbox" aria-label="Parameters">
            {!category && <span className="li">Pick a category first.</span>}
            {visibleParams.map((p) => (
              <button key={p.name} role="option" aria-selected={param === p.name} className="li" onClick={() => pickParam(p.name)}
                style={{ textAlign: 'left', border: 0, cursor: 'pointer', background: param === p.name ? 'var(--d-accent-soft)' : 'transparent', fontStyle: p.isType ? 'italic' : 'normal', color: 'var(--d-text-2)' }}>
                {p.name}{p.isType ? ' (type)' : ''}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <span className="ad-label">Edit values</span>
          <div className="ad-card crafted-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 3 }}><span className="ad-note">Find</span><TextBox value={find} onChange={(e) => setFind(e.target.value)} aria-label="Find" /></label>
            <label style={{ display: 'grid', gap: 3 }}><span className="ad-note">Replace with</span><TextBox value={replace} onChange={(e) => setReplace(e.target.value)} aria-label="Replace with" /></label>
            <Btn demo="replace" disabled={!param || !find} onClick={replaceInPreview}>Replace in preview</Btn>
            <label style={{ display: 'grid', gap: 3 }}><span className="ad-note">Prefix</span><span className="ad-row" style={{ flexWrap: 'nowrap' }}><TextBox value={prefix} onChange={(e) => setPrefix(e.target.value)} aria-label="Prefix" style={{ flex: 1 }} /><Btn sm disabled={!param} onClick={() => addAffix('prefix')}>Add</Btn></span></label>
            <label style={{ display: 'grid', gap: 3 }}><span className="ad-note">Suffix</span><span className="ad-row" style={{ flexWrap: 'nowrap' }}><TextBox value={suffix} onChange={(e) => setSuffix(e.target.value)} aria-label="Suffix" style={{ flex: 1 }} /><Btn sm disabled={!param} onClick={() => addAffix('suffix')}>Add</Btn></span></label>
          </div>
          <div className="ad-row" style={{ justifyContent: 'space-between' }}>
            <span className="ad-label">Preview</span>
            <span className="ad-row"><Btn sm onClick={() => setTicked(new Set(rows.map((r) => r.id)))}>Check all</Btn><Btn sm onClick={() => setTicked(new Set())}>Uncheck all</Btn></span>
          </div>
          <div className="ad-table-wrap" style={{ maxHeight: 250 }}>
            <table className="ad-table">
              <thead><tr><th /><th>Category</th><th>Family</th><th>Type</th><th>Current value</th><th>New value</th></tr></thead>
              <tbody>
                {param && rows.map((r) => (
                  <tr key={r.id} className={ticked.has(r.id) ? 'sel' : ''}>
                    <td><Check checked={ticked.has(r.id)} onChange={(v) => { const t = new Set(ticked); if (v) t.add(r.id); else t.delete(r.id); setTicked(t) }} title={`Write element ${r.id}`} /></td>
                    <td>{r.category}</td><td>{r.family}</td><td>{r.type}</td><td>{current(r.id) || '—'}</td>
                    <td className={prop(r.id) !== current(r.id) ? 'changed' : ''} style={{ padding: 3 }}>
                      <input className="ad-input" style={{ height: 26, width: '100%' }} value={prop(r.id)} aria-label={`New value for element ${r.id}`} onChange={(e) => { setProposed({ ...proposed, [r.id]: e.target.value }); if (e.target.value !== current(r.id)) done('replace') }} />
                    </td>
                  </tr>
                ))}
                {!param && <tr><td colSpan={6} className="ad-note" style={{ padding: 16 }}>Pick a category and a parameter to begin.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RevitDialog>
  )
}
