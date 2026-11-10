import { useState } from 'react'
import type { DemoContext } from '../../types'
import { DialogShell, TaskDialogShell, MiniView, Receipt, BeforeAfter } from '../../kit'
import { Btn, Check, Select } from '../../ui'
import { sampleResidence } from '../../fixtures/sampleResidence'
import '../../demos/suiteWorkflow.css'
import './style.css'

const HOSTS = sampleResidence.floorCeilings
type Host = typeof HOSTS[number]
type Stage = 'pick' | 'preview' | 'guard' | 'result'
const refusalReasons = {
  None: '',
  Grouped: 'it is inside a group — edit the group to split it',
  Borrowed: 'it is borrowed by another user',
  'Sloped or shape-edited': 'it is sloped or shape-edited; the pieces would come back flat',
}
type Refusal = keyof typeof refusalReasons
type SplitResult = {
  host: Host
  status: 'Split' | 'Skipped' | 'Failed'
  detail: string
  pieces: number
  deleted: number[]
}

function Sketch({ hosts, split, title }: { hosts: Host[]; split: boolean; title: string }) {
  return <MiniView kind="plan" variant="floor" phase={split ? 'after' : 'before'} title={title}>
    {hosts.length ? hosts.map((host, index) => (
      <g key={host.id} transform={'translate(36 ' + (15 + index * 80) + ')'}>
        <text x="0" y="12" fill="currentColor">{host.name} · {host.id}</text>
        {host.sketchLoops.map((loop, piece) => {
          const x = loop[0][0] * 32 + (split ? piece * 8 : 0)
          const cutout = host.id === 9201 && piece === 0
          const opening = cutout ? ' M ' + (x + 47) + ' 37 h32 v16 h-32 Z' : ''
          return <g key={piece} data-motion>
            <path d={'M ' + x + ' 24 h128 v43 h-128 Z' + opening} fill={split ? 'var(--d-success)' : 'var(--d-accent)'} fillOpacity=".2" fillRule="evenodd"
              stroke={split ? 'var(--d-success)' : 'var(--d-accent)'} strokeWidth="2" />
            {split && <text x={x + 7} y="57" fill="currentColor">Region {piece + 1}</text>}
          </g>
        })}
      </g>
    )) : <text x="36" y="52" fill="currentColor">No eligible pieces in this preview.</text>}
  </MiniView>
}

export default function SplitFloorCeiling(ctx: DemoContext) {
  const [selected, setSelected] = useState<number[]>(HOSTS.map(row => row.id))
  const [removed, setRemoved] = useState<number[]>([])
  const [refusal, setRefusal] = useState<Refusal>('None')
  const [unexpected, setUnexpected] = useState(false)
  const [stage, setStage] = useState<Stage>('pick')
  const [result, setResult] = useState<SplitResult[]>([])
  const available = HOSTS.filter(host => !removed.includes(host.id))
  const rows = HOSTS.filter(host => selected.includes(host.id))
  const eligible = refusal === 'None' ? rows : rows.slice(1)
  const risky = eligible.filter(host => host.dependentIds.length > 0)
  const dependentCount = new Set(risky.flatMap(host => host.dependentIds)).size
  const guardDetails = risky.map(host => 'Source ' + host.id + ' may delete IDs ' + host.dependentIds.join(', ')).join('\n')

  function invalidate() {
    setStage('pick')
    setResult([])
    ctx.rewind('configure')
  }

  function preview() {
    if (!rows.length) return
    setStage('preview')
    ctx.done('configure')
    ctx.done('preview')
  }

  function apply(skip: boolean) {
    if (stage !== 'preview' && stage !== 'guard') return
    const targets = eligible.filter(host => !skip || !risky.includes(host))
    const mismatch = unexpected ? targets.find(host => host.dependentIds.length) ?? targets[0] : undefined
    const next = rows.map((host): SplitResult => {
      if (!targets.includes(host)) return { host, status: 'Skipped', detail: !eligible.includes(host)
        ? 'Element ' + host.id + ': skipped — ' + refusalReasons[refusal]
        : 'Element ' + host.id + ' skipped at dependent review.', pieces: 0, deleted: [] }
      if (host === mismatch) return { host, status: 'Failed',
        detail: 'ERROR on ' + host.id + ': Revit tried to delete unreviewed element IDs 9901. Inspect those elements and resolve the dependencies before retrying. — left unchanged', pieces: 0, deleted: [] }
      return { host, status: 'Split', detail: 'Element ' + host.id + ': ' + (host.loops + (host.id === 9201 ? 1 : 0)) + ' sketch loop(s), ' + host.loops +
        ' region(s)\n  split into ' + host.loops + ' new element(s)', pieces: host.loops, deleted: host.dependentIds }
    })
    const succeeded = next.filter(row => row.status === 'Split')
    setResult(next)
    setRemoved([...removed, ...succeeded.map(row => row.host.id)])
    setStage('result')
    ctx.done('apply')
    ctx.notify({ kind: succeeded.length === next.length ? 'success' : 'warning',
      text: succeeded.length + ' of ' + next.length + ' selected sample hosts split.' })
  }

  const afterHosts = stage === 'result' ? result.filter(row => row.status === 'Split').map(row => row.host) : eligible
  const pieces = afterHosts.reduce((count, host) => count + host.loops, 0)
  const skipped = result.filter(row => row.status === 'Skipped').length
  const failed = result.filter(row => row.status === 'Failed').length
  const selectedCount = rows.length
  const splitCount = afterHosts.length
  const resultText = (splitCount === 0 ? 'No floors or ceilings were split.' :
    'Split ' + splitCount + ' of ' + selectedCount + ' selected floor/ceiling element(s) into separate pieces.') +
    '\n\nSelected: ' + selectedCount + '\nSplit: ' + splitCount + '\nSkipped: ' + skipped + '\nFailed: ' + failed
  const visual = <BeforeAfter label="Sample floor and ceiling sketch" before={<Sketch hosts={rows} split={false} title="Original hosts" />}
    after={<Sketch hosts={afterHosts} split title={pieces + ' separate pieces' } />} />

  if (stage === 'guard') return <TaskDialogShell theme={ctx.theme} onTheme={ctx.setTheme} title="Split Floor / Ceiling"
    subtitle="Browser simulation · fictional Sample Residence"
    instruction={'Splitting ' + risky.length + ' of the selected elements can delete up to ' + dependentCount + ' dependent elements. See details for the IDs by source.'}
    content={'Hosted families, tags, dimensions, spot elevations and edges attached to an original are not moved onto the new pieces.'}
    details={guardDetails} onClose={() => setStage('preview')}
    commandLinks={[
      { label: 'Skip ' + risky.length + ' with dependents', onClick: () => apply(true) },
      { label: 'Allow listed deletions', onClick: () => apply(false) },
    ]}
    buttons={[{ label: 'Close', onClick: () => setStage('preview') }]}>{visual}</TaskDialogShell>

  if (stage === 'result') return <TaskDialogShell theme={ctx.theme} onTheme={ctx.setTheme} title="Split Floor / Ceiling"
    subtitle="Browser simulation · fictional Sample Residence" instruction={resultText.split('\n')[0]} details={result.map(row => row.detail).join('\n')}
    onClose={ctx.close} footer={<><Btn onClick={() => { setSelected(available.map(host => host.id)); invalidate() }}>Select more hosts</Btn><Btn primary onClick={ctx.close}>OK</Btn></>}>
    <Receipt entries={[
      { label: selectedCount + ' selected · ' + splitCount + ' split · ' + skipped + ' skipped · ' + failed + ' failed' },
      ...result.map(({ host, status, detail, pieces, deleted }) => ({ label: 'Source ' + host.id + ' · ' + status,
        detail: status === 'Split' ? pieces + ' pieces · ' + (deleted.length ? 'deleted reviewed IDs ' + deleted.join(', ') : 'no dependent IDs deleted') : detail })),
    ]} />
    {visual}
  </TaskDialogShell>

  return <DialogShell theme={ctx.theme} onTheme={ctx.setTheme} title="Split Floor / Ceiling"
    subtitle="Browser simulation · fictional Sample Residence" onClose={ctx.close}
    footer={<><span className="ad-status">{selectedCount} selected</span><Btn onClick={ctx.close}>Cancel</Btn>
      <Btn demo="floor-preview" disabled={!rows.length} onClick={preview}>Preview split</Btn>
      <Btn demo="floor-finish" primary disabled={stage !== 'preview'} onClick={() => risky.length ? setStage('guard') : apply(false)}>Finish selection</Btn></>}>
    <div className="forge-split-layout">
      <div className="ad-card suite-flow-fields" data-demo="floor-picks">
        <strong>Select floors or ceilings to split</strong>
        {available.map(host => <Check key={host.id} label={host.name + ' · ID ' + host.id}
          checked={selected.includes(host.id)} onChange={checked => {
            setSelected(checked ? [...selected, host.id] : selected.filter(id => id !== host.id))
            invalidate()
          }} />)}
        {!available.length && <p className="ad-note">Every sample host was split. Reset the demo to start again.</p>}
        <label><span className="ad-label">Sample guard on first selected host</span><Select label="Sample guard on first selected host"
          value={refusal} options={Object.keys(refusalReasons)} onChange={value => { setRefusal(value as Refusal); invalidate() }} /></label>
        <Check label="Simulate an unreviewed deletion at apply" checked={unexpected} onChange={value => { setUnexpected(value); invalidate() }} />
        <p className="ad-note">Each outer sketch island becomes one piece. The ground-floor opening stays inside its enclosing region.</p>
        {stage === 'preview' && <p role="status">{eligible.length} eligible · {risky.length} with dependents · {pieces} pieces in preview.</p>}
      </div>
      {visual}
    </div>
  </DialogShell>
}
