import { useState } from 'react'
import type { DemoContext } from '../../types'
import { DialogShell, Receipt } from '../../kit'
import { Btn, Check, SearchBox, Select, TextBox } from '../../ui'
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
const CATEGORIES = ['Casework', 'Doors', 'Floors', 'Furniture', 'Rooms', 'Walls', 'Windows']
const MODES = ['Instance Parameter', 'Type Parameter']
const PROJECT_GROUPS = ['Identity Data', 'Dimensions', 'Materials and Finishes']
const INITIAL_BINDINGS: Binding[] = [
  { guid: DEFINITIONS[0].guid, name: DEFINITIONS[0].name, mode: MODES[1], group: PROJECT_GROUPS[0], categories: ['Doors'] },
]

export default function SharedParamManager({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [file, setFile] = useState('')
  const [definitions, setDefinitions] = useState<Definition[]>([])
  const [groups, setGroups] = useState(GROUPS)
  const [dirty, setDirty] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [add, setAdd] = useState<'Group' | 'Parameter' | ''>('')
  const [name, setName] = useState('')
  const [type, setType] = useState(TYPES[0])
  const [group, setGroup] = useState(GROUPS[0])
  const [bindings, setBindings] = useState(INITIAL_BINDINGS)
  const [step, setStep] = useState<'categories' | 'mode' | 'group' | ''>('')
  const [categories, setCategories] = useState<string[]>([])
  const [mode, setMode] = useState(MODES[0])
  const [projectGroup, setProjectGroup] = useState(PROJECT_GROUPS[0])
  const [message, setMessage] = useState('')
  const [receipt, setReceipt] = useState<{ label: string; detail?: string }[]>([])
  const picked = definitions.filter(definition => selected.includes(definition.guid))
  const shown = definitions.filter(definition => [definition.name, definition.group, definition.type].some(text => text.toLowerCase().includes(query.trim().toLowerCase())))
  const locked = Boolean(step)

  function openSample(newFile: boolean) {
    setFile(newFile ? 'Sample Residence - New definitions.txt' : 'Sample Residence - Shared parameters.txt')
    setDefinitions(newFile ? [] : DEFINITIONS)
    setGroups(GROUPS)
    setSelected([])
    setQuery('')
    setDirty(newFile)
    setAdd('')
    setStep('')
    setReceipt([])
    setMessage('')
    rewind('definitions')
    done('file')
  }

  function addItem() {
    const value = name.trim()
    const names = add === 'Group' ? groups : definitions.map(definition => definition.name)
    if (!value || names.some(existing => existing.toLowerCase() === value.toLowerCase())) {
      setMessage('Enter a unique ' + add.toLowerCase() + ' name.')
      return
    }
    if (add === 'Group') {
      setGroups([...groups, value])
      setGroup(value)
    } else {
      const guid = crypto.randomUUID()
      setDefinitions([...definitions, { name: value, type, group, description: '', guid }])
      setSelected([guid])
      done('definitions')
    }
    setDirty(true)
    setAdd('')
    setMessage('')
  }

  function startBinding() {
    if (!picked.length) return
    if (dirty) {
      setMessage('Save file changes before binding a definition to Revit.')
      return
    }
    setCategories([])
    setStep('categories')
    setReceipt([])
    setMessage('')
  }

  function bind() {
    const next = [...bindings]
    let added = 0
    let extended = 0
    const rows = picked.map(definition => {
      const existing = next.find(binding => binding.guid === definition.guid)
      if (existing && existing.mode !== mode) return { label: definition.name + ' · skipped',
        detail: 'Already bound as ' + existing.mode + '. Its existing binding is retained.' }
      const combined = [...new Set([...(existing?.categories ?? []), ...categories])]
      const record = { guid: definition.guid, name: definition.name, mode, group: projectGroup, categories: combined }
      if (existing) {
        next[next.indexOf(existing)] = record
        extended++
      } else {
        next.push(record)
        added++
      }
      return { label: definition.name + (existing ? ' · updated' : ' · bound'), detail: mode + ' · ' + projectGroup + ' · ' + combined.join(', ') }
    })
    setBindings(next)
    setReceipt(rows)
    setStep('')
    done('bind')
    notify({ kind: added + extended === rows.length ? 'success' : 'warning',
      text: 'Bound ' + added + ' new, updated ' + extended + ' existing sample bindings.' })
  }

  return <DialogShell theme={theme} onTheme={setTheme} title="Shared Param Manager" subtitle="Browser simulation · fictional definitions and bindings"
    onClose={close} footer={<><span className="ad-status">{dirty ? 'Unsaved sample file changes' : file ? 'Sample definitions file saved' : 'No file loaded'}</span>
      <Btn onClick={close}>Close</Btn></>}>
    <section className="ad-card suite-flow-fields" aria-label="Shared parameter definitions file">
      <span>{file || 'No file loaded. Browse or create a new file.'}</span>
      <div className="ad-row">
        <Btn demo="shared-browse" disabled={locked || dirty} onClick={() => openSample(false)}>Browse…</Btn>
        <Btn disabled={locked || dirty} onClick={() => openSample(true)}>New File</Btn>
        <Btn disabled={locked || !file || !dirty} onClick={() => { setDirty(false); setMessage('Sample definitions saved.'); done('file') }}>Save File</Btn>
      </div>
    </section>
    {file && <section className="ad-card suite-flow-fields" data-demo="shared-rows" aria-label="Sample shared parameter definitions">
      <div className="ad-row">
        <SearchBox placeholder="Filter parameters" value={query} onChange={setQuery} />
        <Btn sm disabled={locked} onClick={() => { setAdd('Group'); setName('') }}>+ Add Group</Btn>
        <Btn sm disabled={locked} onClick={() => { setAdd('Parameter'); setName('') }}>+ Add Parameter</Btn>
      </div>
      {add && <div className="ad-row">
        <TextBox aria-label={add + ' name'} placeholder={add + ' name'} maxLength={60} value={name} onChange={event => setName(event.target.value)} />
        {add === 'Parameter' && <><Select label="Data Type" options={TYPES} value={type} onChange={setType} /><Select label="Group" options={groups} value={group} onChange={setGroup} /></>}
        <Btn onClick={() => setAdd('')}>Cancel</Btn><Btn primary onClick={addItem}>Add {add}</Btn>
      </div>}
      <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Shared parameters">
        <table className="ad-table"><thead><tr>{['Select', 'Parameter Name', 'Data Type', 'Group', 'Description', 'GUID'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{shown.map(definition => <tr key={definition.guid}>
            <td><Check title={'Select ' + definition.name} checked={selected.includes(definition.guid)} disabled={locked} onChange={checked => {
              setSelected(checked ? [...selected, definition.guid] : selected.filter(guid => guid !== definition.guid))
              done('definitions')
            }} /></td>
            <td>{definition.name}</td><td>{definition.type}</td><td>{definition.group}</td><td>{definition.description || '—'}</td><td>{definition.guid}</td>
          </tr>)}</tbody>
        </table>
        {!shown.length && <p className="ad-note">No sample definitions match.</p>}
      </div>
      <div className="ad-row"><Btn primary demo="shared-bind" disabled={locked || !picked.length} onClick={startBinding}>Bind Selected…</Btn></div>
    </section>}
    {message && <p role="status">{message}</p>}
    {step && <section className="ad-card suite-flow-fields" aria-label="Sample binding setup">
      {step === 'categories' && <>
        <b>Bind {picked.length === 1 ? picked[0].name : picked.length + ' parameters'} to Categories</b>
        <p className="ad-note">Select one or more categories. A parameter that is already bound gains these categories.</p>
        <div className="ad-row">{CATEGORIES.map(category => <Check key={category} label={category} checked={categories.includes(category)} onChange={checked =>
          setCategories(checked ? [...categories, category] : categories.filter(value => value !== category))} />)}</div>
        <div className="ad-row"><Btn primary disabled={!categories.length} onClick={() => setStep('mode')}>OK</Btn><Btn onClick={() => setStep('')}>Cancel</Btn></div>
      </>}
      {step === 'mode' && <>
        <b>Parameter Binding Mode</b><p>How should the selected definitions be bound to the {categories.length} selected categories?</p>
        <div className="ad-row">{MODES.map(value => <Btn key={value} onClick={() => { setMode(value); setStep('group') }}>{value}</Btn>)}<Btn onClick={() => setStep('')}>Cancel</Btn></div>
      </>}
      {step === 'group' && <>
        <b>Parameter group</b><p className="ad-note">Where the parameter appears in the Properties palette.</p>
        <Select label="Parameter group" options={PROJECT_GROUPS} value={projectGroup} onChange={setProjectGroup} />
        <div className="ad-row"><Btn primary onClick={bind}>OK</Btn><Btn onClick={() => setStep('')}>Cancel</Btn></div>
      </>}
    </section>}
    {!!receipt.length && <Receipt title="Sample binding results" entries={receipt} />}
    <details className="ad-card"><summary>Bindings… · {bindings.length} sample project bindings</summary>
      <ul>{bindings.map(binding => <li key={binding.guid}>{binding.name} · {binding.mode} · {binding.categories.join(', ')}</li>)}</ul>
    </details>
  </DialogShell>
}
