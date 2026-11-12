import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, MessageSquare, AlertCircle, FileCheck2 } from 'lucide-react'
import { PRODUCTS, productBySlug } from '../data/catalog'
import { suiteById } from '../data/suites'
import { DialogGallery } from '../components/DialogGallery'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Layout'
import { asset } from '../components/Brand'
import NotFound from './NotFound'
import './product-evidence.css'

const CHAIR_PREVIEW = 'media/i3d/chair-mesh.png'
const DRAGON_PLACEMENT = 'media/i3d/revit-placement-0.6.36.webp'

export default function Product() {
  const { slug = '' } = useParams()
  const p = productBySlug(slug)
  if (!p) return <NotFound />
  const suite = suiteById(p.suite)
  const dialogCount = new Set(p.dialogs.map((d) => d.id)).size
  const screenshots = p.dialogs.filter((d) => d.real).length
  const hasRecordedPlacement = p.media?.some(({ src }) => src === DRAGON_PLACEMENT)
  const hasChairPreview = p.slug === 'architech-i3d'
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
              <h1>{p.name}</h1>
              <p className="suite-tag" style={{ ['--suite' as string]: suite.color }}>{suite.name}, {p.panel}</p>
              <p className="lead">{p.tagline}</p>
              <div className="hero-cta">
                {p.dialogs.length > 0
                  ? <a className="btn btn-primary" href="#dialog-reference">See the {dialogCount === 1 ? 'dialog' : dialogCount + ' dialogs'}</a>
                  : p.media?.length ? <a className="btn btn-ghost" href="#dialog-reference">View desktop visuals</a> : null}
                <Link className={`btn ${p.dialogs.length ? 'btn-ghost' : 'btn-primary'}`} to={`/connect?type=walkthrough&product=${p.slug}`}><MessageSquare size={17} /> Request a walkthrough</Link>
              </div>
              {(hasChairPreview || hasRecordedPlacement) && (
                <div className="product-scenario-links">
                  {hasChairPreview && <a href="#desktop-chair-preview">See the desktop chair preview</a>}
                  {hasRecordedPlacement && <a href="#recorded-placement">See the separate Revit 2024 capture</a>}
                </div>
              )}
            </div>
            <div className="glass spec" aria-label="Compatibility">
              <div className="spec-row"><span>Suite</span><span>{suite.name}</span></div>
              <div className="spec-row"><span>{isRevitTool ? 'Ribbon location' : 'Type'}</span><span>{ribbon}</span></div>
              <div className="spec-row"><span>Software</span><span>{p.software.join(', ')}</span></div>
              <div className="spec-row"><span>Revit versions</span><span>{revit}</span></div>
              {p.platform && <div className="spec-row"><span>Platform</span><span>{p.platform}</span></div>}
              <div className="spec-row"><span>Dialogs shown</span><span>{p.dialogs.length ? `${dialogCount} in ${p.dialogs.length} ${p.dialogs.length === 1 ? 'picture' : 'pictures'}` : p.media ? 'Product media below' : 'Walkthrough on request'}</span></div>
            </div>
          </div>
        </div>
      </section>

      {p.problem && (
        <section className="section" style={{ paddingTop: 20, paddingBottom: 40 }}>
          <div className="wrap ps-grid">
            <Reveal><div className="glass ps-card" style={{ height: '100%' }}>
              <h3>What slows teams down</h3>
              <p>{p.problem}</p>
            </div></Reveal>
            <Reveal delay={80}><div className="glass ps-card" style={{ height: '100%', borderColor: 'var(--line-strong)' }}>
              <h3>What {p.name} does</h3>
              <p>{p.tagline}{p.capabilities[0] && p.capabilities[0] !== p.tagline ? ` ${p.capabilities[0]}` : ''}</p>
            </div></Reveal>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="wrap grid-2" style={{ alignItems: 'start', gap: 28 }}>
          <Reveal>
            <h2 style={{ margin: '12px 0 20px', fontSize: 'clamp(1.6rem, 2.6vw, 2.1rem)' }}>How it works</h2>
            <ul className="feature-list">
              {(p.capabilities.length ? p.capabilities : [p.description]).map((c) => <li key={c}><CheckCircle2 size={18} /><span>{c}</span></li>)}
            </ul>
          </Reveal>
          <Reveal delay={80}>
            {p.safeguards.length > 0 && <>
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
        <section className="section" id="dialog-reference" style={{ paddingTop: 20, scrollMarginTop: '124px' }}>
          <div className="wrap">
            <Reveal className="section-head">
              <div><h2>{p.dialogs.length ? 'Its dialogs' : 'Desktop captures and illustrations'}</h2></div>
              {p.dialogs.length > 0 && <p className="lead">{dialogCount} dialog{dialogCount > 1 ? 's' : ''}, as built. Step through them, or zoom one to full size.</p>}
            </Reveal>
            {p.dialogs.length > 0 && <DialogGallery key={p.slug} product={p} />}
            {p.media && (
              <div className={hasChairPreview ? 'grid-2 product-media-pair' : 'grid-3'} style={{ marginTop: 20 }}>
                {hasChairPreview && (
                  <figure id="desktop-chair-preview" className="product-media">
                <img src={asset(CHAIR_PREVIEW)} alt="Upholstered chair in the textured I3D Desktop Material workspace" loading="lazy" />
                    <figcaption>
                      <strong>Captured in I3D Desktop</strong>
                      <span>Chair geometry and texture at the desktop preview stage, before export.</span>
                    </figcaption>
                  </figure>
                )}
                {p.media.map((media) => {
                  const placement = media.src === DRAGON_PLACEMENT
                  const label = placement ? 'Recorded in Revit 2024' : media.kind === 'animation' ? 'Workflow illustration' : 'Desktop capture'
                  return (
                    <figure key={media.src} id={placement ? 'recorded-placement' : undefined} className="product-media">
                      <img src={asset(media.src)} alt={media.alt} loading="lazy" />
                      <figcaption>
                        <strong>{label}</strong>
                        <span>{placement ? 'Dragon placement from a separate desktop validation run.' : media.alt}</span>
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            )}
          </div>
        </section>
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
              <span className="eyebrow">Evidence and scope</span>
              <ul className="feature-list" style={{ marginTop: 16 }}>
                {isRevitTool && <li><FileCheck2 size={18} /><span>The native add-in targets Revit {revit}. Its ribbon location is {ribbon}.</span></li>}
                {screenshots > 0 && <li><FileCheck2 size={18} /><span>{screenshots} dialog {screenshots === 1 ? 'picture is a screenshot' : 'pictures are screenshots'} of the installed build.</span></li>}
                {p.dialogs.length > screenshots && <li><FileCheck2 size={18} /><span>{p.dialogs.length - screenshots} dialog {p.dialogs.length - screenshots === 1 ? 'picture is' : 'pictures are'} rendered from the product’s own window code with sample data.</span></li>}
                {hasRecordedPlacement && <li><FileCheck2 size={18} /><span>The Revit placement image records a separate host run of the Dragon fixture.</span></li>}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 20 }}>
          <div className="wrap">
            <div className="section-head"><div><h2>More in {suite.name}</h2></div><Link className="btn btn-ghost" to={`/plugins?suite=${p.suite}`}>All {suite.short} products</Link></div>
            <div className="grid-3">{related.map((r) => <ProductCard key={r.slug} p={r} />)}</div>
          </div>
        </section>
      )}
    </>
  )
}
