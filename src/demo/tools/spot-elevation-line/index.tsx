import { useState } from 'react'
import type { DemoContext, DemoDefinition } from '../../types'
import { DialogShell, TaskDialogShell, MiniView, Receipt, BeforeAfter } from '../../kit'
import { Btn } from '../../ui'
import { sampleResidence } from '../../fixtures/sampleResidence'
import './task-tools.css'

const SOURCE = 'Arch Folio/Annotation.panel/Spot Elev Override.pushbutton/'
const scopes = ['Active view', 'Selected sheets / views (their placed views)', 'Whole project']

export const definition: DemoDefinition = {
  id: 'spot-elevation-line', productSlug: 'spot-elevation-line', kind: 'crafted', width: 1000,
  ribbon: { tab: 'Arch Folio', panel: 'Annotation', button: 'Spot Elev Override' },
  title: 'Spot Elev Override', summary: 'Pick a line pattern and scope, review the actual override count, then change the fictional spot leaders.',
  basis: [`${SOURCE}Commands/SpotElevationCommand.cs`, `${SOURCE}App.cs`, `${SOURCE}Lib/ArchUi/ArchiTechMessage.cs`, '_shared/ArchiTECH.Tools.UI/Dialogs/SelectFromList.cs'],
  steps: [
    { id: 'configure', title: 'Choose a line pattern', hint: 'Solid is the native default. Try Dash, Hidden, or clear just the pattern override.', target: 'spot-pattern' },
    { id: 'preview', title: 'Choose the scope', hint: 'Whole project includes 23 spot elevations in four fictional views.', target: 'spot-scope' },
    { id: 'apply', title: 'Confirm the override', hint: 'Read the real guard text, choose Yes, and inspect the simulated receipt.', target: 'spot-confirm' },
  ], load: async () => ({ default: SpotElevation }),
}

export default function SpotElevation(ctx: DemoContext) {
  const [stage, setStage] = useState<'pattern'|'scope'|'confirm'|'result'>('pattern')
  const [pattern, setPattern] = useState('Solid')
  const [scope, setScope] = useState(scopes[0])
  const [search, setSearch] = useState('')
  const [action, setAction] = useState(0)
  const patterns = ['Solid', '(Clear line pattern override)', ...sampleResidence.linePatterns.map(p => p.name).filter(n => n !== 'Solid')]
  const spotViews = sampleResidence.views.filter(v => v.spotCount > 0)
  const views = scope === scopes[0] ? spotViews.slice(0, 1) : scope === scopes[1] ? spotViews.slice(0, 2) : spotViews
  const count = views.reduce((n, v) => n + v.spotCount, 0)
  const clear = pattern.startsWith('(')
  const instruction = clear ? 'Clear the line pattern override?' : `Apply line pattern '${pattern}'?`
  const content = `${count} spot elevation override(s) across ${views.length} view(s) will be set.\n\nThis is one undoable step, and can also be cleared later with Revit's Remove Overrides.`
  const result = `Line pattern ${clear ? 'override cleared' : `'${pattern}' applied`}.\n\nOverrides set: ${count}\nViews written: ${views.length}`
  const apply = () => {
    setAction(a => a + 1); setStage('result'); ctx.done('apply')
    ctx.notify({ kind: 'success', text: `${clear ? 'Cleared' : `Applied ${pattern} to`} ${count} fictional spot elevation overrides in ${views.length} views.` })
  }
  const visual = <div className="wp-task-visual"><h3>Sample Residence · spot leaders</h3><p>Sample data, fictional · {views.length} view(s) in this scope. Colour and weight stay unchanged.</p><BeforeAfter before={<MiniView variant="spots" phase="before" pattern="Solid" items={views.map(v => ({ id: v.id, label: v.name, value: v.spotCount }))} title="Before: existing spot leaders" />} after={<MiniView variant="spots" phase={stage === 'result' ? 'after' : 'preview'} actionKey={action} pattern={clear ? 'Solid' : pattern} items={views.map(v => ({ id: v.id, label: v.name, value: v.spotCount }))} title={`${stage === 'result' ? 'After' : 'Preview'}: ${clear ? 'no pattern override' : pattern}`} />} /><div className="wp-task-count"><span><strong>{count}</strong> overrides</span><span><strong>{views.length}</strong> views</span></div></div>
  const notes = <details className="wp-task-meta"><summary>Based on · source files and simulation boundary</summary><p>{SOURCE}Commands/SpotElevationCommand.cs; App.cs; Lib/ArchUi/ArchiTechMessage.cs; _shared/ArchiTECH.Tools.UI/Dialogs/SelectFromList.cs.</p><p>The native pickers use Search items, a single selected item, Cancel and OK. The browser adds this visual preview; model contents and results are fictional.</p></details>
  if (stage === 'confirm' || stage === 'result') return <>
    <TaskDialogShell theme={ctx.theme} onTheme={ctx.setTheme} title="Spot Elevation" instruction={stage === 'result' ? result : instruction} content={stage === 'confirm' ? <div className="wp-task-native-copy">{content}</div> : undefined} onClose={stage === 'confirm' ? () => setStage('scope') : ctx.close} buttons={stage === 'confirm' ? [{ label: 'No', onClick: () => setStage('scope') }, { label: 'Yes', primary: true, onClick: apply }] : [{ label: 'OK', primary: true, onClick: ctx.close }]}>
      <div className="wp-task-layout"><div className="wp-task-main">{stage === 'result' ? <Receipt entries={[result, `Scope: ${scope}. Only projection and cut line-pattern overrides changed; colour and weight retained.`]} /> : <p className="wp-task-caption" data-demo="spot-confirm">Read the native confirmation above. No returns to scope; Yes applies only to this browser sample.</p>}<Btn onClick={() => { setStage('pattern'); setSearch(''); ctx.rewind('configure') }}>Start again</Btn></div>{visual}</div>
      {notes}
    </TaskDialogShell>
  </>
  const pickingPattern = stage === 'pattern'
  const options = pickingPattern ? patterns : scopes
  return <DialogShell theme={ctx.theme} onTheme={ctx.setTheme} title={pickingPattern ? 'Select a line pattern' : 'Apply to'} subtitle="Sample data, fictional" onClose={ctx.close} footer={<div className="wp-task-actions"><Btn onClick={ctx.close}>Cancel</Btn><Btn primary disabled={!options.some(o => o.toLowerCase().includes(search.toLowerCase()))} onClick={() => { setSearch(''); setStage(pickingPattern ? 'scope' : 'confirm'); ctx.done(pickingPattern ? 'configure' : 'preview') }}>OK</Btn></div>}>
    <div className="wp-task-layout"><div className="wp-task-main" data-demo={pickingPattern ? 'spot-pattern' : 'spot-scope'}>
      <p className="wp-task-caption">{pickingPattern ? "This pattern is applied to the spot elevations in the views you pick next. 'Clear' removes only a line-pattern override; colour, weight etc. stay." : 'Selected: pick sheets, viewports or views (Project Browser) before running.'}</p>
      <label className="wp-task-filter">Search items<input className="ad-input" value={search} onChange={e => { const value = e.target.value; setSearch(value); const first = options.find(option => option.toLowerCase().includes(value.toLowerCase())); if (first) { if (pickingPattern) setPattern(first); else setScope(first) } }} placeholder="Type to filter" /></label>
      <div className="wp-task-picker">{options.filter(p => p.toLowerCase().includes(search.toLowerCase())).map(p => <label key={p}><input type="radio" name={pickingPattern ? 'spot-pattern' : 'spot-scope'} checked={(pickingPattern ? pattern : scope) === p} onChange={() => pickingPattern ? setPattern(p) : setScope(p)} /><span>{p}</span></label>)}</div>
      {!pickingPattern && <p className="wp-task-live">Simulated selection: A-101 and A-102; their placed views contain 14 spot elevations. Active view: {spotViews[0]?.name}.</p>}
    </div>{visual}</div>{notes}
  </DialogShell>
}
