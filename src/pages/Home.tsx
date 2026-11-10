import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PRODUCTS, STATS } from '../data/catalog'
import { SUITES } from '../data/suites'
import { asset } from '../components/Brand'
import { DEMO_PROJECT, PROJECT_WORKFLOW } from '../data/demoProject'
import { FEATURED_TOOLS } from '../data/featured'
import './home.css'

const nativeViews = [
  { id: 'axon', label: '3D view', reference: 'A901 · Roof perspective', file: 'snowdon-axon.webp', alt: 'Snowdon Towers roof gardens and street façades in an elevated Revit camera view' },
  { id: 'plan', label: 'Level 2 plan', reference: 'SD102 · Schematic plan', file: 'snowdon-plan.webp', alt: 'Snowdon Towers Level 2 schematic plan with room labels, drawing grids and an occupancy legend' },
] as const
const snowdonSource = 'https://help.autodesk.com/cloudhelp/2024/ENU/Revit-GetStarted/files/GUID-5DA26FF7-85B3-4E9D-A9F2-FADDD02D88D6.htm'

function FeaturedWorkflows() {
  const [selected, setSelected] = useState(0)
  const tool = FEATURED_TOOLS[selected]
  return (
    <div className="hero-workflows">
      <div className="hero-workflow-nav" role="group" aria-label="Featured suite tools">
        {FEATURED_TOOLS.map(({ suite, title, slug }, index) => <button type="button" key={slug}
          aria-pressed={selected === index} onClick={() => setSelected(index)}>
          <span aria-hidden="true">0{index + 1}</span>
          <span><small>{suite}</small><strong>{title}</strong></span>
          <ArrowRight size={15} aria-hidden="true" />
        </button>)}
      </div>
      <figure className="hero-tool-plate">
        <div className="hero-plate-header"><span>{tool.suite} / {tool.title}</span><span>{tool.previewLabel}</span></div>
        <Link to={'/plugins/' + tool.slug + '#dialog-reference'} className="hero-plate-image" aria-label={'Inspect the ' + tool.title + ' dialog'}>
          <img key={tool.slug} src={asset(tool.preview)} alt={tool.alt} decoding="async" />
        </Link>
        <figcaption>
          <div aria-live="polite"><strong>{tool.task}</strong><p>{tool.description}</p></div>
          <Link to={'/demos/' + tool.slug} className="btn btn-sm btn-primary"><Play size={14} aria-hidden="true" /> Try {tool.title}</Link>
        </figcaption>
      </figure>
    </div>
  )
}

function RevitViews() {
  const [index, setIndex] = useState(0)
  const view = nativeViews[index]
  return (
    <section className="section native-study" id="revit-views" aria-labelledby="native-title">
      <div className="wrap">
        <div className="native-title">
          <div><p className="eyebrow">02 / Native Revit study</p><h2 id="native-title">From model to plan</h2></div>
          <p>Explore two views exported from Autodesk’s Snowdon Towers sample project in Revit 2024.</p>
        </div>
        <div className="native-grid">
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
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div className="automation-home">
      <section className="automation-hero">
        <div className="wrap-wide automation-hero-grid">
          <div className="automation-hero-copy">
            <p className="eyebrow">ArchiTECH Automation / Revit &amp; CAD</p>
            <h1>From model to handover</h1>
            <p className="lead">Publish drawing sets, manage parameters and review model health on a sample project.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/demos#demo-index">Browse {STATS.demos} browser demos <ArrowRight size={17} /></Link>
              <Link className="home-secondary" to="/plugins">Tool catalog <ArrowUpRight size={15} /></Link>
            </div>
            <p className="automation-hero-meta"><span>Browser demos · Sample data</span><a href="#revit-views">View the native Revit model</a></p>
          </div>
          <FeaturedWorkflows />
        </div>
      </section>

      <section className="section home-desktop" aria-labelledby="home-desktop-title">
        <div className="wrap">
          <div className="native-title">
            <div><p className="eyebrow">Desktop workflows</p><h2 id="home-desktop-title">I3D and Assistant in use</h2></div>
            <p>See the original interfaces, then try the workflow in your browser.</p>
          </div>
          <div className="home-desktop-grid">
            <article>
              <img src={asset('media/i3d/material-workspace.png')} alt="I3D Material workspace showing the original textured chair mesh" loading="lazy" decoding="async" />
              <div><p className="eyebrow">I3D / Desktop capture</p><h3>Set the material for a Revit asset</h3>
                <Link to="/demos/architech-i3d">Try the I3D workflow <ArrowUpRight size={16} /></Link></div>
            </article>
            <article>
              <div className="home-assistant-capture">
                <img src={asset('media/assistant/active-view-exchange.png')} alt="Assistant replies Cover to a question about the active Revit view" loading="lazy" decoding="async" />
                <img src={asset('media/assistant/composer-modes.png')} alt="Assistant composer with Ask, Search and Build modes" loading="lazy" decoding="async" />
              </div>
              <div><p className="eyebrow">Assistant / Desktop capture</p><h3>Ask about the active Revit view</h3>
                <Link to="/demos/architech-assistant">Try the Assistant workflow <ArrowUpRight size={16} /></Link></div>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="live-demo">
        <div className="wrap">
          <div className="home-project home-project-blueprint">
            <div>
              <p className="eyebrow">01 / Sample project</p>
              <h2>{DEMO_PROJECT.name}</h2>
              <p>Follow four exercises from room setup to drawing review. Each opens with its own sample data.</p>
              <Link to="/demos#sample-project" className="btn btn-primary">Open {DEMO_PROJECT.code} <ArrowRight size={17} /></Link>
            </div>
            <ol>
              {PROJECT_WORKFLOW.map((step) => <li key={step.id}><Link to={'/demos/' + step.id}><span>{step.phase}</span><strong>{step.title}</strong><ArrowRight size={17} /></Link></li>)}
            </ol>
          </div>
        </div>
      </section>

      <RevitViews />

      <section className="section suite-index" aria-labelledby="suite-index-title">
        <div className="wrap">
          <div className="native-title">
            <div><p className="eyebrow">03 / Tool catalog</p><h2 id="suite-index-title">Choose a product line</h2></div>
            <p>Find documentation, modeling and review tools for Revit, plus I3D and AI connectors for supported CAD hosts.</p>
          </div>
          <ul className="home-suite-list">
            {SUITES.map((suite, i) => (
              <li key={suite.id}><Link to={'/plugins?suite=' + suite.id}>
                <span className="home-suite-id">0{i + 1}</span>
                <div><h3>{suite.name}</h3><p>{suite.focus}</p></div>
                <p className="home-suite-summary">{suite.summary}</p>
                <span className="home-suite-count">{PRODUCTS.filter((item) => item.suite === suite.id).length} tools</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section automation-contact">
        <div className="wrap">
          <div className="native-title">
            <div><p className="eyebrow">Custom development</p><h2>Have a workflow of your own?</h2></div>
            <Link className="btn btn-ghost" to="/custom-development">Describe your workflow <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </div>
  )
}
