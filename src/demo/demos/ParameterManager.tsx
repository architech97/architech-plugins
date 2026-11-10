import { useState } from 'react'
import type { DemoContext } from '../types'
import { Btn, Check, RevitDialog, Select, TextBox } from '../ui'
import { downloadCsv } from './craftedTools'
import './suiteWorkflow.css'

const categories = ['Doors', 'Windows', 'Walls', 'Furniture', 'Rooms']
const existing = [
  { name: 'Door Hardware Set', spec: 'Text', group: 'Identity Data', binding: 'Type', categories: ['Doors'] },
  { name: 'Finish Code', spec: 'Text', group: 'Materials and Finishes', binding: 'Instance', categories: ['Rooms'] },
]
const initial = { name: 'Asset Tag', spec: 'Text', group: 'Identity Data', binding: 'Instance', categories: [] as string[] }
type Definition = typeof initial

export default function ParameterManager({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [rows, setRows] = useState(existing)
  const [draft, setDraft] = useState<Definition | null>(null)
  const [mode, setMode] = useState<'Parameters' | 'Categories'>('Parameters')
  const [showExisting, setShowExisting] = useState(true)
  const [applied, setApplied] = useState<Definition | null>(null)
  const name = draft?.name.trim() ?? ''
  const duplicate = rows.some(row => row.name.toLowerCase() === name.toLowerCase())
  const canApply = Boolean(name && draft?.categories.length && !duplicate)
  const visible = showExisting ? rows : rows.slice(existing.length)
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

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="Parameter Manager" caption="Project parameters · Category bindings" onClose={close}
      footer={<><span className="ad-status">{rows.length} definitions · {draft ? '1 pending change' : 'No pending changes'}</span>
        {draft && <Btn onClick={() => { setDraft(null); setMode('Parameters'); rewind('add') }}>Discard draft</Btn>}
        <Btn primary demo="apply-parameter" disabled={!canApply} onClick={apply}>Apply</Btn>
      </>}>
      <div className="ad-tabs" role="group" aria-label="Parameter Manager views">
        {(['Parameters', 'Categories'] as const).map(tab => <button key={tab} type="button" className={'ad-tab' + (tab === mode ? ' on' : '')}
          aria-pressed={tab === mode} data-demo={tab === 'Categories' ? 'parameter-categories' : undefined} onClick={() => {
            setMode(tab)
            if (tab === 'Categories' && draft) done('categories')
          }}>{tab}</button>)}
      </div>
      <div className="ad-row">
        <Btn demo="add-parameter" disabled={Boolean(draft)} onClick={() => {
          setDraft(rows.some(row => row.name === initial.name) ? { ...initial, name: '' } : initial)
          setApplied(null)
          rewind('add')
          done('add')
          setMode('Parameters')
        }}>+ Add Parameter</Btn>
        <Check label="Show Existing Parameters" checked={showExisting} onChange={setShowExisting} />
      </div>
      <div className="ad-table-wrap suite-flow-table" tabIndex={0} aria-label="Project parameter definitions">
        <table className="ad-table"><thead><tr><th scope="col">Parameter name</th>
          {mode === 'Parameters' ? <><th scope="col">Type of parameter</th><th scope="col">Group under</th><th scope="col">Instance / type</th></> : <th scope="col">Categories</th>}
        </tr></thead><tbody>
          {visible.map(row => <tr key={row.name}><td>{row.name}</td>{mode === 'Parameters'
            ? <><td>{row.spec}</td><td>{row.group}</td><td>{row.binding}</td></>
            : <td>{row.categories.join(', ')}</td>}</tr>)}
          {draft && <tr>
            <td>{mode === 'Parameters' ? <TextBox aria-label="Parameter name" value={draft.name} maxLength={60} onChange={event => change({ name: event.target.value })} /> : draft.name || 'New parameter'}</td>
            {mode === 'Parameters' ? <>
              <td><Select label="Type of parameter" value={draft.spec} options={['Text', 'Yes/No', 'Integer', 'Number', 'Length']} onChange={spec => change({ spec })} /></td>
              <td><Select label="Group under" value={draft.group} options={['Identity Data', 'Data', 'Materials and Finishes']} onChange={group => change({ group })} /></td>
              <td><Select label="Instance or type" value={draft.binding} options={['Instance', 'Type']} onChange={binding => change({ binding })} /></td>
            </> : <td>{draft.categories.join(', ') || 'Unassigned'}</td>}
          </tr>}
        </tbody></table>
        {!visible.length && !draft && <p className="suite-flow-note">No parameters added in this session.</p>}
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
        <div className="ad-row"><Btn demo="parameter-csv" onClick={() => {
          downloadCsv('AT-01-parameter-definitions.csv', ['Parameter Name', 'Type of Parameter', 'Group Under', 'Instance/Type', 'Categories'],
            rows.map(row => [row.name, row.spec, row.group, row.binding, row.categories.join('; ')]))
          done('csv')
        }}>Export to CSV</Btn></div>
      </div>}
    </RevitDialog>
  )
}
