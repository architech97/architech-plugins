import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PRODUCTS, STATS } from '../data/catalog'
import { SUITES } from '../data/suites'
import { asset } from '../components/Brand'
import { Reveal } from '../components/Layout'
import { LiveDialog } from '../components/LiveDialog'
import { CountUp, useMediaQuery } from '../components/motion'
import { DEMO_PROJECT, PROJECT_WORKFLOW } from '../data/demoProject'
import { FEATURED_TOOLS } from '../data/featured'
import './home.css'

const SHEETS = [
  { no: 'A-101', name: 'Ground floor plan', file: 'plan-drawing.jpg', paper: true },
  { no: 'A-102', name: 'Rendered plan', file: 'plan-render.jpg' },
  { no: 'A-201', name: 'Front view, day', file: 'front-day.jpg' },
  { no: 'A-202', name: 'Front view, dusk', file: 'front-dusk.jpg' },
]

/** The result first: a register is ticked, Export is pressed and the set comes out. Decorative loop. */
function ResultLoop() {
  return (
    <figure className="loop">
      <div className="loop-stage" aria-hidden="true">
        <div className="loop-sheets">
          {SHEETS.map((sheet, i) => (
            <div className={'loop-sheet s' + i} key={sheet.no}>
              <div className={'loop-sheet-art' + (sheet.paper ? ' paper' : '')}><img src={asset('media/house/' + sheet.file)} alt="" decoding="async" /></div>
              <p><b>{sheet.no}</b>{sheet.name}<i>PDF</i></p>
            </div>
          ))}
        </div>
        <div className="loop-panel">
          <p className="loop-panel-title">Sheet Export<span>Sheets to export</span></p>
          <ul>
            {SHEETS.map((sheet, i) => <li key={sheet.no} className={'r' + i}><i /><b>{sheet.no}</b><span>{sheet.name}</span></li>)}
          </ul>
          <p className="loop-panel-foot"><span className="loop-count">4 sheets ticked</span><span className="loop-button">Export</span></p>
        </div>
      </div>
      <figcaption>Illustration of Sheet Export. The sheets are drawings and visualisations from my Vasant Kunj proposal.</figcaption>
    </figure>
  )
}

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
        <p className="hero-stage-status"><i aria-hidden="true" />{wide ? 'Working in your browser' : 'Dialog preview'}</p>
      </div>
      <div className="hero-stage-body" key={tool.slug}>
        {wide
          ? <LiveDialog id={tool.slug} />
          : <Link to={'/demos/' + tool.slug} className="hero-stage-still" aria-label={'Open the ' + tool.title + ' demo'}>
              <img src={asset(tool.preview)} alt={tool.alt} decoding="async" />
            </Link>}
      </div>
      <div className="hero-stage-foot">
        <div aria-live="polite"><strong>{tool.task}</strong><p>{tool.description}</p></div>
        <Link to={'/demos/' + tool.slug} className="btn btn-sm btn-primary"><Play size={14} aria-hidden="true" /> Open the guided demo</Link>
      </div>
    </div>
  )
}

// Two rows of real dialog renders drifting in opposite directions; each opens its walkthrough.
const wall = PRODUCTS.filter((p) => p.demo && p.dialogs[0]?.dark && !p.dialogs[0].source).map((p) => ({ slug: p.demo!, name: p.name, src: p.dialogs[0].dark! }))
const wallRows = [wall.filter((_, i) => i % 2 === 0).slice(0, 12), wall.filter((_, i) => i % 2 === 1).slice(0, 12)]

function DialogWall() {
  return (
    <section className="dialog-wall" aria-labelledby="dialog-wall-title">
      <div className="wrap dialog-wall-head">
        <h2 id="dialog-wall-title">{STATS.dialogs} windows, <em>as built</em></h2>
        <p>Each picture is rendered from the tool’s own layout file. Pick one to open its walkthrough.</p>
      </div>
      <div className="marquee">
        {wallRows.map((row, r) => (
          <div className={'marquee-row' + (r ? ' rev' : '')} key={r}>
            {[...row, ...row].map((item, i) => (
              <Link key={item.slug + i} to={'/demos/' + item.slug} aria-hidden={i >= row.length} tabIndex={i >= row.length ? -1 : undefined}>
                <img src={asset(item.src)} alt="" loading="lazy" decoding="async" /><span>{item.name}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

const mainSuites = [
  { id: 'folio', shot: 'media/dialogs/sheet-manager/sheetmanagerwindow-light.webp', tool: 'Sheet Manager' },
  { id: 'forge', shot: 'media/dialogs/parameter-manager/parametermanagerwindow-light.webp', tool: 'Parameter Manager' },
  { id: 'sentinel', shot: 'media/dialogs/warnings-inspector/warningswindow-light.webp', tool: 'Warnings Inspector' },
] as const
const count = (suite: string) => PRODUCTS.filter((item) => item.suite === suite).length

export default function Home() {
  return (
    <div className="automation-home">
      <section className="ah">
        <div className="wrap-wide ah-grid">
          <div className="ah-copy">
            <p className="ah-by">Navneet Singh <span>Revit add-ins</span></p>
            <h1><span><i>Tools that finish</i></span> <span><i>the <em>drawing set</em></i></span></h1>
            <p className="lead">{STATS.revitTools} Revit add-ins I have written for sheets, parameters and model checks. Each one opens here as a working window on sample data.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/demos/sheet-export"><Play size={15} aria-hidden="true" /> Run Sheet Export</Link>
              <Link className="home-secondary" to="/demos#demo-index">All {STATS.demos} walkthroughs <ArrowRight size={16} /></Link>
            </div>
          </div>
          <ResultLoop />
        </div>
      </section>

      <section className="try" aria-labelledby="try-title">
        <div className="wrap-wide">
          <Reveal className="split-head">
            <h2 id="try-title">Try one, <em>right here</em></h2>
            <p>These are the tools’ own windows, rebuilt for the browser. Tick, type and press the buttons. Nothing is sent or saved.</p>
          </Reveal>
          <LiveStage />
        </div>
      </section>

      <section className="suites" aria-labelledby="suites-title">
        <div className="wrap">
          <Reveal className="split-head">
            <h2 id="suites-title">Three suites, <em>one ribbon</em></h2>
            <p>The Revit tools sit in three tabs: one for documents, one for the model and its data, one for checking it.</p>
          </Reveal>
          <div className="suite-cols">
            {mainSuites.map(({ id, shot, tool }, i) => {
              const suite = SUITES.find((s) => s.id === id)!
              return (
                <Reveal key={id} delay={i * 90}>
                  <Link to={'/plugins?suite=' + id} className={'suite-col ' + id}>
                    <p className="suite-count"><CountUp to={count(id)} /><span>tools</span></p>
                    <h3>{suite.name}</h3>
                    <p className="suite-focus">{suite.focus}</p>
                    <p className="suite-summary">{suite.summary}</p>
                    <div className="suite-shot"><img src={asset(shot)} alt={tool + ' window'} loading="lazy" decoding="async" /><span>{tool}</span></div>
                    <span className="suite-go">See the {suite.short} tools <ArrowRight size={16} aria-hidden="true" /></span>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <div className="wall-band"><DialogWall /></div>

      <section className="path" id="live-demo" aria-labelledby="home-project-title">
        <div className="wrap">
          <Reveal className="split-head">
            <h2 id="home-project-title">Follow one <em>sample project</em></h2>
            <p>{DEMO_PROJECT.name} ({DEMO_PROJECT.code}) is a made-up project used by every walkthrough. These four take it from rooms to a reviewed drawing set.</p>
          </Reveal>
          <ol className="path-steps">
            {PROJECT_WORKFLOW.map((step, i) => (
              <Reveal as="li" key={step.id} delay={i * 80}>
                <Link to={'/demos/' + step.id}><b>{i + 1}</b><span>{step.phase}</span><strong>{step.title}</strong><p>{step.detail}</p><ArrowRight size={18} aria-hidden="true" /></Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-desktop" aria-labelledby="home-desktop-title">
        <div className="wrap">
          <Reveal className="split-head">
            <h2 id="home-desktop-title">Beyond the <em>ribbon</em></h2>
            <p>Two desktop applications: I3D turns a photo or mesh into a Revit asset, and the Assistant answers questions about the open model.</p>
          </Reveal>
          <div className="home-desktop-grid">
            <Reveal>
              <article>
                <img src={asset('media/i3d/material-workspace.png')} alt="I3D Material workspace showing the original textured chair mesh" loading="lazy" decoding="async" />
                <div><p className="eyebrow">I3D · Desktop capture</p><h3>Set the material for a Revit asset</h3>
                  <Link to="/demos/architech-i3d">Try the I3D workflow <ArrowUpRight size={16} /></Link></div>
              </article>
            </Reveal>
            <Reveal delay={90}>
              <article>
                <div className="home-assistant-capture">
                  <img src={asset('media/assistant/active-view-exchange.png')} alt="Assistant replies Cover to a question about the active Revit view" loading="lazy" decoding="async" />
                  <img src={asset('media/assistant/composer-modes.png')} alt="Assistant composer with Ask, Search and Build modes" loading="lazy" decoding="async" />
                </div>
                <div><p className="eyebrow">Assistant · Desktop capture</p><h3>Ask about the active Revit view</h3>
                  <Link to="/demos/architech-assistant">Try the Assistant workflow <ArrowUpRight size={16} /></Link></div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="ah-contact">
        <Reveal className="wrap ah-contact-grid">
          <h2>Is there a task your team <em>repeats every week?</em></h2>
          <div>
            <p>Tell me about it, or share a suggestion for one of these tools.</p>
            <Link className="btn btn-primary" to="/connect">Discuss a workflow <ArrowRight size={16} /></Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
