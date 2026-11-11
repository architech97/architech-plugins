import { useState } from 'react'
import type { DemoContext } from '../../types'
import type { WorkflowInput, WorkflowResult } from '../../generatedWorkflow'
import { WorkflowPreview } from '../../kit/WorkflowPreview'
import { DialogShell, Receipt } from '../../kit'
import { Btn } from '../../ui'
import { forgeChoices, forgeResult } from '../../forgeFixtures'
import '../../demos/suiteWorkflow.css'
import './style.css'

const FIELDS = ['Rooms from', 'Element category', 'Room text property', 'Element parameter']
const EMPTY = '— Choose —'
const initialChoices: Record<string, string> = { 'Rooms from': 'Current Model', 'Element category': 'Doors', 'Room text property': 'Name · built-in', 'Element parameter': 'Comments · built-in' }
const display = (label: string, value: string) => label === 'Rooms from' && value === 'This model' ? 'Current Model'
  : label === 'Room text property' ? ({ 'Room Name': 'Name · built-in', 'Room Number': 'Number · built-in' } as Record<string, string>)[value] ?? value + ' · built-in'
  : label === 'Element parameter' && ['Comments', 'Mark', 'Department'].includes(value) ? value + ' · built-in' : value
const underlying = (label: string, value: string) => label === 'Rooms from' && value === 'Current Model' ? 'This model'
  : label === 'Room text property' ? ({ 'Name · built-in': 'Room Name', 'Number · built-in': 'Room Number' } as Record<string, string>)[value] ?? value.replace(' · built-in', '')
  : label === 'Element parameter' ? value.replace(' · built-in', '') : value
type Plan = { input: WorkflowInput; output: WorkflowResult }

function evaluate(input: WorkflowInput): WorkflowResult | string {
  const output = forgeResult({ ...input, fields: input.fields.map(field => ({ ...field, value: underlying(field.label, field.value) })) })
  return output && typeof output !== 'string' ? { ...output, summary: output.summary.replace('This model', 'Current Model') } : output ?? 'Choose the room source and mapping.'
}

export default function CopyParamFromLink({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [choices, setChoices] = useState(initialChoices)
  const [plan, setPlan] = useState<Plan>()
  const [result, setResult] = useState<WorkflowResult>()
  const [error, setError] = useState('')
  const ready = FIELDS.every(label => choices[label] !== EMPTY)

  function configure(label: string, value: string) {
    setChoices(previous => ({
      ...previous,
      [label]: value,
      ...(label === 'Rooms from' ? { 'Room text property': EMPTY } : {}),
      ...(label === 'Element category' ? { 'Element parameter': EMPTY } : {}),
    }))
    setPlan(undefined)
    setResult(undefined)
    setError('')
    rewind('run')
    done('configure')
  }

  function preview() {
    if (!ready) return
    const input: WorkflowInput = {
      slug: 'copy-param-from-link', action: 'Copy',
      fields: FIELDS.map(label => ({ label, value: choices[label] })),
      records: [],
    }
    const output = evaluate(input)
    if (typeof output === 'string') {
      setError(output)
      return
    }
    setPlan({ input: { ...input, records: output.records ?? [] }, output })
    done('configure')
    done('run')
  }

  return <DialogShell theme={theme} onTheme={setTheme} title="Copy Param from Link"
    subtitle="Browser simulation · fictional Sample Residence" onClose={close}
    footer={<><span className="ad-status">{ready ? 'Review the mapping before copying.' : 'Choose the source, category and both parameters.'}</span>
      <Btn onClick={close}>Cancel</Btn><Btn primary demo="copy-preview" disabled={!ready || !!plan} onClick={preview}>Copy</Btn></>}>
    <section className="ad-card copy-room-fields" data-demo="copy-configure" aria-label="Room property mapping">
      {FIELDS.map(label => {
        const dependencyMissing = label === 'Room text property' && choices['Rooms from'] === EMPTY ||
          label === 'Element parameter' && choices['Element category'] === EMPTY
        return <label key={label}><span>{label}</span>
          <select className="ad-select" aria-label={label} value={choices[label]} disabled={dependencyMissing}
            onChange={event => configure(label, event.target.value)}>
            {[EMPTY, ...(forgeChoices('copy-param-from-link', label) ?? []).map(value => display(label, value))].map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
      })}
    </section>
    {error && <p role="alert">{error}</p>}
    {plan && <WorkflowPreview plan={plan} evaluate={evaluate} onCancel={() => { setPlan(undefined); rewind('run') }} onApply={output => {
      setPlan(undefined)
      setResult(output)
      done('apply')
      notify({ kind: 'success', text: 'Copy · sample receipt ready.' })
    }} />}
    {result && <Receipt title="Sample room-property copy" entries={result.rows.map(row => ({ label: row.label, detail: row.value }))} />}
  </DialogShell>
}
