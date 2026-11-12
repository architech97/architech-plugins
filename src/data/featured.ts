export const FEATURED_TOOLS = [
  { suite: 'Arch Folio', title: 'Sheet Export', slug: 'sheet-export', task: 'Publish a drawing set', description: 'Select drawings, choose export formats and review the proposed files and register.' },
  { suite: 'Arch Forge', title: 'Parameter Manager', slug: 'parameter-manager', task: 'Bind a project parameter', description: 'Define a parameter and assign its categories.' },
  { suite: 'Arch Sentinel', title: 'Model Health', slug: 'model-health', task: 'Export a Model Health report', description: 'Choose inventory categories and export a report of the model’s health.' },
] as const

/** `sizes` of the Sheet Export window in the home hero; the build preloads the same candidate. */
export const HERO_SIZES = '(max-width: 900px) 62vw, 420px'
