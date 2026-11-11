import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Search } from 'lucide-react'
import { PRODUCTS, STATS } from '../data/catalog'
import { SUITES, suiteById } from '../data/suites'
import { demoForProduct } from '../demo/registry'
import { LAYOUTS } from '../demo/generatedRegistry'
import installed from '../data/installedRibbon.generated.json'
import interfaceData from '../data/interfaces.generated.json'
import stateData from '../data/toolStates.generated.json'
import type { Product } from '../data/types'
import { CountUp } from '../components/motion'
import './coverage.css'

// One row per dialog or state that the site can show for a tool, with what backs it.
// Nothing here is typed by hand: it is derived from the catalogue, the exported dialog layouts,
// the demo registry and a read-only snapshot of the installed Revit ribbon.
interface Row { suite: string; suiteId: string; tool: string; slug: string; state: string; tabs: string; source: string; walkthrough: string; demo?: string; checks: string[] }

const ribbon = installed as { snapshot: string; revit: string; alias: Record<string, string>; hidden: Record<string, string>; tabs: Record<string, { name: string; panel: string }[]> }
const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '')
const buttonFor = (p: Product) => ribbon.tabs[p.suite]?.find((b) => norm(b.name) === norm(ribbon.alias[p.slug] ?? p.name))
const matched = new Set(PRODUCTS.map(buttonFor))
const interfaces = interfaceData as unknown as Record<string, { source: string; rows: [string, string, string][] }>
const states = stateData as Record<string, { confirm: number; message: number; empty: number }>
const unmatched = Object.entries(ribbon.tabs).flatMap(([suite, buttons]) => buttons.filter((b) => !matched.has(b)).map((b) => ({ ...b, tab: suiteById(suite as Product['suite']).name })))
// Hidden ribbon entries open a tool that already has a page (a split-button member or one tab of a window).
const hiddenEntries = unmatched.filter((b) => ribbon.hidden[b.name]).map((b) => `${b.name} opens ${PRODUCTS.find((p) => p.slug === ribbon.hidden[b.name])?.name}`)
const uncatalogued = unmatched.filter((b) => !ribbon.hidden[b.name])
const FORMAT = { crafted: 'Guided walkthrough', replica: 'Dialog explorer', workflow: 'Workflow simulation' } as const
const isRevit = (p: Product) => ['folio', 'forge', 'sentinel'].includes(p.suite)

function rowsFor(p: Product): Row[] {
  const demo = demoForProduct(p.slug)
  const suite = suiteById(p.suite)
  const base = { suite: suite.name, suiteId: p.suite, tool: p.name, slug: p.slug, demo: demo?.id }
  const installedAs = buttonFor(p)
  const ribbonCheck = isRevit(p) || installedAs ? [installedAs ? `On the Revit ${ribbon.revit} ribbon` : 'Not found on the ribbon snapshot'] : []
  const layouts = LAYOUTS[p.slug] ?? []
  const app = interfaces[p.slug]
  if (app) return app.rows.map(([state, tabs, walkthrough], i) => ({
    ...base, state, tabs, source: 'Layout ' + app.source, walkthrough,
    checks: [...(i === 0 ? ribbonCheck : []), walkthrough === 'Inventoried, not simulated' ? 'Not in the browser walkthrough' : 'Inventoried from the layout source'],
  }))
  const found = states[p.slug]
  const stateRow: Row[] = found ? [{
    ...base, state: 'Confirmations, messages and empty states',
    tabs: `${found.confirm} confirmation${found.confirm === 1 ? '' : 's'} · ${found.message} message dialog${found.message === 1 ? '' : 's'} · ${found.empty} empty state${found.empty === 1 ? '' : 's'}`,
    source: 'Counted in the tool’s own project', walkthrough: 'Inventoried, not simulated', checks: ['Shown only where the sample task reaches them'],
  }] : []
  if (p.dialogs.length === 0) {
    const captures = p.media?.filter((m) => m.kind === 'image').length ?? 0
    return [{
      ...base, state: isRevit(p) ? 'Ribbon command with no dialog of its own' : 'Desktop application', tabs: '',
      source: isRevit(p) ? 'Ribbon tooltip and long description' : captures ? `${captures} capture${captures === 1 ? '' : 's'} from the installed build` : 'Product description',
      walkthrough: demo ? FORMAT[demo.kind] : 'None', checks: [...ribbonCheck, isRevit(p) ? 'Prompts and messages not captured' : 'Individual windows not inventoried'],
    }, ...stateRow]
  }
  return [...p.dialogs.map((dialog, i) => {
    const file = (dialog.dark ?? dialog.light ?? '').split('/').pop()?.replace(/-(dark|light)\.\w+$/, '') ?? ''
    const layout = layouts.find((item) => item.win === file)
    const explorable = demo?.kind === 'replica' && Boolean(layout)
    return {
      ...base, state: dialog.title, tabs: layout?.tabs.join(' · ') ?? '',
      source: dialog.source === 'reconstructed' ? 'Reconstructed from the tool’s source' : `Layout ${file}`,
      walkthrough: !demo ? 'None' : explorable || i === 0 ? FORMAT[demo.kind] : 'Reference render only',
      checks: [
        ...(i === 0 ? ribbonCheck : []),
        dialog.source === 'reconstructed' ? 'Reconstruction, not a render' : dialog.dark && dialog.light ? 'Rendered in Dark and Light' : 'Rendered in one theme',
      ],
    }
  }), ...stateRow]
}

const ALL = PRODUCTS.flatMap(rowsFor)
const csv = (rows: Row[]) => [['Suite', 'Tool', 'Dialog or state', 'Sections', 'Source reference', 'Walkthrough', 'Verification'], ...rows.map((r) => [r.suite, r.tool, r.state, r.tabs, r.source, r.walkthrough, r.checks.join('; ')])]
  .map((line) => line.map((cell) => '"' + cell.replace(/"/g, '""') + '"').join(',')).join('\r\n')

export default function Coverage() {
  const [suite, setSuite] = useState('')
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return ALL.filter((r) => (!suite || r.suiteId === suite) && words.every((w) => (r.tool + ' ' + r.state + ' ' + r.tabs + ' ' + r.walkthrough).toLowerCase().includes(w)))
  }, [suite, query])
  const tools = new Set(rows.map((r) => r.slug)).size
  const guided = new Set(ALL.filter((r) => r.walkthrough === FORMAT.crafted).map((r) => r.slug)).size
  const referenceOnly = ALL.filter((r) => r.walkthrough === 'Reference render only' || r.walkthrough === 'Inventoried, not simulated').length
  const download = () => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv(ALL)], { type: 'text/csv' }))
    link.download = 'architech-dialog-coverage.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <section className="section coverage">
      <div className="wrap">
        <header className="coverage-head">
          <div>
            <span className="eyebrow">Dialog coverage</span>
            <h1>What each walkthrough covers</h1>
          </div>
          <p className="lead">Every tool, every dialog the site can show, what it is based on and how far the browser walkthrough goes. Gaps are listed, not hidden.</p>
        </header>
        <dl className="coverage-summary">
          <div><dt>Entries: {STATS.revitTools} Revit tools, plus suite launchers and desktop apps</dt><dd><CountUp to={PRODUCTS.length} /></dd></div>
          <div><dt>Dialogs and states listed</dt><dd><CountUp to={ALL.length} /></dd></div>
          <div><dt>Tools with a guided walkthrough</dt><dd><CountUp to={guided} /></dd></div>
          <div><dt>Listed but not simulated</dt><dd><CountUp to={referenceOnly} /></dd></div>
        </dl>
        <div className="coverage-notes">
          <h2>What is not covered yet</h2>
          <ul>
            <li>Confirmations, message dialogs and empty states are counted per tool from its own project. Messages raised from shared code are not attributed to a tool, so a count is a minimum. They are not simulated one by one; a walkthrough shows the states its sample task passes through.</li>
            <li>ArchiTECH I3D, ArchiTECH Assistant and the ArchiTECH MCP Connector for Revit are inventoried from their layout sources. Panels marked “Inventoried, not simulated” exist in the application but not in the browser walkthrough. The Rhino, SketchUp, AutoCAD and Blender connectors have not been inspected for a window of their own.</li>
            <li>Commands without a dialog work through Revit prompts and messages. Those are described from the tool’s own text, not captured.</li>
            {hiddenEntries.length > 0 && <li>Hidden ribbon entries without a page of their own: {hiddenEntries.join('; ')}.</li>}
            {uncatalogued.length > 0 && <li>Installed ribbon buttons without a page here: {uncatalogued.map((b) => `${b.name} (${b.tab} › ${b.panel})`).join(', ')}.</li>}
            <li>The ribbon check is a read-only snapshot of one Revit {ribbon.revit} installation taken on {ribbon.snapshot}. It confirms a button exists, not that a command ran.</li>
          </ul>
        </div>
        <div className="coverage-tools">
          <div className="demo-filter" role="group" aria-label="Filter by suite">
            {[{ id: '', short: 'All' }, ...SUITES].map((item) => <button type="button" key={item.id} aria-pressed={item.id === suite} onClick={() => setSuite(item.id)}>{item.id === 'ai' ? 'MCP Connector' : item.short}</button>)}
          </div>
          <label className="coverage-search"><Search size={17} aria-hidden="true" /><input type="search" aria-label="Search tools and dialogs" placeholder="Search tools and dialogs" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={download}><Download size={15} /> Download CSV</button>
        </div>
        <p className="coverage-count" role="status">{rows.length} rows · {tools} tools</p>
        <div className="coverage-scroll" tabIndex={0} role="region" aria-label="Dialog coverage matrix">
          <table className="coverage-table">
            <thead><tr><th>Suite</th><th>Tool</th><th>Dialog or state</th><th>Source reference</th><th>Walkthrough</th><th>Verification</th></tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const first = i === 0 || rows[i - 1].slug !== r.slug
                return (
                  <tr key={r.slug + i} className={first ? 'first' : ''}>
                    <td>{first && r.suite}</td>
                    <th scope="row">{first && <Link to={'/plugins/' + r.slug}>{r.tool}</Link>}</th>
                    <td>{r.state}{r.tabs && <small>{r.tabs}</small>}</td>
                    <td className="mono">{r.source}</td>
                    <td>{r.demo && (Object.values(FORMAT) as string[]).includes(r.walkthrough) ? <Link to={'/demos/' + r.demo}>{r.walkthrough}</Link> : r.walkthrough}</td>
                    <td>{r.checks.map((c) => <span key={c} className={/Not |not |one theme|Shown only/.test(c) ? 'gap' : ''}>{c}</span>)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
