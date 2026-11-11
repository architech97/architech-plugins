import type { WorkflowInput } from '../../generatedWorkflow'
import { enabled, field, numberInRange, resultRow } from '../folioSupport'

const linework: Record<string, { angle: number; repeat: number; text: string }> = {
  'AR-02 Brick Running Bond': { angle: 0, repeat: 75, text: 'Horizontal courses' },
  'AR-04 Diagonal Hatch': { angle: 45, repeat: 100, text: 'Diagonal lines' },
  'FN-01 Timber Boards': { angle: 90, repeat: 160, text: 'Board seams' },
}

export default function result({ action, fields }: WorkflowInput) {
  const name = field(fields, /pattern name/i, 'AR-04 Diagonal Hatch').trim()
  if (!name || /[,\r\n]/.test(name)) return 'Enter a pattern name without commas or line breaks.'
  const scale = numberInRange(field(fields, /^scale multiplier/i).trim() || '1', 0.001, 1000)
  const rotation = numberInRange(field(fields, /^rotation/i).trim() || '0', -36000, 36000)
  if (!Number.isFinite(scale) || !Number.isFinite(rotation)) return 'Enter a positive scale multiplier and a numeric rotation.'
  const source = linework[name] ?? linework['AR-04 Diagonal Hatch']
  const horizontal = enabled(fields, 'Flip Horizontally')
  const vertical = enabled(fields, 'Flip Vertically')
  const flipped = (horizontal ? 180 : 0) + (horizontal !== vertical ? -source.angle : source.angle)
  const angle = ((flipped + rotation) % 360 + 360) % 360
  const type = field(fields, 'PatternTarget', 'Model Pattern')
  const inches = field(fields, 'Export Units') === 'Inches'
  const spacing = Number((source.repeat * scale / (inches ? 25.4 : 1)).toFixed(4))
  const exportPAT = action === 'Export PAT File'
  return {
    summary: exportPAT ? 'Prepared a sample PAT definition for ' + name + '.' : 'Prepared ' + name + ' from the selected sample linework.',
    rows: [
      resultRow('Pattern', type + ' · ' + source.text),
      resultRow('Repeating grid', angle + '° · ' + spacing + (inches ? ' in' : ' mm') + ' apart'),
      exportPAT ? resultRow('PAT grid line', angle + ', 0, 0, 0, ' + spacing) :
        resultRow('Filled region', enabled(fields, 'Create Filled Region') ? 'New type uses the sample pattern as foreground' : 'Unchanged'),
    ],
  }
}
