import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Search } from 'lucide-react'
import { NOT_SHOWN, PRODUCTS, STATS } from '../data/catalog'
import { SUITES, suiteById } from '../data/suites'
import installed from '../data/installedRibbon.generated.json'
import type { Product } from '../data/types'
import { CountUp } from '../components/motion'
import './coverage.css'

// One row per dialog picture on the site, with what backs it. Nothing here is typed by hand:
// it is derived from the catalogue, the dialog inventory mapping (scripts/build-dialogs.py)
// and a read-only snapshot of the installed Revit ribbon.
interface Row { suite: string; suiteId: string; tool: string; slug: string; demo?: string; id: string; dialog: string; state: string; kind: string; source: string; themes: string; gap?: boolean }

const ribbon = installed as { snapshot: string; revit: string; alias: Record<string, string>; hidden: Record<string, string>; tabs: Record<string, { name: string; panel: string }[]> }
const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '')
const buttonFor = (p: Product) => ribbon.tabs[p.suite]?.find((b) => norm(b.name) === norm(ribbon.alias[p.slug] ?? p.name))
const matched = new Set(PRODUCTS.map(buttonFor))
const unmatched = Object.entries(ribbon.tabs).flatMap(([suite, buttons]) => buttons.filter((b) => !matched.has(b)).map((b) => ({ ...b, tab: suiteById(suite as Product['suite']).name })))
// Hidden ribbon entries open a tool that already has a page (a split-button member or one tab of a window).
const hiddenEntries = unmatched.filter((b) => ribbon.hidden[b.name]).map((b) => `${b.name} opens ${PRODUCTS.find((p) => p.slug === ribbon.hidden[b.name])?.name}`)
const uncatalogued = unmatched.filter((b) => !ribbon.hidden[b.name])
const SCREENSHOT = 'Screenshot of the installed build'
const RENDER = 'Rendered from its own window, sample data'

function rowsFor(p: Product): Row[] {
  const base = { suite: suiteById(p.suite).name, suiteId: p.suite, tool: p.name, slug: p.slug, demo: p.demo }
  if (!p.dialogs.length) return [{ ...base, id: '', dialog: 'No dialog picture', state: '', kind: '', source: p.media?.length ? 'Product captures on its page' : 'Product description only', themes: '', gap: true }]
  return p.dialogs.map((d) => ({
    ...base, id: d.id, dialog: d.title, state: d.state === d.title ? '' : d.state, kind: d.kind,
    source: d.real ? SCREENSHOT : RENDER, themes: d.light ? 'Dark and Light' : 'Dark',
  }))
}

const ALL = PRODUCTS.flatMap(rowsFor)
const withoutPictures = PRODUCTS.filter((p) => !p.dialogs.length)
const unreachable = NOT_SHOWN.filter((d) => d.why.startsWith('not reachable'))
const leftOut = NOT_SHOWN.filter((d) => !d.why.startsWith('Same capture') && !d.why.startsWith('not reachable'))
const toolName = (slug: string) => PRODUCTS.find((p) => p.slug === slug)?.name ?? slug
const csv = (rows: Row[]) => [['Suite', 'Tool', 'Inventory ID', 'Dialog', 'State', 'Kind', 'Source', 'Themes'], ...rows.map((r) => [r.suite, r.tool, r.id, r.dialog, r.state, r.kind, r.source, r.themes])]
  .map((line) => line.map((cell) => '"' + cell.replace(/"/g, '""') + '"').join(',')).join('\r\n')

export default function Coverage() {
  const [suite, setSuite] = useState('')
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return ALL.filter((r) => (!suite || r.suiteId === suite) && words.every((w) => (r.tool + ' ' + r.dialog + ' ' + r.state + ' ' + r.kind + ' ' + r.source).toLowerCase().includes(w)))
  }, [suite, query])
  const tools = new Set(rows.map((r) => r.slug)).size
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
            <h1>How the pictures were made</h1>
          </div>
          <p className="lead">Every dialog picture on the site, the tool it belongs to and where the picture comes from. Gaps are listed, not hidden.</p>
        </header>
        <dl className="coverage-summary">
          <div><dt>Dialogs shown, across {STATS.demos} products</dt><dd><CountUp to={STATS.dialogs} /></dd></div>
          <div><dt>Pictures, counting each dialog state</dt><dd><CountUp to={STATS.views} /></dd></div>
          <div><dt>Screenshots of the installed build</dt><dd><CountUp to={STATS.screenshots} /></dd></div>
          <div><dt>Pictures also shown in the Light theme</dt><dd><CountUp to={STATS.light} /></dd></div>
        </dl>
        <div className="coverage-notes">
          <h2>What is not covered</h2>
          <ul>
            <li>A picture is either a screenshot of the installed build, or the product’s own window and message code rendered outside Revit with sample data. No dialog on this site is redrawn by hand.</li>
            <li>Operating-system file pickers, selection prompts on the Revit canvas, and start-up or generic error messages are left out.</li>
            {unreachable.length > 0 && <li>{unreachable.length} inventoried dialogs have no picture because the current build no longer opens them: {unreachable.map((d) => `${toolName(d.slug)} (${d.title})`).join(', ')}.</li>}
            {leftOut.length > 0 && <li>{leftOut.length} dialogs are left out on purpose: {leftOut.map((d) => `${toolName(d.slug)} ${d.id} (${d.why})`).join('; ')}.</li>}
            {withoutPictures.length > 0 && <li>No dialog picture yet for: {withoutPictures.map((p) => p.name).join(', ')}.</li>}
            {hiddenEntries.length > 0 && <li>Hidden ribbon entries without a page of their own: {hiddenEntries.join('; ')}.</li>}
            {uncatalogued.length > 0 && <li>Installed ribbon buttons without a page here: {uncatalogued.map((b) => `${b.name} (${b.tab} › ${b.panel})`).join(', ')}.</li>}
            <li>The ribbon check is a read-only snapshot of one Revit {ribbon.revit} installation taken on {ribbon.snapshot}. It confirms a button exists, not that a command ran.</li>
          </ul>
        </div>
        <div className="coverage-tools">
          <div className="demo-filter" role="group" aria-label="Filter by suite">
            {[{ id: '', short: 'All' }, ...SUITES].map((item) => <button type="button" key={item.id} aria-pressed={item.id === suite} onClick={() => setSuite(item.id)}>{item.id === 'ai' ? 'AI and MCP' : item.short}</button>)}
          </div>
          <label className="coverage-search"><Search size={17} aria-hidden="true" /><input type="search" aria-label="Search tools and dialogs" placeholder="Search tools and dialogs" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={download}><Download size={15} /> Download CSV</button>
        </div>
        <p className="coverage-count" role="status">{rows.length} rows, {tools} tools</p>
        <div className="coverage-scroll" tabIndex={0} role="region" aria-label="Dialog coverage matrix">
          <table className="coverage-table">
            <thead><tr><th>Suite</th><th>Tool</th><th>Dialog</th><th>Kind</th><th>Source</th><th>Themes</th></tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const first = i === 0 || rows[i - 1].slug !== r.slug
                return (
                  <tr key={r.slug + i} className={first ? 'first' : ''}>
                    <td>{first && r.suite}</td>
                    <th scope="row">{first && <Link to={r.demo ? '/demos/' + r.demo : '/plugins/' + r.slug}>{r.tool}</Link>}</th>
                    <td>{r.dialog}{r.state && <small>{r.state}</small>}</td>
                    <td>{r.kind}</td>
                    <td><span className={r.gap ? 'gap' : ''}>{r.source}</span></td>
                    <td>{r.themes}</td>
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
