import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Circle, RotateCcw, Info, AlertTriangle, CheckCheck, Eye, Compass, LocateFixed, Maximize2, Minimize2 } from 'lucide-react'
import type { DemoDefinition, DemoNotice, DialogTheme } from './types'
import { DEMO_PROJECT } from '../data/demoProject'
import './dialog.css'
import './player.css'

interface LogEntry extends DemoNotice { id: number; at: string }

/** Hosts one interactive demo: simulated Revit frame, guided steps, notifications and log. */
export function DemoPlayer({ demo, compact = false }: { demo: DemoDefinition; compact?: boolean }) {
  const Comp = useMemo(() => lazy(demo.load), [demo])
  const [theme, setTheme] = useState<DialogTheme>('dark')
  const [run, setRun] = useState(0)
  const activeRun = useRef(0)
  const [doneIds, setDoneIds] = useState<string[]>([])
  const [guided, setGuided] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [targetReady, setTargetReady] = useState(false)
  const [closed, setClosed] = useState(false)
  const [toasts, setToasts] = useState<LogEntry[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const stage = useRef<HTMLDivElement>(null)
  const seq = useRef(0)
  const toastTimers = useRef(new Set<number>())
  const clearToastTimers = useCallback(() => {
    toastTimers.current.forEach((timer) => window.clearTimeout(timer))
    toastTimers.current.clear()
  }, [])
  useEffect(() => clearToastTimers, [clearToastTimers])

  const current = demo.steps.find((s) => !doneIds.includes(s.id))
  const progress = demo.steps.length ? Math.round((doneIds.length / demo.steps.length) * 100) : 0

  const done = useCallback((id: string) => {
    if (activeRun.current === run && demo.steps.some((step) => step.id === id)) setDoneIds((d) => (d.includes(id) ? d : [...d, id]))
  }, [demo.steps, run])
  const rewind = useCallback((id: string) => {
    if (activeRun.current !== run) return
    const index = demo.steps.findIndex((step) => step.id === id)
    if (index >= 0) setDoneIds((ids) => ids.filter((completed) => demo.steps.findIndex((step) => step.id === completed) < index))
  }, [demo.steps, run])
  const jumpToControl = () => {
    const target = stage.current?.querySelector<HTMLElement>('.demo-focus')
    if (!target) { stage.current?.scrollIntoView({ block: 'start' }); return }
    const selector = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]'
    const control = target.matches(selector) ? target : target.querySelector<HTMLElement>(selector)
    control?.focus({ preventScroll: true })
    target.scrollIntoView({ block: 'center', inline: 'nearest' })
  }
  const notify = useCallback((n: DemoNotice) => {
    if (activeRun.current !== run) return
    const e = { ...n, id: ++seq.current, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    setToasts((t) => [...t.slice(-2), e])
    setLog((l) => [e, ...l].slice(0, 40))
    const timer = window.setTimeout(() => {
      toastTimers.current.delete(timer)
      setToasts((t) => t.filter((x) => x.id !== e.id))
    }, 4200)
    toastTimers.current.add(timer)
  }, [run])
  const reset = () => { clearToastTimers(); setRun(++activeRun.current); setDoneIds([]); setLog([]); setToasts([]); setClosed(false) }

  // Highlight the control for the current step.
  // Re-apply when a lazily loaded control or its guide target changes.
  useEffect(() => {
    const root = stage.current
    if (!root) return
    const target = guided && !closed ? current?.target : undefined
    const apply = () => {
      const el = target ? root.querySelector(`[data-demo="${CSS.escape(target)}"]`) : null
      root.querySelectorAll('.demo-focus').forEach((x) => x !== el && x.classList.remove('demo-focus'))
      el?.classList.add('demo-focus')
      setTargetReady(Boolean(el))
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-demo'] })
    return () => { observer.disconnect(); root.querySelectorAll('.demo-focus').forEach((x) => x.classList.remove('demo-focus')) }
  }, [current?.target, guided, closed, run])

  return (
    <div className={`player${compact ? ' compact' : ''}${expanded ? ' is-expanded' : ''}`}>
      <div className="player-top">
        <div className="player-title">
          <span className="badge-sim" title={DEMO_PROJECT.code + ' · ' + DEMO_PROJECT.name}><Info size={14} /> Browser simulation · sample data</span>
          {demo.frame !== 'app' && <p className="small-screen-hint">Use the guide to jump to the next control.</p>}
        </div>
        <div className="player-actions">
          <div className="seg" role="group" aria-label="Mode">
            <button aria-pressed={guided} className={guided ? 'on' : ''} onClick={() => setGuided(true)}><Compass size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Guided</button>
            <button aria-pressed={!guided} className={!guided ? 'on' : ''} onClick={() => setGuided(false)}><Eye size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Explore</button>
          </div>
          {!compact && <button className="btn btn-ghost btn-sm" aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {expanded ? 'Standard view' : 'Expand dialog'}
          </button>}
          <button className="btn btn-ghost btn-sm" onClick={reset}><RotateCcw size={15} /> Reset</button>
        </div>
      </div>

      {guided && <div className="player-quick-guide">
        <div aria-live="polite">
          <span className="eyebrow">{current ? 'Step ' + (demo.steps.indexOf(current) + 1) + ' of ' + demo.steps.length : demo.steps.length ? 'Guide complete' : 'Loading guide'}</span>
          {current && <><strong>{current.title}</strong><p>{current.hint}</p></>}
        </div>
        <div className="player-step-nav">
          <button className="btn btn-ghost btn-sm" type="button" disabled={doneIds.length === 0} onClick={() => rewind(demo.steps[Math.max(0, (current ? demo.steps.indexOf(current) : demo.steps.length) - 1)].id)}>Back</button>
          <button className="btn btn-ghost btn-sm" type="button" disabled={!current} onClick={() => current && done(current.id)}>Next</button>
          {current?.target && !closed && <button className="btn btn-ghost btn-sm" type="button" disabled={!targetReady} onClick={jumpToControl}><LocateFixed size={15} /> Find control</button>}
        </div>
      </div>}

      <div className="player-main">
        <div className={demo.frame === 'app' ? 'revit app-frame' : 'revit'} aria-label={demo.frame === 'app' ? demo.ribbon.button + ' simulation' : 'Simulated Revit window'}>
          <div className="revit-bar">
            <span className="revit-dots"><i /><i /><i /></span>
            <span className="revit-file">{demo.frame === 'app' ? <>{demo.ribbon.button} <em>(simulated)</em></> : <>Autodesk Revit 2024 · {DEMO_PROJECT.name}.rvt <em>(sample data)</em></>}</span>
          </div>
          {demo.frame !== 'app' && <>
            <div className="revit-ribbon">
              {['Arch Folio', 'Arch Forge', 'Arch Sentinel'].map((x) => <span key={x} className={`rt ${x === demo.ribbon.tab ? 'on' : ''}`}>{x}</span>)}
            </div>
            <div className="revit-panel">
              <span className="rp-btn on"><span className="rp-icon" />{demo.ribbon.button}</span>
              <span className="rp-name">{demo.ribbon.panel}</span>
            </div>
          </>}
          <div className="revit-canvas" ref={stage}>
            {demo.frame !== 'app' && <svg className="revit-plan" viewBox="0 0 400 260" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="2"><path d="M30 30h340v200H30z" /><path d="M30 120h150M180 30v200M260 120h110M260 120v110" /></g>
              <g fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity=".6"><path d="M60 60h90v40H60zM210 50h130v50H210z" /></g>
            </svg>}
            <div className="dialog-host" style={{ maxWidth: expanded ? undefined : demo.width }}>
              {closed ? (
                <div className="reopen">
                  <p>The dialog is closed.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setClosed(false)}>Reopen {demo.ribbon.button}</button>
                </div>
              ) : (
                <Suspense fallback={<div className="loading">Loading the {demo.ribbon.button} dialog…</div>}>
                  <Comp key={run} theme={theme} setTheme={setTheme} done={done} rewind={rewind} notify={notify} close={() => setClosed(true)} />
                </Suspense>
              )}
            </div>
            <div className="toasts" aria-live="polite">
              {toasts.map((t) => (
                <div key={t.id} className={`toast ${t.kind}`}>
                  {t.kind === 'success' ? <CheckCheck size={15} /> : t.kind === 'warning' ? <AlertTriangle size={15} /> : <Info size={15} />}
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="steps-panel glass" aria-label="Demo steps">
          <div className="steps-head">
            <span className="eyebrow">Guided workflow</span>
            <span className="mono muted" style={{ fontSize: 12 }}>{doneIds.length}/{demo.steps.length}</span>
          </div>
          <div className="steps-progress" role="progressbar" aria-label="Guided workflow progress" aria-valuenow={progress}><i style={{ width: `${progress}%` }} /></div>
          <ol className="step-list">
            {demo.steps.map((s, i) => {
              const isDone = doneIds.includes(s.id)
              const isCur = current?.id === s.id
              return (
                <li key={s.id} aria-current={isCur ? 'step' : undefined} className={`${isDone ? 'done' : ''} ${isCur ? 'cur' : ''}`}>
                  {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  <div>
                    <b>{i + 1}. {s.title}</b>
                    {(isCur || !guided) && <p>{s.hint}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
          {!current && <div className="steps-complete">Workflow complete. Reset to run it again, or switch to Explore and try other options.</div>}
          <div className="log">
            <span className="eyebrow" style={{ fontSize: 10.5 }}>What happened (simulated)</span>
            {log.length === 0 && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Actions you take in the simulation appear here.</p>}
            <ul>
              {log.map((l) => <li key={l.id} className={l.kind}><span className="mono">{l.at}</span>{l.text}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
