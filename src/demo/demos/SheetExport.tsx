import { useState } from 'react'
import { SHEETS } from '../sample'
import type { DemoContext } from '../types'
import { Btn, Check, RevitDialog, SearchBox, Select, TextBox } from '../ui'
import { downloadCsv } from './craftedTools'
import './suiteWorkflow.css'

const sheets = SHEETS.filter(sheet => !sheet.placeholder)
const formats = ['PDF', 'DWG', 'DGN', 'DWF', 'NWC', 'IFC', 'IMG', 'XML']
const steps = ['Selection', 'Format', 'Create']

export default function SheetExport({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [output, setOutput] = useState<string[]>(['PDF'])
  const [color, setColor] = useState('Color')
  const [combine, setCombine] = useState(false)
  const [customNames, setCustomNames] = useState<Record<number, string>>({})
  const [register, setRegister] = useState(true)
  const [complete, setComplete] = useState(false)

  const shown = sheets.filter(sheet => (sheet.number + ' ' + sheet.name).toLowerCase().includes(query.trim().toLowerCase()))
  const chosen = sheets.filter(sheet => selected.includes(sheet.id))
  const rows = output.flatMap(format => format === 'PDF' && combine
    ? [{ format, name: 'AT-01_P02_Drawing-set.pdf', sheets: chosen.map(sheet => sheet.number).join('; ') }]
    : chosen.map(sheet => ({
      format,
      name: (customNames[sheet.id]?.trim() || sheet.number + '_' + sheet.revision) + '.' + (format === 'IMG' ? 'png' : format.toLowerCase()),
      sheets: sheet.number,
    })))
  const collision = new Set(rows.map(row => row.name.toLowerCase())).size !== rows.length

  const invalidate = (id: string) => { setComplete(false); rewind(id) }
  const select = (ids: number[]) => { setSelected(ids); invalidate('selection') }
  const changeFormat = (format: string, checked: boolean) => {
    setOutput(output.filter(value => value !== format).concat(checked ? [format] : []))
    invalidate('format')
  }
  const next = () => {
    done(step === 0 ? 'selection' : 'format')
    setStep(step + 1)
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="Sheet Export" caption="Selection · Format · Create" onClose={close}
      footer={<><span className="ad-status">{chosen.length} sheets selected · {output.length} formats</span>
        {step > 0 && <Btn onClick={() => setStep(step - 1)}>Back</Btn>}
        {step < 2 && <Btn primary demo={step === 0 ? 'continue-selection' : 'continue-format'} disabled={!chosen.length || (step === 1 && !output.length)} onClick={next}>Next</Btn>}
        {step === 2 && <Btn primary demo="run-sheet-export" disabled={collision || complete} onClick={() => {
          setComplete(true)
          done('export')
          notify({ kind: 'success', text: 'Prepared ' + rows.length + ' sample output entries.' })
        }}>Run sample export</Btn>}
      </>}>
      <div className="suite-flow-steps" aria-label="Export stages">{steps.map((name, index) => <span key={name} aria-current={index === step ? 'step' : undefined}>0{index + 1} {name}</span>)}</div>
      {step === 0 && <>
        <div className="ad-row">
          <SearchBox value={query} onChange={setQuery} placeholder="Search sheets" />
          <Btn demo="tick-shown" disabled={!shown.length} onClick={() => select([...new Set([...selected, ...shown.map(sheet => sheet.id)])])}>Tick shown</Btn>
          <Btn onClick={() => select([])}>Clear ticks</Btn>
        </div>
        <div className="ad-table-wrap suite-flow-table" tabIndex={0} aria-label="Sheets to export">
          <table className="ad-table"><thead><tr><th scope="col">Select</th><th scope="col">Sheet number</th><th scope="col">Sheet name</th><th scope="col">Custom file name</th></tr></thead>
            <tbody>{shown.map(sheet => <tr key={sheet.id}>
              <td><Check title={'Select ' + sheet.number} checked={selected.includes(sheet.id)} onChange={checked => select(checked ? [...selected, sheet.id] : selected.filter(id => id !== sheet.id))} /></td>
              <td>{sheet.number}</td><td>{sheet.name}</td>
              <td><TextBox aria-label={'Custom file name for ' + sheet.number} value={customNames[sheet.id] ?? ''} placeholder={sheet.number + '_' + sheet.revision} maxLength={48} onChange={event => {
                setCustomNames({ ...customNames, [sheet.id]: event.target.value.replace(/[<>:"/\\|?*]/g, '') })
                invalidate('selection')
              }} /></td>
            </tr>)}</tbody>
          </table>
          {!shown.length && <p className="suite-flow-note">No sheets match this search.</p>}
        </div>
      </>}
      {step === 1 && <>
        <fieldset className="ad-card suite-flow-options"><legend>Export formats</legend>{formats.map(format => <Check key={format} label={format} checked={output.includes(format)} onChange={checked => changeFormat(format, checked)} />)}</fieldset>
        {output.includes('PDF') && <div className="ad-card suite-flow-fields">
          <label>PDF colors<Select label="PDF colors" value={color} options={['Color', 'Grayscale', 'BlackLine']} onChange={value => { setColor(value); invalidate('format') }} /></label>
          <Check label="Combine into a single PDF" checked={combine} onChange={value => { setCombine(value); invalidate('format') }} />
        </div>}
        <p className="ad-note">Formats are included in the sample manifest. Revit generates the actual drawing files.</p>
      </>}
      {step === 2 && <>
        <Check label="Include drawing register" checked={register} onChange={value => { setRegister(value); invalidate('export') }} />
        <div className="ad-table-wrap suite-flow-table" tabIndex={0} aria-label="Planned output files"><table className="ad-table">
          <thead><tr><th scope="col">File name</th><th scope="col">Format</th><th scope="col">Sheets</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}><td>{row.name}</td><td>{row.format === 'PDF' ? 'PDF · ' + color : row.format}</td><td>{row.sheets}</td></tr>)}</tbody>
        </table></div>
        {collision && <p role="alert" className="suite-flow-error">Two outputs have the same name. Go back to Selection and give each sheet a unique name.</p>}
        {complete && <div className="ad-card suite-flow-receipt" role="status">
          <strong>{rows.length} sample output entries ready</strong>
          <div className="ad-row">
            <Btn onClick={() => downloadCsv('AT-01-sheet-export-manifest.csv', ['File name', 'Format', 'Sheets', 'PDF colors'],
              rows.map(row => [row.name, row.format, row.sheets, row.format === 'PDF' ? color : '']))}>Download sample manifest</Btn>
            {register && <Btn onClick={() => downloadCsv('AT-01-drawing-register.csv', ['Sheet number', 'Sheet name', 'Revision'],
              chosen.map(sheet => [sheet.number, sheet.name, sheet.revision]))}>Download drawing register CSV</Btn>}
          </div>
        </div>}
      </>}
    </RevitDialog>
  )
}
