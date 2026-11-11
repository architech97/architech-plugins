import { useId, useState } from 'react'
import type { DemoContext } from '../../types'
import { Btn, Check, RevitDialog } from '../../ui'
import { ConfirmGuard, Receipt, ScopeRadios } from '../../kit'
import { FolioChoice, FolioPreview, FolioText } from '../folioFrame'
import '../folioFrame.css'

interface Pattern { name: string; type: string; angle: number; spacing: number }
const original: Pattern[] = [
  { name: 'AR-02 Brick Running Bond', type: 'Model Pattern', angle: 0, spacing: 75 },
  { name: 'AR-04 Diagonal Hatch', type: 'Model Pattern', angle: 45, spacing: 100 },
  { name: 'FN-01 Timber Boards', type: 'Model Pattern', angle: 90, spacing: 160 },
  { name: 'Drafting - Diagonal', type: 'Detail Pattern', angle: 45, spacing: 1 },
]
const selections = ['No linework selected (Esc)', 'Detail lines, diagonal hatch', 'Filled region, running bond']

export default function MakePattern(ctx: DemoContext) {
  const id = useId()
  const [selection, setSelection] = useState(selections[0])
  const [patterns, setPatterns] = useState(original)
  const [name, setName] = useState('')
  const [type, setType] = useState('Model Pattern')
  const [resolution, setResolution] = useState(true)
  const [filledRegion, setFilledRegion] = useState(false)
  const [flipX, setFlipX] = useState(false)
  const [flipY, setFlipY] = useState(false)
  const [multiplier, setMultiplier] = useState('1.0')
  const [rotation, setRotation] = useState('0')
  const [units, setUnits] = useState('INCH')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<string[]>([])
  const [overwrite, setOverwrite] = useState(false)
  const exportOnly = selection === selections[0]
  const scale = multiplier.trim() ? Number(multiplier.replace(',', '.')) : 1
  const turn = rotation.trim() ? Number(rotation.replace(',', '.')) : 0
  const base = selection === selections[2] ? { angle: 0, spacing: 75 } : { angle: 45, spacing: 100 }
  const flipped = (flipX ? 180 : 0) + (flipX !== flipY ? -base.angle : base.angle)
  const angle = ((flipped + turn) % 360 + 360) % 360
  const spacing = base.spacing * scale / (type === 'Detail Pattern' ? 96 : 1)
  const selected = patterns.find((pattern) => pattern.name === name && pattern.type === type)
  const shown = exportOnly ? selected : { name, type, angle, spacing }
  const status = error || (exportOnly ? 'No Linework Selected. Create is off; you can still export a pattern.' : 'Sample linework selected. Next the native tool picks the tile corners.')
  function verify() {
    if (!name.trim()) return 'Enter a pattern name — it cannot be empty or only spaces.'
    if (name.trim().toLowerCase() === 'solid fill') return '"Solid Fill" is a read-only pattern — choose another name.'
    if (!Number.isFinite(scale) || scale <= 0) return 'Scale Multiplier must be a number above 0 (e.g. 1.5), or blank for 1.0.'
    if (!Number.isFinite(turn)) return 'Rotation must be numeric, or blank for 0.'
    if (/[,\r\n]/.test(name)) return 'Enter a pattern name without commas or line breaks.'
    return ''
  }
  function create(confirmed = false) {
    const issue = verify()
    if (issue) { setError(issue); return }
    if (exportOnly) return
    if (selected && !confirmed) { setOverwrite(true); return }
    setPatterns([...patterns.filter((pattern) => pattern !== selected), { name: name.trim(), type, angle, spacing }])
    setOverwrite(false); setError('')
    setReceipt([name + ', ' + type + ', ' + angle + '°, Repeat ' + spacing.toFixed(3) + ' mm',
      filledRegion ? 'Created a sample Filled Region type using the new foreground pattern.' : 'Existing Filled Region types kept.'])
    ctx.done('configure'); ctx.done('run'); ctx.done('apply'); ctx.done('review')
    ctx.notify({ kind: 'success', text: 'Created ' + name + ' in the sample pattern list.' })
  }
  function exportPat() {
    const issue = verify()
    if (issue) { setError(issue); return }
    const pattern = exportOnly ? selected : { name: name.trim(), type, angle, spacing }
    if (!pattern) { setError('Choose an existing pattern to export.'); return }
    const distance = Number((pattern.spacing / (units === 'INCH' ? 25.4 : 1)).toFixed(6))
    const text = '; Sample Residence browser export\n;%VERSION=3.0\n;%UNITS=' + units + '\n*' + pattern.name + ', Fictional sample pattern\n;%TYPE=' +
      (pattern.type === 'Model Pattern' ? 'MODEL' : 'DRAFTING') + '\n' + pattern.angle + ', 0, 0, 0, ' + distance + '\n'
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = pattern.name.replace(/[<>:"/\\|?*]/g, '_') + '.pat'; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setError(''); setReceipt(['Exported ' + pattern.name + '.pat, ' + units, 'Grid: ' + pattern.angle + ', 0, 0, 0, ' + distance])
    ctx.done('configure'); ctx.done('run'); ctx.done('review')
  }
  return <div className="folio-runtime">
    <div className="ad-card" style={{ marginBottom: 10 }}><FolioChoice label="Sample Revit selection" options={selections} value={selection} onChange={(value) => { setSelection(value); setError('') }} /></div>
    <RevitDialog theme={ctx.theme} onTheme={ctx.setTheme} title="Make Pattern" caption="Turn linework into a fill pattern, or export one as .pat" onClose={ctx.close}
      footer={<><span className="ad-status">{status}</span><Btn demo="pattern-export" onClick={exportPat}>Export PAT File</Btn><Btn primary disabled={exportOnly} onClick={() => create()}>Create Pattern</Btn></>}>
      <section className="ad-card folio-runtime-stack" data-demo="pattern-configure">
        <label className="folio-runtime-field" htmlFor={id}>{exportOnly ? 'Select Pattern to Export' : 'Enter New Pattern Name'}
          <input id={id} className="ad-input" value={name} list={id + '-patterns'} onChange={(event) => { setName(event.target.value); setError('') }} />
          <datalist id={id + '-patterns'}>{patterns.filter((pattern) => pattern.type === type).map(({ name }) => <option key={name} value={name} />)}</datalist>
        </label>
        <ScopeRadios label="Pattern Type" options={['Model Pattern', 'Detail Pattern']} value={type} onChange={(value) => { setType(value); setName(''); setError('') }} />
      </section>
      <fieldset disabled={exportOnly} style={{ opacity: exportOnly ? 0.55 : 1 }} className="ad-card folio-runtime-stack"><legend>Resolver Options</legend>
        <Check label="Use Highest Resolution" checked={resolution} disabled={exportOnly} onChange={setResolution} />
        <Check label="Create Filled Region" checked={filledRegion} disabled={exportOnly} onChange={setFilledRegion} />
        <Check label="Flip Horizontally" checked={flipX} disabled={exportOnly} onChange={setFlipX} />
        <Check label="Flip Vertically" checked={flipY} disabled={exportOnly} onChange={setFlipY} />
        <div className="folio-runtime-fields"><FolioText label="Scale Multiplier" value={multiplier} onChange={(value) => { setMultiplier(value); setError('') }} />
          <FolioText label="Rotation (in Degrees)" value={rotation} onChange={(value) => { setRotation(value); setError('') }} /></div>
      </fieldset>
      <div className="folio-runtime-fields"><FolioText label="Captured View Scale" value={'1/8" = 1\'-0"'} readOnly onChange={() => {}} /><FolioChoice label="Export Units" options={['INCH', 'MM']} value={units} onChange={setUnits} /></div>
      {error && <p role="alert" className="folio-runtime-error">{error}</p>}
      {shown && <FolioPreview title="Sample pattern" rows={[{ label: shown.name || 'New pattern', value: shown.type + ', ' + shown.angle + '°, Repeat ' + shown.spacing.toFixed(3) + ' mm' }]} />}
      {receipt.length > 0 && <Receipt entries={receipt} title="Last sample operation" />}
      <ConfirmGuard open={overwrite} theme={ctx.theme} onTheme={ctx.setTheme} title="Make Pattern" instruction={'Overwrite the existing sample pattern "' + name + '"?'}
        content={filledRegion ? 'The matching sample Filled Region type uses the replacement foreground pattern.' : 'The sample fill pattern is replaced.'} confirmLabel="Overwrite pattern" onConfirm={() => create(true)} onCancel={() => setOverwrite(false)} />
    </RevitDialog>
  </div>
}
