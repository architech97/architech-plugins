export const FEATURED_TOOLS = [
  {
    suite: 'Arch Folio', title: 'Sheet Export', slug: 'sheet-export',
    task: 'Publish a drawing set',
    description: 'Select drawings, choose export formats and review the proposed files and register.',
    preview: 'media/featured/sheet-export-sample.png',
    previewLabel: 'Browser demo preview',
    alt: 'Sheet Export browser demo with the two sample floor plans checked in the drawing register',
  },
  {
    suite: 'Arch Forge', title: 'Parameter Manager', slug: 'parameter-manager',
    task: 'Bind a project parameter',
    description: 'Define a parameter, assign its categories and download the sample definitions.',
    preview: 'media/featured/parameter-manager-sample.png',
    previewLabel: 'Browser demo preview',
    alt: 'Parameter Manager browser demo with Asset Tag bound to Doors and Windows',
  },
  {
    suite: 'Arch Sentinel', title: 'Model Export', slug: 'model-health',
    task: 'Export a Model Health report',
    description: 'Choose inventory categories and export a report of the sample model’s health.',
    preview: 'media/dialogs/model-health/report-selection-dark.webp',
    previewLabel: 'Reconstructed dialog',
    alt: 'Model Health report selection window with inventory categories',
  },
] as const
