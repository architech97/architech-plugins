import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Search, X } from 'lucide-react'
import { PRODUCTS, STATS, productByDemo, productBySlug, searchText } from '../data/catalog'
import type { Product } from '../data/types'
import { FEATURED_TOOLS } from '../data/featured'
import { suiteById } from '../data/suites'
import { PROJECT_WORKFLOW } from '../data/demoProject'
import { DialogGallery } from '../components/DialogGallery'
import { thumbProps } from '../components/dialogImage'
import NotFound from './NotFound'
import './demos.css'

const entries = PRODUCTS.filter((product) => product.demo)
const dialogCount = (p: Product) => new Set(p.dialogs.map((d) => d.id)).size
const countLabel = (p: Product) => { const n = dialogCount(p); return n + (n === 1 ? ' dialog' : ' dialogs') }
const indexNumber = (i: number) => String(i + 1).padStart(2, '0')

/** The demo index is grouped by the job a tool does. Panels are the tools' own ribbon panels. */
const JOBS: { id: string; title: string; match: (p: Product) => boolean }[] = [
  { id: 'publish', title: 'Publish a set', match: (p) => p.suite === 'folio' && ['Sheets', 'Publish', 'Schedules', 'Views', 'View Templates'].includes(p.panel) },
  { id: 'annotate', title: 'Annotate and dimension', match: (p) => p.suite === 'folio' && ['Annotation', 'Detailing'].includes(p.panel) },
  { id: 'rooms', title: 'Finish rooms', match: (p) => p.suite === 'forge' && ['Rooms', 'Finishes'].includes(p.panel) },
  { id: 'data', title: 'Manage parameters', match: (p) => p.suite === 'forge' && p.panel === 'Parameters' },
  { id: 'scan', title: 'Model from a scan', match: (p) => p.suite === 'forge' && p.panel === 'Scan to BIM' },
  { id: 'fix', title: 'Fix the model', match: (p) => p.suite === 'sentinel' && ['Model Health', 'Clean Up', 'Standards'].includes(p.panel) },
  { id: 'coordinate', title: 'Coordinate with consultants', match: (p) => p.suite === 'sentinel' && ['Coordination', 'Links'].includes(p.panel) },
  { id: 'beyond', title: 'Beyond the ribbon', match: (p) => p.suite === 'i3d' || p.suite === 'ai' },
  { id: 'start', title: 'Browse a suite', match: (p) => p.panel === 'Start' },
  { id: 'other', title: 'Other tools', match: () => true },
]
const jobOf = (p: Product) => JOBS.find((job) => job.match(p))!.id
// The one place the dialog count is explained.
const INDEX_NOTE = `${STATS.views} pictures of ${STATS.dialogs} windows from ${entries.length} products. ${STATS.screenshots} are screenshots of the installed tools; the rest are each tool’s own window, rendered with sample data.`

/** One of the tools' real windows, in place of an illustration. */
function HeroWindow() {
  const product = productBySlug('room-to-finishes') ?? PRODUCTS.find((p) => p.dialogs.length)!
  const shot = product.dialogs[0]
  return (
    <Link className="drawing-stage hero-window" to={'/demos/' + product.demo}>
      <figcaption><span>{product.name}</span><span>Real window, sample data</span></figcaption>
      <img {...thumbProps(shot.dark)} alt={product.name + ' main window'} decoding="async" />
    </Link>
  )
}

function ProjectBoard() {
  const [selected, setSelected] = useState(0)
  const step = PROJECT_WORKFLOW[selected]
  const product = productByDemo(step.id)!
  return (
    <section className="wrap project-board" data-continuity-bg="paper-2" id="sample-project" tabIndex={-1} aria-labelledby="sample-project-title">
      <div className="demo-section-title">
        <div><h2 id="sample-project-title">One drawing set, four tools</h2></div>
        <p>From rooms to a reviewed set. Pick a step to see the windows that tool opens.</p>
      </div>
      <div className="project-workbench">
        <div className="project-stops" role="group" aria-label="Drawing set workflow">
          {PROJECT_WORKFLOW.map((item, i) => (
            <button type="button" key={item.id} aria-pressed={i === selected} onClick={() => setSelected(i)}>
              <span className="project-stop-index">{indexNumber(i)}</span>
              <span><small>{item.phase}</small><strong>{item.title}</strong></span>
            </button>
          ))}
        </div>
        <div className="project-preview">
          <div className="project-preview-copy">
            <div><h3>{product.name}</h3><p>{step.detail}</p></div>
            <Link className="demo-text-link" to={'/demos/' + step.id}>All {countLabel(product)} <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          <div className="project-preview-gallery"><DialogGallery key={step.id} product={product} ratio={1.5} /></div>
        </div>
      </div>
    </section>
  )
}

function DemoSearch({ input, label, value, onChange, shortcut }: {
  input: RefObject<HTMLInputElement | null>
  label: string
  value: string
  onChange: (value: string) => void
  shortcut?: boolean
}) {
  return (
    <div className="demo-search">
      <Search size={19} aria-hidden="true" />
      <input ref={input} type="search" aria-label={label} aria-keyshortcuts={shortcut ? 'Control+K Meta+K' : undefined} placeholder="Search tools, hosts or tasks" value={value} onChange={(event) => onChange(event.target.value)} />
      {value ? <button type="button" onClick={() => { onChange(''); input.current?.focus() }} aria-label="Clear search"><X size={18} /></button> : shortcut && <kbd aria-hidden="true">Ctrl / ⌘ K</kbd>}
    </div>
  )
}

export function DemoHub() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const quickSearch = useRef<HTMLInputElement>(null)
  const indexSearch = useRef<HTMLInputElement>(null)
  const index = useRef<HTMLElement>(null)
  const suite = params.get('suite') ?? ''
  const query = params.get('q') ?? ''
  const term = query.trim().toLowerCase()
  const words = term.split(/\s+/).filter(Boolean)
  const matching = entries.filter((product) => {
    const text = [searchText(product), suiteById(product.suite).name, ...product.dialogs.map((d) => d.title + ' ' + d.state)].join(' ').toLowerCase()
    return (!suite || product.suite === suite) && words.every((word) => text.includes(word))
  })
  const groups = JOBS.map((job) => ({ ...job, demos: matching.filter((product) => jobOf(product) === job.id) }))
  const count = groups.reduce((total, group) => total + group.demos.length, 0)
  const quickMatches = term ? [...matching].sort((a, b) => {
    const score = (name: string) => name.toLowerCase() === term ? 0 : name.toLowerCase().startsWith(term) ? 1 : name.toLowerCase().includes(term) ? 2 : 3
    return score(a.name) - score(b.name)
  }).slice(0, 3) : []
  const replaceFilters = (next: URLSearchParams) => navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace: true, preventScrollReset: true })
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    replaceFilters(next)
  }
  const indexLocation = { pathname: location.pathname, search: location.search, hash: '#demo-index' }
  const libraryState = { librarySearch: location.search }
  const focusIndex = () => {
    indexSearch.current?.focus({ preventScroll: true })
    index.current?.scrollIntoView({ block: 'start' })
  }
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== 'k') return
      event.preventDefault()
      quickSearch.current?.focus()
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  return (
    <div className="demo-library">
      <section className="demo-opening" data-continuity-bg="paper" aria-labelledby="demo-library-title">
        <div className="wrap demo-opening-grid">
          <div className="demo-opening-copy">

            <h1 id="demo-library-title">Every dialog, <span>as built</span></h1>
            <p className="demo-intro">Main windows, confirmations, progress and results for each tool, as they open in Revit.</p>
            <form className="demo-quick-search" role="search" aria-label="Quick tool lookup" onSubmit={(event) => { event.preventDefault(); navigate(indexLocation); focusIndex() }}>
              <DemoSearch input={quickSearch} label="Quick tool search" value={query} onChange={(value) => filter('q', value)} shortcut />
            </form>
            {term && (
              <div className="demo-quick-results">
                <p>{count ? `${count} matching ${count === 1 ? 'tool' : 'tools'}` : 'No matches with the current filters.'}</p>
                {quickMatches.length > 0 && <ul>{quickMatches.map((product) => <li key={product.slug}><Link to={`/demos/${product.demo}`} state={libraryState}><strong>{product.name}</strong><span>{countLabel(product)}</span></Link></li>)}</ul>}
              </div>
            )}
            <div className="demo-opening-actions">
              <Link to={indexLocation} className="demo-button" onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) focusIndex() }}>{term ? 'View search results' : `Browse ${STATS.dialogs} dialogs`}</Link>
              <a href="#sample-project" className="demo-text-link">Follow one drawing set</a>
            </div>
            <p className="demo-footnote">Screenshots and renders with sample data</p>
          </div>
          <div className="demo-hero-window"><HeroWindow /></div>
        </div>
      </section>

      <ProjectBoard />

      <section className="wrap demo-featured-large" data-continuity-bg="paper" aria-labelledby="featured-demos-title">
        <div className="demo-section-title"><div><h2 id="featured-demos-title">One tool from each Revit suite</h2></div></div>
        <ul className="demo-feature-grid">
          {FEATURED_TOOLS.map((tool) => {
            const product = productBySlug(tool.slug)
            const shot = product?.dialogs[0]
            return <li key={tool.slug}><Link to={'/demos/' + tool.slug} state={libraryState}>
              <span className="demo-feature-shot">{shot && <img {...thumbProps(shot.dark)} alt="" loading="lazy" decoding="async" />}</span>
              <strong>{tool.title}</strong>
              <span className="demo-card-meta">{tool.suite}</span>
              <span className="demo-feature-task">{tool.task}. {tool.description}</span>
              <span className="demo-card-go">See its {product ? countLabel(product) : 'dialogs'}</span>
            </Link></li>
          })}
        </ul>
      </section>

      <section ref={index} className="wrap demo-index" data-continuity-bg="paper" id="demo-index" aria-labelledby="demo-index-title">
        <div className="demo-section-title">
          <div><h2 id="demo-index-title">Find a tool</h2></div>
          <DemoSearch input={indexSearch} label="Search tools and dialogs" value={query} onChange={(value) => filter('q', value)} />
        </div>
        <p className="demo-index-note">{INDEX_NOTE}</p>
        <div className="demo-index-tools">
          <p className="demo-match" role="status">{count} {count === 1 ? 'tool' : 'tools'}{query.trim() && ` for “${query.trim()}”`}</p>
        </div>
        {count === 0 && <div className="demo-empty"><h3>No matching tools</h3><p>Try a plugin name, host application or task.</p><button type="button" className="demo-button" onClick={() => replaceFilters(new URLSearchParams())}>Clear filters</button></div>}
        {groups.filter((group) => group.demos.length).map((group) => (
          <div key={group.id} className="demo-group">
            <div className="demo-group-label"><h3>{group.title}</h3><p>{group.demos.length} {group.demos.length === 1 ? 'tool' : 'tools'}</p></div>
            <ul className="demo-tiles-grid">
              {group.demos.map((product) => (
                <li key={product.slug}>
                  <Link to={`/demos/${product.demo}`} state={libraryState} title={product.tagline}>
                    <span className="tile-shot"><img {...thumbProps(product.dialogs[0].dark)} alt="" loading="lazy" decoding="async" /></span>
                    <strong>{product.name}</strong>
                    <span className="demo-row-format">{suiteById(product.suite).short} · {countLabel(product)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}

export function DemoPage() {
  const { id = '' } = useParams()
  const { state } = useLocation()
  const librarySearch = typeof state?.librarySearch === 'string' ? state.librarySearch : ''
  const product = productByDemo(id)
  if (!product) {
    // A product without dialog pictures keeps its details page.
    const plain = productBySlug(id)
    return plain ? <Navigate to={'/plugins/' + plain.slug} replace /> : <NotFound />
  }
  const suite = suiteById(product.suite)
  const sequence = PROJECT_WORKFLOW.findIndex((step) => step.id === id)
  const next = sequence >= 0 ? PROJECT_WORKFLOW[sequence + 1] : undefined
  const screenshots = product.dialogs.filter((d) => d.real).length
  const renders = product.dialogs.length - screenshots
  return (
    <div className="demo-detail">
      <header className="demo-detail-header" data-continuity-bg="paper">
        <div className="wrap-wide">
          <Link to={{ pathname: '/demos', search: librarySearch, hash: '#demo-index' }} className="demo-text-link">All dialogs</Link>
          <div className="demo-detail-title">
            <div>
              <h1>{product.name}</h1>
              <p className="demo-detail-context">{suite.name}, {product.panel}, {countLabel(product)}{product.dialogs.length > dialogCount(product) ? ` in ${product.dialogs.length} pictures` : ''}</p>
              <p>{product.tagline}</p>
            </div>
            <div className="demo-detail-links">
              <Link className="demo-text-link" to={`/plugins/${product.slug}`}>Product details</Link>
            </div>
          </div>
        </div>
      </header>
      <div className="wrap-wide demo-detail-body" data-continuity-bg="paper">
        <DialogGallery key={product.slug} product={product} eager />
        {sequence >= 0 && (
          <div className="demo-project-next">
            <div><strong>One drawing set, four tools</strong><p className="demo-context">{PROJECT_WORKFLOW[sequence].phase}, step {sequence + 1} of {PROJECT_WORKFLOW.length}</p></div>
            {next
              ? <Link to={'/demos/' + next.id}>Next: {next.title}</Link>
              : <Link to="/demos#sample-project">Back to the four steps</Link>}
          </div>
        )}
        <details className="demo-basis">
          <summary>About these pictures</summary>
          <p>
            {screenshots > 0 && `${screenshots} ${screenshots === 1 ? 'picture is a screenshot' : 'pictures are screenshots'} of the installed build. `}
            {renders > 0 && `${renders} ${renders === 1 ? 'is' : 'are'} rendered from the product’s own window and message code with sample data. `}
            Project names and file paths are sample values. Operating-system file pickers and prompts on the Revit canvas are not dialogs of the tool and are not shown.
          </p>
        </details>
      </div>
    </div>
  )
}

export default function DemoRoute() {
  const { id } = useParams()
  return id ? <DemoPage /> : <DemoHub />
}
