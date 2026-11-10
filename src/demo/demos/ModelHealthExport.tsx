import { useEffect, useRef, useState } from 'react'
import { DEMO_PROJECT } from '../../data/demoProject'
import { ROOMS, SHEETS, WARNINGS } from '../sample'
import { Btn, Check, Progress, RevitDialog, Select, TextBox } from '../ui'
import type { DemoContext } from '../types'
import { downloadCsv } from './craftedTools'
import './model-health.css'

type Row = [string, string | number]
const MODEL = DEMO_PROJECT.name + '.rvt'
const CHECKSETS = ['All available checksets', 'ArchiTECH Health (built-in)']
const SECTIONS: { id: string; label: string; rows: Row[] }[] = [
  { id: 'core', label: 'Core model summary', rows: [['Model', MODEL], ['Rooms', ROOMS.length], ['Sheets', SHEETS.length]] },
  { id: 'project', label: 'Project information', rows: [['Project number', DEMO_PROJECT.code], ['Project stage', DEMO_PROJECT.stage], ['Issue', DEMO_PROJECT.revision]] },
  { id: 'links', label: 'Revit links', rows: [['Structure.rvt', 'Loaded · Attachment'], ['Interiors.rvt', 'Loaded · Overlay'], ['MEP.rvt', 'Unloaded · Overlay']] },
  { id: 'cad', label: 'CAD links and imports', rows: [['Site-survey.dwg', 'Linked · Level 01'], ['Old-layout.dwg', 'Embedded · Lobby plan']] },
  { id: 'references', label: 'Images, keynotes and other references', rows: [['Entrance precedent.png', 'Image · Drafting view'], ['Material keynotes.txt', 'Keynote table']] },
  { id: 'warnings', label: 'Warnings', rows: WARNINGS.map(({ description, count }) => [description, count]) },
  { id: 'worksets', label: 'Worksets and categories', rows: [['Architecture', 'User workset'], ['Shared Levels and Grids', 'User workset']] },
  { id: 'sheets_views', label: 'Sheets and views', rows: SHEETS.map(({ number, name, views }) => [number + ' · ' + name, views]) },
  { id: 'schedules', label: 'Schedules', rows: [['Room Schedule', ROOMS.length], ['Door Schedule', 5], ['Window Schedule', 2]] },
  { id: 'phasing_design', label: 'Phasing and design options', rows: [['Existing', 'Phase'], ['New Construction', 'Phase'], ['Main Model', 'Design option scope']] },
  { id: 'groups', label: 'Groups', rows: [['Typical bathroom layout', 2], ['Kitchen island detail', 0]] },
  { id: 'families', label: 'Families and model performance', rows: [['Reception Millwork', 'In-place · 18 instances'], ['Test Plinth', 'Unused']] },
  { id: 'datum', label: 'Levels, grids and scope boxes', rows: [['Level 01', '0 mm'], ['Level 02', '3,100 mm'], ['Building extent', 'Scope box']] },
  { id: 'best_practices', label: 'Model best-practice checks', rows: [['Critical-Class Warnings', WARNINGS.filter(({ severity }) => severity === 'Critical').reduce((sum, { count }) => sum + count, 0)], ['Unplaced Rooms', 0]] },
  { id: 'extended_api', label: 'Standards, metadata and IFC API tabs', rows: [['Units', DEMO_PROJECT.units], ['IFC export configuration', 'Default sample settings']] },
]
const ALL = SECTIONS.map(({ id }) => id)
const FINDINGS = [
  { section: 'Model health', label: 'Critical-Class Warnings', result: 'Fail', count: WARNINGS.filter(({ severity }) => severity === 'Critical').reduce((sum, { count }) => sum + count, 0), severity: 'CRITICAL' },
  { section: 'Model health', label: 'Warnings', result: 'Count', count: WARNINGS.reduce((sum, { count }) => sum + count, 0), severity: 'INFO' },
  { section: 'Rooms', label: 'Unplaced Rooms', result: 'Pass', count: 0, severity: 'OK' },
]
const REVIEWS = ['Original', 'Pass', 'Fail', 'Reviewed', 'Count']
const SEVERITIES = ['Original', 'OK', 'INFO', 'WARNING', 'CRITICAL']
const DEFAULT_FOLDER = DEMO_PROJECT.code + ' / Model Health Reports'
type Review = { result: string; severity: string; reason: string }
const ORIGINAL: Review = { result: 'Original', severity: 'Original', reason: '' }
type Phase = 'settings' | 'running' | 'review' | 'override' | 'complete' | 'dashboard'

export default function ModelHealthExport({ theme, setTheme, close, done, rewind, notify }: DemoContext) {
  const [phase, setPhase] = useState<Phase>('settings')
  const [categories, setCategories] = useState(ALL)
  const [checkset, setCheckset] = useState(CHECKSETS[0])
  const [folder, setFolder] = useState(DEFAULT_FOLDER)
  const [includeLinks, setIncludeLinks] = useState(false)
  const [compact, setCompact] = useState(false)
  const [familySizes, setFamilySizes] = useState(false)
  const [error, setError] = useState('')
  const [finished, setFinished] = useState(0)
  const [cancelling, setCancelling] = useState(false)
  const [selected, setSelected] = useState(0)
  const [reviews, setReviews] = useState<Record<number, Review>>({})
  const [draft, setDraft] = useState(ORIGINAL)
  const [tab, setTab] = useState('')
  const [query, setQuery] = useState('')
  const [columnFilter, setColumnFilter] = useState('')
  const [sort, setSort] = useState<{ column: 0 | 1; descending: boolean } | null>(null)
  const [limit, setLimit] = useState(5)
  const panel = useRef<HTMLDivElement>(null)
  const jobs = SECTIONS.filter(({ id }) => categories.includes(id))
  const exported = jobs.slice(0, finished)
  const section = exported.find(({ id }) => id === tab) ?? exported[0]
  const linksExported = includeLinks && !cancelling ? 2 : 0
  const isPartial = cancelling
  const measured = familySizes && exported.some(({ id }) => id === 'families')
  let rows = section?.rows ?? []
  if (section?.id === 'families' && measured) rows = [...rows, ['Reception Millwork · sample serialized size', '2.4 MB']]
  if (compact && section && section.id !== 'core' && section.id !== 'project') rows = [['Inventory rows in full report', rows.length]]
  const visibleRows = rows.filter(([item, value]) =>
    (item + ' ' + value).toLowerCase().includes(query.trim().toLowerCase())
    && String(value).toLowerCase().includes(columnFilter.trim().toLowerCase()))
  if (sort) {
    const { column, descending } = sort
    visibleRows.sort((a, b) => String(a[column]).localeCompare(String(b[column]), 'en', { numeric: true }) * (descending ? -1 : 1))
  }
  const displayedRows = visibleRows.slice(0, limit)

  useEffect(() => {
    if (phase !== 'settings') panel.current?.focus()
  }, [phase])

  useEffect(() => {
    if (phase !== 'running') return
    const timer = window.setTimeout(() => {
      const count = Math.min(finished + 1, jobs.length)
      setFinished(count)
      if (cancelling) {
        done('review')
        setPhase('complete')
        notify({ kind: 'warning', text: 'Sample run cancelled. Completed inventory sections are retained.' })
      } else if (count === jobs.length) {
        setPhase('review')
      }
    }, 260)
    return () => window.clearTimeout(timer)
  }, [phase, finished, jobs.length, cancelling, done, notify])

  function chooseCategories(next: string[]) {
    setCategories(next)
    setError('')
    if (next.length) done('categories')
    else rewind('categories')
  }

  function run() {
    if (!categories.length || !folder.trim()) {
      setError(categories.length ? 'Enter a sample output folder name.' : 'Select at least one inventory category.')
      return
    }
    setError('')
    setFinished(0)
    setCancelling(false)
    setReviews({})
    setSelected(0)
    done('categories')
    done('run')
    setPhase('running')
  }

  function finishReview() {
    done('review')
    setPhase('complete')
  }

  function saveReview(value: Review) {
    setReviews({ ...reviews, [selected]: value })
  }

  function clearReview() {
    const next = { ...reviews }
    delete next[selected]
    setReviews(next)
  }

  function changeTab(id: string) {
    setTab(id)
    setQuery('')
    setColumnFilter('')
    setSort(null)
    setLimit(5)
  }

  function restart() {
    rewind('categories')
    changeTab('')
    setPhase('settings')
  }

  function exportCsv() {
    if (!section || !visibleRows.length) return
    downloadCsv(DEMO_PROJECT.code + '-model-health-' + section.id + '.csv', ['Item', 'Value'], visibleRows)
    done('download')
    notify({ kind: 'success', text: 'Sample ' + section.label + ' CSV downloaded.' })
  }

  const title = {
    settings: 'Model Health',
    running: 'Model Health · Running checks',
    review: 'Model Check Reviews',
    override: 'Model Check Override',
    complete: isPartial ? 'Model Health · Cancelled' : 'Model Health · Complete',
    dashboard: 'Model Health · Dashboard',
  }[phase]
  const actions = {
    settings: <><span className="ad-status" role="alert">{error || 'Sample export settings'}</span><Btn onClick={close}>Cancel</Btn><Btn primary demo="health-run" onClick={run}>Run check</Btn></>,
    running: <><span className="ad-status">Stops at the next safe boundary. Partial results are retained.</span><Btn disabled={cancelling} onClick={() => setCancelling(true)}>{cancelling ? 'Cancelling…' : 'Cancel after current section'}</Btn></>,
    review: <><span className="ad-status">Reviewed failures remain visible in the report.</span><Btn demo="health-override" onClick={() => { setDraft(reviews[selected] ?? ORIGINAL); setPhase('override') }}>Edit Override</Btn><Btn onClick={clearReview} disabled={!reviews[selected]}>Clear Review</Btn><Btn onClick={() => saveReview({ ...ORIGINAL, result: 'Reviewed' })} disabled={FINDINGS[selected].result !== 'Fail' || Boolean(reviews[selected])}>Mark Reviewed</Btn><Btn primary demo="health-review" onClick={finishReview}>Finish review</Btn></>,
    override: <><span className="ad-status">Sample report only</span><Btn onClick={() => setPhase('review')}>Cancel</Btn><Btn primary onClick={() => { saveReview(draft); setPhase('review') }}>Save</Btn></>,
    complete: <><span className="ad-status">Sample report receipt</span><Btn onClick={restart}>Change settings</Btn><Btn primary demo="health-dashboard" onClick={() => { changeTab(exported.find(({ id }) => id === 'warnings')?.id ?? ''); done('dashboard'); setPhase('dashboard') }}>Open sample dashboard</Btn></>,
    dashboard: <><span className="ad-status">CSV files contain fictional project data.</span><Btn onClick={restart}>New sample report</Btn><Btn primary demo="health-download" onClick={exportCsv} disabled={!visibleRows.length}>Download sample CSV</Btn></>,
  }[phase]

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title={title} caption={DEMO_PROJECT.code + ' · ' + MODEL + ' · Browser simulation'} onClose={phase === 'running' ? () => setCancelling(true) : close} footer={actions}>
      <div className="health-panel" ref={panel} tabIndex={-1} data-health-phase={phase} aria-label={title}>
        {phase === 'settings' && <>
          <p>Choose inventory sections and a rule checkset. Rule checks apply to the host model.</p>
          <div className="health-columns">
            <fieldset className="health-card" data-demo="health-categories">
              <legend>Inventory categories</legend>
              <p className="ad-status" role="status">{categories.length} of {SECTIONS.length} selected</p>
              <div className="health-categories">{SECTIONS.map(({ id, label }) => <Check key={id} label={label} checked={categories.includes(id)} onChange={(checked) => chooseCategories(checked ? [...categories, id] : categories.filter((item) => item !== id))} />)}</div>
              <div className="health-actions"><Btn sm onClick={() => chooseCategories(ALL)}>Select all</Btn><Btn sm onClick={() => chooseCategories([])}>Clear</Btn><Btn sm onClick={() => chooseCategories(ALL)}>Defaults</Btn></div>
            </fieldset>
            <div className="health-settings">
              <fieldset className="health-card"><legend>Rule checks</legend><label>Checkset<Select label="Checkset" value={checkset} onChange={setCheckset} options={CHECKSETS} /></label><p className="ad-status">The desktop tool also accepts Autodesk XML and ArchiTECH JSON checksets.</p></fieldset>
              <fieldset className="health-card"><legend>Export options</legend>
                <Check label="Include loaded-link inventory" checked={includeLinks} onChange={setIncludeLinks} />
                <p className="ad-status">Links receive inventory only. Rule checks run on the host.</p>
                <Check label="Use compact dashboard data" checked={compact} onChange={setCompact} />
                <p className="ad-status">Compact data summarizes the selected inventory sections.</p>
                <fieldset className="health-family-size" disabled={!categories.includes('families')}>
                  <Check label="Measure family file sizes" checked={familySizes} onChange={setFamilySizes} />
                </fieldset>
                <p className="ad-status">Available when Families and model performance is selected.</p>
              </fieldset>
              <fieldset className="health-card"><legend>Output folder</legend>
                <TextBox aria-label="Sample output folder" value={folder} onChange={(event) => { setFolder(event.target.value); setError('') }} />
                <p className="ad-status">This sample folder is a label for the export receipt.</p>
              </fieldset>
            </div>
          </div>
        </>}
        {phase === 'running' && <div className="health-progress" role="status">
          <h3>{MODEL}</h3><p>{jobs[finished]?.label ?? 'Writing sample report'}</p>
          <Progress value={finished * 100 / jobs.length} />
          <p className="ad-status">{finished} of {jobs.length} inventory steps finished</p>
        </div>}
        {phase === 'review' && <>
          <p>Select a sample check to review or override. The source report keeps a record of reviewed failures.</p>
          <div className="health-table">
            <table className="ad-grid"><thead><tr>{['Checkset', 'Section', 'Check', 'Status', 'Count', 'Severity'].map((header) => <th key={header}>{header}</th>)}</tr></thead>
              <tbody>{FINDINGS.map((finding, index) => <tr key={finding.label} aria-selected={index === selected}>
                <td>ArchiTECH Health</td><td>{finding.section}</td><td><button className="crafted-row-action" type="button" aria-pressed={index === selected} onClick={() => setSelected(index)}>{finding.label}</button></td>
                <td>{reviews[index]?.result && reviews[index].result !== 'Original' ? reviews[index].result : finding.result}</td><td>{finding.count}</td><td>{reviews[index]?.severity && reviews[index].severity !== 'Original' ? reviews[index].severity : finding.severity}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}
        {phase === 'override' && <div className="health-settings health-override">
          <p className="ad-h">{FINDINGS[selected].label}</p>
          <label>Result<Select label="Override result" options={REVIEWS} value={draft.result} onChange={(result) => setDraft({ ...draft, result })} /></label>
          <label>Severity<Select label="Override severity" options={SEVERITIES} value={draft.severity} onChange={(severity) => setDraft({ ...draft, severity })} /></label>
          <label>Reason<textarea className="ad-input" aria-label="Override reason" rows={3} value={draft.reason} onChange={(event) => setDraft({ ...draft, reason: event.target.value })} /></label>
        </div>}
        {phase === 'complete' && <div className="health-progress">
          <h3>{isPartial ? 'Cancelled · Partial inventory' : 'Sample audit execution complete'}</h3>
          <p>{isPartial ? 'Only inventory completed before cancellation is available.' : 'Open the dashboard to see what the checks found.'}</p>
          <dl className="crafted-result">
            <div><dt>Output folder</dt><dd>{folder}</dd></div><div><dt>Inventory categories</dt><dd>{exported.length} of {jobs.length} finished</dd></div>
            <div><dt>Loaded links exported</dt><dd>{linksExported}</dd></div>
            <div><dt>Checkset</dt><dd>{isPartial ? 'Not run' : checkset}</dd></div>
            <div><dt>Review notes</dt><dd>{Object.keys(reviews).length}</dd></div>
            <div><dt>Family sizes</dt><dd>{measured ? 'Included from sample fixture' : 'Not included'}</dd></div>
            <div><dt>Dashboard format</dt><dd>{compact ? 'Compact summary' : 'Inventory tables'}</dd></div>
          </dl>
        </div>}
        {phase === 'dashboard' && <>
          <div className="health-dashboard-summary">
            <div><span>Inventory sections</span><strong>{exported.length}</strong></div>
            <div><span>Loaded links exported</span><strong>{linksExported}</strong></div>
            <div><span>Run status</span><strong>{isPartial ? 'Partial' : 'Complete'}</strong></div>
          </div>
          {!isPartial && Object.keys(reviews).length > 0 && <details><summary>Review notes</summary><dl className="crafted-result">
            {Object.entries(reviews).map(([key, note]) => <div key={key}><dt>{FINDINGS[Number(key)].label}</dt><dd>{note.result}{note.reason && ' · ' + note.reason}</dd></div>)}
          </dl></details>}
          <div className="health-dashboard-controls">
            <label>Inventory section
              <select className="ad-select" value={section?.id ?? ''} onChange={(event) => changeTab(event.target.value)}>{exported.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}</select>
            </label>
            <label>Search all columns<TextBox value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <label>Filter Value<TextBox value={columnFilter} onChange={(event) => setColumnFilter(event.target.value)} /></label>
          </div>
          <div className="health-table">
            <table className="ad-grid"><thead><tr>{(['Item', 'Value'] as const).map((heading, index) => {
              const column = index as 0 | 1
              return <th key={heading} aria-sort={sort?.column === column ? sort.descending ? 'descending' : 'ascending' : 'none'}><button className="crafted-row-action" type="button" onClick={() => setSort({ column, descending: sort?.column === column && !sort.descending })}>Sort by {heading}</button></th>
            })}</tr></thead>
              <tbody>{displayedRows.map(([item, value]) => <tr key={item}><td>{item}</td><td>{value}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="health-actions"><p className="ad-status" role="status">{displayedRows.length} of {visibleRows.length} rows{visibleRows.length ? '' : ' match your filters'}</p>
            {visibleRows.length > limit && <Btn sm onClick={() => setLimit(visibleRows.length)}>Show all rows</Btn>}
            {(query || columnFilter) && <Btn sm onClick={() => { setQuery(''); setColumnFilter('') }}>Clear filters</Btn>}
          </div>
        </>}
      </div>
    </RevitDialog>
  )
}
