import { useMemo, useState } from 'react'
import type { DemoContext, DemoDefinition } from '../../types'
import { sampleResidence } from '../../fixtures/sampleResidence'
import { ConfirmGuard, DialogShell, MiniView, Receipt } from '../../kit'
import { Btn } from '../../ui'
import { InspectorTable, RowDetail, SourceNote, downloadInspectorCsv } from '../links-inspector/InspectorTable'
import type { InspectorColumn, InspectorRecord } from '../links-inspector/InspectorTable'

const columns: InspectorColumn[] = [{ key: 'Family Name', label: 'Family Name' }, { key: 'Category', label: 'Category' }, { key: 'Instances', label: 'Instances' }, { key: 'Severity', label: 'Severity' }, { key: 'Recommendation', label: 'Recommendation' }]
const rank: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 }
type Family = typeof sampleResidence.inPlaceFamilies[number]
function reportRow(family: Family): InspectorRecord {
  const severity = family.instances >= 20 ? 'CRITICAL' : family.instances === 0 || family.instances >= 5 ? 'WARNING' : 'INFO'
  const advice = family.instances === 0 ? 'Unused — purge it (Manage › Purge Unused, or delete here)'
    : family.instances >= 20 ? 'High instance count — convert to a loadable family'
      : family.instances >= 5 ? 'Moderate use — schedule for conversion' : 'Low use — convert when possible'
  return { id: family.id, name: family.name, values: { 'Family Name': family.name, Category: family.category, Instances: family.instances, Severity: severity, Recommendation: advice } }
}

export default function InPlaceInspector(context: DemoContext) {
  const [families, setFamilies] = useState(() => sampleResidence.inPlaceFamilies.map(family => ({ ...family })))
  const [selected, setSelected] = useState<number | null>(null)
  const [detail, setDetail] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [entries, setEntries] = useState<string[]>([])
  const [actionKey, setActionKey] = useState(0)
  const [isolated, setIsolated] = useState<number | null>(null)
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(null)
  const rows = useMemo(() => families.map(reportRow).sort((a, b) => rank[String(a.values.Severity)] - rank[String(b.values.Severity)]
    || Number(b.values.Instances) - Number(a.values.Instances) || a.name.localeCompare(b.name)), [families])
  const row = rows.find(item => item.id === selected)
  const source = families.find(family => family.id === selected)
  const summary = `${families.length} in-place famil${families.length === 1 ? 'y' : 'ies'}  |  ${families.filter(family => family.instances >= 20).length} critical (≥20 uses)  |  ${families.filter(family => family.instances === 0).length} unused  |  ${families.reduce((sum, family) => sum + family.instances, 0)} total instances`
  const ranking = [...rows].sort((a, b) => {
    if (!sort) return 0
    const av = a.values[sort.key], bv = b.values[sort.key]
    const order = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sort.descending ? -order : order
  })
  const log = (text: string) => {
    setEntries(previous => [...previous, text]); setActionKey(key => key + 1)
    context.notify({ kind: 'success', text }); context.done('apply')
  }
  const select = (id: number) => { setSelected(id); setDetail(false); context.done('configure'); context.done('preview') }
  const show = () => {
    if (!source) return
    if (source.instances === 0) { log(`Family '${source.name}' has no instances to show in 3D.`); return }
    setIsolated(source.id); log(`Isolated ${source.instances} instance(s) of '${source.name}' in 'ArchiTECH 3D'.`)
  }
  const selectInstances = () => {
    if (!source) return
    log(source.instances === 0 ? `Family '${source.name}' has no instances to select.` : `Selected ${source.instances} instance(s) of '${source.name}'.`)
  }
  const remove = () => {
    if (!source) return
    const next = families.filter(family => family.id !== source.id)
    setFamilies(next); setConfirm(false); setDetail(false); setSelected(null)
    if (isolated === source.id) setIsolated(null)
    log(`Deleted in-place family: ${source.name}`)
  }
  const exportReport = () => {
    downloadInspectorCsv('Sample-Residence-In-Place-Families.csv', columns, rows)
    log(`Exported ${rows.length} in-place family rows to Sample-Residence-In-Place-Families.csv. Native Export to Excel offers XLSX or CSV; this browser sample downloads CSV.`)
  }
  return <div className="inspector-demo"><DialogShell theme={context.theme} onTheme={context.setTheme} title="In-Place Families Inspector" subtitle="Sample Residence · Sample data, fictional" onClose={context.close}
    footer={<div className="inspector-footer"><p>{entries[entries.length - 1] ?? 'Select a family, then Show in 3D View / Select / Delete Family. Double-click for the full row detail.'}</p>
      <Btn demo="apply" disabled={!source} onClick={show}>Show in 3D View</Btn><Btn disabled={!source} onClick={selectInstances}>Select</Btn>
      <Btn danger disabled={!source} onClick={() => setConfirm(true)}>Delete Family</Btn><Btn onClick={exportReport}>Export to Excel</Btn><Btn onClick={context.close}>Close</Btn>
    </div>}>
    <p className="inspector-summary">{summary}</p>
    <InspectorTable rows={rows} columns={columns} selected={selected} onSelect={select} onDetail={id => { select(id); setDetail(true) }} actionKey={actionKey} onSort={(key, descending) => { setSort({ key, descending }); setActionKey(value => value + 1); context.done('preview') }} />
    <div className="inspector-workbench">
      <section className="inspector-stage" data-demo="preview"><h3>{source ? source.name : 'Instance-count preview'}</h3>
        <p>{source ? `${source.instances} instance(s) · ${source.category}` : 'The scan ranks the most heavily used in-place families first. Choose a column heading to sort.'}</p>
        <p>{row ? String(row.values.Recommendation) : '20+ uses: critical. 5–19 uses and unused families: warning. 1–4 uses: info.'}</p>
        <p>Conversion is a recommendation here. The native inspector offers Show in 3D View, Select and Delete Family.</p>
        {row && <Btn sm onClick={() => setDetail(value => !value)}>Open row detail</Btn>}
      </section>
      <MiniView title={isolated ? 'Isolated sample family instances' : 'Sample in-place family ranking'} kind="3d" variant="inplace" phase={isolated ? 'after' : selected ? 'preview' : 'before'} actionKey={actionKey} items={ranking.filter(item => !isolated || item.id === isolated).map(item => ({ id: item.id, label: item.name, value: Number(item.values.Instances), status: String(item.values.Severity) }))} />
    </div>
    {detail && row && <RowDetail row={row} columns={columns} title="In-Place Families Inspector" onClose={() => setDetail(false)} />}
    {entries.length > 0 && <Receipt entries={entries} download={{ fictional: true, tool: 'in-place-inspector', families: rows, events: entries }} filename="in-place-inspector-receipt.json" />}
    <SourceNote><p>Arch Sentinel/Model Health.panel/In-Place Inspector.pushbutton/Commands/InPlaceInspectorCommand.cs; Core/InPlaceScan.cs; Core/Report.cs; App.cs; Lib/ArchUi/ArchiTechMessage.cs. Shared _shared/ArchiTECH.Tools.UI/Dialogs/Inspector.cs and ThemedDialog.cs define single-row selection, export, row detail and the Delete Family confirmation.</p><p>The source overrides the brief's generic tick/Convert flow: no tick column or Convert button exists in this inspector. The scan preview and receipt are browser demo aids.</p></SourceNote>
  </DialogShell>
    <ConfirmGuard open={confirm && !!source} theme={context.theme} onTheme={context.setTheme} title="Delete Family" instruction="" content={source ? `Permanently delete the in-place family '${source.name}' and all ${source.instances} of its instances?\n\nThis can be undone with Ctrl+Z while the model is open.` : ''} confirmLabel="Delete Family" cancelLabel="Cancel" onConfirm={remove} onCancel={() => setConfirm(false)} />
  </div>
}

export const definition: DemoDefinition = {
  id: 'in-place-inspector', productSlug: 'in-place-inspector', kind: 'crafted', width: 1120,
  ribbon: { tab: 'Arch Sentinel', panel: 'Model Health', button: 'In-Place Inspector' }, title: 'In-Place Families Inspector',
  summary: 'Rank in-place families by use, inspect and isolate them, or confirm a sample deletion.',
  basis: ['Commands/InPlaceInspectorCommand.cs, Core/InPlaceScan.cs, Core/Report.cs, App.cs, Lib/ArchUi/ArchiTechMessage.cs and shared Inspector.cs/ThemedDialog.cs.', 'Native actions are Show in 3D View, Select and Delete Family. Conversion is a recommendation. Sample Residence is fictional.'],
  steps: [
    { id: 'configure', title: 'Choose a family', hint: 'Select a family in the scan; use column headings to sort.' },
    { id: 'preview', title: 'Review instance counts', hint: 'Inspect the category, use count, severity and recommendation.' },
    { id: 'apply', title: 'Try a sample action', hint: 'Show its instances, select them, export, or confirm Delete Family.' },
  ], load: async () => ({ default: InPlaceInspector }),
}
