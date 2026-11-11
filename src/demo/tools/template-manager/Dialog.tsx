import { useState } from 'react'
import type { DemoContext } from '../../types'
import { Btn, Check } from '../../ui'
import { ConfirmGuard, PreviewTable, Receipt, ScopeRadios } from '../../kit'
import { FolioChoice, FolioFrame, FolioPreview } from '../folioFrame'
import { sampleResidence } from '../../fixtures/sampleResidence'

const sections = [
  { title: 'Templates from model', summary: 'Copy view templates from another model into this one, and copy Revit link settings between links.' },
  { title: 'Filters', summary: 'Copy chosen view filters, with their overrides and visibility, into other views and view templates.' },
  { title: 'V/G and hidden elements', summary: "Copy a view's Visibility/Graphics, filters and hidden elements onto other views." },
  { title: 'Imports off', summary: 'Hide imported CAD in chosen views and view templates, or delete every project-level import.' },
]
const models = ['Sample Residence – Architecture.rvt', 'Sample Residence – Structure.rvt', 'Sample Residence – Interiors.rvt']
interface Template { id: number; name: string; kind: string; lineWeight: number }
const templateData: Record<string, Template[]> = {
  [models[0]]: [{ id: 1, name: 'Interior Plan 1:50', kind: 'Floor Plan', lineWeight: 2 }, { id: 2, name: 'Interior RCP 1:50', kind: 'Ceiling Plan', lineWeight: 2 }],
  [models[1]]: [{ id: 11, name: 'Interior Plan 1:50', kind: 'Floor Plan', lineWeight: 4 }, { id: 12, name: 'Structural Plan 1:50', kind: 'Floor Plan', lineWeight: 5 }, { id: 13, name: 'Coordination 3D', kind: '3D View', lineWeight: 3 }],
  [models[2]]: [{ id: 21, name: 'Interior Plan 1:50', kind: 'Floor Plan', lineWeight: 3 }, { id: 22, name: 'Interior Elevation 1:25', kind: 'Elevation', lineWeight: 2 }],
}
const viewData = [
  { id: 101, name: 'Ground Floor Plan', kind: 'Floor Plan', template: 'Interior Plan 1:50', state: 'Existing items hidden', filters: 'Existing to remain' },
  { id: 102, name: 'First Floor Plan', kind: 'Floor Plan', template: '(None)', state: 'All visible', filters: '' },
  { id: 103, name: 'North Elevation', kind: 'Elevation', template: '(None)', state: 'All visible', filters: '' },
  { id: 104, name: 'Interior Plan 1:50', kind: 'View template', template: '(None)', state: 'CAD visible', filters: 'Existing to remain' },
]
const filterData = [{ id: 201, name: 'Existing to remain', detail: 'Halftone · Existing phase' }, { id: 202, name: 'Fire-rated partitions', detail: 'Red projection lines · Fire Rating > 0' }, { id: 203, name: 'Doors by phase', detail: 'Solid blue lines · New Construction' }]
const links = sampleResidence.links.filter(({ kind, loaded }) => kind === 'Revit' && loaded)
const hideMode = 'Hide imported CAD categories in the views I pick'
const deleteMode = 'Delete every project-level imported CAD file'

export default function TemplateManager(ctx: DemoContext) {
  const [section, setSection] = useState(0)
  const [transferTab, setTransferTab] = useState('Transfer View Templates')
  const [templates, setTemplates] = useState(templateData)
  const [sourceModel, setSourceModel] = useState('(Choose source model)')
  const [destination, setDestination] = useState(models[0])
  const [strategy, setStrategy] = useState('Skip')
  const [templatePicks, setTemplatePicks] = useState<(string | number)[]>([])
  const [linkGraphics, setLinkGraphics] = useState(false)
  const [hostPicks, setHostPicks] = useState<(string | number)[]>([])
  const [sourceLink, setSourceLink] = useState(links[0].name)
  const [linkPicks, setLinkPicks] = useState<(string | number)[]>([])
  const [overwrite, setOverwrite] = useState(true)
  const [skipCustom, setSkipCustom] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [views, setViews] = useState(viewData)
  const [filterSource, setFilterSource] = useState('(Pick a source)')
  const [filterPicks, setFilterPicks] = useState<(string | number)[]>([])
  const [destPicks, setDestPicks] = useState<(string | number)[]>([])
  const [destinationGuard, setDestinationGuard] = useState(false)
  const [eh, setEh] = useState(false)
  const [vg, setVg] = useState(false)
  const [assign, setAssign] = useState(false)
  const [graphicsNext, setGraphicsNext] = useState(false)
  const [graphicsSource, setGraphicsSource] = useState(views[0].name)
  const [graphicsPicks, setGraphicsPicks] = useState<(string | number)[]>([])
  const [importsMode, setImportsMode] = useState(hideMode)
  const [imports, setImports] = useState(sampleResidence.cadImports)
  const [importPicks, setImportPicks] = useState<(string | number)[]>([])
  const [deleteGuard, setDeleteGuard] = useState(false)
  const [importKind, setImportKind] = useState('All')
  const [receipt, setReceipt] = useState<string[]>([])
  const sourceTemplates = templates[sourceModel] ?? []
  const hostTemplates = templates[destination] ?? []
  const targets = links.filter(({ id, name }) => linkPicks.includes(id) && name !== sourceLink)
  const filterTargets = views.filter(({ id }) => destPicks.includes(id))
  const source = views.find(({ name }) => name === graphicsSource) ?? views[0]
  const nativeImports = imports.filter(({ attachment }) => attachment === 'Embedded CAD')
  const currentFilters = filterData.filter(({ id }) => filterPicks.includes(id))

  function finish(entries: string[]) {
    setReceipt(entries)
    ctx.done('configure'); ctx.done('row'); ctx.done('run'); ctx.done('apply'); ctx.done('review')
    ctx.notify({ kind: 'success', text: 'Template Manager · Sample fixture updated.' })
  }
  function transfer() {
    const chosen = sourceTemplates.filter(({ id }) => templatePicks.includes(id))
    if (!chosen.length || sourceModel === destination) return
    const next = [...hostTemplates]
    const log: string[] = []
    for (const entry of chosen) {
      const existing = next.findIndex(({ name }) => name === entry.name)
      if (existing >= 0 && strategy === 'Skip') { log.push(entry.name + ' · Existing destination template kept.'); continue }
      if (existing >= 0 && strategy === 'Overwrite') {
        log.push(entry.name + ' · Line weight ' + next[existing].lineWeight + ' → ' + entry.lineWeight)
        next[existing] = { ...entry, id: next[existing].id }
      } else {
        let name = entry.name, count = 2
        while (next.some((item) => item.name === name)) name = entry.name + ' (' + count++ + ')'
        next.push({ ...entry, id: Math.max(0, ...next.map(({ id }) => id)) + 1, name })
        log.push(name + ' · Copied to destination.')
      }
    }
    setTemplates({ ...templates, [destination]: next })
    finish(log.concat(linkGraphics ? ['Supported Revit 2024 link settings included in the sample transfer.'] : []))
  }
  function copyLinks() {
    const next = { ...overrides }, log: string[] = []
    for (const template of hostTemplates.filter(({ id }) => hostPicks.includes(id))) for (const link of targets) {
      const key = template.name + '|' + link.name
      if (next[key] && (!overwrite || skipCustom)) { log.push(template.name + ' · ' + link.name + ' · Existing override kept.'); continue }
      next[key] = 'Settings from ' + sourceLink
      log.push(template.name + ' · ' + link.name + ' → Settings from ' + sourceLink)
    }
    setOverrides(next); finish(log)
  }
  function copyFilters() {
    const names = currentFilters.map(({ name }) => name).join(', ')
    setViews(views.map((view) => destPicks.includes(view.id) && view.name !== filterSource ? { ...view, filters: names } : view))
    setDestinationGuard(false)
    finish(filterTargets.map(({ name }) => name + ' · Filters copied: ' + names))
  }
  function copyGraphics() {
    setViews(views.map((view) => graphicsPicks.includes(view.id) && view.id !== source.id ? {
      ...view, state: [eh && source.state, vg && 'V/G and filters copied from ' + source.name].filter(Boolean).join(' · '),
      filters: vg ? source.filters : view.filters, template: assign ? source.template : view.template,
    } : view))
    finish(views.filter(({ id }) => graphicsPicks.includes(id) && id !== source.id).map(({ name }) => name + ' · ' +
      [eh && 'Hide state copied', vg && 'V/G copied', assign && 'Template ' + source.template].filter(Boolean).join(' · ')))
  }
  function importsOff() {
    if (importsMode === deleteMode) {
      setImports(imports.filter(({ attachment }) => attachment !== 'Embedded CAD'))
      setDeleteGuard(false)
      finish(nativeImports.map(({ name }) => name + ' · Deleted project-level sample import.'))
    } else {
      setViews(views.map((view) => importPicks.includes(view.id) ? { ...view, state: 'Imported CAD categories hidden' } : view))
      finish(views.filter(({ id }) => importPicks.includes(id)).map(({ name }) => name + ' · Imported CAD categories hidden.'))
    }
  }
  function startOver() {
    if (section === 0) { setSourceModel('(Choose source model)'); setTemplatePicks([]); setHostPicks([]); setLinkPicks([]); setStrategy('Skip'); setLinkGraphics(false) }
    else if (section === 1) { setFilterSource('(Pick a source)'); setFilterPicks([]); setDestPicks([]) }
    else if (section === 2) { setEh(false); setVg(false); setAssign(false); setGraphicsNext(false); setGraphicsPicks([]) }
    else { setImportsMode(hideMode); setImportPicks([]) }
    setReceipt([])
  }
  const footerAction = section === 0 ? transferTab === 'Transfer View Templates' ? 'Transfer Selected Templates' : 'Copy Overrides Between Links' :
    section === 1 ? 'Pick destinations' : section === 2 ? graphicsNext ? 'Copy to selected views' : 'Continue' : importsMode === hideMode ? 'Hide' : 'Delete'
  const enabled = section === 0 ? transferTab === 'Transfer View Templates' ? sourceModel !== destination && templatePicks.length > 0 : hostPicks.length > 0 && targets.length > 0 :
    section === 1 ? filterSource !== '(Pick a source)' && filterPicks.length > 0 :
      section === 2 ? (eh || vg || assign) && (!graphicsNext || graphicsPicks.some((id) => id !== source.id)) :
        importsMode === hideMode ? importPicks.length > 0 : nativeImports.length > 0
  function run() {
    if (!enabled) return
    if (section === 0) { if (transferTab === 'Transfer View Templates') transfer(); else copyLinks() }
    else if (section === 1) setDestinationGuard(true)
    else if (section === 2) { if (graphicsNext) copyGraphics(); else setGraphicsNext(true) }
    else if (importsMode === deleteMode) setDeleteGuard(true)
    else importsOff()
  }
  return <FolioFrame ctx={ctx} title="Template Manager" sections={sections} section={section} onSection={setSection}
    footer={<><span className="ad-status">Working on Sample Residence · Choices stay while you switch.</span><Btn onClick={startOver}>Start over</Btn><Btn onClick={ctx.close}>Close</Btn>
      {!enabled && <span className="ad-hint">{section === 0 ? (transferTab === 'Transfer View Templates' ? 'Browse for a source model, then tick a template.' : 'Tick a host link and a target first.') : section === 1 ? 'Pick a filter source and tick a filter first.' : section === 2 ? 'Tick at least one option first.' : 'Tick an import first.'}</span>}
      <Btn primary demo="template-run" disabled={!enabled} onClick={run}>{footerAction}</Btn></>}>
    {section === 0 && <>
      <div className="ad-row" role="group" aria-label="Template transfer sections">{['Transfer View Templates', 'Link Settings Copier'].map((name) => <Btn key={name} aria-pressed={transferTab === name} onClick={() => setTransferTab(name)}>{name}</Btn>)}</div>
      {transferTab === 'Transfer View Templates' ? <>
        <section className="ad-card folio-runtime-stack"><b className="ad-label">Source model / template</b>
          <div className="ad-row"><span>{sourceModel === '(Choose source model)' ? 'No source model selected' : sourceModel}</span><Btn onClick={() => { setSourceModel(models[1]); setTemplatePicks([]) }}>Browse…</Btn></div>
          <div className="folio-runtime-fields"><FolioChoice label="…or pick an open model" value={sourceModel} options={['(Choose source model)', ...models.filter((name) => name !== destination)]} onChange={(name) => { setSourceModel(name); setTemplatePicks([]) }} />
            <FolioChoice label="Copy to" value={destination} options={models} onChange={(name) => { setDestination(name); if (name === sourceModel) setSourceModel('(Choose source model)'); setTemplatePicks([]) }} />
            <FolioChoice label="If a template already exists" value={strategy} options={['Overwrite', 'Skip', 'Rename']} onChange={setStrategy} /></div>
          <Check label="Transfer custom Revit Link graphics overrides" checked={linkGraphics} onChange={setLinkGraphics} />
          {linkGraphics && <p className="ad-note">Revit 2024 copies supported link visibility and overrides. Custom link display and several per-link settings are limited by the Revit API.</p>}
        </section>
        <PreviewTable rows={sourceTemplates} caption="View templates to transfer" columns={[{ key: 'name', label: 'View template' }, { key: 'kind', label: 'Type' }]}
          getId={(row) => row.id} ticked={templatePicks} onTicked={setTemplatePicks} />
        <FolioPreview title="Destination templates" rows={hostTemplates.map(({ name, lineWeight }) => ({ label: name, value: 'Line weight ' + lineWeight }))} />
      </> : <>
        <b className="ad-label">1 Apply to view templates</b><PreviewTable rows={hostTemplates} caption="Host view templates" columns={[{ key: 'name', label: 'View template' }]} getId={(row) => row.id} ticked={hostPicks} onTicked={setHostPicks} />
        <FolioChoice label="2 Copy from link (source)" options={links.map(({ name }) => name)} value={sourceLink} onChange={setSourceLink} />
        <b className="ad-label">3 Copy to links (targets)</b><PreviewTable rows={links} caption="Target links" columns={[{ key: 'name', label: 'Revit link' }]} getId={(row) => row.id} ticked={linkPicks} onTicked={setLinkPicks} />
        <p className="ad-note">Ticking the source link has no effect. It is never its own target.</p>
        <Check label="Overwrite existing link settings" checked={overwrite} onChange={setOverwrite} /><Check label="Skip target links that already have overrides" checked={skipCustom} onChange={setSkipCustom} />
        {Object.keys(overrides).length > 0 && <FolioPreview title="Current sample link settings" rows={Object.entries(overrides).map(([label, value]) => ({ label: label.replace('|', ' · '), value }))} />}
      </>}
    </>}
    {section === 1 && <>
      <FolioChoice label="Source view or template" options={['(Pick a source)', ...views.map(({ name }) => name)]} value={filterSource} onChange={(name) => { setFilterSource(name); setFilterPicks([]) }} />
      <PreviewTable rows={filterSource === '(Pick a source)' ? [] : filterData} caption="Filters to copy" columns={[{ key: 'name', label: 'Filter' }, { key: 'detail', label: 'Overrides and visibility' }]} getId={(row) => row.id} ticked={filterPicks} onTicked={setFilterPicks} />
      <ConfirmGuard open={destinationGuard} theme={ctx.theme} onTheme={ctx.setTheme} title="Pick destinations" instruction="Choose the sample views or view templates to receive these filters."
        content={<PreviewTable rows={views.filter(({ name }) => name !== filterSource)} caption="Filter destinations" columns={[{ key: 'name', label: 'View or template' }, { key: 'filters', label: 'Existing filters' }]}
          getId={(row) => row.id} ticked={destPicks} onTicked={setDestPicks} />} confirmLabel="Copy filters" onCancel={() => setDestinationGuard(false)} onConfirm={() => { if (destPicks.length) copyFilters() }} />
      <FolioPreview title="Current sample filters" rows={views.map(({ name, filters }) => ({ label: name, value: filters || '(None)' }))} />
    </>}
    {section === 2 && <>
      <section className="ad-card folio-runtime-stack"><p className="ad-note">Copy a view's visibility and hide state onto other views.</p>
        <Check label="Element hide / unhide (EH)" checked={eh} onChange={setEh} />
        <p className="ad-note">Hides in each target what the source hides, linked models included, and unhides what the source shows.</p>
        <Check label="Visibility / Graphics (VG)" checked={vg} onChange={setVg} />
        <p className="ad-note">Category and element overrides, hidden categories, filters and each Revit link's display setting.</p>
        <Check label="Assign the source view template" checked={assign} onChange={setAssign} />
      </section>
      {graphicsNext && <><FolioChoice label="Source view" options={views.map(({ name }) => name)} value={graphicsSource} onChange={setGraphicsSource} />
        <PreviewTable rows={views.filter(({ id }) => id !== source.id)} caption="Visibility destinations" columns={[{ key: 'name', label: 'View or template' }, { key: 'state', label: 'Hidden state' }, { key: 'template', label: 'Template' }]}
          getId={(row) => row.id} ticked={graphicsPicks} onTicked={setGraphicsPicks} /></>}
    </>}
    {section === 3 && <>
      <ScopeRadios label="What to do" options={[hideMode, deleteMode]} value={importsMode} onChange={setImportsMode} />
      <p className="ad-note">Imports nested inside loaded families are left alone in both modes.</p>
      {importsMode === hideMode ? <><div className="ad-row">{['All', 'Templates', 'Views'].map((name) => <Btn key={name} aria-pressed={importKind === name} onClick={() => setImportKind(name)}>{name}</Btn>)}</div>
        <PreviewTable rows={views.filter(({ kind }) => importKind === 'All' || (importKind === 'Templates' ? kind === 'View template' : kind !== 'View template'))} caption="Views and templates for Imports Off"
          columns={[{ key: 'name', label: 'View or template' }, { key: 'kind', label: 'Type' }, { key: 'state', label: 'Current state' }]} getId={(row) => row.id} ticked={importPicks} onTicked={setImportPicks} />
      </> : <FolioPreview title="Project-level imports" rows={nativeImports.map(({ name, id }) => ({ label: name, value: 'ID ' + id + ' · Delete imported CAD instance' }))} />}
      <ConfirmGuard open={deleteGuard} theme={ctx.theme} onTheme={ctx.setTheme} title="Imports Off" instruction={'Delete ' + nativeImports.length + ' project-level sample CAD imports?'}
        content="This removes the imported sample instances. The import list is updated after confirmation." confirmLabel="Delete imports" onConfirm={importsOff} onCancel={() => setDeleteGuard(false)} />
    </>}
    {receipt.length > 0 && <Receipt entries={receipt} title="Activity log (sample)" />}
  </FolioFrame>
}
