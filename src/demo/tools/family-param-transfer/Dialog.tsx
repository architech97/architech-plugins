import { useId, useState } from 'react'
import type { DemoContext } from '../../types'
import { ConfirmGuard, DialogShell, Receipt } from '../../kit'
import { Btn, Check, Radio, SearchBox, Select, TextBox } from '../../ui'
import '../../demos/suiteWorkflow.css'

interface Definition { id: string; name: string; kind: string; binding: string; type: string; group: string }
const PARAMETERS: Definition[] = [
  { id: 'shared-hardware', name: 'Hardware Set', kind: 'Shared', binding: 'Type', type: 'Text', group: 'Identity Data' },
  { id: 'family-width', name: 'Clear Opening Width', kind: 'Family', binding: 'Type', type: 'Length', group: 'Dimensions' },
  { id: 'shared-fire', name: 'Fire Rating', kind: 'Shared', binding: 'Type', type: 'Text', group: 'Identity Data' },
]
const FAMILIES = ['Door – Single Flush', 'Door – Double Flush', 'Window – Fixed', 'Dining Chair']
const RFA_FILES = FAMILIES.map(name => 'Sample Library/' + name + '.rfa')
const EMPTY = '— Choose —'
const INITIAL = {
  [FAMILIES[0]]: PARAMETERS,
  [FAMILIES[1]]: [PARAMETERS[2]],
  [FAMILIES[2]]: [],
  [FAMILIES[3]]: [],
} as Record<string, Definition[]>
type Endpoint = { family: string; loaded: boolean; display: string }
type TransferPlan = { target: Endpoint; definitions: Definition[]; unsaved: boolean }

export default function FamilyParamTransfer({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const id = useId()
  const [sharedFile, setSharedFile] = useState('')
  const [sourceMode, setSourceMode] = useState('Shared parameter file')
  const [sourceFamily, setSourceFamily] = useState(EMPTY)
  const [sourceFile, setSourceFile] = useState('')
  const [loadedSource, setLoadedSource] = useState('')
  const [definitions, setDefinitions] = useState<Definition[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [targetMode, setTargetMode] = useState('Loaded family')
  const [targetFamily, setTargetFamily] = useState(EMPTY)
  const [targetFile, setTargetFile] = useState('')
  const [families, setFamilies] = useState(INITIAL)
  const [unsaved, setUnsaved] = useState(false)
  const [picker, setPicker] = useState<'shared' | 'source' | 'target' | ''>('')
  const [pickFile, setPickFile] = useState(RFA_FILES[0])
  const [confirm, setConfirm] = useState<TransferPlan>()
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<{ label: string; detail?: string }[]>([])
  const shown = definitions.filter(parameter => parameter.name.toLowerCase().includes(query.trim().toLowerCase()))
  const picked = definitions.filter(parameter => selected.includes(parameter.id))
  const currentSource = sourceMode === 'Shared parameter file' ? sharedFile : sourceMode === 'Loaded family' ? sourceFamily === EMPTY ? '' : sourceFamily : sourceFile
  const canLoad = Boolean(currentSource)
  const targetKey = targetMode === 'Loaded family' ? targetFamily === EMPTY ? '' : targetFamily : FAMILIES[RFA_FILES.indexOf(targetFile)] ?? ''
  const target: Endpoint = { family: targetKey, loaded: targetMode === 'Loaded family', display: targetMode === 'Loaded family' ? targetFamily : targetFile }

  function clearOutput() {
    setError('')
    setReceipt([])
    setConfirm(undefined)
    rewind('run')
  }
  function familyForFile(path: string) {
    return FAMILIES[RFA_FILES.indexOf(path)] ?? ''
  }
  function load() {
    if (sourceMode === 'Shared parameter file' && sharedFile !== 'AT-01-Shared-Parameters.txt') {
      setError('Use Browse to select the prepared AT-01-Shared-Parameters.txt sample file. This browser simulation does not read workstation files.')
      return
    }
    const fromFamily = sourceMode === 'Loaded family' ? sourceFamily : sourceMode === 'Browse .rfa' ? familyForFile(sourceFile) : ''
    if (sourceMode !== 'Shared parameter file' && !families[fromFamily]) {
      setError('Choose one of the prepared sample family files or loaded families.')
      return
    }
    const rows = sourceMode === 'Shared parameter file' ? PARAMETERS.filter(parameter => parameter.kind === 'Shared') : families[fromFamily]
    setDefinitions(rows)
    setSelected([])
    setLoadedSource(fromFamily)
    setQuery('')
    clearOutput()
    done('configure')
  }
  function requestTransfer() {
    if (!picked.length || !targetKey) return
    if (loadedSource && loadedSource === targetKey) {
      setError('Source and target are the same family — pick a different target.')
      return
    }
    setConfirm({ target, definitions: picked, unsaved })
    setError('')
    done('run')
  }
  function apply() {
    if (!confirm) return
    const existing = families[confirm.target.family] ?? []
    const next = [...existing]
    let added = 0
    const rows = confirm.definitions.map(parameter => {
      const same = next.find(item => item.id === parameter.id)
      const collision = next.find(item => item.name === parameter.name && item.id !== parameter.id)
      if (same) return { label: parameter.name + ' · skipped', detail: parameter.kind === 'Shared' ? 'Shared parameter already present (same GUID).' : 'Family parameter already present.' }
      if (collision) return { label: parameter.name + ' · skipped', detail: 'A different parameter with the same name is already present.' }
      next.push(parameter)
      added++
      return { label: parameter.name + ' · added', detail: parameter.type + ' · ' + parameter.binding + (parameter.kind === 'Shared' ? ' · shared GUID retained' : ' · family definition') }
    })
    setFamilies({ ...families, [confirm.target.family]: next })
    setReceipt([...rows, { label: confirm.target.display, detail: confirm.unsaved
      ? 'Already open with unsaved edits · changed and left open for you to ' + (confirm.target.loaded ? 'load into the sample project.' : 'save.')
      : confirm.target.loaded ? 'Reloaded into the sample project.' : 'Saved to the sample family file.' }])
    setConfirm(undefined)
    done('apply')
    notify({ kind: added === confirm.definitions.length ? 'success' : 'info', text: added + ' added, ' + (confirm.definitions.length - added) + ' skipped in the sample target.' })
  }
  function browse(kind: typeof picker) {
    setPicker(kind)
    setPickFile(kind === 'target' ? RFA_FILES[1] : RFA_FILES[0])
  }

  return <DialogShell theme={theme} onTheme={setTheme} title="Family Param Transfer" subtitle="Copy parameter definitions from one family into another. Shared parameters keep their GUID."
    onClose={close} footer={<><span className="ad-status">{picked.length} parameter(s) selected</span>
      <Btn onClick={close}>Close</Btn><Btn primary demo="family-transfer" disabled={!picked.length || !targetKey} onClick={requestTransfer}>Transfer</Btn></>}>
    <section className="ad-card suite-flow-fields" data-demo="family-source" aria-label="Shared parameter file">
      <b>1 · Shared parameter file</b>
      <p className="ad-note">Select the prepared sample file used to resolve shared definitions by GUID.</p>
      <div className="ad-row"><TextBox aria-label="Shared parameter file" value={sharedFile} onChange={event => { setSharedFile(event.target.value); clearOutput() }} />
        <Btn aria-label="Browse shared parameter file" onClick={() => browse('shared')}>Browse…</Btn></div>
    </section>
    <section className="ad-card suite-flow-fields" aria-label="Source parameters">
      <b>2 · Source parameters</b>
      <div className="ad-row">{['Shared parameter file', 'Loaded family', 'Browse .rfa'].map(value => <Radio key={value} name={id + '-source'} label={value} checked={sourceMode === value} onChange={() => { setSourceMode(value); clearOutput() }} />)}</div>
      {sourceMode === 'Loaded family' && <Select label="Source family" value={sourceFamily} options={[EMPTY, ...FAMILIES]} onChange={value => { setSourceFamily(value); clearOutput() }} />}
      {sourceMode === 'Browse .rfa' && <div className="ad-row"><TextBox aria-label="Source family file" value={sourceFile} onChange={event => { setSourceFile(event.target.value); clearOutput() }} /><Btn aria-label="Browse source family file" onClick={() => browse('source')}>Browse…</Btn></div>}
      <div className="ad-row"><Btn disabled={!canLoad} onClick={load}>Load parameters</Btn></div>
    </section>
    {picker && <section className="ad-card suite-flow-fields" aria-label="Prepared sample files">
      <b>Choose a prepared {picker === 'shared' ? 'shared parameter' : 'family'} file</b>
      {picker === 'shared' ? <span>AT-01-Shared-Parameters.txt</span> : <Select label="Prepared family file" value={pickFile} options={RFA_FILES} onChange={setPickFile} />}
      <div className="ad-row"><Btn primary onClick={() => {
        if (picker === 'shared') setSharedFile('AT-01-Shared-Parameters.txt')
        if (picker === 'source') setSourceFile(pickFile)
        if (picker === 'target') setTargetFile(pickFile)
        setPicker('')
        clearOutput()
      }}>Open sample</Btn><Btn onClick={() => setPicker('')}>Cancel</Btn></div>
    </section>}
    <section className="ad-card suite-flow-fields" data-demo="family-parameters" aria-label="Parameters to transfer">
      <div className="ad-row"><b>3 · Parameters to transfer</b><SearchBox placeholder="Filter parameters" value={query} onChange={setQuery} />
        <Btn sm disabled={!shown.length} onClick={() => { setSelected([...new Set([...selected, ...shown.map(parameter => parameter.id)])]); clearOutput() }}>Select all</Btn>
        <Btn sm disabled={!selected.length} onClick={() => { setSelected([]); clearOutput() }}>Clear</Btn></div>
      <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Sample parameter definitions">
        <table className="ad-table"><thead><tr>{['Transfer', 'Parameter', 'Kind', 'Binding', 'Type', 'Group'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{shown.map(parameter => <tr key={parameter.id}>
            <td><Check title={'Transfer ' + parameter.name} checked={selected.includes(parameter.id)} onChange={checked => { setSelected(checked ? [...selected, parameter.id] : selected.filter(value => value !== parameter.id)); clearOutput() }} /></td>
            <td>{parameter.name}</td><td>{parameter.kind}</td><td>{parameter.binding}</td><td>{parameter.type}</td><td>{parameter.group}</td>
          </tr>)}</tbody>
        </table>
        {!shown.length && <p className="ad-note">Choose a source in section 2 and press Load parameters. Its parameters are listed here.</p>}
      </div>
    </section>
    <section className="ad-card suite-flow-fields" aria-label="Target family">
      <b>4 · Target family</b>
      <div className="ad-row">{['Loaded family', 'Browse .rfa'].map(value => <Radio key={value} name={id + '-target'} label={value} checked={targetMode === value} onChange={() => { setTargetMode(value); clearOutput() }} />)}</div>
      {targetMode === 'Loaded family' ? <Select label="Target family" value={targetFamily} options={[EMPTY, ...FAMILIES]} onChange={value => { setTargetFamily(value); clearOutput() }} /> :
        <div className="ad-row"><TextBox aria-label="Target family file" value={targetFile} onChange={event => { setTargetFile(event.target.value); clearOutput() }} /><Btn aria-label="Browse target family file" onClick={() => browse('target')}>Browse…</Btn></div>}
      <details><summary>Sample target context</summary><Check label="Target already open with unsaved edits" checked={unsaved} onChange={value => { setUnsaved(value); clearOutput() }} /></details>
    </section>
    {error && <p className="suite-flow-error" role="alert">{error}</p>}
    <ConfirmGuard open={!!confirm} theme={theme} onTheme={setTheme} title="Family Param Transfer confirmation" instruction={'Transfer ' + (confirm?.definitions.length ?? 0) + ' parameter(s) into ' + (confirm?.target.display ?? '') + '?'}
      content="Shared parameters keep their GUID. The target family will be reloaded into the project or saved to disk, unless it is already open with unsaved edits — then it is changed but left for you to load or save."
      confirmLabel="Yes" cancelLabel="No" onConfirm={apply} onCancel={() => setConfirm(undefined)} />
    {!!receipt.length && <Receipt title="Sample family transfer report" entries={receipt} />}
    <details className="ad-card"><summary>Read back sample target definitions</summary><ul>{(families[targetKey] ?? []).map(parameter => <li key={parameter.id}>{parameter.name} · {parameter.kind} · {parameter.type}</li>)}</ul></details>
  </DialogShell>
}
