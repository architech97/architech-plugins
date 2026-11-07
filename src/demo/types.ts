import type { ComponentType } from 'react'

export type DialogTheme = 'dark' | 'light'

export interface DemoStep {
  id: string
  title: string
  /** What to do, in the plugin's own words where possible. */
  hint: string
  /** data-demo attribute of the control to highlight while this step is current. */
  target?: string
}

export interface DemoNotice { kind: 'info' | 'success' | 'warning'; text: string }

export interface DemoContext {
  theme: DialogTheme
  setTheme: (t: DialogTheme) => void
  /** Mark a step done; the player advances when it is the current one. */
  done: (stepId: string) => void
  /** Toast plus an entry in the "what happened" log (simulated outcome). */
  notify: (n: DemoNotice) => void
  /** Close the dialog (the player shows a reopen prompt). */
  close: () => void
}

export interface DemoDefinition {
  id: string
  productSlug: string
  /** Tab / panel the button lives on, for the simulated ribbon. */
  ribbon: { tab: 'Arch Folio' | 'Arch Forge' | 'Arch Sentinel'; panel: string; button: string }
  title: string
  summary: string
  /** Facts the simulation is based on (shown under the demo). */
  basis: string[]
  steps: DemoStep[]
  /** Dialog width on desktop. */
  width: number
  load: () => Promise<{ default: ComponentType<DemoContext> }>
}
