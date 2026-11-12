import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { asset } from '../components/Brand'
import { dialogAlt, imageProps } from '../components/dialogImage'
import { FEATURED_TOOLS, HERO_SIZES } from '../data/featured'
import hero from '../data/hero.generated.json'
import type { DialogShot } from '../data/types'
import './home.css'

const HomeSections = lazy(() => import('./HomeSections'))

const SHEETS = [
  { no: 'A-101', name: 'Ground floor plan', file: 'plan-drawing-480.webp', paper: true },
  { no: 'A-102', name: 'Rendered plan', file: 'plan-render-480.webp' },
  { no: 'A-201', name: 'Front view, day', file: 'front-day-480.webp' },
  { no: 'A-202', name: 'Front view, dusk', file: 'front-dusk-480.webp' },
]

// The hero reads one generated record, not the catalogue, so the first script stays small.
const HERO = hero as unknown as DialogShot
const HERO_TOOL = { name: FEATURED_TOOLS[0].title, software: ['Revit'], suite: 'folio' as const }

/** The result first: the real Sheet Export window, and the set that comes out of it. */
function ResultLoop() {
  return (
    <figure className="loop">
      <div className="loop-stage">
        <div className="loop-sheets">
          {SHEETS.map((sheet, i) => (
            <div className={'loop-sheet s' + i} key={sheet.no} aria-hidden="true">
              <div className={'loop-sheet-art' + (sheet.paper ? ' paper' : '')}><img src={asset('media/house/' + sheet.file)} alt="" decoding="async" /></div>
              <p><b>{sheet.no}</b>{sheet.name}<i>PDF</i></p>
            </div>
          ))}
        </div>
        <img className="loop-panel" {...imageProps(HERO.dark, 420)} sizes={HERO_SIZES} alt={dialogAlt(HERO_TOOL, HERO)} decoding="async" fetchPriority="high" />
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
            <p className="lead">58 Revit add-ins I designed and built for sheets, parameters and model checks, plus desktop apps and AI connectors. Every one shown through its real windows.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/demos/sheet-export">Open Sheet Export</Link>
              <Link className="home-secondary" to="/demos#demo-index">Browse every dialog</Link>
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
