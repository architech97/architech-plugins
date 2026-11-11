import { useState } from 'react'
import type { DemoContext } from '../../types'
import { DialogShell, Receipt } from '../../kit'
import { Btn, Check, Select } from '../../ui'
import { applyRoomData, ELEMENT_PARAMETERS, EMPTY_CHOICE, ROOM_DATA_CATEGORIES, ROOM_DATA_ELEMENTS, ROOM_PROPERTIES, ROOM_SOURCES, roomDataPlan, roomPropertyName, roomPropertyLabel, elementParameterLabel, type RoomDataRow, type RoomMapping } from '../forge-room-data'
import '../../demos/suiteWorkflow.css'
import './style.css'

type Preset = { source: string; categories: string[]; mappings: RoomMapping[]; nested: boolean }
export default function AssignRoomProperties({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [source, setSource] = useState(ROOM_SOURCES[0])
  const [categories, setCategories] = useState<string[]>([])
  const [property, setProperty] = useState(EMPTY_CHOICE)
  const [binding, setBinding] = useState('Instance')
  const [target, setTarget] = useState(EMPTY_CHOICE)
  const [mappings, setMappings] = useState<RoomMapping[]>([])
  const [mappingId, setMappingId] = useState(0)
  const [selectedMappings, setSelectedMappings] = useState<number[]>([])
  const [nested, setNested] = useState(true)
  const [model, setModel] = useState(ROOM_DATA_ELEMENTS)
  const [plan, setPlan] = useState<RoomDataRow[]>()
  const [ticked, setTicked] = useState<string[]>([])
  const [result, setResult] = useState<RoomDataRow[]>()
  const [preset, setPreset] = useState<Preset>()
  const [error, setError] = useState('')

  function invalidate() {
    setPlan(undefined)
    setResult(undefined)
    setError('')
    rewind('run')
  }

  function add() {
    if (property === EMPTY_CHOICE || target === EMPTY_CHOICE || !categories.length) return
    if (mappings.some(mapping => mapping.target === target && mapping.isType === (binding === 'Type'))) {
      setError('This target is already mapped. Remove its existing mapping before replacing it.')
      return
    }
    setMappings([...mappings, { id: mappingId + 1, source: property, target, isType: binding === 'Type' }])
    setMappingId(mappingId + 1)
    invalidate()
    done('configure')
  }

  function preview() {
    const rows = roomDataPlan(model, categories, mappings, source, nested)
    if (typeof rows === 'string') {
      setError(rows)
      return
    }
    setPlan(rows)
    setTicked(rows.filter(row => row.writable).map(row => row.key))
    setError('')
    done('configure')
    done('run')
  }

  function apply() {
    if (!plan) return
    const rows = plan.filter(row => ticked.includes(row.key) && row.writable)
    if (!rows.length) return
    setModel(applyRoomData(model, rows))
    setResult(rows)
    setPlan(undefined)
    done('apply')
    notify({ kind: 'success', text: rows.length + ' sample room-property values written.' })
  }

  const mapLabel = (mapping: RoomMapping) => roomPropertyName(mapping.source) + ' → ' + mapping.target + ', ' + (mapping.isType ? 'Type' : 'Instance')
  return <DialogShell theme={theme} onTheme={setTheme} title="Assign Room Properties" subtitle="Browser simulation, fictional Sample Residence"
    onClose={close} footer={<><span className="ad-status">{mappings.length} mapping(s) across {categories.length} categories</span>
      <Btn onClick={close}>Cancel</Btn><Btn primary demo="assign-preview" disabled={!categories.length || !mappings.length || !!plan} onClick={preview}>Assign</Btn></>}>
    <label className="assign-source"><span>Rooms from</span><Select label="Rooms from" options={ROOM_SOURCES} value={source} onChange={value => {
      setSource(value)
      setMappings([])
      setSelectedMappings([])
      setProperty(EMPTY_CHOICE)
      invalidate()
    }} /><span className="ad-note">9 placed sample rooms, Coordination phase</span></label>
    <div className="assign-layout" data-demo="assign-configure">
      <fieldset className="ad-card suite-flow-fields assign-categories"><legend>Categories</legend>
        {ROOM_DATA_CATEGORIES.map(category => <Check key={category} label={category} checked={categories.includes(category)} onChange={checked => {
          setCategories(checked ? [...categories, category] : categories.filter(value => value !== category))
          setTarget(EMPTY_CHOICE)
          invalidate()
        }} />)}
      </fieldset>
      <section className="ad-card suite-flow-fields" aria-label="Mappings">
        <b className="ad-label">Mappings</b>
        <div className="assign-builder">
          <label>Room property<select className="ad-select" aria-label="Room property" value={property} onChange={event => { setProperty(event.target.value); setError('') }}>
            <option value={EMPTY_CHOICE}>{EMPTY_CHOICE}</option>{[...ROOM_PROPERTIES].sort((a, b) => roomPropertyLabel(a).localeCompare(roomPropertyLabel(b))).map(value => <option value={value} key={value}>{roomPropertyLabel(value)}</option>)}
          </select></label>
          <label>On<Select label="Parameter scope" value={binding} options={['Instance', 'Type']} onChange={value => { setBinding(value); setTarget(EMPTY_CHOICE) }} /></label>
          <label>Element parameter<select className="ad-select" aria-label="Element parameter" disabled={!categories.length} value={target} onChange={event => { setTarget(event.target.value); setError('') }}>
            <option value={EMPTY_CHOICE}>{EMPTY_CHOICE}</option>{[...ELEMENT_PARAMETERS].sort((a, b) => a.localeCompare(b)).map(value => <option value={value} key={value}>{elementParameterLabel(value)}</option>)}
          </select></label>
          <Btn disabled={!categories.length || property === EMPTY_CHOICE || target === EMPTY_CHOICE} onClick={add}>Add</Btn>
        </div>
        <div className="ad-list" role="listbox" aria-label="Room property mappings" aria-multiselectable="true" onKeyDown={event => {
          if (event.key === 'Delete' && selectedMappings.length) {
            setMappings(mappings.filter(mapping => !selectedMappings.includes(mapping.id)))
            setSelectedMappings([])
            invalidate()
          }
        }}>
          {mappings.map(mapping => <button type="button" key={mapping.id} className="li" role="option" aria-selected={selectedMappings.includes(mapping.id)}
            onClick={() => setSelectedMappings(selectedMappings.includes(mapping.id) ? selectedMappings.filter(id => id !== mapping.id) : [...selectedMappings, mapping.id])}>{mapLabel(mapping)}</button>)}
          {!mappings.length && <p className="ad-note">Build a mapping above and press Add.</p>}
        </div>
      </section>
    </div>
    <div className="ad-row">
      <Btn disabled={!mappings.length} onClick={() => { setPreset({ source, categories, mappings, nested }); notify({ kind: 'info', text: 'Saved the sample mapping definition. No sample values changed.' }) }}>Save preset</Btn>
      <Btn disabled={!preset} onClick={() => { if (preset) { setSource(preset.source); setCategories(preset.categories); setMappings(preset.mappings); setNested(preset.nested); setSelectedMappings([]); invalidate() } }}>Load preset</Btn>
      <Check label="Include nested family components" checked={nested} onChange={value => { setNested(value); invalidate() }} />
      <Btn disabled={!selectedMappings.length} onClick={() => { setMappings(mappings.filter(mapping => !selectedMappings.includes(mapping.id))); setSelectedMappings([]); invalidate() }}>Remove</Btn>
      <Btn disabled={!mappings.length} onClick={() => { setMappings([]); setSelectedMappings([]); invalidate() }}>Clear</Btn>
    </div>
    {error && <p className="suite-flow-error" role="alert">{error}</p>}
    {plan && <section className="ad-card suite-flow-fields" aria-label="Room-property write preview">
      <b>Review room-property values</b>
      <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Assignment preview rows">
        <table className="ad-table"><thead><tr>{['Apply', 'Element', 'Room', 'Target', 'Before', 'After', 'Status'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{plan.map(row => <tr key={row.key}>
            <td><Check title={'Apply ' + row.id + ' ' + row.mapping.target} checked={ticked.includes(row.key)} disabled={!row.writable}
              onChange={checked => setTicked(checked ? [...ticked, row.key] : ticked.filter(key => key !== row.key))} /></td>
            <td>{row.id}, {row.element}</td><td>{row.room}</td><td>{row.mapping.target}, {row.mapping.isType ? 'Type' : 'Instance'}</td>
            <td>{row.before || '—'}</td><td>{row.after || '—'}</td><td>{row.status}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="ad-row"><Btn primary demo="gen-apply" disabled={!ticked.length} onClick={apply}>Apply to sample</Btn><Btn onClick={() => setPlan(undefined)}>Cancel preview</Btn></div>
    </section>}
    {result && <Receipt title="Sample assignment readback" entries={result.map(row => ({
      label: row.id + ', ' + row.mapping.target,
      detail: (row.before || '—') + ' → ' + (model.find(element => element.id === row.id)?.values[row.mapping.target] ?? row.after),
    }))} />}
  </DialogShell>
}
