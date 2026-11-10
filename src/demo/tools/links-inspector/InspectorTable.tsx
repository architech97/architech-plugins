import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Btn } from '../../ui'
import { useReducedMotion } from '../../kit'
import './inspector.css'

export interface InspectorRecord {
  id: number
  name: string
  values: Record<string, string | number>
}
export interface InspectorColumn { key: string; label: string }

/** The native inspectors select one row; they do not have a tick column. */
export function InspectorTable({ rows, columns, selected, onSelect, onDetail, actionKey = 0, onSort }: {
  rows: InspectorRecord[]; columns: InspectorColumn[]; selected: number | null
  onSelect: (id: number) => void; onDetail?: (id: number) => void; actionKey?: number; onSort?: (key: string, descending: boolean) => void
}) {
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(null)
  const reduced = useReducedMotion()
  const body = useRef<HTMLTableSectionElement>(null)
  useEffect(() => {
    if (reduced || !body.current) return
    const animation = body.current.animate([{ opacity: .4, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' })
    return () => animation.cancel()
  }, [actionKey, sort, reduced])
  const shown = sort ? [...rows].sort((a, b) => {
    const av = a.values[sort.key], bv = b.values[sort.key]
    const result = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sort.descending ? -result : result
  }) : rows
  return <div className="inspector-grid" tabIndex={0} role="region" aria-label="Inspector results; scroll horizontally for all columns">
    <table className="ad-table inspector-table">
      <thead><tr>{columns.map(column => <th key={column.key} aria-sort={sort?.key === column.key ? sort.descending ? 'descending' : 'ascending' : 'none'}>
        <button onClick={() => { const descending = sort?.key === column.key ? !sort.descending : false; setSort({ key: column.key, descending }); onSort?.(column.key, descending) }}>{column.label}{sort?.key === column.key ? sort.descending ? ' ↓' : ' ↑' : ''}</button>
      </th>)}</tr></thead>
      <tbody ref={body}>{shown.map(row => <tr key={row.id} className={selected === row.id ? 'sel' : ''} aria-selected={selected === row.id} tabIndex={0}
        onClick={() => onSelect(row.id)} onDoubleClick={() => onDetail?.(row.id)}
        onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); onSelect(row.id); if (event.key === 'Enter') onDetail?.(row.id) } }}>
        {columns.map((column, index) => <td key={column.key} title={String(row.values[column.key])} className={column.key === 'Recommendation' || column.key === 'Path' ? 'wrap' : ''}>
          {index === 0 ? <span className="inspector-name">{row.values[column.key]}</span> : column.key === 'Severity' ? <span className={`inspector-severity ${String(row.values[column.key]).toLowerCase()}`}>{row.values[column.key]}</span> : row.values[column.key]}
        </td>)}
      </tr>)}</tbody>
    </table>
    {!rows.length && <p className="ad-note inspector-empty">No rows remain in this sample scan.</p>}
  </div>
}

export function RowDetail({ row, columns, title, onClose }: { row: InspectorRecord; columns: InspectorColumn[]; title: string; onClose: () => void }) {
  return <section className="ad-card inspector-detail" aria-label={`${title} — row detail`}>
    <div className="ad-row"><strong>{title} — row detail</strong><Btn sm onClick={onClose}>Close</Btn></div>
    <dl>{columns.map(column => <div key={column.key}><dt>{column.label}</dt><dd>{row.values[column.key]}</dd></div>)}</dl>
  </section>
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <details className="inspector-source"><summary>Based on the Revit 2024 source</summary><div>{children}</div></details>
}

export function downloadInspectorCsv(filename: string, columns: InspectorColumn[], rows: InspectorRecord[]) {
  const encode = (value: unknown) => {
    const text = String(value ?? '')
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`
  }
  const records = [['#', ...columns.map(c => c.label)], ...rows.map((row, i) => [i + 1, ...columns.map(c => row.values[c.key])])]
  const csv = records.map(row => row.map(encode).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
