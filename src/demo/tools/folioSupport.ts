import type { WorkflowField, WorkflowRecord } from '../generatedWorkflow'

export const field = (fields: WorkflowField[], name: string | RegExp, fallback = '') =>
  fields.findLast(({ label }) => typeof name === 'string' ? label.toLowerCase() === name.toLowerCase() : name.test(label))?.value ?? fallback

export const enabled = (fields: WorkflowField[], name: string | RegExp, fallback = false) =>
  field(fields, name, fallback ? 'On' : 'Off') === 'On'

export const cell = (row: WorkflowRecord, ...names: string[]) =>
  names.map((name) => row.columns[name]).find((value) => value && value !== '—') ?? ''

export const resultRow = (label: string, value: string) => ({ label, value })

export function numberInRange(value: string, minimum: number, maximum: number) {
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) return NaN
  const number = Number(value)
  return number >= minimum && number <= maximum ? number : NaN
}

export const option = (label: string, choices: string[]) => ({ label, initial: choices[0], choices })
