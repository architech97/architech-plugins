import { useRef, useState } from 'react'
import type { DemoContext } from '../types'
import { Btn, Check, RevitDialog, SearchBox, Select, TextBox } from '../ui'
import { downloadCsv } from './craftedTools'
import ForgeFamilyParameters from './ForgeFamilyParameters'
import ForgeNestedParameters from './ForgeNestedParameters'
import { INITIAL_NESTED_MODEL, NESTED_SAMPLE_FAMILY, nestedAssociationMessage } from './forgeNestedModel'
import './suiteWorkflow.css'

const categories = ['Doors', 'Windows', 'Walls', 'Furniture', 'Rooms']
const existing = [
  { name: 'Door Hardware Set', source: 'Shared Parameter', discipline: 'Common', spec: 'Text', group: 'Identity Data', binding: 'Type', categories: ['Doors'] },
  { name: 'Finish Code', source: 'Project Parameter', discipline: 'Common', spec: 'Text', group: 'Materials and Finishes', binding: 'Instance', categories: ['Rooms'] },
]
const initial = { name: 'Asset Tag', source: 'Project Parameter', discipline: 'Common', spec: 'Text', group: 'Identity Data', binding: 'Instance', categories: [] as string[] }
type Definition = typeof initial
const MODES = ['Parameters', 'Categories', 'Transfer', 'Families'] as const
const SOURCES = ['Shared Parameter', 'Project Parameter']
const SAMPLE_PROJECT_DOCUMENT = 'AT-01 Sample Residence.rvt'

export default function ParameterManager({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [rows, setRows] = useState(existing)
  const [draft, setDraft] = useState<Definition | null>(null)
  const [mode, setMode] = useState<typeof MODES[number]>('Parameters')
  const [showExisting, setShowExisting] = useState(true)
  const [applied, setApplied] = useState<Definition | null>(null)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [copyFrom, setCopyFrom] = useState(existing[0].name)
  const [sampleDocument, setSampleDocument] = useState(SAMPLE_PROJECT_DOCUMENT)
  const [nestedOpen, setNestedOpen] = useState(false)
  const [nestedModel, setNestedModel] = useState(INITIAL_NESTED_MODEL)
  const [nestedNotice, setNestedNotice] = useState('')
  const nestedButton = useRef<HTMLButtonElement>(null)
  const name = draft?.name.trim() ?? ''
  const duplicate = rows.some(row => row.name.toLowerCase() === name.toLowerCase())
  const canApply = Boolean(name && draft?.categories.length && !duplicate)
  const visible = (showExisting ? rows : rows.slice(existing.length)).filter(row => row.name.toLowerCase().includes(query.trim().toLowerCase())
    && (sourceFilter === 'All' || row.source === sourceFilter))
  const familyMode = mode === 'Transfer' || mode === 'Families'
  const familyDocument = sampleDocument === NESTED_SAMPLE_FAMILY
  const change = (change: Partial<Definition>) => {
    if (!draft) return
    setDraft({ ...draft, ...change })
    rewind('apply')
  }

  const apply = () => {
    if (!draft || !canApply) return
    const next = { ...draft, name }
    setRows([...rows, next])
    setDraft(null)
    setApplied(next)
    setMode('Parameters')
    done('apply')
    notify({ kind: 'success', text: next.name + ' bound to ' + next.categories.join(', ') + ' in the sample project.' })
  }

  const add = (definition: Definition) => {
    setDraft(definition)
    setApplied(null)
    rewind('add')
    done('add')
    setMode('Parameters')
  }
  const chooseMode = (tab: typeof MODES[number]) => {
    setMode(tab)
    if (tab === 'Categories' && draft) done('categories')
  }
  const exportDefinitions = () => {
    downloadCsv('AT-01-parameter-definitions.csv', ['Parameter Name', 'Source', 'Discipline', 'Type of Parameter', 'Group Under', 'Instance/Type', 'Categories'],
      rows.map(row => [row.name, row.source, row.discipline, row.spec, row.group, row.binding, row.categories.join('; ')]))
    if (applied) done('csv')
  }
  const closeNested = () => {
    setNestedOpen(false)
    window.requestAnimationFrame(() => nestedButton.current?.focus())
  }
  const nestedTools = <div className="forge-nested-entry">
    <div className="ad-row">
      <button type="button" className="ad-btn" data-demo="nested-parameters" ref={nestedButton} onClick={() => {
        if (!familyDocument) { setNestedNotice('Open a family (.rfa) document to manage nested parameters.'); return }
        setNestedNotice('')
        setNestedOpen(true)
      }}>Nested Parameters</button>
      <label className="forge-document-choice"><span className="ad-label">Sample active document</span>
        <Select label="Sample active document" value={sampleDocument} options={[SAMPLE_PROJECT_DOCUMENT, NESTED_SAMPLE_FAMILY]} onChange={document => {
          setSampleDocument(document)
          setNestedNotice('')
        }} />
      </label>
    </div>
    {nestedNotice && <p className="ad-status" role="status">{nestedNotice}</p>}
  </div>

  return <>
    <div hidden={nestedOpen}>
    <RevitDialog theme={theme} onTheme={setTheme} title="Parameter Manager"
      caption={mode === 'Families' && familyDocument ? `Sample family · ${sampleDocument}` : 'Project parameters · Category bindings'} onClose={close}
      footer={!familyMode && <><span className="ad-status">Total {rows.length + (draft ? 1 : 0)} · Create {draft ? 1 : 0} · Modify 0 · Existing {rows.length}</span>
        <Btn onClick={close}>Close</Btn>
        {draft && <Btn onClick={() => { setDraft(null); setMode('Parameters'); rewind('add') }}>Discard draft</Btn>}
        {mode === 'Parameters' && <Btn onClick={() => chooseMode('Categories')}>Next</Btn>}
        <Btn primary demo="apply-parameter" disabled={!canApply} onClick={apply}>Apply</Btn>
      </>}>
      <div className="ad-tabs" role="group" aria-label="Parameter Manager views">
        {MODES.map(tab => <button key={tab} type="button" className={'ad-tab' + (tab === mode ? ' on' : '')}
          aria-pressed={tab === mode} data-demo={tab === 'Categories' ? 'parameter-categories' : undefined} onClick={() => chooseMode(tab)}>{tab}</button>)}
      </div>
      <div hidden={!familyMode}><ForgeFamilyParameters mode={mode === 'Families' ? 'Families' : 'Transfer'} close={close} nestedTools={nestedTools} familyDocument={familyDocument} /></div>
      {!familyMode && <>
      <div className="ad-row">
        <Btn demo="add-parameter" disabled={Boolean(draft)} onClick={() => add(rows.some(row => row.name === initial.name) ? { ...initial, name: '' } : initial)}>+ Add Parameter</Btn>
        <details className="forge-parameter-menu"><summary>Import/Export</summary><Btn sm onClick={exportDefinitions}>Export to CSV (.csv)</Btn></details>
        <details className="forge-parameter-menu"><summary>Batch Actions</summary><div className="ad-row">
          <Select label="Definition to duplicate" value={copyFrom} options={rows.map(row => row.name)} onChange={setCopyFrom} />
          <Btn sm disabled={Boolean(draft)} onClick={() => { const current = rows.find(row => row.name === copyFrom); if (current) add({ ...current, name: current.name + ' Copy' }) }}>Duplicate Parameter</Btn>
        </div></details>
        <Check label="Show Existing Parameters" checked={showExisting} onChange={setShowExisting} />
        <SearchBox placeholder="Search parameters…" value={query} onChange={setQuery} />
        <span className="ad-status">Completed {applied ? '100%' : '0%'}</span>
      </div>
      <div className="ad-table-wrap suite-flow-table" tabIndex={0} aria-label="Project parameter definitions">
        <table className="ad-table"><thead><tr><th scope="col">Parameter Name</th>
          <th scope="col"><Select label="Parameter source filter" value={sourceFilter} options={['All', ...SOURCES]} onChange={setSourceFilter} /></th>
          {mode === 'Parameters' ? <><th scope="col">Discipline</th><th scope="col">Type of Parameter</th><th scope="col">Group Under</th><th scope="col">Instance/Type</th></> : <th scope="col">Categories</th>}
        </tr></thead><tbody>
          {visible.map(row => <tr key={row.name}><td>{row.name}</td><td>{row.source}</td>{mode === 'Parameters'
            ? <><td>{row.discipline}</td><td>{row.spec}</td><td>{row.group}</td><td>{row.binding}</td></>
            : <td>{row.categories.join(', ')}</td>}</tr>)}
          {draft && <tr>
            <td>{mode === 'Parameters' ? <TextBox aria-label="Parameter name" value={draft.name} maxLength={60} onChange={event => change({ name: event.target.value })} /> : draft.name || 'New parameter'}</td>
            <td>{mode === 'Parameters' ? <Select label="Parameter source" value={draft.source} options={SOURCES} onChange={source => change({ source })} /> : draft.source}</td>
            {mode === 'Parameters' ? <>
              <td><Select label="Discipline" value={draft.discipline} options={['Common', 'Structural', 'Mechanical', 'Electrical', 'Piping']} onChange={discipline => change({ discipline })} /></td>
              <td><Select label="Type of parameter" value={draft.spec} options={['Text', 'Yes/No', 'Integer', 'Number', 'Length']} onChange={spec => change({ spec })} /></td>
              <td><Select label="Group under" value={draft.group} options={['Identity Data', 'Data', 'Materials and Finishes']} onChange={group => change({ group })} /></td>
              <td><Select label="Instance or type" value={draft.binding} options={['Instance', 'Type']} onChange={binding => change({ binding })} /></td>
            </> : <td>{draft.categories.join(', ') || 'Unassigned'}</td>}
          </tr>}
        </tbody></table>
        {!visible.length && !draft && <p className="suite-flow-note">No parameters match the current filters.</p>}
      </div>
      {mode === 'Categories' && draft && <fieldset className="ad-card suite-flow-options" data-demo="assign-categories">
        <legend>Assign categories</legend>
        {categories.map(category => <Check key={category} label={category} checked={draft.categories.includes(category)} onChange={checked => {
          const next = checked ? [...draft.categories, category] : draft.categories.filter(value => value !== category)
          change({ categories: next })
          if (next.length) done('bind')
          else rewind('bind')
        }} />)}
      </fieldset>}
      {draft && duplicate && <p className="suite-flow-error" role="alert">A definition with this name already exists.</p>}
      {applied && <div className="ad-card suite-flow-receipt" role="status">
        <strong>{applied.name} · {applied.binding} · {applied.categories.join(', ')}</strong>
        <div className="ad-row"><Btn demo="parameter-csv" onClick={exportDefinitions}>Export to CSV</Btn></div>
      </div>}
      </>}
    </RevitDialog>
    </div>
    {nestedOpen && <ForgeNestedParameters theme={theme} onTheme={setTheme} model={nestedModel} close={closeNested}
      onApply={(next, result) => { setNestedModel(next); setNestedNotice(nestedAssociationMessage(result)) }} />}
  </>
}
