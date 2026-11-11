import { lazy, Suspense } from 'react'
import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { asset } from '../components/Brand'
import './home.css'

const HomeSections = lazy(() => import('./HomeSections'))

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
      <figcaption>Sheet Export, using my Vasant Kunj drawings and visualisations.</figcaption>
    </figure>
  )
}

export default function Home() {
  return (
    <div className="automation-home">
      <section className="ah" data-continuity-bg="paper">
        <div className="wrap-wide ah-grid">
          <div className="ah-copy">
            <h1><span>Tools that finish</span> <span>the drawing set</span></h1>
            <p className="lead">Try my Revit tools for sheets, parameters and model checks on sample project data.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/demos/sheet-export"><Play size={15} aria-hidden="true" /> Run Sheet Export</Link>
              <Link className="home-secondary" to="/demos#demo-index">Browse the demo library</Link>
            </div>
          </div>
          <ResultLoop />
        </div>
      </section>

      <Suspense fallback={<div aria-hidden="true" style={{ minHeight: '100vh' }} />}>
        <HomeSections />
      </Suspense>
    </div>
  )
}
