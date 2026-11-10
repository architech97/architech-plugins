import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, CircleAlert, Play, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PRODUCTS, STATS } from '../data/catalog'
import { SUITES } from '../data/suites'
import { asset } from '../components/Brand'
import { DEMO_PROJECT, PROJECT_WORKFLOW } from '../data/demoProject'
import { SHEETS } from '../demo/sample'
import './home.css'

const plans = SHEETS.filter(({ number }) => number === 'A-101' || number === 'A-102')
const registerModes = [
  { id: 'existing', label: 'Current set' },
  { id: 'proposed', label: 'Preview changes' },
  { id: 'conflict', label: 'Check collision' },
] as const
type RegisterMode = typeof registerModes[number]['id']

const nativeViews = [
  { id: 'axon', label: '3D view', reference: 'A901 · Roof perspective', file: 'snowdon-axon.webp', alt: 'Snowdon Towers roof gardens and street façades in an elevated Revit camera view' },
  { id: 'plan', label: 'Level 2 plan', reference: 'SD102 · Schematic plan', file: 'snowdon-plan.webp', alt: 'Snowdon Towers Level 2 schematic plan with room labels, drawing grids and an occupancy legend' },
] as const
const snowdonSource = 'https://help.autodesk.com/cloudhelp/2024/ENU/Revit-GetStarted/files/GUID-5DA26FF7-85B3-4E9D-A9F2-FADDD02D88D6.htm'

function SheetRegister() {
  const [mode, setMode] = useState<RegisterMode>('proposed')
  const conflict = mode === 'conflict'
  const proposed = mode === 'proposed'
  return (
    <figure className="issue-preview">
      <figcaption><span><ScanLine size={15} /> Sheet Manager</span><span>{DEMO_PROJECT.code} / {DEMO_PROJECT.revision}</span></figcaption>
      <div className="issue-paper">
        <div className="issue-heading">
          <div><p>Drawing register / Browser sample</p><h2>Floor plans</h2></div>
          <span className="issue-stamp">A–100<br />SERIES</span>
        </div>
        <div className="issue-controls" role="group" aria-label="Sheet register example">
          {registerModes.map(({ id, label }) => <button type="button" key={id} aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>)}
        </div>
        <table className="issue-table">
          <thead><tr><th scope="col">Drawing</th><th scope="col">Current</th><th scope="col">{mode === 'existing' ? 'Issue' : 'Proposed'}</th></tr></thead>
          <tbody>
            {plans.map((sheet, i) => (
              <tr key={sheet.id}>
                <th scope="row">{sheet.name}<small>{sheet.titleBlock} · {sheet.views} views</small></th>
                <td>{sheet.number}</td>
                <td>
                  {proposed ? <b className="issue-number" key={mode}>{sheet.number.replace(/^A-/, 'GA-')}</b>
                    : conflict && i === 0 ? <b className="issue-number issue-error" key={mode}>A-102</b>
                    : conflict ? <span title="Outside the change scope">—</span> : sheet.revision}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={'issue-status' + (conflict ? ' is-conflict' : '')} role="status">
          {conflict ? <CircleAlert size={16} /> : <Check size={16} />}
          {conflict ? 'Blocked · A-102 is already in use.' : proposed ? '2 sheets ready for review. View placements are retained.' : '2 floor plans in revision P02.'}
        </div>
      </div>
      <div className="issue-footer"><span>{DEMO_PROJECT.name}</span><Link to="/demos/sheet-manager">Try the full demo <ArrowUpRight size={16} /></Link></div>
    </figure>
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
        <div className="native-asset">
          <img src={asset('media/i3d/chair-result-preview.webp')} alt="Textured chair in the ArchiTECH I3D result preview" width={548} height={672} loading="lazy" decoding="async" />
          <div><p className="eyebrow">ArchiTECH I3D / Desktop capture</p><h3>Inspect a textured asset</h3><p>The chair is shown in I3D’s result preview. The browser exercise steps through sizing and simulated Revit family export.</p><Link to="/demos/architech-i3d">Try the I3D workflow <ArrowUpRight size={16} /></Link></div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div className="automation-home">
      <section className="automation-hero">
        <div className="wrap automation-hero-grid">
          <div className="automation-hero-copy">
            <p className="eyebrow">ArchiTECH Automation / BIM tools</p>
            <h1><span>From model</span>{' '}<span>to drawing set</span></h1>
            <p className="lead">Prepare sheets, generate room views and review model warnings. Start with a sample project or explore the tools for your software.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/demos#sample-project"><Play size={17} /> Start the sample project</Link>
              <Link className="home-secondary" to="/plugins">Browse {STATS.products} tools <ArrowRight size={17} /></Link>
            </div>
            <p className="automation-hero-meta"><span>Browser demos · Sample data</span><a href="#revit-views">View the native Revit model</a></p>
          </div>
          <SheetRegister />
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
