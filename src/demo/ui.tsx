import './kit/accessibility.css'
import type { ReactNode, InputHTMLAttributes } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { asset } from '../components/Brand'
import type { DialogTheme } from './types'

/** The ArchiTECH dialog shell: logo | title + caption, Dark/Light selector, close. */
export function RevitDialog(props: {
  theme: DialogTheme
  onTheme: (t: DialogTheme) => void
  title: string
  caption?: string
  eyebrow?: string
  footer?: ReactNode
  children: ReactNode
  onClose?: () => void
  height?: number | string
}) {
  const { theme, onTheme, title, caption, eyebrow, footer, children, onClose, height } = props
  return (
    <div className="ad" data-theme={theme} style={{ height }} role="dialog" aria-label={`${title} (simulation)`}>
      <div className="ad-head">
        <div className="ad-brand">
          <img className="ad-logo" src={asset(theme === 'dark' ? 'media/brand/architech-logo-dark-ui.webp' : 'media/brand/architech-logo-light-ui.webp')} alt="ArchiTECH" />
          <span className="ad-divider" />
          <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {eyebrow && <span className="ad-eyebrow">{eyebrow}</span>}
            <span className="ad-title">{title}</span>
            {caption && <span className="ad-caption">{caption}</span>}
          </span>
        </div>
        <select className="ad-select" style={{ width: 92 }} aria-label="Dialog theme" value={theme} onChange={(e) => onTheme(e.target.value as DialogTheme)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
        <button className="ad-close" aria-label="Close (simulation)" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="ad-body">{children}</div>
      {footer && <div className="ad-foot">{footer}</div>}
    </div>
  )
}

export function Btn({ primary, danger, sm, children, demo, ...rest }: { primary?: boolean; danger?: boolean; sm?: boolean; demo?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`ad-btn ${primary ? 'primary' : ''} ${danger ? 'danger' : ''} ${sm ? 'sm' : ''}`} data-demo={demo} {...rest}>{children}</button>
}

export function Check({ label, checked, onChange, demo, title, disabled }: { label?: ReactNode; checked: boolean; onChange: (v: boolean) => void; demo?: string; title?: string; disabled?: boolean }) {
  return (
    <label className="ad-check" data-demo={demo} title={title}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} aria-label={typeof label === 'string' ? label : title} />
      <span className="ad-box" />
      {label && <span>{label}</span>}
    </label>
  )
}

export function Radio({ label, checked, onChange, name, demo }: { label: ReactNode; checked: boolean; onChange: () => void; name: string; demo?: string }) {
  return (
    <label className="ad-radio" data-demo={demo}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span className="ad-dot" />
      <span>{label}</span>
    </label>
  )
}

export function Select({ value, onChange, options, width, label, demo }: { value: string; onChange: (v: string) => void; options: string[]; width?: number | string; label: string; demo?: string }) {
  return (
    <select className="ad-select" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} style={{ width }} data-demo={demo}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export function TextBox({ demo, ...rest }: InputHTMLAttributes<HTMLInputElement> & { demo?: string }) {
  return <input className="ad-input" data-demo={demo} {...rest} />
}

export function SearchBox({ value, onChange, placeholder, demo, width }: { value: string; onChange: (v: string) => void; placeholder: string; demo?: string; width?: number | string }) {
  return (
    <div className="ad-search" style={{ width }} data-demo={demo}>
      <Search size={13} aria-hidden="true" />
      <input className="ad-input" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, demo }: { tabs: readonly T[]; value: T; onChange: (t: T) => void; demo?: string }) {
  return (
    <div className="ad-tabs" role="tablist" data-demo={demo}>
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={t === value} className={`ad-tab ${t === value ? 'on' : ''}`} data-demo={`tab:${t}`} onClick={() => onChange(t)}>{t}</button>
      ))}
    </div>
  )
}

export function Expander({ header, children, open, demo }: { header: string; children: ReactNode; open?: boolean; demo?: string }) {
  return (
    <details className="ad-exp" open={open} data-demo={demo}>
      <summary><span className="ad-disc"><ChevronDown size={11} /></span>{header}</summary>
      <div>{children}</div>
    </details>
  )
}

export function Progress({ value }: { value: number }) {
  return <div className="ad-progress" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${value}%` }} /></div>
}
