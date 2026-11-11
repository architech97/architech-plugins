import { lazy, Suspense, useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { PRODUCTS, REVIT_TOOLS, STATS } from '../data/catalog'
import { SUITES } from '../data/suites'
import type { Product } from '../data/types'
import { asset } from '../components/Brand'
import { useMediaQuery } from '../components/motion'
import { DEMO_PROJECT, PROJECT_WORKFLOW } from '../data/demoProject'
import { FEATURED_TOOLS } from '../data/featured'

const LiveDialog = lazy(() => import('../components/LiveDialog').then((module) => ({ default: module.LiveDialog })))

/** A floor plan that draws itself behind the live dialog. Decorative. */
function BlueprintLines() {
  return (
    <svg className="stage-blueprint" viewBox="0 0 1400 700" preserveAspectRatio="none" aria-hidden="true">
      <g className="bp-grid">
        <path d="M0 70h1400M0 630h1400M70 0v700M1330 0v700" />
      </g>
      <g className="bp-walls">
        <path pathLength={1} d="M24 110h1352v520H24zM24 330h150M24 480h120M120 110v220M1376 300h-150M1376 470h-110M1280 110v190M1230 470v160" />
        <path pathLength={1} d="M120 330a60 90 0 0 1 60 90M1280 300a60 90 0 0 0-60 90M24 660h1352M24 650v20M1376 650v20M0 110h14M0 630h14M1386 110h14M1386 630h14" />
      </g>
    </svg>
  )
}

function LiveStage() {
  const [selected, setSelected] = useState(0)
  const wide = useMediaQuery('(min-width: 860px)')
  const tool = FEATURED_TOOLS[selected]
  const preview = (
    <Link to={'/demos/' + tool.slug} className="hero-stage-still" aria-label={'Open the ' + tool.title + ' demo'}>
      <img src={asset(tool.preview)} alt={tool.alt} decoding="async" />
    </Link>
  )
  return (
    <div className="hero-stage">
      <BlueprintLines />
      <div className="hero-stage-bar">
        <div className="hero-stage-tabs" role="group" aria-label="Featured suite tools">
          {FEATURED_TOOLS.map(({ suite, title, slug }, index) => (
            <button type="button" key={slug} aria-pressed={selected === index} onClick={() => setSelected(index)}>
              <small>{suite}</small><strong>{title}</strong>
            </button>
          ))}
        </div>
        <p className="hero-stage-status">{wide ? 'Working in your browser' : 'Dialog preview'}</p>
      </div>
      <div className="hero-stage-body" key={tool.slug}>
        {wide
          ? <Suspense fallback={preview}><LiveDialog id={tool.slug} /></Suspense>
          : preview}
      </div>
      <div className="hero-stage-foot">
        <div aria-live="polite"><strong>{tool.task}</strong><p>{tool.description}</p></div>
        <Link to={'/demos/' + tool.slug} className="stage-link"><Play size={14} aria-hidden="true" /> Open the guided demo</Link>
      </div>
    </div>
  )
}

/** "Three suites, one ribbon" as a ribbon: three tabs, their real panels, and the tools in each. */
const RIBBON = (['folio', 'forge', 'sentinel'] as const).map((id) => {
  const suite = SUITES.find((s) => s.id === id)!
  const tools = REVIT_TOOLS.filter((t) => t.suite === id)
  const panels = [...new Set(tools.map((t) => t.panel))].map((panel) => ({ panel, tools: tools.filter((t) => t.panel === panel) }))
  return { suite, panels, count: STATS.suiteTools(id) }
})
const SUITE_SHOTS: Record<string, { shot: string; tool: string }> = {
  folio: { shot: 'media/dialogs/sheet-manager/sheetmanagerwindow-light.webp', tool: 'Sheet Manager' },
  forge: { shot: 'media/dialogs/parameter-manager/parametermanagerwindow-light.webp', tool: 'Parameter Manager' },
  sentinel: { shot: 'media/dialogs/warnings-inspector/warningswindow-light.webp', tool: 'Warnings Inspector' },
}

function Ribbon() {
  const [tab, setTab] = useState(0)
  const [hover, setHover] = useState<Product>()
  const { suite, panels } = RIBBON[tab]
  const shot = SUITE_SHOTS[suite.id]
  return (
    <div className="ribbon">
      <div className="ribbon-tabs" role="group" aria-label="Revit ribbon tabs">
        {RIBBON.map((r, i) => (
          <button type="button" key={r.suite.id} aria-pressed={tab === i} onClick={() => { setTab(i); setHover(undefined) }}>
            {r.suite.name}<small>{r.count} tools</small>
          </button>
        ))}
      </div>
      <div className="ribbon-bar" key={suite.id}>
        {panels.map(({ panel, tools }) => (
          <div className="ribbon-panel" key={panel}>
            <ul>
              {tools.map((t) => (
                <li key={t.slug}><Link to={'/demos/' + t.demo} onMouseEnter={() => setHover(t)} onFocus={() => setHover(t)}>{t.name}</Link></li>
              ))}
            </ul>
            <p>{panel}</p>
          </div>
        ))}
      </div>
      <div className="ribbon-tip" aria-live="polite">
        <b>{hover?.name ?? suite.focus}</b>
        <span>{hover?.tagline ?? suite.summary}</span>
        <Link to={'/plugins?suite=' + suite.id}>All {suite.short} tools</Link>
      </div>
      <figure className="ribbon-shot">
        <img src={asset(shot.shot)} alt={shot.tool + ' window, light theme'} loading="lazy" decoding="async" />
        <figcaption>{shot.tool}, {suite.name}</figcaption>
      </figure>
    </div>
  )
}

// Two rows of real dialog renders, light theme, drifting in opposite directions; each opens its walkthrough.
const wall = PRODUCTS.filter((p) => p.demo && p.dialogs[0]?.light && !p.dialogs[0].source).map((p) => ({ slug: p.demo!, name: p.name, src: p.dialogs[0].light! }))
const wallRows = [wall.filter((_, i) => i % 2 === 0).slice(0, 12), wall.filter((_, i) => i % 2 === 1).slice(0, 12)]

function DialogWall() {
  return (
    <section className="dialog-wall" aria-labelledby="dialog-wall-title">
      <div className="marquee">
        {wallRows.map((row, r) => (
          <div className={'marquee-row' + (r ? ' rev' : '')} key={r}>
            {[...row, ...row].map((item, i) => (
              <Link key={item.slug + i} to={'/demos/' + item.slug} aria-hidden={i >= row.length} tabIndex={i >= row.length ? -1 : undefined} aria-label={i < row.length ? item.name + ' walkthrough' : undefined}>
                <img src={asset(item.src)} alt="" loading="lazy" decoding="async" /><span>{item.name}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="wrap dialog-wall-head">
        <h2 id="dialog-wall-title">{STATS.dialogs} dialogs, as built</h2>
        <p>Many of the {STATS.revitTools} tools open more than one window. Each picture is rendered from the tool’s own layout file; pick one to open its walkthrough.</p>
      </div>
    </section>
  )
}

const DESKTOP = [
  {
    name: 'ArchiTECH I3D', kind: 'Desktop app', task: 'Turn a photo or mesh into a Revit family', to: '/demos/architech-i3d', label: 'Try the I3D workflow',
    media: <img src={asset('media/i3d/material-workspace.webp')} alt="I3D Material workspace showing the original textured chair mesh" width={1063} height={778} loading="lazy" decoding="async" />,
  },
  {
    name: 'ArchiTECH Assistant', kind: 'Desktop app', task: 'Ask about the active Revit view', to: '/demos/architech-assistant', label: 'Try the Assistant workflow',
    media: <div className="home-assistant-capture">
      <img src={asset('media/assistant/active-view-exchange.png')} alt="Assistant replies Cover to a question about the active Revit view" loading="lazy" decoding="async" />
      <img src={asset('media/assistant/composer-modes.png')} alt="Assistant composer with Ask, Search and Build modes" loading="lazy" decoding="async" />
    </div>,
  },
  {
    name: 'ArchiTECH MCP Connector', kind: 'Revit, Rhino, SketchUp, AutoCAD, Blender', task: 'Let an AI assistant work in the model, with every write checked', to: '/demos/revit-mcp', label: 'Try the MCP Connector',
    media: <img src={asset('media/native/revit-mcp-connector.webp')} alt="ArchiTECH MCP Connector for Revit 2024, ready for MCP clients" width={1032} height={434} loading="lazy" decoding="async" />,
  },
]

export default function HomeSections() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [hash])
  return (
    <>
      <section className="try" data-continuity-bg="paper-2" aria-labelledby="try-title">
        <div className="wrap-wide">
          <div className="split-head">
            <h2 id="try-title">Try one, right here</h2>
            <p>These are the tools’ own windows, rebuilt for the browser. Tick, type and press the buttons. Nothing is sent or saved.</p>
          </div>
          <LiveStage />
        </div>
      </section>

      <section className="suites" data-continuity-bg="paper" aria-labelledby="suites-title">
        <div className="wrap">
          <div className="split-head">
            <h2 id="suites-title">Three suites, one ribbon</h2>
            <p>The {STATS.revitTools} tools sit in three Revit tabs: {RIBBON.map((r) => `${r.suite.name} (${r.count})`).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Point at a tool to see what it does.</p>
          </div>
          <Ribbon />
        </div>
      </section>

      <div className="wall-band" data-continuity-bg="paper"><DialogWall /></div>

      <section className="path" data-continuity-bg="paper-2" id="live-demo" aria-labelledby="home-project-title">
        <div className="wrap">
          <div className="split-head">
            <h2 id="home-project-title">Follow one sample project</h2>
            <p>{DEMO_PROJECT.name} ({DEMO_PROJECT.code}) is a made-up project used by every walkthrough. These four take it from rooms to a reviewed drawing set.</p>
          </div>
          <ol className="path-steps">
            {PROJECT_WORKFLOW.map((step, i) => (
              <li key={step.id}>
                <Link to={'/demos/' + step.id}><b>{String(i + 1).padStart(2, '0')}</b><span>{step.phase}</span><strong>{step.title}</strong><p>{step.detail}</p></Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-desktop" data-continuity-bg="paper" aria-labelledby="home-desktop-title">
        <div className="wrap">
          <div className="split-head">
            <h2 id="home-desktop-title">Beyond the ribbon</h2>
            <p>Three products outside the Revit tabs: I3D turns a photo or mesh into a Revit asset, the Assistant answers questions about the open model, and the MCP Connector lets an AI assistant work in five design applications.</p>
          </div>
          <div className="home-desktop-grid">
            {DESKTOP.map((d) => (
              <article key={d.name}>
                {d.media}
                <div><h3>{d.name}</h3><p className="product-kind">{d.kind}</p><p className="home-desktop-task">{d.task}</p>
                  <Link to={d.to}>{d.label}</Link></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ah-contact" data-continuity-bg="paper">
        <div className="wrap ah-contact-grid">
          <h2>Is there a task your team repeats every week?</h2>
          <div>
            <p>Tell me about it, or share a suggestion for one of these tools.</p>
            <Link className="btn btn-primary" to="/connect">Discuss a workflow</Link>
          </div>
        </div>
      </section>
    </>
  )
}
