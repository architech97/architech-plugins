import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Mail } from 'lucide-react'
import { CONTACT } from '../data/contact'
import { productBySlug } from '../data/catalog'

const TYPES: Record<string, string> = { custom: 'Custom plugin development', demo: 'Request a guided demo', pricing: 'Pricing and licensing', partnership: 'Studio or enterprise licensing' }
const PLATFORMS = ['Revit (C#)', 'Rhino', 'SketchUp', 'AutoCAD', 'Blender', 'AI / MCP automation', 'Not sure yet']

export default function CustomDev() {
  const [params] = useSearchParams()
  const product = productBySlug(params.get('product') ?? '')
  const plan = params.get('plan')
  const [type, setType] = useState(params.get('type') && TYPES[params.get('type')!] ? params.get('type')! : 'custom')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [sent, setSent] = useState(false)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const lines = [
      `Inquiry: ${TYPES[type]}`,
      product ? `Product: ${product.name}` : '',
      plan ? `Plan: ${plan}` : '',
      `Name: ${f.get('name')}`, `Company: ${f.get('company') || '-'}`, `Role: ${f.get('role') || '-'}`, `Team size: ${f.get('team') || '-'}`,
      platforms.length ? `Platforms: ${platforms.join(', ')}` : '',
      `Timeline: ${f.get('timeline') || '-'}`, '', String(f.get('message') || ''),
    ].filter((l) => l !== '')
    // Static staging site: nothing is sent to a server. The visitor's own email app opens with the message.
    const href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`[ArchiTECH Automation] ${TYPES[type]}${product ? ' - ' + product.name : ''}`)}&body=${encodeURIComponent(lines.join('\n'))}`
    window.location.href = href
    setSent(true)
  }

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap grid-2" style={{ alignItems: 'start', gap: 40 }}>
        <div>
          <span className="eyebrow">Custom development · demos · licensing</span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', margin: '14px 0 16px' }}>Tell us about your workflow.</h1>
          <p className="lead">Commission a Revit add-in or an AI automation; book a guided demo of any plugin; or ask about licensing for your team.</p>
          <div className="glass" style={{ padding: 24, marginTop: 30, display: 'grid', gap: 14 }}>
            <h3>What happens next</h3>
            <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text-2)', display: 'grid', gap: 8 }}>
              <li>You describe the task, the software and the team.</li>
              <li>We reply with questions or a short call to scope it.</li>
              <li>You get a written proposal with the scope and timeline.</li>
            </ol>
            <p className="muted" style={{ fontSize: 14 }}>Prefer email? <a href={`mailto:${CONTACT.email}`}><Mail size={14} style={{ verticalAlign: -2 }} /> {CONTACT.email}</a></p>
          </div>
        </div>
        <form className="glass form" style={{ padding: 28 }} onSubmit={submit}>
          <div className="field">
            <label htmlFor="type">I'd like to</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          {product && <div className="notice">About: <b style={{ color: 'var(--text)' }}>{product.name}</b>{plan ? ` · ${plan}` : ''}</div>}
          <div className="row-2">
            <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" required autoComplete="name" /></div>
            <div className="field"><label htmlFor="company">Company or studio</label><input id="company" name="company" autoComplete="organization" /></div>
          </div>
          <div className="row-2">
            <div className="field"><label htmlFor="role">Role</label><input id="role" name="role" placeholder="BIM manager, architect…" /></div>
            <div className="field"><label htmlFor="team">Team size</label><select id="team" name="team"><option value="">Choose…</option><option>1</option><option>2–10</option><option>11–50</option><option>51–200</option><option>200+</option></select></div>
          </div>
          <div className="field">
            <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>Software</span>
            <div className="check-grid">{PLATFORMS.map((p) => (
              <label key={p} className="check-pill"><input type="checkbox" checked={platforms.includes(p)} onChange={(e) => setPlatforms(e.target.checked ? [...platforms, p] : platforms.filter((x) => x !== p))} />{p}</label>
            ))}</div>
          </div>
          <div className="field"><label htmlFor="timeline">Timeline</label><select id="timeline" name="timeline"><option value="">Choose…</option><option>As soon as possible</option><option>Within a month</option><option>This quarter</option><option>Exploring</option></select></div>
          <div className="field"><label htmlFor="message">Describe the task</label><textarea id="message" name="message" required placeholder="What do you do by hand today, in which software, and what should the tool produce?" /></div>
          <p className="muted" style={{ fontSize: 13 }}>Sending opens your email app with this message addressed to {CONTACT.email}. This staging site stores nothing and sends nothing itself. Please don't include confidential project data.</p>
          <button className="btn btn-primary" type="submit"><Send size={17} /> Send by email</button>
          {sent && <div className="notice" role="status">Your email app should have opened with the message. If it didn't, write to {CONTACT.email}.</div>}
        </form>
      </div>
    </section>
  )
}
