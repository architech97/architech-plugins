import layouts from '../data/layouts.generated.json'
import type { DemoStep } from './types'

export interface LayoutMeta { file: string; title: string; w: number; h: number; tabs: string[]; options: number; grids: number; primary: string | null; win: string }
export const LAYOUTS = layouts as Record<string, LayoutMeta[]>

const ACTIONS: Readonly<Record<string, readonly string[]>> = {
  'assign-room-properties': ['Assign'],
  'compliance-guard': ['Run audit'],
  'copy-param-from-link': ['Copy'],
  'detail-view': ['Create detail views', 'Place on sheets'],
  'duplicates-resolver': ['Merge selected', 'Delete selected'],
  'excel-to-schedule': ['Create'],
  'family-name-editor': ['Apply Changes'],
  'filter-usage-checker': ['Apply Changes'],
  'group-manager': ['Export'],
  'manage-text': ['Apply', 'Merge / Re-space', 'Change type'],
  'match-opening': ['Match Openings'],
  'mirrored-auditor': ['Resolve selected'],
  'parameter-mapping': ['Apply Mapping'],
  'replace-materials': ['Replace materials'],
  'sheet-export': ['Review and export'],
  'spell-check': ['Run Spell Check'],
  'structural-qa': ['Run audit'],
  'template-manager': ['Transfer Selected Templates', 'Copy Overrides Between Links'],
  'text-tag-align': ['Align Horizontally', 'Align Vertically'],
}

// These two dialogs fill their footer label in code after reading the active selection.
export const DYNAMIC_ACTIONS: Readonly<Record<string, readonly string[]>> = {
  'view-manager': ['Convert views', 'Duplicate views', 'Hide in views'],
  'vp-manager': ['Align viewports', 'Copy crop', 'Renumber viewports', 'Pin viewports', 'Place on sheets'],
}

export const getActions = (slug: string, meta: LayoutMeta) => ACTIONS[slug] ?? (meta.primary ? [meta.primary] : [])

export function generatedSteps(slug: string): DemoStep[] {
  const main = LAYOUTS[slug]?.[0]
  if (!main) return []
  const actions = getActions(slug, main)
  const dynamicActions = DYNAMIC_ACTIONS[slug]
  const steps: DemoStep[] = []
  if (main.options > 0) steps.push({ id: 'option', title: 'Change an option', hint: 'Tick a box, choose a radio option or change a list in the dialog.', target: 'gen-option' })
  if (main.grids > 0) steps.push({ id: 'row', title: 'Select a sample row', hint: 'Select a row in the table to define the sample scope.', target: 'gen-grid' })
  steps.push({ id: 'theme', title: 'Switch the dialog theme', hint: 'Change the dialog theme between Dark and Light.', target: 'gen-theme' })
  if (main.tabs.length > 1) steps.push({ id: 'tab', title: 'Open another section', hint: 'Choose another section to see its controls and options.', target: 'gen-tab' })
  if (slug === 'template-manager') steps.push({ id: 'window', title: 'Open Transfer templates', hint: 'Choose Transfer templates above the dialog.', target: 'gen-window' })
  if (actions.length || dynamicActions) {
    const label = actions.length === 1 ? actions[0] : undefined
    steps.push({ id: 'run', title: label ? `Choose ${label}` : 'Run a sample action', hint: 'Use the highlighted action to see a simulated result on sample data.', target: 'gen-run' })
  } else {
    steps.push({ id: 'explore', title: 'Explore the dialog', hint: 'Try a control in the browser preview.' })
  }
  return steps
}
