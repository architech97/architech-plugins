import { useState } from 'react'
import { DEMO_PROJECT } from '../../data/demoProject'
import type { DemoContext } from '../types'
import { Btn, RevitDialog, Select } from '../ui'
import './suiteWorkflow.css'

const VIEWS = [
  { name: '3D – Survey Coordination', type: '3D view', hidden: false, guard: '' },
  { name: 'Level 01 – Survey Plan', type: 'Floor plan', hidden: true, guard: '' },
  { name: 'Level 02 – Issue Plan', type: 'Floor plan', hidden: false, guard: 'The view template “Architectural Issue Plan” controls point-cloud visibility in this view.' },
  { name: 'Door Schedule', type: 'Schedule', hidden: false, guard: 'This view type does not allow visibility/graphics overrides.' },
]

export default function PointCloudVisibility({ theme, setTheme, done, notify, close }: DemoContext) {
  const [active, setActive] = useState(VIEWS[0].name)
  const [hidden, setHidden] = useState(() => Object.fromEntries(VIEWS.map(view => [view.name, view.hidden])))
  const [history, setHistory] = useState<{ name: string; hidden: boolean }[]>([])
  const [result, setResult] = useState<{ message: string; rejected?: boolean }>()
  const view = VIEWS.find(entry => entry.name === active) ?? VIEWS[0]
  const visibility = (isHidden: boolean) => isHidden ? 'Hidden' : 'Visible'

  const toggle = () => {
    done('view')
    if (view.guard) {
      setResult({ message: view.guard, rejected: true })
      notify({ kind: 'warning', text: 'The sample view did not change.' })
      return
    }
    const previous = hidden[view.name]
    setHistory([...history, { name: view.name, hidden: previous }])
    setHidden({ ...hidden, [view.name]: !previous })
    setResult({ message: `${view.name} · ${visibility(previous)} → ${visibility(!previous)}` })
    done('toggle')
  }

  const undo = () => {
    const last = history.at(-1)
    if (!last) return
    setHidden({ ...hidden, [last.name]: last.hidden })
    setHistory(history.slice(0, -1))
    setResult({ message: `${last.name} · restored to ${visibility(last.hidden).toLowerCase()}` })
    done('undo')
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} eyebrow="Arch Forge / Scan to BIM" title="Point Cloud On/Off"
      caption={`Browser simulation · ${DEMO_PROJECT.code} ${DEMO_PROJECT.name}`} onClose={close}
      footer={<>
        <span className="ad-status">Active view only</span>
        <Btn onClick={close}>Close</Btn>
        <Btn disabled={!history.length} demo="pointcloud-undo" onClick={undo}>Undo last toggle</Btn>
        <Btn primary demo="pointcloud-toggle" onClick={toggle}>Point Cloud On/Off</Btn>
      </>}>
      <div className="ad-card suite-flow-fields">
        <label><span className="ad-label">Active view</span>
          <Select label="Active view" value={active} options={VIEWS.map(entry => entry.name)} demo="pointcloud-view"
            onChange={next => { setActive(next); setResult(undefined); done('view') }} />
        </label>
        <dl className="crafted-result" aria-label="Sample view properties">
          <div><dt>View type</dt><dd>{view.type}</dd></div>
          <div><dt>Point clouds</dt><dd>{view.type === 'Schedule' ? 'Unavailable in this view' : visibility(hidden[view.name])}</dd></div>
        </dl>
        <p className="ad-note">Try the 3D view or survey plan, then test what happens in a view controlled by a template.</p>
      </div>
      {result && <div className="ad-card suite-flow-receipt" role={result.rejected ? 'alert' : 'status'}>
        <p className={result.rejected ? 'suite-flow-error' : undefined}>{result.message}</p>
        <p className="ad-note">{result.rejected ? 'The sample view retained its previous setting.' : 'This change is limited to one sample view.'}</p>
      </div>}
    </RevitDialog>
  )
}
