import { useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { PRODUCTS, REVIT_TOOLS, STATS, productBySlug } from '../data/catalog'
import { SUITES } from '../data/suites'
import type { Product } from '../data/types'
import { DialogGallery } from '../components/DialogGallery'
import { dialogAlt, imageProps, thumbProps } from '../components/dialogImage'
import { PROJECT_WORKFLOW } from '../data/demoProject'
import { FEATURED_TOOLS } from '../data/featured'

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

/** One tool from each suite, stepped through its real windows. The stage shape is shared, so switching tools moves nothing. */
const STAGE_RATIO = 1400 / 900

function LiveStage() {
  const [selected, setSelected] = useState(0)
  const tool = FEATURED_TOOLS[selected]
  const product = productBySlug(tool.slug)!
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
        <p className="hero-stage-status">{product.dialogs.length} windows</p>
      </div>
      <div className="hero-stage-body" key={tool.slug}>
        <DialogGallery product={product} ratio={STAGE_RATIO} dark />
      </div>
      <div className="hero-stage-foot">
        <div aria-live="polite"><strong>{tool.task}</strong></div>
        <Link to={'/demos/' + tool.slug} className="stage-link">Open {tool.title} <ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
    </div>
  )
}

/** Group the real ribbon panels without changing the catalog or tool names. */
const RIBBON_GROUPS = {
  folio: [
    { name: 'Sheets', panels: ['Sheets', 'Publish', 'Schedules'] },
    { name: 'Views', panels: ['Views', 'View Templates'] },
    { name: 'Annotation', panels: ['Annotation'] },
    { name: 'Detailing', panels: ['Detailing'] },
  ],
  forge: [
    { name: 'Parameters', panels: ['Parameters'] },
    { name: 'Finishes', panels: ['Finishes'] },
    { name: 'Rooms & Scan to BIM', panels: ['Rooms', 'Scan to BIM'] },
  ],
  sentinel: [
    { name: 'Model health', panels: ['Model Health'] },
    { name: 'Standards', panels: ['Standards'] },
    { name: 'Clean up', panels: ['Clean Up'] },
    { name: 'Coordination', panels: ['Coordination', 'Links'] },
  ],
}
const RIBBON = (['folio', 'forge', 'sentinel'] as const).map((id) => {
  const suite = SUITES.find((s) => s.id === id)!
  const tools = REVIT_TOOLS.filter((t) => t.suite === id)
  const panels = [...new Set(tools.map((t) => t.panel))].map((panel) => ({ panel, tools: tools.filter((t) => t.panel === panel) }))
  const groups = RIBBON_GROUPS[id].map((group) => ({ ...group, panels: group.panels.map((name) => panels.find((p) => p.panel === name)!) }))
  return { suite, groups, count: STATS.suiteTools(id) }
})
/** Each suite is pictured by the main window of one of its tools. */
const SUITE_SHOTS: Record<string, Product> = {
  folio: productBySlug('sheet-manager')!,
  forge: productBySlug('parameter-manager')!,
  sentinel: productBySlug('warnings-inspector')!,
}
const SUITE_TASKS: Record<string, string> = {
  folio: 'Views, sheets, annotation and publishing.',
  forge: 'Rooms, finishes, parameters and Scan-to-BIM.',
  sentinel: 'Warnings, BEP checks and model cleanup.',
}

function Ribbon() {
  const [tab, setTab] = useState(0)
  const [group, setGroup] = useState(0)
  const [hover, setHover] = useState<Product>()
  const [details, setDetails] = useState(false)
  const selectSuite = (index: number) => { setTab(index); setGroup(0); setHover(undefined) }
  const selectGroup = (index: number) => { setGroup(index); setHover(undefined) }
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number, count: number, select: (index: number) => void) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % count
      : event.key === 'ArrowLeft' ? (index + count - 1) % count
      : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : undefined
    if (next === undefined) return
    event.preventDefault()
    select(next)
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus({ preventScroll: true })
  }
  return (
    <div className="ribbon">
      <div className="ribbon-tabs" role="tablist" aria-label="Revit suites">
        {RIBBON.map((r, i) => (
          <button type="button" role="tab" key={r.suite.id} id={'ribbon-tab-' + r.suite.id}
            aria-selected={tab === i} aria-controls={'ribbon-suite-' + r.suite.id} tabIndex={tab === i ? 0 : -1}
            onClick={() => selectSuite(i)} onKeyDown={(event) => navigate(event, i, RIBBON.length, selectSuite)}>
            {r.suite.name}
          </button>
        ))}
      </div>
      <div className="ribbon-suites">
        {RIBBON.map(({ suite, groups, count }, suiteIndex) => {
          const shot = SUITE_SHOTS[suite.id]
          return (
            <div className="ribbon-suite" key={suite.id} role="tabpanel" id={'ribbon-suite-' + suite.id}
              aria-labelledby={'ribbon-tab-' + suite.id} hidden={tab !== suiteIndex} aria-hidden={tab !== suiteIndex} inert={tab !== suiteIndex}>
              <div className="ribbon-group-tabs" role="tablist" aria-label={suite.name + ' tool groups'}>
                {groups.map((item, index) => (
                  <button type="button" role="tab" key={item.name} id={'ribbon-tab-' + suite.id + '-' + index}
                    aria-selected={group === index} aria-controls={'ribbon-group-' + suite.id + '-' + index} tabIndex={group === index ? 0 : -1}
                    onClick={() => selectGroup(index)} onKeyDown={(event) => navigate(event, index, groups.length, selectGroup)}>{item.name}</button>
                ))}
              </div>
              <div className="ribbon-groups">
                {groups.map((item, index) => (
                  <div className="ribbon-bar" key={item.name} role="tabpanel" id={'ribbon-group-' + suite.id + '-' + index}
                    aria-labelledby={'ribbon-tab-' + suite.id + '-' + index} hidden={group !== index} aria-hidden={group !== index} inert={group !== index}>
                    <ul className="ribbon-tools">
                      {item.panels.flatMap(({ panel, tools }) => tools.map((t) => (
                        <li key={t.slug}><Link to={'/demos/' + t.demo} aria-description={'Ribbon panel: ' + panel}
                          onMouseEnter={() => setHover(t)} onFocus={() => setHover(t)}>{t.name}</Link></li>
                      )))}
                    </ul>
                  </div>
                ))}
              </div>
              <details className="ribbon-details" open={details} onToggle={(event) => setDetails(event.currentTarget.open)}>
                <summary>Suite details</summary>
                <p className="ribbon-panel-note">Ribbon panels: {(groups[group] ?? groups[0]).panels.map((item) => item.panel).join(', ')}.</p>
                <div className="ribbon-tip" aria-live="polite">
                  <b>{hover?.name ?? suite.focus}</b>
                  <span>{hover?.tagline ?? SUITE_TASKS[suite.id]}</span>
                  <Link to={'/plugins?suite=' + suite.id}>All {count} {suite.short} tools</Link>
                </div>
              </details>
              <figure className="ribbon-shot">
                <div className="ribbon-shot-preview">
                  {tab === suiteIndex && <img {...imageProps(shot.dialogs[0].dark, 880)} alt={dialogAlt(shot, shot.dialogs[0])} loading="lazy" decoding="async" />}
                </div>
                <figcaption>{shot.name}, {suite.name}</figcaption>
              </figure>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Two rows of real main windows drifting in opposite directions; each opens that tool's dialogs.
const wall = PRODUCTS.filter((p) => p.demo && p.dialogs[0].dark[1] >= 900).map((p) => ({ slug: p.demo!, name: p.name, image: p.dialogs[0].dark }))
const wallRows = [wall.filter((_, i) => i % 2 === 0).slice(0, 12), wall.filter((_, i) => i % 2 === 1).slice(0, 12)]

function DialogWall() {
  return (
    <section className="dialog-wall" aria-labelledby="dialog-wall-title">
      <div className="marquee">
        {wallRows.map((row, r) => (
          <div className={'marquee-row' + (r ? ' rev' : '')} key={r}>
            {[...row, ...row].map((item, i) => (
              <Link key={item.slug + i} to={'/demos/' + item.slug} aria-hidden={i >= row.length} tabIndex={i >= row.length ? -1 : undefined} aria-label={i < row.length ? item.name + ' dialogs' : undefined}>
                <img {...thumbProps(item.image)} alt="" loading="lazy" decoding="async" /><span>{item.name}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="wrap dialog-wall-head">
        <h2 id="dialog-wall-title">{STATS.dialogs} dialogs, as built</h2>
        <p>Most of the {STATS.revitTools} tools open more than one window. Each picture is a Revit screenshot or the tool’s own window with sample data; pick one to see the rest.</p>
      </div>
    </section>
  )
}

const DESKTOP = [
  { slug: 'architech-i3d', kind: 'Desktop app', task: 'Turn a photo or mesh into a Revit family' },
  { slug: 'architech-assistant', kind: 'Desktop app', task: 'Ask about the active Revit view' },
  { slug: 'revit-mcp', name: 'ArchiTECH MCP Connector', kind: 'Revit, Rhino, SketchUp, AutoCAD, Blender', task: 'Let an AI assistant work in the model, with every write checked' },
].map((item) => {
  const product = productBySlug(item.slug)!
  // The first full window, not a cropped capture strip.
  const shot = product.dialogs.find((d) => d.dark[2] > 300) ?? product.dialogs[0]
  return { ...item, name: item.name ?? product.name, product, shot, count: new Set(product.dialogs.map((d) => d.id)).size }
})

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
            <h2 id="try-title">Look inside one tool</h2>
            <p>Step through the real windows of one tool from each suite, exactly as they open in Revit.</p>
          </div>
          <LiveStage />
        </div>
      </section>

      <section className="suites" data-continuity-bg="paper" aria-labelledby="suites-title">
        <div className="wrap">
          <div className="split-head">
            <h2 id="suites-title">Three suites, one ribbon</h2>
          </div>
          <Ribbon />
        </div>
      </section>

      <div className="wall-band" data-continuity-bg="paper"><DialogWall /></div>

      <section className="path" data-continuity-bg="paper-2" id="live-demo" aria-labelledby="home-project-title">
        <div className="wrap">
          <div className="split-head">
            <h2 id="home-project-title">Follow one drawing set</h2>
            <p>These four tools take one project from rooms to a reviewed drawing set.</p>
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
            <h2 id="home-desktop-title">AI and desktop apps</h2>
            <p>Three products beyond the Revit ribbon: I3D turns a photo or a mesh into a Revit family, the Assistant answers questions about the open model, and the MCP Connector lets an AI assistant work in Revit, Rhino, SketchUp, AutoCAD and Blender, with every change checked.</p>
          </div>
          <div className="home-desktop-grid">
            {DESKTOP.map((d) => (
              <article key={d.slug}>
                <img {...thumbProps(d.shot.dark)} alt={dialogAlt(d.product, d.shot)} loading="lazy" decoding="async" />
                <div><h3>{d.name}</h3><p className="product-kind">{d.kind}</p><p className="home-desktop-task">{d.task}</p>
                  <Link to={'/demos/' + d.slug}>See its {d.count} dialogs</Link></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ah-contact" data-continuity-bg="paper">
        <div className="wrap ah-contact-grid">
          <h2>An architect who can also build the tools</h2>
          <div>
            <p>If your team needs someone who designs, documents, models, renders and automates, I would like to hear from you.</p>
            <Link className="btn btn-primary" to="/connect">Work with me</Link>
          </div>
        </div>
      </section>
    </>
  )
}
