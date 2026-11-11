import { useId, useState } from 'react'
import type { WorkflowInput, WorkflowResult } from '../generatedWorkflow'

interface Plan {
  input: WorkflowInput
  output: WorkflowResult
}

export function WorkflowPreview({ plan, evaluate, onApply, onCancel }: {
  plan: Plan
  evaluate: (input: WorkflowInput) => WorkflowResult | string
  onApply: (output: WorkflowResult) => void
  onCancel: () => void
}) {
  const titleId = useId()
  const { input, output } = plan
  const [checked, setChecked] = useState(() => input.records.map(() => true))
  const picked = input.records.filter((_, index) => checked[index])
  const selection = picked.length === input.records.length ? output
    : picked.length > 0 ? evaluate({ ...input, records: picked }) : 'Tick at least one sample record.'
  const next = typeof selection === 'string' ? undefined : selection
  const readOnly = /^(scan|preview|export|find|show|check|review|run (audit|spell check)|inspect|refresh list)/i.test(input.action)
  return (
    <section className="gen-result gen-plan" aria-labelledby={titleId}>
      <h3 id={titleId}>Preview, {input.action}</h3>
      <p>{next?.summary ?? output.summary}</p>
      {typeof selection === 'string' && <p role="status" className="gen-validation">{selection}</p>}
      {!input.records.length && <dl>
        <div><dt>Before</dt><dd>{input.fields.filter(({ value }) => value && value !== 'Off').slice(0, 3).map(({ label, value }) => `${label}: ${value}`).join(', ') || 'Current sample model'}</dd></div>
        <div><dt>After</dt><dd>{output.rows.length ? 'Review the proposed results below.' : output.summary}</dd></div>
      </dl>}
      {input.records.length > 0 && <>
        <p className="gen-plan-count" aria-live="polite">{picked.length} of {input.records.length} records ticked</p>
        <div className="gen-plan-records">
          {input.records.map((record, index) => {
            const outcome = (checked[index] ? next?.rows : output.rows)?.find((row) => row.label === record.label)
            const [before, after] = outcome?.value.includes(' → ') ? outcome.value.split(' → ', 2) : []
            const fields = Object.entries(record.columns).filter(([, value]) => value && value !== '—')
            return <div className="gen-plan-row" key={index}>
              <label className="gen-record">
                <input type="checkbox" aria-label={`Tick ${record.label}`} checked={checked[index]} onChange={(event) => {
                  const selected = event.target.checked
                  setChecked((current) => current.map((value, row) => row === index ? selected : value))
                }} />
                <strong>{record.label}</strong>
              </label>
              <dl><div><dt>Before</dt><dd>{outcome?.before ?? before ?? (fields.slice(0, 3).map(([label, value]) => `${label}: ${value}`).join(', ') || record.label)}</dd></div>
                <div><dt>After</dt><dd>{outcome?.after ?? after ?? outcome?.value ?? 'See the operation preview below.'}</dd></div></dl>
            </div>
          })}
        </div>
      </>}
      {next?.rows.some((row) => !input.records.some((record) => record.label === row.label)) && <dl className="gen-plan-details">
        {next.rows.filter((row) => !input.records.some((record) => record.label === row.label)).map(({ label, value }, index) =>
          <div key={index}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>}
      <div className="gen-actions">
        <button className="gen-action is-primary" type="button" data-demo="gen-apply" disabled={!next} onClick={() => { if (next) onApply(next) }}>
          {readOnly ? 'Confirm preview' : 'Apply to sample'}
        </button>
        <button className="gen-action" type="button" onClick={onCancel}>Cancel preview</button>
      </div>
    </section>
  )
}
