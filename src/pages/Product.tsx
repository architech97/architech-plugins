import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ShieldCheck, PlayCircle, MessageSquare, Tag, AlertCircle, FileCheck2 } from 'lucide-react'
import { DEMO_PROJECT } from '../data/demoProject'
import { PRODUCTS, productBySlug } from '../data/catalog'
import { suiteById } from '../data/suites'
import { demoById } from '../demo/registry'
import { DemoPlayer } from '../demo/DemoPlayer'
import { DialogGallery } from '../components/DialogGallery'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Layout'
import { asset } from '../components/Brand'
import NotFound from './NotFound'
import './product-evidence.css'

const WORKFLOW_EXAMPLES: Partial<Record<string, { input: string; result: string; reference?: string }>> = {
  'sheet-manager': {
    input: 'A-101 Ground Floor Plan and A-102 First Floor Plan',
    result: 'Check the occupied A-102 number, then issue the two plans as GA-101 and GA-102.',
  },
  'room-to-view': {
    input: '101 Living Room and 102 Kitchen',
    result: 'Create plans and elevations, then see which views fit the selected sheet layout.',
  },
  'room-to-finishes': {
    input: 'Rooms 101, 102, 103 and 105 with a floor, ceiling and lining type',
    result: 'Review 12 planned rows, including Kitchen’s existing ceiling and the skipped Entrance Hall curtain wall.',
  },
  'warnings-inspector': {
    input: 'Critical warnings and wall element 301178',
    result: 'Review six affected element IDs and download the CSV for all nine warning groups.',
  },
  'architech-i3d': {
    input: 'Dragon reference image or prepared mesh, with a known height in millimetres',
    result: 'Review family save, load and placement as separate sample outcomes.',
    reference: 'Dragon asset fixture',
  },
  'architech-assistant': {
    input: 'Wall 401284 and its instance Comments value',
    result: 'Deny or approve one sample update, then read back the exact stored value.',
  },
}

const DEMO_FORMATS = {
  crafted: {
    label: 'Guided simulation',
    action: 'Start the guided demo',
    description: 'Work through a specific task with sample inputs and check what changes.',
  },
  replica: {
    label: 'Dialog explorer',
    action: 'Explore the dialog',
    description: 'Try the controls and inspect representative rows in a reconstruction of the exported dialog.',
  },
  workflow: {
    label: 'Workflow simulation',
    action: 'Try the sample workflow',
    description: 'Run a sample scenario and inspect the illustrated result.',
  },
}

const CHAIR_PREVIEW = 'media/i3d/chair-result-preview.webp'
const DRAGON_PLACEMENT = 'media/i3d/revit-placement-0.6.36.webp'

export default function Product() {
  const { slug = '' } = useParams()
  const p = productBySlug(slug)
  if (!p) return <NotFound />
  const suite = suiteById(p.suite)
  const demo = p.demo ? demoById(p.demo) : undefined
  const format = demo ? DEMO_FORMATS[demo.kind] : undefined
  const example = WORKFLOW_EXAMPLES[p.slug]
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
              <span className="suite-tag" style={{ ['--suite' as string]: suite.color }}>{suite.name} · {p.panel}</span>
              <h1>{p.name}</h1>
              <p className="lead">{p.tagline}</p>
              <div className="hero-cta">
                {format && <a className="btn btn-primary" href="#demo"><PlayCircle size={18} /> {format.action}</a>}
                <Link className={`btn ${demo ? 'btn-ghost' : 'btn-primary'}`} to={`/custom-development?type=demo&product=${p.slug}`}><MessageSquare size={17} /> Request a walkthrough</Link>
                <Link className="btn btn-ghost" to={`/pricing?product=${p.slug}`}><Tag size={17} /> Pricing</Link>
              </div>
              {example ? (
                <section className="product-scenario" aria-label="Sample workflow">
                  <p className="product-scenario-label">{example.reference ?? DEMO_PROJECT.name + ' / ' + DEMO_PROJECT.code}</p>
                  <dl>
                    <div><dt>Input</dt><dd>{example.input}</dd></div>
                    <div><dt>Result</dt><dd>{example.result}</dd></div>
                  </dl>
                  {(hasChairPreview || hasRecordedPlacement) && (
                    <div className="product-scenario-links">
                      {hasChairPreview && <a href="#desktop-chair-preview">See the desktop chair preview <ArrowRight size={14} /></a>}
                      {hasRecordedPlacement && <a href="#recorded-placement">See the separate Revit 2024 capture <ArrowRight size={14} /></a>}
                    </div>
                  )}
                </section>
              ) : format && <p className="product-format-note">{format.description}</p>}
            </div>
            <div className="glass spec" aria-label="Compatibility">
              <div className="spec-row"><span>Suite</span><span>{suite.name}</span></div>
              <div className="spec-row"><span>{isRevitTool ? 'Ribbon location' : 'Type'}</span><span>{ribbon}</span></div>
              <div className="spec-row"><span>Software</span><span>{p.software.join(', ')}</span></div>
              <div className="spec-row"><span>Revit versions</span><span>{revit}</span></div>
              {p.platform && <div className="spec-row"><span>Platform</span><span>{p.platform}</span></div>}
              <div className="spec-row"><span>Browser demo</span><span>{format ? format.label : p.dialogs.length ? 'Dialog renders below' : p.media ? 'Product media below' : 'Guided demo on request'}</span></div>
              <div className="spec-row"><span>Licensing</span><span>Pricing to be announced</span></div>
            </div>
          </div>
        </div>
      </section>

      {p.problem && !example && (
        <section className="section" style={{ paddingTop: 20, paddingBottom: 40 }}>
          <div className="wrap ps-grid">
            <Reveal><div className="glass ps-card" style={{ height: '100%' }}>
              <span className="eyebrow" style={{ color: 'var(--warn)' }}>The problem</span>
              <h3>What slows teams down</h3>
              <p>{p.problem}</p>
            </div></Reveal>
            <Reveal delay={80}><div className="glass ps-card" style={{ height: '100%', borderColor: 'var(--line-strong)' }}>
              <span className="eyebrow">The solution</span>
              <h3>What {p.name} does</h3>
              <p>{p.tagline}{p.capabilities[0] && p.capabilities[0] !== p.tagline ? ` ${p.capabilities[0]}` : ''}</p>
            </div></Reveal>
          </div>
        </section>
      )}

      {demo && format && (
        <section className="section" id="demo" style={{ paddingTop: 40 }}>
          <div className="wrap-wide">
            <Reveal className="section-head">
              <div><span className="eyebrow">{format.label}</span><h2>{demo.title}</h2></div>
              <Link className="btn btn-ghost" to={'/demos/' + demo.id}>Open full demo page <ArrowRight size={17} /></Link>
            </Reveal>
            <DemoPlayer key={demo.id} demo={demo} />
            <details className="product-provenance">
              <summary>What this browser demo represents</summary>
              <p>{format.description} Actions in the browser use sample data.</p>
              <ul>{demo.basis.map((fact) => <li key={fact}>{fact}</li>)}</ul>
            </details>
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
              <div><span className="eyebrow">Product reference</span><h2>{p.dialogs.length ? 'Dialog layout renders' : 'Desktop captures and illustrations'}</h2></div>
              {p.dialogs.length > 0 && <p className="lead">{p.dialogs.length} dialog{p.dialogs.length > 1 ? 's' : ''} rendered from the plugin layout with sample data in both themes.</p>}
            </Reveal>
            {p.dialogs.length > 0 && <Reveal><DialogGallery dialogs={p.dialogs} name={p.name} /></Reveal>}
            {p.media && (
              <div className={hasChairPreview ? 'grid-2 product-media-pair' : 'grid-3'} style={{ marginTop: 20 }}>
                {hasChairPreview && (
                  <figure id="desktop-chair-preview" className="product-media">
                    <img src={asset(CHAIR_PREVIEW)} alt="Upholstered chair in the textured 3D result preview in I3D Desktop" loading="lazy" />
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
                {p.dialogs.length > 0 && <li><FileCheck2 size={18} /><span>Dialog images are renders of exported layouts populated with sample data.</span></li>}
                {format && <li><FileCheck2 size={18} /><span>{format.label}. {format.description}</span></li>}
                {hasRecordedPlacement && <li><FileCheck2 size={18} /><span>The Revit placement image records a separate host run of the Dragon fixture.</span></li>}
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
