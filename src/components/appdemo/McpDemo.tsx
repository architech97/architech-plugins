import { useEffect, useRef, useState } from 'react'
import { asset } from '../Brand'
import './appDemo.css'

type Page = 'home' | 'apps' | 'caps' | 'settings' | 'diag'
type Kind = 'read' | 'edit' | 'delete'
type Policy = 'auto' | 'ask' | 'confirm'

const POLICY_LABEL: Record<Policy, string> = { auto: 'Automatic', ask: 'Asks first', confirm: 'You confirm' }
const NEXT_POLICY: Record<Policy, Policy> = { auto: 'ask', ask: 'confirm', confirm: 'auto' }
const RULES: { kind: Kind; icon: string; title: string; text: string }[] = [
  { kind: 'read', icon: '👁', title: 'Reading the model', text: 'Views, elements and parameters are read straight away.' },
  { kind: 'edit', icon: '✎', title: 'Creating or editing', text: 'Creates and edits need approval before they run.' },
  { kind: 'delete', icon: '🗑', title: 'Deleting or running risky code', text: 'Deletes and code with uncertain effects need separate approval with a warning.' },
]
/** Three requests an AI app might send, against the sample model the Connector's own sample mode shows. */
const REQUESTS: { kind: Kind; ask: string; result: string }[] = [
  { kind: 'read', ask: 'List the doors on Level 2 with no fire rating', result: 'Read 18 doors · 6 have no Fire Rating' },
  { kind: 'edit', ask: 'Set Fire Rating to FD60 on those 6 doors', result: 'Updated 6 doors in one transaction · read back 6 of 6 = FD60' },
  { kind: 'delete', ask: 'Delete the unused views named “Working - *”', result: '6 working views deleted · read back: 0 remain' },
]
/** The Node server the installer places; JSON and TOML need its backslashes escaped. */
const SERVER_PATH = String.raw`C:\Program Files\ArchiTECH\MCP Connector\NodeServer\index.js`
const SERVER = SERVER_PATH.split('\\').join('\\\\')
const APPS: Record<string, { how: string; code: string }> = {
  'Claude Desktop': { how: 'In Claude Desktop open Settings › Developer › Edit Config, and add this inside claude_desktop_config.json. Keep any servers already there.', code: `{\n  "mcpServers": {\n    "bridge-revit-mcp": {\n      "command": "node",\n      "args": ["${SERVER}"]\n    }\n  }\n}` },
  'Claude Code': { how: 'Run this once in a terminal.', code: `claude mcp add bridge-revit-mcp -- node "${SERVER_PATH}"` },
  Codex: { how: 'Add this to ~/.codex/config.toml.', code: `[mcp_servers.bridge-revit-mcp]\ncommand = "node"\nargs = ["${SERVER}"]` },
  Cursor: { how: 'Add this to .cursor/mcp.json in your project, or to the global MCP settings.', code: `{\n  "mcpServers": {\n    "bridge-revit-mcp": {\n      "command": "node",\n      "args": ["${SERVER}"]\n    }\n  }\n}` },
  'Other MCP app': { how: 'Add a local (stdio) MCP server that starts this command.', code: `node "${SERVER_PATH}"` },
}
/** A sample of the Connector's typed commands, with their own descriptions (revit-mcp-commandset/command.json). */
const COMMANDS = [
  ['get_current_view_info', 'get current view info'], ['get_current_view_elements', 'get current view elements'], ['get_selected_elements', 'get the elements currently selected in Revit'],
  ['find_element', 'Find elements by id, Mark, name, category, or content'], ['list_door_window_schedule_data', 'Doors and windows with Mark, Type, Width, Height and more'],
  ['find_parameter_across_elements', "Dump one parameter's value across every element"], ['run_model_qa_report', 'Composed QA pass: elements, warnings, unplaced rooms and more'],
  ['tag_rooms', 'Tag rooms in the active view'], ['color_splash', 'Apply color overrides to elements in the active view'], ['isolate_elements', 'Temporarily isolate elements in the active view'],
  ['create_level', 'Create a level at an elevation (mm)'], ['create_wall', 'Create a straight wall between two points (mm)'], ['create_sheet', 'Create a sheet with a titleblock'],
  ['place_view_on_sheet', 'Place a view on a sheet by viewId and sheetNumber'], ['delete_element', 'Delete elements by id; verifies each id and reports'],
]
const CHECKS = [
  ['Connector', 'Running.'], ['Local port 1997', 'localhost:1997 is reachable.'], ['Revit commands', '64 commands ready for AI apps.'],
  ['Open model', "Working with 'Sample Library - ARCH'."], ['AI app setup', 'The server AI apps start is installed.'],
]
const DIALOG: Record<'edit' | 'delete', { title: string; head: string; body: string; code: string; go: string; warn?: boolean }> = {
  edit: {
    title: 'ArchiTECH - Review Revit C#', head: 'Create / Update - approve this reversible C# action?',
    body: 'Document: Sample Library - ARCH\nOperation: update\nThe Connector owns the transaction.\nReview the full source below. A later model readback is still required.',
    code: 'foreach (var id in doorIds)\n    doc.GetElement(id).LookupParameter("Fire Rating").Set("FD60");\nreturn doorIds.Count + " doors updated";',
    go: 'Approve this code once',
  },
  delete: {
    title: 'ArchiTECH - Review Revit C#', head: 'Destructive C# - approve this operation separately?', warn: true,
    body: 'Document: Sample Library - ARCH\nOperation: delete\nWARNING: This code deletes content. It may remove dependent elements.\nReview the full source below. A later model readback is still required.',
    code: 'var unused = new FilteredElementCollector(doc)\n    .OfClass(typeof(View)).Cast<View>()\n    .Where(v => !v.IsTemplate && v.Name.StartsWith("Working - "))\n    .Select(v => v.Id).ToList();\ndoc.Delete(unused);\nreturn unused.Count + " working views deleted";',
    go: 'Approve destructive code once',
  },
}
type Event = { id: number; kind: Kind; ask: string; result: string; ok: boolean; how: string }

/** The ArchiTECH MCP Connector dashboard, working in the browser with sample data. No AI app or Revit is involved. */
export default function McpDemo() {
  const [page, setPage] = useState<Page>('home')
  const [on, setOn] = useState(true)
  const [light, setLight] = useState(false)
  const [policy, setPolicy] = useState<Record<Kind, Policy>>({ read: 'auto', edit: 'ask', delete: 'confirm' })
  const [events, setEvents] = useState<Event[]>([])
  const [pending, setPending] = useState<(typeof REQUESTS)[number] | null>(null)
  const [app, setApp] = useState('Claude Desktop')
  const [copied, setCopied] = useState(false)
  const [cmds, setCmds] = useState<Record<string, boolean>>(() => Object.fromEntries(COMMANDS.map(([n]) => [n, true])))
  const [query, setQuery] = useState('')
  const [checked, setChecked] = useState(CHECKS.length)
  const [startWithRevit, setStartWithRevit] = useState(true)
  const id = useRef(1)
  const timers = useRef<number[]>([])
  const modal = useRef<HTMLDivElement>(null)
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => { if (pending) modal.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }) }, [pending])

  const log = (r: (typeof REQUESTS)[number], ok: boolean, how: string) =>
    setEvents((e) => [{ id: id.current++, kind: r.kind, ask: r.ask, result: ok ? r.result : 'Not run · nothing changed', ok, how }, ...e])

  const request = (r: (typeof REQUESTS)[number]) => {
    if (!on) return
    const p = policy[r.kind]
    if (p === 'auto') log(r, true, 'Ran automatically')
    else setPending(r)
  }
  const decide = (ok: boolean) => { if (pending) log(pending, ok, ok ? (policy[pending.kind] === 'confirm' ? 'You confirmed' : 'You approved') : 'You cancelled'); setPending(null) }

  const runChecks = () => {
    setChecked(0)
    CHECKS.forEach((_, i) => timers.current.push(window.setTimeout(() => setChecked(i + 1), 380 * (i + 1))))
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(APPS[app].code) } catch { /* clipboard is optional */ }
    setCopied(true); timers.current.push(window.setTimeout(() => setCopied(false), 1600))
  }
  const go = (p: Page) => { setPage(p); if (p === 'diag') runChecks() }

  const kindDialog = pending && pending.kind !== 'read' ? DIALOG[pending.kind] : null
  const shown = COMMANDS.filter(([n, d]) => (n + ' ' + d).toLowerCase().includes(query.toLowerCase()))
  const enabled = Object.values(cmds).filter(Boolean).length

  return (
    <div className={'app-demo mc-demo' + (light ? ' is-light' : '')} aria-label="ArchiTECH MCP Connector interactive demo">
      <span className="app-demo-tag">Demo in your browser</span>
      <nav className="mc-side" aria-label="Connector pages">
        <img src={asset(light ? 'media/i3d/demo/lockup-light.webp' : 'media/i3d/demo/lockup.webp')} alt="ArchiTECH" />
        <small>Revit MCP Connector</small>
        {([['home', '⌂', 'Home'], ['apps', '💬', 'AI Apps'], ['caps', '☰', 'Capabilities'], ['settings', '⚙', 'Settings'], ['diag', '📈', 'Diagnostics']] as [Page, string, string][]).map(([p, icon, label]) => (
          <button key={p} type="button" aria-current={page === p ? 'page' : undefined} onClick={() => go(p)}><span aria-hidden="true">{icon}</span>{label}</button>
        ))}
        <span className="mc-foot">Works on this computer only.</span>
      </nav>

      <div className="mc-main">
        <section className={'mc-status' + (on ? '' : ' off')} aria-live="polite">
          <span className="mc-led" />
          <div>
            <strong>{on ? 'Ready for MCP clients' : 'Connector is off'}</strong>
            <small>Revit 2024 · Sample Library - ARCH · Level 2 - Floor Plan</small>
            {on ? <em>Bridge running · Model open · {64 - (COMMANDS.length - enabled)} commands</em> : <em style={{ color: 'var(--a-muted)' }}>AI apps cannot reach Revit</em>}
          </div>
          <div className="mc-actions">
            <button type="button" className="a-btn" onClick={() => go('diag')}>Check health</button>
            <button type="button" className="a-btn" disabled={on} onClick={() => setOn(true)}>Turn on</button>
            <button type="button" className="a-btn" disabled={!on} onClick={() => setOn(false)}>Turn off</button>
          </div>
        </section>

        {page === 'home' && (
          <div className="mc-page a-in" key="home">
            <div className="mc-card">
              <h4>Try it: requests from Claude Desktop</h4>
              <div className="mc-try">
                {REQUESTS.map((r) => (
                  <button key={r.kind} type="button" disabled={!on || !!pending} onClick={() => request(r)}>
                    <span className={'mc-kind ' + r.kind}>{r.kind}</span>{r.ask}<small>{POLICY_LABEL[policy[r.kind]]}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="mc-card">
              <h4>Activity</h4>
              <div className="mc-activity">
                {events.length === 0 ? (
                  <div className="mc-empty"><strong>No activity yet</strong>When an AI app asks Revit to do something, its request and Revit’s answer appear here, along with anything that needs your approval.</div>
                ) : events.map((e) => (
                  <div key={e.id} className="mc-event a-in">
                    <span className="mc-who"><span className={'mc-kind ' + e.kind}>{e.kind}</span>Claude Desktop · {e.how}</span>
                    <p>{e.ask}</p>
                    <span className={'mc-res' + (e.ok ? '' : ' no')}>{e.ok ? '✓ ' : '– '}{e.result}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mc-card">
              <h4>How AI changes are handled <small style={{ fontWeight: 400, color: 'var(--a-muted)' }}>· click a badge to change it; deletes always need you</small></h4>
              <div className="mc-rules">
                {RULES.map((r) => (
                  <div key={r.kind} className="mc-rule">
                    <i className={'mc-kind ' + r.kind} aria-hidden="true">{r.icon}</i>
                    <div><strong>{r.title}</strong><small>{r.text}</small></div>
                    {r.kind === 'delete'
                      ? <span className="mc-policy confirm" title="Destructive changes always need their own approval">{POLICY_LABEL.confirm}</span>
                      : <button type="button" className={'mc-policy ' + policy[r.kind]} onClick={() => setPolicy((p) => ({ ...p, [r.kind]: NEXT_POLICY[p[r.kind]] }))} aria-label={`${r.title}: ${POLICY_LABEL[policy[r.kind]]}. Change`}>{POLICY_LABEL[policy[r.kind]]}</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 'apps' && (
          <div className="mc-page a-in" key="apps">
            <h3>AI Apps</h3>
            <p>Connect any app that supports local MCP servers. Pick it, copy its setup, and restart it.</p>
            <strong>1 · Pick your app</strong>
            <div className="mc-apps" role="group" aria-label="AI app">{Object.keys(APPS).map((a) => <button key={a} type="button" aria-pressed={app === a} onClick={() => setApp(a)}>{a}</button>)}</div>
            <strong>2 · Add ArchiTECH to {app}</strong>
            <p style={{ margin: 0, color: 'var(--a-muted)' }}>{APPS[app].how}</p>
            <pre className="mc-code">{APPS[app].code}<button type="button" className="a-btn primary" onClick={copy}>{copied ? 'Copied' : 'Copy setup'}</button></pre>
            <strong>3 · Restart the app and keep Revit open</strong>
            <p style={{ margin: 0, color: 'var(--a-muted)' }}>The app talks to ArchiTECH over stdio; ArchiTECH talks to Revit on 127.0.0.1:1997. Nothing leaves this computer.</p>
          </div>
        )}

        {page === 'caps' && (
          <div className="mc-page a-in" key="caps">
            <h3>Capabilities</h3>
            <p>Choose which Revit commands AI apps may use. Changes apply to every connected app after you save.</p>
            <div className="mc-row"><input className="mc-search" placeholder="Search commands" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search commands" /><small style={{ color: 'var(--a-muted)' }}>A sample of the typed commands</small></div>
            <div className="mc-card mc-cmds">
              {shown.map(([n, d]) => (
                <div className="mc-cmd" key={n}>
                  <button type="button" className="a-switch" role="switch" aria-checked={cmds[n]} aria-label={n} onClick={() => setCmds((c) => ({ ...c, [n]: !c[n] }))} />
                  <div><strong>{n}</strong><small>{d}</small></div>
                </div>
              ))}
            </div>
            <div className="mc-row end">
              <button type="button" className="a-btn" onClick={() => setCmds(Object.fromEntries(COMMANDS.map(([n]) => [n, true])))}>Enable all</button>
              <button type="button" className="a-btn" onClick={() => setCmds(Object.fromEntries(COMMANDS.map(([n]) => [n, false])))}>Disable all</button>
              <button type="button" className="a-btn primary">Save</button>
            </div>
          </div>
        )}

        {page === 'settings' && (
          <div className="mc-page a-in" key="settings">
            <h3>Settings</h3>
            <div className="mc-card">
              <div className="mc-setting"><div><strong>Appearance</strong><small>Dark or Light, like the rest of the ArchiTECH tools.</small></div><button type="button" className="a-switch" role="switch" aria-checked={light} aria-label="Light appearance" onClick={() => setLight((v) => !v)} /></div>
              <div className="mc-setting"><div><strong>Start with Revit</strong><small>Turn the Connector on when Revit opens.</small></div><button type="button" className="a-switch" role="switch" aria-checked={startWithRevit} aria-label="Start with Revit" onClick={() => setStartWithRevit((v) => !v)} /></div>
              <div className="mc-setting"><div><strong>Model changes</strong><small>Set on Home: what runs automatically, what asks first, and what you confirm.</small></div><button type="button" className="a-btn" onClick={() => go('home')}>Open</button></div>
            </div>
          </div>
        )}

        {page === 'diag' && (
          <div className="mc-page a-in" key="diag">
            <div className="mc-row" style={{ justifyContent: 'space-between' }}><h3>Diagnostics</h3><button type="button" className="a-btn primary" onClick={runChecks}>Check again</button></div>
            <p>Checks run when this page opens. If one still fails, copy the report for support.</p>
            <p className="mc-sum" aria-live="polite">{checked < CHECKS.length ? `Checking… ${checked} of ${CHECKS.length}` : `All ${CHECKS.length} checks passed`}</p>
            <div className="mc-checks">
              {CHECKS.map(([t, d], i) => (
                <div key={t} className="mc-check"><b className={i < checked ? '' : 'wait'}>{i < checked ? 'Passed' : 'Checking'}</b><div><strong>{t}</strong><small>{d}</small></div></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pending && (
        <div className="mc-modal-back" ref={modal} role="dialog" aria-modal="true" aria-label="Review a model change">
          {kindDialog ? (
            <div className="mc-modal">
              <header><span>{kindDialog.title}</span><button type="button" onClick={() => decide(false)} aria-label="Close">×</button></header>
              <h5>{kindDialog.head}</h5>
              <div className={'mc-body' + (kindDialog.warn ? ' warn' : '')}>{kindDialog.body}</div>
              <pre>{kindDialog.code}</pre>
              <button type="button" className="mc-go" onClick={() => decide(true)}>→ {kindDialog.go}</button>
              <footer><button type="button" onClick={() => decide(false)}>Cancel</button></footer>
            </div>
          ) : (
            <div className="mc-modal">
              <header><span>ArchiTECH - Confirm read</span><button type="button" onClick={() => decide(false)} aria-label="Close">×</button></header>
              <h5>Allow this read?</h5>
              <div className="mc-body">{pending.ask}{'\n'}Reads never change the model. You set reads to {POLICY_LABEL[policy.read].toLowerCase()}.</div>
              <button type="button" className="mc-go" onClick={() => decide(true)}>→ Allow once</button>
              <footer><button type="button" onClick={() => decide(false)}>Cancel</button></footer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
