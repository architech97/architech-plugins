import { useMemo, useState } from 'react'
import type { DemoContext, DemoDefinition } from '../../types'
import { sampleResidence } from '../../fixtures/sampleResidence'
import { ConfirmGuard, DialogShell, MiniView, Receipt } from '../../kit'
import { Btn } from '../../ui'
import { InspectorTable, RowDetail, SourceNote, downloadInspectorCsv } from './InspectorTable'
import type { InspectorColumn, InspectorRecord } from './InspectorTable'

const columns: InspectorColumn[] = [
  { key: 'Link Name', label: 'Link Name' }, { key: 'Status', label: 'Status' },
  { key: 'Type', label: 'Type' }, { key: 'Path', label: 'Path / View' },
  { key: 'Instances', label: 'Instances' }, { key: 'Pinned', label: 'Pinned' },
  { key: 'Severity', label: 'Severity' }, { key: 'Recommendation', label: 'Recommendation' },
]
const rank: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 }
const sourceRoot = 'Arch Sentinel/Links.panel/Links Inspector.pushbutton/'
type Link = typeof sampleResidence.links[number]

function reportRow(link: Link): InspectorRecord {
  const cad = link.kind === 'CAD'
  const embedded = cad && link.attachment === 'Embedded CAD'
  const kind = cad ? embedded ? 'Embedded CAD' : 'Linked CAD' : link.attachment
  const severity = cad ? embedded ? 'CRITICAL' : link.view === '(Model-wide)' ? 'WARNING' : 'OK'
    : !link.loaded ? 'CRITICAL' : link.instances !== 1 || !link.pinned ? 'WARNING' : 'OK'
  const advice = cad ? embedded ? 'Embedded CAD — a major sync cost. Convert to a link.'
    : link.view === '(Model-wide)' ? 'Model-wide CAD link — prefer view-specific' : 'View-specific linked CAD — acceptable'
    : !link.loaded ? 'Unloaded — remove via Manage Links, or delete here'
      : link.instances > 1 ? 'Multiple instances — consider consolidating'
        : link.instances === 0 ? 'Link type with no instances — purge unused'
          : !link.pinned ? '1/1 instances unpinned — pin to prevent drift' : 'Healthy'
  return { id: link.id, name: link.name, values: {
    'Link Name': link.name, Status: cad ? link.status : link.loaded ? 'Loaded' : 'Unloaded', Type: kind,
    Path: cad ? link.view : link.path, Instances: link.instances,
    Pinned: cad ? link.pinned ? 'Yes' : 'No' : `${link.pinned ? link.instances : 0}/${link.instances}`,
    Severity: severity, Recommendation: advice,
  } }
}

export default function LinksInspector(context: DemoContext) {
  const [links, setLinks] = useState(() => sampleResidence.links.map(link => ({ ...link })))
  const [selected, setSelected] = useState<number | null>(null)
  const [detail, setDetail] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [actionKey, setActionKey] = useState(0)
  const [isolated, setIsolated] = useState<number | null>(null)
  const [entries, setEntries] = useState<string[]>([])
  const rows = useMemo(() => links.map(reportRow).sort((a, b) => rank[String(a.values.Severity)] - rank[String(b.values.Severity)]
    || String(a.values.Type).localeCompare(String(b.values.Type)) || Number(b.values.Instances) - Number(a.values.Instances)), [links])
  const source = links.find(link => link.id === selected)
  const row = rows.find(item => item.id === selected)
  const rvt = links.filter(link => link.kind === 'Revit')
  const cad = links.filter(link => link.kind === 'CAD')
  const embedded = cad.filter(link => link.attachment === 'Embedded CAD').length
  const summary = `${links.length} link${links.length === 1 ? '' : 's'} total  |  RVT types: ${rvt.length} (${rvt.filter(link => link.loaded).length} loaded, ${rvt.filter(link => !link.loaded).length} unloaded)  |  RVT instances: ${rvt.reduce((sum, link) => sum + link.instances, 0)}  |  CAD: ${cad.length - embedded} linked, ${embedded} embedded`
  const log = (text: string) => {
    setEntries(previous => [...previous, text]); setActionKey(key => key + 1)
    context.notify({ kind: 'success', text }); context.done('apply')
  }
  const select = (id: number) => { setSelected(id); setDetail(false); context.done('configure'); context.done('preview') }
  const isolate = () => {
    if (!source) return
    if (!source.instances) { log('Nothing to isolate — link has no placed instances.'); return }
    if (source.kind === 'Revit' && !source.loaded) {
      log(`'${source.name}' is not loaded (unloaded) — reload it via Manage Links first.`); return
    }
    setIsolated(source.id)
    log(`Isolated ${source.instances} ${source.kind === 'CAD' ? 'CAD import' : 'Revit link instances'} in '${source.kind === 'CAD' && source.view !== '(Model-wide)' ? source.view : '{3D}'}'.`)
  }
  const remove = () => {
    if (!source) return
    setLinks(previous => previous.filter(link => link.id !== source.id)); setConfirm(false); setSelected(null); setDetail(false)
    if (isolated === source.id) setIsolated(null)
    log(`Deleted link: ${source.name}`)
  }
  const exportReport = () => {
    downloadInspectorCsv('Sample-Residence-Links.csv', columns, rows)
    log(`Exported ${rows.length} link rows to Sample-Residence-Links.csv. Native Export to Excel offers XLSX or CSV; this browser sample downloads CSV.`)
  }
  const instances = source ? source.instances === 0 ? '  (no placed instances)' : Array.from({ length: Math.min(15, source.instances) }, (_, i) => `  - ${source.name}${source.instances > 1 ? ` : ${i + 1}` : ''}`).join('\n') : ''
  const prompt = source && row ? `Permanently delete '${source.name}' (${row.values.Type})?\n\n${source.kind === 'CAD' ? 'This removes only this placement (the CAD type and any other placements stay):\n' : 'The link is removed with all its instances:\n'}${instances}\n\nThe action can be undone with Ctrl+Z while the model is open.` : ''

  return <div className="inspector-demo"><DialogShell theme={context.theme} onTheme={context.setTheme} title="Links Inspector" subtitle="Sample Residence, Sample data, fictional" onClose={context.close}
    footer={<div className="inspector-footer"><p>Select a row, then Isolate in 3D / Delete Link. Double-click for the full row detail.</p>
      <Btn demo="apply" disabled={!source} onClick={isolate}>Isolate in 3D</Btn>
      <Btn danger disabled={!source} onClick={() => setConfirm(true)}>Delete Link</Btn>
      <Btn onClick={exportReport}>Export to Excel</Btn><Btn onClick={context.close}>Close</Btn>
    </div>}>
    <p className="inspector-summary">{summary}</p>
    <InspectorTable rows={rows} columns={columns} selected={selected} onSelect={select} onDetail={id => { select(id); setDetail(true) }} actionKey={actionKey} />
    <div className="inspector-workbench">
      <section className="inspector-stage" data-demo="preview"><h3>Sample scan preview</h3>
        <p><strong>{rows.filter(item => item.values.Severity === 'CRITICAL').length} critical</strong>, {rows.filter(item => item.values.Severity === 'WARNING').length} warning, {rows.filter(item => item.values.Severity === 'OK').length} healthy</p>
        <p>{source ? `${source.name}: ${row?.values.Recommendation}` : 'Select one row to inspect its placements, load state and recommendation.'}</p>
        <p>Top-level RVT types and individual CAD placements. Nested Revit links are excluded.</p>
        {row && <Btn sm onClick={() => setDetail(value => !value)}>Open row detail</Btn>}
      </section>
      <MiniView title={isolated ? 'Isolated sample placement' : 'Sample Residence, link disciplines'} kind="3d" variant="links" phase={isolated ? 'after' : selected ? 'preview' : 'before'} actionKey={actionKey} items={links.filter(link => !isolated || link.id === isolated).map(link => ({ id: link.id, label: link.name.replace(/^Sample Residence\s*[–-]\s*/, ''), status: link.loaded ? 'Loaded' : 'Unloaded', pinned: link.pinned }))} />
    </div>
    {detail && row && <RowDetail row={row} columns={columns} title="Links Inspector" onClose={() => setDetail(false)} />}
    {entries.length > 0 && <Receipt entries={entries} download={{ fictional: true, tool: 'links-inspector', rows, events: entries }} filename="links-inspector-receipt.json" />}
    <SourceNote><p>{sourceRoot}Commands/LinksInspectorCommand.cs; Core/LinkScan.cs; Core/Report.cs; App.cs; Lib/ArchUi/ArchiTechMessage.cs.</p><p>Shared _shared/ArchiTECH.Tools.UI/Dialogs/Inspector.cs and ThemedDialog.cs define single-row selection, sorting, row detail, Export to Excel and confirmation. There is no Refresh or tick column in the installed inspector. The scan preview and receipt are browser demo aids.</p></SourceNote>
  </DialogShell>
    <ConfirmGuard open={confirm && !!source} theme={context.theme} onTheme={context.setTheme} title="Links Inspector" instruction="" content={prompt} confirmLabel="Yes" cancelLabel="No" onConfirm={remove} onCancel={() => setConfirm(false)} />
  </div>
}

export const definition: DemoDefinition = {
  id: 'links-inspector', productSlug: 'links-inspector', kind: 'crafted', width: 1120,
  ribbon: { tab: 'Arch Sentinel', panel: 'Links', button: 'Links Inspector' }, title: 'Links Inspector',
  summary: 'Audit link health, inspect placements, isolate or confirm a simulated deletion.',
  basis: ['Commands/LinksInspectorCommand.cs, Core/LinkScan.cs, Core/Report.cs, App.cs and Lib/ArchUi/ArchiTechMessage.cs.', 'The shared Inspector.cs supplies the native columns, single-row actions, row detail and export controls. Sample Residence is fictional.'],
  steps: [
    { id: 'configure', title: 'Choose a link', hint: 'Select one row in the link scan.' },
    { id: 'preview', title: 'Inspect its state', hint: 'Read its recommendation and preview its placements.' },
    { id: 'apply', title: 'Try a sample action', hint: 'Isolate in 3D, export the scan, or confirm Delete Link.' },
  ], load: async () => ({ default: LinksInspector }),
}
