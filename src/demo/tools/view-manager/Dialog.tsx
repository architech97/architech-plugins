import { useState } from 'react'
import type { DemoContext } from '../../types'
import { Btn, Check } from '../../ui'
import { ConfirmGuard, PreviewTable, Receipt, ScopeRadios } from '../../kit'
import { FolioChoice, FolioFrame, FolioPreview, FolioText } from '../folioFrame'
import { sampleResidence, TEMPLATES } from '../../fixtures/sampleResidence'

const sections = [
  { title: 'Convert', summary: 'Turn views into drafting views or legends, and floor plans into ceiling plans and back.' },
  { title: 'Duplicate', summary: 'Copy the ticked views, with detailing or as dependents.' },
  { title: 'Apply template', summary: 'Give the ticked views a view template, or take theirs off.' },
  { title: 'Rename', summary: "Find and replace, prefix and suffix the ticked views' names." },
  { title: 'Set parameter', summary: 'Write one value into a view parameter on every ticked view.' },
  { title: 'Hide in views', summary: "Copy a source view's hidden elements, categories and linked models onto the ticked views." },
]
interface ViewRow { id: number; name: string; type: string; level: string; scale: string; template: string; sheet: string; hidden: string; comment: string; parameters?: Record<string, string> }
const names: Record<string, string> = { FloorPlan: 'Floor Plan', CeilingPlan: 'Ceiling Plan', Elevation: 'Elevation', Section: 'Section', ThreeD: '3D View' }
const initial: ViewRow[] = [
  ...sampleResidence.views.map((view) => ({ id: view.id, name: view.name, type: names[view.kind], level: view.level, scale: '1:50',
    template: view.kind === 'FloorPlan' ? 'Interior Plan 1:50' : '<None>', sheet: view.sheet, hidden: '', comment: '' })),
  { id: 17, name: 'Typical partition detail', type: 'Drafting View', level: '', scale: '1:10', template: '<None>', sheet: 'A-701', hidden: '', comment: '' },
  { id: 18, name: 'Ground Floor Ceiling Plan', type: 'Ceiling Plan', level: 'Level 01', scale: '1:50', template: '<None>', sheet: '', hidden: '', comment: '' },
  { id: 19, name: 'Graphic Standards', type: 'Legend', level: '', scale: '1:10', template: '<None>', sheet: '', hidden: '', comment: '' },
]
const targets: Record<string, string[]> = {
  'Floor Plan': ['Drafting view', 'Ceiling plan'], 'Ceiling Plan': ['Drafting view', 'Floor plan'],
  Section: ['Drafting view'], Elevation: ['Drafting view'], 'Drafting View': ['Legend'], Legend: ['Drafting view'],
}
const targetTypes: Record<string, string> = { 'Drafting view': 'Drafting View', 'Ceiling plan': 'Ceiling Plan', 'Floor plan': 'Floor Plan', Legend: 'Legend' }

export default function ViewManager(ctx: DemoContext) {
  const [views, setViews] = useState(initial)
  const [ticked, setTicked] = useState<(string | number)[]>([])
  const [section, setSection] = useState(0)
  const [kind, setKind] = useState('All types')
  const [sheetScope, setSheetScope] = useState('All views')
  const [filterTemplate, setFilterTemplate] = useState('All templates')
  const [target, setTarget] = useState('Drafting view')
  const [suffix, setSuffix] = useState('')
  const [modelGeometry, setModelGeometry] = useState(true)
  const [nativeLines, setNativeLines] = useState(true)
  const [keepGraphics, setKeepGraphics] = useState(true)
  const [legendId, setLegendId] = useState(19)
  const [planMode, setPlanMode] = useState('Make copies')
  const [planTemplate, setPlanTemplate] = useState('<None>')
  const [cutPlane, setCutPlane] = useState('2300 mm')
  const [replaceOnSheet, setReplaceOnSheet] = useState(false)
  const [duplicate, setDuplicate] = useState('Duplicate')
  const [template, setTemplate] = useState('<None>')
  const [find, setFind] = useState('')
  const [replacement, setReplacement] = useState('')
  const [prefix, setPrefix] = useState('')
  const [renameSuffix, setRenameSuffix] = useState('')
  const [parameter, setParameter] = useState('Comments')
  const [value, setValue] = useState('')
  const [sourceId, setSourceId] = useState(initial[0].id)
  const [hidden, setHidden] = useState(true)
  const [graphics, setGraphics] = useState(false)
  const [hideMode, setHideMode] = useState('Hide what the source hides')
  const [receipt, setReceipt] = useState<string[]>([])
  const [guard, setGuard] = useState(false)
  const picked = views.filter(({ id }) => ticked.includes(id))
  const source = views.find(({ id }) => id === sourceId)?.name ?? views[0].name
  const legend = views.find(({ id }) => id === legendId)?.name ?? 'Graphic Standards'
  const shown = views.filter((view) => (kind === 'All types' || kind === view.type) &&
    (filterTemplate === 'All templates' || filterTemplate === view.template) &&
    (sheetScope === 'All views' || (sheetScope === 'On sheets' ? !!view.sheet : !view.sheet)))
  const conversions = picked.length ? (targets[picked[0].type] ?? []).filter((item) => picked.every((row) => targets[row.type]?.includes(item))) : []
  const conversion = conversions.includes(target) ? target : conversions[0] ?? ''
  const plan = /plan$/i.test(conversion)
  const inplace = plan && planMode !== 'Make copies'
  const cutValue = cutPlane.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(mm|cm|m|ft|in)?$/i)
  const cut = cutValue ? Number(cutValue[1]) * ({ mm: 1, cm: 10, m: 1000, ft: 304.8, in: 25.4 }[cutValue[2]?.toLowerCase() ?? 'mm'] ?? 1) : NaN
  const renamed = (view: ViewRow) => prefix + (find ? view.name.replaceAll(find, replacement) : view.name) + renameSuffix
  const problem = !picked.length ? 'Tick the views to change.' : section === 0 && !conversions.length ? 'These views have no conversion in common.' :
    section === 0 && plan && (!Number.isFinite(cut) || cut <= 0 || cut > 10000) ? 'The cut plane must be above the level and at most 10 m above it.' :
    section === 3 && picked.some((view) => !renamed(view).trim()) ? 'A view name cannot be empty.' :
    section === 3 && new Set(picked.map(renamed)).size !== picked.length ? 'The proposed view names clash.' :
    section === 3 && picked.some((view) => views.some((other) => !ticked.includes(other.id) && other.name.toLowerCase() === renamed(view).toLowerCase())) ? 'A proposed name is already in use.' :
    section === 5 && !hidden && !graphics ? 'Choose hidden elements or Visibility/Graphics to copy.' : ''
  const preview = picked.map((view) => ({ label: view.name, value: section === 0 ? conversion + (inplace ? ', Convert in place' : ', New copy') + (replaceOnSheet && view.sheet ? ', Takes viewport on ' + view.sheet : '') +
    (conversion === 'Drafting view' ? ', ' + (modelGeometry ? 'Model + annotation' : 'Annotation only') + ', ' + (nativeLines ? 'Native lines and regions' : 'CAD import') + (keepGraphics ? ', Graphics kept' : '') : '') :
    section === 1 ? duplicate === 'Duplicate as dependent' && view.type === '3D View' ? 'Skipped, dependent duplication unavailable for a 3D view' : duplicate : section === 2 ? view.template + ' → ' + template :
      section === 3 ? renamed(view) === view.name ? 'Unchanged' : view.name + ' → ' + renamed(view) :
        section === 4 ? parameter + ' = ' + (value || '(empty)') :
          view.name === source ? 'Source view, unchanged' : [hidden && hideMode, graphics && (view.template !== '<None>' ? 'V/G controlled by template, kept' : 'Copy category and link settings')].filter(Boolean).join(', ') }))
  const runLabel = section === 0 ? 'Convert ' + picked.length + ' views' : section === 1 ? 'Duplicate ' + picked.length + ' views' :
    section === 2 ? 'Apply template' : section === 3 ? 'Rename ' + picked.length + ' views' : section === 4 ? 'Set parameter' :
      (hideMode.startsWith('Unhide') ? 'Unhide' : hideMode === 'Match the source' ? 'Match' : 'Hide') + ' in ' + picked.length + ' views'

  function apply() {
    if (problem) return
    const used = new Set(views.map(({ name }) => name.toLowerCase()))
    const unique = (base: string) => {
      let name = base, n = 2
      while (used.has(name.toLowerCase())) name = base + ' (' + n++ + ')'
      used.add(name.toLowerCase())
      return name
    }
    if (section === 0 || section === 1) {
      const eligible = section === 1 && duplicate === 'Duplicate as dependent' ? picked.filter(({ type }) => type !== '3D View') : picked
      const next = eligible.map((view, index) => ({ ...view, id: inplace ? view.id : Math.max(...views.map(({ id }) => id)) + index + 1,
        name: inplace ? view.name : unique(view.name + (section === 0 ? suffix : ' - Copy')),
        type: section === 0 ? targetTypes[conversion] : view.type, sheet: inplace || replaceOnSheet ? view.sheet : '',
        template: section === 0 && plan ? planTemplate : view.template }))
      setViews([...views.filter(({ id }) => !inplace || !ticked.includes(id)).map((view) =>
        replaceOnSheet && ticked.includes(view.id) ? { ...view, sheet: '' } : view), ...next])
    } else setViews(views.map((view) => !ticked.includes(view.id) ? view : section === 2 ? { ...view, template } :
      section === 3 ? { ...view, name: renamed(view) } : section === 4 ? { ...view, parameters: { ...view.parameters, [parameter]: value } } :
        view.name === source ? view : { ...view, hidden: [hidden && hideMode + ', ' + source, graphics && view.template === '<None>' && 'V/G copied'].filter(Boolean).join(', ') }))
    setReceipt(preview.map(({ label, value }) => label + ', ' + value))
    setGuard(false)
    ctx.done('configure'); ctx.done('row'); ctx.done('run'); ctx.done('apply'); ctx.done('review')
    ctx.notify({ kind: 'success', text: runLabel + ', sample fixture updated.' })
  }

  return <FolioFrame ctx={ctx} title="View Manager" sections={sections} section={section} onSection={setSection}
    footer={<><span className="ad-status">{problem || 'One Undo reverses the whole run. Sample data.'}</span><Btn onClick={ctx.close}>Close</Btn>
      <Btn primary demo="viewmanager-run" disabled={!!problem} onClick={() => inplace ? setGuard(true) : apply()}>{runLabel}</Btn></>}>
    <div className="folio-runtime-fields"><FolioChoice label="View type" value={kind} onChange={setKind} options={['All types', ...new Set(views.map(({ type }) => type))]} />
      <FolioChoice label="View template" value={filterTemplate} onChange={setFilterTemplate} options={['All templates', ...TEMPLATES]} />
      <FolioChoice label="Sheet scope" value={sheetScope} onChange={setSheetScope} options={['All views', 'On sheets', 'Not on sheets']} /></div>
    <PreviewTable rows={shown} getId={(row) => row.id} ticked={ticked} onTicked={setTicked} searchText={(row) => [row.name, row.type, row.level, row.template, row.sheet].join(' ')} caption="Project views"
      columns={[{ key: 'name', label: 'View' }, { key: 'type', label: 'Type' }, { key: 'level', label: 'Level' }, { key: 'scale', label: 'Scale' }, { key: 'template', label: 'Template' }, { key: 'sheet', label: 'Sheet' },
        ...(section === 4 ? [{ key: 'parameter', label: parameter, render: (view: ViewRow) => view.parameters?.[parameter] || '—' }] : [])]} />
    <section className="ad-card folio-runtime-stack">
      {section === 0 && <>
        <FolioChoice label="Convert to" value={conversion} onChange={setTarget} options={conversions.length ? conversions : ['Tick compatible views']} />
        {conversion === 'Drafting view' && <><Check label="Include model geometry (walls, furniture and other model lines, through a DWG round-trip)" checked={modelGeometry} onChange={setModelGeometry} />
          <Check label="Rebuild as native lines and regions (off keeps the CAD import in the model)" checked={nativeLines} onChange={setNativeLines} />
          <Check label="Keep the view's line graphics (colour, weight and pattern)" checked={keepGraphics} onChange={setKeepGraphics} />
          <FolioText label="Add to the name" value={suffix} onChange={setSuffix} /></>}
        {plan && <><ScopeRadios label="Mode" value={planMode} options={['Make copies', 'Convert in place (deletes the source, keeps its sheet viewport)']} onChange={setPlanMode} />
          <FolioChoice label="View template" options={TEMPLATES} value={planTemplate} onChange={setPlanTemplate} /><FolioText label="Cut plane above the level" value={cutPlane} onChange={setCutPlane} /></>}
        {conversion === 'Legend' && <FolioChoice label="Template legend" options={views.filter(({ type }) => type === 'Legend').map(({ name }) => name)} value={legend} onChange={(name) => {
          const view = views.find((row) => row.name === name)
          if (view) setLegendId(view.id)
        }} />}
        {picked.some(({ sheet }) => sheet) && !inplace && <Check label="Replace the original on its sheet" checked={replaceOnSheet} onChange={setReplaceOnSheet} />}
      </>}
      {section === 1 && <FolioChoice label="How to duplicate" value={duplicate} onChange={setDuplicate} options={['Duplicate', 'Duplicate with detailing', 'Duplicate as dependent']} />}
      {section === 2 && <FolioChoice label="View template to apply" options={TEMPLATES} value={template} onChange={setTemplate} />}
      {section === 3 && <div className="folio-runtime-fields"><FolioText label="Find" value={find} onChange={setFind} /><FolioText label="Replace" value={replacement} onChange={setReplacement} />
        <FolioText label="Prefix" value={prefix} onChange={setPrefix} /><FolioText label="Suffix" value={renameSuffix} onChange={setRenameSuffix} /></div>}
      {section === 4 && <div className="folio-runtime-fields"><FolioChoice label="Parameter to set" options={['Comments', 'Sub-Discipline', 'View Group']} value={parameter} onChange={setParameter} />
        <FolioText label="Value" value={value} onChange={setValue} /></div>}
      {section === 5 && <><FolioChoice label="Source view" options={views.map(({ name }) => name)} value={source} onChange={(name) => {
        const view = views.find((row) => row.name === name)
        if (view) setSourceId(view.id)
      }} />
        <Check label="Hidden elements (EH): the elements and linked models the source view hides" checked={hidden} onChange={setHidden} />
        <Check label="Visibility/Graphics: hidden categories, and each Revit link's display setting" checked={graphics} onChange={setGraphics} />
        <ScopeRadios label="Action" value={hideMode} options={['Hide what the source hides', 'Match the source', 'Unhide what the source hides']} onChange={setHideMode} /></>}
    </section>
    <FolioPreview rows={preview} />
    {receipt.length > 0 && <Receipt entries={receipt} title="Last sample operation" />}
    <ConfirmGuard open={guard} theme={ctx.theme} onTheme={ctx.setTheme} title="View Manager" instruction="Convert the ticked sample plans in place?"
      content="The source views are replaced by the converted plans. Their sample sheet positions are retained." onConfirm={apply} onCancel={() => setGuard(false)} confirmLabel="Convert in place" />
  </FolioFrame>
}
