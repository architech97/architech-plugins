import { useEffect, useId, useRef, useState } from 'react'
import { Btn, Check, Radio, RevitDialog, Select, TextBox } from '../ui'
import type { DemoContext } from '../types'
import {
  columnName, INITIAL_TABLES, linkedTable, readPreview, readRegionSyntax, regionOptions, tableLabel, WORKBOOK_FILE, WORKBOOKS, workbookSheets,
  type ExistingTable, type TablePreview, type WorkbookId, type Worksheet,
} from './excelScheduleFixture'
import './excelToSchedule.css'

type Change = { table: ExistingTable; before?: ExistingTable; preview: TablePreview }
type Run = { changes: Change[]; skipped: string[] }
type Overlay = { kind: 'workbook' | 'existing' | 'details' }
  | { kind: 'region'; sheet: Worksheet }
  | { kind: 'review' | 'relink' | 'redraw'; run: Run }

const TITLES = {
  workbook: 'Select a workbook',
  region: 'Excel cell region',
  existing: 'Choose the existing Excel schedule',
  review: 'Excel to Schedule — Review existing table refresh',
  relink: 'Excel to Schedule - Relink workbook',
  redraw: 'Excel to Schedule - Refresh drafting views',
  details: 'Excel to Schedule - Last run',
}

const PICKER_HINTS = {
  workbook: 'Choose one of the fictional workbook copies used in this simulation.',
  region: 'The saved region is resolved again on each refresh. Extend the print area or named region in Excel to include added rows.',
  existing: 'ArchiTECH tables refresh in place. Sticky and other externally managed schedules must be refreshed using their original manager. Native element schedules use Update Schedule.',
}
const sizes = ['From workbook', '2.5 mm', '3.5 mm', '5.0 mm']
const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`
const dimensions = (preview: TablePreview) => `${preview.rows.length} rows × ${preview.columns} columns`
const sourceOf = (table?: ExistingTable) => table?.workbook ? WORKBOOKS[table.workbook].path : '—'

export default function ExcelToSchedule({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [workbook, setWorkbook] = useState<WorkbookId>('issued')
  const [ticked, setTicked] = useState<string[]>(['doors'])
  const [highlight, setHighlight] = useState('doors')
  const [query, setQuery] = useState('')
  const [tickedOnly, setTickedOnly] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [range, setRange] = useState('')
  const [repeatTitles, setRepeatTitles] = useState(false)
  const [textSize, setTextSize] = useState(sizes[0])
  const [viewName, setViewName] = useState('')
  const [tables, setTables] = useState(INITIAL_TABLES)
  const [status, setStatus] = useState('')
  const [receipt, setReceipt] = useState<Run>()
  const [overlay, setOverlay] = useState<Overlay>()
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerId, setPickerId] = useState('')
  const modal = useRef<HTMLDialogElement>(null)
  const modalTitle = useId()

  useEffect(() => {
    if (overlay && !modal.current?.open) modal.current?.showModal()
    if (!overlay && modal.current?.open) modal.current.close()
    if (overlay && 'run' in overlay) modal.current?.querySelector<HTMLButtonElement>('[data-excel-no]')?.focus()
  }, [overlay])

  const worksheets = workbookSheets(workbook)
  const chosen = worksheets.filter((sheet) => ticked.includes(sheet.id))
  const plannedName = (sheet: Worksheet) => {
    const custom = viewName.replace(/[<>:"/\\|?*]/g, '').trim()
    return custom ? custom + (chosen.length > 1 ? '-' + sheet.name : '') : 'ArchiTECH-' + WORKBOOK_FILE.replace(/\.xlsx$/, '') + '-' + sheet.name
  }
  const match = (sheet: Worksheet, useDrafting = drafting) => useDrafting
    ? tables.find((table) => table.kind === 'drafting' && table.name === plannedName(sheet))
    : linkedTable(tables, workbook, sheet.id)
  const linked = drafting ? [] : worksheets.filter((sheet) => match(sheet, false))
  const refreshable = chosen.filter((sheet) => match(sheet))
  const statusFor = (sheet: Worksheet) => {
    const table = match(sheet)
    if (!table) return tables.some((item) => item.name === plannedName(sheet)) ? 'Name taken: ' + plannedName(sheet) : 'New'
    if (drafting) return 'Exists: ' + table.name
    return 'Linked: ' + table.name + (table.workbook === workbook ? ' — Source unchanged' : ' — Source changed — refresh available')
  }
  const shown = worksheets.filter((sheet) => (!tickedOnly || ticked.includes(sheet.id)) && (sheet.name + ' ' + statusFor(sheet)).toLowerCase().includes(query.trim().toLowerCase()))
  const previewSheet = shown.find((sheet) => sheet.id === highlight) ?? shown[0]
  const preview = previewSheet && readPreview(previewSheet, range, repeatTitles)
  const validRange = readRegionSyntax(range) !== undefined
  const blocked = !chosen.length || !validRange
  const canRefresh = refreshable.length > 0 && !blocked
  const refreshFirst = canRefresh && refreshable.length === chosen.length
  const hidden = chosen.filter((sheet) => !shown.some((row) => row.id === sheet.id)).length
  const noun = drafting ? 'drafting view' : 'schedule'

  const warn = (message: string) => { setStatus(message); notify({ kind: 'warning', text: message }) }
  const edit = (step: string) => { setStatus(''); rewind(step) }
  const tick = (ids: string[]) => {
    setTicked(ids); edit('worksheet')
    if (ids.length === 1) done('worksheet')
  }
  const chooseRange = (value: string) => {
    setRange(value); edit('region')
    if (readRegionSyntax(value) !== undefined) {
      done('region')
      if (chosen.length === 1) done('worksheet')
    }
  }
  const openPicker = (next: Overlay) => { setPickerQuery(''); setPickerId(''); setOverlay(next) }
  const chooseWorkbook = (id: WorkbookId) => {
    edit('workbook')
    if (id !== workbook) { setWorkbook(id); setTicked(workbookSheets(id).map((sheet) => sheet.id)); setHighlight('doors') }
    done('workbook')
    setOverlay(undefined)
  }
  const chooseRegion = () => {
    const sheet = previewSheet ?? chosen[0]
    if (sheet) openPicker({ kind: 'region', sheet })
    else warn('Choose a workbook and worksheet first.')
  }
  const chooseExisting = () => {
    if (drafting || chosen.length !== 1) { warn('Choose a workbook, tick one worksheet and use Schedule mode to update an existing table.'); return }
    if (!validRange) { warn('Enter a valid cell range first.'); return }
    done('worksheet')
    openPicker({ kind: 'existing' })
  }
  const updateTable = (before: ExistingTable, sheet: Worksheet, useStored = false): Change | string => {
    const sourceRange = useStored ? before.range : range
    const withTitles = useStored ? before.repeatTitles : repeatTitles
    const data = readPreview(sheet, sourceRange, withTitles)
    if (typeof data === 'string') return data
    return { before, table: { ...before, workbook, worksheet: sheet.id, range: sourceRange, repeatTitles: withTitles }, preview: data }
  }
  const reviewExisting = (id: string) => {
    const table = tables.find((item) => item.id === id)
    if (!table || chosen.length !== 1) return
    if (table.kind !== 'architech') {
      setOverlay(undefined)
      warn('This is not an exclusively ArchiTECH-managed Excel table. Use Update Schedule for model parameters, or Sticky for its tables. Create makes a separate ArchiTECH replacement from your workbook.')
      return
    }
    const change = updateTable(table, chosen[0])
    if (typeof change === 'string') { setOverlay(undefined); warn(change); return }
    done('target')
    setOverlay({ kind: 'review', run: { changes: [change], skipped: [] } })
  }
  const apply = (run: Run, kind: 'create' | 'refresh' | 'review' | 'relink' | 'redraw') => {
    setTables((previous) => [...previous.map((table) => run.changes.find((change) => change.before?.id === table.id)?.table ?? table),
      ...run.changes.filter((change) => !change.before).map((change) => change.table)])
    setReceipt(run)
    setOverlay(undefined)
    const message = kind === 'review' ? 'Existing table refreshed in place. Its placed sheet instances are retained.'
      : kind === 'relink' ? `${count(run.changes.length, 'schedule')} refreshed and linked to the selected workbook.`
      : `${count(run.changes.length, noun)} ${kind === 'create' ? 'created' : 'refreshed'} in the sample project.`
    const summary = message + (run.skipped.length ? ` ${run.skipped.length} skipped. See Details.` : '')
    setStatus(summary)
    notify({ kind: 'success', text: summary })
    if (kind !== 'create') done('refresh')
  }
  const createTables = () => {
    const run: Run = { changes: [], skipped: [] }
    const used = new Set(tables.map((table) => table.name.toLowerCase()))
    for (const sheet of chosen) {
      const data = readPreview(sheet, range, repeatTitles)
      if (typeof data === 'string') { run.skipped.push(sheet.name + ' · ' + data); continue }
      const base = plannedName(sheet)
      let name = base
      for (let n = 2; used.has(name.toLowerCase()); n++) name = `${base} (${n})`
      used.add(name.toLowerCase())
      run.changes.push({ table: { id: 'SCH-DEMO-' + (tables.length + run.changes.length + 1), name,
        kind: drafting ? 'drafting' : 'architech', workbook, worksheet: sheet.id, range, repeatTitles, sheets: [] }, preview: data })
    }
    if (run.changes.length) apply(run, 'create')
    else warn(run.skipped[0] || 'Tick a worksheet first.')
  }
  const refreshTables = (all = false) => {
    const run: Run = { changes: [], skipped: [] }
    for (const sheet of all ? linked : refreshable) {
      const table = match(sheet)
      if (!table) continue
      const change = updateTable(table, sheet, all)
      if (typeof change === 'string') run.skipped.push(sheet.name + ' · ' + change)
      else run.changes.push(change)
    }
    if (!run.changes.length) { warn(run.skipped[0] || 'No matching sample schedules to refresh.'); return }
    if (drafting) setOverlay({ kind: 'redraw', run })
    else if (run.changes.some((change) => change.before?.workbook !== workbook)) setOverlay({ kind: 'relink', run })
    else apply(run, 'refresh')
  }

  const pickerKind = overlay?.kind === 'workbook' || overlay?.kind === 'region' || overlay?.kind === 'existing' ? overlay.kind : undefined
  const options = overlay?.kind === 'workbook' ? (Object.entries(WORKBOOKS).map(([id, item]) => ({ id, label: item.label, detail: item.path })))
    : overlay?.kind === 'region' ? regionOptions(overlay.sheet)
    : overlay?.kind === 'existing' ? tables.filter((table) => table.kind !== 'drafting').map((table) => ({ id: table.id, label: tableLabel(table), detail: '' })).sort((a, b) => a.label.localeCompare(b.label))
    : []
  const matches = options.filter((option) => (option.label + ' ' + option.detail).toLowerCase().includes(pickerQuery.trim().toLowerCase()))
  const picked = matches.find((item) => item.id === pickerId) ?? matches[0]
  const commitPicker = (id = picked?.id) => {
    if (!id) return
    if (pickerKind === 'workbook') chooseWorkbook(id === 'incoming' ? 'incoming' : 'issued')
    if (pickerKind === 'region') { chooseRange(id); setOverlay(undefined) }
    if (pickerKind === 'existing') reviewExisting(id)
  }
  const pending = overlay?.kind === 'review' || overlay?.kind === 'relink' || overlay?.kind === 'redraw' ? overlay : undefined
  const review = overlay?.kind === 'review' ? overlay.run.changes[0] : undefined
  const dismissOverlay = () => {
    if (overlay?.kind === 'review') rewind('target')
    setOverlay(undefined)
  }

  return (
    <RevitDialog title="Excel to Schedule" caption="Turn worksheet tabs into Revit schedules, and refresh them when the workbook changes" theme={theme} onTheme={setTheme} onClose={close}
      footer={<>
        <span className="ad-status" role="status">{status || (!chosen.length ? 'Tick at least one worksheet (step 2).' : !validRange ? 'The cell range is not understood: use the form A1:F20, or leave it empty.' : count(chosen.length, 'worksheet') + ' ticked.')}</span>
        {receipt && <Btn onClick={() => setOverlay({ kind: 'details' })}>Details…</Btn>}
        <Btn onClick={close}>Close</Btn>
        <Btn disabled={!linked.length || !validRange} onClick={() => refreshTables(true)}>Refresh all linked{linked.length > 0 && ` (${linked.length})`}</Btn>
        <Btn primary={refreshFirst} disabled={!canRefresh} onClick={() => refreshTables()}>Refresh{refreshable.length > 0 && ` ${count(refreshable.length, noun)}`}</Btn>
        <Btn primary={!refreshFirst} disabled={blocked} onClick={createTables}>Create{chosen.length > 0 && ` ${count(chosen.length, noun)}`}</Btn>
      </>}>
      <div className="excel-layout">
        <div className="excel-controls">
          <section aria-label="Workbook">
            <h3 className="ad-label">1 Workbook</h3>
            <div className="excel-field"><TextBox aria-label="Workbook path" readOnly value={WORKBOOKS[workbook].path} /><Btn demo="excel-workbook" onClick={() => openPicker({ kind: 'workbook' })}>Browse…</Btn></div>
          </section>
          <section aria-label="Worksheets">
            <div className="excel-heading"><h3 className="ad-label">2 Worksheets</h3><Btn sm onClick={() => setStatus('Read the sample model again. Ticks are kept.')}>Rescan</Btn></div>
            <TextBox type="search" aria-label="Search worksheets" placeholder="Search worksheet or status..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="excel-toolbar">
              <Btn sm aria-pressed={tickedOnly} onClick={() => setTickedOnly(!tickedOnly)}>Ticked only</Btn>
              <Btn sm onClick={() => tick([...new Set([...ticked, ...shown.map((sheet) => sheet.id)])])}>Tick shown</Btn>
              <Btn sm onClick={() => tick([])}>Clear ticks</Btn>
            </div>
            <p className="ad-note">{chosen.length} of {worksheets.length} worksheets ticked{hidden > 0 && ` (${hidden} hidden by the filter, still included)`}.</p>
            <div className="ad-table-wrap excel-sheet-grid" data-demo="excel-worksheets">
              <table className="ad-table"><thead><tr><th scope="col">Tick</th><th scope="col">Worksheet</th><th scope="col">In the model</th></tr></thead>
                <tbody>{shown.map((sheet) => (
                  <tr className={sheet.id === previewSheet?.id ? 'sel' : ''} key={sheet.id}>
                    <td><Check title={'Build ' + sheet.name} checked={ticked.includes(sheet.id)} onChange={(checked) => tick(checked ? [...ticked, sheet.id] : ticked.filter((id) => id !== sheet.id))} /></td>
                    <th scope="row"><button type="button" className="excel-row-link" aria-pressed={sheet.id === previewSheet?.id} onClick={() => setHighlight(sheet.id)}>{sheet.name}</button></th>
                    <td>{statusFor(sheet)}</td>
                  </tr>
                ))}</tbody>
              </table>
              {!shown.length && <p className="excel-empty ad-note">{tickedOnly && !query ? 'No worksheets are ticked. Click Ticked only again to show all.' : 'No worksheets match. Clear the search.'}</p>}
            </div>
          </section>
          <section aria-label="Options">
            <h3 className="ad-label">3 Options</h3>
            <div className="excel-options">
              <span className="ad-note">Make a</span>
              <div className="excel-toolbar"><Radio name="excel-mode" label="Schedule" checked={!drafting} onChange={() => { setDrafting(false); edit('target') }} /><Radio name="excel-mode" label="Drafting view (lines and text)" checked={drafting} onChange={() => { setDrafting(true); edit('target') }} /></div>
              <Btn demo="excel-region" onClick={chooseRegion}>Excel region...</Btn>
              <TextBox aria-label="Cell range" placeholder="A1:F20" value={range} maxLength={64} onChange={(event) => chooseRange(event.target.value)} />
              <span className="ad-note">Text size</span><Select label="Text size" value={textSize} options={sizes} onChange={setTextSize} />
              <label htmlFor={modalTitle + '-name'} className="ad-note">View name</label><TextBox id={modalTitle + '-name'} value={viewName} maxLength={80} onChange={(event) => setViewName(event.target.value)} />
              <Btn demo="excel-existing" onClick={chooseExisting}>Choose existing...</Btn>
              {viewName && chosen.length > 0 && <span className="ad-note">Name: {plannedName(chosen[0])}{chosen.length > 1 ? ' (and one per tab).' : '.'}</span>}
            </div>
            <Check label="Include Excel print-title rows above this region" checked={repeatTitles} onChange={(value) => { setRepeatTitles(value); edit('target') }} />
          </section>
        </div>
        <section className="excel-preview" aria-label="Worksheet preview">
          <div className="excel-heading"><h3 className="ad-label">Preview</h3>{preview && typeof preview !== 'string' && <span className="ad-note">{dimensions(preview)}</span>}</div>
          {previewSheet && <p className="ad-note">{previewSheet.name}{preview && typeof preview !== 'string' && ` · ${preview.region}`}</p>}
          {typeof preview === 'string' ? <p className="excel-empty ad-note" role="alert">{preview}</p>
            : preview ? <>
              <div className="ad-table-wrap excel-preview-table" style={textSize !== sizes[0] ? { fontSize: textSize === '2.5 mm' ? 11 : textSize === '3.5 mm' ? 13 : 16 } : undefined}>
                <table className="ad-table"><thead><tr>{Array.from({ length: preview.columns }, (_, i) => <th scope="col" key={i}>{columnName(preview.firstColumn + i)}</th>)}</tr></thead>
                  <tbody>{preview.rows.map((row, i) => <tr key={i} className={i < preview.titleRows || i === 0 && !range ? 'excel-title-row' : undefined}>{row.map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody>
                </table>
              </div>
              {preview.titleRows > 0 && <p className="ad-note">Included {count(preview.titleRows, 'Excel print-title row')} above the selected region.</p>}
              {preview.outside && <p className="ad-note">Excel has content outside the selected region.</p>}
            </> : <p className="excel-empty ad-note">Choose a worksheet to preview it.</p>}
          {receipt && <div className="excel-receipt" aria-label="Latest sample result">
            <strong>Latest sample result</strong>
            {receipt.changes.map(({ table, preview: data }) => <p key={table.id}>{table.name} · {table.id} · {dimensions(data)} · {table.sheets.length ? 'Sheet placements ' + table.sheets.join(', ') : 'Unplaced'}</p>)}
          </div>}
        </section>
      </div>

      <dialog ref={modal} className="excel-modal" aria-labelledby={modalTitle} onCancel={(event) => { event.preventDefault(); dismissOverlay() }}
        onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismissOverlay() } }}>
        {overlay && <>
          <h3 id={modalTitle}>{TITLES[overlay.kind]}</h3>
          {pickerKind && <>
            <p>{PICKER_HINTS[pickerKind]}</p>
            <form onSubmit={(event) => { event.preventDefault(); commitPicker() }}>
              <TextBox type="search" aria-label="Search items" placeholder="Type to filter" value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} />
              <ul className="excel-picker">
                {matches.map((item) => <li key={item.id}><button type="button" aria-pressed={picked?.id === item.id} onClick={() => setPickerId(item.id)} onDoubleClick={() => commitPicker(item.id)}><span>{item.label}</span>{item.detail && <small>{item.detail}</small>}</button></li>)}
              </ul>
              {!matches.length && <p className="ad-note">No matching items.</p>}
              <div className="excel-toolbar excel-modal-actions"><Btn primary type="submit" disabled={!picked}>OK</Btn><Btn type="button" onClick={dismissOverlay}>Cancel</Btn></div>
            </form>
          </>}
          {pending && <>
            {review && <>
              <p>Replace the Excel header grid in {tableLabel(review.table)}?</p>
              <dl className="excel-detail"><dt>Source</dt><dd>{sourceOf(review.table)}</dd><dt>Worksheet</dt><dd>{chosen[0]?.name}</dd><dt>Size</dt><dd>{dimensions(review.preview)}</dd></dl>
              <p>The existing schedule ID and sheet placements are kept. Its size may change. The source link will be updated to this workbook and worksheet.</p>
            </>}
            {pending.kind === 'relink' && <>
              <p>Linked to {[...new Set(pending.run.changes.filter((change) => change.before?.workbook !== workbook).map((change) => sourceOf(change.before)))].join(', ')}</p>
              <p>Relink to {WORKBOOKS[workbook].path}?</p>
            </>}
            {pending.kind === 'redraw' && <p>Refresh redraws each matching drafting view from the workbook. Everything currently in those views is deleted first, including anything added by hand. Continue?</p>}
            <div className="excel-toolbar excel-modal-actions"><Btn primary demo="excel-confirm" onClick={() => apply(pending.run, pending.kind)}>Yes</Btn><Btn data-excel-no onClick={dismissOverlay}>No</Btn></div>
          </>}
          {overlay.kind === 'details' && receipt && <>
            <div className="excel-receipt">
              {receipt.changes.map(({ table, before, preview: data }) => <section key={table.id}><strong>{table.name}</strong>
                <dl className="excel-detail"><dt>Schedule ID</dt><dd>{table.id}</dd><dt>Sheet placements</dt><dd>{table.sheets.join(', ') || 'Unplaced'}</dd>
                  {before && <><dt>Previous source</dt><dd>{sourceOf(before)}</dd></>}<dt>Source</dt><dd>{sourceOf(table)}</dd><dt>Region</dt><dd>{data.region}</dd><dt>Size</dt><dd>{dimensions(data)}</dd></dl></section>)}
              {receipt.skipped.map((line) => <p key={line}>{line}</p>)}
            </div>
            <div className="excel-toolbar excel-modal-actions"><Btn primary onClick={() => setOverlay(undefined)}>OK</Btn></div>
          </>}
        </>}
      </dialog>
    </RevitDialog>
  )
}
