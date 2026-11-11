import { useState } from 'react'
import type { DemoContext, DemoDefinition } from '../../types'
import { DialogShell, TaskDialogShell, MiniView, Receipt, BeforeAfter } from '../../kit'
import { Btn } from '../../ui'
import { sampleResidence } from '../../fixtures/sampleResidence'
import '../spot-elevation-line/task-tools.css'

const SOURCE = 'Arch Folio/Detailing.panel/Split Region With Line.pushbutton/'
type Region = typeof sampleResidence.regions[number]
function RegionView({ rows, after, skipped = [], actionKey = 0 }: { rows: Region[]; after: boolean; skipped?: number[]; actionKey?: number }) {
  return <MiniView variant="split" phase={after ? 'after' : 'before'} actionKey={actionKey} title={after ? 'After: two halves per eligible region' : 'Before: selected regions and infinite detail line'}>
    {rows.map((region, i) => {
      const cut = after && !skipped.includes(region.id)
      const color = region.masking ? 'var(--d-muted)' : i % 2 === 0 ? 'var(--d-accent)' : 'var(--d-success)'
      return <g key={region.id} transform={`translate(0 ${i * 78})`}><text x="22" y="23" fontSize="12">{region.name}{skipped.includes(region.id) ? ', skipped' : ''}</text><g data-motion>
        <path d="M 130 8 H 300 V 62 H 130 Z" transform={cut ? 'translate(-9 0)' : undefined} fill={color} fillOpacity={region.masking ? '.04' : '.2'} stroke={color} strokeWidth="2" />
        <path d="M 300 8 H 535 V 62 H 300 Z" transform={cut ? 'translate(9 0)' : undefined} fill={color} fillOpacity={region.masking ? '.04' : '.2'} stroke={color} strokeWidth="2" />
        {!region.masking && [0, 1, 2, 3, 4].map(n => <path key={n} d={`M ${145 + n * 75} 13 l 30 43`} stroke={color} opacity=".35" />)}
        <text x="145" y="43" fontSize="11">{cut ? 'Piece 1' : region.type}</text>{cut && <text x="375" y="43" fontSize="11">Piece 2</text>}
      </g></g>
    })}
    <path d="M 300 0 V 255" stroke="var(--d-error)" strokeWidth="2" strokeDasharray="7 5" />
    <text x="312" y="252" fontSize="11">Infinite plane through detail line</text>
  </MiniView>
}
export const definition: DemoDefinition = {
  id: 'split-region-with-line', productSlug: 'split-region-with-line', kind: 'crafted', width: 1040,
  ribbon: { tab: 'Arch Folio', panel: 'Detailing', button: 'Split Region With Line' },
  title: 'Split Region With Line', summary: 'Pick filled or masking regions and a detail line, review lost dependents, and split the sample into two pieces per region.',
  basis: ['Commands/SplitCommands.cs', 'Core/RegionSplitter.cs', 'Core/SplitGuards.cs', 'Lib/ArchUi/ArchiTechMessage.cs', 'App.cs'].map(p => SOURCE + p),
  steps: [
    { id: 'configure', title: 'Pick regions and a detail line', hint: 'Tick Tile, Screed and Masking; the straight detail line is extended as an infinite plane.', target: 'region-picks' },
    { id: 'preview', title: 'Review the sample cut', hint: 'Preview the selected regions. Check the dependent tag before finishing selection.', target: 'region-preview' },
    { id: 'apply', title: 'Choose the native guard action', hint: 'Skip regions with dependents or split all; read Selected, Split and Not split in the result.', target: 'region-finish' },
  ], load: async () => ({ default: SplitRegions }),
}

export default function SplitRegions(ctx: DemoContext) {
  const [selected, setSelected] = useState<number[]>(sampleResidence.regions.map(r => r.id))
  const [line, setLine] = useState('Straight detail line')
  const [riskEnabled, setRiskEnabled] = useState(true)
  const [stage, setStage] = useState<'pick'|'preview'|'guard'|'result'>('pick')
  const [result, setResult] = useState<{ split: number; skipped: number; dependents: number }>()
  const [action, setAction] = useState(0)
  const [error, setError] = useState('')
  const rows = sampleResidence.regions.filter(r => selected.includes(r.id))
  const risky = riskEnabled ? rows.filter(r => r.dependents > 0) : []
  const dependentCount = risky.reduce((n, r) => n + r.dependents, 0)
  const invalidate = () => { setStage('pick'); setResult(undefined); setError(''); ctx.rewind('configure') }
  const apply = (skip: boolean) => {
    const skipped = skip ? risky.length : 0
    const next = { split: rows.length - skipped, skipped, dependents: skip ? 0 : dependentCount }
    setResult(next); setStage('result'); setAction(a => a + 1); ctx.done('apply')
    ctx.notify({ kind: skipped ? 'warning' : 'success', text: `Simulated: ${next.split} regions split into ${next.split * 2} pieces; ${skipped} skipped; ${next.dependents} dependents deleted.` })
  }
  const preview = () => {
    ctx.done('configure')
    if (!rows.length) { setError('No filled regions were selected.'); return }
    if (line !== 'Straight detail line') { setError('That detail line has no usable curve — pick a straight detail line.'); return }
    setError(''); setStage('preview'); ctx.done('preview')
  }
  const guardText = `${risky.length} of the selected element(s) have ${dependentCount} dependent element(s) Revit will delete with the original.\n\nHosted families, tags, dimensions, spot elevations and edges attached to an original are not moved onto the new pieces.\n\nSkip: split only the elements nothing depends on.\nSplit all: the ${dependentCount} dependent element(s) are deleted.`
  const log = result ? `Selected: ${rows.length}\nSplit: ${result.split}\nNot split: ${result.skipped}` : ''
  const details = result ? [result.skipped ? `${result.skipped} region(s) skipped: other elements depend on them.` : '', ...rows.map(r => result.skipped && risky.some(x => x.id === r.id) ? `Region ${r.id}: skipped at dependent review` : `${r.id}: split in two`)].filter(Boolean).join('\n') : ''
  const visual = <div className="wp-task-visual"><h3>Detail line → infinite cutting plane</h3><p>Sample data, fictional, the original type and boundary line style are preserved. Masking regions are supported in Revit 2024 and later.</p><BeforeAfter before={<RegionView rows={rows} after={false} />} after={<RegionView rows={rows} after={stage !== 'pick'} skipped={result?.skipped ? risky.map(r => r.id) : []} actionKey={action} />} /><div className="wp-task-count"><span><strong>{rows.length}</strong> selected</span><span><strong>{result ? result.split * 2 : rows.length * 2}</strong> pieces</span></div></div>
  const note = <details className="wp-task-meta"><summary>Based on, source files and native workflow</summary><p>{SOURCE}Commands/SplitCommands.cs; Core/RegionSplitter.cs; Core/SplitGuards.cs; App.cs; Lib/ArchUi/ArchiTechMessage.cs.</p><p>Revit uses two selection prompts, then acts immediately if there are no lost dependents. The browser adds ticked sample picks and a visual preview before finishing selection. A failed individual region is left unchanged; a successful batch is one Undo step.</p></details>
  if (stage === 'guard' || stage === 'result') return <TaskDialogShell kind={stage === 'guard' || result?.skipped || !result?.split ? 'warning' : 'success'} theme={ctx.theme} onTheme={ctx.setTheme} title="Split Region with Line" instruction={stage === 'guard' ? guardText : log} details={stage === 'result' ? <span className="wp-task-native-copy">{details}</span> : undefined} onClose={stage === 'guard' ? () => setStage('preview') : ctx.close} commandLinks={stage === 'guard' ? [{ id: 'skip', label: `Skip those ${risky.length} element(s)`, onClick: () => apply(true) }, { id: 'all', label: 'Split all of them', onClick: () => apply(false) }] : undefined} buttons={stage === 'guard' ? [{ label: 'Close', onClick: () => setStage('preview') }] : [{ label: 'OK', primary: true, onClick: ctx.close }]}>
    <div className="wp-task-layout"><div className="wp-task-main">{stage === 'result' ? <Receipt entries={[log, `Created ${result!.split * 2} sample pieces. Removed ${result!.split} originals after both halves were recreated.`, `${result!.dependents} dependent element(s) deleted.`, details]} /> : <p className="wp-task-caption">Native dependent review, choose the safe skip action or explicitly allow the sample deletions.</p>}<Btn onClick={invalidate}>Start again</Btn></div>{visual}</div>{note}
  </TaskDialogShell>
  return <DialogShell theme={ctx.theme} onTheme={ctx.setTheme} title="Split Region with Line" subtitle="Simulated Revit selection, Sample data, fictional" onClose={ctx.close} footer={<div className="wp-task-actions"><Btn onClick={ctx.close}>Cancel</Btn><Btn demo="region-preview" onClick={preview}>Preview split</Btn><Btn demo="region-finish" primary disabled={stage !== 'preview'} onClick={() => risky.length ? setStage('guard') : apply(false)}>Finish selection</Btn></div>}>
    <div className="wp-task-layout"><div className="wp-task-main" data-demo="region-picks"><p className="wp-task-caption">Pick filled regions to split</p><div className="wp-task-picker">{sampleResidence.regions.map(r => <label key={r.id}><input type="checkbox" checked={selected.includes(r.id)} onChange={e => { invalidate(); setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id)) }} /><span>{r.name}<small>{r.kind} region, {r.type}, ID {r.id}{riskEnabled && r.dependents > 0 ? `, ${r.dependents} dependent(s)` : ''}</small></span></label>)}</div>
    <label className="wp-task-filter">Pick the detail line to split with<select className="ad-select" value={line} onChange={e => { invalidate(); setLine(e.target.value) }}><option>Straight detail line</option><option>Unusable detail line</option></select></label>
    <label className="ad-check"><input type="checkbox" checked={riskEnabled} onChange={e => { invalidate(); setRiskEnabled(e.target.checked) }} /><span>Sample scenario: retain attached tag dependents</span></label>
    <p className="wp-task-live">The selected detail line acts as an infinite plane, perpendicular to the region's owning view. Select all three and allow the listed dependents to see 3 regions become 6.</p>{error && <div className="wp-task-error" role="alert">{error}</div>}{stage === 'preview' && <p className="wp-task-selected" role="status">Preview ready, {rows.length} selected, {risky.length} with dependents, nothing applied.</p>}</div>{visual}</div>{note}
  </DialogShell>
}
