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

const nativeViews = [
  { id: 'axon', label: '3D view', reference: 'A901 · Roof perspective', file: 'snowdon-axon.webp', alt: 'Snowdon Towers roof gardens and street façades in an elevated Revit camera view' },
  { id: 'plan', label: 'Level 2 plan', reference: 'SD102 · Schematic plan', file: 'snowdon-plan.webp', alt: 'Snowdon Towers Level 2 schematic plan with room labels, drawing grids and an occupancy legend' },
] as const
const snowdonSource = 'https://help.autodesk.com/cloudhelp/2024/ENU/Revit-GetStarted/files/GUID-5DA26FF7-85B3-4E9D-A9F2-FADDD02D88D6.htm'

const heroStats = [
  { value: STATS.revitTools, label: 'Revit tools on one ribbon' },
  { value: STATS.demos, label: 'Browser demos to try' },
  { value: STATS.dialogs, label: 'Dialog layouts to inspect' },
  { value: STATS.softwares, label: 'Host applications' },
]

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

function LiveHero() {
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
        <p className="hero-stage-status"><i aria-hidden="true" />{wide ? 'Live in your browser' : 'Dialog preview'}</p>
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

function RevitViews() {
  const [index, setIndex] = useState(0)
  const view = nativeViews[index]
  return (
    <section className="section native-study" id="revit-views" aria-labelledby="native-title">
      <div className="wrap">
        <Reveal className="native-title">
          <h2 id="native-title">From model to plan</h2>
          <p>Explore two views exported from Autodesk’s Snowdon Towers sample project in Revit 2024.</p>
        </Reveal>
        <Reveal className="native-grid" delay={80}>
          <figure className="native-view">
            <div className="native-image"><img key={view.id} src={asset('media/revit/' + view.file)} alt={view.alt} width={1400} height={1138} loading="lazy" decoding="async" /></div>
            <figcaption><span aria-live="polite">{view.reference} / Native Revit export</span><a href={asset('media/revit/' + view.file)} target="_blank" rel="noreferrer">Open full view <ArrowUpRight size={13} /></a></figcaption>
          </figure>
          <div className="native-sidebar">
            <div className="native-switch" role="group" aria-label="Snowdon Towers model view">
              {nativeViews.map(({ id, label }, i) => <button key={id} type="button" aria-pressed={index === i} onClick={() => setIndex(i)}><span>0{i + 1}</span>{label}<ArrowRight size={17} /></button>)}
            </div>
            <div className="native-sidebar-copy">
              <h3>Try the same type of work</h3>
              <p>Generate a plan and elevations in the Room to View browser exercise using the separate AT-01 fixture.</p>
              <Link to="/demos/room-to-view">Open Room to View <ArrowUpRight size={16} /></Link>
            </div>
            <a className="native-credit" href={snowdonSource}>Model source · Autodesk Snowdon Towers <ArrowUpRight size={13} /></a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div className="automation-home">
      <section className="automation-hero">
        <div className="wrap-wide">
          <div className="hero-top">
            <div>
              <p className="eyebrow">Navneet Singh / BIM tools for Revit &amp; CAD</p>
              <h1><span><i>From model</i></span> <span><i>to handover</i></span></h1>
            </div>
            <div className="hero-top-side">
              <p className="lead">Tools I have developed for publishing drawing sets, managing parameters and reviewing model health. Try the real dialogs below on a sample project.</p>
              <div className="hero-cta">
                <Link className="btn btn-primary" to="/demos#demo-index">Browse {STATS.demos} browser demos <ArrowRight size={17} /></Link>
                <Link className="home-secondary" to="/plugins">Tool catalog <ArrowUpRight size={15} /></Link>
              </div>
            </div>
          </div>
          <LiveHero />
          <dl className="home-stats">
            {heroStats.map(({ value, label }) => <div key={label}><dd><CountUp to={value} /></dd><dt>{label}</dt></div>)}
          </dl>
        </div>
      </section>

      <section className="home-band" id="live-demo" aria-labelledby="home-project-title">
        <div className="wrap home-band-grid">
          <Reveal>
            <p className="eyebrow">Sample project / {DEMO_PROJECT.code}</p>
            <h2 id="home-project-title">{DEMO_PROJECT.name}</h2>
            <p>Follow four exercises from room setup to drawing review. Each opens with its own sample data.</p>
            <Link to="/demos#sample-project" className="btn btn-primary">Open {DEMO_PROJECT.code} <ArrowRight size={17} /></Link>
          </Reveal>
          <ol>
            {PROJECT_WORKFLOW.map((step, i) => (
              <Reveal as="li" key={step.id} delay={i * 70}>
                <Link to={'/demos/' + step.id}><b>0{i + 1}</b><span>{step.phase}</span><strong>{step.title}</strong><ArrowRight size={18} aria-hidden="true" /></Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section home-desktop" aria-labelledby="home-desktop-title">
        <div className="wrap">
          <Reveal className="native-title">
            <h2 id="home-desktop-title">I3D and Assistant in use</h2>
            <p>See the original interfaces, then try the workflow in your browser.</p>
          </Reveal>
          <div className="home-desktop-grid">
            <Reveal>
              <article>
                <img src={asset('media/i3d/material-workspace.png')} alt="I3D Material workspace showing the original textured chair mesh" loading="lazy" decoding="async" />
                <div><p className="eyebrow">I3D / Desktop capture</p><h3>Set the material for a Revit asset</h3>
                  <Link to="/demos/architech-i3d">Try the I3D workflow <ArrowUpRight size={16} /></Link></div>
              </article>
            </Reveal>
            <Reveal delay={90}>
              <article>
                <div className="home-assistant-capture">
                  <img src={asset('media/assistant/active-view-exchange.png')} alt="Assistant replies Cover to a question about the active Revit view" loading="lazy" decoding="async" />
                  <img src={asset('media/assistant/composer-modes.png')} alt="Assistant composer with Ask, Search and Build modes" loading="lazy" decoding="async" />
                </div>
                <div><p className="eyebrow">Assistant / Desktop capture</p><h3>Ask about the active Revit view</h3>
                  <Link to="/demos/architech-assistant">Try the Assistant workflow <ArrowUpRight size={16} /></Link></div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <RevitViews />

      <section className="section suite-index" aria-labelledby="suite-index-title">
        <div className="wrap">
          <Reveal className="native-title">
            <h2 id="suite-index-title">Choose a product line</h2>
            <p>Find documentation, modeling and review tools for Revit, plus I3D and AI connectors for supported CAD hosts.</p>
          </Reveal>
          <ul className="home-suite-list">
            {SUITES.map((suite, i) => (
              <Reveal as="li" key={suite.id} delay={i * 60}><Link to={'/plugins?suite=' + suite.id}>
                <span className="home-suite-id">0{i + 1}</span>
                <div><h3>{suite.name}</h3><p>{suite.focus}</p></div>
                <p className="home-suite-summary">{suite.summary}</p>
                <span className="home-suite-count">{PRODUCTS.filter((item) => item.suite === suite.id).length} tools</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link></Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="automation-contact">
        <Reveal className="wrap">
          <h2>Have a workflow in mind?</h2>
          <p>Tell me about a task your team repeats every week, or share a suggestion for one of these tools.</p>
          <Link className="btn btn-primary" to="/connect">Discuss a workflow <ArrowRight size={16} /></Link>
        </Reveal>
      </section>
    </div>
  )
}
