import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Play, Search, X } from 'lucide-react'
import { demoById, demoForProduct } from '../demo/registry'
import { DemoPlayer } from '../demo/DemoPlayer'
import type { DemoDefinition } from '../demo/types'
import { PRODUCTS, STATS, productBySlug, searchText } from '../data/catalog'
import type { Product } from '../data/types'
import { FEATURED_TOOLS } from '../data/featured'
import { suiteById } from '../data/suites'
import { DEMO_PROJECT, PROJECT_WORKFLOW } from '../data/demoProject'
import { ROOMS, SHEETS, WARNINGS } from '../demo/sample'
import { asset } from '../components/Brand'
import { NativeEvidence, type NativeEvidenceConfig } from '../components/NativeEvidence'
import NotFound from './NotFound'
import './demos.css'

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
    build: 'ArchiTECH I3D Desktop 0.6.38',
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
// The one place the walkthrough count is explained.
const launchers = entries.filter(({ product }) => product.panel === 'Start').length
const outside = entries.filter(({ product }) => product.suite === 'i3d' || product.suite === 'ai').length
const toggles = entries.length - STATS.revitTools - launchers - outside
const INDEX_NOTE = `${entries.length} walkthroughs: the ${STATS.revitTools} Revit tools, ${launchers} suite launchers${toggles > 0 ? `, ${toggles} ribbon ${toggles === 1 ? 'toggle' : 'toggles'}` : ''} and ${outside} desktop apps and connectors.`

const viewNames = ['Plan', 'Assembly', 'Review'] as const
type View = typeof viewNames[number]
const drawingTasks: Record<View, { note: string; id: string; label: string }> = {
  Plan: { note: '01 / Room layout', id: 'room-to-view', label: 'Generate room views' },
  Assembly: { note: '02 / Floors, ceilings and linings', id: 'room-to-finishes', label: 'Review room finishes' },
  Review: { note: '03 / Model checks', id: 'warnings-inspector', label: 'Inspect warnings' },
}

function DrawingStage() {
  const [view, setView] = useState<View>('Assembly')
  return (
    <figure className="drawing-stage" data-view={view.toLowerCase()}>
      <figcaption><span>Workflow illustration</span><span>Concept geometry</span></figcaption>
      <div className="drawing-controls" role="group" aria-label="Drawing view">
        {viewNames.map((name, i) => (
          <button key={name} type="button" aria-pressed={view === name} onClick={() => setView(name)}>
            <small aria-hidden="true">{indexNumber(i)}</small>{name}
          </button>
        ))}
      </div>
      <div className="drawing-plate">
        <svg viewBox="0 0 620 380" role="img" aria-labelledby="drawing-title drawing-desc">
          <title id="drawing-title">{view} drawing</title>
          <desc id="drawing-desc">A concept pavilion shown as a floor plan, exploded assembly, or marked-up model. The demos use a separate fictional Sample Residence fixture.</desc>
          <defs>
            <pattern id="plate-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0v22" fill="none" stroke="var(--illustration-grid)" strokeOpacity=".24" /></pattern>
            <pattern id="plate-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(34)"><path d="M0 0v6" stroke="var(--illustration-hatch)" strokeOpacity=".5" /></pattern>
            <linearGradient id="roof-metal" x2="0" y2="1"><stop stopColor="var(--illustration-roof-top)" /><stop offset="1" stopColor="var(--illustration-roof-bottom)" /></linearGradient>
          </defs>
          <path fill="url(#plate-grid)" d="M21 17h578v347H21z" />
          <path className="plate-marks" d="M21 31V17h14m550 0h14v14m0 319v14h-14M35 364H21v-14" />
          <g className="plate-model" fill="none">
            <g className="plate-guides">
              <path d="M173 236V136m194 141V146M478 221V115M282 177V90M122 269l180-103m-23 192 245-139M128 241l254 129" />
              <path d="m115 273 4-9m153 88 11-2m244-129-10-3" />
            </g>
            <g className="plate-base">
              <path fill="var(--illustration-base)" d="m143 240 124-72 242 50-134 93z" />
              <path fill="var(--illustration-base-edge)" d="m143 240 232 71v13l-232-72zm232 71 134-93v13l-134 93z" />
              <path fill="var(--illustration-floor)" d="m167 239 107-62 204 44-111 73z" />
              <path d="m185 242 91-51 182 38m-239 23 91-52m-61 63 92-56m-55 67 91-59m-52 70 89-63m-213 4 189 46m-158-64 181 48m-148-69 174 47" strokeOpacity=".4" />
            </g>
            <g className="plate-walls">
              <path fill="var(--illustration-wall-light)" d="m173 236 109-59v-72l-109 58z" />
              <path fill="var(--illustration-wall-mid)" d="m282 177 196 44v-73l-196-43z" />
              <path fill="var(--illustration-wall-front)" d="m173 236 194 50v-72l-194-51z" />
              <path fill="var(--illustration-wall-side)" d="m367 286 111-65v-73l-111 66z" />
              <path fill="var(--illustration-opening)" d="m187 228 163 42v-48l-163-43zm192 38 87-51v-50l-87 50z" />
              <path d="m217 187v49m33-40v49m34-40v49m33-40v49m84-59v49m22-62v49m22-62v49" />
              <path d="m187 212 163 42m29-8 87-52" strokeOpacity=".65" />
            </g>
            <g className="plate-roof">
              <path fill="url(#roof-metal)" d="m155 160 125-69 218 47-127 76z" />
              <path fill="var(--illustration-roof-edge)" d="m155 160 216 54v9l-216-54zm216 54 127-76v9l-127 76z" />
              <path strokeOpacity=".63" d="m168 159 204 51m-186-61 202 52m-186-61 201 52m-185-61 200 51m-185-59 201 50m-186-59 200 50m-185-58 200 49m-185-58 198 49" />
            </g>
            <g className="plate-review">
              <path d="m367 252 99-12 40-37h62M218 232l-61 26h-53" />
              <circle cx="367" cy="252" r="4" /><circle cx="218" cy="232" r="4" />
              <text x="511" y="192">02 / GLAZING</text><text x="52" y="273">01 / LEVEL</text>
            </g>
          </g>
          <g className="plate-plan">
            <path className="plan-grid" d="M126 82h377m-377 222h377M151 65v259M290 65v259m172-259v259M126 201h377" />
            <path d="M151 92h311v203H151z" fill="var(--illustration-plan)" />
            <path d="M151 92h311v203H151zm139 0v61m0 43v99m0-139h68m42 0h62M151 222h73m41 0h25" strokeWidth="5" />
            <path d="M308 111h130v25H308zM168 245h46v33h-46zM175 114h70v55h-70z" fill="url(#plate-hatch)" />
            <path d="M290 195h-40a40 40 0 0 1 40-40m-66 67v36a36 36 0 0 0 37-36m99-66v40a40 40 0 0 0 40-40M151 318h311m-311-5v10m311-10v10M478 93v202m-5-202h10m-10 202h10" />
            <text x="188" y="196">LIVING</text><text x="322" y="217">STUDIO</text><text x="285" y="337">12 400</text><text x="490" y="202">8 100</text>
          </g>
        </svg>
      </div>
      <div className="drawing-note">
        <span aria-live="polite">{drawingTasks[view].note}</span>
        <Link to={'/demos/' + drawingTasks[view].id}>{drawingTasks[view].label}</Link>
      </div>
    </figure>
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
    <section className="wrap project-board" data-continuity-bg="paper-2" id="sample-project" tabIndex={-1} aria-labelledby="sample-project-title">
      <div className="demo-section-title">
        <div><h2 id="sample-project-title">{DEMO_PROJECT.name}</h2></div>
        <p>Work through four guided BIM tasks using fictional project records. Each task starts from its own fixture, so edits are local to that demo.</p>
      </div>
      <dl className="project-metadata">
        <div><dt>Project</dt><dd>{DEMO_PROJECT.code}</dd></div>
        <div><dt>Issue</dt><dd>{DEMO_PROJECT.revision}, {DEMO_PROJECT.stage}</dd></div>
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
            </button>
          ))}
        </div>
        <div className="project-preview">
          <div className="project-preview-visual" key={step.id}>
            {preview && <><img src={asset(preview)} alt="" loading="lazy" decoding="async" /><span>Revit dialog reference</span></>}
          </div>
          <div className="project-preview-copy">
            <div><h3>{step.title}</h3><p className="demo-context">Task {indexNumber(selected)} of {indexNumber(PROJECT_WORKFLOW.length - 1)}, {product.name}</p><p>{step.detail}</p></div>
            <button ref={previewAction} className="demo-button" type="button" onClick={() => running ? closeWorkspace() : setRunning(true)} aria-expanded={running} aria-controls={running ? 'project-workspace' : undefined}>{running ? <X size={15} /> : <Play size={15} />} {running ? 'Close walkthrough' : 'Start walkthrough'}</button>
          </div>
        </div>
      </div>
      {running && (
        <section className="project-workspace" id="project-workspace" ref={workspace} tabIndex={-1} aria-label={demo.title}>
          <header>
            <div><h3>{demo.title}</h3><p className="demo-context">{DEMO_PROJECT.code}, task {indexNumber(selected)} of {indexNumber(PROJECT_WORKFLOW.length - 1)}, {step.phase}</p></div>
            <Link to={'/demos/' + demo.id} className="demo-text-link">Open dedicated page</Link>
          </header>
          <DemoPlayer key={demo.id} demo={demo} />
          <nav className="project-progression" aria-label="Sample project tasks">
            {previous ? <button className="demo-text-link" type="button" onClick={() => setSelected(selected - 1)}>Previous: {previous.title}</button> : <span>{DEMO_PROJECT.name}, {DEMO_PROJECT.code}</span>}
            {next ? <button className="demo-button" type="button" onClick={() => setSelected(selected + 1)}>Next: {next.title}</button> : <button className="demo-button" type="button" onClick={closeWorkspace}>Back to project board</button>}
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
  const groups = JOBS.map((job) => ({
    ...job,
    demos: matching.filter(({ product }) => (!suite || product.suite === suite) && jobOf(product) === job.id),
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
      <section className="demo-opening" data-continuity-bg="paper" aria-labelledby="demo-library-title">
        <div className="wrap demo-opening-grid">
          <div className="demo-opening-copy">

            <h1 id="demo-library-title">Plugin demo <span>library</span></h1>
            <p className="demo-intro">Try a BIM task, explore a Revit dialog or run a sample CAD workflow in your browser.</p>
            <form className="demo-quick-search" role="search" aria-label="Quick demo lookup" onSubmit={(event) => { event.preventDefault(); navigate(indexLocation); focusIndex() }}>
              <DemoSearch input={quickSearch} label="Quick demo search" value={query} onChange={(value) => filter('q', value)} shortcut />
            </form>
            {term && (
              <div className="demo-quick-results">
                <p>{count ? `${count} matching ${count === 1 ? 'demo' : 'demos'}` : 'No matches with the current filters.'}</p>
                {quickMatches.length > 0 && <ul>{quickMatches.map(({ product, demo }) => <li key={demo.id}><Link to={`/demos/${demo.id}`} state={libraryState}><strong>{product.name}</strong><span>{labelFor(demo)}</span></Link></li>)}</ul>}
              </div>
            )}
            <div className="demo-opening-actions">
              <Link to={indexLocation} className="demo-button" onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) focusIndex() }}>{term ? 'View search results' : `Browse ${entries.length} demos`}</Link>
              <a href="#sample-project" className="demo-text-link"><Play size={15} /> Start the sample project</a>
            </div>
            <p className="demo-footnote">Sample data, no installation required</p>
          </div>
          <div className="demo-stage-feather"><DrawingStage /></div>
        </div>
      </section>

      <ProjectBoard />

      <section className="wrap demo-featured-large" data-continuity-bg="paper" aria-labelledby="featured-demos-title">
        <div className="demo-section-title"><div><h2 id="featured-demos-title">One tool from each Revit suite</h2></div></div>
        <ul className="demo-feature-grid">
          {FEATURED_TOOLS.map((tool) => {
            const product = productBySlug(tool.slug)
            const shot = product?.dialogs.find((d) => d.light)?.light
            return <li key={tool.slug}><Link to={'/demos/' + tool.slug} state={libraryState}>
              <span className="demo-feature-shot">{shot && <img src={asset(shot)} alt="" loading="lazy" decoding="async" />}</span>
              <strong>{tool.title}</strong>
              <span className="demo-card-meta">{tool.suite}</span>
              <span className="demo-feature-task">{tool.task}. {tool.description}</span>
              <span className="demo-card-go">Open the walkthrough</span>
            </Link></li>
          })}
        </ul>
      </section>

      <section ref={index} className="wrap demo-index" data-continuity-bg="paper" id="demo-index" aria-labelledby="demo-index-title">
        <div className="demo-section-title">
          <div><h2 id="demo-index-title">Find a walkthrough</h2></div>
          <DemoSearch input={indexSearch} label="Search demos" value={query} onChange={(value) => filter('q', value)} />
        </div>
        <p className="demo-index-note">{INDEX_NOTE}</p>
        <div className="demo-index-tools">
          <p className="demo-match" role="status">{count} {count === 1 ? 'walkthrough' : 'walkthroughs'}{query.trim() && ` for “${query.trim()}”`}</p>
          <div className="demo-format-tabs" role="group" aria-label="Demo format">
            {([['', 'All formats'], ...(Object.keys(demoFormats) as DemoDefinition['kind'][]).map((kind) => [kind, demoFormats[kind].label])] as [string, string][]).map(([kind, label]) => (
              <button type="button" key={kind} aria-pressed={format === kind} title={kind ? demoFormats[kind as DemoDefinition['kind']].detail : undefined} onClick={() => filter('format', kind)}>{label}</button>
            ))}
          </div>
        </div>
        {count === 0 && <div className="demo-empty"><h3>No matching walkthroughs</h3><p>Try a plugin name, host application or task.</p><button type="button" className="demo-button" onClick={() => replaceFilters(new URLSearchParams())}>Clear filters</button></div>}
        {groups.filter((group) => group.demos.length).map((group) => (
          <div key={group.id} className="demo-group">
            <div className="demo-group-label"><h3>{group.title}</h3><p>{group.demos.length} {group.demos.length === 1 ? 'tool' : 'tools'}</p></div>
            <ul className="demo-rows demo-job-rows">
              {group.demos.map(({ product, demo }) => (
                <li key={demo.id}>
                  <Link to={`/demos/${demo.id}`} state={libraryState}>
                    <span><strong>{product.name}</strong><small>{demo.summary}</small></span>
                    <span className="demo-row-format">{suiteById(product.suite).short}, {labelFor(demo)}</span>
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
  const demo = demoById(id)
  if (!demo) return <NotFound />
  const product = productBySlug(demo.productSlug)
  const evidence = demo.id === 'architech-i3d' || demo.id === 'architech-assistant' || demo.id === 'revit-mcp' ? NATIVE_EVIDENCE[demo.id] : undefined
  const sequence = PROJECT_WORKFLOW.findIndex((step) => step.id === demo.id)
  const next = sequence >= 0 ? PROJECT_WORKFLOW[sequence + 1] : undefined
  const player = <DemoPlayer key={demo.id} demo={demo} />
  return (
    <div className="demo-detail">
      <header className="demo-detail-header" data-continuity-bg="paper">
        <div className="wrap-wide">
          <Link to={{ pathname: '/demos', search: librarySearch, hash: '#demo-index' }} className="demo-text-link">Demo library</Link>
          <div className="demo-detail-title">
            <div>
              <h1>{evidence ? (product?.name ?? demo.ribbon.tab) : demo.title}</h1>
              <p className="demo-detail-context">{demo.ribbon.tab}, {evidence ? 'Native captures and browser exercise' : labelFor(demo)}</p>
              {evidence ? <p>View captures from the installed build, then try a separate browser exercise on sample data.</p> : <>
                <p>{demo.summary}</p>
                <p className="demo-detail-format">{demoFormats[demo.kind].detail}</p>
              </>}
            </div>
            {product && <div className="demo-detail-links">
              <Link className="demo-text-link" to={`/plugins/${product.slug}`}>Product details</Link>
              {(product.dialogs.length > 0 || product.media?.length) && <Link className="demo-text-link" to={`/plugins/${product.slug}#dialog-reference`}>View {product.dialogs.length ? 'dialog layouts' : 'desktop visuals'}</Link>}
            </div>}
          </div>
        </div>
      </header>
      <div className="wrap-wide demo-detail-body" data-continuity-bg="paper">
        {evidence ? <>
          <NativeEvidence key={demo.id} {...evidence} />
          <section id="browser-exercise" className="native-browser-exercise" tabIndex={-1} aria-labelledby="browser-exercise-title">
            <header>
              <div>
                <h2 id="browser-exercise-title">{demo.title}</h2>
                <p className="demo-context">Browser exercise using sample data</p>
                <p>{demo.summary}</p>
              </div>
              <a className="demo-text-link" href="#native-build">Back to native captures</a>
            </header>
            <div className="demo-stage-feather demo-player-feather">{player}</div>
          </section>
        </> : <div className="demo-stage-feather demo-player-feather">{player}</div>}
        {sequence >= 0 && (
          <div className="demo-project-next">
            <div><strong>{DEMO_PROJECT.name}</strong><p className="demo-context">{DEMO_PROJECT.code}, {PROJECT_WORKFLOW[sequence].phase}, task {indexNumber(sequence)} of {PROJECT_WORKFLOW.length}</p></div>
            {next
              ? <Link to={'/demos/' + next.id}>Next: {next.title}</Link>
              : <Link to="/demos#sample-project">Back to the project board</Link>}
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
