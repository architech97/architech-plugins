import { useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Clipboard, Mail, Phone, Send } from 'lucide-react'
import { CONTACT } from '../data/contact'
import { productBySlug } from '../data/catalog'

const TYPES = {
  workflow: 'Discuss a workflow',
  tool: 'Ask about a tool',
  walkthrough: 'Request a walkthrough',
  suggestion: 'Share a suggestion',
}
type Topic = keyof typeof TYPES
// Older links used these values; they still open the closest topic.
const LEGACY: Record<string, Topic> = { custom: 'workflow', demo: 'walkthrough', pricing: 'tool', partnership: 'workflow' }
const topicOf = (value: string | null): Topic => (value && value in TYPES ? (value as Topic) : LEGACY[value ?? ''] ?? 'workflow')
const PLATFORMS = ['Revit', 'Rhino', 'SketchUp', 'AutoCAD', 'Blender', 'AI / MCP', 'Not sure yet']

export default function Connect() {
  const [params] = useSearchParams()
  const product = productBySlug(params.get('product') ?? '')
  return <Form key={params.toString()} topic={topicOf(params.get('type'))} product={product?.name} />
}

function Form({ topic, product }: { topic: Topic; product?: string }) {
  const [draft, setDraft] = useState<{ subject: string; body: string }>()
  const [copyMessage, setCopyMessage] = useState('')
  const preview = useRef<HTMLTextAreaElement>(null)

  const prepare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = TYPES[topicOf(String(data.get('type')))]
    const fields = [
      ['Topic', title], ['Tool', product], ['Name', data.get('name')], ['Organisation', data.get('company')],
      ['Role', data.get('role')], ['Software', data.getAll('platform').join(', ')],
    ]
    const lines = fields.filter(([, value]) => value).map(([name, value]) => name + ': ' + value)
    setDraft({ subject: '[ArchiTECH] ' + title + (product ? ' · ' + product : ''), body: [...lines, '', String(data.get('message')).trim()].join('\n') })
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
          <span className="eyebrow">Connect</span>
          <h1>Discuss a workflow or share a suggestion</h1>
          <p className="lead">Tell me about a repetitive BIM task, ask how one of these tools works, or suggest an improvement.</p>
        </div>
        <form className="glass form inquiry-form" onSubmit={prepare} onChange={() => { if (draft) setDraft(undefined) }}>
          <div className="field">
            <label htmlFor="type">I'd like to</label>
            <select id="type" name="type" defaultValue={topic}>{Object.entries(TYPES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
          </div>
          {product && <div className="notice">About <strong>{product}</strong></div>}
          <div className="row-2">
            <div className="field"><label htmlFor="name">Name <small>(required)</small></label><input id="name" name="name" required autoComplete="name" /></div>
            <div className="field"><label htmlFor="company">Organisation</label><input id="company" name="company" autoComplete="organization" /></div>
          </div>
          <div className="field"><label htmlFor="role">Role</label><input id="role" name="role" placeholder="Architect, BIM coordinator…" /></div>
          <fieldset className="inquiry-platforms">
            <legend>Software</legend>
            <div className="check-grid">{PLATFORMS.map((item) => (
              <label key={item} className="check-pill"><input type="checkbox" name="platform" value={item} />{item}</label>
            ))}</div>
          </fieldset>
          <div className="field"><label htmlFor="message">Message <small>(required)</small></label><textarea id="message" name="message" required rows={5} placeholder="What is the task, and what would a better result look like?" /></div>
          <p className="muted inquiry-help">This form does not send anything by itself. It prepares a draft that you send from your own email app.</p>
          <button className="btn btn-primary" type="submit"><Send size={17} /> Prepare email draft</button>
          {draft && (
            <div className="inquiry-draft">
              <strong role="status">Draft ready. It has not been sent.</strong>
              <textarea ref={preview} aria-label="Email draft" readOnly value={draft.subject + '\n\n' + draft.body} rows={6} />
              <div><a className="btn btn-primary btn-sm" href={mailto}><Mail size={16} /> Open in email app</a><button type="button" className="btn btn-ghost btn-sm" onClick={copy}><Clipboard size={16} /> Copy draft</button></div>
              {copyMessage && <p role="status">{copyMessage}</p>}
            </div>
          )}
        </form>
        <aside className="inquiry-next">
          <h2>Reach me directly</h2>
          <a href={'mailto:' + CONTACT.email}><Mail size={16} /> {CONTACT.email}</a>
          {CONTACT.phones.map((phone) => <a key={phone} href={'tel:' + phone.replace(/\s/g, '')}><Phone size={16} /> {phone}</a>)}
          <a href={CONTACT.linkedin} target="_blank" rel="noreferrer"><ArrowUpRight size={16} /> LinkedIn</a>
          <p className="muted">Navneet Singh · New Delhi</p>
        </aside>
      </div>
    </section>
  )
}
