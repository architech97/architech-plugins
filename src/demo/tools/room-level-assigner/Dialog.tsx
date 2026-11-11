import { useState } from 'react'
import type { DemoContext } from '../../types'
import { ConfirmGuard, DialogShell, Receipt, ScopeRadios } from '../../kit'
import { Btn, Check, SearchBox, Select } from '../../ui'
import { sampleResidence } from '../../fixtures/sampleResidence'
import { downloadCsv } from '../../demos/craftedTools'
import '../../demos/suiteWorkflow.css'

const LEVELS = sampleResidence.levels.map(level => level.name)
const ROOMS = sampleResidence.rooms.map(room => ({ id: room.id, number: room.number, name: room.name, level: room.level, tags: room.number === '101' ? 2 : 1 }))
type Room = typeof ROOMS[number]
type Job = { room: Room; target: string }
type Result = { job: Job; newId?: number; status: string }

export default function RoomLevelAssigner({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [scope, setScope] = useState('Active view')
  const [query, setQuery] = useState('')
  const [rooms, setRooms] = useState(ROOMS)
  const [target, setTarget] = useState<Record<number, string>>({})
  const [selected, setSelected] = useState<number[]>(() => ROOMS.filter(room => room.level === 'Level 01').map(room => room.id))
  const [pending, setPending] = useState<Job[]>([])
  const [result, setResult] = useState<Result[]>([])
  const shown = rooms.filter(room => (scope === 'Entire model' || room.level === 'Level 01') &&
    (room.number + ' ' + room.name).toLowerCase().includes(query.trim().toLowerCase()))
  const jobs = shown.flatMap(room => selected.includes(room.id) && target[room.id] && room.level !== target[room.id]
    ? [{ room, target: target[room.id] }] : [])

  function apply() {
    if (!pending.length) return
    let nextId = Math.max(9800, ...rooms.map(room => room.id)) + 1
    const receipts: Result[] = pending.map(job => job.target === 'Roof'
      ? { job, status: 'Kept original: not enclosed on target level “Roof”.' }
      : { job, newId: nextId++, status: 'Recreated · ' + job.room.tags + ' sample tag(s) restored.' })
    const succeeded = receipts.filter(entry => entry.newId !== undefined)
    setRooms(rooms.map(room => {
      const replacement = succeeded.find(entry => entry.job.room.id === room.id)
      return replacement ? { ...room, id: replacement.newId!, level: replacement.job.target } : room
    }))
    setSelected(selected.filter(id => !succeeded.some(entry => entry.job.room.id === id)))
    setResult(receipts)
    setPending([])
    done('scope')
    done('target')
    done('apply')
    notify({ kind: succeeded.length === pending.length ? 'success' : 'warning',
      text: succeeded.length + ' of ' + pending.length + ' sample rooms reassigned.' })
  }

  return <DialogShell theme={theme} onTheme={setTheme} title="Room Level Assigner" subtitle="Browser simulation · fictional Sample Residence"
    onClose={close} footer={<><span className="ad-status">{shown.length} room(s) · {jobs.length} pending level change(s)</span>
      <Btn disabled={!result.length} onClick={() => downloadCsv('AT-01-room-reassignment.csv', ['Number', 'Room', 'Source ID', 'Current level', 'Target level', 'New ID', 'Status'],
        result.map(({ job, newId, status }) => [job.room.number, job.room.name, String(job.room.id), job.room.level, job.target, newId ? String(newId) : '', status]))}>Export CSV</Btn>
      <Btn onClick={close}>Close</Btn>{!jobs.length && <span className="ad-hint">Tick a room and choose its target level first.</span>}<Btn primary demo="relevel-apply" disabled={!jobs.length} onClick={() => setPending(jobs)}>Reassign Levels</Btn></>}>
    <div className="ad-card suite-flow-fields" data-demo="relevel-scope">
      <ScopeRadios options={['Active view', 'Entire model']} value={scope} onChange={value => {
        setScope(value)
        setTarget({})
        setSelected(rooms.filter(room => value === 'Entire model' || room.level === 'Level 01').map(room => room.id))
        rewind('target')
        done('scope')
      }} />
      <div className="ad-row">
        <SearchBox placeholder="Filter by room name or number" value={query} onChange={setQuery} />
        <Btn onClick={() => {
          setTarget({})
          setSelected(rooms.filter(room => scope === 'Entire model' || room.level === 'Level 01').map(room => room.id))
          rewind('target')
          done('scope')
        }}>Reload</Btn>
      </div>
    </div>
    <section className="ad-card suite-flow-fields" data-demo="relevel-grid" aria-label="Room targets">
      <div className="ad-row">
        <Btn sm disabled={!shown.length} onClick={() => setSelected([...new Set([...selected, ...shown.map(room => room.id)])])}>Select all</Btn>
        <Btn sm disabled={!shown.some(room => selected.includes(room.id))} onClick={() => setSelected(selected.filter(id => !shown.some(room => room.id === id)))}>Clear</Btn>
      </div>
      <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Sample room levels">
        <table className="ad-table"><thead><tr>{['Include', 'Number', 'Name', 'Current Level', 'Target Level', 'Status'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{shown.map(room => <tr key={room.id}>
            <td><Check title={'Include room ' + room.number} checked={selected.includes(room.id)} onChange={checked => setSelected(checked
              ? [...selected, room.id] : selected.filter(id => id !== room.id))} /></td>
            <td>{room.number}</td><td>{room.name}</td><td>{room.level}</td>
            <td><Select label={'Target Level for room ' + room.number} value={target[room.id] ?? room.level} options={LEVELS}
              onChange={value => { setTarget({ ...target, [room.id]: value }); done('scope'); done('target'); rewind('apply') }} /></td>
            <td>{target[room.id] && target[room.id] !== room.level ? 'Pending' : 'Current'}</td>
          </tr>)}</tbody>
        </table>
        {!shown.length && <p className="ad-note">No sample rooms match the search.</p>}
      </div>
    </section>
    <ConfirmGuard open={pending.length > 0} theme={theme} onTheme={setTheme} title="Room Level Assigner confirmation"
      instruction={'Reassign ' + pending.length + ' room(s)?'}
      content="Revit cannot change a room’s level, so each room is deleted and recreated on the target level. Number, name, parameters, height and tags are restored, but the new room gets a NEW ElementId and UniqueId. External references to the old IDs will no longer find the room."
      details={<ul>{pending.map(({ room, target }) => <li key={room.id}>{room.number} {room.name} · {room.level} → {target}</li>)}</ul>}
      confirmLabel="Yes" cancelLabel="No" onConfirm={apply} onCancel={() => setPending([])} />
    {!!result.length && <Receipt title="Sample reassignment report" entries={result.map(({ job, newId, status }) => ({
      label: job.room.number + ' ' + job.room.name + ' · ' + status,
      detail: newId ? job.room.level + ' → ' + job.target + ' · ID ' + job.room.id + ' → ' + newId : 'Retained ID ' + job.room.id,
    }))} />}
  </DialogShell>
}
