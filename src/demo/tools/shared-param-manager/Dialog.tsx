import { useState } from 'react'
import type { DemoContext } from '../../types'
import { ConfirmGuard, DialogShell, Receipt } from '../../kit'
import { Btn, Check, SearchBox, Select, TextBox } from '../../ui'
import { downloadCsv } from '../../demos/craftedTools'
import '../../demos/suiteWorkflow.css'

type Definition = { name: string; type: string; group: string; description: string; guid: string }
type Binding = { guid: string; name: string; mode: string; group: string; categories: string[] }
const DEFINITIONS: Definition[] = [
  { name: 'Fire Rating', type: 'Text', group: 'Life Safety', description: 'Door fire rating', guid: '1f729a56-5e2c-45c2-b2f4-9c7e36d9cbf8' },
  { name: 'Finish Code', type: 'Text', group: 'Finishes', description: 'Finish schedule code', guid: '588325fe-1edc-4323-921b-091697aa3671' },
  { name: 'Room Department', type: 'Text', group: 'Room Data', description: 'Room department label', guid: '1b793e25-f46f-4f02-a785-b2c4f2218111' },
]
const GROUPS = ['Life Safety', 'Finishes', 'Room Data']
const TYPES = ['Text', 'Length', 'Number', 'Yes/No']
const TYPE_NAMES = ['TEXT', 'LENGTH', 'NUMBER', 'YESNO']
const CATEGORIES = ['Casework', 'Doors', 'Floors', 'Furniture', 'Rooms', 'Walls', 'Windows']
const MODES = ['Instance Parameter', 'Type Parameter']
const PROJECT_GROUPS = ['Identity Data', 'Dimensions', 'Materials and Finishes']
const INITIAL_BINDINGS: Binding[] = [{ guid: DEFINITIONS[0].guid, name: DEFINITIONS[0].name, mode: MODES[1], group: PROJECT_GROUPS[0], categories: ['Doors'] }]
const WORKBOOK_EDITS: Definition[] = [
  { ...DEFINITIONS[1], description: 'Coordinated finish code' },
  { name: 'Asset Reference', type: 'Text', group: 'Room Data', description: 'Asset schedule reference', guid: '0da55046-1985-45b7-9239-b93805466011' },
]
type Navigation = 'browse' | 'new' | 'close'

export default function SharedParamManager({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [file, setFile] = useState('')
  const [definitions, setDefinitions] = useState<Definition[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [activeGroup, setActiveGroup] = useState('[All Groups]')
  const [dirty, setDirty] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [bindings, setBindings] = useState(INITIAL_BINDINGS)
  const [step, setStep] = useState<'categories' | 'mode' | 'group' | ''>('')
  const [categories, setCategories] = useState<string[]>([])
  const [mode, setMode] = useState(MODES[0])
  const [projectGroup, setProjectGroup] = useState(PROJECT_GROUPS[0])
  const [message, setMessage] = useState('')
  const [receipt, setReceipt] = useState<{ label: string; detail?: string }[]>([])
  const [pending, setPending] = useState<Navigation>()
  const [deleting, setDeleting] = useState<'definitions' | 'bindings' | ''>('')
  const [showBindings, setShowBindings] = useState(false)
  const [bindingTicks, setBindingTicks] = useState<string[]>([])
  const [workbook, setWorkbook] = useState<'import' | 'export' | ''>('')
  const picked = definitions.filter(definition => selected.includes(definition.guid))
  const shown = definitions.filter(definition => (activeGroup === '[All Groups]' || definition.group === activeGroup) &&
    [definition.name, definition.group, definition.type].some(text => text.toLowerCase().includes(query.trim().toLowerCase())))
  const locked = Boolean(step || workbook)

  function navigate(action: Navigation) {
    if (action === 'close') { close(); return }
    const newFile = action === 'new'
    setFile(newFile ? 'AT-01-New-Definitions.txt' : 'AT-01-Shared-Parameters.txt')
    setDefinitions(newFile ? [] : DEFINITIONS)
    setGroups(newFile ? ['General'] : GROUPS)
    setActiveGroup('[All Groups]')
    setSelected([])
    setQuery('')
    setDirty(false)
    setStep('')
    setWorkbook('')
    setReceipt([])
    setMessage(newFile ? 'Created sample file with the General group.' : 'Loaded the sample definitions file.')
    rewind('definitions')
    done('file')
  }
  function requestNavigation(action: Navigation) {
    if (dirty) setPending(action)
    else navigate(action)
  }
  function validate() {
    const names = new Set<string>()
    for (const definition of definitions) {
      const name = definition.name.trim().toLowerCase()
      if (!name || /[\t\r\n]/.test(definition.name + definition.description)) return 'Enter names and descriptions without tabs or line breaks.'
      if (names.has(name)) return 'Duplicate parameter name: ' + definition.name + '.'
      names.add(name)
    }
    return ''
  }
  function save() {
    const error = validate()
    if (error) { setMessage(error); return false }
    const content = [
      '# Revit shared parameter sample file', '*META\tVERSION\tMINVERSION', 'META\t2\t1', '*GROUP\tID\tNAME',
      ...groups.map((group, index) => 'GROUP\t' + (index + 1) + '\t' + group),
      '*PARAM\tGUID\tNAME\tDATATYPE\tDATACATEGORY\tGROUP\tVISIBLE\tDESCRIPTION\tUSERMODIFIABLE\tHIDEWHENNOVALUE',
      ...definitions.map(definition => ['PARAM', definition.guid, definition.name, TYPE_NAMES[TYPES.indexOf(definition.type)], '',
        groups.indexOf(definition.group) + 1, 1, definition.description, 1, 0].join('\t')),
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = file; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDirty(false)
    setMessage('Saved and downloaded ' + definitions.length + ' sample parameter(s).')
    done('file')
    return true
  }
  function edit(guid: string, patch: Partial<Definition>) {
    setDefinitions(definitions.map(definition => definition.guid === guid ? { ...definition, ...patch } : definition))
    setDirty(true)
    setReceipt([])
    setMessage('')
    rewind('bind')
  }
  function addGroup() {
    let suffix = groups.length + 1
    while (groups.includes('Group ' + suffix)) suffix++
    const group = 'Group ' + suffix
    setGroups([...groups, group]); setActiveGroup(group); setDirty(true)
    setMessage("Added new parameter group '" + group + "'. Click 'Save File' to commit.")
  }
  function addParameter() {
    let suffix = definitions.length + 1
    while (definitions.some(definition => definition.name === 'New_Param_' + suffix)) suffix++
    const definition = { name: 'New_Param_' + suffix, type: 'Text', group: activeGroup === '[All Groups]' ? groups[0] : activeGroup,
      description: 'ARCHITECH Custom Parameter', guid: crypto.randomUUID() }
    setDefinitions([...definitions, definition]); setDirty(true); setSelected([definition.guid]); setQuery('')
    setMessage("Added parameter '" + definition.name + "'. Click 'Save File' to commit.")
    done('definitions')
  }
  function startBinding() {
    if (!picked.length) return
    if (dirty) { setMessage('Save file changes before binding a definition to Revit.'); return }
    setCategories([]); setStep('categories'); setReceipt([]); setMessage('')
  }
  function bind() {
    const next = [...bindings]
    const rows = picked.map(definition => {
      const existing = next.find(binding => binding.guid === definition.guid)
      if (existing && existing.mode !== mode) return { label: definition.name + ' · skipped', detail: 'Already bound as ' + existing.mode + '. Its existing binding is retained.' }
      const combined = [...new Set([...(existing?.categories ?? []), ...categories])]
      const record = { guid: definition.guid, name: definition.name, mode, group: projectGroup, categories: combined }
      if (existing) next[next.indexOf(existing)] = record
      else next.push(record)
      return { label: definition.name + (existing ? ' · updated' : ' · bound'), detail: mode + ' · ' + projectGroup + ' · ' + combined.join(', ') }
    })
    setBindings(next); setReceipt(rows); setStep(''); done('bind')
    notify({ kind: rows.some(row => row.label.endsWith('skipped')) ? 'warning' : 'success', text: 'Sample binding results ready.' })
  }
  function removeConfirmed() {
    if (deleting === 'definitions') {
      setDefinitions(definitions.filter(definition => !selected.includes(definition.guid)))
      setSelected([]); setDirty(true); setMessage('Deleted selected definitions. Click Save File to commit.')
    } else {
      setBindings(bindings.filter(binding => !bindingTicks.includes(binding.guid)))
      setBindingTicks([]); setMessage('Selected sample bindings and their associated sample values removed.')
    }
    setDeleting('')
  }
  function importWorkbook() {
    const next = [...definitions]
    let added = 0, updated = 0
    for (const entry of WORKBOOK_EDITS) {
      const index = next.findIndex(definition => definition.guid === entry.guid)
      if (index >= 0) { next[index] = entry; updated++ }
      else { next.push(entry); added++ }
    }
    setDefinitions(next); setGroups([...new Set([...groups, ...WORKBOOK_EDITS.map(entry => entry.group)])])
    setDirty(true); setWorkbook(''); setActiveGroup('[All Groups]'); setQuery('')
    setMessage('Imported: ' + added + ' added, ' + updated + " updated. Click 'Save File' to commit.")
  }

  return <DialogShell theme={theme} onTheme={setTheme} title="Shared Param Manager" subtitle="Browser simulation · fictional definitions and bindings"
    onClose={() => requestNavigation('close')} footer={<><span className="ad-status">{dirty ? 'Unsaved sample file changes' : file || 'No file loaded'}</span><Btn onClick={() => requestNavigation('close')}>Close</Btn></>}>
    <section className="ad-card suite-flow-fields" aria-label="Shared parameter definitions file">
      <span>{file || 'No file loaded. Browse or create a new file.'}</span>
      <div className="ad-row"><Btn demo="shared-browse" disabled={locked} onClick={() => requestNavigation('browse')}>Browse…</Btn>
        <Btn disabled={locked} onClick={() => requestNavigation('new')}>New File</Btn>
        <Btn disabled={locked || !file} onClick={save}>Save File</Btn></div>
    </section>
    <section className="ad-card suite-flow-fields" data-demo="shared-rows" aria-label="Sample shared parameter definitions">
      <div className="ad-row"><Select label="Parameter group filter" options={['[All Groups]', ...groups]} value={activeGroup} onChange={setActiveGroup} />
        <Btn sm disabled={locked || !file} onClick={addGroup}>+ Add Group</Btn><SearchBox placeholder="Filter parameters" value={query} onChange={setQuery} /></div>
      <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Shared parameters">
        <table className="ad-table"><thead><tr>{['Select', 'Parameter Name', 'Data Type', 'Group', 'Description', 'GUID'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{shown.map(definition => <tr key={definition.guid}>
            <td><Check title={'Select ' + definition.name} checked={selected.includes(definition.guid)} disabled={locked} onChange={checked => {
              setSelected(checked ? [...selected, definition.guid] : selected.filter(guid => guid !== definition.guid)); done('definitions')
            }} /></td>
            <td><TextBox aria-label={'Parameter name ' + definition.guid} value={definition.name} maxLength={80} disabled={locked} onChange={event => edit(definition.guid, { name: event.target.value })} /></td>
            <td><select className="ad-select" aria-label={'Data type for ' + definition.name} disabled={locked} value={definition.type} onChange={event => edit(definition.guid, { type: event.target.value })}>{TYPES.map(type => <option key={type}>{type}</option>)}</select></td>
            <td><select className="ad-select" aria-label={'Group for ' + definition.name} disabled={locked} value={definition.group} onChange={event => edit(definition.guid, { group: event.target.value })}>{groups.map(group => <option key={group}>{group}</option>)}</select></td>
            <td><TextBox aria-label={'Description for ' + definition.name} value={definition.description} maxLength={150} disabled={locked} onChange={event => edit(definition.guid, { description: event.target.value })} /></td>
            <td>{definition.guid}</td>
          </tr>)}</tbody></table>
        {!shown.length && <p className="ad-note">No sample definitions match.</p>}
      </div>
      <div className="ad-row"><Btn disabled={locked || !groups.length} onClick={addParameter}>+ Add Parameter</Btn>
        <Btn disabled={locked || !file} onClick={() => setWorkbook('import')}>Import Excel…</Btn><Btn disabled={locked || !file || !definitions.length} onClick={() => setWorkbook('export')}>Export Excel…</Btn>
        <Btn disabled={locked} onClick={() => setShowBindings(!showBindings)}>Bindings…</Btn>
        <Btn primary demo="shared-bind" disabled={locked || !picked.length} onClick={startBinding}>Bind Selected…</Btn>
        <Btn disabled={locked || !picked.length} onClick={() => setDeleting('definitions')}>Delete Parameter</Btn></div>
    </section>
    {message && <p role="status">{message}</p>}
    {workbook && <section className="ad-card suite-flow-fields" aria-label="Sample workbook">
      <b>{workbook === 'import' ? 'Review sample Excel import' : 'Export shared parameters'}</b>
      <p className="ad-note">The desktop tool reads and writes XLSX files. This browser exercise uses a prepared workbook import and downloads a CSV of the current definitions.</p>
      {workbook === 'import' ? <><ul>{WORKBOOK_EDITS.map(entry => <li key={entry.guid}>{entry.name} · {entry.description}</li>)}</ul><Btn primary onClick={importWorkbook}>Import sample workbook</Btn></> :
        <Btn primary onClick={() => downloadCsv('AT-01-shared-parameters.csv', ['GUID', 'Name', 'Data Type', 'Group', 'Description'],
          definitions.map(entry => [entry.guid, entry.name, entry.type, entry.group, entry.description]))}>Download sample CSV</Btn>}
      <div><Btn onClick={() => setWorkbook('')}>Close preview</Btn></div>
    </section>}
    {step && <section className="ad-card suite-flow-fields" aria-label="Sample binding setup">
      {step === 'categories' && <><b>Bind {picked.length === 1 ? picked[0].name : picked.length + ' parameters'} to Categories</b>
        <p className="ad-note">Select one or more categories. A parameter that is already bound gains these categories.</p>
        <div className="ad-row">{CATEGORIES.map(category => <Check key={category} label={category} checked={categories.includes(category)} onChange={checked => setCategories(checked ? [...categories, category] : categories.filter(value => value !== category))} />)}</div>
        <div className="ad-row"><Btn primary disabled={!categories.length} onClick={() => setStep('mode')}>OK</Btn><Btn onClick={() => setStep('')}>Cancel</Btn></div></>}
      {step === 'mode' && <><b>Parameter Binding Mode</b><p>How should the selected definitions be bound to the {categories.length} selected categories?</p>
        <div className="ad-row">{MODES.map(value => <Btn key={value} onClick={() => { setMode(value); setStep('group') }}>{value}</Btn>)}<Btn onClick={() => setStep('')}>Cancel</Btn></div></>}
      {step === 'group' && <><b>Parameter group</b><p className="ad-note">Where the parameter appears in the Properties palette.</p>
        <Select label="Parameter group" options={PROJECT_GROUPS} value={projectGroup} onChange={setProjectGroup} />
        <div className="ad-row"><Btn primary onClick={bind}>OK</Btn><Btn onClick={() => setStep('')}>Cancel</Btn></div></>}
    </section>}
    {!!receipt.length && <Receipt title="Sample binding results" entries={receipt} />}
    {showBindings && <section className="ad-card suite-flow-fields" aria-label="Project parameter bindings">
      <b>Project parameter bindings ({bindings.length})</b>
      <p className="ad-note">Select bindings to remove. Removing a binding deletes that parameter’s values from every sample element.</p>
      {bindings.map(binding => <Check key={binding.guid} label={binding.name + ' · ' + binding.mode + ' · ' + binding.categories.join(', ')}
        checked={bindingTicks.includes(binding.guid)} onChange={checked => setBindingTicks(checked ? [...bindingTicks, binding.guid] : bindingTicks.filter(guid => guid !== binding.guid))} />)}
      <div className="ad-row"><Btn disabled={!bindingTicks.length} onClick={() => setDeleting('bindings')}>Remove</Btn><Btn onClick={() => setShowBindings(false)}>Close bindings</Btn></div>
    </section>}
    <ConfirmGuard open={!!pending} theme={theme} onTheme={setTheme} title="Unsaved changes" instruction="Save shared-parameter changes before continuing?"
      content={<Btn onClick={() => { const action = pending; setPending(undefined); setDirty(false); if (action) navigate(action) }}>Discard changes</Btn>}
      confirmLabel="Save changes" cancelLabel="Cancel" onConfirm={() => { if (save()) { const action = pending; setPending(undefined); if (action) navigate(action) } }} onCancel={() => setPending(undefined)} />
    <ConfirmGuard open={!!deleting} theme={theme} onTheme={setTheme} title={deleting === 'definitions' ? 'Shared Param Manager' : 'Remove bindings'}
      instruction={deleting === 'definitions' ? 'Delete ' + picked.length + ' parameter(s) from the shared parameter file?' : 'Remove ' + bindingTicks.length + ' binding(s)?'}
      content={deleting === 'definitions' ? 'Save File commits the edited sample definitions.' : 'Their values are deleted from the sample project.'}
      confirmLabel={deleting === 'definitions' ? 'Yes' : 'Remove'} cancelLabel={deleting === 'definitions' ? 'No' : 'Cancel'}
      onConfirm={removeConfirmed} onCancel={() => setDeleting('')} />
  </DialogShell>
}
