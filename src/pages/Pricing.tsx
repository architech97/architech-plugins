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
          <h1 style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', margin: '14px 0 14px' }}>Licensing by suite and team size</h1>
          <p className="lead">Compare the planned licence options. Ask about a Revit suite, the complete collection or a studio quote.</p>
          {product && <div className="notice" style={{ marginTop: 22 }}>You came from <b style={{ color: 'var(--text)' }}>{product.name}</b>. It is part of {SUITES.find((s) => s.id === product.suite)?.name}.</div>}
          <div className="grid-3" style={{ marginTop: 36 }}>
            {plans.map((p, i) => (
              <Reveal key={p.name} delay={i * 60}>
                <div className={`glass plan ${p.featured ? 'featured' : ''}`} style={{ height: '100%' }}>
                  {p.featured && <span className="chip chip-dot" style={{ alignSelf: 'flex-start' }}>All Revit suites</span>}
                  <div><h3 style={{ fontSize: '1.4rem' }}>{p.name}</h3><span className="muted" style={{ fontSize: 14 }}>{p.for}</span></div>
                  <div><span className="price">Pricing on inquiry</span><div className="muted" style={{ fontSize: 13, marginTop: 6 }}>Commercial terms will be confirmed at launch</div></div>
                  <ul>{p.items.map((x) => <li key={x}><Check size={16} /><span>{x}</span></li>)}</ul>
                  <Link className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`} style={{ marginTop: 'auto' }} to={`/custom-development?type=pricing&plan=${encodeURIComponent(p.name)}${product ? `&product=${product.slug}` : ''}`}>{i === 2 ? 'Request a quote' : 'Ask about this plan'}</Link>
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
              ['Which Revit versions are supported?', 'Arch Folio, Forge and Sentinel list Revit 2024. Check each product page for the supported host and version, especially for I3D and the Revit MCP connector.'],
              ['Can I try a plugin before buying?', 'Yes. Every catalog product has a browser demo. You can also request a guided session for a specific tool.'],
              ['What does a browser demo run?', 'Each demo runs an interactive scenario on sample data in your browser. Native operations run in the desktop plugin.'],
              ['Do you build custom tools?', 'Yes: custom Revit add-ins and AI automations. Use the custom development form to describe the workflow.'],
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
