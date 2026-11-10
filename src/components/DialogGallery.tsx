import { useRef, useState } from 'react'
import { Maximize2, Moon, Sun, X } from 'lucide-react'
import type { DialogShot } from '../data/types'
import { asset } from './Brand'

export function DialogGallery({ dialogs, name }: { dialogs: DialogShot[]; name: string }) {
  const [i, setI] = useState(0)
  const [mode, setMode] = useState<'dark' | 'light'>('dark')
  const lightbox = useRef<HTMLDialogElement>(null)
  const shot = dialogs[i]
  if (!shot) return null
  const otherMode = mode === 'dark' ? 'light' : 'dark'
  const actualMode = shot[mode] ? mode : otherMode
  const src = shot[actualMode]
  if (!src) return null
  const source = shot.source === 'reconstructed' ? 'Source-derived reconstruction with sample data.' : 'Rendered from the dialog layout with sample data.'
  const caption = name + ' · ' + shot.title + ' · ' + actualMode + ' theme'

  return (
    <div>
      <div className="gallery-head">
        {dialogs.length > 1 ? (
          <div className="shot-tabs" role="group" aria-label={name + ' dialogs'}>
            {dialogs.map((item, index) => (
              <button type="button" key={item.title + index} aria-pressed={index === i} className={`btn btn-sm ${index === i ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setI(index)}>{item.title}</button>
            ))}
          </div>
        ) : <span className="mono muted">{shot.title}</span>}
        <div className="seg" role="group" aria-label="Screenshot theme">
          <button type="button" className={actualMode === 'dark' ? 'on' : ''} aria-pressed={actualMode === 'dark'} disabled={!shot.dark} onClick={() => setMode('dark')}><Moon size={14} /> Dark</button>
          <button type="button" className={actualMode === 'light' ? 'on' : ''} aria-pressed={actualMode === 'light'} disabled={!shot.light} onClick={() => setMode('light')}><Sun size={14} /> Light</button>
        </div>
      </div>
      <button type="button" className="shot" onClick={() => lightbox.current?.showModal()} aria-label={'Enlarge the ' + shot.title + ' dialog'}>
        <img src={asset(src)} alt={caption} width={shot.w} height={shot.h} loading="lazy" decoding="async" />
        <span className="shot-zoom" aria-hidden="true"><Maximize2 size={18} /></span>
      </button>
      <p className="caption" aria-live="polite">{i + 1} of {dialogs.length} · {shot.title} · {actualMode === 'dark' ? 'Dark' : 'Light'} theme. {source}</p>
      <dialog className="shot-modal" ref={lightbox} aria-label={shot.title + ' enlarged'} onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close() }}>
        <div className="shot-modal-body">
          <button type="button" className="btn btn-ghost btn-sm" autoFocus onClick={() => lightbox.current?.close()}><X size={16} /> Close preview</button>
          <img src={asset(src)} alt={caption} loading="lazy" />
        </div>
      </dialog>
    </div>
  )
}
