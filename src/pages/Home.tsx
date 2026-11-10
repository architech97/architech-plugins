import { Link } from 'react-router-dom'
import { ArrowRight, PlayCircle, ShieldCheck, Undo2, Eye, Layers, Moon, Wrench, Sparkles, Boxes } from 'lucide-react'
import { PRODUCTS, STATS } from '../data/catalog'
import { SUITES } from '../data/suites'
import { Reveal } from '../components/Layout'
import { asset } from '../components/Brand'
import { ProductCard } from '../components/ProductCard'
import { DEMO_PROJECT, PROJECT_WORKFLOW } from '../data/demoProject'

export default function Home() {
  const count = (id: string) => PRODUCTS.filter((p) => p.suite === id).length
  const featured = ['warnings-inspector', 'room-to-view', 'sheet-manager', 'room-to-finishes'].map((s) => PRODUCTS.find((p) => p.slug === s)!).filter(Boolean)
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">BIM automation software · Revit · AI</span>
            <h1>From model to drawing set</h1>
            <p className="lead">Prepare drawings, build models and review standards with ArchiTECH Automation. Try the tools on a sample project before you choose a suite.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/demos"><PlayCircle size={18} /> Try a browser demo</Link>
              <Link className="btn btn-ghost" to="/plugins">Browse {STATS.products} products <ArrowRight size={17} /></Link>
            </div>
          </div>
          <HeroVisual />
        </div>
        <div className="wrap">
          <dl className="home-counts">
            <div><dt>Products</dt><dd>{STATS.products}</dd></div>
            <div><dt>Revit tools</dt><dd>{STATS.revitTools}</dd></div>
            <div><dt>Product lines</dt><dd>{SUITES.length}</dd></div>
            <div><dt>Interactive demos</dt><dd>{STATS.demos}</dd></div>
          </dl>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 30 }}>
        <div className="wrap">
          <Reveal className="section-head">
            <div><span className="eyebrow">Product suites</span><h2>One platform, five product lines.</h2></div>
            <p className="lead">Every Revit tool lives on the ArchiTECH ribbon in one of three suites. I3D and the AI connectors extend the same workflows.</p>
          </Reveal>
          <div className="grid-3">
            {SUITES.map((s, i) => (
              <Reveal key={s.id} delay={i * 60}>
                <Link to={`/plugins?suite=${s.id}`} className="glass suite-card" style={{ ['--suite' as string]: s.color }}>
                  <span className="suite-tag" style={{ ['--suite' as string]: s.color }}>{s.focus}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <h3 style={{ fontSize: '1.45rem' }}>{s.name}</h3>
                    <span className="count">{count(s.id)}</span>
                  </div>
                  <p>{s.summary}</p>
                  <span className="accent-text" style={{ fontWeight: 500, marginTop: 'auto' }}>Explore {s.short} <ArrowRight size={15} style={{ verticalAlign: -3 }} /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="live-demo">
        <div className="wrap">
          <div className="home-project">
            <div>
              <span className="eyebrow">Sample project / {DEMO_PROJECT.code}</span>
              <h2>Work through {DEMO_PROJECT.name}</h2>
              <p>Generate room views, review finishes, prepare a drawing set and check model warnings on fictional project data.</p>
              <Link to="/demos#sample-project" className="btn btn-primary"><PlayCircle size={17} /> Open the project board</Link>
            </div>
            <ol>
              {PROJECT_WORKFLOW.map((step) => <li key={step.id}><Link to={'/demos/' + step.id}><span>{step.phase}</span><strong>{step.title}</strong><ArrowRight size={17} /></Link></li>)}
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="section-head">
            <div><span className="eyebrow">Built for production models</span><h2>Designed around review, not surprises.</h2></div>
            <p className="lead">The same principles run through the Revit tools, as stated in their own descriptions.</p>
          </Reveal>
          <div className="grid-3">
            {[
              { icon: Eye, t: 'Preview before writing', d: 'Renumbering, parameter edits, finishes and more show the planned result first; only what you approve is written.' },
              { icon: Undo2, t: 'One undoable step', d: 'Batch runs are written as a single Revit transaction, so one Ctrl+Z reverses the whole run.' },
              { icon: ShieldCheck, t: 'Skips are named, not hidden', d: 'Borrowed, edited or unsupported elements are left alone and listed with the reason.' },
              { icon: Moon, t: 'Dark and Light', d: 'Switch themes in the dialog header or compare the supplied screenshots.' },
              { icon: Layers, t: 'One ribbon, one design system', d: 'All 58 Revit tools install on the ArchiTECH ribbon and share one dialog design system, theme and interaction patterns.' },
              { icon: Boxes, t: 'Data in and out', d: 'Excel and CSV round trips for schedules, sheets, parameters and reports.' },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 50}><div className="glass kpi" style={{ height: '100%' }}>
                <f.icon size={22} color="var(--cyan-2)" />
                <h3 style={{ margin: '14px 0 8px' }}>{f.t}</h3>
                <p className="muted" style={{ fontSize: 15 }}>{f.d}</p>
              </div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="section-head">
            <div><span className="eyebrow">Featured</span><h2>Start with a common BIM task.</h2></div>
            <Link className="btn btn-ghost" to="/plugins">See the full catalogue <ArrowRight size={17} /></Link>
          </Reveal>
          <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))' }}>
            {featured.map((p, i) => <Reveal key={p.slug} delay={i * 60}><ProductCard p={p} /></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid-2" style={{ alignItems: 'center', gap: 40 }}>
          <Reveal>
            <span className="eyebrow">ArchiTECH-I3D · AI connectors</span>
            <h2 style={{ margin: '14px 0 16px' }}>From a product photo to a Revit family. From a prompt to a guarded model edit.</h2>
            <p className="lead">I3D turns a photo or mesh into a dimensioned, textured asset and places it in Revit, running locally on one NVIDIA GPU. The MCP connectors give AI assistants typed tools in Revit, Rhino, SketchUp, AutoCAD and Blender.</p>
            <div className="hero-cta"><Link className="btn btn-primary" to="/plugins/architech-i3d"><Sparkles size={17} /> Explore I3D</Link><Link className="btn btn-ghost" to="/plugins?suite=ai">AI &amp; MCP connectors</Link></div>
          </Reveal>
          <Reveal delay={100}>
            <div className="glass" style={{ padding: 10, overflow: 'hidden' }}>
              <img src={asset('media/i3d/desktop-0.6.36.webp')} alt="ArchiTECH-I3D Desktop main window" loading="lazy" style={{ borderRadius: 12 }} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <Reveal>
            <div className="glass cta-band">
              <div>
                <span className="eyebrow">Custom development</span>
                <h2 style={{ margin: '12px 0 12px' }}>Need a tool your team doesn't have yet?</h2>
                <p className="lead">Commission a custom Revit add-in or an AI automation, built to the same standards as the ArchiTECH suites.</p>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <Link className="btn btn-primary" to="/custom-development"><Wrench size={17} /> Start an inquiry</Link>
                <Link className="btn btn-ghost" to="/custom-development?type=demo">Request a guided demo</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

function HeroVisual() {
  const shot = PRODUCTS.find((p) => p.slug === 'sheet-manager')?.dialogs[0]?.dark
  return (
    <figure className="home-proof">
      <figcaption><span>{DEMO_PROJECT.name} / {DEMO_PROJECT.code}</span><span>{DEMO_PROJECT.revision}</span></figcaption>
      <div className="home-proof-media">
        {shot && <img src={asset(shot)} alt="Sheet Manager dialog with numbered sample drawing sheets" fetchPriority="high" />}
      </div>
      <div className="home-proof-caption">
        <div><strong>Sheet Manager</strong><span>Renumber a sample drawing set</span></div>
        <Link to="/demos/sheet-manager" aria-label="Try Sheet Manager"><PlayCircle size={24} /></Link>
      </div>
    </figure>
  )
}
