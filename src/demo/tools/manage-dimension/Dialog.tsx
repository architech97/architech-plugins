import { useState } from 'react'
import type { DemoContext } from '../../types'
import { Btn, Check } from '../../ui'
import { PreviewTable, Receipt, ScopeRadios } from '../../kit'
import { FolioChoice, FolioFrame, FolioPreview } from '../folioFrame'

const sections = [
  { title: 'Dimension elements', summary: 'Cut through them, or use the selection.' },
  { title: 'Edit existing dimensions', summary: 'Merge, rebuild or change type.' },
  { title: 'Audit', summary: 'Find dimensions that need attention.' },
]
interface Dimension { id: number; name: string; view: string; type: string; witnesses: number[]; row: number; override: string; locked: boolean; detached: boolean; userLines: boolean }
const dimensions: Dimension[] = [
  { id: 481, name: 'D-481 · External wall chain', view: 'Level 01 – Floor Plan', type: 'Linear · 2.5 mm', witnesses: [0, 115, 3300], row: 10, override: '3400', locked: false, detached: false, userLines: false },
  { id: 482, name: 'D-482 · Adjacent wall chain', view: 'Level 01 – Floor Plan', type: 'Linear · 2.5 mm', witnesses: [3300, 4750], row: 10, override: '', locked: false, detached: false, userLines: false },
  { id: 503, name: 'D-503 · Level heights', view: 'North Elevation', type: 'Linear · 3.5 mm', witnesses: [0, 3300, 6600], row: 20, override: '', locked: true, detached: false, userLines: false },
  { id: 508, name: 'D-508 · Wall thickness', view: 'Section A–A', type: 'Linear · 2.5 mm', witnesses: [0, 450], row: 20, override: '', locked: false, detached: true, userLines: true },
]
const edits = ['Merge strings into one', 'Rebuild on detail lines', 'Change dimension type']
const scopes = ['Dimensions I pick or select', 'All dimensions in this view', 'All dimensions in views I pick…', 'All dimensions in every view and sheet']
const types = ['Linear · 2.5 mm', 'Linear · 3.5 mm', 'Linear · Architectural tick']

export default function ManageDimension(ctx: DemoContext) {
  const [section, setSection] = useState(0)
  const [rows, setRows] = useState(dimensions)
  const [what, setWhat] = useState('The elements a line cuts through')
  const [cut, setCut] = useState('Click two points')
  const [position, setPosition] = useState('Just outside the elements')
  const [overall, setOverall] = useState(false)
  const [faces, setFaces] = useState('Finish faces')
  const [edit, setEdit] = useState(edits[0])
  const [scope, setScope] = useState(scopes[0])
  const [chosenView, setChosenView] = useState('Level 01 – Floor Plan')
  const [ticked, setTicked] = useState<(string | number)[]>([])
  const [parallel, setParallel] = useState(false)
  const [type, setType] = useState(types[0])
  const [lineStyle, setLineStyle] = useState('Thin Lines')
  const [audit, setAudit] = useState(false)
  const [receipt, setReceipt] = useState<string[]>([])
  const effectiveScope = section === 2 && scope === scopes[0] ? scopes[1] : scope
  const scoped = rows.filter((row) => effectiveScope === scopes[3] || effectiveScope === scopes[0] ? effectiveScope === scopes[3] || ticked.includes(row.id) :
    row.view === (effectiveScope === scopes[2] ? chosenView : 'Level 01 – Floor Plan'))
  const editable = scoped.filter(({ locked }) => !locked)
  const compatible = editable.length >= 2 && editable.every((row) => row.type === editable[0].type && row.view === editable[0].view && (parallel || row.row === editable[0].row))
  const issue = section === 0 ? '' : section === 2 ? !scoped.length ? 'No dimensions in the chosen sample scope.' : '' :
    !scoped.length ? 'Pick or tick dimensions to work on.' : edit === edits[0] && !compatible ? 'Choose at least two same-type strings in one view on the same line, or allow parallel strings.' : ''
  const action = section === 0 ? what === 'The elements I select' ? 'Click where to place' : 'Start' : section === 2 ? 'Run audit' :
    edit === edits[0] ? effectiveScope === scopes[0] ? 'Merge' : 'Find strings to merge' : edit === edits[1] ? effectiveScope === scopes[0] ? 'Rebuild' : 'Preview rebuild' : 'Change type'
  const preview = section === 0 ? [
    { label: what, value: '4 sample witness positions · ' + (what === 'The elements a line cuts through' ? cut : 'Wall and joinery edges') },
    { label: 'Placement', value: position + ' · ' + type },
    { label: 'Measurement', value: faces + ' · 115 + 3185 + 1450 mm' + (overall ? ' · Overall 4750 mm' : '') },
  ] : scoped.map((row) => ({ label: row.name, value: row.locked ? 'Skipped · Locked' : section === 2 ?
    row.override ? 'Typed-over value ' + row.override + ' over ' + (row.witnesses.at(-1)! - row.witnesses[0]) + ' mm' : row.detached ? 'On detail lines' : 'No audit finding' :
      edit === edits[0] ? 'Merge all witness positions onto the first string' : edit === edits[1] ? row.userLines ? 'Keep user-drawn reference lines' : 'Rebuild on ' + lineStyle + ' · Measurement retained' :
        row.type + ' → ' + type }))

  function run() {
    if (issue) return
    if (section === 2) { setAudit(true); setReceipt(preview.filter(({ value }) => value !== 'No audit finding').map(({ label, value }) => label + ' · ' + value)); return }
    if (section === 0) {
      const id = Math.max(...rows.map(({ id }) => id)) + 1
      setRows([...rows, { id, name: 'D-' + id + ' · Sample cut dimension', view: 'Level 01 – Floor Plan', type,
        witnesses: [0, 115, 3300, 4750], row: 30, override: '', locked: false, detached: true, userLines: false }])
      setReceipt(['Created D-' + id + ' from sample element edges.', 'Witness lines use ' + lineStyle + '.'])
    } else if (edit === edits[0]) {
      const [first, ...rest] = editable
      const witnesses = [...new Set(editable.flatMap((row) => row.witnesses))].sort((a, b) => a - b)
      setRows(rows.filter((row) => !rest.some(({ id }) => row.id === id)).map((row) => row.id === first.id ? { ...row, witnesses, override: '' } : row))
      setTicked([first.id])
      setReceipt(['Merged ' + editable.length + ' strings into ' + first.name + '.', 'Witness positions: ' + witnesses.join(', ') + ' mm.'])
    } else {
      setRows(rows.map((row) => !editable.some(({ id }) => id === row.id) ? row : edit === edits[1] ? { ...row, detached: true } : { ...row, type }))
      setReceipt(preview.map(({ label, value }) => label + ' · ' + value))
    }
    ctx.done('configure'); ctx.done('run'); ctx.done('apply'); ctx.done('review')
    ctx.notify({ kind: 'success', text: action + ' · Sample dimensions updated.' })
  }

  return <FolioFrame ctx={ctx} title="Manage Dimension" sections={sections} section={section} onSection={(index) => { setSection(index); setAudit(false) }}
    footer={<><span className="ad-status">{issue || 'Sample Residence · Preview uses fictional dimensions.'}</span><Btn onClick={ctx.close}>Close</Btn><Btn primary demo="managedim-run" disabled={!!issue} onClick={run}>{action}</Btn></>}>
    {section === 0 ? <section className="ad-card folio-runtime-stack">
      <ScopeRadios label="What to dimension" options={['The elements a line cuts through', 'The elements I select']} value={what} onChange={setWhat} />
      {what === 'The elements a line cuts through' && <ScopeRadios label="Cut line" options={['Click two points', 'Pick a line I drew']} value={cut} onChange={setCut} />}
      <ScopeRadios label="Dimension line" value={position} options={['Just outside the elements', 'Click where']} onChange={setPosition} />
      <Check label="Add an overall dimension, one row further out" checked={overall} onChange={setOverall} />
      <FolioChoice label="Wall faces" options={['Finish faces', 'Core faces']} value={faces} onChange={setFaces} />
    </section> : <>
      {section === 1 && <ScopeRadios label="What to do" options={edits} value={edit} onChange={(value) => { setEdit(value); if (value === edits[1] && scope === scopes[3]) setScope(scopes[1]) }} />}
      <FolioChoice label="Which dimensions" value={effectiveScope} options={section === 2 ? scopes.slice(1) : edit === edits[1] ? scopes.slice(0, 3) : scopes}
        onChange={(value) => { setScope(value); setAudit(false) }} />
      {effectiveScope === scopes[2] && <FolioChoice label="Views I pick" options={[...new Set(rows.map(({ view }) => view))]} value={chosenView} onChange={setChosenView} />}
      <PreviewTable rows={rows} getId={(row) => row.id} ticked={ticked} onTicked={setTicked} caption="Sample dimensions" columns={[
        { key: 'name', label: 'Dimension' }, { key: 'view', label: 'View' }, { key: 'type', label: 'Type' },
        { key: 'value', label: 'Measurement', render: (row) => (row.witnesses.at(-1)! - row.witnesses[0]) + ' mm' },
      ]} />
      {section === 1 && edit === edits[0] && <Check label="Also join parallel strings that are off the line" checked={parallel} onChange={setParallel} />}
    </>}
    {(section === 0 || section === 1 && edit !== edits[0]) && <section className="ad-card folio-runtime-fields">
      <FolioChoice label="Dimension type" options={types} value={type} onChange={setType} />
      {section === 0 || edit === edits[1] ? <FolioChoice label="Witness line style" options={['Thin Lines', 'Medium Lines', 'Invisible Lines']} value={lineStyle} onChange={setLineStyle} /> : null}
    </section>}
    <FolioPreview rows={preview} />
    {audit && scoped.some(({ override }) => override) && <Btn onClick={() => {
      const changed = scoped.filter(({ override }) => override)
      setRows(rows.map((row) => changed.some(({ id }) => id === row.id) ? { ...row, override: '' } : row))
      setReceipt(['Cleared typed values from ' + changed.length + ' sample dimensions.'])
    }}>Clear typed values</Btn>}
    {receipt.length > 0 && <Receipt entries={receipt} title={section === 2 ? 'Sample audit findings' : 'Last sample operation'} />}
  </FolioFrame>
}
