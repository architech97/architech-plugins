import { useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react'
import { asset } from './Brand'
import './nativeEvidence.css'

export interface NativeCapture {
  title: string
  src: string
  alt: string
  note: string
}

export interface NativeEvidenceConfig {
  title: string
  context: string
  build?: string
  captures: readonly NativeCapture[]
}

export function NativeEvidence({ title, context, build, captures }: NativeEvidenceConfig) {
  const [index, setIndex] = useState(0)
  const [actualSize, setActualSize] = useState(false)
  const [failed, setFailed] = useState<string[]>([])
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const capture = captures[index]
  if (!capture) return null

  const src = asset(capture.src)
  const unavailable = failed.includes(capture.src)
  const markFailed = () => setFailed((items) => items.includes(capture.src) ? items : [...items, capture.src])
  const select = (next: number) => {
    setActualSize(false)
    setIndex(next)
  }
  const enlarge = () => {
    dialog.current?.showModal()
    closeButton.current?.focus()
  }

  return (
    <section id="native-build" className="native-evidence" tabIndex={-1} aria-labelledby="native-build-title">
      <header className="native-evidence-head">
        <div>
          <p className="demo-kicker">Native workflow evidence</p>
          <h2 id="native-build-title">{title}</h2>
          <p>{context}</p>
          {build && <p className="native-evidence-build">{build}</p>}
        </div>
        <a className="demo-text-link" href="#browser-exercise">Try the browser exercise <ArrowDown size={16} aria-hidden="true" /></a>
      </header>

      <div className="native-evidence-workbench">
        {captures.length > 1 && <div className="native-evidence-stages" role="group" aria-label="Installed app captures">
          {captures.map((item, position) => (
            <button key={item.src} type="button" aria-pressed={position === index} onClick={() => select(position)}>
              <span aria-hidden="true">{String(position + 1).padStart(2, '0')}</span>
              {item.title}
            </button>
          ))}
        </div>}
        <figure className="native-evidence-figure">
          {unavailable ? (
            <p className="native-evidence-unavailable" role="status">This capture could not be loaded.</p>
          ) : (
            <button className="native-evidence-preview" type="button" onClick={enlarge} aria-label={'Enlarge ' + capture.title}>
              <span className="native-evidence-enlarge" aria-hidden="true"><Maximize2 size={15} /> Enlarge capture</span>
              <img key={src} src={src} alt={capture.alt} decoding="async" onError={markFailed} />
            </button>
          )}
          <figcaption aria-live="polite">
            <span>{index + 1} / {captures.length}</span>
            <div><h3>{capture.title}</h3><p>{capture.note}</p></div>
          </figcaption>
        </figure>
      </div>

      <dialog className="native-evidence-dialog" ref={dialog} aria-labelledby="native-capture-title" onClose={() => setActualSize(false)} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <div className="native-evidence-dialog-inner">
          <header>
            <h3 id="native-capture-title">{capture.title}</h3>
            <button ref={closeButton} type="button" className="native-evidence-close" onClick={() => dialog.current?.close()}><X size={17} aria-hidden="true" /> Close</button>
          </header>
          <div className={actualSize ? 'native-evidence-modal-image is-actual-size' : 'native-evidence-modal-image'} tabIndex={actualSize ? 0 : undefined} role={actualSize ? 'region' : undefined} aria-label={actualSize ? 'Full-size screenshot. Scroll to pan.' : undefined}>
            {unavailable ? <p className="native-evidence-unavailable" role="status">This capture could not be loaded.</p> : <img key={src} src={src} alt={capture.alt} decoding="async" onError={markFailed} />}
          </div>
          <footer className="native-evidence-modal-tools">
            <div className="native-evidence-modal-nav" role="group" aria-label="Change capture">
              {captures.length > 1 && <>
                <button type="button" onClick={() => select(index - 1)} disabled={index === 0} aria-label="Previous capture"><ArrowLeft size={17} aria-hidden="true" /></button>
                <span aria-live="polite">{index + 1} / {captures.length}</span>
                <button type="button" onClick={() => select(index + 1)} disabled={index + 1 === captures.length} aria-label="Next capture"><ArrowRight size={17} aria-hidden="true" /></button>
              </>}
            </div>
            <div className="native-evidence-modal-actions">
              <button type="button" aria-pressed={actualSize} onClick={() => setActualSize(!actualSize)} disabled={unavailable}>Actual size</button>
              {!unavailable && <a href={src} target="_blank" rel="noreferrer" aria-label="Open image in a new tab">Open image <Maximize2 size={15} aria-hidden="true" /></a>}
            </div>
          </footer>
        </div>
      </dialog>
    </section>
  )
}
