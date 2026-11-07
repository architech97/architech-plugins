import { Link } from 'react-router-dom'
import { ArrowRight, PlayCircle, ShieldCheck, Undo2, Eye, Layers, Moon, Wrench, Sparkles, Boxes } from 'lucide-react'
import { PRODUCTS, STATS } from '../data/catalog'
import { SUITES } from '../data/suites'
import { DEMOS, demoById } from '../demo/registry'
import { DemoPlayer } from '../demo/DemoPlayer'
import { Reveal } from '../components/Layout'
import { asset, Mark } from '../components/Brand'
import { ProductCard } from '../components/ProductCard'

export default function Home() {
  const count = (id: string) => PRODUCTS.filter((p) => p.suite === id).length
  const featured = ['warnings-inspector', 'room-to-view', 'sheet-manager', 'room-to-finishes'].map((s) => PRODUCTS.find((p) => p.slug === s)!).filter(Boolean)
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">BIM automation software · Revit · AI</span>
            <h1>Professional BIM tools you can <span className="grad-text">try before you buy</span>.</h1>
            <p className="lead">ArchiTECH Automation is a suite of {STATS.products} productivity products for architects, BIM teams and design studios: documentation, modelling, model health and AI connectors, built from six years of architectural and BIM practice.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/demos"><PlayCircle size={18} /> Try a live plugin demo</Link>
              <Link className="btn btn-ghost" to="/plugins">Browse {STATS.products} products <ArrowRight size={17} /></Link>
            </div>
            <div className="hero-stats">
              <div><b>{STATS.products}</b><span>products in the catalogue</span></div>
              <div><b>{STATS.revitTools}</b><span>Revit tools in three suites</span></div>
              <div><b>{STATS.dialogs}</b><span>real dialogs, Dark and Light</span></div>
              <div><b>{STATS.demos}</b><span>interactive dialog demos</span></div>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 30 }}>
        <div className="wrap">
          <Reveal className="section-head">
            <div><span className="eyebrow">Product suites</span><h2>One platform, six product lines.</h2></div>
            <p className="lead">Every Revit tool lives on the ArchiTECH ribbon in one of three suites. I3D, the AI connectors and the pyRevit edition extend the same workflows.</p>
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
        <div className="wrap-wide">
          <Reveal className="section-head">
            <div><span className="eyebrow">Interactive demo</span><h2>Use the real dialog, right here.</h2></div>
            <p className="lead">These are browser replicas of the shipping dialogs, built from their actual layouts, labels and rules, with sample BIM data. Follow the guided steps or explore freely. Nothing runs in Revit.</p>
          </Reveal>
          <Reveal><DemoPlayer demo={demoById('sheet-manager')!} /></Reveal>
          <div className="grid-3" style={{ marginTop: 28 }}>
            {DEMOS.filter((d) => d.id !== 'sheet-manager').map((d, i) => (
              <Reveal key={d.id} delay={i * 50}>
                <Link to={`/demos/${d.id}`} className="glass suite-card" style={{ ['--suite' as string]: 'var(--cyan)' }}>
                  <span className="chip chip-dot" style={{ alignSelf: 'flex-start' }}>{d.ribbon.tab} · {d.ribbon.panel}</span>
                  <h3>{d.title}</h3>
                  <p>{d.summary}</p>
                  <span className="accent-text" style={{ fontWeight: 500, marginTop: 'auto' }}><PlayCircle size={15} style={{ verticalAlign: -3 }} /> Open the demo</span>
                </Link>
              </Reveal>
            ))}
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
              { icon: Moon, t: 'Dark and Light', d: 'Every dialog switches theme from its own header, and remembers the choice for the next one.' },
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
            <div><span className="eyebrow">Featured</span><h2>Start with the workflows teams ask for most.</h2></div>
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
            <p className="lead">I3D turns a photo or mesh into a dimensioned, textured asset and places it in Revit, running locally on one NVIDIA GPU. The MCP connectors give AI assistants typed, guarded tools in Revit, Rhino, SketchUp, AutoCAD and Blender, with results checked against the model.</p>
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
                <p className="lead">Commission a custom Revit add-in, a pyRevit tool or an AI automation, built to the same standards as the ArchiTECH suites.</p>
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

const shot = (slug: string, mode: 'dark' | 'light') => PRODUCTS.find((p) => p.slug === slug)?.dialogs[0]?.[mode] ?? ''

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hv-glow" />
      <div className="hv-frame glass">
        <img src={asset(shot('warnings-inspector', 'dark'))} alt="" />
      </div>
      <div className="hv-frame hv-back glass">
        <img src={asset(shot('room-to-view', 'light'))} alt="" />
      </div>
      <div className="hv-chip c1"><PlayCircle size={14} /> Interactive demos</div>
      <div className="hv-chip c2"><Mark size={16} /> 58 Revit tools</div>
      <div className="hv-chip c3"><Moon size={14} /> Dark · Light</div>
    </div>
  )
}
