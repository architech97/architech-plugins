import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { asset } from '../components/Brand'
import { dialogAlt, imageProps } from '../components/dialogImage'
import { browseAllLabel, heroLead, windowsLine } from '../data/countsLabel'
import counts from '../data/counts.generated.json'
import { FEATURED_TOOLS, HERO_SIZES } from '../data/featured'
import hero from '../data/hero.generated.json'
import type { DialogShot } from '../data/types'
import HomeSections from './HomeSections'
import './home.css'

const SHEETS = [
  { no: 'A-101', name: 'Ground floor plan', file: 'plan-drawing-480.webp', paper: true, w: 480, h: 387 },
  { no: 'A-102', name: 'Rendered plan', file: 'plan-render-480.webp', w: 480, h: 391 },
  { no: 'A-201', name: 'Front view, day', file: 'front-day-480.webp', w: 480, h: 319 },
  { no: 'A-202', name: 'Front view, dusk', file: 'front-dusk-480.webp', w: 480, h: 319 },
]

const HERO = hero as unknown as DialogShot
const HERO_TOOL = { name: FEATURED_TOOLS[0].title, software: ['Revit'], suite: 'folio' as const }

/** The result first: the real Sheet Export window, and the set that comes out of it. */
function ResultLoop() {
  const sheetsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = sheetsRef.current
    if (!root) return
    root.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
      if (!img.getAttribute('src')) img.src = img.dataset.src || ''
    })
  }, [])
  return (
    <figure className="loop">
      <div className="loop-stage">
        <div className="loop-sheets" ref={sheetsRef}>
          {SHEETS.map((sheet, i) => (
            <div className={'loop-sheet s' + i} key={sheet.no} aria-hidden="true">
              <div className={'loop-sheet-art' + (sheet.paper ? ' paper' : '')}><img data-src={asset('media/house/' + sheet.file)} alt="" width={sheet.w} height={sheet.h} decoding="async" /></div>
              <p><b>{sheet.no}</b>{sheet.name}<i>PDF</i></p>
            </div>
          ))}
        </div>
        <img className="loop-panel" {...imageProps(HERO.dark, 420)} sizes={HERO_SIZES} alt={dialogAlt(HERO_TOOL, HERO)} decoding="async" fetchPriority="low" />
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
            <p className="lead">{heroLead(counts)}</p>
            <p className="ah-honest">{windowsLine(counts.awaitingDialogNote)}</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/plugins/architech-i3d#try-demo">Try I3D in your browser</Link>
              <Link className="home-secondary" to="/plugins">{browseAllLabel(counts.products)}</Link>
            </div>
            <p className="ah-try">Also live in your browser: <Link to="/plugins/architech-assistant#try-demo">the Assistant</Link> and <Link to="/plugins/revit-mcp#try-demo">the MCP Connector</Link>.</p>
          </div>
          <ResultLoop />
        </div>
      </section>

      <HomeSections />
    </div>
  )
}
