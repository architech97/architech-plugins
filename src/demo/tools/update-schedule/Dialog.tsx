import { useState } from 'react'
import type { DemoContext } from '../../types'
import { Btn, Check } from '../../ui'
import { ConfirmGuard, PreviewTable, Receipt, ScopeRadios } from '../../kit'
import { FolioChoice, FolioFrame, FolioPreview } from '../folioFrame'
import { sampleResidence } from '../../fixtures/sampleResidence'
import { downloadCsv } from '../../demos/craftedTools'
import { downloadWorkbook } from './workbook'

const sections = [
  { title: 'Export', summary: 'Tick schedules and export them to Excel or CSV.' },
  { title: 'Import', summary: 'Choose the edited file, check what changes, then import.' },
  { title: 'Edit in Grid', summary: 'Load element parameters into a grid, edit, then write.' },
  { title: 'Schedule Preview', summary: "See a schedule's rows as Revit shows them. Read-only." },
]
interface ElementRow { id: number; category: string; label: string; values: Record<string, string> }
interface Schedule { id: number; name: string; kind: string; category: string }
const initial: ElementRow[] = sampleResidence.elements.map((element) => ({ id: element.id, category: element.category,
  label: element.family + ', ' + element.type, values: { ...element.values } }))
const schedules: Schedule[] = [
  { id: 1, name: 'Door Schedule', kind: 'Schedule', category: 'Doors' },
  { id: 2, name: 'Window Schedule', kind: 'Schedule', category: 'Windows' },
  { id: 3, name: 'Furniture Schedule', kind: 'Schedule', category: 'Furniture' },
]
const formats = ['Excel workbook (.xlsx), one worksheet per schedule', 'CSV, one file per schedule']
const editableFields = ['Mark', 'Comments', 'Fire Rating']
const imports = [
  { id: 355210, parameter: 'Comments', exported: 'internal - living', next: 'Internal door - living' },
  { id: 355211, parameter: 'Mark', exported: 'D02 before export', next: 'D-102' },
  { id: 355240, parameter: 'Comments', exported: 'internal - bathroom', next: '' },
]

export default function UpdateSchedule(ctx: DemoContext) {
  const [section, setSection] = useState(0)
  const [rows, setRows] = useState(initial)
  const [scheduleList, setScheduleList] = useState(schedules)
  const [ticked, setTicked] = useState<(string | number)[]>([])
  const [format, setFormat] = useState(formats[0])
  const [openAfter, setOpenAfter] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [clearBlank, setClearBlank] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [syncColumns, setSyncColumns] = useState(false)
  const [copies, setCopies] = useState(false)
  const [overwrite, setOverwrite] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [scope, setScope] = useState('Whole model')
  const [kind, setKind] = useState('Instance')
  const [categories, setCategories] = useState<string[]>([])
  const [parameters, setParameters] = useState<string[]>([])
  const [grid, setGrid] = useState<ElementRow[]>([])
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [exportGrid, setExportGrid] = useState(false)
  const [previewSchedule, setPreviewSchedule] = useState(schedules[0].name)
  const [receipt, setReceipt] = useState<string[]>([])
  const [error, setError] = useState('')
  const gridFields = kind === 'Instance' ? editableFields : ['Type Mark', 'Type Comments', 'Fire Rating']
  const review = loaded ? imports.flatMap((change) => {
    const element = rows.find(({ id }) => id === change.id)
    if (!element) return []
    const current = element.values[change.parameter] ?? ''
    const conflict = current !== change.exported && current !== change.next
    const blank = !change.next && !clearBlank
    return [{ ...change, current, conflict, blank, label: change.id + ', ' + change.parameter,
      status: blank ? 'Blank value, kept' : conflict && !overwrite ? 'Conflict, kept' : current === change.next ? 'Unchanged' : 'Ready' }]
  }) : []
  const changes = review.filter(({ status }) => status === 'Ready')
  const conflicts = review.filter(({ conflict, blank }) => conflict && !blank)
  const selectedSchedules = scheduleList.filter(({ id }) => ticked.includes(id))
  const previewRows = rows.filter(({ category }) => category === scheduleList.find(({ name }) => name === previewSchedule)?.category)
  const gridChanges = Object.entries(edited).filter(([key, value]) => {
    const [id, parameter] = key.split('|')
    return value.trim() && value !== rows.find((row) => row.id === Number(id))?.values[parameter]
  })

  function exportSchedules() {
    if (!selectedSchedules.length) return
    const sheets = selectedSchedules.map((schedule) => {
      const elements = rows.filter(({ category }) => category === schedule.category)
      return { name: schedule.name, rows: [['Element ID', ...editableFields], ...elements.map((row) =>
        [String(row.id), ...editableFields.map((field) => row.values[field] ?? '')])] }
    })
    if (format === formats[0]) downloadWorkbook(sheets)
    else for (const sheet of sheets) downloadCsv(sheet.name + '-sample.csv', sheet.rows[0], sheet.rows.slice(1))
    setReceipt(['Exported ' + sheets.length + ' editable sample schedules.', 'Only writable sample parameters were included. Calculated fields stay in the model.',
      openAfter ? 'Downloaded files are ready to open in Excel.' : 'Sample files downloaded.'])
    ctx.done('configure'); ctx.done('run'); ctx.done('review')
  }
  function importChanges() {
    if (!changes.length) {
      ctx.notify({ kind: 'warning', text: 'Include a reviewed conflict to apply, or cancel this import.' })
      return
    }
    setRows(rows.map((row) => {
      const patches = changes.filter(({ id }) => id === row.id)
      return patches.length ? { ...row, values: { ...row.values, ...Object.fromEntries(patches.map(({ parameter, next }) => [parameter, next])) } } : row
    }))
    if (copies) {
      const base = 'Door Schedule - Imported'
      let name = base, number = 2
      while (scheduleList.some((schedule) => schedule.name === name)) name = base + ' (' + number++ + ')'
      setScheduleList([...scheduleList, { ...schedules[0], id: Math.max(...scheduleList.map(({ id }) => id)) + 1, name }])
    }
    setReceipt(changes.map(({ label, current, next }) => label + ', ' + current + ' → ' + (next || '(blank)')).concat([
      conflicts.length && !overwrite ? conflicts.length + ' conflicts skipped.' : 'Reviewed conflicts included.',
      syncColumns ? 'Verified sample columns retained. Computed fields are protected.' : 'Schedule columns retained.',
    ]))
    setConfirm(false); ctx.done('run'); ctx.done('apply'); ctx.done('review')
    ctx.notify({ kind: 'success', text: 'Imported ' + changes.length + ' sample value changes.' })
  }
  function loadGrid() {
    const scoped = rows.filter(({ id, category }) => categories.includes(category) &&
      (scope === 'Whole model' || scope === 'Active view' ? scope === 'Whole model' || id < 355300 : [355210, 355211].includes(id)))
    setGrid(kind === 'Instance' ? scoped : scoped.filter((row, index) => scoped.findIndex((other) => other.category === row.category && other.label === row.label) === index))
    setEdited({}); setError('')
  }
  function writeGrid() {
    if (!gridChanges.length) return
    setRows(rows.map((row) => ({ ...row, values: { ...row.values, ...Object.fromEntries(gridChanges.flatMap(([key, value]) => {
      const [id, parameter] = key.split('|')
      const source = grid.find((item) => item.id === Number(id))
      const affected = kind === 'Type' ? source?.label === row.label && source.category === row.category : Number(id) === row.id
      return affected ? [[parameter, value]] : []
    })) } })))
    setReceipt(gridChanges.map(([key, value]) => key.replace('|', ', ') + ' → ' + value + (kind === 'Type' ? ', Applied to all sample instances of this type' : '')))
    setGrid(grid.map((row) => ({ ...row, values: { ...row.values, ...Object.fromEntries(gridChanges.flatMap(([key, value]) => {
      const [id, parameter] = key.split('|')
      return Number(id) === row.id ? [[parameter, value]] : []
    })) } })))
    setEdited({}); ctx.done('run'); ctx.done('apply'); ctx.done('review')
  }
  return <FolioFrame ctx={ctx} title="Update Schedule" sections={sections} section={section} onSection={(index) => { setSection(index); setError('') }}
    footer={<><span className="ad-status">{section === 0 ? selectedSchedules.length + ' schedules ticked.' : section === 1 ? changes.length + ' values ready to import.' :
      section === 2 ? gridChanges.length + ' edited cells ready to write.' : 'Schedule Preview is read-only.'}</span><Btn onClick={ctx.close}>Close</Btn></>}>
    {section === 0 && <>
      <b className="ad-label">1 Schedules to export</b>
      <PreviewTable rows={scheduleList} caption="Schedules to export" columns={[{ key: 'name', label: 'Schedule' }, { key: 'kind', label: 'Kind' }]}
        getId={(row) => row.id} ticked={ticked} onTicked={setTicked} />
      <section className="ad-card folio-runtime-stack"><b className="ad-label">2 Options</b>
        <ScopeRadios label="File format" options={formats} value={format} onChange={setFormat} />
        <Check label="Open the file when done" checked={openAfter} onChange={setOpenAfter} />
        <div className="ad-row"><Btn onClick={() => { setExportGrid(true); setSection(2); setReceipt(['Choose categories and parameters, then load and export the sample elements.']) }}>Export elements by category…</Btn>
          <Btn primary demo="schedule-export" disabled={!selectedSchedules.length} onClick={exportSchedules}>Export</Btn></div>
      </section>
    </>}
    {section === 1 && <>
      <section className="ad-card folio-runtime-stack"><b className="ad-label">1 File</b><div className="ad-row"><span>{loaded ? 'AT-01 Editable Schedules - Edited.xlsx, Prepared sample' : 'No file chosen.'}</span>
        <Btn onClick={() => { setLoaded(true); setOverwrite(false); setReceipt([]) }}>Choose Excel...</Btn></div>
        <p className="ad-note">This browser exercise loads a prepared workbook edit for three sample door parameters.</p></section>
      <div className="ad-row"><b className="ad-label">2 Changes to review</b><Btn disabled={!loaded} onClick={() => { setLoaded(true); setOverwrite(false); setReceipt(['Rechecked the prepared sample workbook against the current fixture.']) }}>Check again</Btn></div>
      <FolioPreview title="Workbook changes" rows={review.map(({ label, current, next, status }) => ({ label, value: current + ' → ' + (next || '(blank)') + ', ' + status }))} />
      <section className="ad-card folio-runtime-stack"><Check label="Also clear text values deleted in Excel" checked={clearBlank} onChange={setClearBlank} />
        <Btn sm onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>Advanced options...</Btn>
        {advanced && <><Check label="Also update schedule columns from Excel" checked={syncColumns} onChange={setSyncColumns} /><Check label="Create an additional schedule copy" checked={copies} onChange={setCopies} /></>}
        <Btn primary demo="schedule-import" disabled={!loaded || !review.some(({ status, conflict }) => status === 'Ready' || conflict)} onClick={() => setConfirm(true)}>Import</Btn>
      </section>
      <ConfirmGuard open={confirm} theme={ctx.theme} onTheme={ctx.setTheme} title="Review Schedule Import" instruction={changes.length + ' values will change. Nothing has been written yet.'}
        content={<div className="folio-runtime-stack"><FolioPreview rows={review.map(({ label, current, next, status }) => ({ label, value: current + ' → ' + (next || '(blank)') + ', ' + status }))} />
          {conflicts.length > 0 && <Check label={'Also overwrite the ' + conflicts.length + ' conflicts with the file value'} checked={overwrite} onChange={setOverwrite} />}</div>}
        confirmLabel={'Apply ' + changes.length + ' changes'} onConfirm={importChanges} onCancel={() => setConfirm(false)} />
    </>}
    {section === 2 && <>
      <ScopeRadios label="1 Scope" options={['Whole model', 'Active view', 'Current selection']} value={scope} onChange={(value) => { setScope(value); setGrid([]); setEdited({}) }} />
      <ScopeRadios label="Parameter kind" options={['Instance', 'Type']} value={kind} onChange={(value) => { setKind(value); setGrid([]); setEdited({}); setParameters([]) }} />
      <div className="folio-runtime-grid"><section className="ad-card folio-runtime-stack"><b className="ad-label">2 Categories</b>
        {[...new Set(rows.map(({ category }) => category))].map((category) => <Check key={category} label={category} checked={categories.includes(category)} onChange={(yes) => {
          setCategories(yes ? [...categories, category] : categories.filter((item) => item !== category)); setGrid([]); setEdited({})
        }} />)}</section>
        <section className="ad-card folio-runtime-stack"><b className="ad-label">3 Parameters</b>{gridFields.map((field) => <Check key={field} label={field} checked={parameters.includes(field)}
          onChange={(yes) => { setParameters(yes ? [...parameters, field] : parameters.filter((item) => item !== field)); setGrid([]); setEdited({}) }} />)}</section>
        <div className="ad-table-wrap" role="region" aria-label="Element values" tabIndex={0}><table className="ad-table"><thead><tr><th>Element</th>{parameters.map((parameter) => <th key={parameter}>{parameter}</th>)}</tr></thead>
          <tbody>{grid.map((row) => <tr key={row.id}><td>{row.id}, {row.label}</td>{parameters.map((parameter) => <td key={parameter}><input className="ad-input" style={{ width: 130 }}
            aria-label={row.id + ' ' + parameter} value={edited[row.id + '|' + parameter] ?? row.values[parameter] ?? ''} onChange={(event) => setEdited({ ...edited, [row.id + '|' + parameter]: event.target.value })} /></td>)}</tr>)}</tbody></table>
          {!grid.length && <p className="ad-note">Pick categories and parameters, then Load Grid. Edit cells, then Write.</p>}</div></div>
      <div className="ad-row"><Btn disabled={!categories.length || !parameters.length} onClick={loadGrid}>Load Grid</Btn><span className="ad-note">A blank cell never clears a value.</span>
        <Btn primary demo="schedule-write" disabled={!gridChanges.length} onClick={writeGrid}>Write</Btn>
        {exportGrid && <Btn disabled={!grid.length} onClick={() => {
          const cells = [['Element ID', ...parameters], ...grid.map((row) => [String(row.id), ...parameters.map((parameter) => row.values[parameter] ?? '')])]
          if (format === formats[0]) downloadWorkbook([{ name: 'Elements', rows: cells }])
          else downloadCsv('Sample-Residence-Elements.csv', cells[0], cells.slice(1))
          setReceipt(['Exported ' + grid.length + ' sample ' + kind.toLowerCase() + ' rows with ' + parameters.length + ' writable parameters.'])
        }}>Export elements</Btn>}</div>
    </>}
    {section === 3 && <>
      <FolioChoice label="Schedules" options={scheduleList.map(({ name }) => name)} value={previewSchedule} onChange={setPreviewSchedule} />
      <div className="ad-table-wrap" role="region" aria-label="Schedule rows" tabIndex={0}><table className="ad-table"><thead><tr><th>Element ID</th>{editableFields.map((field) => <th key={field}>{field}</th>)}</tr></thead>
        <tbody>{previewRows.map((row) => <tr key={row.id}><td>{row.id}</td>{editableFields.map((field) => <td key={field}>{row.values[field] || '—'}</td>)}</tr>)}</tbody></table></div>
    </>}
    {error && <p role="alert" className="folio-runtime-error">{error}</p>}
    {receipt.length > 0 && <Receipt entries={receipt} title="Last sample operation" />}
  </FolioFrame>
}
