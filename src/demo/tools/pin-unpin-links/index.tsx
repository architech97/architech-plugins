import { useState } from 'react'
import type { DemoContext, DemoDefinition } from '../../types'
import { sampleResidence } from '../../fixtures/sampleResidence'
import { ConfirmGuard, DialogShell, MiniView, Receipt } from '../../kit'
import { Btn } from '../../ui'
import { InspectorTable, SourceNote } from '../links-inspector/InspectorTable'
import type { InspectorColumn, InspectorRecord } from '../links-inspector/InspectorTable'

const columns: InspectorColumn[] = [{ key: 'Kind', label: 'Kind' }, { key: 'Link Name', label: 'Link Name' }, { key: 'Element ID', label: 'Element ID' }, { key: 'Pin State', label: 'Pin State' }]
const actions = ['Pin all links', 'Unpin all links', 'Pin RVT links', 'Pin CAD links']
type Link = typeof sampleResidence.links[number]
const initial = () => sampleResidence.links.flatMap(link => Array.from({ length: link.instances }, (_, index) => ({ ...link, id: link.id + index })))
const targetsFor = (links: Link[], action: number) => links.filter(link => (action < 2 || link.kind === (action === 2 ? 'Revit' : 'CAD')) && link.pinned !== (action !== 1))

export default function PinUnpinLinks(context: DemoContext) {
  const [links, setLinks] = useState(initial)
  const [selected, setSelected] = useState<number | null>(null)
  const [pending, setPending] = useState<number | null>(null)
  const [preview, setPreview] = useState<number | null>(null)
  const [entries, setEntries] = useState<string[]>([])
  const [actionKey, setActionKey] = useState(0)
  const [after, setAfter] = useState(false)
  const pendingTargets = pending === null ? [] : targetsFor(links, pending)
  const rvt = links.filter(link => link.kind === 'Revit'), cad = links.filter(link => link.kind === 'CAD')
  const summary = `RVT: ${rvt.length} instance${rvt.length === 1 ? '' : 's'} (${rvt.filter(link => link.pinned).length} pinned, ${rvt.filter(link => !link.pinned).length} unpinned)  |  CAD: ${cad.length} instance${cad.length === 1 ? '' : 's'} (${cad.filter(link => link.pinned).length} pinned, ${cad.filter(link => !link.pinned).length} unpinned)`
  const rows: InspectorRecord[] = links.map(link => ({ id: link.id, name: link.name, values: { Kind: link.kind === 'Revit' ? 'RVT' : 'CAD', 'Link Name': link.name, 'Element ID': link.id, 'Pin State': link.pinned ? 'Pinned' : 'Unpinned' } }))
  const apply = () => {
    if (pending === null) return
    const pinned = pending !== 1, targets = targetsFor(links, pending), ids = new Set(targets.map(link => link.id))
    setLinks(previous => previous.map(link => ids.has(link.id) ? { ...link, pinned } : link))
    const message = `${targets.length} link instance(s) set to ${pinned ? 'PINNED' : 'UNPINNED'}.`
    setEntries(previous => [...previous, message]); setPending(null); setAfter(true); setActionKey(key => key + 1)
    context.notify({ kind: 'success', text: message }); context.done('apply')
  }
  const chooseAction = (index: number) => {
    setPreview(index); setPending(index); setAfter(false); context.done('configure'); context.done('preview')
  }
  const refresh = () => {
    setActionKey(key => key + 1)
    setEntries(previous => [...previous, `Refreshed the current sample scan: ${links.length} placements. Pin states are preserved.`])
    context.done('preview')
  }
  return <div className="inspector-demo"><DialogShell theme={context.theme} onTheme={context.setTheme} title="Pin / Unpin Links" subtitle="Sample Residence, Sample data, fictional" onClose={context.close}
    footer={<div className="inspector-footer">{actions.map((label, index) => <Btn key={label} demo={index === 0 ? 'apply' : undefined} primary={index === 0} danger={index === 1} disabled={targetsFor(links, index).length === 0} onClick={() => chooseAction(index)}>{label}</Btn>)}<Btn onClick={refresh}>Refresh</Btn><Btn onClick={context.close}>Close</Btn></div>}>
    <p className="inspector-summary" aria-live="polite">{summary}{entries.length > 0 && <><br />{entries[entries.length - 1]}</>}</p>
    <InspectorTable rows={rows} columns={columns} selected={selected} onSelect={setSelected} actionKey={actionKey} />
    <div className="inspector-workbench">
      <section className="inspector-stage"><h3>Bulk action preview</h3><p>{preview === null ? 'Choose one of the four native actions. Its confirmation shows only the current placements that need to change.' : `${actions[preview]}: ${targetsFor(links, preview).length} placement(s) ${after ? 'still need changing' : 'would change'}.`}</p>
        <div className="inspector-pin-state"><span>● {links.filter(link => link.pinned).length} pinned</span><span>○ {links.filter(link => !link.pinned).length} unpinned</span></div>
        <p>Operations use every placement in the chosen category. Selecting a table row does not limit the bulk action.</p>
      </section>
      <MiniView title="Sample placement pin states" kind="3d" variant="links" phase={after ? 'after' : preview !== null ? 'preview' : 'before'} actionKey={actionKey} items={links.map(link => ({ id: link.id, label: link.name.replace(/^Sample Residence\s*[–-]\s*/, ''), pinned: link.pinned, status: link.pinned ? 'Pinned' : 'Unpinned' }))} />
    </div>
    {entries.length > 0 && <Receipt entries={entries} />}
    <SourceNote><p>Arch Sentinel/Links.panel/Pin Unpin Links.pushbutton/Commands/PinUnpinLinksCommand.cs; Core/LinkPinning.cs; App.cs; Lib/ArchUi/ArchiTechMessage.cs. Shared _shared/ArchiTECH.Tools.UI/Dialogs/ThemedDialog.cs defines the Pin / Unpin confirmation.</p><p>The current native window has a read-only grid and four bulk buttons. It has no tick selection or Convert action. Refresh rescans the current fixture without resetting pin states.</p></SourceNote>
  </DialogShell>
    <ConfirmGuard open={pending !== null} theme={context.theme} onTheme={context.setTheme} title="Pin / Unpin Links" instruction="" content={`Set ${pendingTargets.length} current link instances to ${pending === 1 ? 'UNPINNED' : 'PINNED'}? One Undo restores this action.`} confirmLabel={pending === 1 ? 'Unpin' : 'Pin'} cancelLabel="Cancel" onConfirm={apply} onCancel={() => setPending(null)} />
  </div>
}

export const definition: DemoDefinition = {
  id: 'pin-unpin-links', productSlug: 'pin-unpin-links', kind: 'crafted', width: 1000,
  ribbon: { tab: 'Arch Sentinel', panel: 'Links', button: 'Pin-Unpin Links' }, title: 'Pin / Unpin Links',
  summary: 'Audit each link placement and simulate the four native bulk pin operations.',
  basis: ['Commands/PinUnpinLinksCommand.cs, Core/LinkPinning.cs, App.cs, Lib/ArchUi/ArchiTechMessage.cs and shared ThemedDialog.cs.', 'The native source uses bulk operations, not ticked rows. This browser fixture is fictional.'],
  steps: [
    { id: 'configure', title: 'Choose a bulk operation', hint: 'Try Pin all links, Unpin all links, Pin RVT links or Pin CAD links.' },
    { id: 'preview', title: 'Review current targets', hint: 'The confirmation counts only placements that need changing.' },
    { id: 'apply', title: 'Confirm the operation', hint: 'Pin or Unpin, then inspect the sample receipt and new pin states.' },
  ], load: async () => ({ default: PinUnpinLinks }),
}
