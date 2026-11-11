import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, Check, CircleAlert, FileCode2, RotateCcw, ScanLine, ShieldCheck } from 'lucide-react'
import { DEMO_PROJECT } from '../data/demoProject'
import { asset } from '../components/Brand'
import type { DemoContext } from './types'
import { BLOCKS, CAMERA_POINTS, EXISTING_SHEETS, OBSTACLES, RHINO_DIMENSIONS, SHEET_CHOICES, SKETCHUP_HEIGHTS } from './connectorRegistry'
import type { Result, Scenario } from './connectorRegistry'
import './connector.css'

type Phase = 'ready' | 'prepared' | 'denied' | 'applied' | 'inspected'

function Plan({ applied, block }: { applied: boolean; block: string | null }) {
  return (
    <>
      <g className="cd-lines" fill="none">
        <path d="M102 57H367V193H102Z M102 142H227 M227 57V193 M323 57V100 M227 165H367" />
        <path className="cd-line-thin" d="M107 62H362V188H107Z M107 147H222 M232 62V188 M232 170H362 M117 46H353 M110 40v12 M360 40v12 M90 67v115 M84 61h12 M84 188h12" />
        <path className="cd-line-dashed" d="M125 82h42v34h-42z M167 73h40v26h-40z M260 104h65v49h-65z M124 165h62v15h-62z" />
      </g>
      {BLOCKS.flatMap(({ label, points }, group) => points.map(([x, y], index) => (
        <g className={'cd-block' + (applied ? ' is-counted' : '') + (block && block !== label ? ' is-muted' : '')} key={label + index} transform={'translate(' + x + ' ' + y + ')'}>
          {group === 0 && <path d="M-4 3v-6a6 6 0 0 1 6 6z" />}
          {group === 1 && <circle r="3.5" />}
          {group === 2 && <rect x="-5" y="-3" width="10" height="6" rx="1" />}
        </g>
      )))}
    </>
  )
}

function Solid({ scene, option, applied }: { scene: 'rhino' | 'sketchup'; option: number; applied: boolean }) {
  const sketchup = scene === 'sketchup'
  const [width, depth, height] = sketchup ? [100, 200, SKETCHUP_HEIGHTS[option]] : RHINO_DIMENSIONS[option]
  const scale = sketchup ? 0.31 : 0.105
  const w = width * scale
  const d = depth * scale
  const h = height * scale
  const a = [218, 141]
  const b = [a[0] + w, a[1] - w * 0.36]
  const c = [b[0] - d, b[1] - d * 0.43]
  const e = [a[0] - d, a[1] - d * 0.43]
  const base = [a, b, c, e]
  const cap = base.map(([x, y]) => [x, y - h])
  const face = (...points: number[][]) => points.map((point) => point.join(',')).join(' ')
  return (
    <>
      <path className="cd-axes" d="M63 188 367 77 M68 77 355 203 M218 218V33" />
      <g className={applied ? 'cd-solid is-applied' : 'cd-solid'}>
        <polygon points={face(...base)} className="cd-solid-base" />
        <polygon points={face(a, b, cap[1], cap[0])} />
        <polygon points={face(e, a, cap[0], cap[3])} />
        <polygon points={face(...cap)} className="cd-solid-cap" />
      </g>
      <circle cx={a[0]} cy={a[1]} r="3" className="cd-origin" />
      <text className="cd-svg-label" x="226" y="42">+Z</text>
      <text className="cd-svg-label" x="226" y="215">−Z</text>
      <text className="cd-svg-label" x="235" y="164">Origin</text>
      <text className="cd-svg-label" x="18" y="225">{sketchup ? 'Signed Z ' + (height > 0 ? '+' : '−') + Math.abs(height) + ' mm' : width + ' × ' + depth + ' × ' + height + ' mm'}</text>
    </>
  )
}

function CameraPlan({ option, applied, failed }: { option: number; applied: boolean; failed?: boolean }) {
  const planX = (x: number) => 111 + x * 40
  const planY = (y: number) => 213 - y * 37
  return (
    <>
      <rect x="111" y="28" width="240" height="185" className="cd-camera-room" />
      {OBSTACLES.map(({ name, min, max }) => (
        <g key={name}>
          <rect x={planX(min[0])} y={planY(max[1])} width={(max[0] - min[0]) * 40} height={(max[1] - min[1]) * 37} rx="4" className="cd-camera-obstacle" />
          <text className="cd-svg-label" x={planX(min[0]) + 8} y={planY(max[1]) + 16}>{name}</text>
        </g>
      ))}
      <g className={'cd-camera-path' + (failed ? ' is-blocked' : applied ? ' is-applied' : '')}>
        <polyline points={CAMERA_POINTS[option].map(([x, y]) => planX(x) + ',' + planY(y)).join(' ')} />
        {CAMERA_POINTS[option].map(([x, y], index) => <circle key={index} cx={planX(x)} cy={planY(y)} r="4" />)}
      </g>
    </>
  )
}

function Viewport({ scenario, option, phase, failed, block, setBlock }: {
  scenario: Scenario; option: number; phase: Phase; failed?: boolean; block: string | null; setBlock: (value: string | null) => void
}) {
  const grid = useId()
  const applied = phase === 'applied' || phase === 'inspected'
  const { scene } = scenario
  const viewportStatus = !applied ? 'Fixture preview' : failed ? 'Sample unchanged' : scene === 'drawing' ? 'Read-only takeoff complete' : 'Sample state updated'
  const sheetNumber = SHEET_CHOICES[option]
  return (
    <div className="cd-viewport">
      <div className="cd-viewport-label"><ScanLine size={13} /><span>{scene === 'sheet' ? 'Sheet index' : scene === 'drawing' ? 'Model space' : scene === 'blender' ? 'Camera plan' : 'Perspective'}</span></div>
      <svg className="cd-scene" viewBox="0 0 460 242" role="img" aria-label={scenario.file + ' sample visualization'}>
        <defs><pattern id={grid} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="currentColor" strokeWidth=".65" /></pattern></defs>
        <rect className="cd-grid" width="100%" height="100%" fill={'url(#' + grid + ')'} />
        {scene === 'sheet' && <>
          <rect x="54" y="35" width="352" height="172" rx="3" className="cd-sheet" />
          <text className="cd-svg-label cd-sheet-head" x="72" y="60">Number</text>
          <text className="cd-svg-label cd-sheet-head" x="142" y="60">Sheet name</text>
          {EXISTING_SHEETS.map((sheet, index) => {
            const y = 73 + index * 34
            return <g key={sheet.number} className={applied && failed && sheet.number === sheetNumber ? 'cd-index-row is-conflict' : 'cd-index-row'}>
              <rect x="67" y={y} width="326" height="29" rx="3" />
              <text x="78" y={y + 18}>{sheet.number}</text>
              <text x="142" y={y + 18}>{sheet.name}</text>
            </g>
          })}
          {applied && !failed ? <g className="cd-index-row is-new">
            <rect x="67" y="141" width="326" height="29" rx="3" />
            <text x="78" y="159">{sheetNumber}</text>
            <text x="142" y="159">Building Sections</text>
            <text x="352" y="159">New</text>
          </g> : <text className="cd-svg-label" x="76" y="160">{applied ? 'Number in use. No sheet created' : 'No new sheet created'}</text>}
          <text className="cd-svg-label" x="76" y="190">{DEMO_PROJECT.code} / excerpt</text>
        </>}
        {scene === 'drawing' && <Plan applied={applied} block={block} />}
        {(scene === 'rhino' || scene === 'sketchup') && <Solid scene={scene} option={option} applied={applied} />}
        {scene === 'blender' && <CameraPlan option={option} applied={applied} failed={failed} />}
      </svg>
      {scene === 'drawing' && phase === 'inspected' && <div className="cd-block-controls" role="group" aria-label="Highlight block symbols in the drawing">
        <span>Highlight</span>
        <button className="cd-action secondary" type="button" aria-pressed={!block} onClick={() => setBlock(null)}>All blocks</button>
        {BLOCKS.map(({ label }) => <button key={label} className="cd-action secondary" type="button" aria-pressed={block === label} onClick={() => setBlock(label)}>{label}</button>)}
        <output className="cd-visually-hidden" aria-live="polite">{block ? 'Highlighting ' + block + ' in ModelSpace' : 'Showing all block references'}</output>
      </div>}
      <div className="cd-viewport-foot"><span>{scenario.file}</span><span>{viewportStatus}</span></div>
    </div>
  )
}

export default function ConnectorDemo({ scenario, done, rewind, notify }: DemoContext & { scenario: Scenario }) {
  const [option, setOption] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [result, setResult] = useState<Result>()
  const [block, setBlock] = useState<string | null>(null)
  const restarted = useRef(false)
  const requestField = useRef<HTMLSelectElement>(null)
  const nextAction = useRef<HTMLButtonElement>(null)
  const resultPanel = useRef<HTMLElement>(null)

  useEffect(() => {
    if (phase === 'inspected') resultPanel.current?.focus()
    else if (phase !== 'ready') nextAction.current?.focus()
    else if (restarted.current) {
      (requestField.current ?? nextAction.current)?.focus()
      restarted.current = false
    }
  }, [phase])

  function restart() {
    restarted.current = true
    setPhase('ready')
    setResult(undefined)
    setBlock(null)
    rewind('prepare')
  }

  function stage() {
    setPhase('prepared')
    done('prepare')
  }

  function apply() {
    const sampleResult = scenario.inspect(option)
    setResult(sampleResult)
    setPhase('applied')
    done('apply')
  }

  function deny() {
    setPhase('denied')
    notify({ kind: 'warning', text: 'Sample write denied. The fixture is unchanged.' })
  }

  function inspect() {
    setPhase('inspected')
    done('inspect')
    if (result) notify({ kind: result.failed ? 'warning' : 'success', text: result.title })
  }

  return (
    <section className="cd" aria-label={scenario.host + ' connector simulation'}>
      <header className="cd-head">
        <span className="cd-app-icon"><FileCode2 size={18} /></span>
        <div><strong>{scenario.host} connector</strong><small>{scenario.scene === 'drawing' ? 'Read-only takeoff' : 'Browser tool sandbox'}</small></div>
        <span className="cd-pill"> {DEMO_PROJECT.code}, Browser fixture</span>
      </header>
      <div className="cd-body">
        <div className="cd-request">
          <div className="cd-micro">Sample request</div>
          {scenario.option && phase === 'ready' && (
            <label className="cd-option">
              <span>{scenario.option.label}</span>
              <select ref={requestField} value={option} onChange={(event) => setOption(Number(event.target.value))}>
                {scenario.option.values.map((value, index) => <option key={value} value={index}>{value}</option>)}
              </select>
            </label>
          )}
          <p>{scenario.request(option)}</p>
          {phase !== 'ready' && <div className="cd-code"><code>{scenario.tool}</code><pre tabIndex={0} aria-label="Tool arguments">{JSON.stringify(scenario.arguments(option), null, 2)}</pre></div>}
          {phase === 'prepared' && scenario.approval && <div className="cd-feedback"><ShieldCheck size={15} /> Review this sample write before approving.</div>}
          {phase === 'denied' && <div className="cd-feedback"><CircleAlert size={15} /> Write denied. Sample document unchanged.</div>}
          {phase === 'applied' && <div className="cd-feedback"><Check size={15} /> Sample result available for inspection.</div>}
          {phase !== 'inspected' && <div className="cd-actions">
            {phase === 'ready' && <button ref={nextAction} className="cd-action" data-demo="connector-prepare" type="button" onClick={stage}>Prepare tool call <ArrowRight size={15} /></button>}
            {phase === 'prepared' && <>
              <button ref={nextAction} className="cd-action" data-demo="connector-apply" type="button" onClick={apply}>{scenario.action}</button>
              {scenario.approval && <button className="cd-action secondary" type="button" onClick={deny}>Deny</button>}
              {scenario.option && <button className="cd-action secondary" type="button" onClick={restart}>Edit request</button>}
            </>}
            {phase === 'denied' && <>
              <button ref={nextAction} className="cd-action secondary" data-demo="connector-apply" type="button" onClick={stage}>Review again</button>
              <button className="cd-action secondary" type="button" onClick={restart}>Edit request</button>
            </>}
            {phase === 'applied' && <button ref={nextAction} className="cd-action" data-demo="connector-inspect" type="button" onClick={inspect}>Inspect result <ArrowRight size={15} /></button>}
          </div>}
        </div>
        <Viewport scenario={scenario} option={option} phase={phase} failed={result?.failed} block={block} setBlock={setBlock} />
        {phase === 'inspected' && result && <section className={'cd-result' + (result.failed ? ' is-failed' : '')} ref={resultPanel} tabIndex={-1} aria-label="Sample result">
          <div className="cd-result-heading">{result.failed ? <CircleAlert size={18} /> : <Check size={18} />}<div><h3>{result.title}</h3></div></div>
          <dl>{result.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          {scenario.scene === 'blender' && !result.failed && <figure className="cd-recording">
            <video controls playsInline preload="metadata" src={asset('media/connectors/blender-walkthrough.mp4')} aria-label="Recorded camera walkthrough from Blender" />
            <figcaption>Recorded output from the separate Blender furnished-room validation project.</figcaption>
          </figure>}
          <button className="cd-action secondary cd-restart" type="button" onClick={restart}><RotateCcw size={14} /> {scenario.scene === 'blender' ? 'Try another route' : 'Run another sample'}</button>
        </section>}
      </div>
    </section>
  )
}
