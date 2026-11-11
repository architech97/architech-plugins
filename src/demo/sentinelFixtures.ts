import type { WorkflowInput, WorkflowResult } from './generatedWorkflow'

type Columns = Record<string, string[]>
const REVIEW_FINDINGS = [
  { name: 'Highlighted walls overlap', id: '301144, 301178', severity: 'Critical', comparison: 'Persisting', check: 'Revit warnings', level: 'Level 01', phase: 'Existing', option: 'Main model only', profiles: ['Architecture', 'Interiors', 'Coordination'], selected: false },
  { name: 'Missing room floor finish', id: '410022', severity: 'Warning', comparison: 'New', check: 'Room floor finish', level: 'Level 01', phase: 'New Construction', option: 'Main model only', profiles: ['Interiors'], selected: true },
  { name: 'Missing door Type Mark', id: '348211', severity: 'Warning', comparison: 'New', check: 'Door Type Mark', level: 'Level 02', phase: 'New Construction', option: 'Option 01 – Courtyard', profiles: ['Architecture'], selected: true },
]
const SENTINEL_COLUMNS: Partial<Record<string, Columns>> = {
  'compliance-guard': {
    'element id': ['405011', '405012', '611712', '601105', '302210'],
    'category / type': ['Lines / Detail Lines', 'Lines / Sketch Lines', 'Revit Links', 'Grids', 'Walls / Basic Wall'],
    'sop issue': ['CAD line-style candidate', 'CAD line-style candidate, sketch', 'Unpinned Revit link', 'Unpinned grid', 'Assigned to Workset1'],
    'element / style name': ['CAD-A-WALL', 'CAD-A-FLOOR', 'Interiors.rvt', 'Grid B', 'W-101, Core wall'],
    'view / location': ['A-501, Typical Details', 'Level 01, Floor sketch', '3D – Coordination', 'Level 01', 'Level 01'],
  },
  'duplicates-resolver': {
    'family : type': ['Single Flush : 900 × 2100 mm', 'Fixed Window : 1200 × 1500 mm', 'Rectangular Column : 300 × 450 mm'],
    category: ['Doors', 'Windows', 'Structural Columns'],
    copies: ['2', '3', '2'],
    notes: ['Extra has a Comments value', 'Extra has an instance Mark', 'No additional values'],
  },
  'off-axis-resolver': {
    route: ['Wall', 'Room Separation Line', 'Grid Line', 'Wall'],
    'element id': ['301500', '512020', '601105', '301517'],
    current: ['89.4°', '1.8°', '179.1°', '82.0°'],
    target: ['90.0°', '0.0°', '180.0°', '90.0°'],
    deviation: ['0.6°', '1.8°', '0.9°', '8.0°'],
    status: ['Accidental', 'Ambiguous', 'Accidental', 'Intentional'],
    category: ['Walls', 'Lines', 'Grids', 'Walls'],
    class: ['Wall', 'Room separation', 'Grid', 'Wall'],
    reason: ['Curve-based wall', 'Needs explicit review', 'Grid lines are preview-only', 'Above maximum safe angle'],
  },
  'scope-box-synchronizer': { 'drift (mm)': ['45', '0', '—'] },
  'in-place-converter': { category: ['Generic Models', 'Stairs', 'Casework'] },
  'mirrored-auditor': {
    category: ['Doors', 'Windows', 'Mechanical Equipment'],
    family: ['Single Flush', 'Fixed Window', 'Mechanical Cabinet'],
    type: ['900 × 2100 mm', '1200 × 1500 mm', 'Utility cabinet'],
    'mirror status': ['MIRROR WARNING', 'VALID FLIP', 'MIRROR WARNING'],
    'hand flipped': ['No', 'Yes', 'No'],
  },
  'model-query-pro': {
    'review class': REVIEW_FINDINGS.map((finding) => finding.severity),
    finding: REVIEW_FINDINGS.map((finding) => finding.name),
    comparison: REVIEW_FINDINGS.map((finding) => finding.comparison),
    state: ['Open'],
    elements: REVIEW_FINDINGS.map((finding) => finding.id),
    check: REVIEW_FINDINGS.map((finding) => finding.check),
    outcome: ['Complete'],
    reviewed: ['18', '8', '6'],
    issues: ['1'],
    errors: ['0'],
    'matched rule value': ['D-01', 'W-03', 'Review required'],
  },
  'parameter-colorizer': { elements: ['6', '4', '2', '1', '3'] },
  'workset-manager': { 'type name': ['900 × 2100 mm', '1200 × 1500 mm', '300 × 450 mm', '250 × 450 mm'], status: ['Matches', 'Review', 'Matches', 'Review'] },
}

const STRUCTURAL_COLUMNS: Columns = {
  'element id': ['361001', '361002', '361003'],
  category: ['Structural Columns'],
  'family & type': ['Concrete Column : 300 × 450 mm', 'Concrete Column : 450 × 450 mm', 'Steel Column : HSS 150'],
  'qa status': ['Within tolerance', 'Review', 'Within tolerance'],
  'measured deviation / reference': ['3 mm, Grid A/1', '12 mm, Grid B/2', '4 mm, Grid C/1'],
}
const STRUCTURAL_BEAMS: Columns = {
  'element id': ['362001', '362002', '362003'],
  category: ['Structural Framing'],
  'family & type': ['Steel Beam : UB 254', 'Concrete Beam : 250 × 450 mm', 'Steel Beam : UB 305'],
  'qa status': ['Contact', 'Review', 'Contact'],
  'measured deviation / reference': ['Support intersects end, Grid A/1', '18 mm endpoint gap, Grid B/2', 'Support intersects end, Grid C/1'],
}

export function sentinelCell(slug: string, key: string, row: number, variant?: string) {
  const values = slug === 'structural-qa'
    ? (variant === 'Beam endpoint contact' ? STRUCTURAL_BEAMS : STRUCTURAL_COLUMNS)[key]
    : SENTINEL_COLUMNS[slug]?.[key]
  return values?.[row % values.length]
}

const REVIEW_COMBOS = [
  { label: 'Profile', values: ['Architecture', 'Interiors', 'Coordination', 'Pre-handover'] },
  { label: 'Base scope', values: ['Project', 'Active view', 'Selection'] },
  { label: 'Level', values: ['All levels', 'Level 01', 'Level 02'] },
  { label: 'Created phase', values: ['All phases', 'Existing', 'New Construction'] },
  { label: 'Design option', values: ['All options', 'Main model only', 'Option 01 – Courtyard'] },
  { label: 'Finding state', values: ['Open issues', 'Accepted', 'Resolved', 'Unknown', 'All findings'] },
]
export const reviewField = (ordinal: number) => REVIEW_COMBOS[ordinal]

export function sentinelChoices(slug: string, windowName: string | undefined, ordinal: number): string[] | undefined {
  if (slug === 'model-query-pro' && windowName === 'reviewcenterwindow') return reviewField(ordinal)?.values
  if (slug === 'structural-qa') return ['Column-to-grid alignment', 'Beam endpoint contact']
}

export function sentinelResult({ slug, action, fields, records, windowName }: WorkflowInput): WorkflowResult | string | undefined {
  const get = (match: RegExp) => fields.find(({ label }) => match.test(label))?.value ?? ''
  const results = (format: (row: (typeof records)[number]) => string) => records.map((row) => ({ label: row.label, value: format(row) }))

  switch (slug) {
    case 'compliance-guard': {
      const pin = action === 'Pin selected'
      const remove = action === 'Delete reviewed candidates'
      const rows = results(({ columns }) => {
        const issue = columns['SOP Issue']
        const name = columns['Element / Style Name']
        if (pin) return issue.startsWith('Unpinned') ? `${name}, Pinned in the sample` : `${issue}, unchanged`
        if (remove && issue.includes('sketch')) return `${name}, Sketch line is report-only`
        if (remove && issue.startsWith('CAD line-style candidate')) return `Line element ${columns['Element ID']}, Eligible for removal after confirmation`
        return `${issue}, ${pin || remove ? 'unchanged' : columns['View / Location']}`
      })
      return { summary: pin || remove ? 'Reviewed the chosen fix against the selected sample findings.' : `Found ${records.length} sample compliance findings. A CAD-style name is a candidate for review.`, rows }
    }
    case 'duplicates-resolver': {
      const merge = action === 'Merge selected'
      return {
        summary: merge ? 'Kept the primary instances and copied eligible filled values into blank instance fields.' : 'Kept the primary instances and removed the selected sample extras.',
        rows: results(({ columns }) => `Keep ${columns['Keep as primary']}, Remove ${columns.Extras}${merge && columns.Notes.startsWith('Extra has') ? ', ' + columns.Notes.replace('Extra has a', 'Copied the') + ' to the blank primary field' : ''}`),
      }
    }
    case 'off-axis-resolver': {
      const accidental = Number(get(/^accidental/i) || 1)
      const maxSafe = Number(get(/^max safe/i) || 5)
      if (!Number.isFinite(accidental) || !Number.isFinite(maxSafe) || accidental <= 0 || maxSafe < accidental || maxSafe > 45) return 'Enter angles greater than 0° with Max safe at least Accidental and at most 45°.'
      const actionIsFix = /^Fix /i.test(action)
      const rows = results(({ columns }) => {
        const deviation = parseFloat(columns.Deviation)
        const route = columns.Route
        const label = `${columns.Current} → ${columns.Target}`
        if (get(new RegExp(`^${route}( \\(preview only\\))?$`, 'i')) === 'Off') return `${label}, Category excluded`
        if (route === 'Grid Line') return `${label}, Grid line preview only`
        if (deviation > maxSafe) return `${label}, Intentional, unchanged`
        if (deviation > accidental && action === 'Fix all fixable') return `${label}, Ambiguous, explicit selection needed`
        return `${label}, ${actionIsFix ? 'Correction prepared' : deviation > accidental ? 'Ambiguous, review explicitly' : 'Accidental, fixable'}`
      })
      return { summary: `Reviewed ${records.length} sample offsets. Accidental ≤ ${accidental}°, Max safe ${maxSafe}°.`, rows }
    }
    case 'structural-qa': {
      const beams = get(/^inspection mode$/i) === 'Beam endpoint contact'
      return {
        summary: beams ? 'Checked whether the sample beam endpoints intersect a support. This is a geometric contact check.' : 'Measured the sample columns against their nearest grid intersections.',
        rows: results(({ columns }) => `${columns['QA Status']}, ${columns['Measured Deviation / Reference']}`),
      }
    }
    case 'scope-box-synchronizer': {
      const assign = get(/^assign each synchronized scope box/i) === 'On'
      return {
        summary: 'Prepared the selected scope-box synchronization from the sample master link.',
        rows: results(({ columns }) => {
          const status = columns.Status
          if (status === 'Matched') return 'Host extents already match, no replacement'
          const change = status === 'Missing in host' ? 'Create host scope box' : `Replace host box, ${columns['Drift (mm)']} mm drift`
          return `${change}${assign ? ', assign matching floor plans' : ''}`
        }),
      }
    }
    case 'in-place-converter':
      return {
        summary: 'Reviewed geometry copies for a Generic Model RFA export. This sample displays a receipt. The native tool writes the RFA files.',
        rows: results(({ columns }) => `${columns.Solids} solids, ${columns['Approx Volume']}, original instance retained`),
      }
    case 'mirrored-auditor':
      return {
        summary: 'Compared sample mirror warnings with valid hand or facing flips.',
        rows: results(({ columns }) => columns['Mirror Status'] === 'MIRROR WARNING' ? 'Mirrored geometry, review eligibility before replacement' : 'Valid flip, unchanged'),
      }
    case 'model-query-pro': {
      if (windowName === 'modelquerywindow') return { summary: `Read ${records.length} sample query records.`, rows: results(({ columns }) => `${columns.Category}, ${columns['Matched Rule Value']}`) }
      const profile = get(/^profile$/i) || 'Architecture'
      const scope = get(/^base scope$/i) || 'Project'
      const timings = records.some(({ columns }) => Boolean(columns.Check))
      const filter = get(/^finding state$/i)
      const level = get(/^level$/i) || 'All levels'
      const phase = get(/^created phase$/i) || 'All phases'
      const option = get(/^design option$/i) || 'All options'
      const visible = records.filter(({ columns }) => {
        const finding = REVIEW_FINDINGS.find((entry) => timings ? entry.check === columns.Check : entry.name === columns.Finding)
        return finding && (profile === 'Pre-handover' || finding.profiles.includes(profile))
          && (timings || !['Accepted', 'Resolved', 'Unknown'].includes(filter))
          && (scope !== 'Active view' || finding.level === 'Level 01')
          && (scope !== 'Selection' || finding.selected)
          && (level === 'All levels' || level === finding.level)
          && (phase === 'All phases' || phase === finding.phase)
          && (option === 'All options' || option === finding.option)
      })
      return {
        summary: timings ? `${profile} profile, ${scope}, Sample check timings` : `${profile} profile, ${scope}, ${visible.length} sample findings shown`,
        rows: visible.map(({ label, columns }) => ({ label, value: timings ? `${columns.Outcome}, ${columns.Reviewed} reviewed, ${columns.Issues} issues, ${columns['Read ms']} ms` : `${columns.Finding}, ${columns.Comparison}, IDs ${columns.Elements}` })),
      }
    }
  }
}
