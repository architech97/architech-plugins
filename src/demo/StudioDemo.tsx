import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, Box, Check, FileImage, Layers3, MessageSquare, Ruler, ScanLine, Search, ShieldCheck } from 'lucide-react'
import { asset } from '../components/Brand'
import type { DemoContext } from './types'
import './studio.css'

const I3D_STAGES = ['Source', 'Asset', 'Engine', 'Material', 'Result']
const SAMPLE_MODEL = 'Gallery Fit-out.rvt'
const SAMPLE_WALL = '401284'
const ORIGINAL_COMMENT = 'Site review pending'

export function I3d({ done, notify }: DemoContext) {
  const [stage, setStage] = useState(0)
  const workbench = useRef<HTMLDivElement>(null)
  const moveFocus = useRef(false)
  const heightHint = useId()
  const [unlocked, setUnlocked] = useState(0)
  const [source, setSource] = useState<'photo' | 'mesh'>('photo')
  const [size, setSize] = useState('1000')
  const [category, setCategory] = useState('Generic Models')
  const [material, setMaterial] = useState<'photo' | 'plain'>('photo')
  const [exportState, setExportState] = useState<'ready' | 'review' | 'complete'>('ready')
  const height = Number(size)
  const validSize = Number.isSafeInteger(height) && height >= 1 && height <= 100000
  const heightLabel = validSize ? new Intl.NumberFormat('en-IN').format(height) : '—'
  const format = source === 'photo' ? 'Dragon reference photo' : 'Dragon sample mesh'
  const appearance = material === 'photo' ? 'Photo texture' : 'Untextured'

  useEffect(() => {
    if (!moveFocus.current) return
    workbench.current?.focus()
    moveFocus.current = false
  }, [stage])

  function next(step: string, message: string) {
    moveFocus.current = true
    done(step)
    notify({ kind: 'info', text: message })
    setUnlocked(Math.max(unlocked, stage + 1))
    setStage(stage + 1)
    setExportState('ready')
  }

  function edit() {
    setUnlocked(stage)
    setExportState('ready')
  }

  return (
    <section className="studio-demo" aria-label="ArchiTECH I3D workflow simulation">
      <header className="studio-header">
        <span className="studio-icon"><Box size={18} /></span>
        <div><strong>I3D Desktop</strong><span className="studio-subtitle">Photo or mesh to Revit family</span></div>
        <span className="studio-chip"><span /> Sample asset</span>
      </header>
      <nav className="studio-navigation" aria-label="I3D workflow stages">
        {I3D_STAGES.map((label, index) => (
          <button key={label} type="button" aria-current={stage === index ? 'step' : undefined} disabled={index > unlocked} onClick={() => setStage(index)}>
            <span>{String(index + 1).padStart(2, '0')}</span> {label}
          </button>
        ))}
      </nav>
      <div className="studio-layout">
        <div className="studio-workbench" key={stage} ref={workbench} tabIndex={-1}>
          {stage === 0 && <>
            <p className="studio-kicker">01 / Source</p>
            <h3>Choose a starting point</h3>
            <p>Generate a shape from the supplied photo, or start with a prepared mesh.</p>
            <div className="studio-options" role="group" aria-label="Sample source">
              <button type="button" aria-pressed={source === 'photo'} onClick={() => { setSource('photo'); edit() }}><FileImage size={16} /> Sample photo</button>
              <button type="button" aria-pressed={source === 'mesh'} onClick={() => { setSource('mesh'); edit() }}><Box size={16} /> Sample mesh</button>
            </div>
            <button className="studio-action" data-demo="i3d-source" type="button" onClick={() => next('source', format + ' selected.')}>Use sample source <ArrowRight size={16} /></button>
          </>}
          {stage === 1 && <>
            <p className="studio-kicker">02 / Asset</p>
            <h3>Set the real-world size</h3>
            <p>Enter a known height in millimetres. The sample scales proportionally.</p>
            <div className="studio-fields">
              <label>Known height (mm)<input aria-describedby={heightHint} type="number" min="1" max="100000" step="1" value={size} onChange={event => { setSize(event.target.value); edit() }} /></label>
              <label>Revit category<select value={category} onChange={event => { setCategory(event.target.value); edit() }}>
                <option>Generic Models</option><option>Furniture</option><option>Casework</option><option>Lighting Fixtures</option>
              </select></label>
            </div>
            <p className="studio-note" id={heightHint}>{validSize ? 'Width and depth follow the sample proportions.' : 'Enter a whole number between 1 and 100,000 mm.'}</p>
            <button className="studio-action" data-demo="i3d-scale" type="button" disabled={!validSize} onClick={() => next('scale', `Sample height set to ${heightLabel} mm.`)}>Lock scale <Ruler size={16} /></button>
          </>}
          {stage === 2 && <>
            <p className="studio-kicker">03 / Engine</p>
            <h3>{source === 'photo' ? 'Generate the geometry' : 'Prepare the existing mesh'}</h3>
            <p>{source === 'photo' ? 'I3D Desktop cuts out the subject and builds the shape with its local AI engine. This browser run uses the prepared fixture.' : 'I3D Desktop reads the mesh and applies sizing and finishing before material review. This browser run uses the prepared fixture.'}</p>
            <div className="studio-detail"><ScanLine size={18} /><span><strong>{source === 'photo' ? 'Local AI' : 'Mesh import'}</strong><small>Prepared Dragon fixture</small></span></div>
            <button className="studio-action" data-demo="i3d-engine" type="button" onClick={() => next('engine', 'Sample geometry prepared at ' + heightLabel + ' mm.')}>{source === 'photo' ? 'Prepare sample geometry' : 'Use sample geometry'} <ArrowRight size={16} /></button>
          </>}
          {stage === 3 && <>
            <p className="studio-kicker">04 / Material</p>
            <h3>Choose the appearance</h3>
            <p>Keep the geometry plain, or use the prepared photo texture on the same shape.</p>
            <div className="studio-options" role="group" aria-label="Appearance">
              <button type="button" aria-pressed={material === 'photo'} onClick={() => { setMaterial('photo'); edit() }}><FileImage size={16} /> Photo texture</button>
              <button type="button" aria-pressed={material === 'plain'} onClick={() => { setMaterial('plain'); edit() }}><Layers3 size={16} /> Untextured</button>
            </div>
            <button className="studio-action" data-demo="i3d-material" type="button" onClick={() => next('material', appearance + ' selected for the export preview.')}>Review export <ArrowRight size={16} /></button>
          </>}
          {stage === 4 && <>
            <p className="studio-kicker">05 / Result</p>
            <h3>Export and place the family</h3>
            <p>Review the sample dimensions and category before requesting export to Revit 2024.</p>
            <dl className="studio-record">
              <div><dt>Family</dt><dd>Dragon.rfa</dd></div>
              <div><dt>Category</dt><dd>{category}</dd></div>
              <div><dt>Appearance</dt><dd>{appearance}</dd></div>
            </dl>
            {exportState === 'ready' && <button className="studio-action" data-demo="i3d-export" type="button" disabled={!validSize} onClick={() => { setExportState('review'); done('export') }}>Request export &amp; place <ArrowRight size={16} /></button>}
            {exportState === 'review' && <div className="studio-gate" aria-label="Simulated Revit approval">
              <p><ShieldCheck size={16} /> <strong>Sample Revit approval</strong></p>
              <p>Save Dragon.rfa, load it and place one instance in the sample project.</p>
              <div className="studio-actions">
                <button className="studio-secondary" type="button" onClick={() => { setExportState('ready'); notify({ kind: 'warning', text: 'Simulated export cancelled before saving or placement.' }) }}>Cancel</button>
                <button className="studio-action" data-demo="i3d-approve" type="button" onClick={() => { setExportState('complete'); done('approve'); notify({ kind: 'success', text: `Simulated export at ${heightLabel} mm. Family saved, loaded and one instance placed.` }) }}>Approve sample export</button>
              </div>
            </div>}
            {exportState === 'complete' && <ul className="studio-receipt" role="status" aria-label="Simulated export results">
              <li><Check size={15} /> <strong>File saved</strong><span>Dragon.rfa</span></li>
              <li><Check size={15} /> <strong>Family loaded</strong><span>{category}</span></li>
              <li><Check size={15} /> <strong>Instance placed</strong><span>1 at {heightLabel} mm</span></li>
            </ul>}
          </>}
        </div>
        <div className="studio-preview">
          <div className="studio-preview-label"><span><Box size={14} /> Dragon / 001</span><span>{stage < 2 ? 'Reference' : 'Asset preview'}</span></div>
          <figure>
            <div className={`studio-image ${stage >= 3 && material === 'plain' ? 'is-plain' : ''}`}>
              <img src={asset('media/i3d/desktop-0.6.36.webp')} alt="Dragon mesh shown in ArchiTECH I3D Desktop" />
            </div>
            <figcaption>{stage >= 3 && material === 'plain' ? 'Grayscale sample preview' : 'Sample asset from I3D Desktop'}</figcaption>
          </figure>
          <dl className="studio-dimensions">
            <div><dt>Width</dt><dd>{validSize ? Math.round(height * 1.353788).toLocaleString('en-IN') : '—'}</dd></div>
            <div><dt>Depth</dt><dd>{validSize ? Math.round(height * 1.280508).toLocaleString('en-IN') : '—'}</dd></div>
            <div><dt>Height</dt><dd>{heightLabel}</dd></div>
          </dl>
          <p className="studio-note">Proportional sample dimensions in mm</p>
          <details className="studio-capture">
            <summary>View the Revit placement capture</summary>
            <img src={asset('media/i3d/revit-placement-0.6.36.webp')} alt="I3D Dragon families placed in Revit 2024" loading="lazy" />
          </details>
        </div>
      </div>
    </section>
  )
}

const MODES = ['Ask', 'Search', 'Build'] as const
const MODE_ICONS = { Ask: MessageSquare, Search, Build: Layers3 }
type Mode = typeof MODES[number]
type BuildState = 'draft' | 'review' | 'denied' | 'approved'

export function Assistant({ done, notify }: DemoContext) {
  const [mode, setMode] = useState<Mode>('Build')
  const planGrid = useId()
  const [answer, setAnswer] = useState(false)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [build, setBuild] = useState<BuildState>('draft')
  const [value, setValue] = useState('Ready for issue')
  const [previous, setPrevious] = useState(ORIGINAL_COMMENT)
  const [current, setCurrent] = useState(ORIGINAL_COMMENT)
  const [readback, setReadback] = useState(false)
  const requested = value.trim()

  function draftAgain() {
    setBuild('draft')
    setReadback(false)
  }

  function decide(approved: boolean) {
    setBuild(approved ? 'approved' : 'denied')
    if (approved) setCurrent(requested)
    done('decision')
    notify(approved
      ? { kind: 'success', text: `Simulated Connector committed one update for wall ${SAMPLE_WALL}.` }
      : { kind: 'warning', text: 'Simulated Connector denied the write before opening a transaction.' })
  }

  function verify() {
    setReadback(true)
    done('readback')
    notify({ kind: 'info', text: `Sample readback for wall ${SAMPLE_WALL}: Comments = “${current}”.` })
  }

  return (
    <section className="studio-demo" aria-label="ArchiTECH Assistant workflow simulation">
      <header className="studio-header">
        <span className="studio-icon"><MessageSquare size={18} /></span>
        <div><strong>ArchiTECH Assistant</strong><span className="studio-subtitle">Ask, Search and Build</span></div>
        <span className="studio-chip"><span /> Sample workspace</span>
      </header>
      <nav className="studio-navigation" aria-label="Assistant modes">
        {MODES.map(label => {
          const Icon = MODE_ICONS[label]
          return <button key={label} type="button" aria-pressed={mode === label} onClick={() => setMode(label)}><Icon size={15} /> {label}</button>
        })}
      </nav>
      <div className="studio-layout">
        <div className="studio-workbench" key={mode}>
          {mode === 'Ask' && <>
            <p className="studio-kicker">Ask / Reference</p>
            <h3>Ask a Revit question</h3>
            <blockquote>What is the difference between instance and type parameters?</blockquote>
            {!answer && <button className="studio-action" type="button" onClick={() => { setAnswer(true); notify({ kind: 'info', text: 'The browser displayed the prepared Ask response.' }) }}>Show sample answer <ArrowRight size={16} /></button>}
            {answer && <div className="studio-answer" role="status"><strong>Sample response</strong><p>An instance parameter belongs to an individual element. A type parameter is shared by elements of the same type. Use instance Comments to track an observation on a specific wall.</p></div>}
          </>}
          {mode === 'Search' && <>
            <p className="studio-kicker">Search / Read-only query</p>
            <h3>Find a wall by ID</h3>
            <blockquote>Find wall {SAMPLE_WALL} and show its current instance Comments.</blockquote>
            {searchResult !== null && <div className="studio-answer" role="status">
              <strong>1 matching wall</strong>
              <p>Wall {SAMPLE_WALL} · Level 01</p>
              <p>Instance Comments · {searchResult}</p>
            </div>}
            <button className="studio-action" type="button" onClick={() => {
              setSearchResult(current)
              notify({ kind: 'info', text: 'Read-only query found sample wall ' + SAMPLE_WALL + '.' })
            }}>{searchResult === null ? 'Query sample model' : 'Refresh sample query'} <Search size={16} /></button>
          </>}
          {mode === 'Build' && <>
            <p className="studio-kicker">Build / Scoped update</p>
            <h3>Update one wall comment</h3>
            {build === 'draft' ? <>
              <p>Set the instance Comments value for wall {SAMPLE_WALL} in the sample model.</p>
              <form className="studio-build-form" onSubmit={event => {
                event.preventDefault()
                if (!requested || requested === current) return
                setPrevious(current)
                setBuild('review')
                done('proposal')
                notify({ kind: 'info', text: 'Sample tool call prepared for one wall. Approval is pending.' })
              }}>
                <label>New instance Comments<input value={value} maxLength={80} onChange={event => setValue(event.target.value)} /></label>
                <button className="studio-action" data-demo="assistant-propose" type="submit" disabled={!requested || requested === current}>Preview change <ArrowRight size={16} /></button>
              </form>
            </> : <>
              <div className="studio-answer">
                <strong><code>set_parameters</code> · 1 element</strong>
                <dl className="studio-record">
                  <div><dt>Before</dt><dd>{previous}</dd></div>
                  <div><dt>Requested</dt><dd>{requested}</dd></div>
                </dl>
              </div>
              {build === 'review' ? <div className="studio-gate" aria-label="Sample Connector approval">
                <p><ShieldCheck size={16} /> <strong>Revit Connector approval</strong></p>
                <p>The sample write is scoped to one instance. Choose whether to open the transaction.</p>
                <div className="studio-actions" data-demo="assistant-decide">
                  <button className="studio-secondary" type="button" onClick={() => decide(false)}>Deny</button>
                  <button className="studio-action" type="button" onClick={() => decide(true)}>Approve once</button>
                </div>
              </div> : <>
                <p className="studio-note" role="status">{build === 'approved' ? 'Sample transaction committed.' : 'Denied. The transaction never started.'}</p>
                {readback
                  ? <div className="studio-answer studio-verified" role="status"><strong><Check size={16} /> {build === 'approved' ? 'Update verified in sample model' : 'Original value verified in sample model'}</strong><p>Wall {SAMPLE_WALL} · Comments · {current}</p></div>
                  : <button className="studio-action" data-demo="assistant-readback" type="button" onClick={verify}>Read back Comments <ScanLine size={16} /></button>}
                <button className="studio-secondary" type="button" onClick={draftAgain}>{build === 'approved' ? 'Draft another change' : 'Reopen proposal'}</button>
              </>}
            </>}
          </>}
        </div>
        <aside className="studio-preview studio-scope" aria-label="Sample model scope">
          <div className="studio-preview-label"><span><Layers3 size={14} /> Model scope</span><span>Revit 2024</span></div>
          <svg className="studio-plan" viewBox="0 0 300 170" role="img" aria-label="Schematic floor plan with the sample wall highlighted">
            <defs><pattern id={planGrid} width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0v16" /></pattern></defs>
            <path fill={'url(#' + planGrid + ')'} d="M0 0h300v170H0z" />
            <g className="studio-plan-context"><path d="M40 40h220v92H40zM108 40v92m85-92v92M40 82h68m85 12h67M108 106h28m22 0h35" /><path d="M74 82v12a12 12 0 0 0 12-12m100 24V88a18 18 0 0 0-18 18" /></g>
            <path className="studio-plan-target" d="M109 40h84" />
            <circle className="studio-plan-marker" cx="151" cy="40" r="5" />
            <path className="studio-plan-leader" d="M151 36V19h45" />
            <text x="204" y="23">{SAMPLE_WALL}</text>
          </svg>
          <dl className="studio-record">
            <div><dt>Document</dt><dd>{SAMPLE_MODEL}</dd></div>
            <div><dt>Element</dt><dd>Basic Wall · {SAMPLE_WALL}</dd></div>
            <div><dt>Level</dt><dd>Level 01</dd></div>
          </dl>
          <p className="studio-note">Illustrative project and element IDs</p>
        </aside>
      </div>
    </section>
  )
}
