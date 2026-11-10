import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Play, Search, X } from 'lucide-react'
import { demoById, demoForProduct } from '../demo/registry'
import { DemoPlayer } from '../demo/DemoPlayer'
import type { DemoDefinition } from '../demo/types'
import { PRODUCTS, productBySlug, searchText } from '../data/catalog'
import { SUITES, suiteById } from '../data/suites'
import { DEMO_PROJECT, PROJECT_WORKFLOW } from '../data/demoProject'
import { ROOMS, SHEETS, WARNINGS } from '../demo/sample'
import { asset } from '../components/Brand'
import NotFound from './NotFound'
import './demos.css'

const entries = PRODUCTS.flatMap((product) => {
  const demo = demoForProduct(product.slug)
  return demo ? [{ product, demo }] : []
})
const labelFor = (demo: DemoDefinition) => demo.kind === 'crafted' ? 'Guided simulation' : demo.kind === 'replica' ? 'Dialog explorer' : 'Workflow simulation'
const indexNumber = (i: number) => String(i + 1).padStart(2, '0')

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
      <figcaption><span>{DEMO_PROJECT.name}</span><span>{DEMO_PROJECT.code} / {DEMO_PROJECT.revision}</span></figcaption>
      <div className="drawing-plate">
        <svg viewBox="0 0 620 380" role="img" aria-labelledby="drawing-title drawing-desc">
          <title id="drawing-title">{view} drawing</title>
          <desc id="drawing-desc">An illustrative residential pavilion shown as a floor plan, an exploded assembly, or a coordinated model.</desc>
          <defs>
            <pattern id="plate-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0v22" fill="none" stroke="#7c7a6c" strokeOpacity=".28" /></pattern>
            <pattern id="plate-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(34)"><path d="M0 0v6" stroke="#cda475" strokeOpacity=".42" /></pattern>
            <linearGradient id="roof-metal" x2="0" y2="1"><stop stopColor="#777467" /><stop offset="1" stopColor="#42433a" /></linearGradient>
          </defs>
          <path fill="url(#plate-grid)" d="M21 17h578v347H21z" />
          <path className="plate-marks" d="M21 31V17h14m550 0h14v14m0 319v14h-14M35 364H21v-14" />
          <g className="plate-model" fill="none">
            <g className="plate-guides">
              <path d="M173 236V136m194 141V146M478 221V115M282 177V90M122 269l180-103m-23 192 245-139M128 241l254 129" />
              <path d="m115 273 4-9m153 88 11-2m244-129-10-3" />
            </g>
            <g className="plate-base">
              <path fill="#35372f" d="m143 240 124-72 242 50-134 93z" />
              <path fill="#242721" d="m143 240 232 71v13l-232-72zm232 71 134-93v13l-134 93z" />
              <path fill="#4c4c40" d="m167 239 107-62 204 44-111 73z" />
              <path d="m185 242 91-51 182 38m-239 23 91-52m-61 63 92-56m-55 67 91-59m-52 70 89-63m-213 4 189 46m-158-64 181 48m-148-69 174 47" strokeOpacity=".4" />
            </g>
            <g className="plate-walls">
              <path fill="#8f8875" d="m173 236 109-59v-72l-109 58z" />
              <path fill="#626352" d="m282 177 196 44v-73l-196-43z" />
              <path fill="#424b41" d="m173 236 194 50v-72l-194-51z" />
              <path fill="#667064" d="m367 286 111-65v-73l-111 66z" />
              <path fill="#232b25" d="m187 228 163 42v-48l-163-43zm192 38 87-51v-50l-87 50z" />
              <path stroke="#b0ad98" d="m217 187v49m33-40v49m34-40v49m33-40v49m84-59v49m22-62v49m22-62v49" />
              <path d="m187 212 163 42m29-8 87-52" strokeOpacity=".65" />
            </g>
            <g className="plate-roof">
              <path fill="url(#roof-metal)" d="m155 160 125-69 218 47-127 76z" />
              <path fill="#4d4d42" d="m155 160 216 54v9l-216-54zm216 54 127-76v9l-127 76z" />
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
            <path d="M151 92h311v203H151z" fill="#383930" />
            <path d="M151 92h311v203H151zm139 0v61m0 43v99m0-139h68m42 0h62M151 222h73m41 0h25" strokeWidth="5" />
            <path d="M308 111h130v25H308zM168 245h46v33h-46zM175 114h70v55h-70z" fill="url(#plate-hatch)" />
            <path d="M290 195h-40a40 40 0 0 1 40-40m-66 67v36a36 36 0 0 0 37-36m99-66v40a40 40 0 0 0 40-40M151 318h311m-311-5v10m311-10v10M478 93v202m-5-202h10m-10 202h10" />
            <text x="188" y="196">LIVING</text><text x="322" y="217">STUDIO</text><text x="285" y="337">12 400</text><text x="490" y="202">8 100</text>
          </g>
        </svg>
      </div>
      <div className="drawing-controls" role="group" aria-label="Drawing view">
        {viewNames.map((name, i) => (
          <button key={name} type="button" aria-pressed={view === name} onClick={() => setView(name)}>
            <small aria-hidden="true">{indexNumber(i)}</small>{name}
          </button>
        ))}
      </div>
      <div className="drawing-note">
        <span aria-live="polite">{drawingTasks[view].note}</span>
        <Link to={'/demos/' + drawingTasks[view].id}>{drawingTasks[view].label} <ArrowUpRight size={14} /></Link>
      </div>
    </figure>
  )
}

function ProjectBoard() {
  const [selected, setSelected] = useState(0)
  const [running, setRunning] = useState(false)
  const workspace = useRef<HTMLElement>(null)
  const step = PROJECT_WORKFLOW[selected]
  const demo = demoById(step.id)!
  const product = productBySlug(demo.productSlug)!
  const preview = product.dialogs[0]?.dark
  useEffect(() => {
    if (running) {
      workspace.current?.focus({ preventScroll: true })
      workspace.current?.scrollIntoView({ block: 'start' })
    }
  }, [running, selected])

  return (
    <section className="wrap project-board" id="sample-project" aria-labelledby="sample-project-title">
      <div className="demo-section-title">
        <div><p className="demo-kicker">01 / Sample project</p><h2 id="sample-project-title">{DEMO_PROJECT.name}</h2></div>
        <p>Follow four tasks from model setup to drawing review. Each demo opens a fresh copy of the fictional data.</p>
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
            <button type="button" key={item.id} aria-pressed={i === selected} onClick={() => { setSelected(i); setRunning(false) }}>
              <span className="project-stop-index">{indexNumber(i)}</span>
              <span><small>{item.phase}</small><strong>{item.title}</strong></span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="project-preview">
          <div className="project-preview-visual" key={step.id}>{preview && <img src={asset(preview)} alt="" loading="lazy" decoding="async" />}</div>
          <div className="project-preview-copy">
            <div><p className="demo-kicker">{product.name}</p><h3>{step.title}</h3><p>{step.detail}</p></div>
            <button className="demo-button" type="button" onClick={() => setRunning(!running)} aria-expanded={running} aria-controls={running ? 'project-workspace' : undefined}>{running ? <X size={15} /> : <Play size={15} />} {running ? 'Close demo' : 'Start here'}</button>
          </div>
        </div>
      </div>
      {running && (
        <section className="project-workspace" id="project-workspace" ref={workspace} tabIndex={-1} aria-label={demo.title}>
          <header>
            <div><p className="demo-kicker">{DEMO_PROJECT.code} / {step.phase}</p><h3>{demo.title}</h3></div>
            <Link to={'/demos/' + demo.id} className="demo-text-link">Open dedicated page <ArrowUpRight size={15} /></Link>
          </header>
          <DemoPlayer key={demo.id} demo={demo} />
        </section>
      )}
    </section>
  )
}

export function DemoHub() {
  const [params, setParams] = useSearchParams()
  const suite = params.get('suite') ?? ''
  const query = params.get('q') ?? ''
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const matching = entries.filter(({ product, demo }) => {
    const text = [searchText(product), suiteById(product.suite).name, demo.title, demo.summary].join(' ').toLowerCase()
    return words.every((word) => text.includes(word))
  })
  const groups = SUITES.filter((item) => !suite || item.id === suite).map((item) => ({
    ...item,
    demos: matching.filter(({ product }) => product.suite === item.id),
  }))
  const count = groups.reduce((total, group) => total + group.demos.length, 0)
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div className="demo-library">
      <section className="demo-opening" aria-labelledby="demo-library-title">
        <div className="wrap demo-opening-grid">
          <div className="demo-opening-copy">
            <p className="demo-kicker">ArchiTECH Automation <span /> Interactive library</p>
            <h1 id="demo-library-title">Plugin demo <span>library</span></h1>
            <p className="demo-intro">Prepare a drawing set, review a model or try a CAD automation workflow. Every product in the catalog has a hands-on demo you can run with sample data.</p>
            <div className="demo-opening-actions">
              <a href="#demo-index" className="demo-button">Browse {entries.length} demos <ArrowDown size={16} /></a>
              <a href="#sample-project" className="demo-text-link"><Play size={15} /> Start the sample project</a>
            </div>
            <p className="demo-footnote">Browser simulations <span /> Sample projects <span /> No install</p>
          </div>
          <DrawingStage />
        </div>
      </section>

      <ProjectBoard />

      <section className="wrap demo-index" id="demo-index" aria-labelledby="demo-index-title">
        <div className="demo-section-title">
          <div><p className="demo-kicker">02 / Full index</p><h2 id="demo-index-title">Find a plugin</h2></div>
          <div className="demo-search">
            <Search size={19} aria-hidden="true" />
            <input type="search" aria-label="Search demos" placeholder="Search tools, hosts or tasks" value={query} onChange={(event) => filter('q', event.target.value)} />
            {query && <button type="button" onClick={() => filter('q', '')} aria-label="Clear search"><X size={18} /></button>}
          </div>
        </div>
        <div className="demo-filter" role="group" aria-label="Filter demos by suite">
          {[{ id: '', short: 'All demos' }, ...SUITES.map((item) => ({ ...item, short: item.id === 'ai' ? 'AI & MCP' : item.short }))].map((item) => (
            <button type="button" key={item.id} aria-pressed={item.id === suite} onClick={() => filter('suite', item.id)}>
              {item.short}<small>{item.id ? matching.filter(({ product }) => product.suite === item.id).length : matching.length}</small>
            </button>
          ))}
        </div>
        <p className="demo-match" role="status">{count} {count === 1 ? 'demo' : 'demos'}{query.trim() && ` for “${query.trim()}”`}</p>
        {count === 0 && <div className="demo-empty"><h3>No matching demos</h3><p>Try a plugin name, host application or task.</p><button type="button" className="demo-button" onClick={() => setParams({}, { replace: true })}>Clear filters</button></div>}
        {groups.filter((group) => group.demos.length).map((group) => (
          <div key={group.id} className="demo-group">
            <div className="demo-group-label"><h3>{group.name}</h3><p>{group.focus}</p></div>
            <ul className="demo-rows">
              {group.demos.map(({ product, demo }) => (
                <li key={demo.id}>
                  <Link to={`/demos/${demo.id}`}>
                    <div className="demo-row-main"><strong>{product.name}</strong><span>{demo.summary}</span></div>
                    <span className="demo-row-format">{labelFor(demo)}</span>
                    <ArrowRight size={19} aria-hidden="true" />
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
  const demo = demoById(id)
  if (!demo) return <NotFound />
  const product = productBySlug(demo.productSlug)
  const sequence = PROJECT_WORKFLOW.findIndex((step) => step.id === demo.id)
  const next = sequence >= 0 ? PROJECT_WORKFLOW[sequence + 1] : undefined
  return (
    <div className="demo-detail">
      <header className="demo-detail-header">
        <div className="wrap-wide">
          <Link to="/demos#demo-index" className="demo-text-link"><ArrowLeft size={16} /> Demo library</Link>
          <div className="demo-detail-title">
            <div>
              <p className="demo-kicker">{demo.ribbon.tab} <span /> {labelFor(demo)}</p>
              <h1>{demo.title}</h1>
              <p>{demo.summary}</p>
            </div>
            {product && <Link className="demo-text-link" to={`/plugins/${product.slug}`}>Product details <ArrowUpRight size={16} /></Link>}
          </div>
        </div>
      </header>
      <div className="wrap-wide demo-detail-body">
        <DemoPlayer key={demo.id} demo={demo} />
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
