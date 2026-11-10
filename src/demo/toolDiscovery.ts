import type { ToolDefinition } from './types'
import type { WorkflowInput, WorkflowResult } from './generatedWorkflow'

export interface ToolWorkflow {
  default: (input: WorkflowInput) => WorkflowResult | string | undefined
  settings?: (windowName: string, tab: number) => { label: string; initial: string; choices?: string[] }[]
  actions?: (windowName: string, tab: number) => string[]
}

const definitions = import.meta.glob<{ default?: ToolDefinition; definition?: ToolDefinition }>('./tools/*/index.ts', { eager: true })
const workflows = import.meta.glob<ToolWorkflow>('./tools/*/result.ts')

export const toolDefinition = (slug: string) => {
  const module = definitions[`./tools/${slug}/index.ts`]
  return module?.default ?? module?.definition
}
export const loadToolWorkflow = (slug: string) => workflows[`./tools/${slug}/result.ts`]?.()
