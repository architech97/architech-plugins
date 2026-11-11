import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Play, Search, X } from 'lucide-react'
import { demoById, demoForProduct } from '../demo/registry'
import { DemoPlayer } from '../demo/DemoPlayer'
import type { DemoDefinition } from '../demo/types'
import { PRODUCTS, productBySlug, searchText } from '../data/catalog'
import { FEATURED_TOOLS } from '../data/featured'
import { SUITES, suiteById } from '../data/suites'
import { DEMO_PROJECT, PROJECT_WORKFLOW } from '../data/demoProject'
import { ROOMS, SHEETS, WARNINGS } from '../demo/sample'
import { asset } from '../components/Brand'
import { NativeEvidence, type NativeEvidenceConfig } from '../components/NativeEvidence'
import { ProductThumb } from '../components/ProductCard'
import { Reveal } from '../components/Layout'
import NotFound from './NotFound'
import './demos.css'
import './pages-v2.css'

const entries = PRODUCTS.flatMap((product) => {
  const demo = demoForProduct(product.slug)
  return demo ? [{ product, demo }] : []
})
const demoFormats = {
  crafted: { label: 'Guided walkthrough', detail: 'Complete a specific BIM task with step-by-step checks.' },
  replica: { label: 'Dialog explorer', detail: 'Explore a reconstruction of the Revit dialog with sample records.' },
  workflow: { label: 'Workflow simulation', detail: 'Try a representative command, desktop workflow or connector interaction on sample data.' },
} satisfies Record<DemoDefinition['kind'], { label: string; detail: string }>
const labelFor = (demo: DemoDefinition) => demoFormats[demo.kind].label
const NATIVE_EVIDENCE: Partial<Record<'architech-i3d' | 'architech-assistant' | 'revit-mcp', NativeEvidenceConfig>> = {
  'architech-i3d': {
    title: 'Installed desktop build',
    context: 'Both captures come from one chair-mesh session in the installed Windows app.',
    build: 'ArchiTECH-I3D Desktop 0.6.38',
    captures: [
      {
        title: 'Material workspace',
        src: 'media/native/i3d-material.webp',
        alt: 'I3D Material stage showing a textured chair and mesh-budget settings',
        note: 'The Material workspace shows the chair with its texture and the mesh-budget settings used to prepare the asset.',
      },
      {
        title: 'Revit export setup',
        src: 'media/native/i3d-result.webp',
        alt: 'I3D Result stage showing Revit family RFA selected as the export format',
        note: 'The Result stage shows the chair ready to export with Revit family (.rfa) selected.',
      },
    ],
  },
  'architech-assistant': {
    title: 'Installed desktop build',
    context: 'The installed Windows app is shown with a saved read-only exchange and its composer modes.',
    build: 'Assistant 1.0.5',
    captures: [
      {
        title: 'Active view readback',
        src: 'media/native/assistant-result.webp',
        alt: 'Assistant conversation with a saved question about the active view and the response that it is Cover',
        note: 'In the saved exchange, Assistant answers “What is the active view?” with “The active view is Cover.”',
      },
      {
        title: 'Composer modes',
        src: 'media/native/assistant-modes.webp',
        alt: 'Assistant desktop composer showing its Ask, Search and Build modes',
        note: 'The composer offers Ask, Search and Build modes.',
      },
    ],
  },
  'revit-mcp': {
    title: 'Installed Revit connector',
    context: 'The installed connector was used in Revit 2024 to read the active sheet in Autodesk’s Snowdon Towers sample.',
    build: 'Revit MCP Connector 2.2.3',
    captures: [
      {
        title: 'Connector ready',
        src: 'media/native/revit-mcp-connector.webp',
        alt: 'ArchiTECH Revit MCP Connector showing Revit 2024 with the bridge running and a model open',
        note: 'The connector reports that it is ready for MCP clients. The activity panel is empty in this capture.',
      },
      {
        title: 'Cover sheet readback',
        src: 'media/native/revit-mcp-cover.webp',
        alt: 'Revit 2024 displaying sheet G000 Cover of the Autodesk Snowdon Towers sample project',
        note: 'The read-only get_current_view_info call returned Name=Cover, ViewType=DrawingSheet, SheetNumber=G000, SheetName=Cover and IsSheet=true.',
      },
    ],
  },
}
const indexNumber = (i: number) => String(i + 1).padStart(2, '0')

/** Three real tools, one per Revit suite, shown with their own windows. */
function FeaturedTiles() {
  return (
    <ul className="demo-tiles" aria-label="One tool from each Revit suite">
      {FEATURED_TOOLS.map((tool) => (
        <li key={tool.slug}><Link to={'/demos/' + tool.slug}>
          <span className="demo-tile-art"><img src={asset(tool.preview)} alt={tool.alt} decoding="async" /></span>
          <span className="demo-tile-copy"><small>{tool.suite}</small><strong>{tool.title}</strong><span>{tool.task}</span></span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link></li>
      ))}
    </ul>
  )
}

function ProjectBoard() {
  const [selected, setSelected] = useState(0)
  const [running, setRunning] = useState(false)
  const workspace = useRef<HTMLElement>(null)
  const previewAction = useRef<HTMLButtonElement>(null)
  const step = PROJECT_WORKFLOW[selected]
  const previous = PROJECT_WORKFLOW[selected - 1]
  const next = PROJECT_WORKFLOW[selected + 1]
  const demo = demoById(step.id)!
  const product = productBySlug(demo.productSlug)!
  const preview = product.dialogs[0]?.dark
  useEffect(() => {
    if (running) {
      workspace.current?.focus({ preventScroll: true })
      workspace.current?.scrollIntoView({ block: 'start' })
    }
  }, [running, selected])
  const closeWorkspace = () => {
    setRunning(false)
    previewAction.current?.focus()
  }

  return (
    <section className="wrap project-board" id="sample-project" tabIndex={-1} aria-labelledby="sample-project-title">
      <div className="demo-section-title">
        <h2 id="sample-project-title">{DEMO_PROJECT.name}, <em>four tasks</em></h2>
        <p>Work through four guided BIM tasks using fictional project records. Each task starts from its own fixture, so edits are local to that demo.</p>
      </div>
      <dl className="project-metadata">
        <div><dt>Project</dt><dd>{DEMO_PROJECT.code}</dd></div>
        <div><dt>Issue</dt><dd>{DEMO_PROJECT.revision} · {DEMO_PROJECT.stage}</dd></div>
        <div><dt>Rooms</dt><dd>{ROOMS.length}</dd></div>
        <div><dt>Drawing sheets</dt><dd>{SHEETS.length}</dd></div>
        <div><dt>Warning groups</dt><dd>{WARNINGS.length}</dd></div>
        <div><dt>Units</dt><dd>{DEMO_PROJECT.units}</dd></div>
      </dl>
      <div className="project-workbench">
        <div className="project-stops" role="group" aria-label="Sample project workflow">
          {PROJECT_WORKFLOW.map((item, i) => (
            <button type="button" key={item.id} aria-pressed={i === selected} onClick={() => setSelected(i)}>
              <span className="project-stop-index">{indexNumber(i)}</span>
              <span><small>{item.phase}</small><strong>{item.title}</strong></span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="project-preview">
          <div className="project-preview-visual" key={step.id}>
            {preview && <><img src={asset(preview)} alt="" loading="lazy" decoding="async" /><span>Revit dialog reference</span></>}
          </div>
          <div className="project-preview-copy">
            <div><p className="demo-kicker">Task {indexNumber(selected)} of {indexNumber(PROJECT_WORKFLOW.length - 1)} <span /> {product.name}</p><h3>{step.title}</h3><p>{step.detail}</p></div>
            <button ref={previewAction} className="demo-button" type="button" onClick={() => running ? closeWorkspace() : setRunning(true)} aria-expanded={running} aria-controls={running ? 'project-workspace' : undefined}>{running ? <X size={15} /> : <Play size={15} />} {running ? 'Close walkthrough' : 'Start walkthrough'}</button>
          </div>
        </div>
      </div>
      {running && (
        <section className="project-workspace" id="project-workspace" ref={workspace} tabIndex={-1} aria-label={demo.title}>
          <header>
            <div><p className="demo-kicker">{DEMO_PROJECT.code} / {indexNumber(selected)} of {indexNumber(PROJECT_WORKFLOW.length - 1)} / {step.phase}</p><h3>{demo.title}</h3></div>
            <Link to={'/demos/' + demo.id} className="demo-text-link">Open dedicated page <ArrowUpRight size={15} /></Link>
          </header>
          <DemoPlayer key={demo.id} demo={demo} />
          <nav className="project-progression" aria-label="Sample project tasks">
            {previous ? <button className="demo-text-link" type="button" onClick={() => setSelected(selected - 1)}><ArrowLeft size={15} /> Previous · {previous.title}</button> : <span>{DEMO_PROJECT.name} · {DEMO_PROJECT.code}</span>}
            {next ? <button className="demo-button" type="button" onClick={() => setSelected(selected + 1)}>Next · {next.title} <ArrowRight size={15} /></button> : <button className="demo-button" type="button" onClick={closeWorkspace}>Back to project board <ArrowRight size={15} /></button>}
          </nav>
        </section>
      )}
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
  const format = params.get('format') ?? ''
  const query = params.get('q') ?? ''
  const term = query.trim().toLowerCase()
  const words = term.split(/\s+/).filter(Boolean)
  const relevant = entries.filter(({ product, demo }) => {
    const featuredName = FEATURED_TOOLS.find(tool => tool.slug === product.slug)?.title
    const text = [searchText(product), suiteById(product.suite).name, demo.title, demo.summary, featuredName].join(' ').toLowerCase()
    return words.every((word) => text.includes(word))
  })
  const matching = relevant.filter(({ demo }) => !format || demo.kind === format)
  const groups = SUITES.filter((item) => !suite || item.id === suite).map((item) => ({
    ...item,
    demos: matching.filter(({ product }) => product.suite === item.id),
  }))
  const count = groups.reduce((total, group) => total + group.demos.length, 0)
  const quickMatches = term ? matching.filter(({ product }) => !suite || product.suite === suite).sort((a, b) => {
    const score = (name: string) => name.toLowerCase() === term ? 0 : name.toLowerCase().startsWith(term) ? 1 : name.toLowerCase().includes(term) ? 2 : 3
    return score(a.product.name) - score(b.product.name)
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
      <section className="demo-opening" aria-labelledby="demo-library-title">
        <div className="wrap demo-opening-grid">
          <div className="demo-opening-copy">
            <h1 id="demo-library-title">Open a tool. <em>Use it.</em></h1>
            <p className="demo-intro">{entries.length} walkthroughs of my Revit and CAD tools. Each one runs in this page on sample data, with nothing to install.</p>
            <form className="demo-quick-search" role="search" aria-label="Quick demo lookup" onSubmit={(event) => { event.preventDefault(); navigate(indexLocation); focusIndex() }}>
              <DemoSearch input={quickSearch} label="Quick demo search" value={query} onChange={(value) => filter('q', value)} shortcut />
            </form>
            {term && (
              <div className="demo-quick-results">
                <p>{count ? `${count} matching ${count === 1 ? 'demo' : 'demos'}` : 'No matches with the current filters.'}</p>
                {quickMatches.length > 0 && <ul>{quickMatches.map(({ product, demo }) => <li key={demo.id}><Link to={`/demos/${demo.id}`} state={libraryState}><strong>{product.name}</strong><span>{labelFor(demo)}</span><ArrowRight size={15} aria-hidden="true" /></Link></li>)}</ul>}
              </div>
            )}
            <div className="demo-opening-actions">
              <Link to={indexLocation} className="demo-button" onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) focusIndex() }}>{term ? 'View search results' : `Browse ${entries.length} demos`} <ArrowDown size={16} /></Link>
              <a href="#sample-project" className="demo-text-link"><Play size={15} /> Start the sample project</a>
            </div>
          </div>
          <FeaturedTiles />
        </div>
      </section>

      <ProjectBoard />

      <section ref={index} className="wrap demo-index" id="demo-index" aria-labelledby="demo-index-title">
        <div className="demo-section-title">
          <h2 id="demo-index-title">All {entries.length} <em>walkthroughs</em></h2>
          <DemoSearch input={indexSearch} label="Search demos" value={query} onChange={(value) => filter('q', value)} />
        </div>
        <div className="demo-filter" role="group" aria-label="Filter demos by suite">
          {[{ id: '', short: 'All demos' }, ...SUITES.map((item) => ({ ...item, short: item.id === 'ai' ? 'AI & MCP' : item.short }))].map((item) => (
            <button type="button" key={item.id} aria-pressed={item.id === suite} onClick={() => filter('suite', item.id)}>
              {item.short}<small>{item.id ? matching.filter(({ product }) => product.suite === item.id).length : matching.length}</small>
            </button>
          ))}
        </div>
        <div className="demo-index-tools">
          <p className="demo-match" role="status">{count} {count === 1 ? 'demo' : 'demos'}{query.trim() && ` for “${query.trim()}”`}</p>
          <div className="demo-format-tabs" role="group" aria-label="Demo format">
            {([['', 'All formats'], ...(Object.keys(demoFormats) as DemoDefinition['kind'][]).map((kind) => [kind, demoFormats[kind].label])] as [string, string][]).map(([kind, label]) => (
              <button type="button" key={kind} aria-pressed={format === kind} title={kind ? demoFormats[kind as DemoDefinition['kind']].detail : undefined} onClick={() => filter('format', kind)}>{label}</button>
            ))}
          </div>
        </div>
        <details className="demo-format-help">
          <summary>Compare demo formats</summary>
          <dl>{Object.values(demoFormats).map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.detail}</dd></div>)}</dl>
        </details>
        {count === 0 && <div className="demo-empty"><h3>No matching demos</h3><p>Try a plugin name, host application or task.</p><button type="button" className="demo-button" onClick={() => replaceFilters(new URLSearchParams())}>Clear filters</button></div>}
        {groups.filter((group) => group.demos.length).map((group) => (
          <div key={group.id} className="demo-group">
            <div className="demo-group-label"><b>{group.demos.length}</b><h3>{group.name}</h3><p>{group.focus}</p></div>
            <ul className="demo-cards">
              {group.demos.map(({ product, demo }, i) => (
                <Reveal as="li" key={demo.id} delay={(i % 3) * 60}>
                  <Link to={`/demos/${demo.id}`} state={libraryState}>
                    <ProductThumb p={product} />
                    <span className="demo-card-format" data-format={demo.kind}>{labelFor(demo)}</span>
                    <strong>{product.name}</strong>
                    <span className="demo-card-summary">{demo.summary}</span>
                    <span className="demo-card-go">Open demo <ArrowRight size={15} aria-hidden="true" /></span>
                  </Link>
                </Reveal>
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
  const demo = demoById(id)
  if (!demo) return <NotFound />
  const product = productBySlug(demo.productSlug)
  const evidence = demo.id === 'architech-i3d' || demo.id === 'architech-assistant' || demo.id === 'revit-mcp' ? NATIVE_EVIDENCE[demo.id] : undefined
  const sequence = PROJECT_WORKFLOW.findIndex((step) => step.id === demo.id)
  const next = sequence >= 0 ? PROJECT_WORKFLOW[sequence + 1] : undefined
  const player = <DemoPlayer key={demo.id} demo={demo} />
  return (
    <div className="demo-detail">
      <header className="demo-detail-header">
        <div className="wrap-wide">
          <Link to={{ pathname: '/demos', search: librarySearch, hash: '#demo-index' }} className="demo-text-link"><ArrowLeft size={16} /> Demo library</Link>
          <div className="demo-detail-title">
            <div>
              <p className="demo-kicker">{demo.ribbon.tab} <span /> {evidence ? 'Native captures and browser exercise' : labelFor(demo)}</p>
              <h1>{evidence ? (product?.name ?? demo.ribbon.tab) : demo.title}</h1>
              {evidence ? <p>View captures from the installed build, then try a separate browser exercise on sample data.</p> : <>
                <p>{demo.summary}</p>
                <p className="demo-detail-format">{demoFormats[demo.kind].detail}</p>
              </>}
            </div>
            {product && <div className="demo-detail-links">
              <Link className="demo-text-link" to={`/plugins/${product.slug}`}>Product details <ArrowUpRight size={16} /></Link>
              {(product.dialogs.length > 0 || product.media?.length) && <Link className="demo-text-link" to={`/plugins/${product.slug}#dialog-reference`}>View {product.dialogs.length ? 'dialog layouts' : 'desktop visuals'} <ArrowUpRight size={16} /></Link>}
            </div>}
          </div>
        </div>
      </header>
      <div className="wrap-wide demo-detail-body">
        {evidence ? <>
          <NativeEvidence key={demo.id} {...evidence} />
          <section id="browser-exercise" className="native-browser-exercise" tabIndex={-1} aria-labelledby="browser-exercise-title">
            <header>
              <div>
                <p className="demo-kicker">Browser exercise <span /> Sample data</p>
                <h2 id="browser-exercise-title">{demo.title}</h2>
                <p>{demo.summary}</p>
              </div>
              <a className="demo-text-link" href="#native-build">Back to native captures <ArrowUpRight size={16} aria-hidden="true" /></a>
            </header>
            {player}
          </section>
        </> : player}
        {sequence >= 0 && (
          <div className="demo-project-next">
            <div><p className="demo-kicker">{DEMO_PROJECT.code} / {PROJECT_WORKFLOW[sequence].phase} / {indexNumber(sequence)} of {PROJECT_WORKFLOW.length}</p><strong>{DEMO_PROJECT.name}</strong></div>
            {next
              ? <Link to={'/demos/' + next.id}>Next · {next.title} <ArrowRight size={16} /></Link>
              : <Link to="/demos#sample-project">Back to the project board <ArrowRight size={16} /></Link>}
          </div>
        )}
        <details className="demo-basis">
          <summary>About this simulation</summary>
          <p>{demo.basis.join(' ')}</p>
        </details>
      </div>
    </div>
  )
}

export default function DemoRoute() {
  const { id } = useParams()
  return id ? <DemoPage /> : <DemoHub />
}
