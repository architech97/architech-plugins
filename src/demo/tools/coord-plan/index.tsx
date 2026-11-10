import { useState } from 'react'
import type { DemoContext, DemoDefinition } from '../../types'
import { DialogShell, TaskDialogShell, MiniView, Receipt, BeforeAfter } from '../../kit'
import { Btn } from '../../ui'
import { sampleResidence } from '../../fixtures/sampleResidence'
import '../spot-elevation-line/task-tools.css'

const SOURCE = 'Arch Sentinel/Coordination.panel/Coord Plan.pushbutton/'
function CoordinationPlanView({ clean, actionKey = 0 }: { clean: boolean; actionKey?: number }) {
  return <MiniView variant="coord" phase={clean ? 'after' : 'before'} actionKey={actionKey} title={clean ? 'Clean plan: consultant overlays shown, CAD and annotations hidden' : 'Before: CAD imports and annotation clutter'}>
    <path d="M 75 30 H 520 V 215 H 75 Z M 75 125 H 520 M 285 30 V 215 M 410 125 V 215" fill="var(--d-surface)" stroke="var(--d-muted)" strokeWidth="3" />
    <g data-motion><path d="M 85 40 H 510 V 205 H 85 Z M 85 120 H 280 V 40" fill="none" stroke="var(--d-accent)" strokeWidth="3" /><text x="95" y="62" fontSize="11" fill="var(--d-accent)">Architecture</text></g>
    <g data-motion><path d="M 125 20 V 230 M 385 20 V 230 M 65 80 H 535 M 65 175 H 535" fill="none" stroke="var(--d-success)" strokeWidth="2" strokeDasharray="8 5" /><text x="430" y="65" fontSize="11" fill="var(--d-success)">Structure</text></g>
    <g data-motion><path d="M 110 150 H 350 V 95 H 470 M 350 150 V 195 H 450" fill="none" stroke="var(--d-warning)" strokeWidth="4" /><text x="420" y="193" fontSize="11" fill="var(--d-warning)">MEP</text></g>
    {!clean && <g opacity=".7"><path d="M 60 200 L 530 40 M 55 208 L 525 48" stroke="var(--d-error)" strokeWidth="2" strokeDasharray="4 3" /><text x="170" y="102" fontSize="11">ROOM TAG / NOTE / DIMENSION</text><text x="165" y="187" fontSize="11">CAD survey overlay</text><path d="M 70 242 H 520 M 70 233 V 249 M 520 233 V 249" stroke="currentColor" /></g>}
    {clean && <><circle cx="75" cy="215" r="6" fill="var(--d-accent)" /><text x="88" y="240" fontSize="10">Project Base Point + Survey Point shown</text></>}
  </MiniView>
}
export const definition: DemoDefinition = {
  id: 'coord-plan', productSlug: 'coord-plan', kind: 'crafted', width: 1060,
  ribbon: { tab: 'Arch Sentinel', panel: 'Coordination', button: 'Coord Plan' },
  title: 'Coord Plan', summary: 'Rebuild or keep the existing Coordination Plan, with a visual preview of the real visibility profile and its sheet-viewport warning.',
  basis: ['Commands/CoordPlanCommand.cs', 'Core/CoordPlanBuilder.cs', 'Lib/ArchUi/ArchiTechMessage.cs', 'App.cs'].map(p => SOURCE + p),
  steps: [
    { id: 'configure', title: 'Inspect the existing plan', hint: 'The sample already contains Coordination Plan. Try the placed-on-sheet warning.', target: 'coord-options' },
    { id: 'preview', title: 'Review the visibility profile', hint: 'Compare the clean plan with the original: links shown, CAD and annotations hidden.', target: 'coord-preview' },
    { id: 'apply', title: 'Rebuild or keep the plan', hint: 'Use the exact native command link, then inspect the simulated receipt.', target: 'coord-apply' },
  ], load: async () => ({ default: CoordPlan }),
}

export default function CoordPlan(ctx: DemoContext) {
  const [existing, setExisting] = useState(true)
  const [placed, setPlaced] = useState(false)
  const [result, setResult] = useState<'created'|'rebuilt'|'kept'>()
  const [previewed, setPreviewed] = useState(false)
  const [action, setAction] = useState(0)
  const seed = [...sampleResidence.levels].sort((a, b) => a.elevation - b.elevation)[0]
  const links = sampleResidence.links.filter(l => l.kind === 'Revit' && l.loaded)
  const cadCount = sampleResidence.cadImports.length
  const planName = sampleResidence.existingCoordPlan
  const nativePrompt = `An existing Coordination Plan was found.\n\nRebuild with the latest visibility settings, or keep what is there?${placed ? '\n\nWarning: 1 of them is placed on a sheet — deleting removes the viewport from that sheet.' : ''}`
  const nativeResult = `Coordination Plan ready.\n\nHidden:\n  • ${cadCount} CAD import category(s)\n  • 0 element-level CAD import(s) (fallback)\n  • 38 of 38 annotation / tag / colour-fill categories\n\nShown:\n  • Project Base Point + Survey Point\n  • Grids + Levels + Scope Boxes + Section/Elevation markers\n  • Site, Property Lines, Topography\n  • All host model geometry + linked Revit models${result === 'rebuilt' ? '\n\nReplaced 1 of 1 existing Coordination Plan(s).' : ''}`
  const apply = (keep = false) => {
    const outcome = keep ? 'kept' : existing ? 'rebuilt' : 'created'
    setResult(outcome); setAction(n => n + 1)
    ctx.done('configure'); ctx.done('preview'); ctx.done('apply')
    ctx.notify({ kind: 'success', text: keep ? 'Opened the existing fictional Coordination Plan. Its contents and visibility settings were preserved.' : `Simulated: ${existing ? 'rebuilt' : 'created'} Coordination Plan on ${seed.name}; ${links.length} loaded Revit links shown and ${cadCount} CAD categories hidden.` })
  }
  const invalidate = () => { setResult(undefined); setPreviewed(false); ctx.rewind('configure') }
  const visual = <div className="wp-task-visual"><h3>Coordination Plan · {seed.name}</h3><p>Sample data, fictional · Architecture, Structure and MEP overlays. This view uses the lowest-elevation level automatically.</p><BeforeAfter before={<CoordinationPlanView clean={false} />} after={<CoordinationPlanView clean={result !== 'kept'} actionKey={action} />} /><p>1:100 · Coarse · Hidden line · Coordination discipline · Unlimited view range · Crop off · No template.</p></div>
  const options = <div className="wp-task-main" data-demo="coord-options"><p className="wp-task-choice-heading">Browser sample options</p><label className="ad-check"><input type="checkbox" checked={existing} disabled={Boolean(result)} onChange={e => { invalidate(); setExisting(e.target.checked); ctx.done('configure') }} /><span>Existing Coordination Plan in the sample</span></label><label className="ad-check"><input type="checkbox" checked={placed} disabled={!existing || Boolean(result)} onChange={e => { invalidate(); setPlaced(e.target.checked); ctx.done('configure') }} /><span>Existing view is placed on A-101</span></label><Btn demo="coord-preview" disabled={Boolean(result)} onClick={() => { setPreviewed(true); ctx.done('configure'); ctx.done('preview') }}>Preview visibility</Btn>{previewed && !result && <p className="wp-task-selected" role="status">Preview ready. Revit links are shown; CAD and 38 annotation, tag and colour-fill categories are hidden.</p>}</div>
  const notes = <details className="wp-task-meta"><summary>Based on · source files and native behavior</summary><p>{SOURCE}Commands/CoordPlanCommand.cs; Core/CoordPlanBuilder.cs; App.cs; Lib/ArchUi/ArchiTechMessage.cs.</p><p>The native existing-plan command links are shown verbatim. With no existing plan, launching the real command creates immediately; the browser adds its explicit simulation launch and this preview. Keep existing opens it without rebuilding. Rebuild can delete sheet viewports.</p></details>
  if (result === 'kept') return <DialogShell theme={ctx.theme} onTheme={ctx.setTheme} title="Coord Plan" subtitle="Existing view opened · Sample data, fictional" onClose={ctx.close} footer={<Btn onClick={ctx.close}>Close</Btn>}><div className="wp-task-layout"><div className="wp-task-main"><Receipt entries={[`Kept and opened '${planName}'.`, 'No view was created or deleted. Existing visibility settings and sheet placement were preserved.']} /><p className="wp-task-caption">The native keep action opens the existing plan without showing a result message.</p><Btn onClick={invalidate}>Start again</Btn></div>{visual}</div>{notes}</DialogShell>
  if (result) return <TaskDialogShell kind="success" theme={ctx.theme} onTheme={ctx.setTheme} title="Coord Plan" instruction={nativeResult} onClose={ctx.close} buttons={[{ label: 'OK', primary: true, onClick: ctx.close }]}><div className="wp-task-layout"><div className="wp-task-main"><Receipt entries={[`Fictional Coordination Plan ${result} on ${seed.name}.`, nativeResult, placed && result === 'rebuilt' ? 'Removed the old A-101 viewport when the old plan was deleted; the fresh plan is unplaced.' : 'No sheet viewport was removed.', 'The new plan type is created only when needed and belongs to the same transaction as its plan.']} /><Btn onClick={invalidate}>Start again</Btn></div>{visual}</div>{notes}</TaskDialogShell>
  if (!existing) return <DialogShell theme={ctx.theme} onTheme={ctx.setTheme} title="Coord Plan" subtitle="Browser launch options · Sample data, fictional" onClose={ctx.close} footer={<div className="wp-task-actions"><Btn onClick={ctx.close}>Cancel</Btn><Btn primary demo="coord-apply" onClick={() => apply()}>Launch sample command</Btn></div>}><div className="wp-task-layout">{options}{visual}</div>{notes}</DialogShell>
  return <TaskDialogShell kind={placed ? 'warning' : 'question'} theme={ctx.theme} onTheme={ctx.setTheme} title="Coord Plan" instruction={nativePrompt} details={<span className="wp-task-native-copy">Delete old and create new deletes these views, then builds a fresh one:{'\n'}  • {planName}{placed ? '  (on a sheet)' : ''}</span>} onClose={ctx.close} commandLinks={[{ id: 'rebuild', label: 'Delete old and create new', onClick: () => apply() }, { id: 'keep', label: 'Keep existing and open it', onClick: () => apply(true) }]} buttons={[{ label: 'Close', onClick: ctx.close }]}><div className="wp-task-layout">{options}{visual}</div>{notes}</TaskDialogShell>
}
