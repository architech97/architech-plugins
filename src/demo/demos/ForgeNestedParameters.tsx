import { useEffect, useRef, useState } from 'react'
import type { DialogTheme } from '../types'
import { Btn, Check, RevitDialog } from '../ui'
import { associateNestedParameters, defaultNestedSelection, nestedAssociationMessage, NESTED_MODES, NESTED_SAMPLE_FAMILY,
  type AssociationResult, type NestedMode, type NestedModel } from './forgeNestedModel'
import './forgeDemo.css'

export default function ForgeNestedParameters({ theme, onTheme, model, onApply, close }: {
  theme: DialogTheme; onTheme: (theme: DialogTheme) => void; model: NestedModel
  onApply: (model: NestedModel, result: AssociationResult) => void; close: () => void
}) {
  const [mode, setMode] = useState<NestedMode>(NESTED_MODES[0])
  const [createMissing, setCreateMissing] = useState(true)
  const [checked, setChecked] = useState(() => defaultNestedSelection(model.rows, NESTED_MODES[0]))
  const [result, setResult] = useState<AssociationResult>()
  const [selectionMessage, setSelectionMessage] = useState('')
  const modeInput = useRef<HTMLSelectElement>(null)
  const rows = model.rows.filter(row => row.mode === mode)
  const modeName = mode === NESTED_MODES[0] ? 'instance' : 'type'

  useEffect(() => { modeInput.current?.focus() }, [])

  const load = (next: NestedMode) => {
    setMode(next)
    setChecked(defaultNestedSelection(model.rows, next))
    setSelectionMessage('')
    setResult(undefined)
  }

  const associate = () => {
    if (!checked.length) { setSelectionMessage('Tick one or more nested parameters.'); return }
    const update = associateNestedParameters(model, mode, checked, createMissing)
    onApply(update.model, update.receipt)
    setChecked(defaultNestedSelection(update.model.rows, mode))
    setSelectionMessage('')
    setResult(update.receipt)
  }

  return (
    <div className="forge-nested-dialog" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
    }}>
      <RevitDialog theme={theme} onTheme={onTheme} title="Nested Parameters" caption={`Browser sample · ${NESTED_SAMPLE_FAMILY}`} onClose={close}
        footer={<><span className="ad-status">{checked.length} selected</span><Btn onClick={() => load(mode)}>Load</Btn>
          <Btn primary onClick={associate}>Associate</Btn><Btn onClick={close}>Close</Btn></>}>
        <div className="ad-row forge-nested-controls">
          <select className="ad-select" aria-label="Nested parameter scope" ref={modeInput} value={mode} onChange={event => load(event.target.value as NestedMode)}>
            {NESTED_MODES.map(option => <option key={option}>{option}</option>)}
          </select>
          <Check label="Create missing host family parameters" checked={createMissing} onChange={setCreateMissing} />
        </div>
        <p className="ad-status" role="status">{rows.length} nested {modeName} parameter(s).</p>
        <div className="ad-table-wrap forge-nested-table" tabIndex={0} aria-label="Nested parameter records">
          <table className="ad-table"><thead><tr><th scope="col"><span className="sr-only">Select</span></th><th scope="col">Nested Family</th>
            <th scope="col">Type</th><th scope="col">Parameter</th><th scope="col">Data Type</th><th scope="col">Associated</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id}>
              <td><Check title={`Select ${row.family} ${row.name}`} checked={checked.includes(row.id)} onChange={selected => {
                setChecked(previous => selected ? [...previous, row.id] : previous.filter(id => id !== row.id))
                setSelectionMessage('')
              }} /></td>
              <td>{row.family}</td><td>{row.type}</td><td>{row.name}</td><td>{row.dataType}</td><td>{row.associated || '—'}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {selectionMessage && <p className="suite-flow-error" role="alert">{selectionMessage}</p>}
        {result && <div className="ad-result forge-nested-result" role="status">
          <strong>{nestedAssociationMessage(result)}</strong>
          {result.issues.length > 0 && <ul>{result.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
        </div>}
      </RevitDialog>
    </div>
  )
}
