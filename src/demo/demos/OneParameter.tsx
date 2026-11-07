import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Check, Radio, Select, TextBox, SearchBox } from '../ui'
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

  const rows = useMemo(() => ELEMENTS.filter((e) => e.category === category && (scope === 'model' || e.id % 2 === 0)), [category, scope])
  const pdef = (PARAMS[category] ?? []).find((p) => p.name === param)
  const visibleParams = (PARAMS[category] ?? []).filter((p) => p.name.toLowerCase().includes(psearch.toLowerCase()))
  const current = (id: number) => values[id]?.[param] ?? ''
  const prop = (id: number) => proposed[id] ?? current(id)

  const pickCategory = (c: string) => { setCategory(c); setParam(''); setProposed({}); setTicked(new Set()); if (c) { done('category'); setStatus('Pick a parameter.') } }
  const pickParam = (p: string) => {
    setParam(p); setProposed({}); setTicked(new Set(rows.map((r) => r.id)))
    setStatus(`${rows.length} elements · ${PARAMS[category].find((x) => x.name === p)?.isType ? 'type parameter: written once per type' : 'instance parameter'}`)
    done('param')
  }
  const replaceInPreview = () => {
    if (!find) return
    const next = { ...proposed }
    rows.forEach((r) => { const v = prop(r.id); if (v.includes(find)) next[r.id] = v.split(find).join(replace) })
    setProposed(next)
    const n = rows.filter((r) => next[r.id] !== undefined && next[r.id] !== current(r.id)).length
    notify({ kind: 'info', text: `Replaced "${find}" in ${n} proposed values. Nothing is written until Apply Changes.` })
    if (n) done('replace')
  }
  const addAffix = (which: 'prefix' | 'suffix') => {
    const a = which === 'prefix' ? prefix : suffix
    if (!a) return
    const next = { ...proposed }
    rows.forEach((r) => { next[r.id] = which === 'prefix' ? a + prop(r.id) : prop(r.id) + a })
    setProposed(next)
  }
  const changed = rows.filter((r) => ticked.has(r.id) && prop(r.id) !== current(r.id))
  const apply = () => {
    const types = new Set(changed.map((r) => r.family + r.type))
    setValues((v) => { const n = { ...v }; changed.forEach((r) => { n[r.id] = { ...n[r.id], [param]: prop(r.id) } }); return n })
    setProposed({})
    const writes = pdef?.isType ? types.size : changed.length
    setStatus(`Wrote ${writes} value${writes === 1 ? '' : 's'} in one transaction.`)
    notify({ kind: 'success', text: `${param}: ${writes} ${pdef?.isType ? 'type' : 'element'} values written in one transaction (simulated).` })
    done('apply')
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="One Parameter" onClose={close}
      footer={<>
        <span className="ad-status">{status}</span>
        <Btn onClick={close}>Close</Btn>
        <Btn primary demo="apply" disabled={changed.length === 0} onClick={apply}>Apply Changes</Btn>
      </>}>
      <div className="ad-grid2" style={{ gridTemplateColumns: '220px minmax(0,1fr)', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="ad-label">Scope</span>
          <div className="ad-row"><Radio name="scope" label="Whole model" checked={scope === 'model'} onChange={() => setScope('model')} /><Radio name="scope" label="Active view" checked={scope === 'view'} onChange={() => setScope('view')} /></div>
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
          <div className="ad-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, alignItems: 'end' }}>
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
                    <td><Check checked={ticked.has(r.id)} onChange={(v) => { const t = new Set(ticked); v ? t.add(r.id) : t.delete(r.id); setTicked(t) }} title={`Write element ${r.id}`} /></td>
                    <td>{r.category}</td><td>{r.family}</td><td>{r.type}</td><td>{current(r.id) || '—'}</td>
                    <td className={prop(r.id) !== current(r.id) ? 'changed' : ''} style={{ padding: 3 }}>
                      <input className="ad-input" style={{ height: 26, width: '100%' }} value={prop(r.id)} aria-label={`New value for element ${r.id}`} onChange={(e) => setProposed({ ...proposed, [r.id]: e.target.value })} />
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
