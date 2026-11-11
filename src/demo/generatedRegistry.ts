import layouts from '../data/layouts.generated.json'
import type { DemoStep } from './types'

export interface LayoutMeta { file: string; title: string; w: number; h: number; tabs: string[]; options: number; grids: number; primary: string | null; win: string }
export const LAYOUTS = layouts as Record<string, LayoutMeta[]>

const ACTIONS: Readonly<Record<string, readonly string[]>> = {
  'assign-room-properties': ['Assign'],
  'compliance-guard': ['Run audit', 'Pin selected', 'Delete reviewed candidates'],
  'copy-param-from-link': ['Copy'],
  'detail-view': ['Create detail views', 'Place on sheets'],
  'duplicates-resolver': ['Merge selected', 'Delete selected'],
  'excel-to-schedule': ['Create', 'Refresh', 'Refresh all linked'],
  'family-name-editor': ['Apply Changes'],
  'filter-usage-checker': ['Apply Changes'],
  'group-manager': ['Export'],
  'make-pattern': ['Create Pattern', 'Export PAT File'],
  'manage-text': ['Apply', 'Merge / Re-space', 'Change type'],
  'match-opening': ['Match Openings'],
  'mirrored-auditor': ['Resolve selected'],
  'off-axis-resolver': ['Scan model', 'Preview fix', 'Fix selected', 'Fix all fixable'],
  'parameter-mapping': ['Apply Mapping'],
  'replace-materials': ['Scan impact', 'Replace materials'],
  'sheet-export': ['Review and export'],
  'spell-check': ['Run Spell Check'],
  'structural-qa': ['Run audit'],
  'text-tag-align': ['Align Horizontally', 'Align Vertically'],
}

// These two dialogs fill their footer label in code after reading the active selection.
export const DYNAMIC_ACTIONS: Readonly<Record<string, readonly string[]>> = {
  'view-manager': ['Convert views', 'Duplicate views', 'Hide in views'],
  'vp-manager': ['Align viewports', 'Copy crop', 'Renumber viewports', 'Pin viewports', 'Place on sheets'],
}

const VARIANT_ACTIONS: Record<string, string[]> = {
  templatetransferwindow: ['Transfer Selected Templates', 'Copy Overrides Between Links'],
  filtertemplatewindow: ['Pick destinations'],
  transfervsoptionswindow: ['Continue'],
}

export const getActions = (slug: string, meta: LayoutMeta) => VARIANT_ACTIONS[meta.win]
  ?? (meta === LAYOUTS[slug]?.[0] ? ACTIONS[slug] : undefined)
  ?? (meta.primary ? [meta.primary] : [])

export function generatedSteps(slug: string): DemoStep[] {
  const main = LAYOUTS[slug]?.[0]
  if (!main) return []
  const steps: DemoStep[] = []
  const transfer = slug === 'template-manager'
  if (transfer) steps.push({ id: 'window', title: 'Open Transfer templates', hint: 'Choose Transfer templates above the workspace.', target: 'gen-window' })
  if (main.options > 0 || transfer) steps.push({ id: 'configure', title: 'Check the inputs', hint: 'Change a sample setting or confirm the defaults.', target: 'gen-configure' })
  if ((main.grids > 0 && slug !== 'update-schedule') || transfer || slug === 'detail-view' || slug === 'spell-check') steps.push({ id: 'row', title: 'Set the sample scope', hint: 'Choose records to include, or use the shown records.', target: 'gen-grid' })
  const [action] = getActions(slug, transfer ? LAYOUTS[slug][1] : main)
  steps.push({ id: 'run', title: action ? `Choose ${action}` : 'Choose a sample action', hint: 'Open the preview for the highlighted command.', target: 'gen-run' })
  steps.push({ id: 'apply', title: 'Confirm the preview', hint: 'Compare Before with After, tick the records to include, and confirm.', target: 'gen-apply' })
  steps.push({ id: 'review', title: 'Review the receipt', hint: 'Check the simulated outcome and confirm your review.', target: 'gen-review' })
  return steps
}
