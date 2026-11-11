import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, Box, Check, Download, FileImage, Layers3, MessageSquare, Ruler, ScanLine, Search, ShieldCheck } from 'lucide-react'
import { asset } from '../components/Brand'
import { DEMO_PROJECT } from '../data/demoProject'
import type { DemoContext } from './types'
import './studio.css'

const I3D_STAGES = ['Source', 'Asset', 'Engine', 'Material', 'Result']
const I3D_STAGE_STEP = ['source', 'scale', 'engine', 'material', 'export']
const I3D_FIXTURES = {
  chair: { name: 'Upholstered chair', family: 'Upholstered Chair', label: 'Prepared chair mesh', size: [740, 780, 860], category: 'Furniture' },
  photo: { name: 'Dragon', family: 'Dragon', label: 'Dragon reference photo', size: [1353.788, 1280.508, 1000], category: 'Generic Models' },
  mesh: { name: 'Dragon', family: 'Dragon', label: 'Prepared Dragon mesh', size: [1353.788, 1280.508, 1000], category: 'Generic Models' },
} as const
type I3dSource = keyof typeof I3D_FIXTURES
const MESH_BUDGET = { Draft: 40000, Balanced: 80000, High: 120000, Ultra: 160000 } as const
type MeshQuality = keyof typeof MESH_BUDGET
const EXPORT_TARGETS = {
  revit: { label: 'Revit (.rfa)', extension: 'rfa' },
  rhino: { label: 'Rhino (.3dm)', extension: '3dm' },
  autocad: { label: 'AutoCAD 3D (.dxf)', extension: 'dxf' },
} as const
type ExportTarget = keyof typeof EXPORT_TARGETS
const SAMPLE_MODEL = DEMO_PROJECT.name + '.rvt'
const SAMPLE_WALL = '401284'
const SAMPLE_ACTIVE_VIEW = 'Cover'
const ORIGINAL_COMMENT = 'Site review pending'

function downloadReceipt(name: string, payload: object) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function NativeCapture({ title, images, open }: { title: string; images: { path: string; alt: string }[]; open?: boolean }) {
  return <details className="studio-capture" open={open}>
    <summary>{title}</summary>
    <p className="studio-note">Native capture from a separate desktop session.</p>
    {images.map(({ path, alt }) => <a key={path} href={asset(path)} target="_blank" rel="noopener noreferrer" aria-label={alt + ' (open full size)'}>
      <img src={asset(path)} alt={alt} loading="lazy" />
    </a>)}
  </details>
}

export function I3d({ done, rewind, notify }: DemoContext) {
  const [stage, setStage] = useState(0)
  const workbench = useRef<HTMLDivElement>(null)
  const exportAction = useRef<HTMLButtonElement>(null)
  const moveFocus = useRef(false)
  const heightHint = useId()
  const [unlocked, setUnlocked] = useState(0)
  const [source, setSource] = useState<I3dSource>('chair')
  const [size, setSize] = useState(String(I3D_FIXTURES.chair.size[2]))
  const [category, setCategory] = useState<string>(I3D_FIXTURES.chair.category)
  const [quality, setQuality] = useState<MeshQuality>('High')
  const [material, setMaterial] = useState<'photo' | 'plain'>('photo')
  const [clean, setClean] = useState(false)
  const [simplify, setSimplify] = useState(true)
  const [target, setTarget] = useState<ExportTarget>('revit')
  const [exportState, setExportState] = useState<'ready' | 'review' | 'complete'>('ready')
  const fixture = I3D_FIXTURES[source]
  const isRevit = target === 'revit'
  const file = fixture.family + '.' + EXPORT_TARGETS[target].extension
  const height = Number(size)
  const validSize = Number.isSafeInteger(height) && height >= 1 && height <= 100000
  const mm = fixture.size.map((value) => Math.round(value * height / fixture.size[2]))
  const dimensions = mm.map((value) => validSize ? value.toLocaleString('en-IN') : '—')
  const heightLabel = dimensions[2]
  const showReference = stage < 2 && source === 'photo'
  const neutral = !showReference && material === 'plain'
  const appearance = material === 'plain' ? 'Untextured' : target === 'autocad' ? 'Flat colours' : 'Textured'
  const cleanDrawing = isRevit && material === 'photo' && clean
  const image = showReference ? 'media/i3d/dragon-reference.webp' : source === 'chair' ? 'media/i3d/chair-mesh.png' : 'media/i3d/desktop-0.6.36.webp'

  useEffect(() => {
    if (!moveFocus.current) return
    if (stage === 4 && exportState !== 'complete') exportAction.current?.focus()
    else workbench.current?.focus()
    moveFocus.current = false
  }, [stage, exportState])

  function next(step: string, message: string) {
    moveFocus.current = true
    done(step)
    notify({ kind: 'info', text: message })
    setUnlocked(Math.max(unlocked, stage + 1))
    setStage(stage + 1)
  }

  function edit() {
    setUnlocked(stage)
    setExportState('ready')
    rewind(I3D_STAGE_STEP[stage])
  }

  function selectSource(nextSource: I3dSource) {
    if (source === nextSource) return
    setSource(nextSource)
    setSize(String(I3D_FIXTURES[nextSource].size[2]))
    setCategory(I3D_FIXTURES[nextSource].category)
    edit()
  }

  function completeExport() {
    moveFocus.current = true
    setExportState('complete')
    done('approve')
    notify({ kind: 'success', text: isRevit
      ? 'Sample result recorded: family saved, loaded and one instance placed.'
      : 'Sample result recorded: ' + file + ' saved.' })
  }

  return (
    <section className="studio-demo i3d-studio" aria-label="ArchiTECH I3D workflow simulation">
      <header className="studio-header">
        <span className="studio-icon"><Box size={18} /></span>
        <div><strong>I3D Desktop</strong><span className="studio-subtitle">Photo or mesh to Revit family</span></div>
        <span className="studio-chip"><span /> {DEMO_PROJECT.code} · Sample asset</span>
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
            <p>Start with the prepared chair mesh, or use the Dragon photo and mesh fixtures to compare source routes.</p>
            <div className="studio-options studio-sources" role="group" aria-label="Sample source">
              <button type="button" aria-pressed={source === 'chair'} onClick={() => selectSource('chair')}><Box size={16} /> Chair mesh</button>
              <button type="button" aria-pressed={source === 'photo'} onClick={() => selectSource('photo')}><FileImage size={16} /> Dragon photo</button>
              <button type="button" aria-pressed={source === 'mesh'} onClick={() => selectSource('mesh')}><Box size={16} /> Dragon mesh</button>
            </div>
            <button className="studio-action" data-demo="i3d-source" type="button" onClick={() => next('source', fixture.label + ' selected.')}>Use sample source <ArrowRight size={16} /></button>
          </>}
          {stage === 1 && <>
            <p className="studio-kicker">02 / Asset</p>
            <h3>Set the real-world size</h3>
            <p>Enter a known height in millimetres. The sample scales proportionally.</p>
            <div className="studio-fields">
              <label>Known height (mm)<input aria-describedby={heightHint} aria-invalid={!validSize} inputMode="numeric" type="number" min="1" max="100000" step="1" value={size} onChange={event => { setSize(event.target.value); edit() }} /></label>
              <label>Revit category<select value={category} onChange={event => { setCategory(event.target.value); edit() }}>
                <option>Generic Models</option><option>Furniture</option><option>Casework</option><option>Lighting Fixtures</option>
              </select></label>
            </div>
            <p className={'studio-note' + (!validSize ? ' is-error' : '')} id={heightHint}>{validSize ? 'Width and depth follow the sample proportions.' : 'Enter a whole number between 1 and 100,000 mm.'}</p>
            <button className="studio-action" data-demo="i3d-scale" type="button" disabled={!validSize} onClick={() => next('scale', `Sample height set to ${heightLabel} mm.`)}>Lock scale <Ruler size={16} /></button>
          </>}
          {stage === 2 && <>
            <p className="studio-kicker">03 / Engine</p>
            <h3>{source === 'photo' ? 'Generate the geometry' : 'Prepare the existing mesh'}</h3>
            <p>{source === 'photo' ? 'I3D Desktop cuts out the subject and builds the shape with its local AI engine. This browser run uses the prepared fixture.' : 'I3D Desktop reads the mesh and applies sizing and finishing before material review. This browser run uses the prepared fixture.'}</p>
            <div className="studio-detail"><ScanLine size={18} /><span><strong>{source === 'photo' ? 'Local AI' : 'Mesh import'}</strong><small>{fixture.label}</small></span></div>
            <label className="studio-field">Mesh quality<select value={quality} onChange={event => { setQuality(event.target.value as MeshQuality); edit() }}>
              {Object.keys(MESH_BUDGET).map((option) => <option key={option}>{option}</option>)}
            </select></label>
            <button className="studio-action" data-demo="i3d-engine" type="button" onClick={() => next('engine', 'Sample geometry prepared at ' + heightLabel + ' mm.')}>{source === 'photo' ? 'Prepare sample geometry' : 'Use sample geometry'} <ArrowRight size={16} /></button>
          </>}
          {stage === 3 && <>
            <p className="studio-kicker">04 / Material</p>
            <h3>Choose the appearance</h3>
            <p>Keep the supplied texture or choose one neutral material for export.</p>
            <div className="studio-options" role="group" aria-label="Appearance">
              <button type="button" aria-pressed={material === 'photo'} onClick={() => { if (material !== 'photo') { setMaterial('photo'); edit() } }}><FileImage size={16} /> Textured</button>
              <button type="button" aria-pressed={material === 'plain'} onClick={() => { if (material !== 'plain') { setMaterial('plain'); edit() } }}><Layers3 size={16} /> Untextured</button>
            </div>
            {material === 'photo' && <label className="studio-checkbox"><input type="checkbox" checked={clean} onChange={event => { setClean(event.target.checked); edit() }} />Clean Revit drawings</label>}
            {material === 'photo' && clean && <p className="studio-note">In a Revit family, Fine detail keeps the texture. Coarse and Medium use a second, clean mesh.</p>}
            <label className="studio-checkbox"><input type="checkbox" checked={simplify} onChange={event => { setSimplify(event.target.checked); edit() }} />Simplify large meshes before export</label>
            {simplify && <p className="studio-note">Selected mesh budget · up to {MESH_BUDGET[quality].toLocaleString('en-IN')} triangles.</p>}
            <button className="studio-action" data-demo="i3d-material" type="button" onClick={() => next('material', 'Appearance and mesh options prepared for review.')}>Apply and continue <ArrowRight size={16} /></button>
          </>}
          {stage === 4 && <>
            <p className="studio-kicker">05 / Result</p>
            <h3>Review the export plan</h3>
            <p>Choose a target and inspect the settings used in the browser sample. The receipt download is a JSON report.</p>
            <label className="studio-field">Export to<select value={target} onChange={event => { setTarget(event.target.value as ExportTarget); edit() }}>
              {Object.entries(EXPORT_TARGETS).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}
            </select></label>
            <dl className="studio-record">
              <div><dt>File</dt><dd>{file}</dd></div>
              {isRevit && <div><dt>Category</dt><dd>{category}</dd></div>}
              <div><dt>Appearance</dt><dd>{appearance}</dd></div>
              <div><dt>Width × depth × height</dt><dd>{dimensions.join(' × ')} mm</dd></div>
              <div><dt>Triangle budget</dt><dd>{simplify ? MESH_BUDGET[quality].toLocaleString('en-IN') : 'Source mesh'}</dd></div>
              {isRevit && <div><dt>Target document</dt><dd>{SAMPLE_MODEL}</dd></div>}
              {cleanDrawing && <div><dt>Revit detail levels</dt><dd>Textured at Fine · clean mesh at Medium and Coarse</dd></div>}
            </dl>
            {exportState === 'ready' && <button ref={exportAction} className="studio-action" data-demo="i3d-export" type="button" disabled={!validSize} onClick={() => {
              moveFocus.current = true
              done('export')
              if (isRevit) setExportState('review')
              else completeExport()
            }}>{isRevit ? 'Request export & place' : 'Simulate file export'} <ArrowRight size={16} /></button>}
            {exportState === 'review' && <div className="studio-gate" aria-label="Simulated Revit approval">
              <p><ShieldCheck size={16} /> <strong>Sample Revit approval</strong></p>
              <p>Save {file}, load it and place one instance in {SAMPLE_MODEL}.</p>
              <div className="studio-actions">
                <button className="studio-secondary" type="button" onClick={() => { moveFocus.current = true; setExportState('ready'); rewind('export'); notify({ kind: 'warning', text: 'Simulated export cancelled before saving or placement.' }) }}>Cancel</button>
                <button ref={exportAction} className="studio-action" data-demo="i3d-approve" type="button" onClick={completeExport}>Approve sample export</button>
              </div>
            </div>}
            {exportState === 'complete' && <>
              <p className="studio-kicker">Simulated export receipt</p>
              <ul className="studio-receipt" role="status" aria-label="Simulated export results">
                <li><Check size={15} /> <strong>File saved</strong><span>{file}</span></li>
                {isRevit && <>
                  <li><Check size={15} /> <strong>Family loaded</strong><span>{category}</span></li>
                  <li><Check size={15} /> <strong>Instance placed</strong><span>1 instance in {DEMO_PROJECT.code}</span></li>
                </>}
              </ul>
              <div className="studio-actions">
                <button className="studio-secondary" type="button" onClick={() => { moveFocus.current = true; setStage(1) }}>Adjust size or category</button>
                <button className="studio-secondary" type="button" onClick={() => downloadReceipt('i3d-sample-export-receipt.json', {
                  simulated: true, source: fixture.label, dimensionsMm: { width: mm[0], depth: mm[1], height: mm[2] },
                  target: EXPORT_TARGETS[target].label, file, appearance, triangleBudget: simplify ? MESH_BUDGET[quality] : null,
                  ...(isRevit ? { project: SAMPLE_MODEL, category, cleanDrawing, result: { saved: true, loaded: true, placed: 1 } } : { result: { saved: true } }),
                })}><Download size={15} /> Download sample receipt</button>
              </div>
            </>}
          </>}
        </div>
        <div className="studio-preview">
          <div className="studio-preview-label"><span><Box size={14} /> {fixture.name}</span><span>{showReference ? 'Reference image' : 'Mesh preview'}</span></div>
          <figure>
            <div className={'studio-image' + (showReference ? ' is-reference' : '') + (source === 'chair' ? ' is-chair' : '') + (neutral ? ' is-plain' : '')}>
              <img src={asset(image)} alt={showReference ? 'Dragon reference image' : fixture.name + ' mesh from the I3D Desktop preview'} />
            </div>
            <figcaption>{showReference ? 'Source image from the I3D sample materials' : neutral ? 'Illustrative neutral display of the native mesh capture' : 'Native I3D Desktop capture · mesh preview before export'}</figcaption>
          </figure>
          <dl className="studio-dimensions">
            {['Width', 'Depth', 'Height'].map((axis, index) => <div key={axis}><dt>{axis}</dt><dd>{dimensions[index]}</dd></div>)}
          </dl>
          <p className="studio-note">Proportional sample dimensions in mm</p>
          {source === 'chair'
            ? <NativeCapture title="See the native Material workspace" images={[{ path: 'media/i3d/material-workspace.webp', alt: 'I3D Material workspace with textured and untextured options and the chair mesh' }]} />
            : <NativeCapture title="See the separate Dragon placement capture" images={[{ path: 'media/i3d/revit-placement-0.6.36.webp', alt: 'Dragon families placed during a separate Revit 2024 run' }]} />}
        </div>
      </div>
    </section>
  )
}

const MODES = ['Ask', 'Search', 'Build'] as const
const MODE_ICONS = { Ask: MessageSquare, Search, Build: Layers3 }
const ASK_EXAMPLES = [
  { question: 'What is the difference between instance and type parameters?', response: 'An instance parameter belongs to an individual element. A type parameter is shared by elements of the same type. Use instance Comments to track an observation on a specific wall.' },
  { question: 'How can I confirm that a model update took effect?', response: 'Read the target element after the operation, then compare the stored parameter value with the requested value. Keep the element ID and parameter name in the receipt.' },
]
type Mode = typeof MODES[number]
type BuildState = 'draft' | 'review' | 'denied' | 'approved'

export function Assistant({ done, rewind, notify }: DemoContext) {
  const [mode, setMode] = useState<Mode>('Search')
  const planGrid = useId()
  const buildAction = useRef<HTMLButtonElement>(null)
  const buildField = useRef<HTMLInputElement>(null)
  const receipt = useRef<HTMLDivElement>(null)
  const focusBuild = useRef(false)
  const inputHint = useId()
  const [question, setQuestion] = useState(0)
  const [answer, setAnswer] = useState(false)
  const [searchKind, setSearchKind] = useState<'view' | 'wall'>('view')
  const [viewRead, setViewRead] = useState(false)
  const [searchId, setSearchId] = useState(SAMPLE_WALL)
  const [searchResult, setSearchResult] = useState<{ id: string; comment?: string } | null>(null)
  const [build, setBuild] = useState<BuildState>('draft')
  const [value, setValue] = useState('Ready for issue')
  const [previous, setPrevious] = useState(ORIGINAL_COMMENT)
  const [current, setCurrent] = useState(ORIGINAL_COMMENT)
  const [readback, setReadback] = useState(false)
  const requested = value.trim()
  const validSearch = /^[0-9]{1,8}$/.test(searchId.trim())
  const toolArguments = {
    capability_id: 'set_parameters',
    arguments: { updates: [{ element_id: Number(SAMPLE_WALL), parameter: 'Comments', value: requested }] },
    expected_document_fingerprint: { documentId: 'sample-residence' },
  }

  useEffect(() => {
    if (!focusBuild.current) return
    if (readback) receipt.current?.focus()
    else if (build === 'draft') buildField.current?.focus()
    else buildAction.current?.focus()
    focusBuild.current = false
  }, [build, readback])

  function draftAgain() {
    focusBuild.current = true
    setBuild('draft')
    setReadback(false)
    rewind('proposal')
  }

  function decide(approved: boolean) {
    focusBuild.current = true
    setBuild(approved ? 'approved' : 'denied')
    if (approved) {
      setCurrent(requested)
      setSearchResult(null)
    }
    done('decision')
    notify(approved
      ? { kind: 'success', text: `Simulated Connector committed one update for wall ${SAMPLE_WALL}.` }
      : { kind: 'warning', text: 'Simulated Connector denied the write before opening a transaction.' })
  }

  function verify() {
    focusBuild.current = true
    setReadback(true)
    done('readback')
    notify({ kind: 'info', text: `Sample readback for wall ${SAMPLE_WALL}: Comments = “${current}”.` })
  }

  function openMode(nextMode: Mode) {
    setMode(nextMode)
    if (nextMode === 'Build') done('build-mode')
  }

  return (
    <section className="studio-demo assistant-studio" aria-label="ArchiTECH Assistant workflow simulation">
      <header className="studio-header">
        <span className="studio-icon"><MessageSquare size={18} /></span>
        <div><strong>ArchiTECH Assistant</strong><span className="studio-subtitle">Ask, Search and Build</span></div>
        <span className="studio-chip"><span /> {DEMO_PROJECT.code} · Sample workspace</span>
      </header>
      <nav className="studio-navigation" aria-label="Assistant modes">
        {MODES.map(label => {
          const Icon = MODE_ICONS[label]
          return <button key={label} type="button" aria-pressed={mode === label} data-demo={label === 'Build' ? 'assistant-build-mode' : undefined} onClick={() => openMode(label)}><Icon size={15} /> {label}</button>
        })}
      </nav>
      <div className="studio-layout">
        <div className="studio-workbench" key={mode}>
          {mode === 'Ask' && <>
            <p className="studio-kicker">Ask / Reference</p>
            <h3>Ask a Revit question</h3>
            <label className="studio-field">Sample question<select value={question} onChange={event => { setQuestion(Number(event.target.value)); setAnswer(false) }}>
              {ASK_EXAMPLES.map(({ question: label }, index) => <option key={label} value={index}>{label}</option>)}
            </select></label>
            <button className="studio-action" type="button" onClick={() => setAnswer(true)}>Show sample answer <ArrowRight size={16} /></button>
            {answer && <div className="studio-exchange" role="status">
              <p>{ASK_EXAMPLES[question].question}</p>
              <p>{ASK_EXAMPLES[question].response}</p>
            </div>}
          </>}
          {mode === 'Search' && <>
            <p className="studio-kicker">Search / Read-only query</p>
            <h3>Read model context</h3>
            <div className="studio-options" role="group" aria-label="Sample query">
              <button type="button" aria-pressed={searchKind === 'view'} onClick={() => setSearchKind('view')}>Active view</button>
              <button type="button" aria-pressed={searchKind === 'wall'} onClick={() => setSearchKind('wall')}>Wall Comments</button>
            </div>
            {searchKind === 'view' ? <>
              <div className="studio-exchange" role="status">
                <p>What is the active view?</p>
                {viewRead && <p>The active view is <strong>{SAMPLE_ACTIVE_VIEW}.</strong></p>}
              </div>
              <button className="studio-action" type="button" data-demo="assistant-context" onClick={() => {
                setViewRead(true)
                done('context')
                notify({ kind: 'info', text: 'Read-only sample query returned ' + SAMPLE_ACTIVE_VIEW + '.' })
              }}>{viewRead ? 'Read again' : 'Read sample active view'} <Search size={16} /></button>
              <p className="studio-note">{SAMPLE_MODEL} browser fixture</p>
            </> : <>
              <p>Read a wall’s instance Comments in {DEMO_PROJECT.name}. Try {SAMPLE_WALL} or enter another ID.</p>
              <form className="studio-build-form" onSubmit={event => {
              event.preventDefault()
              if (!validSearch) return
              const id = searchId.trim()
              setSearchResult({ id, comment: id === SAMPLE_WALL ? current : undefined })
            }}>
              <label>Wall element ID<input inputMode="numeric" maxLength={8} value={searchId} onChange={event => { setSearchId(event.target.value); setSearchResult(null) }} /></label>
              <button className="studio-action" type="submit" disabled={!validSearch}>{searchResult ? 'Refresh sample query' : 'Query sample model'} <Search size={16} /></button>
              </form>
              {searchResult && <div className="studio-answer" role="status">
                <strong>{searchResult.comment !== undefined ? '1 matching wall' : 'No matching wall'}</strong>
                {searchResult.comment !== undefined ? <><p>Wall {searchResult.id} · Level 01</p><p>Instance Comments · {searchResult.comment}</p></>
                  : <p>Element {searchResult.id} does not exist in this sample. Try {SAMPLE_WALL}.</p>}
              </div>}
            </>}
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
                focusBuild.current = true
                setBuild('review')
                done('proposal')
              }}>
                <label>New instance Comments<input ref={buildField} aria-describedby={inputHint} value={value} maxLength={80} onChange={event => setValue(event.target.value)} /></label>
                <p className="studio-note" id={inputHint}>{!requested ? 'Enter a Comments value to preview it.' : requested === current ? 'Enter a different value from the stored Comments.' : 'The change applies to one wall instance.'}</p>
                <button className="studio-action" data-demo="assistant-propose" type="submit" disabled={!requested || requested === current}>Preview change <ArrowRight size={16} /></button>
              </form>
            </> : <>
              <div className="studio-answer">
                <strong><code>set_parameters</code> · 1 element</strong>
                <dl className="studio-record">
                  <div><dt>Before</dt><dd>{previous}</dd></div>
                  <div><dt>Requested</dt><dd>{requested}</dd></div>
                </dl>
                <details className="studio-call">
                  <summary>View tool arguments</summary>
                  <pre tabIndex={0} aria-label="Tool arguments">{JSON.stringify(toolArguments, null, 2)}</pre>
                </details>
              </div>
              {build === 'review' ? <div className="studio-gate" aria-label="Sample Connector approval">
                <p><ShieldCheck size={16} /> <strong>Revit Connector approval</strong></p>
                <p>The sample write is scoped to one instance. Choose whether to open the transaction.</p>
                <div className="studio-actions" data-demo="assistant-decide">
                  <button className="studio-secondary" type="button" onClick={() => decide(false)}>Deny</button>
                  <button ref={buildAction} className="studio-action" type="button" onClick={() => decide(true)}>Approve once</button>
                </div>
              </div> : <>
                <p className="studio-note" role="status">{build === 'approved' ? 'Sample transaction committed.' : 'Denied. The transaction never started.'}</p>
                {readback
                  ? <div className="studio-answer studio-verified" ref={receipt} tabIndex={-1} role="status"><strong><Check size={16} /> {build === 'approved' ? 'Update verified in sample model' : 'Unchanged value verified in sample model'}</strong><p>Wall {SAMPLE_WALL} · Comments · {current}</p></div>
                  : <button ref={buildAction} className="studio-action" data-demo="assistant-readback" type="button" onClick={verify}>Read back Comments <ScanLine size={16} /></button>}
                <div className="studio-actions">
                  <button className="studio-secondary" type="button" onClick={draftAgain}>{build === 'approved' ? 'Draft another change' : 'Reopen proposal'}</button>
                  {readback && <button className="studio-secondary" type="button" onClick={() => downloadReceipt('assistant-sample-review-receipt.json', {
                    simulated: true, document: SAMPLE_MODEL, wallId: Number(SAMPLE_WALL), parameter: 'Comments', before: previous,
                    requested, decision: build, transaction: build === 'approved' ? 'committed' : 'not_started', storedValue: current, toolArguments,
                  })}><Download size={15} /> Download sample receipt</button>}
                </div>
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
            <div><dt>Stored Comments</dt><dd>{current}</dd></div>
          </dl>
          <p className="studio-note">Illustrative project and element IDs</p>
          <NativeCapture title="See the native Assistant readback and composer" open images={[
            { path: 'media/assistant/active-view-exchange.png', alt: 'Native Assistant exchange: What is the active view? The active view is Cover.' },
            { path: 'media/assistant/composer-modes.png', alt: 'Native Assistant composer with Ask, Search and Build controls' },
          ]} />
        </aside>
      </div>
    </section>
  )
}
