import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Circle, RotateCcw, Info, AlertTriangle, CheckCheck, Eye, Compass } from 'lucide-react'
import type { DemoDefinition, DemoNotice, DialogTheme } from './types'
import './dialog.css'
import './player.css'

interface LogEntry extends DemoNotice { id: number; at: string }

/** Hosts one interactive demo: simulated Revit frame, guided steps, notifications and log. */
export function DemoPlayer({ demo, compact = false }: { demo: DemoDefinition; compact?: boolean }) {
  const Comp = useMemo(() => lazy(demo.load), [demo])
  const [theme, setTheme] = useState<DialogTheme>('dark')
  const [run, setRun] = useState(0)
  const [doneIds, setDoneIds] = useState<string[]>([])
  const [guided, setGuided] = useState(true)
  const [closed, setClosed] = useState(false)
  const [toasts, setToasts] = useState<LogEntry[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const stage = useRef<HTMLDivElement>(null)
  const seq = useRef(0)

  const current = demo.steps.find((s) => !doneIds.includes(s.id))
  const progress = Math.round((doneIds.length / demo.steps.length) * 100)

  const done = useCallback((id: string) => {
    setDoneIds((d) => (d.includes(id) ? d : [...d, id]))
  }, [])
  const notify = useCallback((n: DemoNotice) => {
    const e = { ...n, id: ++seq.current, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    setToasts((t) => [...t.slice(-2), e])
    setLog((l) => [e, ...l].slice(0, 40))
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== e.id)), 4200)
  }, [])
  const reset = () => { setRun((r) => r + 1); setDoneIds([]); setLog([]); setToasts([]); setClosed(false) }

  // Highlight the control for the current step.
  // Re-applied on an interval: the dialog loads on demand and re-renders on its own.
  useEffect(() => {
    const root = stage.current
    if (!root) return
    const target = guided && !closed ? current?.target : undefined
    const apply = () => {
      const el = target ? root.querySelector(`[data-demo="${CSS.escape(target)}"]`) : null
      root.querySelectorAll('.demo-focus').forEach((x) => x !== el && x.classList.remove('demo-focus'))
      el?.classList.add('demo-focus')
    }
    apply()
    const t = window.setInterval(apply, 400)
    return () => { window.clearInterval(t); root.querySelectorAll('.demo-focus').forEach((x) => x.classList.remove('demo-focus')) }
  }, [current?.target, guided, closed, run])

  return (
    <div className={`player ${compact ? 'compact' : ''}`}>
      <div className="player-top">
        <div className="player-title">
          <span className="badge-sim"><AlertTriangle size={13} /> Interactive simulation · no Revit model is opened or changed</span>
          <p className="small-screen-hint">Tip: the dialogs are full desktop windows, so they are easiest to use on a larger screen.</p>
        </div>
        <div className="player-actions">
          <div className="seg" role="group" aria-label="Mode">
            <button className={guided ? 'on' : ''} onClick={() => setGuided(true)}><Compass size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Guided</button>
            <button className={!guided ? 'on' : ''} onClick={() => setGuided(false)}><Eye size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Explore</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={reset}><RotateCcw size={15} /> Reset</button>
        </div>
      </div>

      <div className="player-main">
        <div className="revit" aria-label="Simulated Revit window">
          <div className="revit-bar">
            <span className="revit-dots"><i /><i /><i /></span>
            <span className="revit-file">Autodesk Revit 2024 · Sample Residence.rvt <em>(sample data)</em></span>
          </div>
          <div className="revit-ribbon">
            {(['Arch Folio', 'Arch Forge', 'Arch Sentinel'] as const).map((t) => (
              <span key={t} className={`rt ${t === demo.ribbon.tab ? 'on' : ''}`}>{t}</span>
            ))}
          </div>
          <div className="revit-panel">
            <span className="rp-btn on"><span className="rp-icon" />{demo.ribbon.button}</span>
            <span className="rp-name">{demo.ribbon.panel}</span>
          </div>
          <div className="revit-canvas" ref={stage}>
            <svg className="revit-plan" viewBox="0 0 400 260" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="2"><path d="M30 30h340v200H30z" /><path d="M30 120h150M180 30v200M260 120h110M260 120v110" /></g>
              <g fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity=".6"><path d="M60 60h90v40H60zM210 50h130v50H210z" /></g>
            </svg>
            <div className="dialog-host" style={{ maxWidth: demo.width }}>
              {closed ? (
                <div className="reopen">
                  <p>The dialog is closed.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setClosed(false)}>Reopen {demo.ribbon.button}</button>
                </div>
              ) : (
                <Suspense fallback={<div className="loading">Loading the {demo.ribbon.button} dialog…</div>}>
                  <Comp key={run} theme={theme} setTheme={setTheme} done={done} notify={notify} close={() => setClosed(true)} />
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
          <div className="steps-progress"><i style={{ width: `${progress}%` }} /></div>
          <ol className="step-list">
            {demo.steps.map((s, i) => {
              const isDone = doneIds.includes(s.id)
              const isCur = current?.id === s.id
              return (
                <li key={s.id} className={`${isDone ? 'done' : ''} ${isCur ? 'cur' : ''}`}>
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
            {log.length === 0 && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Actions you take in the dialog appear here.</p>}
            <ul>
              {log.map((l) => <li key={l.id} className={l.kind}><span className="mono">{l.at}</span>{l.text}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
