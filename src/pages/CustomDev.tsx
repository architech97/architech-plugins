import { useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clipboard, Mail, Send } from 'lucide-react'
import { CONTACT } from '../data/contact'
import { productBySlug } from '../data/catalog'

const TYPES = { custom: 'Custom plugin development', demo: 'Request a guided demo', pricing: 'Pricing and licensing', partnership: 'Studio or enterprise licensing' }
type InquiryType = keyof typeof TYPES
const isInquiryType = (value: string | null): value is InquiryType => value !== null && Object.prototype.hasOwnProperty.call(TYPES, value)
const PLATFORMS = ['Revit (C#)', 'Rhino', 'SketchUp', 'AutoCAD', 'Blender', 'AI / MCP automation', 'Not sure yet']

export default function CustomDev() {
  const [params] = useSearchParams()
  const product = productBySlug(params.get('product') ?? '')
  const type = params.get('type')
  return <Inquiry key={params.toString()} type={isInquiryType(type) ? type : 'custom'} product={product?.name} plan={params.get('plan') || undefined} />
}

function Inquiry({ type, product, plan }: { type: InquiryType; product?: string; plan?: string }) {
  const [draft, setDraft] = useState<{ subject: string; body: string }>()
  const [copyMessage, setCopyMessage] = useState('')
  const preview = useRef<HTMLTextAreaElement>(null)

  const prepare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const selected = String(data.get('type'))
    const title = TYPES[isInquiryType(selected) ? selected : 'custom']
    const fields = [
      ['Inquiry', title], ['Product', product], ['Plan', plan], ['Name', data.get('name')],
      ['Company', data.get('company')], ['Role', data.get('role')], ['Team size', data.get('team')],
      ['Software', data.getAll('platform').join(', ')], ['Timeline', data.get('timeline')],
    ]
    const lines = fields.filter(([, value]) => value).map(([name, value]) => name + ': ' + value)
    setDraft({ subject: '[ArchiTECH Automation] ' + title + (product ? ' · ' + product : ''), body: [...lines, '', String(data.get('message')).trim()].join('\n') })
    setCopyMessage('')
  }

  const copy = async () => {
    if (!draft) return
    try {
      await navigator.clipboard.writeText(draft.subject + '\n\n' + draft.body)
      setCopyMessage('Draft copied.')
    } catch {
      preview.current?.select()
      setCopyMessage('Draft selected. Use your device’s Copy command.')
    }
  }
  const mailto = draft && 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent(draft.subject) + '&body=' + encodeURIComponent(draft.body)

  return (
    <section className="section inquiry-section">
      <div className="wrap inquiry-grid">
        <div className="inquiry-intro">
          <span className="eyebrow">Custom development · demos · licensing</span>
          <h1>Tell us about your workflow</h1>
          <p className="lead">Describe the tool you need, request a guided demo, or ask about licensing for your team.</p>
        </div>
        <form className="glass form inquiry-form" onSubmit={prepare} onChange={() => { if (draft) setDraft(undefined) }}>
          <div className="field">
            <label htmlFor="type">I'd like to</label>
            <select id="type" name="type" defaultValue={type}>{Object.entries(TYPES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
          </div>
          {(product || plan) && <div className="notice">Inquiry for <strong>{[product, plan].filter(Boolean).join(' · ')}</strong></div>}
          <div className="row-2">
            <div className="field"><label htmlFor="name">Name <small>(required)</small></label><input id="name" name="name" required autoComplete="name" /></div>
            <div className="field"><label htmlFor="company">Company or studio</label><input id="company" name="company" autoComplete="organization" /></div>
          </div>
          <div className="row-2">
            <div className="field"><label htmlFor="role">Role</label><input id="role" name="role" placeholder="BIM manager, architect…" /></div>
            <div className="field"><label htmlFor="team">Team size</label><select id="team" name="team"><option value="">Choose…</option><option>1</option><option>2–10</option><option>11–50</option><option>51–200</option><option>200+</option></select></div>
          </div>
          <fieldset className="inquiry-platforms">
            <legend>Software</legend>
            <div className="check-grid">{PLATFORMS.map((item) => (
              <label key={item} className="check-pill"><input type="checkbox" name="platform" value={item} />{item}</label>
            ))}</div>
          </fieldset>
          <div className="field"><label htmlFor="timeline">Timeline</label><select id="timeline" name="timeline"><option value="">Choose…</option><option>As soon as possible</option><option>Within a month</option><option>This quarter</option><option>Exploring options</option></select></div>
          <div className="field"><label htmlFor="message">What would you like to do? <small>(required)</small></label><textarea id="message" name="message" required rows={4} placeholder="What goes into the task, and what should the tool produce?" /></div>
          <p className="muted inquiry-help">Review your draft here, then open it in your email app or copy the text.</p>
          <button className="btn btn-primary" type="submit"><Send size={17} /> Prepare email draft</button>
          {draft && (
            <div className="inquiry-draft">
              <strong role="status">Draft ready</strong>
              <textarea ref={preview} aria-label="Email draft" readOnly value={draft.subject + '\n\n' + draft.body} rows={6} />
              <div><a className="btn btn-primary btn-sm" href={mailto}><Mail size={16} /> Open email app</a><button type="button" className="btn btn-ghost btn-sm" onClick={copy}><Clipboard size={16} /> Copy draft</button></div>
              {copyMessage && <p role="status">{copyMessage}</p>}
            </div>
          )}
        </form>
        <aside className="inquiry-next">
          <h2>What happens next</h2>
          <ol><li>Share the task, software and team size.</li><li>We review your brief and clarify the scope.</li><li>For custom work, we prepare a proposal with scope and timeline.</li></ol>
          <a href={'mailto:' + CONTACT.email}><Mail size={16} /> {CONTACT.email}</a>
        </aside>
      </div>
    </section>
  )
}
