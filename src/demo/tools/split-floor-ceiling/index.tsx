// Reconciliation copy of WP-C1 taskdialog_demos agent's authored draft.
// This file was displaced in the shared worktree by a concurrent writer.
import { useState } from 'react'
import type { DemoContext, DemoDefinition } from '../../types'
import { DialogShell, TaskDialogShell, MiniView, Receipt, BeforeAfter } from '../../kit'
import { Btn } from '../../ui'
import { sampleResidence } from '../../fixtures/sampleResidence'
import '../spot-elevation-line/task-tools.css'

const SOURCE = 'Arch Forge/Finishes.panel/Split Floor Ceiling.pushbutton/'
export const definition: DemoDefinition = {
  id: 'split-floor-ceiling', productSlug: 'split-floor-ceiling', kind: 'crafted', width: 1060,
  ribbon: { tab: 'Arch Forge', panel: 'Finishes', button: 'Split Floor Ceiling' },
  title: 'Split Floor / Ceiling', summary: 'Review disjoint floor and ceiling sketch regions, inspect deletion IDs, and create one fictional element per outer region with its openings.',
  basis: ['Commands/SplitCommands.cs', 'Core/FloorCeilingSplitter.cs', 'Core/SplitGuards.cs', 'Lib/ArchUi/ArchiTechMessage.cs', 'App.cs'].map(p => SOURCE + p),
  steps: [
    { id: 'configure', title: 'Pick floors and ceilings', hint: 'Select two floors and a ceiling. Each sample sketch contains separate outer regions.', target: 'floor-picks' },
    { id: 'preview', title: 'Review separate regions', hint: 'Preview the pieces and the dependent IDs by source.', target: 'floor-preview' },
    { id: 'apply', title: 'Review the deletion guard', hint: 'Skip hosts with dependents or allow the listed IDs, then read the native result.', target: 'floor-finish' },
  ], load: async () => ({ default: SplitFloorCeiling }),
}

export default function SplitFloorCeiling(ctx: DemoContext) {
  const [selected, setSelected] = useState<number[]>(sampleResidence.floorCeilings.map(r => r.id))
  const [riskEnabled, setRiskEnabled] = useState(true)
  const [refusal, setRefusal] = useState('None')
  const [stage, setStage] = useState<'pick'|'preview'|'guard'|'result'>('pick')
  const [result, setResult] = useState<{ split: number; skipped: number; pieces: number; deleted: number }>()
  const [action, setAction] = useState(0)
  const [error, setError] = useState('')
  const rows = sampleResidence.floorCeilings.filter(r => selected.includes(r.id))
  const safeRows = refusal === 'None' ? rows : rows.slice(1)
  const risky = riskEnabled ? safeRows.filter(r => r.dependents > 0) : []
  const dependentCount = risky.reduce((n, r) => n + r.dependents, 0)
  const idsFor = (r: typeof rows[number]) => r.dependentIds
  const guardDetails = risky.map(r => `Source ${r.id} may delete IDs ${idsFor(r).join(', ')}`).join('\n')
  const invalidate = () => { setStage('pick'); setResult(undefined); setError(''); ctx.rewind('configure') }
  const apply = (skip: boolean) => {
    const targets = skip ? safeRows.filter(r => !risky.some(x => x.id === r.id)) : safeRows
    const next = { split: targets.length, skipped: rows.length - targets.length, pieces: targets.reduce((n, r) => n + r.loops, 0), deleted: skip ? 0 : dependentCount }
    setResult(next); setStage('result'); setAction(a => a + 1); ctx.done('apply')
    ctx.notify({ kind: next.skipped ? 'warning' : 'success', text: `Simulated: split ${next.split} floor/ceiling elements into ${next.pieces} pieces; ${next.skipped} skipped.` })
  }
  const log = result ? `${result.split === 0 ? 'No floors or ceilings were split.' : `Split ${result.split} of ${rows.length} selected floor/ceiling element(s) into separate pieces.`}\n\nSelected: ${rows.length}\nSplit: ${result.split}\nSkipped: ${result.skipped}\nFailed: 0` : ''
  const refusalText = refusal === 'Grouped' ? 'it is inside a group — edit the group to split it' : refusal === 'Borrowed' ? 'it is borrowed by another user' : 'it is sloped or shape-edited; the pieces would come back flat'
  const resultDetails = result ? rows.map((r, i) => i === 0 && refusal !== 'None' ? `Element ${r.id}: skipped — ${refusalText}` : result.skipped && risky.some(x => x.id === r.id) && result.deleted === 0 ? `Element ${r.id} skipped at dependent review.` : `Element ${r.id}: ${r.loops} sketch loop(s), ${r.loops} region(s)\n  split into ${r.loops} new element(s)`).join('\n') : ''
  const visual = <div className="wp-task-visual"><h3>One host → separate sketch islands</h3><p>Sample data, fictional · two floors and one ceiling. Inner openings stay with their enclosing outer region; they are never counted as extra pieces.</p><BeforeAfter before={<MiniView variant="floor" phase="before" title={`${rows.length} original hosts`} items={rows.map(r => ({ id: r.id, label: r.name, value: r.loops }))} />} after={<MiniView variant="floor" phase={result ? 'after' : 'preview'} actionKey={action} title={`${result?.pieces ?? safeRows.reduce((n, r) => n + r.loops, 0)} separate pieces`} items={safeRows.map(r => ({ id: r.id, label: r.name, value: r.loops }))} />} /><div className="wp-task-count"><span><strong>{rows.length}</strong> hosts</span><span><strong>{result?.pieces ?? safeRows.reduce((n, r) => n + r.loops, 0)}</strong> pieces</span></div></div>
  const note = <details className="wp-task-meta"><summary>Based on · source files and safeguards</summary><p>{SOURCE}Commands/SplitCommands.cs; Core/FloorCeilingSplitter.cs; Core/SplitGuards.cs; App.cs; Lib/ArchUi/ArchiTechMessage.cs.</p><p>Native Revit picks hosts then reviews exact dependency IDs. The browser adds this visual preview and optional refusal scenario. Dependency IDs here are fictional. Writable parameters, phases and pin state are retained; geometric quantities are recalculated. Sloped, grouped or borrowed hosts are skipped.</p></details>
  if (stage === 'guard' || stage === 'result') return <TaskDialogShell kind={stage === 'guard' || !result?.split ? 'warning' : 'success'} theme={ctx.theme} onTheme={ctx.setTheme} title="Split Floor / Ceiling" instruction={stage === 'guard' ? `Splitting ${risky.length} of the selected elements can delete up to ${dependentCount} dependent elements. See details for the IDs by source.\n\nHosted families, tags, dimensions, spot elevations and edges attached to an original are not moved onto the new pieces.` : log} details={<span className="wp-task-native-copy">{stage === 'guard' ? guardDetails : resultDetails}</span>} onClose={stage === 'guard' ? () => setStage('preview') : ctx.close} commandLinks={stage === 'guard' ? [{ id: 'skip', label: `Skip ${risky.length} with dependents`, onClick: () => apply(true) }, { id: 'allow', label: 'Allow listed deletions', onClick: () => apply(false) }] : undefined} buttons={stage === 'guard' ? [{ label: 'Close', onClick: () => setStage('preview') }] : [{ label: 'OK', primary: true, onClick: ctx.close }]}>
    <div className="wp-task-layout"><div className="wp-task-main">{stage === 'result' ? <Receipt entries={[log, `Created ${result!.pieces} fictional pieces; ${result!.deleted} dependent IDs deleted.`, resultDetails]} /> : <p className="wp-task-live">Expand the details above to inspect the exact sample deletion IDs before allowing them.</p>}<Btn onClick={invalidate}>Start again</Btn></div>{visual}</div>{note}
  </TaskDialogShell>
  return <DialogShell theme={ctx.theme} onTheme={ctx.setTheme} title="Split Floor / Ceiling" subtitle="Simulated Revit selection · Sample data, fictional" onClose={ctx.close} footer={<div className="wp-task-actions"><Btn onClick={ctx.close}>Cancel</Btn><Btn demo="floor-preview" onClick={() => { ctx.done('configure'); if (!rows.length) { setError('No floors or ceilings were selected.'); return } setError(''); setStage('preview'); ctx.done('preview') }}>Preview split</Btn><Btn demo="floor-finish" primary disabled={stage !== 'preview'} onClick={() => risky.length ? setStage('guard') : apply(false)}>Finish selection</Btn></div>}>
    <div className="wp-task-layout"><div className="wp-task-main" data-demo="floor-picks"><p className="wp-task-caption">Select floors or ceilings to split</p><div className="wp-task-picker">{sampleResidence.floorCeilings.map(r => <label key={r.id}><input type="checkbox" checked={selected.includes(r.id)} onChange={e => { invalidate(); setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id)) }} /><span>{r.name}<small>{r.kind} · {r.type} · {r.level} · {r.loops} outer regions · ID {r.id}</small></span></label>)}</div><label className="ad-check"><input type="checkbox" checked={riskEnabled} onChange={e => { invalidate(); setRiskEnabled(e.target.checked) }} /><span>Sample scenario: include dependent tags / hosted elements</span></label><label className="wp-task-filter">Sample guard on first selected host<select className="ad-select" value={refusal} onChange={e => { invalidate(); setRefusal(e.target.value) }}><option>None</option><option>Grouped</option><option>Borrowed</option><option>Sloped or shape-edited</option></select></label>{refusal !== 'None' && rows.length > 0 && <p className="wp-task-live">Element {rows[0].id}: skipped — {refusalText}</p>}{error && <p className="wp-task-error" role="alert">{error}</p>}{stage === 'preview' && <p role="status" className="wp-task-selected">Preview ready · {safeRows.length} eligible · {risky.length} with dependents · nothing applied.</p>}</div>{visual}</div>{note}
  </DialogShell>
}
