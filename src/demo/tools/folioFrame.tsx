import type { ReactNode } from 'react'
import { useId } from 'react'
import type { DemoContext } from '../types'
import { RevitDialog, Select, TextBox } from '../ui'
import './folioFrame.css'

export interface FolioSection { title: string; summary: string }

export function FolioFrame({ ctx, title, sections, section, onSection, children, footer }: {
  ctx: DemoContext; title: string; sections: readonly FolioSection[]; section: number; onSection: (index: number) => void
  children: ReactNode; footer: ReactNode
}) {
  return <div className="folio-runtime" onKeyDown={(event) => {
    if (!event.ctrlKey || event.altKey || event.metaKey) return
    const index = Number(event.key) - 1
    if (Number.isInteger(index) && index >= 0 && index < sections.length) {
      event.preventDefault()
      onSection(index)
    }
  }}>
    <RevitDialog title={title} theme={ctx.theme} onTheme={ctx.setTheme} onClose={ctx.close} caption="Sample Residence, Browser simulation" footer={footer}>
      <div className="folio-runtime-layout">
        <nav className="ad-nav" aria-label={title + ' tools'}><span className="ad-label">Tools</span>
          {sections.map(({ title, summary }, index) => <button type="button" key={title} className={section === index ? 'on' : ''} aria-pressed={section === index} aria-label={title}
            onClick={() => onSection(index)}><span aria-hidden="true">{index + 1}</span><span className="folio-runtime-nav-copy">{title}<small>{summary}</small></span></button>)}
          <p className="ad-note">Ctrl+1 to Ctrl+{sections.length} switch sections. Each section keeps its choices.</p>
        </nav>
        <div className="folio-runtime-work" data-demo="folio-configure">
          <header><h3>{sections[section].title}</h3><p className="ad-note">{sections[section].summary}</p></header>
          {children}
        </div>
      </div>
    </RevitDialog>
  </div>
}

export function FolioChoice({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <label className="folio-runtime-field">{label}<Select label={label} value={value} options={options} onChange={onChange} /></label>
}

export function FolioText({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'|'value'>) {
  const id = useId()
  return <label className="folio-runtime-field" htmlFor={id}>{label}<TextBox {...rest} id={id} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

export function FolioPreview({ rows, title = 'Preview' }: { rows: { label: string; value: string }[]; title?: string }) {
  return <section className="ad-card folio-runtime-stack" aria-label={title}><strong className="ad-label">{title}</strong>
    {rows.length ? <dl className="folio-runtime-preview">{rows.map(({ label, value }, index) => <div key={label + index}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      : <p className="ad-note">Choose the scope and settings to see the proposed changes.</p>}
  </section>
}
