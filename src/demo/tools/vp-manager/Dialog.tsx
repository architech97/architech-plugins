import { useState } from 'react'
import type { DemoContext } from '../../types'
import { Btn, Check } from '../../ui'
import { PreviewTable, Receipt, ScopeRadios } from '../../kit'
import { FolioChoice, FolioFrame, FolioPreview, FolioText } from '../folioFrame'
import { sampleResidence } from '../../fixtures/sampleResidence'

const sections = [
  { title: 'Align', summary: 'Line the ticked viewports up with a reference: same spot, model point or an edge.' },
  { title: 'Crop', summary: 'Match crops, grow them by a margin, and show or hide crop regions.' },
  { title: 'Titles & numbers', summary: 'Viewport type, detail numbers in reading order, and titles on sheet.' },
  { title: 'Pin & move', summary: 'Pin or unpin the ticked viewports, or move them to another sheet.' },
  { title: 'Place on sheet', summary: 'Put views and schedules that are not on a sheet yet onto sheets, in a layout.' },
]
interface Viewport { id: number; sheet: string; detail: string; view: string; kind: string; scale: number; type: string; title: string; pinned: boolean; crop: boolean; annotation: boolean; x: number; y: number; width: number; height: number; modelX?: number; modelY?: number; titleX?: number; titleY?: number }
const initial: Viewport[] = [
  { id: 201, sheet: 'A-101', detail: '1', view: 'Ground Floor Plan', kind: 'Floor Plan', scale: 50, type: 'Title with Line', title: '', pinned: true, crop: true, annotation: false, x: 190, y: 140, width: 4200, height: 3000 },
  { id: 202, sheet: 'A-102', detail: '1', view: 'First Floor Plan', kind: 'Floor Plan', scale: 50, type: 'Title with Line', title: '', pinned: false, crop: true, annotation: false, x: 150, y: 170, width: 4500, height: 3300 },
  { id: 203, sheet: 'A-201', detail: '1', view: 'North Elevation', kind: 'Elevation', scale: 100, type: 'Title without Line', title: '', pinned: true, crop: false, annotation: false, x: 180, y: 130, width: 6200, height: 6600 },
  { id: 204, sheet: 'A-101', detail: '2', view: 'Graphic Standards', kind: 'Legend', scale: 10, type: 'No Title', title: '', pinned: false, crop: false, annotation: false, x: 300, y: 100, width: 1100, height: 750 },
]
const alignments = ['Same position on its sheet as the reference (other sheets)', 'By model coordinates (same model point, other sheets)', "To the reference's edge, same sheet:"]
const types = ['Title with Line', 'Title without Line', 'No Title']
const sheets = sampleResidence.sheets.filter(({ placeholder }) => !placeholder).map(({ number }) => number)
const label = (row: Viewport) => row.sheet + ' · ' + row.detail + ' · ' + row.view
const freeViews = [
  { id: 901, view: 'Section B–B', kind: 'Section', scale: 50, placed: '' },
  { id: 902, view: 'Room 101 · Ceiling Plan', kind: 'Ceiling Plan', scale: 50, placed: '' },
  { id: 903, view: 'Door Schedule', kind: 'Schedule', scale: 1, placed: '' },
]

export default function VpManager(ctx: DemoContext) {
  const [rows, setRows] = useState(initial)
  const [section, setSection] = useState(0)
  const [ticked, setTicked] = useState<(string | number)[]>([])
  const [sheetFilter, setSheetFilter] = useState('All sheets')
  const [typeFilter, setTypeFilter] = useState('All view types')
  const [reference, setReference] = useState('')
  const [alignment, setAlignment] = useState(alignments[0])
  const [edge, setEdge] = useState('Left edge')
  const [matchCrop, setMatchCrop] = useState(false)
  const [matchType, setMatchType] = useState(false)
  const [matchTitles, setMatchTitles] = useState(false)
  const [cropMatch, setCropMatch] = useState(false)
  const [cropRef, setCropRef] = useState('')
  const [margin, setMargin] = useState('')
  const [paper, setPaper] = useState(false)
  const [cropVisible, setCropVisible] = useState('Leave unchanged')
  const [annotation, setAnnotation] = useState('Leave unchanged')
  const [titleAction, setTitleAction] = useState('Viewport type:')
  const [viewportType, setViewportType] = useState(types[0])
  const [order, setOrder] = useState('Left to right')
  const [start, setStart] = useState('1')
  const [step, setStep] = useState('1')
  const [prefix, setPrefix] = useState('')
  const [continueNumbers, setContinueNumbers] = useState(false)
  const [title, setTitle] = useState('')
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [pinAction, setPinAction] = useState('Pin the ticked viewports')
  const [destination, setDestination] = useState(sheets[0])
  const [unplaced, setUnplaced] = useState(freeViews)
  const [viewPicks, setViewPicks] = useState<(string | number)[]>([])
  const [sheetSettings, setSheetSettings] = useState(false)
  const [layoutSettings, setLayoutSettings] = useState(false)
  const [layout, setLayout] = useState('1 view, title block centre')
  const [receipt, setReceipt] = useState<string[]>([])
  const picked = rows.filter(({ id }) => ticked.includes(id))
  const ref = picked.find((row) => label(row) === reference) ?? picked[0]
  const cropReference = rows.find((row) => label(row) === cropRef) ?? rows[0]
  const marginNumber = margin.trim() ? Number(margin) : 0
  const reading = [...picked].sort((a, b) => a.sheet.localeCompare(b.sheet) || (order === 'Left to right' ? a.x - b.x : b.y - a.y))
  const nextNumbers = new Map<number, string>()
  const counters = new Map<string, number>()
  for (const row of reading) {
    const next = counters.get(row.sheet) ?? (continueNumbers ? Math.max(...rows.filter((other) => other.sheet === row.sheet).map(({ detail }) => Number(detail) || 0)) + 1 : Number(start))
    nextNumbers.set(row.id, (continueNumbers ? '' : prefix) + next)
    counters.set(row.sheet, next + (continueNumbers ? 1 : Number(step)))
  }
  const numberClash = titleAction === 'Detail numbers:' && picked.some((row) => rows.some((other) => !ticked.includes(other.id) && other.sheet === row.sheet && other.detail === nextNumbers.get(row.id)))
  const problem = section === 4 ? !viewPicks.length ? 'Tick the views to place.' : '' : !picked.length ? 'Tick the viewports to work on.' :
    section === 0 && picked.length < 2 ? 'Tick at least two viewports: the reference and the ones to line up with it.' :
      section === 1 && (!Number.isFinite(marginNumber) || Math.abs(marginNumber) > 100000) ? 'Enter a numeric crop margin.' :
        section === 1 && picked.some((row) => row.width + 2 * marginNumber * (paper ? row.scale : 1) <= 0 || row.height + 2 * marginNumber * (paper ? row.scale : 1) <= 0) ? 'The crop margin would remove the crop extent.' :
          section === 2 && titleAction === 'Detail numbers:' && (!Number.isInteger(Number(start)) || !Number.isInteger(Number(step)) || Number(step) === 0) ? 'Start and step must be whole numbers, and step cannot be 0.' :
            section === 2 && numberClash ? 'A proposed detail number is already used by an unticked viewport on its sheet.' : ''
  function aligned(row: Viewport) {
    if (!ref || row.id === ref.id) return row
    const sameSheet = row.sheet === ref.sheet, sameEdge = alignment === alignments[2]
    if (sameSheet !== sameEdge) return row
    const next = { ...row }
    if (sameEdge) {
      if (edge === 'Left edge') next.x = ref.x - ref.width / ref.scale / 2 + row.width / row.scale / 2
      else if (edge === 'Right edge') next.x = ref.x + ref.width / ref.scale / 2 - row.width / row.scale / 2
      else if (edge === 'Top edge') next.y = ref.y + ref.height / ref.scale / 2 - row.height / row.scale / 2
      else if (edge === 'Bottom edge') next.y = ref.y - ref.height / ref.scale / 2 + row.height / row.scale / 2
      else { next.x = ref.x; next.y = ref.y }
    } else {
      next.x = ref.x; next.y = ref.y
      if (alignment === alignments[1]) {
        next.x += ((row.modelX ?? row.width / 2) - (ref.modelX ?? ref.width / 2)) / row.scale
        next.y += ((row.modelY ?? row.height / 2) - (ref.modelY ?? ref.height / 2)) / row.scale
      }
    }
    if (matchCrop) { next.width = ref.width; next.height = ref.height }
    if (matchType) next.type = ref.type
    if (matchTitles && !row.pinned) { next.titleX = ref.titleX ?? 0; next.titleY = ref.titleY ?? -12 }
    return next
  }
  const occupied = new Set(rows.filter((row) => !ticked.includes(row.id) && row.sheet === destination).map(({ detail }) => detail))
  const planned = picked.map((row) => {
    if (section === 0) return aligned(row)
    if (section === 1) {
      const reference = cropMatch ? cropReference : row
      const amount = marginNumber * (paper ? row.scale : 1)
      return { ...row, width: reference.width + 2 * amount, height: reference.height + 2 * amount,
        crop: cropVisible === 'Leave unchanged' ? row.crop : cropVisible === 'Show', annotation: annotation === 'Leave unchanged' ? row.annotation : annotation === 'Show' }
    }
    if (section === 2) return titleAction === 'Viewport type:' ? { ...row, type: viewportType } :
      titleAction === 'Detail numbers:' ? { ...row, detail: nextNumbers.get(row.id) ?? row.detail } :
        { ...row, title: title || (find ? (row.title || row.view).replaceAll(find, replace) : row.title) }
    if (section === 3) {
      if (pinAction !== 'Move to sheet:') return { ...row, pinned: pinAction === 'Pin the ticked viewports' }
      let detail = row.detail, number = 1
      while (occupied.has(detail)) detail = String(number++)
      occupied.add(detail)
      return { ...row, sheet: destination, detail }
    }
    return row
  })
  const preview = section === 4 ? unplaced.filter(({ id }) => viewPicks.includes(id)).map((view, index) => ({ label: view.view, value: destination + ' · ' + layout + ' · Slot ' + (index + 1) })) :
    picked.map((row, index) => {
      const next = planned[index]
      return { label: label(row), value: section === 0 ? row === ref ? 'Reference viewport' : next.x === row.x && next.y === row.y ? 'Unchanged or outside alignment sheet scope' :
        '(' + row.x + ', ' + row.y + ') → (' + next.x.toFixed(1) + ', ' + next.y.toFixed(1) + ') paper mm' :
        section === 1 ? row.width + ' × ' + row.height + ' → ' + next.width + ' × ' + next.height + ' model mm · Crop ' + (next.crop ? 'shown' : 'hidden') :
          section === 2 ? titleAction === 'Viewport type:' ? row.type + ' → ' + next.type : titleAction === 'Detail numbers:' ? row.detail + ' → ' + next.detail : (row.title || row.view) + ' → ' + (next.title || row.view) :
            section === 3 ? pinAction === 'Move to sheet:' ? row.sheet + ' → ' + next.sheet + ' · Position and pin retained' : String(row.pinned) + ' → ' + String(next.pinned) : '' }
    })
  const action = section === 0 ? 'Align viewports' : section === 1 ? 'Crop views' : section === 2 ? titleAction === 'Viewport type:' ? 'Change viewport type' : titleAction === 'Detail numbers:' ? 'Renumber viewports' : 'Set title on views' :
    section === 3 ? pinAction === 'Move to sheet:' ? 'Move viewports' : pinAction.startsWith('Unpin') ? 'Unpin viewports' : 'Pin viewports' : 'Place on sheets'
  function run() {
    if (problem) return
    if (section === 4) {
      const pickedViews = unplaced.filter(({ id }) => viewPicks.includes(id))
      const perSheet = layout === '1 view, title block centre' ? 1 : 2
      const reserved = new Map(sheets.map((sheet) => [sheet, new Set(rows.filter((row) => row.sheet === sheet).map(({ detail }) => detail))]))
      const add = pickedViews.map((view, index) => {
        const sheet = sheets[(Math.max(0, sheets.indexOf(destination)) + Math.floor(index / perSheet)) % sheets.length]
        let number = 1
        while (reserved.get(sheet)!.has(String(number))) number++
        const detail = String(number)
        reserved.get(sheet)!.add(detail)
        return { ...initial[0], id: Math.max(...rows.map(({ id }) => id)) + index + 1, sheet, detail,
          view: view.view, kind: view.kind, scale: view.scale, pinned: false, x: 150 + (index % perSheet) * 120, y: 140 }
      })
      setRows([...rows, ...add])
      setUnplaced(unplaced.map((view) => viewPicks.includes(view.id) ? { ...view, placed: add.find((row) => row.view === view.view)!.sheet } : view))
      setViewPicks([])
    } else setRows(rows.map((row) => planned.find(({ id }) => id === row.id) ?? row))
    setReceipt(preview.map(({ label, value }) => label + ' · ' + value).concat(matchTitles && section === 0 ? ['Viewport title offsets matched where the sample viewport was unpinned.'] : []))
    ctx.done('configure'); ctx.done('row'); ctx.done('run'); ctx.done('apply'); ctx.done('review')
    ctx.notify({ kind: 'success', text: action + ' · Sample fixture updated.' })
  }
  return <FolioFrame ctx={ctx} title="VP Manager" sections={sections} section={section} onSection={setSection}
    footer={<><span className="ad-status">{problem || 'One Undo reverses the whole run. Sample data.'}</span><Btn onClick={ctx.close}>Close</Btn><Btn primary demo="vpmanager-run" disabled={!!problem} onClick={run}>{action}</Btn></>}>
    {section !== 4 ? <>
      <div className="folio-runtime-fields"><FolioChoice label="Sheet filter" options={['All sheets', ...sheets]} value={sheetFilter} onChange={setSheetFilter} />
        <FolioChoice label="View type filter" options={['All view types', ...new Set(rows.map(({ kind }) => kind))]} value={typeFilter} onChange={setTypeFilter} /></div>
      <PreviewTable rows={rows.filter((row) => (sheetFilter === 'All sheets' || row.sheet === sheetFilter) && (typeFilter === 'All view types' || row.kind === typeFilter))}
        caption="Project viewports" getId={(row) => row.id} ticked={ticked} onTicked={setTicked} columns={[
          { key: 'sheet', label: 'Sheet' }, { key: 'detail', label: 'Detail #' }, { key: 'view', label: 'View' }, { key: 'kind', label: 'View type' },
          { key: 'scale', label: 'Scale', render: ({ scale }) => '1:' + scale }, { key: 'type', label: 'Viewport type' }, { key: 'title', label: 'Title on sheet' },
          { key: 'pinned', label: 'Pinned', render: ({ pinned }) => pinned ? 'Yes' : 'No' }, { key: 'crop', label: 'Crop', render: ({ crop }) => crop ? 'Visible' : 'Hidden' },
        ]} />
      <section className="ad-card folio-runtime-stack">
        {section === 0 && <><FolioChoice label="Reference" options={picked.length ? picked.map(label) : ['Tick a reference viewport']} value={ref ? label(ref) : 'Tick a reference viewport'} onChange={setReference} />
          <ScopeRadios label="Alignment" options={alignments} value={alignment} onChange={setAlignment} />
          {alignment === alignments[2] && <FolioChoice label="Reference edge" options={['Left edge', 'Right edge', 'Top edge', 'Bottom edge', 'Centre']} value={edge} onChange={setEdge} />}
          <Check label="Also match the crop (scope box or crop shape)" checked={matchCrop} onChange={setMatchCrop} />
          <Check label="Also match the viewport type" checked={matchType} onChange={setMatchType} />
          <Check label="Also align viewport titles to the reference" checked={matchTitles} onChange={setMatchTitles} /></>}
        {section === 1 && <><Check label="Match crop to:" checked={cropMatch} onChange={setCropMatch} />
          {cropMatch && <FolioChoice label="Crop reference" options={rows.map(label)} value={cropRef || label(rows[0])} onChange={setCropRef} />}
          <FolioText label="Grow crop by" value={margin} onChange={setMargin} /><Check label="paper mm (× view scale)" checked={paper} onChange={setPaper} />
          <div className="folio-runtime-fields"><FolioChoice label="Crop region visible" options={['Leave unchanged', 'Show', 'Hide']} value={cropVisible} onChange={setCropVisible} />
            <FolioChoice label="Annotation crop" options={['Leave unchanged', 'Show', 'Hide']} value={annotation} onChange={setAnnotation} /></div></>}
        {section === 2 && <><ScopeRadios label="What to change" options={['Viewport type:', 'Detail numbers:', 'Title on Sheet, set:']} value={titleAction} onChange={setTitleAction} />
          {titleAction === 'Viewport type:' ? <FolioChoice label="Viewport type" options={types} value={viewportType} onChange={setViewportType} /> :
            titleAction === 'Detail numbers:' ? <><FolioChoice label="Reading order" options={['Left to right', 'Top to bottom']} value={order} onChange={setOrder} />
              <Check label="Continue after highest number on each sheet" checked={continueNumbers} onChange={setContinueNumbers} />
              <div className="folio-runtime-fields"><FolioText label="Start" value={start} onChange={setStart} /><FolioText label="Step" value={step} onChange={setStep} /><FolioText label="Prefix" value={prefix} onChange={setPrefix} /></div></> :
              <div className="folio-runtime-fields"><FolioText label="Title on Sheet, set" value={title} onChange={setTitle} /><FolioText label="Find" value={find} onChange={setFind} /><FolioText label="Replace" value={replace} onChange={setReplace} /></div>}</>}
        {section === 3 && <><ScopeRadios label="What to do" options={['Pin the ticked viewports', 'Unpin the ticked viewports', 'Move to sheet:']} value={pinAction} onChange={setPinAction} />
          {pinAction === 'Move to sheet:' && <FolioChoice label="Target sheet" options={sheets} value={destination} onChange={setDestination} />}</>}
      </section>
    </> : <>
      <b className="ad-label">1 Select views</b><PreviewTable rows={unplaced.filter(({ placed }) => !placed)} columns={[{ key: 'kind', label: 'Type' }, { key: 'view', label: 'View' }, { key: 'scale', label: 'Scale 1:' }]}
        caption="Unplaced views" getId={(row) => row.id} ticked={viewPicks} onTicked={setViewPicks} />
      <div className="ad-row"><Btn onClick={() => setSheetSettings(!sheetSettings)} aria-expanded={sheetSettings}>Sheet Settings</Btn><Btn onClick={() => setLayoutSettings(!layoutSettings)} aria-expanded={layoutSettings}>Layout Settings</Btn></div>
      {sheetSettings && <FolioChoice label="Existing sheet" options={sheets} value={destination} onChange={setDestination} />}
      {layoutSettings && <FolioChoice label="Layout" options={['1 view, title block centre', '2 side by side']} value={layout} onChange={setLayout} />}
      <p className="ad-note">{destination} · {layout}</p>
    </>}
    <FolioPreview rows={preview} />
    {receipt.length > 0 && <Receipt entries={receipt} title="Last sample operation" />}
  </FolioFrame>
}
