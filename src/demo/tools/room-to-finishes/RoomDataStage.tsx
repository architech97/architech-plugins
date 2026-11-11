import { useState } from 'react'
import type { DemoContext } from '../../types'
import { DialogShell, Receipt } from '../../kit'
import { Btn, Check, Expander, Select } from '../../ui'
import { applyRoomData, ELEMENT_PARAMETERS, EMPTY_CHOICE, ROOM_PROPERTIES, ROOM_SOURCES, ROOM_DATA_ELEMENTS, ROOM_DATA_STAGE_CATEGORIES, roomDataPlan, roomPropertyName, roomPropertyLabel, elementParameterLabel, type RoomDataSettings } from '../forge-room-data'
import { downloadCsv } from '../../demos/craftedTools'
import '../../demos/suiteWorkflow.css'

export function RoomDataSetup({ settings, onChange }: { settings: RoomDataSettings; onChange: (settings: RoomDataSettings) => void }) {
  const [source, setSource] = useState(EMPTY_CHOICE)
  const [target, setTarget] = useState(EMPTY_CHOICE)
  const [isType, setIsType] = useState(false)
  const [selected, setSelected] = useState<number>()
  const [error, setError] = useState('')
  return <Expander header="Optional next stage · Apply Room data to FF&E">
    <Check label="After finishes, review Room → FF&E parameter writes" checked={settings.enabled} onChange={enabled => onChange({ ...settings, enabled })} />
    <p className="ad-note">Only rooms whose every requested finish succeeded or already existed are eligible. This stage has its own preview and Apply action.</p>
    <label>FF&E category<Select label="FF&E category" value={settings.category} options={ROOM_DATA_STAGE_CATEGORIES} onChange={category => { onChange({ ...settings, category, mappings: [] }); setTarget(EMPTY_CHOICE); setSelected(undefined); setError('') }} /></label>
    <Check label="Include nested elements" checked={settings.nested} onChange={nested => onChange({ ...settings, nested })} />
    <Check label="Write type parameters (affects every instance of that type)" checked={isType} onChange={value => { setIsType(value); setTarget(EMPTY_CHOICE) }} />
    <label>Source Room parameter<select className="ad-select" aria-label="Source Room parameter" value={source} onChange={event => { setSource(event.target.value); setError('') }}>
      <option value={EMPTY_CHOICE}>{EMPTY_CHOICE}</option>{[...ROOM_PROPERTIES].sort((a, b) => roomPropertyLabel(a).localeCompare(roomPropertyLabel(b))).map(value => <option value={value} key={value}>{roomPropertyLabel(value)}</option>)}
    </select></label>
    <label>Target FF&E parameter<select className="ad-select" aria-label="Target FF&E parameter" value={target} onChange={event => { setTarget(event.target.value); setError('') }}>
      <option value={EMPTY_CHOICE}>{EMPTY_CHOICE}</option>{[...ELEMENT_PARAMETERS].sort((a, b) => a.localeCompare(b)).map(value => <option value={value} key={value}>{elementParameterLabel(value)}</option>)}
    </select></label>
    <div className="ad-row">
      <Btn disabled={source === EMPTY_CHOICE || target === EMPTY_CHOICE} onClick={() => {
        if (settings.mappings.some(mapping => mapping.target === target && mapping.isType === isType)) { setError('This target is already mapped. Remove its existing mapping before replacing it.'); return }
        onChange({ ...settings, mappings: [...settings.mappings, { id: Math.max(0, ...settings.mappings.map(mapping => mapping.id)) + 1, source, target, isType }] })
        setError('')
      }}>Add mapping</Btn>
      <Btn disabled={selected === undefined} onClick={() => { onChange({ ...settings, mappings: settings.mappings.filter(mapping => mapping.id !== selected) }); setSelected(undefined); setError('') }}>Remove selected</Btn>
    </div>
    <div className="ad-list" role="listbox" aria-label="FF&E mappings">
      {settings.mappings.map(mapping => <button type="button" key={mapping.id} role="option" aria-selected={selected === mapping.id} className="li" onClick={() => setSelected(mapping.id)}>
        {roomPropertyName(mapping.source)} → {mapping.target} · {mapping.isType ? 'Type' : 'Instance'}
      </button>)}
      {!settings.mappings.length && <span className="ad-note">Choose explicit source and target parameters, then Add mapping.</span>}
    </div>
    {error && <p className="suite-flow-error" role="alert">{error}</p>}
  </Expander>
}

export function RoomDataReview({ settings, eligible, roomValues, onFinish, ...context }: DemoContext & { settings: RoomDataSettings; eligible: string[]; roomValues: Record<string, string>; onFinish: (message: string) => void }) {
  const [model, setModel] = useState(ROOM_DATA_ELEMENTS)
  const [applied, setApplied] = useState(false)
  const calculated = roomDataPlan(ROOM_DATA_ELEMENTS, [settings.category], settings.mappings, ROOM_SOURCES[0], settings.nested, eligible, roomValues)
  const error = typeof calculated === 'string' ? calculated : ''
  const rows = typeof calculated === 'string' ? [] : calculated
  const writable = rows.filter(row => row.writable)
  const summary = !eligible.length ? 'Room data was skipped: no rooms completed every requested finish successfully.' :
    error || (writable.length ? 'Optional room data stage · ' + eligible.length + ' successfully finished room(s) · ' + writable.length + ' proposed values.' : 'No sample FF&E elements in the eligible rooms and category.')
  return <DialogShell theme={context.theme} onTheme={context.setTheme} title="Review finish plan" subtitle={summary}
    onClose={() => onFinish('Room data stage was cancelled after review; finishes remain committed.')}
    footer={<><span className="ad-status">{applied ? 'Room data applied to sample elements' : summary}</span>
      <Btn onClick={() => downloadCsv('AT-01-room-data-plan.csv', ['Room', 'Element', 'Target', 'Before', 'After', 'Status'],
        rows.map(row => [row.room, row.id, row.mapping.target, row.before, row.after, row.status]))}>Export CSV…</Btn>
      <Btn onClick={() => onFinish(applied ? 'Room data stage completed.' : 'Room data stage was cancelled after review; finishes remain committed.')}>{applied ? 'Close' : 'Cancel'}</Btn>
      {!applied && <Btn primary disabled={!!error || !writable.length} onClick={() => {
        setModel(applyRoomData(model, writable)); setApplied(true); context.notify({ kind: 'success', text: writable.length + ' FF&E sample values written after finishing.' })
      }}>Apply reviewed plan</Btn>}</>}>
    <p role="status">{summary}</p>
    <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Optional FF&E preview">
      <table className="ad-table"><thead><tr>{['Room', 'Kind', 'Action', 'Status', 'Existing IDs', 'Reason / review'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.key}><td>{row.room}</td><td>FF&E</td><td>Set {row.mapping.target}</td><td>{applied && row.writable ? 'Applied' : row.status}</td>
          <td>{row.id}</td><td>[{row.before || '—'}] → [{row.after || '—'}]</td></tr>)}</tbody>
      </table>
    </div>
    {applied && <Receipt title="FF&E readback" entries={writable.map(row => ({ label: row.id + ' · ' + row.mapping.target,
      detail: model.find(element => element.id === row.id)?.values[row.mapping.target] ?? '—' }))} />}
  </DialogShell>
}
