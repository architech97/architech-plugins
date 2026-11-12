import { useRef, useState, type KeyboardEvent } from 'react'
import { ArrowLeft, ArrowRight, Maximize2, Moon, Sun, X } from 'lucide-react'
import type { DialogShot, Product } from '../data/types'
import { asset } from './Brand'
import { dialogAlt, imageProps } from './dialogImage'
import './dialogGallery.css'

const sourceNote = (shot: DialogShot) => shot.real ? 'Screenshot of the installed build' : 'Rendered from the product’s own window, with sample data'

/**
 * Every real dialog of one product as a stepper: a tab per dialog state, a stage that never changes size,
 * a Dark/Light switch only where a light image exists, and a 1:1 zoom view.
 */
export function DialogGallery({ product, eager = false, ratio, dark = false }: { product: Product; eager?: boolean; ratio?: number; dark?: boolean }) {
  const dialogs = product.dialogs
  const [index, setIndex] = useState(0)
  const [light, setLight] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const lightbox = useRef<HTMLDialogElement>(null)
  const tabs = useRef<HTMLDivElement>(null)
  const shot = dialogs[index]
  if (!shot) return null
  const theme = light && shot.light ? 'light' : 'dark'
  const image = shot[theme]!
  const id = 'dialogs-' + product.slug
  // The stage keeps the shape of the product's first (main) window, so stepping never moves the page.
  const stage = ratio ?? Math.max(1.25, dialogs[0].dark[1] / dialogs[0].dark[2])
  // A product whose dialogs are all small gets a stage no taller than its tallest picture plus the margin.
  const tallest = Math.max(...dialogs.map((d) => d.dark[2])) + 72

  const select = (next: number, focus = false) => {
    setIndex(next)
    const tab = tabs.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]
    if (focus) tab?.focus({ preventScroll: true })
    tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const count = dialogs.length
    const next = event.key === 'ArrowRight' ? (index + 1) % count
      : event.key === 'ArrowLeft' ? (index + count - 1) % count
      : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : undefined
    if (next === undefined) return
    event.preventDefault()
    select(next, true)
  }

  return (
    <div className={dark ? 'dg on-dark' : 'dg'}>
      <div className="dg-head">
        <div className="dg-tabs" role="tablist" aria-label={product.name + ' dialogs'} ref={tabs}>
          {dialogs.map((item, i) => (
            <button type="button" role="tab" key={item.dark[0]} id={id + '-tab-' + i} aria-selected={i === index} aria-controls={id + '-panel'}
              tabIndex={i === index ? 0 : -1} onClick={() => select(i)} onKeyDown={onKey}>{item.state}</button>
          ))}
        </div>
        {shot.light && (
          <div className="dg-theme" role="group" aria-label="Dialog theme">
            <button type="button" aria-pressed={!light} onClick={() => setLight(false)}><Moon size={14} aria-hidden="true" /> Dark</button>
            <button type="button" aria-pressed={light} onClick={() => setLight(true)}><Sun size={14} aria-hidden="true" /> Light</button>
          </div>
        )}
      </div>
      <div className="dg-panel" role="tabpanel" id={id + '-panel'} aria-labelledby={id + '-tab-' + index}>
        <button type="button" className="dg-stage" style={{ aspectRatio: String(stage), maxHeight: `min(82vh, ${tallest}px)` }} onClick={() => { setZoomed(true); lightbox.current?.showModal() }}
          aria-label={'Zoom the ' + shot.title + ' dialog to 1:1'}>
          <img key={image[0]} {...imageProps(image)} alt={dialogAlt(product, shot, theme)} decoding="async"
            loading={eager && index === 0 ? 'eager' : 'lazy'} fetchPriority={eager && index === 0 ? 'high' : undefined} />
          <span className="dg-zoom" aria-hidden="true"><Maximize2 size={15} /> 1:1</span>
        </button>
        <div className="dg-foot">
          <p className="dg-caption" aria-live="polite">
            <strong>{shot.title}</strong>
            <span>{shot.kind}. {sourceNote(shot)}.</span>
          </p>
          {dialogs.length > 1 && (
            <div className="dg-step" role="group" aria-label="Step through the dialogs">
              <button type="button" onClick={() => select(index - 1)} disabled={index === 0} aria-label="Previous dialog"><ArrowLeft size={17} aria-hidden="true" /></button>
              <span>{index + 1} / {dialogs.length}</span>
              <button type="button" onClick={() => select(index + 1)} disabled={index + 1 === dialogs.length} aria-label="Next dialog"><ArrowRight size={17} aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Native modal dialog: the browser traps focus, closes on Esc and returns focus to the stage. */}
      <dialog className="dg-lightbox" ref={lightbox} aria-labelledby={id + '-zoom-title'} onClose={() => setZoomed(false)}
        onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <header>
          <p id={id + '-zoom-title'}><strong>{shot.title}</strong><span>{image[1]} × {image[2]} px, shown at 1:1</span></p>
          <button type="button" autoFocus onClick={() => lightbox.current?.close()}><X size={17} aria-hidden="true" /> Close</button>
        </header>
        <div className="dg-lightbox-scroll" tabIndex={0} role="region" aria-label="Full-size dialog image. Scroll to pan.">
          {zoomed && <img src={asset(image[0])} width={image[1]} height={image[2]} alt={dialogAlt(product, shot, theme)} decoding="async" />}
        </div>
      </dialog>
    </div>
  )
}
