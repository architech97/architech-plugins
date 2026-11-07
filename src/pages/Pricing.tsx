import { Link, useSearchParams } from 'react-router-dom'
import { Check, ChevronDown } from 'lucide-react'
import { PRODUCTS, productBySlug } from '../data/catalog'
import { SUITES } from '../data/suites'
import { Reveal } from '../components/Layout'

// Plan structure only. Prices are not confirmed yet, so none are shown.
const count = (id: string) => PRODUCTS.filter((p) => p.suite === id).length

export default function Pricing() {
  const [params] = useSearchParams()
  const product = productBySlug(params.get('product') ?? '')
  const plans = [
    { name: 'Suite subscription', for: 'One product line', items: [`Arch Folio (${count('folio')} tools), Arch Forge (${count('forge')}) or Arch Sentinel (${count('sentinel')})`, 'Every tool in the chosen suite', 'Updates while your subscription is active', 'Email support'] },
    { name: 'ArchiTECH Complete', for: 'All three Revit suites', featured: true, items: [`All ${count('folio') + count('forge') + count('sentinel')} Revit tools on one ribbon`, 'Arch Folio, Arch Forge and Arch Sentinel', 'New tools as they are released', 'Priority support'] },
    { name: 'Studio & Enterprise', for: 'Teams and firms', items: ['Volume licensing for named or shared seats', 'I3D and AI & MCP connectors by arrangement', 'Deployment help and onboarding', 'Custom tools and standards configuration'] },
  ]
  return (
    <>
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <span className="eyebrow">Pricing &amp; licensing</span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', margin: '14px 0 14px' }}>Plans for individuals, teams and studios.</h1>
          <p className="lead">Prices are being finalised. Register your interest and you will be told first, or ask for a quote for your team now.</p>
          {product && <div className="notice" style={{ marginTop: 22 }}>You came from <b style={{ color: 'var(--text)' }}>{product.name}</b>. It is part of {SUITES.find((s) => s.id === product.suite)?.name}.</div>}
          <div className="grid-3" style={{ marginTop: 36 }}>
            {plans.map((p, i) => (
              <Reveal key={p.name} delay={i * 60}>
                <div className={`glass plan ${p.featured ? 'featured' : ''}`} style={{ height: '100%' }}>
                  {p.featured && <span className="chip chip-dot" style={{ alignSelf: 'flex-start' }}>Best value</span>}
                  <div><h3 style={{ fontSize: '1.4rem' }}>{p.name}</h3><span className="muted" style={{ fontSize: 14 }}>{p.for}</span></div>
                  <div><span className="price">To be announced</span><div className="muted" style={{ fontSize: 13, marginTop: 6 }}>Monthly and annual terms planned</div></div>
                  <ul>{p.items.map((x) => <li key={x}><Check size={16} /><span>{x}</span></li>)}</ul>
                  <Link className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`} style={{ marginTop: 'auto' }} to={`/custom-development?type=pricing&plan=${encodeURIComponent(p.name)}${product ? `&product=${product.slug}` : ''}`}>{i === 2 ? 'Request a quote' : 'Notify me at launch'}</Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 10 }}>
        <div className="wrap" style={{ maxWidth: 900 }}>
          <span className="eyebrow">Licensing questions</span>
          <h2 style={{ margin: '12px 0 20px' }}>Before you buy</h2>
          <div className="faq">
            {[
              ['Which Revit versions are supported?', 'The Revit tools currently ship for Revit 2024. Each product page lists its exact versions; support for other Revit years is on the roadmap.'],
              ['Can I try a plugin before buying?', 'Yes. The live demos let you use replicas of the real dialogs in your browser, and you can request a guided demo of any tool on a sample model.'],
              ['Are the demos the real plugins?', 'No. They are browser simulations built from the plugins\' actual layouts, labels and rules, running on sample data. They never run Revit or read a model.'],
              ['Do you build custom tools?', 'Yes: custom Revit add-ins, pyRevit tools and AI automations. Use the custom development form to describe the workflow.'],
              ['How will licences be delivered?', 'Licence delivery, accounts and billing will be added with the launch of paid plans. This staging site does not take payments.'],
            ].map(([q, a]) => (
              <details key={q}><summary>{q}<ChevronDown size={18} /></summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
