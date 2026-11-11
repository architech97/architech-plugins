import type { WorkflowInput, WorkflowResult } from './generatedWorkflow'

export interface ToolWorkflow {
  default: (input: WorkflowInput) => WorkflowResult | string | undefined
  settings?: (windowName: string, tab: number) => { label: string; initial: string; choices?: string[] }[]
  actions?: (windowName: string, tab: number) => string[]
}

const workflows = import.meta.glob<ToolWorkflow>('./tools/*/result.ts')

export const loadToolWorkflow = (slug: string) => workflows[`./tools/${slug}/result.ts`]?.()
