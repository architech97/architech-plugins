import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { DialogTheme } from '../types'
import { RevitDialog, Btn } from '../ui'
import { animateOnce, motion } from './motion'
import { useReducedMotion } from './useReducedMotion'
import './kit.css'
export { useReducedMotion } from './useReducedMotion'
export { motion, animateOnce } from './motion'

export interface DialogShellProps {
  theme: DialogTheme; onTheme: (theme: DialogTheme) => void; title: string
  subtitle?: string; caption?: string; onClose?: () => void; footer?: ReactNode; children?: ReactNode
}
export function DialogShell({ subtitle, caption, children, ...props }: DialogShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => { const a = animateOnce(ref.current, [{ opacity: 0, transform: 'translateY(8px) scale(.99)' }, { opacity: 1, transform: 'none' }], reduced, motion.fast); return () => a?.cancel() }, [reduced])
  return <div className="dk-shell" ref={ref}><RevitDialog {...props} caption={subtitle ?? caption}>{children}</RevitDialog></div>
}
interface CommandLink { id?: string; label: string; description?: string; onClick?: () => void; disabled?: boolean }
interface DialogButton { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }
export interface TaskDialogProps extends Omit<DialogShellProps, 'children'> {
  instruction?: string; mainInstruction?: string; content?: ReactNode; details?: ReactNode
  commandLinks?: CommandLink[]; onCommand?: (id: string) => void; buttons?: DialogButton[]; children?: ReactNode
  showTheme?: boolean
}
export function TaskDialogShell({ instruction, mainInstruction, content, details, commandLinks = [], onCommand, buttons = [], children, showTheme = true, ...shell }: TaskDialogProps) {
  const footer = shell.footer ?? <div className={`dk-task-buttons${commandLinks.length > 2 || commandLinks.some((l) => l.label.length > 28) ? ' stacked' : ''}`}>
    {commandLinks.map((link, index) => <Btn key={link.id ?? index} primary={index === 0} disabled={link.disabled} onClick={() => { link.onClick?.(); if (link.id) onCommand?.(link.id) }}>{link.label}{link.description && <small>{link.description}</small>}</Btn>)}
    {buttons.map((b) => <Btn key={b.label} primary={b.primary} disabled={b.disabled} onClick={b.onClick}>{b.label}</Btn>)}
  </div>
  return <div className="dk-native-task">
    {showTheme && <button type="button" className="dk-theme-button" onClick={() => shell.onTheme(shell.theme === 'dark' ? 'light' : 'dark')}>
      Use {shell.theme === 'dark' ? 'light' : 'dark'} theme
    </button>}
    <DialogShell {...shell} title={shell.title.replace(/^ArchiTECH\s*[—–-]\s*/, '')} footer={footer}>
    <div className="dk-task"><div className="dk-task-message"><span className="dk-kind-dot" aria-hidden="true" /><div><h2>{instruction ?? mainInstruction}</h2>{content && <div className="dk-content">{content}</div>}
      {details && <div className="dk-native-detail">{details}</div>}</div></div>{children}
    </div>
  </DialogShell></div>
}
export function ScopeRadios({ name, label = 'Scope', value, options, onChange }: { name?: string; label?: string; value: string; options: (string | { value: string; label: string; description?: string })[]; onChange: (value: string) => void }) {
  const id = useId()
  return <fieldset className="dk-scope"><legend>{label}</legend>{options.map((entry) => { const option = typeof entry === 'string' ? { value: entry, label: entry } : entry; return <label key={option.value}><input type="radio" name={name ?? id} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} /><span>{option.label}{option.description && <small>{option.description}</small>}</span></label> })}</fieldset>
}
export interface PreviewColumn<T> { key: string; label: string; render?: (row: T) => ReactNode }
export function PreviewTable<T>({ rows, columns, getId, ticked, onTicked, searchText, caption = 'Sample preview' }: { rows: T[]; columns: PreviewColumn<T>[]; getId: (row: T) => string | number; ticked: (string | number)[]; onTicked: (ids: (string | number)[]) => void; searchText?: (row: T) => string; caption?: string }) {
  const [search, setSearch] = useState('')
  const [only, setOnly] = useState(false)
  const shown = rows.filter((row) => (!only || ticked.includes(getId(row))) && (searchText?.(row) ?? JSON.stringify(row)).toLowerCase().includes(search.toLowerCase()))
  return <div className="dk-preview"><div className="dk-toolbar"><label>Search<input className="ad-input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the preview…" /></label><Btn onClick={() => onTicked([...new Set([...ticked, ...shown.map(getId)])])}>Tick shown</Btn><Btn onClick={() => onTicked([])}>Clear ticks</Btn><label><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> Ticked only</label><span>{ticked.length} ticked / {shown.length} shown</span></div>
    <div className="ad-table-wrap" tabIndex={0} role="region" aria-label={caption}><table className="ad-table"><caption className="dk-sr">{caption}</caption><thead><tr><th>Tick</th>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>{shown.map((row) => { const id = getId(row); return <tr key={id}><td><input aria-label={`Tick ${id}`} type="checkbox" checked={ticked.includes(id)} onChange={(e) => onTicked(e.target.checked ? [...ticked, id] : ticked.filter((v) => v !== id))} /></td>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}</td>)}</tr> })}</tbody></table>{!shown.length && <p className="ad-note">No matching rows.</p>}</div>
  </div>
}
export function BeforeAfter({ before, after, label = 'Preview', actionKey = 0 }: { before: ReactNode; after: ReactNode; label?: string; actionKey?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => { if (!actionKey) return; const a = animateOnce(ref.current, [{ opacity: .35, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], reduced); return () => a?.cancel() }, [actionKey, reduced])
  return <div className="dk-before-after" aria-label={label}><section><h3>Before</h3>{before}</section><section ref={ref}><h3>After</h3>{after}</section></div>
}
export function ConfirmGuard({ open, theme, onTheme = () => {}, title, instruction, content, confirmLabel = 'Yes', cancelLabel = 'Cancel', onConfirm, onCancel, details }: { open: boolean; theme: DialogTheme; onTheme?: (theme: DialogTheme) => void; title: string; instruction: string; content?: ReactNode; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void; details?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open) return
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('.dk-guard-cancel')?.focus()
    return () => { dialog.close(); previous?.focus() }
  }, [open])
  if (!open) return null
  return <dialog className="dk-guard" ref={ref} aria-label={title} onCancel={(event) => { event.preventDefault(); onCancel() }}><TaskDialogShell showTheme={false} theme={theme} onTheme={onTheme} title={title} instruction={instruction} content={content} details={details} onClose={onCancel} footer={<><button className="ad-btn dk-guard-cancel" onClick={onCancel}>{cancelLabel}</button><Btn primary onClick={onConfirm}>{confirmLabel}</Btn></>} /></dialog>
}
export function Receipt({ entries, download, filename = 'sample-residence-receipt.json', title = 'What happened (simulated)' }: { entries: (string | { label: string; detail?: string })[]; download?: unknown; filename?: string; title?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const receiptKey = JSON.stringify(entries)
  useEffect(() => { if (!entries.length) return; const a = animateOnce(ref.current, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], reduced); return () => a?.cancel() }, [receiptKey, reduced])
  function save() { const url = URL.createObjectURL(new Blob([JSON.stringify({ fictional: true, project: 'Sample Residence', ...{ receipt: download ?? entries } }, null, 2)], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
  return <section className="dk-receipt" aria-live="polite" ref={ref}><h3>{title}</h3>{entries.length ? <ul>{entries.map((entry, index) => <li key={index}>{typeof entry === 'string' ? entry : <>{entry.label}{entry.detail && <small>{entry.detail}</small>}</>}</li>)}</ul> : <p>Apply an action to the fictional fixture to see its result.</p>}{download !== undefined && entries.length > 0 && <Btn onClick={save}>Download JSON receipt</Btn>}</section>
}
export interface MiniViewItem { id: string | number; label: string; value?: number; status?: string; pinned?: boolean }
export function MiniView({ kind = 'plan', variant = 'coord', phase = 'before', actionKey = 0, items = [], pattern = 'Solid', children, title = 'Sample Residence · fictional model preview' }: { kind?: 'plan' | 'sheet' | '3d'; variant?: 'spots' | 'split' | 'floor' | 'coord' | 'batch' | 'links' | 'inplace'; phase?: 'before' | 'preview' | 'after'; actionKey?: number; items?: MiniViewItem[]; pattern?: string; children?: ReactNode; title?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const reduced = useReducedMotion()
  const titleId = useId()
  useEffect(() => { if (!actionKey) return; const targets = Array.from(ref.current?.querySelectorAll('[data-motion]') ?? []).slice(0, 3); const animations = targets.map((el, i) => !reduced ? el.animate([{ opacity: .15 }, { opacity: 1 }], { duration: motion.standard + i * motion.stagger, easing: motion.easing, iterations: 1 }) : undefined); return () => animations.forEach((a) => a?.cancel()) }, [actionKey, reduced])
  const shown = items
  return <figure className="dk-mini"><figcaption>{title}<span>{phase === 'after' ? 'After' : phase === 'preview' ? 'Preview' : 'Before'} · {kind}</span></figcaption><svg ref={ref} viewBox="0 0 600 260" role="img" aria-labelledby={titleId}><title id={titleId}>{title}: {variant}, {phase}</title><defs><pattern id={`${titleId}-grid`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" opacity=".1" /></pattern></defs><rect width="600" height="260" fill={`url(#${titleId}-grid)`} />{children ?? <>
    {variant === 'spots' ? shown.slice(0, 4).map((item, i) => <g data-motion key={item.id} transform={`translate(${20 + (i % 2) * 295} ${15 + Math.floor(i / 2) * 125})`}><rect width="270" height="110" rx="5" fill="none" stroke="currentColor" opacity=".3" /><text x="12" y="22">{item.label}{item.value !== undefined ? ` ? ${item.value} spots` : ''}</text>{[0, 1, 2].map((n) => <g key={n}><path d={`M ${25 + n * 78} 80 l 18 -28 h 35`} fill="none" stroke="var(--d-accent)" strokeWidth="2" strokeDasharray={phase !== 'before' && pattern !== 'Solid' ? pattern === 'Dash' ? '9 5' : '3 4' : undefined} /><text x={48 + n * 78} y="46" fontSize="10">+{(n * .15).toFixed(2)}</text></g>)}</g>) : variant === 'inplace' ? shown.slice(0, 9).map((item, i) => <g key={item.id} data-motion transform={`translate(20 ${18 + i * 26})`}><text y="12" fontSize="11">{item.label.slice(0, 24)}</text><rect x="170" width={Math.max(4, ((item.value ?? 0) / Math.max(1, ...shown.map((v) => v.value ?? 0))) * 300)} height="16" rx="3" fill="var(--d-accent)" opacity={phase === 'after' ? '.7' : '1'} /><text x="500" y="12">{item.value ?? 2}</text></g>) : variant === 'batch' || variant === 'links' ? shown.slice(0, 8).map((item, i) => <g key={item.id} data-motion transform={`translate(${18 + (i % 4) * 145} ${18 + Math.floor(i / 4) * 120})`}><rect width="130" height="105" rx="6" fill="var(--d-surface)" stroke="var(--d-border)" /><path d="M 25 60 l 40 -28 l 38 23 l -40 29 Z M 25 60 v -30 l 40 -25 l 38 20 v 30 M 65 32 v 30" transform="translate(0 10) scale(.75)" fill="none" stroke="var(--d-accent)" /><text x="9" y="92" fontSize="10">{item.label.slice(0, 20)}</text><text x="100" y="24">{item.pinned ? '⚑' : '○'}</text></g>) : <>
      {[0, 1, 2].map((i) => <g key={i} data-motion style={{ transform: phase === 'after' && (variant === 'split' || variant === 'floor') ? `translate(${i * 8}px,${i * -4}px)` : undefined }}><path d={i === 0 ? 'M70 45 H330 V135 H70 Z' : i === 1 ? 'M340 45 H530 V135 H340 Z' : 'M70 145 H440 V225 H70 Z'} fill={['var(--d-accent)', 'var(--d-success)', 'var(--d-warning)'][i]} fillOpacity=".15" stroke={['var(--d-accent)', 'var(--d-success)', 'var(--d-warning)'][i]} strokeWidth="2" /><text x={i === 1 ? 360 : 90} y={i === 2 ? 185 : 90}>{shown[i % shown.length]?.label.slice(0, 26)}</text></g>)}{variant === 'split' && <path d="M 20 20 L 570 240" stroke="var(--d-error)" strokeWidth="2" strokeDasharray="8 5" />}
    </>}
  </>}</svg></figure>
}
