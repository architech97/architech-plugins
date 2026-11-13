import { useCallback, useEffect, useRef, useState } from 'react'
import { asset } from '../Brand'
import { ChairViewer, type ViewMode } from './ChairViewer'
import './i3dDemo.css'

/** Facts of the real project shown here (I3D job chair-01, mesh-qa.json). */
const MEASURED = { w: 820.423, d: 875.463, h: 900 }
const STEPS = ['Source', 'Asset', 'Engine', 'Material', 'Result'] as const
const FORMATS = ['Revit (.rfa)', 'SketchUp (.skp)', 'Rhino (.3dm)', '3ds Max (.fbx)', 'AutoCAD 3D (.dxf)']
const STATUS = [
  'Image loaded. Check the cut-out, then set the size on Asset.',
  'Set the real size. Width and depth follow the photo.',
  'Generate the shape on the local GPU.',
  'Photo UV atlas applied. Review colour and hidden surfaces before export.',
  'Ready to export. Check the mesh, then choose a format.',
]
const ENGINE_STAGES = ['Preparing the cut-out', 'Generating the shape', 'Finishing the mesh', 'Mesh ready']

type SourceView = 'photo' | 'cutout' | 'mask'

/** A working mock-up of ArchiTECH I3D around one real project: every control responds, nothing leaves the browser. */
export default function I3DDemo() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState<boolean[]>([true, false, false, false, false])
  const [source, setSource] = useState<SourceView>('cutout')
  const [removeBg, setRemoveBg] = useState(true)
  const [height, setHeight] = useState(900)
  const [mode, setMode] = useState<ViewMode>('clay')
  const [reveal, setReveal] = useState(1)
  const [engine, setEngine] = useState<{ running: boolean; stage: number; pct: number }>({ running: false, stage: 3, pct: 100 })
  const [textured, setTextured] = useState(true)
  const [format, setFormat] = useState(0)
  const [exporting, setExporting] = useState<'idle' | 'running' | 'done'>('idle')
  const [resetKey, setResetKey] = useState(0)
  const [ready, setReady] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const onReady = useCallback(() => setReady(true), [])
  const played = useRef(false)

  const scale = height / MEASURED.h
  const size = `${Math.round(MEASURED.w * scale)} × ${Math.round(MEASURED.d * scale)} × ${height} mm`
  const showImage = step === 0

  const go = (n: number) => {
    setStep(n)
    setDone((d) => d.map((v, i) => v || i < n))
    if (n === 1) setMode('clay')
    // The first visit to Engine replays the build, so the shape is seen being made.
    if (n === 2 && !played.current) { played.current = true; window.setTimeout(generate, 350) }
    if (n === 3) setMode(textured ? 'textured' : 'clay')
    if (n === 4) { setMode(textured ? 'textured' : 'clay'); setExporting('idle') }
  }

  function generate() {
    window.clearInterval(timer.current)
    setMode('wireframe'); setReveal(0); setEngine({ running: true, stage: 0, pct: 0 })
    let pct = 0
    timer.current = window.setInterval(() => {
      pct = Math.min(100, pct + 1.25)
      setReveal(Math.min(1, pct / 92))
      setEngine({ running: pct < 100, stage: pct < 18 ? 0 : pct < 80 ? 1 : pct < 100 ? 2 : 3, pct })
      if (pct >= 100) { window.clearInterval(timer.current); setMode('clay'); setDone((d) => d.map((v, i) => v || i <= 2)) }
    }, 70)
  }

  const exportFile = () => {
    setExporting('running')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setExporting('done'), 1600)
  }

  useEffect(() => () => { window.clearInterval(timer.current); window.clearTimeout(timer.current) }, [])

  return (
    <div className="i3d-demo" aria-label="ArchiTECH I3D interactive demo">
      <div className="i3d-titlebar"><span className="i3d-title-mark" aria-hidden="true" />ArchiTECH-I3D<span className="i3d-demo-tag">Demo in your browser</span></div>
      <header className="i3d-head">
        <div className="i3d-brand"><img src={asset('media/i3d/demo/lockup.webp')} alt="ArchiTECH" /><span className="i3d-rule" /><b>I3D</b></div>
        <p className="i3d-status" aria-live="polite"><i />{engine.running ? ENGINE_STAGES[engine.stage] + '…' : STATUS[step]}</p>
        <p className="i3d-service">Local · Service connected</p>
      </header>

      <div className="i3d-body">
        <aside className="i3d-left">
          <nav className="i3d-steps" aria-label="I3D steps">
            {STEPS.map((s, i) => (
              <button key={s} type="button" aria-current={step === i ? 'step' : undefined} className={done[i] && step !== i ? 'is-done' : ''} onClick={() => go(i)}>
                <span>{done[i] && step !== i ? '✓' : i + 1}</span>{s}
              </button>
            ))}
          </nav>

          <div className="i3d-panel" key={step}>
            {step === 0 && (<>
              <h3>Input model / image</h3>
              <div className="i3d-row"><button type="button" className="i3d-btn primary">Choose image</button><button type="button" className="i3d-btn">Load mesh</button></div>
              <div className="i3d-row"><button type="button" className="i3d-btn" onClick={() => setSource('mask')}>Check mask</button><button type="button" className="i3d-btn" onClick={() => setSource('cutout')}>Edit mask</button></div>
              <label className="i3d-toggle"><input type="checkbox" checked={removeBg} onChange={(e) => { setRemoveBg(e.target.checked); setSource(e.target.checked ? 'cutout' : 'photo') }} /><span />Remove image background</label>
              <p className="i3d-note">The photo of this chair is the one used in the real project. Try the background switch and the mask.</p>
            </>)}

            {step === 1 && (<>
              <h3>Asset identity &amp; dimensions</h3>
              <div className="i3d-grid2">
                <label>Asset name<input value="Chair 01" readOnly /></label>
                <label>Category<select defaultValue="Furniture"><option>Furniture</option><option>Lighting</option><option>Casework</option><option>Generic model</option></select></label>
              </div>
              <label className="i3d-field">Fit mode<select defaultValue="h"><option value="h">Keep shape — match height (W and D follow)</option></select></label>
              <label className="i3d-field">Height (mm) <b className="i3d-live">{height}</b>
                <input type="range" min={600} max={1200} step={10} value={height} onChange={(e) => setHeight(Number(e.target.value))} aria-label="Target height in millimetres" />
              </label>
              <p className="i3d-measure">Model size: {size}</p>
              <p className="i3d-note">Drag the height: the model rescales, and width and depth follow the photo’s proportions.</p>
            </>)}

            {step === 2 && (<>
              <h3>Geometry engine</h3>
              <label className="i3d-field">Engine<select defaultValue="local"><option value="local">Local · Fast (on this computer’s GPU)</option><option value="meshy">Meshy (optional cloud engine)</option></select></label>
              <button type="button" className="i3d-btn primary wide" onClick={generate} disabled={engine.running}>{engine.running ? 'Generating…' : engine.pct >= 100 ? 'Generate again' : 'Generate'}</button>
              <div className="i3d-progress" role="progressbar" aria-valuenow={Math.round(engine.pct)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: engine.pct + '%' }} /></div>
              <ol className="i3d-stages">{ENGINE_STAGES.slice(0, 3).map((s, i) => <li key={s} className={engine.stage > i || engine.pct >= 100 ? 'ok' : engine.stage === i && engine.running ? 'now' : ''}>{s}</li>)}</ol>
              <p className="i3d-note">In the app this runs on a local NVIDIA GPU. Here the real mesh is replayed, built from the floor up.</p>
            </>)}

            {step === 3 && (<>
              <h3>Appearance</h3>
              <div className="i3d-cards">
                <button type="button" aria-pressed={textured} onClick={() => { setTextured(true); setMode('textured') }}><i className="ball tex" />Textured<small>Photo colours on the mesh</small></button>
                <button type="button" aria-pressed={!textured} onClick={() => { setTextured(false); setMode('clay') }}><i className="ball" />Untextured<small>One neutral material</small></button>
              </div>
              <label className="i3d-toggle"><input type="checkbox" defaultChecked /><span />Clean Revit drawings</label>
              <label className="i3d-toggle"><input type="checkbox" defaultChecked /><span />Simplify large meshes before export</label>
              <p className="i3d-note">Up to 160,000 triangles. Fine details may change.</p>
            </>)}

            {step === 4 && (<>
              <h3>Export &amp; review</h3>
              <label className="i3d-field">Export to<select value={format} onChange={(e) => { setFormat(Number(e.target.value)); setExporting('idle') }}>{FORMATS.map((f, i) => <option key={f} value={i}>{f}</option>)}</select></label>
              <dl className="i3d-checks">
                <div><dt>Triangles</dt><dd>160,000</dd></div>
                <div><dt>Topology</dt><dd>Watertight, one component</dd></div>
                <div><dt>Size</dt><dd>{size}</dd></div>
                <div><dt>Variance</dt><dd>Height matched; width and depth follow the photo</dd></div>
              </dl>
              <button type="button" className="i3d-btn primary wide" onClick={exportFile} disabled={exporting === 'running'}>
                {exporting === 'running' ? 'Exporting…' : format === 0 ? 'Export & place in Revit' : 'Export file'}
              </button>
              {exporting === 'done' && <p className="i3d-toast" role="status">Demo only, nothing was written. In the app this saves chair-01{FORMATS[format].match(/\(([^)]+)\)/)![1]}{format === 0 ? ' and places it in the open Revit 2024 model' : ''}.</p>}
            </>)}
          </div>
        </aside>

        <section className="i3d-right" aria-label="Preview">
          <div className="i3d-right-head">
            <h4>{showImage ? 'Source preview' : step === 4 ? 'Result preview' : 'Mesh preview'}</h4>
            {!showImage && <span className="i3d-size">{size}</span>}
          </div>
          <div className="i3d-stage">
            {showImage ? (
              <div className={'i3d-photo ' + source}>
                <img src={asset(`media/i3d/demo/${source === 'photo' || !removeBg ? 'photo' : source}.webp`)} alt={source === 'mask' ? 'Foreground mask of the chair' : 'Product photo of the lounge chair'} />
              </div>
            ) : (
              <>
                <ChairViewer src={asset('media/i3d/demo/chair.glb')} mode={mode} height={height} reveal={reveal} resetKey={resetKey} onReady={onReady} />
                {!ready && <p className="i3d-loading">Loading the chair…</p>}
                <p className="i3d-hint">Drag to rotate</p>
              </>
            )}
          </div>
          <div className="i3d-viewbar">
            {showImage ? (
              (['photo', 'cutout', 'mask'] as SourceView[]).map((v) => <button key={v} type="button" aria-pressed={source === v} onClick={() => setSource(v)}>{v === 'photo' ? 'Photo' : v === 'cutout' ? 'Cut-out' : 'Mask'}</button>)
            ) : (<>
              {(['textured', 'clay', 'wireframe'] as ViewMode[]).map((v) => <button key={v} type="button" aria-pressed={mode === v} onClick={() => setMode(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
              <button type="button" onClick={() => setResetKey((k) => k + 1)}>Reset view</button>
            </>)}
          </div>
        </section>
      </div>

      <footer className="i3d-foot">
        <span>Step {step + 1} · {STEPS[step]}</span>
        <div>
          <button type="button" className="i3d-btn" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>Back</button>
          <button type="button" className="i3d-btn primary" onClick={() => go(Math.min(4, step + 1))} disabled={step === 4}>Next</button>
        </div>
      </footer>
    </div>
  )
}
