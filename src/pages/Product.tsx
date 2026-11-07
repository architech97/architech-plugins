import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ShieldCheck, PlayCircle, MessageSquare, Tag, AlertCircle, FileCheck2 } from 'lucide-react'
import { PRODUCTS, productBySlug } from '../data/catalog'
import { suiteById } from '../data/suites'
import { demoById } from '../demo/registry'
import { DemoPlayer } from '../demo/DemoPlayer'
import { DialogGallery } from '../components/DialogGallery'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Layout'
import { asset } from '../components/Brand'
import NotFound from './NotFound'

export default function Product() {
  const { slug = '' } = useParams()
  const p = productBySlug(slug)
  if (!p) return <NotFound />
  const suite = suiteById(p.suite)
  const demo = p.demo ? demoById(p.demo) : undefined
  const related = PRODUCTS.filter((x) => x.slug !== p.slug && x.suite === p.suite && x.panel === p.panel).concat(PRODUCTS.filter((x) => x.slug !== p.slug && x.suite === p.suite && x.panel !== p.panel)).slice(0, 3)
  const ribbon = ['folio', 'forge', 'sentinel'].includes(p.suite) ? `${suite.name} › ${p.panel}` : p.panel
  const revit = p.revit.length ? (p.revit.length > 1 ? p.revit.join(', ') : p.revit[0]) : '—'
  const isRevitTool = ['folio', 'forge', 'sentinel'].includes(p.suite)

  return (
    <>
      <section className="p-hero">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/plugins">Plugins</Link><span>/</span><Link to={`/plugins?suite=${p.suite}`}>{suite.name}</Link><span>/</span><span>{p.name}</span>
          </nav>
          <div className="p-hero-grid">
            <div>
              <span className="suite-tag" style={{ ['--suite' as string]: suite.color }}>{suite.name} · {p.panel}</span>
              <h1>{p.name}</h1>
              <p className="lead">{p.tagline}</p>
              <div className="hero-cta">
                {demo && <a className="btn btn-primary" href="#demo"><PlayCircle size={18} /> Try the live demo</a>}
                <Link className={`btn ${demo ? 'btn-ghost' : 'btn-primary'}`} to={`/custom-development?type=demo&product=${p.slug}`}><MessageSquare size={17} /> Request a demo</Link>
                <Link className="btn btn-ghost" to={`/pricing?product=${p.slug}`}><Tag size={17} /> Pricing</Link>
              </div>
            </div>
            <div className="glass spec" aria-label="Compatibility">
              <div className="spec-row"><span>Suite</span><span>{suite.name}</span></div>
              <div className="spec-row"><span>{isRevitTool ? 'Ribbon location' : 'Type'}</span><span>{ribbon}</span></div>
              <div className="spec-row"><span>Software</span><span>{p.software.join(', ')}</span></div>
              <div className="spec-row"><span>Revit versions</span><span>{revit}</span></div>
              {p.platform && <div className="spec-row"><span>Platform</span><span>{p.platform}</span></div>}
              <div className="spec-row"><span>Interactive demo</span><span>{demo ? 'Available' : p.dialogs.length ? 'Dialog renders below' : p.media ? 'Product media below' : 'Guided demo on request'}</span></div>
              <div className="spec-row"><span>Licensing</span><span>Pricing to be announced</span></div>
            </div>
          </div>
        </div>
      </section>

      {p.problem && (
        <section className="section" style={{ paddingTop: 20, paddingBottom: 40 }}>
          <div className="wrap ps-grid">
            <Reveal><div className="glass ps-card" style={{ height: '100%' }}>
              <span className="eyebrow" style={{ color: 'var(--warn)' }}>The problem</span>
              <h3>What slows teams down</h3>
              <p>{p.problem}</p>
            </div></Reveal>
            <Reveal delay={80}><div className="glass ps-card" style={{ height: '100%', borderColor: 'rgba(34,211,238,.35)' }}>
              <span className="eyebrow">The solution</span>
              <h3>What {p.name} does</h3>
              <p>{p.tagline}{p.capabilities[0] && p.capabilities[0] !== p.tagline ? ` ${p.capabilities[0]}` : ''}</p>
            </div></Reveal>
          </div>
        </section>
      )}

      {demo && (
        <section className="section" id="demo" style={{ paddingTop: 40 }}>
          <div className="wrap-wide">
            <Reveal className="section-head">
              <div><span className="eyebrow">Interactive demonstration</span><h2>{demo.title}</h2></div>
              <p className="lead">{demo.summary}</p>
            </Reveal>
            <DemoPlayer demo={demo} />
            <div className="notice" style={{ marginTop: 16 }}>
              <b style={{ color: 'var(--text)' }}>How this simulation was built.</b> {demo.basis.join(' ')} It runs entirely in your browser on sample data and never opens, reads or changes a Revit model.
            </div>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: demo ? 40 : 20 }}>
        <div className="wrap grid-2" style={{ alignItems: 'start', gap: 28 }}>
          <Reveal>
            <span className="eyebrow">Capabilities</span>
            <h2 style={{ margin: '12px 0 20px', fontSize: 'clamp(1.6rem, 2.6vw, 2.1rem)' }}>How it works</h2>
            <ul className="feature-list">
              {(p.capabilities.length ? p.capabilities : [p.description]).map((c) => <li key={c}><CheckCircle2 size={18} /><span>{c}</span></li>)}
            </ul>
          </Reveal>
          <Reveal delay={80}>
            {p.safeguards.length > 0 && <>
              <span className="eyebrow">Safeguards</span>
              <h2 style={{ margin: '12px 0 20px', fontSize: 'clamp(1.6rem, 2.6vw, 2.1rem)' }}>Built to be reviewed</h2>
              <ul className="feature-list" style={{ marginBottom: 28 }}>
                {p.safeguards.map((c) => <li key={c}><ShieldCheck size={18} /><span>{c}</span></li>)}
              </ul>
            </>}
            {p.requirements && <>
              <span className="eyebrow">Requirements</span>
              <ul className="feature-list" style={{ marginTop: 16 }}>{p.requirements.map((r) => <li key={r}><AlertCircle size={18} /><span>{r}</span></li>)}</ul>
            </>}
          </Reveal>
        </div>
      </section>

      {(p.dialogs.length > 0 || p.media?.length) && (
        <section className="section" style={{ paddingTop: 20 }}>
          <div className="wrap">
            <Reveal className="section-head">
              <div><span className="eyebrow">Screenshots</span><h2>{p.dialogs.length ? 'The real dialogs' : 'Product media'}</h2></div>
              {p.dialogs.length > 0 && <p className="lead">{p.dialogs.length} dialog{p.dialogs.length > 1 ? 's' : ''} from the shipping plugin, rendered from its own layout in both themes.</p>}
            </Reveal>
            {p.dialogs.length > 0 && <Reveal><DialogGallery dialogs={p.dialogs} name={p.name} /></Reveal>}
            {p.media && (
              <div className="grid-3" style={{ marginTop: 20 }}>
                {p.media.map((m) => <figure key={m.src} className="glass" style={{ margin: 0, padding: 10 }}><img src={asset(m.src)} alt={m.alt} loading="lazy" style={{ borderRadius: 10 }} /><figcaption className="caption">{m.alt}</figcaption></figure>)}
              </div>
            )}
          </div>
        </section>
      )}
      {p.dialogs.length === 0 && isRevitTool && (
        <section className="section" style={{ paddingTop: 0, paddingBottom: 40 }}><div className="wrap"><div className="notice">Screenshots and an interactive demo for {p.name} are being added. Request a guided demo to see it working now.</div></div></section>
      )}

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="wrap grid-2" style={{ alignItems: 'start', gap: 28 }}>
          <Reveal className="glass" >
            <div style={{ padding: 26 }}>
              <span className="eyebrow">From the product description</span>
              <p style={{ marginTop: 14, color: 'var(--text-2)', lineHeight: 1.75 }}>{p.description}</p>
            </div>
          </Reveal>
          <Reveal delay={80} className="glass">
            <div style={{ padding: 26 }}>
              <span className="eyebrow">Evidence</span>
              <ul className="feature-list" style={{ marginTop: 16 }}>
                {isRevitTool && <li><FileCheck2 size={18} /><span>Ships as a compiled Revit add-in on the ArchiTECH ribbon, built for Revit {revit}.</span></li>}
                {p.dialogs.length > 0 && <li><FileCheck2 size={18} /><span>Every dialog shown here was rendered from the plugin's own layout and checked for readable text contrast in Dark and Light.</span></li>}
                {demo && <li><FileCheck2 size={18} /><span>The interactive demo follows the dialog's real labels, options and rules, listed under the demo.</span></li>}
                <li><AlertCircle size={18} /><span>Measured time savings will be published per tool after pilot projects. No productivity figure on this site is estimated.</span></li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 20 }}>
          <div className="wrap">
            <div className="section-head"><div><span className="eyebrow">Related</span><h2>More in {suite.name}</h2></div><Link className="btn btn-ghost" to={`/plugins?suite=${p.suite}`}>All {suite.short} products <ArrowRight size={17} /></Link></div>
            <div className="grid-3">{related.map((r) => <ProductCard key={r.slug} p={r} />)}</div>
          </div>
        </section>
      )}
    </>
  )
}
