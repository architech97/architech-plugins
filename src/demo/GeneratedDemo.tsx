import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { asset } from '../components/Brand'
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
// The plugins' Dark palette -> theme tokens, so the replica follows Dark and Light.
const TOKENS: Record<string, string> = {
  '#3B3E45': 'bg', '#484C54': 'surface', '#51565F': 'card', '#575C66': 'row-hover', '#5F646E': 'button', '#686D77': 'button-hover',
  '#2E3137': 'input', '#666B75': 'border', '#80858F': 'border-strong', '#8F949E': 'control-border', '#A3A8B2': 'button-border',
  '#7B9BE6': 'accent', '#6A8BDB': 'accent-hover', '#4B556D': 'accent-soft', '#A7BCEE': 'accent-text', '#F5F5F7': 'text', '#E3E6EB': 'text-2',
  '#CDD1D8': 'muted', '#9EA2AA': 'disabled', '#121315': 'on-accent', '#A2D9B6': 'success', '#BACEEB': 'info', '#E5C996': 'warning', '#FFBCB8': 'error',
}
const col = (c?: string | null) => (c ? (TOKENS[c.toUpperCase()] ? `var(--d-${TOKENS[c.toUpperCase()]})` : c) : undefined)
const SAMPLE: [RegExp, string[]][] = [
  [/sheet.?number|^number$|^no\.?$/i, ['A-101', 'A-102', 'A-103', 'A-201', 'A-301', 'A-401']],
  [/sheet.?name/i, ['Ground Floor Plan', 'First Floor Plan', 'Roof Plan', 'Elevations', 'Sections', 'Ceiling Plan']],
  [/level/i, ['Level 01', 'Level 01', 'Level 02', 'Level 02', 'Roof', 'Level 01']],
  [/categor/i, ['Walls', 'Doors', 'Windows', 'Floors', 'Furniture', 'Ceilings']],
  [/family/i, ['Basic Wall', 'Single-Flush', 'Fixed', 'Floor', 'Sofa', 'Compound Ceiling']],
  [/^type|type name|type$/i, ['Interior 115mm', '900 x 2100mm', '1200 x 1500mm', 'Concrete 150mm', '3 Seater', 'GB 12.5mm']],
  [/element.?id|^id$/i, ['348211', '348390', '351002', '352117', '355210', '361001']],
  [/workset/i, ['Architecture', 'Interiors', 'Facade', 'Structure', 'FF&E', 'Architecture']],
  [/status|preflight|check|result|verdict/i, ['Ready', 'Ready', 'Review', 'Ready', 'Ready', 'Review']],
  [/count|instances|elements|views|copies|warnings|members|in use/i, ['12', '4', '27', '1', '8', '3']],
  [/area/i, ['32.4 m²', '14.8 m²', '16.2 m²', '3.1 m²', '21.0 m²', '9.6 m²']],
  [/scale/i, ['1:50', '1:50', '1:100', '1:25', '1:50', '1:100']],
  [/revision/i, ['P02', 'P02', 'P01', 'P01', '—', '—']],
  [/title.?block/i, ['A1 Landscape', 'A1 Landscape', 'A1 Landscape', 'A1 Landscape', 'A1 Landscape', 'A1 Landscape']],
  [/room/i, ['101 Living Room', '102 Kitchen', '103 Dining', '201 Master Bedroom', '202 Bedroom 2', '203 Bathroom']],
  [/view|template/i, ['L01 - Floor Plan', 'L02 - Floor Plan', 'North Elevation', 'Section A-A', 'L01 - Ceiling Plan', '3D - Coordination']],
  [/param|field/i, ['Comments', 'Mark', 'Fire Rating', 'Type Mark', 'Description', 'Finish']],
  [/name|item|description|label/i, ['Sample item 1', 'Sample item 2', 'Sample item 3', 'Sample item 4', 'Sample item 5', 'Sample item 6']],
]
const cell = (header: string, row: number) => SAMPLE.find(([re]) => re.test(header))?.[1][row % 6] ?? ''
const rowCount = (n: Node) => Math.max(0, Math.min(6, Math.floor((n.h - (n.hh ?? 30)) / 30)))
const gridLabel = (n: Node, row: number) => n.cols?.map((c) => cell(c.h, row)).filter(Boolean).slice(0, 2).join(', ') || `Sample row ${row + 1}`
const EMPTY_NODES: Node[] = []

export function makeGenerated(slug: string, tagline: string) {
  return function GeneratedDemo({ theme, setTheme, done, notify, close }: DemoContext) {
    const metas = LAYOUTS[slug] ?? []
    const [win, setWin] = useState(0)
    const [request, setRequest] = useState<{ file: string; attempt: number; layout?: Layout }>()
    const [attempt, setAttempt] = useState(0)
    const [tab, setTab] = useState(0)
    const [vals, setVals] = useState<Record<string, string | boolean>>({})
    const [touched, setTouched] = useState(false)
    const [progress, setProgress] = useState(0)
    const [k, setK] = useState(1)
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
    const navLabel = nodes.find((n) => n.k === 'text' && (n.s === 'TOOLS' || n.s === 'STEPS'))
    const labels = win === 0 || slug === 'template-manager' ? getActions(slug, meta) : meta.primary ? [meta.primary] : []
    const dynamicLabel = win === 0 ? DYNAMIC_ACTIONS[slug]?.[tab] : undefined
    const radioKey = (n: Node) => `g:${tab}:${n.g}`
    const radioChecked = (n: Node, key: string) => vals[radioKey(n)] === undefined ? !!n.on : vals[radioKey(n)] === key
    const actionLabel = (n: Node) => {
      if (n.k !== 'btn') return undefined
      if (n.s) return labels.find((label) => n.s === label || (slug === 'text-tag-align' && n.s?.startsWith(`${label} `))) ?? (n.s === dynamicLabel ? n.s : undefined)
      if (dynamicLabel && n.w >= 100 && !nodes.some((other) => other.k === 'btn' && other.s === dynamicLabel)) return dynamicLabel
    }
    const firstOf = {
      option: nodes.findIndex((n, i) => n.k === 'check' || n.k === 'combo' || (n.k === 'radio' && !radioChecked(n, `${tab}:${i}`))),
      tab: nodes.findIndex((n) => n.k === 'tab' && n.main && n.i !== tab),
      grid: nodes.findIndex((n) => n.k === 'grid' && rowCount(n) > 0),
      run: nodes.findIndex((n) => !!actionLabel(n)),
    }
    const touch = (step = 'explore') => { setTouched(true); done(step) }
    const set = (key: string, v: string | boolean, step = 'option') => { setVals((s) => ({ ...s, [key]: v })); touch(step) }
    const changeTheme = (value: 'dark' | 'light') => { setTheme(value); touch('theme') }
    const tickRows = (selected: boolean) => {
      const updates: Record<string, boolean> = {}
      nodes.forEach((node, index) => {
        if (node.k !== 'grid') return
        for (let row = 0; row < rowCount(node); row++) updates[`${tab}:${index}:r${row}`] = selected
      })
      setVals((previous) => ({ ...previous, ...updates }))
      touch(selected ? 'row' : 'explore')
    }
    const openWindow = (index: number) => {
      if (index === win) return
      window.clearInterval(runTimer.current)
      runTimer.current = undefined
      setProgress(0); setWin(index); setTab(0); setVals({}); setTouched(false)
      if (slug === 'template-manager' && index === 1) done('window')
    }

    const run = (label: string) => {
      if (runTimer.current !== undefined) return
      let p = 0; setProgress(1)
      runTimer.current = window.setInterval(() => {
        p += 10; setProgress(p)
        if (p >= 100) {
          window.clearInterval(runTimer.current); runTimer.current = undefined; setProgress(0)
          notify({ kind: 'success', text: `${label}: sample run complete. ${tagline}` }); done('run')
        }
      }, 110)
    }

    const render = (n: Node, i: number) => {
      const key = `${tab}:${i}`
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
          return <button key={key} aria-pressed={n.i === tab} className={navLabel ? '' : `ad-tab ${n.i === tab ? 'on' : ''}`} data-demo={i === firstOf.tab ? 'gen-tab' : undefined} style={{ ...style, cursor: 'pointer', font: 'inherit', fontSize: 12.5 }} onClick={() => { if (n.i !== undefined && n.i !== tab) { setTab(n.i); touch('tab') } }}>{n.s || response?.layout?.tabs[n.i ?? 0] || 'Overview'}</button>
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
        case 'combo': return (
          <select key={key} className="ad-select" title={n.tip} aria-label={n.tip || 'List'} style={pos} value={(vals[key] as string) ?? ''} data-demo={i === firstOf.option ? 'gen-option' : undefined} onChange={(e) => set(key, e.target.value)}>
            <option value="">{n.s || '—'}</option><option>Sample option A</option><option>Sample option B</option><option>Sample option C</option>
          </select>
        )
        case 'input': return n.ml
          ? <textarea key={key} className="ad-input" title={n.tip} aria-label={n.ph || n.tip || 'Text'} placeholder={n.ph ?? ''} style={{ ...pos, padding: 8, resize: 'none' }} value={(vals[key] as string) ?? n.s ?? ''} onChange={(e) => set(key, e.target.value, 'explore')} />
          : <input key={key} className="ad-input" title={n.tip} aria-label={n.ph || n.tip || 'Text'} placeholder={n.ph ?? ''} style={pos} value={(vals[key] as string) ?? n.s ?? ''} onChange={(e) => set(key, e.target.value, 'explore')} />
        case 'prog': return <div key={key} className="ad-progress" style={{ ...pos, pointerEvents: 'none' }}><i style={{ width: `${progress}%` }} /></div>
        case 'exp': return <button key={key} style={{ ...pos, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 0, color: 'var(--d-text)', font: 'inherit', fontSize: 12.5, cursor: 'pointer', padding: 0, textAlign: 'left' }} onClick={() => { notify({ kind: 'info', text: `"${n.s}" expands to show more options in the plugin.` }); touch() }}><span className="ad-disc" style={{ width: 18, height: 18, borderRadius: 9, border: '1px solid var(--d-control-border)', background: 'var(--d-input)', display: 'grid', placeItems: 'center', fontSize: 9 }}>▾</span>{n.s}</button>
        case 'btn': {
          const action = actionLabel(n)
          const label = n.s || action || n.tip
          if (!label) return <span key={key} className="ad-btn sm" style={{ ...pos, pointerEvents: 'none', padding: 0 }} />
          const onClick = () => {
            if (action) { run(action); return }
            if (label === 'Close' || label === 'Cancel') { close(); return }
            if (firstOf.grid >= 0 && /^(tick shown|select all(?: visible)?|tick all mirrored)$/i.test(label)) { tickRows(true); return }
            if (firstOf.grid >= 0 && /^(clear ticks|deselect all)$/i.test(label)) { tickRows(false); return }
            touch()
            notify({ kind: 'info', text: `${label}${n.tip ? `: ${n.tip}` : ' (sample interaction).'}` })
          }
          return <button key={key} className={`ad-btn ${action || n.bg?.toUpperCase() === '#7B9BE6' ? 'primary' : ''}`} title={n.tip} disabled={(!!n.off && !touched) || (!!action && progress > 0)} data-demo={i === firstOf.run ? 'gen-run' : undefined} style={{ ...pos, padding: '0 6px', minHeight: 0, overflow: 'hidden', fontSize: Math.min(12.5, Math.max(10.5, n.h * 0.42)) }} onClick={onClick}>{label}</button>
        }
        case 'grid': {
          const cols = n.cols ?? []; const hh = n.hh ?? 30; const rows = rowCount(n)
          const total = cols.reduce((a, c) => a + c.w, 0)
          return (
            <div key={key} style={{ ...pos, overflow: 'auto', background: 'var(--d-input)', border: '1px solid var(--d-border)', borderRadius: 4 }} data-demo={i === firstOf.grid ? 'gen-grid' : undefined}>
              <div style={{ width: Math.max(total, n.w) }}>
                <div style={{ display: 'flex', height: hh, background: 'var(--d-surface)', borderBottom: '1px solid var(--d-border)', color: 'var(--d-text-2)', fontWeight: 600, fontSize: 12 }}>
                  {cols.map((c, ci) => <div key={ci} style={{ width: c.w, flex: 'none', padding: '0 8px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.h === '[]' ? <span className="ad-box" /> : c.h}</div>)}
                </div>
                {Array.from({ length: rows }, (_, r) => {
                  const rk = `${key}:r${r}`; const on = !!vals[rk]
                  const toggle = () => set(rk, !on, 'row')
                  return (
                    <div key={r} role="button" tabIndex={0} aria-pressed={on} aria-label={gridLabel(n, r)} onClick={toggle} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle() } }} style={{ display: 'flex', height: 30, cursor: 'pointer', background: on ? 'var(--d-accent-soft)' : 'var(--d-card)', borderBottom: '1px solid color-mix(in srgb, var(--d-sep) 55%, transparent)', color: 'var(--d-text)', fontSize: 12 }}>
                      {cols.map((c, ci) => <div key={ci} style={{ width: c.w, flex: 'none', padding: '0 8px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{(c.h === '[]' || (!c.h && c.w < 70 && ci === 0)) ? <span className="ad-box" style={on ? { background: 'var(--d-accent)', borderColor: 'var(--d-accent)' } : undefined} /> : cell(c.h, r)}</div>)}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
        default: return null
      }
    }

    return (
      <div>
        {metas.length > 1 && (
          <div className="gen-windows" role="group" aria-label="Dialogs of this tool">
            {metas.map((m, i) => <button key={m.file} aria-pressed={i === win} data-demo={slug === 'template-manager' && i === 1 ? 'gen-window' : undefined} className={i === win ? 'on' : ''} onClick={() => openWindow(i)}>{m.title}</button>)}
          </div>
        )}
        {response?.layout && !nodes.some((n) => n.k === 'theme') && (
          <div className="gen-windows"><button data-demo="gen-theme" onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}>Use {theme === 'dark' ? 'light' : 'dark'} theme</button></div>
        )}
        <div ref={wrap} style={{ width: '100%', height: meta.h * k, position: 'relative' }}>
          <div className="ad gen" data-theme={theme} role="dialog" aria-label={`${meta.title} (simulation)`} style={{ display: 'block', position: 'absolute', left: 0, top: 0, width: meta.w, height: meta.h, transform: `scale(${k})`, transformOrigin: 'top left' }}>
            {response?.layout ? nodes.map(render) : (
              <div style={{ padding: 40, color: 'var(--d-muted)' }} role="status">
                {response ? <>This dialog could not load. <button className="ad-btn" onClick={() => setAttempt((previous) => previous + 1)}>Retry</button></> : 'Loading the dialog…'}
              </div>
            )}
            {progress > 0 && !nodes.some((n) => n.k === 'prog') && <div className="ad-progress" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: 0 }}><i style={{ width: `${progress}%` }} /></div>}
          </div>
        </div>
      </div>
    )
  }
}
