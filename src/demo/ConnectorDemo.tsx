import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, Check, CircleAlert, FileCode2, ScanLine, ShieldCheck } from 'lucide-react'
import { asset } from '../components/Brand'
import type { DemoContext } from './types'
import { BLOCKS, CAMERA_POINTS, OBSTACLES, RHINO_DIMENSIONS, SHEETS, SKETCHUP_HEIGHTS } from './connectorRegistry'
import type { Result, Scenario } from './connectorRegistry'
import './connector.css'

type Phase = 'ready' | 'prepared' | 'denied' | 'applied' | 'inspected'

function Plan({ applied }: { applied: boolean }) {
  return (
    <>
      <g className="cd-lines" fill="none">
        <path d="M102 57H367V193H102Z M102 142H227 M227 57V193 M323 57V100 M227 165H367" />
        <path className="cd-line-thin" d="M107 62H362V188H107Z M107 147H222 M232 62V188 M232 170H362 M117 46H353 M110 40v12 M360 40v12 M90 67v115 M84 61h12 M84 188h12" />
        <path className="cd-line-dashed" d="M125 82h42v34h-42z M167 73h40v26h-40z M260 104h65v49h-65z M124 165h62v15h-62z" />
      </g>
      {BLOCKS.flatMap(({ label, points }, group) => points.map(([x, y], index) => (
        <circle className={applied ? 'cd-block is-counted' : 'cd-block'} style={{ animationDelay: (group * 4 + index) * 35 + 'ms' }} key={label + index} cx={x} cy={y} r={group === 2 ? 5 : 3.5} />
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
      <text className="cd-svg-label" x="235" y="164">ORIGIN</text>
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

function Viewport({ scenario, option, phase, failed }: { scenario: Scenario; option: number; phase: Phase; failed?: boolean }) {
  const grid = useId()
  const applied = phase === 'applied' || phase === 'inspected'
  const { scene } = scenario
  return (
    <div className="cd-viewport">
      <div className="cd-viewport-label"><ScanLine size={13} /><span>{scene === 'sheet' ? 'SHEET INDEX' : scene === 'drawing' ? 'MODEL SPACE' : scene === 'blender' ? 'CAMERA PLAN' : 'PERSPECTIVE'}</span></div>
      <svg className="cd-scene" viewBox="0 0 460 242" role="img" aria-label={scenario.file + ' sample visualization'}>
        <defs><pattern id={grid} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="currentColor" strokeWidth=".65" /></pattern></defs>
        <rect className="cd-grid" width="100%" height="100%" fill={'url(#' + grid + ')'} />
        {scene === 'sheet' && <>
          <rect x="71" y="28" width="318" height="184" rx="3" className="cd-sheet" />
          {applied && <>
            <path className="cd-sheet" d="M100 74H359V183H100Z M100 156H359 M290 156V183" />
            <text className="cd-svg-label cd-sheet-name" x="111" y="112">BUILDING SECTIONS</text>
            <text className="cd-svg-label" x="111" y="173">A1 TITLE BLOCK</text>
            <text className="cd-svg-label cd-sheet-number" x="303" y="174">{SHEETS[option]}</text>
          </>}
          {!applied && <text className="cd-svg-label" x="230" y="125" textAnchor="middle">NO NEW SHEET IN SAMPLE INDEX</text>}
        </>}
        {scene === 'drawing' && <Plan applied={applied} />}
        {(scene === 'rhino' || scene === 'sketchup') && <Solid scene={scene} option={option} applied={applied} />}
        {scene === 'blender' && <CameraPlan option={option} applied={applied} failed={failed} />}
      </svg>
      <div className="cd-viewport-foot"><span>{scenario.file}</span><span>{applied ? (failed ? 'Sample path blocked' : 'Sample state updated') : 'Fixture preview'}</span></div>
    </div>
  )
}

export default function ConnectorDemo({ scenario, done, notify }: DemoContext & { scenario: Scenario }) {
  const [option, setOption] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [result, setResult] = useState<Result>()
  const nextAction = useRef<HTMLButtonElement>(null)
  const resultPanel = useRef<HTMLElement>(null)

  useEffect(() => {
    if (phase === 'inspected') resultPanel.current?.focus()
    else if (phase !== 'ready') nextAction.current?.focus()
  }, [phase])

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
    <div className="cd">
      <div className="cd-head"><span><FileCode2 size={16} /> Tool sandbox</span><span className="cd-pill"><i /> Browser fixture</span></div>
      <div className="cd-body">
        <Viewport scenario={scenario} option={option} phase={phase} failed={result?.failed} />
        <div className="cd-request">
          <div className="cd-micro">Sample request</div>
          {scenario.option && phase === 'ready' && (
            <label className="cd-option">
              <span>{scenario.option.label}</span>
              <select value={option} onChange={(event) => setOption(Number(event.target.value))}>
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
            {phase === 'ready' && <button className="cd-action" data-demo="connector-prepare" type="button" onClick={stage}>Prepare tool call <ArrowRight size={15} /></button>}
            {phase === 'prepared' && <>
              <button ref={nextAction} className="cd-action" data-demo="connector-apply" type="button" onClick={apply}>{scenario.action}</button>
              {scenario.approval && <button className="cd-action secondary" type="button" onClick={deny}>Deny</button>}
            </>}
            {phase === 'denied' && <button ref={nextAction} className="cd-action secondary" data-demo="connector-apply" type="button" onClick={stage}>Review again</button>}
            {phase === 'applied' && <button ref={nextAction} className="cd-action" data-demo="connector-inspect" type="button" onClick={inspect}>Inspect result <ArrowRight size={15} /></button>}
          </div>}
        </div>
        {phase === 'inspected' && result && <section className="cd-result" ref={resultPanel} tabIndex={-1} aria-label="Sample result">
          <div className="cd-result-heading">{result.failed ? <CircleAlert size={18} /> : <Check size={18} />}<div><span className="cd-micro">Sample result</span><h3>{result.title}</h3></div></div>
          <dl>{result.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          {scenario.scene === 'blender' && !result.failed && <figure className="cd-recording">
            <video controls playsInline preload="metadata" src={asset('media/connectors/blender-walkthrough.mp4')} aria-label="Recorded camera walkthrough from Blender" />
            <figcaption>Recorded Blender output from the furnished-room project.</figcaption>
          </figure>}
        </section>}
      </div>
    </div>
  )
}
