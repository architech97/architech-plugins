import { useEffect, useRef, useState, type ReactNode } from 'react'
import { asset } from '../Brand'
import './appDemo.css'

type Mode = 'ask' | 'search' | 'build'
type Msg =
  | { id: number; who: 'user'; text: string }
  | { id: number; who: 'bot'; tag: string; calls: string[]; body: ReactNode }
  | { id: number; who: 'thinking'; steps: string[] }
  | { id: number; who: 'approve' }
/** A message before it gets its id (Omit spread over each member of the union). */
type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, 'id'> : never) : never

/** The sample conversation is the one the Assistant's own sample mode renders: Sample Library - ARCH, Level 2. */
const DOORS = (
  <>
    <p>Six doors on <b>Level 2</b> have no <i>Fire Rating</i> value. They sit on the stair core and corridor walls, which are 60-minute rated.</p>
    <ul>
      <li><b>D2.04</b>, <b>D2.05</b>: Single Flush 900 × 2100, stair core</li>
      <li><b>D2.11</b>, <b>D2.12</b>: Double Flush 1800 × 2100, corridor</li>
      <li><b>D2.17</b>, <b>D2.18</b>: Single Flush 1000 × 2100, plant room</li>
    </ul>
    <p>I can set <code>Fire Rating</code> to <b>FD60</b> on these six doors. That changes the model, so I will ask before I run it.</p>
  </>
)
const DONE = (
  <>
    <p>Done. <b>Fire Rating = FD60</b> is now set on all six doors, and I read them back to confirm.</p>
    <ol><li>Updated 6 doors in one transaction: <i>Set door fire rating</i></li><li>Read back: 6 of 6 now show FD60</li></ol>
    <p>The door schedule <i>A-601 Door Schedule</i> will pick up the change on its next refresh.</p>
  </>
)
const TOOLS = [
  { name: 'Reorder Pro', where: 'Arch Folio › Annotation', what: 'Renumber elements in the order you choose, with a preview first.' },
  { name: 'Sheet Manager', where: 'Arch Folio › Sheets', what: 'Renumber and rename many sheets at once.' },
  { name: 'VP Manager', where: 'Arch Folio › Sheets', what: 'Renumber detail numbers per sheet, left to right or top to bottom.' },
]

const SUGGESTIONS: { mode: Mode; text: string; key: string }[] = [
  { mode: 'ask', text: 'Which doors on Level 2 are missing a fire rating?', key: 'doors' },
  { mode: 'build', text: 'Set them to FD60.', key: 'fd60' },
  { mode: 'search', text: 'Find a tool to renumber rooms in order.', key: 'renumber' },
  { mode: 'ask', text: 'What is the active view?', key: 'view' },
]

/** A scripted ArchiTECH Assistant: the real window layout, its three modes and the approval step. Nothing is sent anywhere. */
export default function AssistantDemo() {
  const [log, setLog] = useState<Msg[]>([])
  const [mode, setMode] = useState<Mode>('ask')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [asked, setAsked] = useState<string[]>([])
  const [light, setLight] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const id = useRef(1)
  const box = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }) }, [log])

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }
  const push = (m: NewMsg) => setLog((l) => [...l, { ...m, id: id.current++ } as Msg])
  const replaceThinking = (m: NewMsg) => setLog((l) => [...l.filter((x) => x.who !== 'thinking'), { ...m, id: id.current++ } as Msg])

  const think = (steps: string[], then: () => void) => {
    push({ who: 'thinking', steps: [] })
    steps.forEach((s, i) => later(450 + i * 520, () => setLog((l) => l.map((x) => (x.who === 'thinking' ? { ...x, steps: [...x.steps, s] } : x)))))
    later(650 + steps.length * 520, then)
  }

  const run = (key: string, userText: string, m: Mode) => {
    if (busy) return
    setBusy(true); setMode(m); setText('')
    push({ who: 'user', text: userText })
    setAsked((a) => [...a, key])
    const finish = () => setBusy(false)
    if (key === 'doors') {
      const calls = ['Read the active view · Level 2 - Floor Plan', 'List doors on Level 2 · 18 found', 'Read Fire Rating · 6 empty']
      think(calls, () => { replaceThinking({ who: 'bot', tag: 'Read only · no model change', calls, body: DOORS }); finish() })
    } else if (key === 'fd60') {
      think(['Plan the change · 6 doors, one transaction'], () => { replaceThinking({ who: 'approve' }); finish() })
    } else if (key === 'renumber') {
      const calls = ['Search ribbon tools · “renumber”']
      think(calls, () => {
        replaceThinking({ who: 'bot', tag: 'Search · ArchiTECH tools', calls, body: (
          <>
            <p>Three tools renumber in order. For rooms, <b>Reorder Pro</b> is the one: pick the rooms, choose the order, preview, then write.</p>
            {TOOLS.map((t) => <div className="as-tool" key={t.name}><b>{t.name}</b><small>{t.where}</small><span>{t.what}</span></div>)}
          </>
        ) })
        finish()
      })
    } else if (key === 'view') {
      const calls = ['Read the active view']
      think(calls, () => { replaceThinking({ who: 'bot', tag: 'Read only · no model change', calls, body: <p>The active view is <b>Level 2 - Floor Plan</b> in <i>Sample Library - ARCH</i>.</p> }); finish() })
    } else {
      think([], () => {
        replaceThinking({ who: 'bot', tag: 'Demo', calls: [], body: <p>This demo replays a few sample questions about one sample model. Pick one of the suggestions below the chat to see how the Assistant answers, searches and plans a change.</p> })
        finish()
      })
    }
  }

  const decide = (ok: boolean) => {
    setLog((l) => l.filter((x) => x.who !== 'approve'))
    if (!ok) { push({ who: 'bot', tag: 'Cancelled', calls: [], body: <p>Cancelled. Nothing in the model changed.</p> }); return }
    setBusy(true)
    const calls = ['Set door fire rating · 6 doors · one transaction', 'Read back Fire Rating · 6 of 6 = FD60']
    think(calls, () => { replaceThinking({ who: 'bot', tag: 'Change made · read back afterwards', calls, body: DONE }); setBusy(false) })
  }

  const send = () => {
    const t = text.trim(); if (!t) return
    const hit = SUGGESTIONS.find((s) => t.toLowerCase().includes(s.key === 'doors' ? 'door' : s.key === 'fd60' ? 'fd60' : s.key === 'renumber' ? 'renumber' : 'active view'))
    if (hit && (hit.key !== 'fd60' || asked.includes('doors'))) run(hit.key, t, hit.mode)
    else run('other', t, mode)
  }

  const next = SUGGESTIONS.filter((s) => !asked.includes(s.key) && (s.key !== 'fd60' || asked.includes('doors')))

  return (
    <div className={'app-demo as-demo' + (light ? ' is-light' : '')} aria-label="ArchiTECH Assistant interactive demo">
      <span className="app-demo-tag">Demo in your browser</span>
      <header className="as-head">
        <img src={asset(light ? 'media/i3d/demo/lockup-light.webp' : 'media/i3d/demo/lockup.webp')} alt="ArchiTECH" />
        <b>Assistant</b>
        <div className="as-tools">
          <button type="button" className="as-icon" onClick={() => setLight((v) => !v)} aria-label={light ? 'Switch to Dark' : 'Switch to Light'} title="Light or dark">{light ? '☾' : '☀'}</button>
          <button type="button" className="as-icon" onClick={() => { setLog([]); setAsked([]); setBusy(false); timers.current.forEach(clearTimeout) }} aria-label="New conversation" title="New conversation">＋</button>
        </div>
      </header>
      <div className="as-context">
        <span className="as-dot" />
        <div><strong>Sample Library - ARCH.rvt</strong><small>Level 2 - Floor Plan</small></div>
        <span className="as-ver">Revit 2024</span>
        <div className="as-chips"><span className="a-chip">Connector :1997</span><span className="a-chip">MCP ready</span><span className="a-chip">Model online</span></div>
      </div>

      <div className="as-log" ref={box} aria-live="polite">
        {log.length === 0 && (
          <div className="as-msg a-in"><span className="as-tag">Sample model</span><p>Ask about the open Revit model, search for the right tool, or plan a change. Every change to the model goes through the Connector’s approvals first.</p><p>Try a suggestion below.</p></div>
        )}
        {log.map((m) => {
          if (m.who === 'user') return <div key={m.id} className="as-msg user a-in">{m.text}</div>
          if (m.who === 'thinking') return <div key={m.id} className="as-msg a-in"><div className="as-thinking"><i /><i /><i />Working</div>{m.steps.length > 0 && <ul className="as-calls">{m.steps.map((s) => <li key={s} className="a-in">{s}</li>)}</ul>}</div>
          if (m.who === 'approve') return (
            <div key={m.id} className="as-msg as-approve a-in" role="group" aria-label="Approve a model change">
              <span className="as-tag">Needs your approval</span>
              <h5>Set Fire Rating = FD60 on 6 doors</h5>
              <p>One transaction in <i>Sample Library - ARCH</i>. The Connector asks before it runs, and reads the doors back afterwards.</p>
              <div className="as-row"><button type="button" className="a-btn primary" onClick={() => decide(true)}>Approve once</button><button type="button" className="a-btn" onClick={() => decide(false)}>Cancel</button></div>
            </div>
          )
          return (
            <div key={m.id} className="as-msg a-in">
              <span className="as-tag">{m.tag}</span>
              {m.calls.length > 0 && <button type="button" className="as-how" aria-expanded={open === m.id} onClick={() => setOpen(open === m.id ? null : m.id)}>{open === m.id ? '▾' : '▸'} How I did this · {m.calls.length} ArchiTECH MCP {m.calls.length === 1 ? 'call' : 'calls'}</button>}
              {open === m.id && <ul className="as-calls">{m.calls.map((c) => <li key={c}>{c}</li>)}</ul>}
              {m.body}
            </div>
          )
        })}
      </div>

      <div className="as-suggest" aria-label="Suggested questions">
        {next.map((s) => <button key={s.key} type="button" disabled={busy} onClick={() => run(s.key, s.text, s.mode)}>{s.text}</button>)}
      </div>
      <form className="as-compose" onSubmit={(e) => { e.preventDefault(); send() }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe a Revit task…" aria-label="Message" rows={1}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
        <div className="as-compose-row">
          <div className="as-modes" role="group" aria-label="Mode">
            {(['ask', 'search', 'build'] as Mode[]).map((m) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>{m === 'ask' ? '💬 Ask' : m === 'search' ? '⌕ Search' : '🛠 Build'}</button>)}
          </div>
          <button type="submit" className="as-send" disabled={busy || !text.trim()} aria-label="Send">↑</button>
        </div>
      </form>
    </div>
  )
}
