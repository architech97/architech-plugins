import type { DemoContext } from '../types'
import { useId, useState } from 'react'
import { Btn, Check, Expander, Radio, RevitDialog, SearchBox, Select, TextBox } from '../ui'
import { changeCase, cleanText, DEFAULT_KEEP_AS_TYPED, replaceText } from './manageTextTransform'
import './manage-text.css'

const jobs = ['Find & replace', 'Case & tidy-up', 'Text types', 'Merge notes'] as const
const jobSummaries = {
  'Find & replace': 'Replace text across views, sheets or the model.',
  'Case & tidy-up': 'Change case and tidy spaces and lines in notes.',
  'Text types': 'Review text types and move notes onto a standard one.',
  'Merge notes': 'Join the selected notes into one, or re-space them.',
}
const scopes = ['Selected notes', 'This view or sheet', 'Views I pick', 'Sheets I pick', 'Whole model'] as const
const caseOptions = ['UPPER', 'lower', 'Title Case', 'Sentence case', 'Capitalize first letter']
const cleanupOptions = ['Trim ends', 'Collapse spaces', 'Remove empty lines', 'Join lines', 'Straighten quotes']
const types = [
  { name: '2.5 mm Arial', font: 'Arial', size: '2.5 mm' },
  { name: '3.5 mm Arial', font: 'Arial', size: '3.5 mm' },
  { name: '2.5 mm Segoe UI', font: 'Segoe UI', size: '2.5 mm' },
]
const locations = [
  { view: 'Ground Floor Plan', sheet: 'A-101' },
  { view: 'Building Section', sheet: 'A-301' },
]
interface Note {
  id: number
  name: string
  text: string
  type: string
  location: number
  formatted?: boolean
  offset?: number
}
const initialNotes: Note[] = [
  { id: 1, name: 'Entry wall note', text: 'EXISTING WALL TO REMAIN', type: types[0].name, location: 0 },
  { id: 2, name: 'Kitchen partition note', text: 'NEW  PARTITION', type: types[0].name, location: 0 },
  { id: 3, name: 'Section reference', text: 'SEE “DETAIL A-501”', type: types[1].name, location: 0, formatted: true },
  { id: 4, name: 'Ceiling note', text: '12mm GWB above FFL.', type: types[2].name, location: 1 },
]

export default function ManageText({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const id = useId()
  const [notes, setNotes] = useState(initialNotes)
  const [job, setJob] = useState<(typeof jobs)[number]>('Case & tidy-up')
  const [scope, setScope] = useState<(typeof scopes)[number]>('This view or sheet')
  const [pickedLocations, setPickedLocations] = useState<number[]>([])
  const [typeFilter, setTypeFilter] = useState('All text types')
  const [caseAction, setCaseAction] = useState('Change case')
  const [mode, setMode] = useState('UPPER')
  const [cleanup, setCleanup] = useState(cleanupOptions[0])
  const [keep, setKeep] = useState(DEFAULT_KEEP_AS_TYPED)
  const [findAction, setFindAction] = useState('Find & replace')
  const [find, setFind] = useState('')
  const [replacement, setReplacement] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [sampleEdit, setSampleEdit] = useState(false)
  const [armed, setArmed] = useState(false)
  const [ticks, setTicks] = useState<Record<number, boolean>>({})
  const [query, setQuery] = useState('')
  const [tickedOnly, setTickedOnly] = useState(false)
  const [status, setStatus] = useState('')
  const [applied, setApplied] = useState<{ id: number; name: string; text: string; after: string }[]>([])
  const [sourceType, setSourceType] = useState('')
  const [targetType, setTargetType] = useState(types[1].name)
  const [confirmType, setConfirmType] = useState(false)
  const [selected, setSelected] = useState([1, 2])
  const [picking, setPicking] = useState(false)
  const [direction, setDirection] = useState('Vertical — stack into lines')
  const [mergeMode, setMergeMode] = useState('Merge into ONE note')
  const [gap, setGap] = useState('1')
  const [separator, setSeparator] = useState('  |  ')

  const merging = job === 'Merge notes'
  const retyping = job === 'Text types'
  const finding = job === 'Find & replace'
  const fileMode = finding && findAction === 'Apply an Excel file'
  const scopedNotes = notes.filter((note) =>
    (typeFilter === 'All text types' || typeFilter === note.type) &&
    (scope === 'Whole model' ||
      (scope === 'Selected notes' ? selected.includes(note.id) :
        scope === 'This view or sheet' ? note.location === 0 : pickedLocations.includes(note.location))))
  const error = armed && finding && !fileMode && !find ? 'Type the text to find.' : ''
  const transform = (note: Note) => {
    if (fileMode) return sampleEdit && note.id === 1 ? 'Existing wall to remain. Verify opening.' : note.text
    if (finding) return replaceText(note.text, find, replacement, matchCase, wholeWord)
    return caseAction === 'Change case' ? changeCase(note.text, mode, keep) : cleanText(note.text, cleanup)
  }
  const changes = armed && !error && !retyping && !merging
    ? scopedNotes.map((note) => ({ ...note, after: transform(note) })).filter(({ text, after }) => text !== after)
    : []
  const ticked = (note: Note) => ticks[note.id] ?? (!note.formatted && !fileMode)
  const approved = changes.filter(ticked)
  const where = (note: Note) => locations[note.location].view + ' (' + locations[note.location].sheet + ')'
  const shown = changes.filter((note) => (!tickedOnly || ticked(note)) &&
    [note.name, note.text, note.after, where(note)].some((part) => part.toLowerCase().includes(query.trim().toLowerCase())))
  const typeRows = scopedNotes.filter(({ type }) => type === sourceType)
  const mergeRows = notes.filter(({ id }) => selected.includes(id))
  const horizontal = direction === 'Horizontal — join onto one line'
  const respace = !horizontal && mergeMode === 'Keep them separate and re-space evenly'
  const rowGap = Number(gap)
  const mergeError = mergeRows.length < 2 ? 'Pick at least two text notes.' :
    mergeRows.some((note) => note.location !== mergeRows[0].location) ? 'Pick notes from the same view.' :
    mergeRows.some((note) => note.formatted) ? 'Pick plain text notes for this merge.' :
    !horizontal && (!gap.trim() || !Number.isFinite(rowGap) || rowGap < 0) ? 'Spacing must be a number of 0 or more.' :
    !horizontal && rowGap > 20 ? 'Use a row gap of 20 or less in this sample.' : ''
  const mergeText = mergeError ? '' : mergeRows.map(({ text }) => horizontal ? text.replace(/[\r\n]+/g, ' ') : text)
    .join(horizontal ? separator || ' ' : '\n'.repeat(Math.max(1, Math.round(rowGap))))

  function configure() {
    setArmed(true)
    setTicks({})
    setStatus('')
    setApplied([])
    setConfirmType(false)
    rewind('preview')
    done('configure')
  }

  function refresh() {
    setArmed(true)
    setStatus('')
    setApplied([])
    if (finding && !fileMode && !find) return
    done('configure')
    done('preview')
  }

  function complete(message: string) {
    setStatus(message)
    notify({ kind: 'success', text: message })
  }

  function apply() {
    if (!approved.length) return
    setNotes(notes.map((note) => {
      const change = approved.find(({ id }) => id === note.id)
      return change ? { ...note, text: change.after, formatted: false } : note
    }))
    setTicks({})
    setArmed(false)
    setApplied(approved)
    done('preview')
    done('apply')
    complete('Applied text changes to ' + approved.length + (approved.length === 1 ? ' sample note.' : ' sample notes.'))
  }

  function changeType() {
    if (!typeRows.length || sourceType === targetType) return
    setNotes(notes.map((note) => typeRows.includes(note) ? { ...note, type: targetType } : note))
    setConfirmType(false)
    complete('Changed ' + typeRows.length + ' sample ' + (typeRows.length === 1 ? 'note' : 'notes') + ' to ' + targetType + '.')
  }

  function merge() {
    if (mergeError) return
    const [first, ...rest] = mergeRows
    if (respace) {
      setNotes(notes.map((note) => mergeRows.includes(note) ? { ...note, offset: mergeRows.indexOf(note) * rowGap } : note))
      complete('Re-spaced ' + mergeRows.length + ' sample notes at ' + gap + ' × text height.')
      return
    }
    setNotes(notes.filter((note) => !rest.includes(note)).map((note) => note === first ? { ...note, text: mergeText } : note))
    setSelected([first.id])
    setPicking(false)
    complete('Merged ' + mergeRows.length + ' sample notes into one.')
  }

  function radios(name: string, values: readonly string[], value: string, onChange: (v: string) => void) {
    return <div className="ad-row">{values.map((option) => <Radio key={option} name={id + name} label={option} checked={value === option} onChange={() => onChange(option)} />)}</div>
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="Manage Text" caption="Find, replace, tidy and merge text notes" onClose={close}
      footer={<><span className="ad-status">Sample Residence · Browser simulation</span><Btn onClick={close}>Close</Btn></>}>
      <div className="mt-layout">
        <nav className="ad-nav mt-nav" aria-label="Manage Text tools">
          <span className="ad-label">Tools</span>
          {jobs.map((item, index) => <button type="button" key={item} className={job === item ? 'on' : undefined} aria-pressed={job === item} aria-label={item} onClick={() => {
            if (job === item) return
            setJob(item)
            setArmed(false)
            setTicks({})
            setStatus('')
            setApplied([])
            setConfirmType(false)
            setQuery('')
            setTickedOnly(false)
            rewind('configure')
          }}><span className="mt-number" aria-hidden="true">{index + 1}</span><span>{item}</span></button>)}
        </nav>
        <div className="mt-work">
          <header className="mt-heading"><h3>{job}</h3><p className="ad-note">{jobSummaries[job]}</p></header>
          {!merging && <section className="ad-card mt-stack" aria-label="Text note scope">
            <b className="ad-label">Text note scope</b>
            {radios('scope', scopes, scope, (value) => { setScope(value as typeof scope); configure() })}
            <label className="mt-field">Only text type
              <Select label="Only text type" value={typeFilter} options={['All text types', ...types.map(({ name }) => name)]} onChange={(value) => { setTypeFilter(value); configure() }} />
            </label>
            {(scope === 'Views I pick' || scope === 'Sheets I pick') && <div className="ad-row">
              {locations.map(({ view, sheet }, index) => <Check key={sheet} label={scope === 'Views I pick' ? view : sheet + ' · ' + view} checked={pickedLocations.includes(index)} onChange={(value) => {
                setPickedLocations(value ? [...pickedLocations, index] : pickedLocations.filter((location) => location !== index))
                configure()
              }} />)}
            </div>}
          </section>}
          {!merging && !retyping && <>
            <section className="ad-card mt-stack" data-demo="manage-text-configure" aria-label="What to do">
              <b className="ad-label">What to do</b>
              {finding ? <>
                {radios('find-action', ['Find & replace', 'Apply an Excel file'], findAction, (value) => { setFindAction(value); configure() })}
                {fileMode ? <>
                  <div className="ad-row"><Btn onClick={() => { setSampleEdit(true); configure() }}>Load sample Excel edit</Btn><span>{sampleEdit ? 'Sample edit loaded' : 'No file chosen.'}</span></div>
                  <span className="ad-note">The desktop dialog exports and imports Excel files. This exercise loads a prepared edit for the entry wall note.</span>
                </> : <>
                  <div className="mt-fields">
                    <label className="mt-field">Find<TextBox value={find} maxLength={200} onChange={(e) => { setFind(e.target.value); configure() }} /></label>
                    <label className="mt-field">Replace with<TextBox value={replacement} maxLength={200} onChange={(e) => { setReplacement(e.target.value); configure() }} /></label>
                  </div>
                  <div className="ad-row">
                    <Check label="Match case" checked={matchCase} onChange={(value) => { setMatchCase(value); configure() }} />
                    <Check label="Whole word" checked={wholeWord} onChange={(value) => { setWholeWord(value); configure() }} />
                    <span className="ad-note">Replace may be empty to delete the matching text.</span>
                  </div>
                </>}
              </> : <>
                {radios('case-action', ['Change case', 'Tidy spaces and lines'], caseAction, (value) => { setCaseAction(value); configure() })}
                {caseAction === 'Change case' ? <>
                  {radios('case-mode', caseOptions, mode, (value) => { setMode(value); configure() })}
                  <Expander header="More options"><label className="mt-field">Keep as typed
                    <TextBox value={keep} maxLength={300} onChange={(e) => { setKeep(e.target.value); configure() }} />
                  </label><span className="ad-note">Title, Sentence and Capitalize preserve these terms, units and existing acronyms.</span></Expander>
                </> : radios('cleanup', cleanupOptions, cleanup, (value) => { setCleanup(value); configure() })}
              </>}
            </section>
            <section className="ad-card mt-stack" aria-label="Text change preview">
              <div className="ad-row mt-preview-tools">
                <SearchBox value={query} onChange={setQuery} placeholder="Search preview" />
                <Check label="Ticked only" checked={tickedOnly} onChange={setTickedOnly} />
                <Btn sm disabled={!shown.length} onClick={() => setTicks({ ...ticks, ...Object.fromEntries(shown.map(({ id }) => [id, true])) })}>Tick shown</Btn>
                <Btn sm disabled={!approved.length} onClick={() => setTicks(Object.fromEntries(changes.map(({ id }) => [id, false])))}>Clear ticks</Btn>
                <Btn sm demo="manage-text-refresh" onClick={refresh}>Refresh</Btn>
              </div>
              {error && <p className="mt-error" role="alert">{error}</p>}
              <div className="ad-table-wrap mt-table" tabIndex={0} role="region" aria-label="Before and after preview">
                <table className="ad-table"><thead><tr><th scope="col">Tick</th><th scope="col">Before</th><th scope="col">After</th><th scope="col">Note</th><th scope="col">View (sheet)</th></tr></thead>
                  <tbody>{shown.map((note) => <tr key={note.id}>
                    <td><Check title={'Tick ' + note.name} checked={ticked(note)} onChange={(value) => setTicks({ ...ticks, [note.id]: value })} /></td>
                    <td className="wrap">{note.text}</td><td className="wrap changed">{note.after}</td>
                    <td className="wrap">{note.name}{note.formatted && <span className="ad-note mt-detail">Formatted · rewrites as plain text</span>}</td>
                    <td className="wrap">{where(note)}</td>
                  </tr>)}
                  {!shown.length && <tr><td className="wrap" colSpan={5}>{!armed ? 'Set an option above, or press Refresh to list the notes that would change.' :
                    error ? 'Enter a search term to prepare the preview.' : changes.length ? 'No changes match the preview filter.' : 'No changes in the current scope.'}</td></tr>}</tbody>
                </table>
              </div>
              <div className="ad-row mt-apply"><span className="ad-note">{approved.length} ticked · {shown.length} shown. Ticked rows outside the filter still apply.</span>
                <Btn primary demo="manage-text-apply" disabled={!approved.length} onClick={apply}>Apply</Btn>
              </div>
            </section>
          </>}
          {retyping && <>
            <section className="ad-card mt-stack" aria-label="Text type inventory">
              <div className="ad-row mt-apply"><span className="ad-note">Review the font, size and usage of each text type.</span><Btn sm onClick={() => setStatus('Refreshed the sample text type inventory.')}>Refresh</Btn></div>
              <div className="ad-table-wrap mt-table" tabIndex={0} role="region" aria-label="Text types table">
                <table className="ad-table"><thead><tr><th scope="col">Text type</th><th scope="col">Font</th><th scope="col">Size</th><th scope="col">In scope</th><th scope="col">In model</th></tr></thead>
                  <tbody>{types.map(({ name, font, size }) => <tr key={name} className={sourceType === name ? 'sel' : undefined}>
                    <td><Radio label={name} name={id + 'source-type'} checked={sourceType === name} onChange={() => { setSourceType(name); setConfirmType(false); setStatus('') }} /></td>
                    <td>{font}</td><td>{size}</td><td>{scopedNotes.filter(({ type }) => type === name).length}</td><td>{notes.filter(({ type }) => type === name).length}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </section>
            <section className="ad-card mt-stack" aria-label="Move notes to another type">
              <b className="ad-label">Move notes to another type</b>
              <div className="ad-row">
                <label className="mt-field">Target text type<Select label="Target text type" options={types.map(({ name }) => name)} value={targetType}
                  onChange={(value) => { setTargetType(value); setConfirmType(false); setStatus('') }} /></label>
                <Btn primary disabled={!typeRows.length || sourceType === targetType} onClick={() => setConfirmType(true)}>Change type</Btn>
              </div>
              {confirmType && <div className="ad-row"><span>Move {typeRows.length} sample {typeRows.length === 1 ? 'note' : 'notes'} to {targetType}?</span>
                <Btn onClick={() => setConfirmType(false)}>Cancel</Btn><Btn primary onClick={changeType}>Confirm change type</Btn>
              </div>}
            </section>
          </>}
          {merging && <section className="ad-card mt-stack" aria-label="Merge notes settings">
            <div className="ad-row"><span>{mergeRows.length} sample {mergeRows.length === 1 ? 'note' : 'notes'} selected</span>
              <Btn aria-expanded={picking} onClick={() => setPicking(!picking)}>Pick notes in Revit…</Btn></div>
            {picking && <fieldset className="mt-picker"><legend>Pick sample notes</legend>{notes.map((note) => <Check key={note.id} label={note.name + ' · ' + where(note)}
              checked={selected.includes(note.id)} onChange={(value) => {
                setSelected(value ? [...selected, note.id] : selected.filter((id) => id !== note.id))
                setStatus('')
              }} />)}</fieldset>}
            <b className="ad-label">Direction</b>
            {radios('direction', ['Vertical — stack into lines', 'Horizontal — join onto one line'], direction, (value) => { setDirection(value); setStatus('') })}
            {horizontal ? <>
              <label className="mt-field">Separator<TextBox value={separator} maxLength={20} onChange={(e) => { setSeparator(e.target.value); setStatus('') }} /></label>
              <div className="ad-row">{Object.entries({ comma: ', ', pipe: '  |  ', dash: ' — ', space: ' ' }).map(([label, value]) =>
                <Btn key={label} sm onClick={() => { setSeparator(value); setStatus('') }}>{label}</Btn>)}</div>
            </> : <>
              <label className="mt-field">Row gap × text height<TextBox value={gap} type="number" min={0} max={20} step="any" onChange={(e) => { setGap(e.target.value); setStatus('') }} /></label>
              {radios('merge-mode', ['Merge into ONE note', 'Keep them separate and re-space evenly'], mergeMode, (value) => { setMergeMode(value); setStatus('') })}
            </>}
            <div className="mt-merge-preview">
              <b className="ad-label">Sample preview</b>
              {mergeError ? <p className="mt-error">{mergeError}</p> : respace ?
                <ul>{mergeRows.map((note, index) => <li key={note.id}>{note.name} · {index * rowGap} × text height</li>)}</ul> :
                <p>{mergeText}</p>}
            </div>
            <div className="ad-row"><Btn primary disabled={Boolean(mergeError)} onClick={merge}>Merge / Re-space</Btn></div>
            {respace && mergeRows.some(({ offset }) => offset !== undefined) &&
              <span className="ad-note">Applied positions: {mergeRows.map(({ offset }) => (offset ?? 0) + '×').join(', ')} text height.</span>}
          </section>}
          {status && <div className="mt-status">
            <p role="status">{status}</p>
            {applied.length > 0 && <ul>{applied.map(({ id, name, text, after }) =>
              <li key={id}><b>{name}</b><span>{text} → {after}</span></li>)}</ul>}
          </div>}
        </div>
      </div>
    </RevitDialog>
  )
}
