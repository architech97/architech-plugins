import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import type { DialogShot } from '../data/types'
import { asset } from './Brand'

/** Real dialog renders from the plugin's own XAML, in Dark and Light, with a zoom lightbox. */
export function DialogGallery({ dialogs, name }: { dialogs: DialogShot[]; name: string }) {
  const [i, setI] = useState(0)
  const [mode, setMode] = useState<'dark' | 'light'>('dark')
  const [zoom, setZoom] = useState(false)
  const d = dialogs[i]
  const src = d?.[mode] ?? d?.dark
  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])
  if (!d || !src) return null
  return (
    <div>
      <div className="gallery-head">
        {dialogs.length > 1 ? (
          <div className="shot-tabs" role="tablist" aria-label={`${name} dialogs`}>
            {dialogs.map((x, k) => (
              <button key={x.title + k} role="tab" aria-selected={k === i} className={`btn btn-sm ${k === i ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setI(k)}>{x.title}</button>
            ))}
          </div>
        ) : <span className="mono muted" style={{ fontSize: 13 }}>{d.title}</span>}
        <div className="seg" role="group" aria-label="Dialog theme">
          <button className={mode === 'dark' ? 'on' : ''} onClick={() => setMode('dark')}><Moon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Dark</button>
          <button className={mode === 'light' ? 'on' : ''} disabled={!d.light} onClick={() => setMode('light')}><Sun size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Light</button>
        </div>
      </div>
      <button className="shot" onClick={() => setZoom(true)} aria-label={`Enlarge the ${d.title} dialog`}>
        <img src={asset(src)} alt={`${name}: ${d.title} dialog, ${mode} theme`} width={d.w} height={d.h} loading="lazy" decoding="async" />
      </button>
      <p className="caption">Rendered from the plugin's actual dialog layout (XAML) with sample rows. Every ArchiTECH dialog switches between Dark and Light from its header.</p>
      {zoom && (
        <div className="lightbox" role="dialog" aria-label={`${d.title} enlarged`} onClick={() => setZoom(false)}>
          <img src={asset(src)} alt={`${name}: ${d.title} dialog, ${mode} theme, enlarged`} />
        </div>
      )}
    </div>
  )
}
