import { useMemo, useState } from 'react'
import { RevitDialog, Btn, Check, Radio, Select, TextBox, SearchBox } from '../ui'
import { SHEETS, type Sheet } from '../sample'
import type { DemoContext } from '../types'

// Simulation of Arch Folio > Sheets > Sheet Manager. Section names, columns, labels and the
// rename rule (find/replace, then prefix + suffix; tokens {Number} {Name} {Revision} {Seq})
// follow the shipping tool. Nothing here talks to Revit.
const SECTIONS = [
  ['Create', 'Type or paste sheet numbers and names, then create real or placeholder sheets.'],
  ['Duplicate', 'Copy the ticked sheets, alone or with their views, as many times as needed.'],
  ['Renumber / Rename', "Find and replace, prefix, suffix and sequence the ticked sheets' numbers and names."],
  ['Set parameter', 'Write one value into a sheet or title block parameter on every ticked sheet.'],
  ['Revisions', 'Add revisions to the ticked sheets, or take them off.'],
  ['Place on sheet', 'Put views and schedules on sheets, existing or new, in a layout.'],
] as const
type Section = (typeof SECTIONS)[number][0]

interface Rule { find: string; replace: string; prefix: string; suffix: string }
const empty: Rule = { find: '', replace: '', prefix: '', suffix: '' }
const REVISIONS = [
  { seq: 1, number: 'P01', date: '12.09.2026', description: 'Planning submission', issued: true },
  { seq: 2, number: 'P02', date: '03.10.2026', description: 'Client comments', issued: false },
  { seq: 3, number: 'P03', date: '28.10.2026', description: 'Coordination update', issued: false },
]

function applyRule(r: Rule, value: string, s: Sheet, seq: string, ignoreCase: boolean) {
  const expand = (t: string) => t.replace(/\{(\w+)\}/g, (m, k: string) => ({ number: s.number, name: s.name, revision: s.revision, seq } as Record<string, string>)[k.toLowerCase()] ?? m)
  let v = value
  if (r.find) v = v.replace(new RegExp(r.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ignoreCase ? 'gi' : 'g'), expand(r.replace))
  return (expand(r.prefix) + v + expand(r.suffix)).trim()
}

export default function SheetManager({ theme, setTheme, done, notify, close }: DemoContext) {
  const [sheets, setSheets] = useState<Sheet[]>(SHEETS)
  const [ticked, setTicked] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('All sheets')
  const [tickedOnly, setTickedOnly] = useState(false)
  const [section, setSection] = useState<Section>('Create')
  const [num, setNum] = useState<Rule>(empty)
  const [name, setName] = useState<Rule>(empty)
  const [seq, setSeq] = useState({ start: '1', step: '1', pad: '0' })
  const [ignoreCase, setIgnoreCase] = useState(false)
  const [result, setResult] = useState('')
  // Create / Duplicate / Parameter / Revisions state
  const [createRows, setCreateRows] = useState([{ number: 'A-104', name: 'Site Plan' }, { number: 'A-502', name: 'Bathroom Interior Elevations' }])
  const [createReal, setCreateReal] = useState(true)
  const [dupMode, setDupMode] = useState('Sheet only')
  const [copies, setCopies] = useState('1')
  const [dupSuffix, setDupSuffix] = useState('-COPY')
  const [param, setParam] = useState('Appears In Sheet List')
  const [paramValue, setParamValue] = useState('No')
  const [revTicked, setRevTicked] = useState<Set<number>>(new Set([3]))
  const [revAdd, setRevAdd] = useState(true)

  const shown = useMemo(() => sheets.filter((s) => {
    const q = search.trim().toLowerCase()
    if (q && !`${s.number} ${s.name} ${s.titleBlock} ${s.revision}`.toLowerCase().includes(q)) return false
    if (kind === 'Sheets' && s.placeholder) return false
    if (kind === 'Placeholders' && !s.placeholder) return false
    if (tickedOnly && !ticked.has(s.id)) return false
    return true
  }), [sheets, search, kind, tickedOnly, ticked])

  const tickedList = sheets.filter((s) => ticked.has(s.id))
  const plan = useMemo(() => {
    const start = parseInt(seq.start) || 0, step = parseInt(seq.step) || 1, pad = Math.min(6, parseInt(seq.pad) || 0)
    const changing = new Set(tickedList.map((s) => s.id))
    const taken = new Set(sheets.filter((s) => !changing.has(s.id)).map((s) => s.number.toLowerCase()))
    const planned: { sheet: Sheet; number: string; name: string; skip?: string }[] = []
    tickedList.forEach((s, i) => {
      const sq = String(start + i * step).padStart(pad, '0')
      const n = applyRule(num, s.number, s, sq, ignoreCase), nm = applyRule(name, s.name, s, sq, ignoreCase)
      let skip: string | undefined
      if (n !== s.number && taken.has(n.toLowerCase())) skip = `${n} is already in use`
      else if (planned.some((p) => p.number.toLowerCase() === n.toLowerCase())) skip = `${n} is planned twice`
      if (!skip) taken.add(n.toLowerCase())
      planned.push({ sheet: s, number: n, name: nm, skip })
    })
    return planned
  }, [tickedList, num, name, seq, ignoreCase, sheets])
  const changes = plan.filter((p) => !p.skip && (p.number !== p.sheet.number || p.name !== p.sheet.name))

  const toggle = (id: number, v: boolean) => {
    const t = new Set(ticked); v ? t.add(id) : t.delete(id); setTicked(t)
    if (t.size >= 2) done('tick')
  }
  const tickShown = () => { const t = new Set(ticked); shown.forEach((s) => t.add(s.id)); setTicked(t); if (t.size >= 2) done('tick') }
  const setRule = (which: 'num' | 'name', k: keyof Rule, v: string) => {
    (which === 'num' ? setNum : setName)((r) => ({ ...r, [k]: v }))
    if (which === 'num' && (k === 'find' || k === 'prefix' || k === 'replace') && v) { done('rule'); window.setTimeout(() => done('preview'), 1400) }
  }

  const runLabel = (() => {
    const n = tickedList.length
    switch (section) {
      case 'Create': return `Create ${createRows.filter((r) => r.number).length} sheets`
      case 'Duplicate': return `Duplicate ${n} sheet${n === 1 ? '' : 's'}${+copies > 1 ? ` ×${copies}` : ''}`
      case 'Renumber / Rename': return `Renumber / rename ${changes.length} sheet${changes.length === 1 ? '' : 's'}`
      case 'Set parameter': return `Set on ${n} sheet${n === 1 ? '' : 's'}`
      case 'Revisions': return `${revAdd ? 'Add to' : 'Remove from'} ${n} sheet${n === 1 ? '' : 's'}`
      default: return 'Place selected views'
    }
  })()
  const canRun = section === 'Create' ? createRows.some((r) => r.number) : section === 'Renumber / Rename' ? changes.length > 0 : section === 'Place on sheet' ? false : tickedList.length > 0

  const run = () => {
    if (section === 'Renumber / Rename') {
      const byId = new Map(changes.map((p) => [p.sheet.id, p]))
      setSheets((all) => all.map((s) => (byId.has(s.id) ? { ...s, number: byId.get(s.id)!.number, name: byId.get(s.id)!.name } : s)))
      const skipped = plan.filter((p) => p.skip)
      setResult(`Renumbered or renamed ${changes.length} of ${plan.length} sheets${skipped.length ? ` · ${skipped.length} skipped` : ''}`)
      notify({ kind: 'success', text: `Renumbered or renamed ${changes.length} sheets. In Revit this is one Undo step.` })
      skipped.forEach((p) => notify({ kind: 'warning', text: `${p.sheet.number} skipped: ${p.skip}` }))
      setNum(empty); setName(empty); done('run')
    } else if (section === 'Create') {
      const rows = createRows.filter((r) => r.number)
      setSheets((all) => [...all, ...rows.map((r, i) => ({ id: 500 + all.length + i, number: r.number, name: r.name, titleBlock: createReal ? 'A1 Landscape' : '—', revision: '—', views: 0, inSheetList: true, placeholder: !createReal }))])
      setResult(`Created ${rows.length} ${createReal ? 'sheets' : 'placeholder sheets'}`)
      notify({ kind: 'success', text: `Created ${rows.length} ${createReal ? 'sheets with the A1 Landscape title block' : 'placeholder sheets'} (simulated).` })
    } else if (section === 'Duplicate') {
      const c = +copies
      const add: Sheet[] = []
      tickedList.forEach((s) => { for (let i = 1; i <= c; i++) add.push({ ...s, id: 700 + add.length + sheets.length, number: s.number + dupSuffix + (c > 1 ? i : ''), views: dupMode === 'Sheet only' ? 0 : s.views }) })
      setSheets((all) => [...all, ...add])
      setResult(`Duplicated ${tickedList.length} sheets into ${add.length} new sheets`)
      notify({ kind: 'success', text: `${add.length} new sheets (${dupMode.toLowerCase()}). One Undo reverses the whole run.` })
    } else if (section === 'Set parameter') {
      if (param === 'Appears In Sheet List') setSheets((all) => all.map((s) => (ticked.has(s.id) ? { ...s, inSheetList: paramValue === 'Yes' } : s)))
      setResult(`Set ${param} on ${tickedList.length} sheets`)
      notify({ kind: 'success', text: `${param} = ${paramValue} on ${tickedList.length} sheets.` })
    } else if (section === 'Revisions') {
      const rev = REVISIONS.filter((r) => revTicked.has(r.seq)).map((r) => r.number)
      setResult(`${revAdd ? 'Added' : 'Removed'} ${rev.join(', ') || 'no revisions'} on ${tickedList.length} sheets`)
      notify({ kind: 'success', text: `${revAdd ? 'Added' : 'Removed'} ${rev.join(', ')} ${revAdd ? 'to' : 'from'} ${tickedList.length} sheets' Revisions on Sheet.` })
    }
  }

  const ruleBox = (which: 'num' | 'name') => {
    const r = which === 'num' ? num : name
    return (['find', 'replace', 'prefix', 'suffix'] as const).map((k) => (
      <TextBox key={k} value={r[k]} aria-label={`${which === 'num' ? 'Number' : 'Name'} ${k}`} onChange={(e) => setRule(which, k, e.target.value)} demo={`${which}-${k}`} />
    ))
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="Sheet Manager" caption="Sample Residence · 12 sheets and placeholders" onClose={close}
      footer={<>
        <span className="ad-status">{result || (tickedList.length ? `${tickedList.length} ticked` : 'Tick the sheets to work on.')}</span>
        <Btn onClick={close}>Close</Btn>
        <Btn primary disabled={!canRun} onClick={run} demo="run">{runLabel}</Btn>
      </>}>
      <div className="ad-split" style={{ margin: '-16px -20px', minHeight: 540 }}>
        <nav className="ad-nav" aria-label="Sheet Manager sections">
          <span className="ad-label" style={{ padding: '2px 10px 8px' }}>Tools</span>
          {SECTIONS.map(([s]) => (
            <button key={s} className={s === section ? 'on' : ''} data-demo={`nav:${s}`} onClick={() => { setSection(s); if (s === 'Renumber / Rename') done('section') }}>{s}</button>
          ))}
        </nav>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div className="ad-row" style={{ justifyContent: 'space-between' }}>
            <div><div className="ad-h">{section}</div><div className="ad-note">{SECTIONS.find(([s]) => s === section)![1]}</div></div>
            <Btn sm onClick={() => notify({ kind: 'info', text: 'Read the model again (ticks are kept).' })}>Refresh</Btn>
          </div>
          <div className="ad-row">
            <SearchBox value={search} onChange={setSearch} placeholder="Search sheet number, name, title block or revision..." width={300} demo="search" />
            <Select label="Sheet kind" value={kind} onChange={setKind} options={['All sheets', 'Sheets', 'Placeholders']} width={130} />
            <Btn sm onClick={() => setTickedOnly(!tickedOnly)} style={tickedOnly ? { borderColor: 'var(--d-accent)' } : undefined}>Ticked only</Btn>
            <Btn sm onClick={tickShown} demo="tick-shown">Tick shown</Btn>
            <Btn sm onClick={() => setTicked(new Set())}>Clear ticks</Btn>
          </div>
          <div className="ad-table-wrap" style={{ maxHeight: 210 }}>
            <table className="ad-table">
              <thead><tr>
                <th style={{ width: 34 }}><Check checked={shown.length > 0 && shown.every((s) => ticked.has(s.id))} onChange={(v) => { const t = new Set(ticked); shown.forEach((s) => (v ? t.add(s.id) : t.delete(s.id))); setTicked(t); if (t.size >= 2) done('tick') }} title="Tick / untick the rows shown" /></th>
                <th>Number</th><th>Name</th>
                {section === 'Renumber / Rename' && <><th>New number</th><th>New name</th></>}
                <th>Title block</th><th>Current revision</th><th>Views</th><th>In sheet list</th><th>Placeholder</th>
              </tr></thead>
              <tbody>
                {shown.map((s) => {
                  const p = plan.find((x) => x.sheet.id === s.id)
                  return (
                    <tr key={s.id} className={ticked.has(s.id) ? 'sel' : ''} onClick={() => toggle(s.id, !ticked.has(s.id))}>
                      <td onClick={(e) => e.stopPropagation()}><Check checked={ticked.has(s.id)} onChange={(v) => toggle(s.id, v)} title={`Tick ${s.number}`} /></td>
                      <td className="num">{s.number}</td><td>{s.name}</td>
                      {section === 'Renumber / Rename' && <><td className={p && p.number !== s.number ? 'changed' : ''}>{p && p.number !== s.number ? p.number : ''}</td><td className={p && p.name !== s.name ? 'changed' : ''}>{p && p.name !== s.name ? p.name : ''}</td></>}
                      <td>{s.titleBlock}</td><td>{s.revision}</td><td className="num">{s.views}</td><td>{s.inSheetList ? 'Yes' : 'No'}</td><td>{s.placeholder ? 'Yes' : 'No'}</td>
                    </tr>
                  )
                })}
                {shown.length === 0 && <tr><td colSpan={10} className="ad-note" style={{ padding: 16 }}>No sheets match. Clear the search or the filter.</td></tr>}
              </tbody>
            </table>
          </div>
          <span className="ad-note">{shown.length} of {sheets.length} shown · {ticked.size} ticked</span>

          {section === 'Renumber / Rename' && (
            <div className="ad-grid2" style={{ gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)' }}>
              <div className="ad-card" style={{ display: 'grid', gridTemplateColumns: '84px 1fr 1fr', gap: 6, alignItems: 'center' }}>
                <span /><span className="ad-label">Number</span><span className="ad-label">Name</span>
                {(['Find:', 'Replace with:', 'Prefix:', 'Suffix:'] as const).map((l, i) => (
                  <FragmentRow key={l} label={l} a={ruleBox('num')[i]} b={ruleBox('name')[i]} />
                ))}
                <span className="ad-note">Sequence:</span>
                <span className="ad-row" style={{ gridColumn: 'span 2', gap: 6 }}>
                  <span className="ad-note">Start</span><TextBox style={{ width: 52 }} value={seq.start} aria-label="Sequence start" onChange={(e) => setSeq({ ...seq, start: e.target.value })} />
                  <span className="ad-note">Step</span><TextBox style={{ width: 44 }} value={seq.step} aria-label="Sequence step" onChange={(e) => setSeq({ ...seq, step: e.target.value })} />
                  <span className="ad-note">Digits</span><TextBox style={{ width: 44 }} value={seq.pad} aria-label="Sequence digits" onChange={(e) => setSeq({ ...seq, pad: e.target.value })} />
                </span>
                <span />
                <span style={{ gridColumn: 'span 2' }}><Check label="Ignore case when finding" checked={ignoreCase} onChange={setIgnoreCase} /></span>
                <span className="ad-note" style={{ gridColumn: '1 / -1' }}>Tokens for Replace, Prefix and Suffix: {'{Number} {Name} {Revision} {Seq}'}. A number already in use is skipped. One Undo reverses the whole run.</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span className="ad-label">Preview</span>
                <div className="ad-list" style={{ maxHeight: 200 }} data-demo="preview">
                  {plan.length === 0 && <span className="li">Tick sheets to see the planned numbers and names.</span>}
                  {plan.map((p) => (
                    <span key={p.sheet.id} className={`li ${p.skip ? 'err' : p.number !== p.sheet.number || p.name !== p.sheet.name ? '' : ''}`}>
                      {p.skip ? <>✕ {p.sheet.number}: skipped, {p.skip}</> : p.number !== p.sheet.number || p.name !== p.sheet.name
                        ? <><b>{p.sheet.number}</b> → <b>{p.number}</b>{p.name !== p.sheet.name && <> · {p.name}</>}</>
                        : <>{p.sheet.number}: no change</>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'Create' && (
            <div className="ad-grid2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="ad-note">Type, or paste two columns from Excel (number, name). A number can be a range (A103::A106) or a list (M00A,M00B).</span>
                {createRows.map((r, i) => (
                  <div className="ad-row" key={i}>
                    <TextBox style={{ width: 90 }} value={r.number} aria-label="Sheet number" onChange={(e) => setCreateRows(createRows.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)))} />
                    <TextBox style={{ flex: 1 }} value={r.name} aria-label="Sheet name" onChange={(e) => setCreateRows(createRows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  </div>
                ))}
                <div className="ad-row"><Btn sm onClick={() => setCreateRows([...createRows, { number: '', name: '' }])}>Add row</Btn><Btn sm onClick={() => setCreateRows([])}>Clear list</Btn></div>
                <span className="ad-label" style={{ marginTop: 6 }}>Create as</span>
                <Radio name="create" label="Sheets with title block: A1 Landscape" checked={createReal} onChange={() => setCreateReal(true)} />
                <Radio name="create" label="Placeholder sheets (drawing list only)" checked={!createReal} onChange={() => setCreateReal(false)} />
              </div>
              <div><span className="ad-label">Preview</span><div className="ad-list" style={{ marginTop: 6 }}>{createRows.filter((r) => r.number).map((r, i) => (
                <span key={i} className={`li ${sheets.some((s) => s.number === r.number) ? 'err' : ''}`}>{sheets.some((s) => s.number === r.number) ? `✕ ${r.number} already exists` : <><b>{r.number}</b> {r.name}</>}</span>))}</div></div>
            </div>
          )}

          {section === 'Duplicate' && (
            <div className="ad-grid2">
              <div className="ad-card" style={{ display: 'grid', gap: 8 }}>
                <div className="ad-row"><span className="ad-note" style={{ width: 90 }}>Duplicate:</span><Select label="Duplicate mode" value={dupMode} onChange={setDupMode} options={['Sheet only', 'With views - duplicate', 'With views - with detailing', 'With views - as dependent']} width={210} /></div>
                <div className="ad-row"><span className="ad-note" style={{ width: 90 }}>Copies:</span><Select label="Copies" value={copies} onChange={setCopies} options={['1', '2', '3', '4', '5', '6', '7', '8', '9']} width={70} /></div>
                <div className="ad-row"><span className="ad-note" style={{ width: 90 }}>Number suffix:</span><TextBox style={{ width: 110 }} value={dupSuffix} onChange={(e) => setDupSuffix(e.target.value)} aria-label="Number suffix" /></div>
                <span className="ad-note">The title block, sheet parameters and the sheet's own notes and lines are copied. One Undo reverses the whole run.</span>
              </div>
              <div><span className="ad-label">Preview</span><div className="ad-list" style={{ marginTop: 6 }}>{tickedList.length === 0 ? <span className="li">Tick the sheets to duplicate.</span> : tickedList.flatMap((s) => Array.from({ length: +copies }, (_, i) => <span className="li" key={s.id + '-' + i}><b>{s.number + dupSuffix + (+copies > 1 ? i + 1 : '')}</b> {s.name}</span>))}</div></div>
            </div>
          )}

          {section === 'Set parameter' && (
            <div className="ad-card" style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
              <div className="ad-row"><span className="ad-note" style={{ width: 80 }}>Parameter:</span><Select label="Parameter" value={param} onChange={(v) => { setParam(v); setParamValue(v === 'Appears In Sheet List' ? 'No' : '') }} options={['Appears In Sheet List', 'Drawn By', 'Checked By', 'Title block type']} width={220} /></div>
              <div className="ad-row"><span className="ad-note" style={{ width: 80 }}>Value:</span>{param === 'Appears In Sheet List' ? <Select label="Value" value={paramValue} onChange={setParamValue} options={['Yes', 'No']} width={90} /> : <TextBox value={paramValue} onChange={(e) => setParamValue(e.target.value)} aria-label="Value" style={{ width: 220 }} />}</div>
              <span className="ad-note">Writes the value on every ticked sheet. Title block type changes every title block on the sheet; sheets without one are skipped. One Undo reverses the whole run.</span>
            </div>
          )}

          {section === 'Revisions' && (
            <div className="ad-grid2">
              <div style={{ display: 'grid', gap: 6 }}>
                <Radio name="rev" label="Add to the ticked sheets" checked={revAdd} onChange={() => setRevAdd(true)} />
                <Radio name="rev" label="Remove from the ticked sheets" checked={!revAdd} onChange={() => setRevAdd(false)} />
                <span className="ad-note">A revision shown by a cloud on the sheet stays. Issued revisions are not changed.</span>
              </div>
              <div className="ad-table-wrap"><table className="ad-table"><thead><tr><th /><th>Seq.</th><th>Number</th><th>Date</th><th>Description</th><th>Issued</th></tr></thead>
                <tbody>{REVISIONS.map((r) => (
                  <tr key={r.seq} className={revTicked.has(r.seq) ? 'sel' : ''}><td><Check checked={revTicked.has(r.seq)} onChange={(v) => { const t = new Set(revTicked); v ? t.add(r.seq) : t.delete(r.seq); setRevTicked(t) }} title={`Tick ${r.number}`} /></td><td>{r.seq}</td><td>{r.number}</td><td>{r.date}</td><td>{r.description}</td><td>{r.issued ? 'Yes' : 'No'}</td></tr>))}</tbody></table></div>
            </div>
          )}

          {section === 'Place on sheet' && (
            <div className="ad-card"><span className="ad-note">Place on sheet puts views and schedules on existing or new sheets in a layout. The same placement panel is demonstrated in the Room to View demo.</span></div>
          )}
        </div>
      </div>
    </RevitDialog>
  )
}

function FragmentRow({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) {
  return <><span className="ad-note">{label}</span>{a}{b}</>
}
