import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { asset } from '../components/Brand'
import { DEMO_PROJECT } from '../data/demoProject'
import { fixtureCell, fixtureChoices, fixtureResult, fixtureRowLimit, isSelectionColumn } from './generatedFixtures'
import { DYNAMIC_ACTIONS, getActions, LAYOUTS } from './generatedRegistry'
import type { DemoContext } from './types'

// A live replica generated from the plugin's real dialog: every control sits where the shipping
// dialog puts it (positions, text and tooltips are exported from the plugin's own layout).
// Lists show sample rows; lists the plugin fills from a model show sample options.

interface Node {
  k: string; x: number; y: number; w: number; h: number; s?: string; bg?: string | null; bd?: string | null; bw?: number[]; r?: number
  fs?: number; fw?: number; c?: string | null; al?: string; o?: number; icon?: number; on?: number; g?: string; tip?: string; off?: number
  ph?: string | null; ml?: number; i?: number; main?: number; hh?: number; cols?: { h: string; w: number }[]; fg?: string | null
}
interface Layout { w: number; h: number; tabs: string[]; states: Node[][] }
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const isSearch = (node: Node) => node.k === 'input' && /^search|^filter|type to filter/i.test([node.ph, node.tip].filter(Boolean).join(' '))
const scopeLabel = (node: Node, nodes: Node[]) => {
  let best = ''
  let score = 110
  for (const text of nodes) {
    if (text.k !== 'text' || text.icon || !text.s || text.s.length > 56) continue
    const left = node.x - (text.x + text.w)
    const top = node.y - text.y
    const next = left >= -8 && Math.abs(top) < 10 ? Math.max(left, 0) + Math.abs(top) * 4
      : top > 4 && top < 42 && Math.abs(node.x - text.x) < 55 ? top + Math.abs(node.x - text.x) + 18 : Infinity
    if (next < score) { score = next; best = text.s }
  }
  return best.trim().replace(/:$/, '')
}
// The plugins' Dark palette -> theme tokens, so the replica follows Dark and Light.
const TOKENS: Record<string, string> = {
  '#3B3E45': 'bg', '#484C54': 'surface', '#51565F': 'card', '#575C66': 'row-hover', '#5F646E': 'button', '#686D77': 'button-hover',
  '#2E3137': 'input', '#666B75': 'border', '#80858F': 'border-strong', '#8F949E': 'control-border', '#A3A8B2': 'button-border',
  '#7B9BE6': 'accent', '#6A8BDB': 'accent-hover', '#4B556D': 'accent-soft', '#A7BCEE': 'accent-text', '#F5F5F7': 'text', '#E3E6EB': 'text-2',
  '#CDD1D8': 'muted', '#9EA2AA': 'disabled', '#121315': 'on-accent', '#A2D9B6': 'success', '#BACEEB': 'info', '#E5C996': 'warning', '#FFBCB8': 'error',
}
const col = (c?: string | null) => (c ? (TOKENS[c.toUpperCase()] ? `var(--d-${TOKENS[c.toUpperCase()]})` : c) : undefined)
const gridLabel = (slug: string, n: Node, row: number) => n.cols?.map((c, i) => isSelectionColumn(c.h, c.w, i) ? '' : fixtureCell(slug, c.h, row)).filter((value) => value && value !== '—').slice(0, 2).join(', ') || `Sample row ${row + 1}`
const EMPTY_NODES: Node[] = []

export function makeGenerated(slug: string) {
  const rowCount = (n: Node) => Math.max(0, Math.min(fixtureRowLimit(slug), Math.floor((n.h - (n.hh ?? 30)) / 30)))
  return function GeneratedDemo({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
    const metas = LAYOUTS[slug] ?? []
    const [win, setWin] = useState(0)
    const [request, setRequest] = useState<{ file: string; attempt: number; layout?: Layout }>()
    const [attempt, setAttempt] = useState(0)
    const [tab, setTab] = useState(0)
    const [vals, setVals] = useState<Record<string, string | boolean>>({})
    const [touched, setTouched] = useState(false)
    const [progress, setProgress] = useState(0)
    const [k, setK] = useState(1)
    const [fullSize, setFullSize] = useState(false)
    const [result, setResult] = useState('')
    const wrap = useRef<HTMLDivElement>(null)
    const runTimer = useRef<number | undefined>(undefined)
    const meta = metas[win]
    const response = request?.file === meta.file && request.attempt === attempt ? request : undefined

    useEffect(() => {
      const abort = new AbortController()
      fetch(asset(meta.file), { signal: abort.signal })
        .then((r) => {
          if (!r.ok) throw new Error(`Dialog data returned ${r.status}`)
          return r.json() as Promise<Layout>
        })
        .then((layout) => {
          if (!Array.isArray(layout.states) || !layout.states.length) throw new Error('Invalid dialog layout')
          if (!abort.signal.aborted) setRequest({ file: meta.file, attempt, layout })
        })
        .catch(() => {
          if (!abort.signal.aborted) setRequest({ file: meta.file, attempt })
        })
      return () => abort.abort()
    }, [meta.file, attempt])
    useEffect(() => () => window.clearInterval(runTimer.current), [])
    useEffect(() => {
      const el = wrap.current; if (!el) return
      const fit = () => setK(Math.min(1, el.clientWidth / meta.w))
      fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect()
    }, [meta.w])

    const nodes = response?.layout?.states[tab] ?? EMPTY_NODES
    const tabKey = `${meta.win}:${tab}`
    const controlKey = (index: number) => `${tabKey}:${index}`
    const settingsKey = (name: string) => `${tabKey}:setting:${name}`
    const setting = (name: string, initial: string) => String(vals[settingsKey(name)] ?? initial)
    const setSetting = (name: string, value: string | boolean) => set(settingsKey(name), value, 'explore')
    const advanced = nodes.find((node, index) => node.k === 'exp' && (vals[controlKey(index)] ?? !!node.on))?.s
    const rowKey = (grid: Node, index: number, row: number) => `${meta.win}:grid:${grid.cols?.map((column) => column.h).join('|') || index}:${row}`
    const gridSearch = nodes.findIndex((node) => isSearch(node) && !/^search (categories|families|types)(?:\.|…|$)/i.test(node.ph ?? ''))
    const query = gridSearch === -1 ? '' : String(vals[controlKey(gridSearch)] ?? '').trim().toLowerCase()
    const tickedOnly = vals[`${tabKey}:tickedOnly`] === true
    const shownRows = (grid: Node, index: number) => Array.from({ length: rowCount(grid) }, (_, row) => row).filter((row) => {
      if (tickedOnly && vals[rowKey(grid, index, row)] !== true) return false
      return !query || grid.cols?.some((column) => fixtureCell(slug, column.h, row).toLowerCase().includes(query))
    })
    const navLabel = nodes.find((n) => n.k === 'text' && (n.s === 'TOOLS' || n.s === 'STEPS'))
    const labels = win === 0 || slug === 'template-manager' ? getActions(slug, meta) : meta.primary ? [meta.primary] : []
    const dynamicLabel = win === 0 ? DYNAMIC_ACTIONS[slug]?.[tab] : undefined
    const radioKey = (n: Node) => `${tabKey}:radio:${n.g}`
    const radioChecked = (n: Node, key: string) => vals[radioKey(n)] === undefined ? !!n.on : vals[radioKey(n)] === key
    const actionLabel = (n: Node) => {
      if (n.k !== 'btn') return undefined
      if (n.s) return labels.find((label) => n.s === label || (slug === 'text-tag-align' && n.s?.startsWith(`${label} `))) ?? (n.s === dynamicLabel ? n.s : undefined)
      if (dynamicLabel && n.w >= 100 && !nodes.some((other) => other.k === 'btn' && other.s === dynamicLabel)) return dynamicLabel
    }
    const firstOf = {
      option: nodes.findIndex((n, i) => n.k === 'check' || n.k === 'combo' || (n.k === 'radio' && !radioChecked(n, controlKey(i)))),
      tab: nodes.findIndex((n) => n.k === 'tab' && n.main && n.i !== tab),
      grid: nodes.findIndex((n) => n.k === 'grid' && rowCount(n) > 0),
      run: nodes.findIndex((n) => !!actionLabel(n)),
    }
    const touch = (step = 'explore') => { setTouched(true); done(step) }
    const clearResult = () => {
      if (runTimer.current !== undefined) {
        window.clearInterval(runTimer.current); runTimer.current = undefined; setProgress(0)
      }
      if (result) { setResult(''); rewind('run') }
    }
    const set = (key: string, value: string | boolean, step = 'option') => {
      clearResult()
      setVals((previous) => ({ ...previous, [key]: value })); touch(step)
    }
    const changeTheme = (value: 'dark' | 'light') => { setTheme(value); done('theme') }
    const changeTab = (index: number) => {
      if (index === tab) return
      clearResult(); setTab(index); done('tab')
    }
    const tickRows = (selected: boolean) => {
      const updates: Record<string, boolean> = {}
      nodes.forEach((node, index) => {
        if (node.k !== 'grid') return
        const rows = selected ? shownRows(node, index) : Array.from({ length: rowCount(node) }, (_, row) => row)
        rows.forEach((row) => { updates[rowKey(node, index, row)] = selected })
      })
      clearResult()
      setVals((previous) => ({ ...previous, ...updates }))
      touch(selected && Object.keys(updates).length ? 'row' : 'explore')
    }
    const openWindow = (index: number) => {
      if (index === win) return
      clearResult(); setWin(index); setTab(0)
      if (slug === 'template-manager' && index === 1) done('window')
    }

    const run = (label: string) => {
      if (runTimer.current !== undefined) return
      let selected = 0
      let total = 0
      const selectedNames: string[] = []
      nodes.forEach((node, index) => {
        if (node.k !== 'grid') return
        total += shownRows(node, index).length
        for (let row = 0; row < rowCount(node); row++) {
          if (vals[rowKey(node, index, row)] !== true) continue
          selected++
          if (selectedNames.length < 2) selectedNames.push(gridLabel(slug, node, row))
        }
      })
      if (query && !selected && !total && firstOf.grid >= 0) {
        notify({ kind: 'warning', text: 'No records match this search. Clear it or choose a matching sample record.' })
        return
      }
      const settings = nodes.flatMap((node, index) => {
        const value = vals[controlKey(index)]
        return node.k === 'combo' && typeof value === 'string' && value ? [value] : []
      })
      const detail = (() => {
        if (slug === 'section-box') {
          const padding = nodes.findIndex((node) => node.k === 'input' && /mm$/.test(node.s ?? ''))
          const value = String(vals[controlKey(padding)] ?? nodes[padding]?.s ?? '500 mm')
          const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(mm|cm|m)?$/i)
          if (!match) return null
          const unit = match[2]?.toLowerCase()
          const mm = Number(match[1]) * (unit === 'm' ? 1000 : unit === 'cm' ? 10 : 1)
          return `Padding ${mm} mm. Resulting extents ${(4.2 + mm / 500).toFixed(2)} × ${(3.6 + mm / 500).toFixed(2)} × ${(3.15 + mm / 500).toFixed(2)} m.`
        }
        if (slug === 'deviation-inspector') {
          const tolerance = nodes.findIndex((node) => node.k === 'input' && node.s === '15')
          const limit = Number(String(vals[controlKey(tolerance)] ?? '15').trim())
          const maximum = Number(setting('Maximum points / element', '100'))
          const spacing = Number(setting('Spacing (mm)', '30.48'))
          if (!Number.isFinite(limit) || limit <= 0 || !Number.isInteger(maximum) || maximum <= 0 || !Number.isFinite(spacing) || spacing <= 0) return null
          const metric = setting('Evaluate', '95th percentile')
          const columns: Record<string, string> = { '95th percentile': 'P95', Mean: 'Avg deviation', Maximum: 'Maximum' }
          const measured = [0, 1].filter((row) => {
            const available = Math.floor(parseInt(fixtureCell(slug, 'Samples', row), 10) * Math.min(1, 30.48 / spacing))
            return Math.min(available, maximum) >= 5 && (!selected || nodes.some((node, index) => node.k === 'grid' && vals[rowKey(node, index, row)] === true))
          })
          const misses = measured.filter((row) => parseFloat(fixtureCell(slug, columns[metric], row)) > limit).length
          return `${metric}, ${limit} mm threshold: ${misses} of ${measured.length} measured records above tolerance. Sample cap ${maximum}, spacing ${spacing} mm.`
        }
        if (slug === 'manage-text' && setting('Keep as typed', '')) return `Protected wording: ${setting('Keep as typed', '')}.`
        return selectedNames.length ? `Selected: ${selectedNames.join(' · ')}${selected > selectedNames.length ? ` and ${selected - selectedNames.length} more` : ''}.` : ''
      })()
      if (detail === null) {
        notify({ kind: 'warning', text: slug === 'section-box' ? 'Enter padding of 0 or greater in mm, cm, or m.' : 'Enter positive tolerance and spacing in millimetres, and a positive whole number for the sample limit.' })
        return
      }
      const summary = [fixtureResult(slug, label, selected || total || undefined, settings[0]), detail].filter(Boolean).join(' ')
      let p = 0; setProgress(1)
      runTimer.current = window.setInterval(() => {
        p += 10; setProgress(p)
        if (p >= 100) {
          window.clearInterval(runTimer.current); runTimer.current = undefined; setProgress(0)
          setResult(summary)
          notify({ kind: 'success', text: summary }); done('run')
        }
      }, 110)
    }

    const render = (n: Node, i: number) => {
      const key = controlKey(i)
      const pos: CSSProperties = { position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h }
      switch (n.k) {
        case 'box': {
          const bw = n.bw ?? [0, 0, 0, 0]
          return <div key={key} style={{ ...pos, pointerEvents: 'none', background: col(n.bg), borderStyle: 'solid', borderColor: col(n.bd) ?? 'transparent', borderWidth: `${bw[0]}px ${bw[1]}px ${bw[2]}px ${bw[3]}px`, borderRadius: n.r }} />
        }
        case 'text': {
          if (n.icon) return null
          const single = n.h < (n.fs ?? 12) * 2
          return <div key={key} style={{ ...pos, pointerEvents: 'none', width: single ? undefined : n.w + 2, height: single ? undefined : n.h + 2, minWidth: single && n.al ? n.w : undefined, fontSize: n.fs, fontWeight: n.fw, lineHeight: single ? `${n.h}px` : 1.36, color: col(n.c), whiteSpace: single ? 'nowrap' : 'normal', overflow: 'hidden', textAlign: n.al === 'c' ? 'center' : n.al === 'r' ? 'right' : 'left', opacity: n.o }}>{n.s}</div>
        }
        case 'logo': return <img key={key} alt="ArchiTECH" style={{ ...pos, pointerEvents: 'none', objectFit: 'contain', objectPosition: 'left center' }} src={asset(theme === 'dark' ? 'media/brand/architech-logo-dark-ui.webp' : 'media/brand/architech-logo-light-ui.webp')} />
        case 'mark': return <img key={key} alt="" style={{ ...pos, pointerEvents: 'none', borderRadius: 10 }} src={asset('favicon.svg')} />
        case 'theme': return <select key={key} className="ad-select" aria-label="Dialog theme" data-demo="gen-theme" style={pos} value={theme} onChange={(e) => changeTheme(e.target.value as 'dark' | 'light')}><option value="dark">Dark</option><option value="light">Light</option></select>
        case 'close': return <button key={key} className="ad-close" aria-label="Close (simulation)" style={pos} onClick={close}>✕</button>
        case 'tab': {
          if (!n.main) return <span key={key} className={`ad-tab ${n.on ? 'on' : ''}`} style={{ ...pos, pointerEvents: 'none', display: 'grid', placeItems: 'center', padding: 0 }}>{n.s}</span>
          const style: CSSProperties = navLabel ? { position: 'absolute', left: navLabel.x - 8, top: navLabel.y + 28 + (n.i ?? 0) * 34, width: 156, height: 30, textAlign: 'left', padding: '0 10px', borderRadius: 6, border: 0, borderBottom: 0, background: n.i === tab ? 'var(--d-accent-soft)' : 'transparent', boxShadow: n.i === tab ? 'inset 3px 0 0 var(--d-accent)' : undefined, color: n.i === tab ? 'var(--d-text)' : 'var(--d-text-2)', fontWeight: n.i === tab ? 600 : 500 } : { ...pos, padding: 0 }
          return <button key={key} aria-pressed={n.i === tab} className={navLabel ? '' : `ad-tab ${n.i === tab ? 'on' : ''}`} data-demo={i === firstOf.tab ? 'gen-tab' : undefined} style={{ ...style, cursor: 'pointer', font: 'inherit', fontSize: 12.5 }} onClick={() => { if (n.i !== undefined) changeTab(n.i) }}>{n.s || response?.layout?.tabs[n.i ?? 0] || 'Overview'}</button>
        }
        case 'check': case 'radio': {
          const checked = n.k === 'radio' ? radioChecked(n, key) : !!(vals[key] ?? n.on)
          return (
            <label key={key} className={n.k === 'check' ? 'ad-check' : 'ad-radio'} title={n.tip} style={{ ...pos, minHeight: 0, whiteSpace: 'nowrap' }} data-demo={i === firstOf.option ? 'gen-option' : undefined}>
              <input type={n.k === 'check' ? 'checkbox' : 'radio'} name={n.k === 'radio' ? radioKey(n) : undefined} checked={checked} aria-label={n.s || n.tip || 'Option'} onChange={(e) => (n.k === 'radio' ? set(radioKey(n), key) : set(key, e.target.checked))} />
              <span className={n.k === 'check' ? 'ad-box' : 'ad-dot'} />{n.s && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.s}</span>}
            </label>
          )
        }
        case 'combo': {
          const caption = scopeLabel(n, nodes)
          const choices = fixtureChoices(slug, caption, n.s ?? '', n.tip ?? '', nodes.slice(0, i).filter((node) => node.k === 'combo').length)
          return (
            <select key={key} className="ad-select" title={n.tip} aria-label={caption || n.tip || 'Choose a project value'} style={pos} value={String(vals[key] ?? n.s ?? choices[0])} data-demo={i === firstOf.option ? 'gen-option' : undefined} onChange={(e) => set(key, e.target.value)}>
              {choices.map((choice) => <option key={choice}>{choice}</option>)}
            </select>
          )
        }
        case 'input': {
          if (slug === 'update-schedule' && n.ml && !advanced) return null
          const caption = n.ph || scopeLabel(n, nodes) || n.tip || 'Enter a value'
          const initial = n.s?.replace(/Sample item 5\nSample item 6\nSample item 7/g, 'Door Schedule: 3 edits ready\nWindow Schedule: 1 row not found\nRoom Finish Schedule: read-only column skipped') ?? ''
          const value = String(vals[key] ?? initial)
          return n.ml
            ? <textarea key={key} className="ad-input" title={n.tip} aria-label={caption} placeholder={n.ph ?? ''} style={{ ...pos, padding: 8, resize: 'none' }} value={value} onChange={(e) => set(key, e.target.value, 'explore')} />
            : <input key={key} className="ad-input" title={n.tip} aria-label={caption} placeholder={n.ph ?? ''} style={pos} value={value} onChange={(e) => set(key, e.target.value, 'explore')} onKeyDown={(e) => { if (e.key === 'Escape' && isSearch(n)) { e.preventDefault(); set(key, '', 'explore') } }} />
        }
        case 'prog': return <div key={key} className="ad-progress" style={{ ...pos, pointerEvents: 'none' }}><i style={{ width: `${progress}%` }} /></div>
        case 'exp': {
          const expanded = Boolean(vals[key] ?? n.on)
          return <button key={key} aria-expanded={expanded} style={{ ...pos, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 0, color: 'var(--d-text)', font: 'inherit', fontSize: 12.5, cursor: 'pointer', padding: 0, textAlign: 'left' }} onClick={() => set(key, !expanded, 'explore')}><span className="ad-disc" style={{ width: 18, height: 18, borderRadius: 9, border: '1px solid var(--d-control-border)', background: 'var(--d-input)', display: 'grid', placeItems: 'center', fontSize: 9 }}>{expanded ? '▴' : '▾'}</span>{n.s}</button>
        }
        case 'btn': {
          const action = actionLabel(n)
          const label = n.s || action || n.tip
          if (!label) return <span key={key} className="ad-btn sm" style={{ ...pos, pointerEvents: 'none', padding: 0 }} />
          const tickFilter = firstOf.grid >= 0 && /^ticked only$/i.test(label)
          const onClick = () => {
            if (action) { run(action); return }
            if (label === 'Close' || label === 'Cancel') { close(); return }
            if (tickFilter) { set(`${tabKey}:tickedOnly`, !tickedOnly, 'explore'); return }
            if (firstOf.grid >= 0 && /^(tick shown|select all(?: visible)?|tick all mirrored)$/i.test(label)) { tickRows(true); return }
            if (firstOf.grid >= 0 && /^(clear ticks|deselect all)$/i.test(label)) { tickRows(false); return }
            const destination = metas.findIndex((item, index) => index !== win && normalize(item.title) === normalize(label))
            if (destination >= 0) { openWindow(destination); return }
            touch()
            notify({ kind: 'info', text: n.tip ?? `${label} uses the active Revit document in the desktop plugin.` })
          }
          return <button key={key} className={`ad-btn ${action || n.bg?.toUpperCase() === '#7B9BE6' ? 'primary' : ''}`} title={n.tip} disabled={(!!n.off && !touched && !action) || (!!action && progress > 0)} aria-pressed={tickFilter ? tickedOnly : undefined} data-demo={i === firstOf.run ? 'gen-run' : undefined} style={{ ...pos, padding: '0 6px', minHeight: 0, overflow: 'hidden', fontSize: Math.min(12.5, Math.max(10.5, n.h * 0.42)) }} onClick={onClick}>{label}</button>
        }
        case 'grid': {
          const cols = n.cols ?? []; const hh = n.hh ?? 30; const rows = shownRows(n, i)
          const total = cols.reduce((a, c) => a + c.w, 0)
          return (
            <div key={key} style={{ ...pos, overflow: 'auto', background: 'var(--d-input)', border: '1px solid var(--d-border)', borderRadius: 4 }} data-demo={i === firstOf.grid ? 'gen-grid' : undefined}>
              <div style={{ width: Math.max(total, n.w) }}>
                <div style={{ display: 'flex', height: hh, background: 'var(--d-surface)', borderBottom: '1px solid var(--d-border)', color: 'var(--d-text-2)', fontWeight: 600, fontSize: 12 }}>
                  {cols.map((c, ci) => <div key={ci} style={{ width: c.w, flex: 'none', padding: '0 8px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.h === '[]' ? <span className="ad-box" /> : c.h}</div>)}
                </div>
                {rows.map((r) => {
                  const rk = rowKey(n, i, r); const on = !!vals[rk]
                  const toggle = () => set(rk, !on, 'row')
                  return (
                    <div key={r} role="button" tabIndex={0} aria-pressed={on} aria-label={gridLabel(slug, n, r)} onClick={toggle} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle() } }} style={{ display: 'flex', height: 30, cursor: 'pointer', background: on ? 'var(--d-accent-soft)' : 'var(--d-card)', borderBottom: '1px solid color-mix(in srgb, var(--d-sep) 55%, transparent)', color: 'var(--d-text)', fontSize: 12 }}>
                      {cols.map((c, ci) => {
                        const value = fixtureCell(slug, c.h, r)
                        return <div key={ci} title={value} style={{ width: c.w, flex: 'none', padding: '0 8px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{isSelectionColumn(c.h, c.w, ci) ? <span className="ad-box" style={on ? { background: 'var(--d-accent)', borderColor: 'var(--d-accent)' } : undefined} /> : value.startsWith('#') ? <><i aria-hidden="true" style={{ display: 'inline-block', background: value, width: 13, height: 13, marginRight: 6, borderRadius: 3 }} />{value}</> : value}</div>
                      })}
                    </div>
                  )
                })}
                {!rows.length && <p style={{ padding: '5px 8px', fontSize: 12, color: 'var(--d-muted)' }}>{query || tickedOnly ? 'No matching records' : 'No sample records'}</p>}
              </div>
            </div>
          )
        }
        default: return null
      }
    }

    const scale = fullSize ? 1 : k
    return (
      <div>
        {metas.length > 1 && (
          <div className="gen-windows" role="group" aria-label="Dialogs of this tool">
            {metas.map((m, i) => <button key={m.file} aria-pressed={i === win} data-demo={slug === 'template-manager' && i === 1 ? 'gen-window' : undefined} className={i === win ? 'on' : ''} onClick={() => openWindow(i)}>{m.title}</button>)}
          </div>
        )}
        {response?.layout && meta.tabs.length > 1 && firstOf.tab === -1 && (
          <div className="gen-windows" role="group" aria-label="Sections of this dialog">
            {meta.tabs.map((label, index) => <button key={label || index} aria-pressed={index === tab} data-demo={index === (tab === 0 ? 1 : 0) ? 'gen-tab' : undefined} className={index === tab ? 'on' : ''} onClick={() => changeTab(index)}>{label || 'Overview'}</button>)}
          </div>
        )}
        {response?.layout && !nodes.some((n) => n.k === 'theme') && (
          <div className="gen-windows"><button data-demo="gen-theme" onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}>Use {theme === 'dark' ? 'light' : 'dark'} theme</button></div>
        )}
        {k < 0.9 && <div className="gen-windows"><button aria-pressed={fullSize} onClick={() => setFullSize((current) => !current)}>{fullSize ? 'Fit dialog to screen' : 'View dialog at full size'}</button></div>}
        <div ref={wrap} style={{ width: '100%', maxHeight: fullSize ? '75dvh' : undefined, overflow: 'auto' }}>
          <div style={{ width: meta.w * scale, height: meta.h * scale, position: 'relative', overflow: 'hidden' }}>
            <div className="ad gen" data-theme={theme} role="dialog" aria-label={`${meta.title} (simulation)`} style={{ display: 'block', position: 'absolute', left: 0, top: 0, width: meta.w, height: meta.h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              {response?.layout ? nodes.map(render) : (
                <div style={{ padding: 40, color: 'var(--d-muted)' }} role="status">
                  {response ? <>This dialog could not load. <button className="ad-btn" onClick={() => setAttempt((previous) => previous + 1)}>Retry</button></> : 'Loading the dialog…'}
                </div>
              )}
              {progress > 0 && !nodes.some((n) => n.k === 'prog') && <div className="ad-progress" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: 0 }}><i style={{ width: `${progress}%` }} /></div>}
            </div>
          </div>
        </div>
        {advanced && slug !== 'update-schedule' && (
          <section aria-label={advanced} className="ad" data-theme={theme} style={{ marginTop: 12, padding: 14, gap: 10 }}>
            <b>{advanced}</b>
            {slug === 'deviation-inspector' && <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {([['Maximum points / element', '100'], ['Spacing (mm)', '30.48']] as const).map(([name, initial]) => <label key={name} style={{ display: 'grid', gap: 4 }}>{name}<input className="ad-input" inputMode="decimal" style={{ width: 125 }} value={setting(name, initial)} onChange={(event) => setSetting(name, event.target.value)} /></label>)}
              <label style={{ display: 'grid', gap: 4 }}>Evaluate<select aria-label="Evaluate" className="ad-select" value={setting('Evaluate', '95th percentile')} onChange={(event) => setSetting('Evaluate', event.target.value)}>{['95th percentile', 'Mean', 'Maximum'].map((metric) => <option key={metric}>{metric}</option>)}</select></label>
            </div>}
            {slug === 'manage-text' && <label style={{ display: 'grid', gap: 4 }}>Keep as typed<input className="ad-input" value={setting('Keep as typed', '')} placeholder="GWB, FF&E" onChange={(event) => setSetting('Keep as typed', event.target.value)} /></label>}
            {slug === 'model-query-pro' && (advanced.startsWith('Inspect') ? <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap' }}>
              <label style={{ display: 'grid', gap: 4 }}>Element ID<input className="ad-input" inputMode="numeric" value={setting('Element ID', '348211')} onChange={(event) => setSetting('Element ID', event.target.value)} /></label>
              <button className="ad-btn" onClick={() => {
                const id = setting('Element ID', '348211').trim()
                const row = [0, 1, 2, 3, 4, 5].find((index) => fixtureCell(slug, 'Element ID', index) === id)
                notify(row === undefined ? { kind: 'warning', text: `Element ${id || 'ID'} was not found in the sample project.` } : { kind: 'info', text: `Element ${id} · ${fixtureCell(slug, 'Family', row)} · ${fixtureCell(slug, 'Level', row)}.` })
              }}>Inspect ID</button>
            </div> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Room enclosure', 'Duplicate walls', 'FF&E metadata'].map((name) => <label key={name} className="ad-check"><input type="checkbox" checked={Boolean(vals[settingsKey(name)] ?? true)} onChange={(event) => setSetting(name, event.target.checked)} /><span className="ad-box" />{name}</label>)}
            </div>)}
          </section>
        )}
        {result && <div className="notice" role="status" style={{ marginTop: 12 }}><b>{DEMO_PROJECT.code} sample result</b><p style={{ margin: '6px 0 0' }}>{result}</p></div>}
      </div>
    )
  }
}
