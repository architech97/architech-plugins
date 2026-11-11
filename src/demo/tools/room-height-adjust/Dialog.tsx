import { useState } from 'react'
import type { DemoContext } from '../../types'
import { DialogShell, ScopeRadios, Receipt } from '../../kit'
import { Btn, Check, Select } from '../../ui'
import { sampleResidence } from '../../fixtures/sampleResidence'
import '../../demos/suiteWorkflow.css'

type RoomHeight = {
  id: number
  number: string
  name: string
  level: string
  base: number
  top: number
  upper: string | null
  target: number
  partial?: boolean
  readOnly?: boolean
}

const HEIGHTS: Record<string, Pick<RoomHeight, 'top' | 'upper' | 'target' | 'partial' | 'readOnly'>> = {
  '101': { top: 3300, upper: 'Level 02', target: 2750 },
  '102': { top: 3300, upper: null, target: 2650 },
  '103': { top: 3300, upper: 'Level 02', target: 2550, partial: true },
  '201': { top: 6600, upper: 'Roof', target: 6020 },
  '202': { top: 6600, upper: 'Roof', target: 6150, readOnly: true },
}
const VIEWS = ['Level 01 – Floor Plan', 'Level 02 – Floor Plan', 'Cover Sheet']
const initialRooms = sampleResidence.rooms.flatMap(room => {
  const height = HEIGHTS[room.number]
  return height ? [{ id: room.id, number: room.number, name: room.name, level: room.level, base: room.level === 'Level 01' ? 0 : 3300, ...height }] : []
})
const elevation = (name: string) => (sampleResidence.levels.find(level => level.name === name)?.elevation ?? 0) * 1000
const mm = (value: number) => value + ' mm'

function scan(rooms: RoomHeight[], scope: string, view: string) {
  const level = view.slice(0, 8)
  return rooms.filter(room => (scope === 'Whole model' || room.level === level) && room.top > room.target)
}

export default function RoomHeightAdjust({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [scope, setScope] = useState('Active view')
  const [view, setView] = useState(VIEWS[0])
  const [rooms, setRooms] = useState(initialRooms)
  const [preview, setPreview] = useState<RoomHeight[] | null>(() => scan(initialRooms, 'Active view', VIEWS[0]))
  const [ticked, setTicked] = useState<number[]>(() => scan(initialRooms, 'Active view', VIEWS[0]).filter(room => !room.partial).map(room => room.id))
  const [receipt, setReceipt] = useState<{ label: string; detail?: string }[]>([])
  const [staleReason, setStaleReason] = useState('')
  const invalidView = scope === 'Active view' && view === 'Cover Sheet'

  function reload(nextRooms = rooms, nextScope = scope, nextView = view) {
    const next = scan(nextRooms, nextScope, nextView)
    setPreview(next)
    setTicked(next.filter(room => !room.partial).map(room => room.id))
    setStaleReason('')
  }

  function invalidate(reason: string) {
    setPreview(null)
    setTicked([])
    setStaleReason(reason)
    setReceipt([])
    rewind('review')
  }

  function apply() {
    if (!preview?.length || !ticked.length) return
    const selected = preview.filter(room => ticked.includes(room.id))
    const changed = selected.filter(room => !room.readOnly)
    const nextRooms = rooms.map(room => changed.includes(room) ? { ...room, top: room.target, upper: room.upper ?? room.level } : room)
    setRooms(nextRooms)
    reload(nextRooms)
    setReceipt(selected.map(room => {
      if (room.readOnly) return { label: room.number + ' ' + room.name + ', skipped', detail: 'Read-only Limit Offset. The sample height was retained.' }
      const adjusted = nextRooms.find(item => item.id === room.id)!
      const upper = adjusted.upper ?? adjusted.level
      return { label: adjusted.number + ' ' + adjusted.name + ', ' + mm(adjusted.top - adjusted.base),
        detail: 'Upper Limit ' + upper + ', Limit Offset ' + mm(adjusted.top - elevation(upper)) }
    }))
    done('scope')
    done('review')
    done('apply')
    const count = changed.length + ' of ' + selected.length + ' sample rooms adjusted to the ceiling base.'
    notify({ kind: changed.length === selected.length ? 'success' : 'warning', text: count })
  }

  return <DialogShell theme={theme} onTheme={setTheme} title="Room Height Adjust" subtitle="Lower each room’s upper limit onto the ceiling above it"
    onClose={close} footer={<><span className="ad-status">{ticked.length} of {preview?.length ?? 0} selected</span><Btn onClick={close}>Close</Btn>
      <Btn primary demo="height-apply" disabled={!preview?.length || !ticked.length} onClick={apply}>Adjust Heights</Btn></>}>
    <div className="ad-card suite-flow-fields" data-demo="height-scope">
      <ScopeRadios options={['Whole model', 'Active view']} value={scope} onChange={nextScope => {
        setScope(nextScope)
        setReceipt([])
        reload(rooms, nextScope)
        rewind('review')
        done('scope')
      }} />
      <div className="ad-row">
        <Btn onClick={() => { setReceipt([]); reload(); done('scope') }}>Reload</Btn>
        <Select label="Sample active view" value={view} options={VIEWS} onChange={next => {
          setView(next)
          if (scope === 'Active view') invalidate('The active view or scope changed. Press Reload to review the rooms in the current scope.')
        }} />
        <Btn onClick={() => {
          setRooms(rooms.map(room => room.number === '101' ? { ...room, target: room.target === 2750 ? 2700 : 2750 } : room))
          invalidate('Model changed. Press Reload to rescan before adjusting rooms.')
        }}>Simulate ceiling edit</Btn>
      </div>
      <p className="ad-note">Sample active view and ceiling edit controls represent changes made outside the native dialog.</p>
    </div>
    <section className="ad-card suite-flow-fields" data-demo="height-rows" aria-label="Room height preview">
      <div className="ad-row">
        <Btn sm disabled={!preview?.length} onClick={() => { setTicked(preview?.map(room => room.id) ?? []); done('scope'); done('review') }}>Select all</Btn>
        <Btn sm disabled={!ticked.length} onClick={() => setTicked([])}>Select none</Btn>
      </div>
      {!preview ? <p role="status">{staleReason}</p> : preview.length ? (
        <div className="ad-table-wrap suite-flow-table" tabIndex={0} role="region" aria-label="Room adjustment rows">
          <table className="ad-table">
            <thead><tr>{['Fix', 'Level', 'Number', 'Room', 'Height now', 'New height', 'Change'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{preview.map(room => <tr key={room.id}>
              <td><Check title={'Fix room ' + room.number} checked={ticked.includes(room.id)} onChange={checked => {
                setTicked(checked ? [...ticked, room.id] : ticked.filter(id => id !== room.id))
                done('scope')
                done('review')
              }} /></td>
              <td>{room.level}</td><td>{room.number}</td><td>{room.name}</td><td>{mm(room.top - room.base)}</td>
              <td className="changed">{mm(room.target - room.base)}</td>
              <td>{mm(room.target - room.top)}{room.partial ? ' (partial ceiling)' : ''}</td>
            </tr>)}</tbody>
          </table>
        </div>
      ) : <p role="status">{invalidView ? 'Open a view that can list rooms, or choose Whole model.' : 'Rooms in this scope already stop at or below their sample ceiling.'}</p>}
    </section>
    {!!receipt.length && <Receipt title="Sample room height readback" entries={receipt} />}
  </DialogShell>
}
