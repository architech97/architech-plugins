import { Link, useParams } from 'react-router-dom'
import { PlayCircle, ArrowRight, Images } from 'lucide-react'
import { DEMOS, demoById } from '../demo/registry'
import { DemoPlayer } from '../demo/DemoPlayer'
import { PRODUCTS, productBySlug } from '../data/catalog'
import { suiteById } from '../data/suites'
import { Reveal } from '../components/Layout'
import { asset } from '../components/Brand'
import NotFound from './NotFound'

export function DemoHub() {
  const withDialogs = PRODUCTS.filter((p) => p.dialogs.length > 0 && !p.demo)
  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <span className="eyebrow">Live demos</span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', margin: '14px 0 14px' }}>Try the plugins in your browser.</h1>
        <p className="lead">Each demo is a working replica of a shipping ArchiTECH dialog: its layout, labels, options and rules, running on sample BIM data. Every simulation is clearly labelled and never touches Revit.</p>
        <div className="grid-3" style={{ marginTop: 36 }}>
          {DEMOS.map((d, i) => {
            const p = productBySlug(d.productSlug)
            const img = p?.dialogs[0]?.dark
            return (
              <Reveal key={d.id} delay={i * 50}>
                <Link to={`/demos/${d.id}`} className="pcard">
                  <div className="thumb">{img && <img src={asset(img)} alt="" loading="lazy" />}</div>
                  <span className="chip chip-dot" style={{ alignSelf: 'flex-start' }}>{d.ribbon.tab} · {d.ribbon.panel}</span>
                  <h3>{d.title}</h3>
                  <p>{d.summary}</p>
                  <span className="accent-text" style={{ fontWeight: 500, marginTop: 'auto' }}><PlayCircle size={15} style={{ verticalAlign: -3 }} /> {d.steps.length} guided steps</span>
                </Link>
              </Reveal>
            )
          })}
        </div>

        <div className="section-head" style={{ marginTop: 80 }}>
          <div><span className="eyebrow">Dialog gallery</span><h2>Real dialogs for {withDialogs.length} more tools</h2></div>
          <p className="lead">Interactive replicas are being added tool by tool. Until then, every product page shows its real dialogs in Dark and Light.</p>
        </div>
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
          {withDialogs.map((p) => (
            <Link key={p.slug} to={`/plugins/${p.slug}`} className="pcard" style={{ padding: 14, gap: 10 }}>
              <div className="thumb"><img src={asset(p.dialogs[0].dark!)} alt="" loading="lazy" /></div>
              <span className="suite-tag" style={{ ['--suite' as string]: suiteById(p.suite).color, fontSize: 11 }}>{suiteById(p.suite).short}</span>
              <h3 style={{ fontSize: '1.02rem' }}>{p.name}</h3>
              <span className="muted" style={{ fontSize: 13 }}><Images size={13} style={{ verticalAlign: -2 }} /> {p.dialogs.length} dialog{p.dialogs.length > 1 ? 's' : ''}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DemoPage() {
  const { id = '' } = useParams()
  const d = demoById(id)
  if (!d) return <NotFound />
  const p = productBySlug(d.productSlug)
  return (
    <section className="section" style={{ paddingTop: 40 }}>
      <div className="wrap-wide">
        <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/demos">Live demos</Link><span>/</span><span>{d.ribbon.button}</span></nav>
        <div className="section-head" style={{ marginBottom: 24 }}>
          <div><span className="eyebrow">{d.ribbon.tab} · {d.ribbon.panel}</span><h1 style={{ fontSize: 'clamp(1.9rem, 3.6vw, 2.8rem)', marginTop: 12 }}>{d.title}</h1></div>
          {p && <Link className="btn btn-ghost" to={`/plugins/${p.slug}`}>{p.name} product page <ArrowRight size={17} /></Link>}
        </div>
        <DemoPlayer demo={d} />
        <div className="notice" style={{ marginTop: 16 }}><b style={{ color: 'var(--text)' }}>How this simulation was built.</b> {d.basis.join(' ')} It runs entirely in your browser on sample data and never opens, reads or changes a Revit model.</div>
      </div>
    </section>
  )
}

export default function DemoRoute() {
  const { id } = useParams()
  return id ? <DemoPage /> : <DemoHub />
}
