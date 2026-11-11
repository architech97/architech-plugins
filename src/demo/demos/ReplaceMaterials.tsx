import { useState } from 'react'
import { DEMO_PROJECT } from '../../data/demoProject'
import type { DemoContext } from '../types'
import { Btn, Check, RevitDialog, SearchBox, Select } from '../ui'
import { downloadCsv } from './craftedTools'
import './suiteWorkflow.css'
import './forgeDemo.css'

const CATEGORIES = ['Walls', 'Floors', 'Roofs', 'Ceilings', 'Columns', 'Beams', 'Foundations', 'Stairs', 'Windows', 'Doors', 'Generic Models', 'Casework', 'Furniture', 'Plumbing', 'Pipes + Fittings', 'Ducts + Fittings']
const INTERIORS = ['Walls', 'Floors', 'Ceilings', 'Windows', 'Doors', 'Generic Models', 'Casework', 'Furniture']
const SCOPES = ['Selection', 'Active view', 'Selected rooms', 'Whole model']
const MODES = ['Duplicate system types in scope', 'Edit shared types (review full reach)']
const MATERIALS = ['<By Category>', 'Paint – Warm White', 'Concrete – Exposed', 'Oak – Natural', 'Porcelain – Matt Grey']
const EXAMPLES = [
  { id: 'W-101', category: 'Walls', type: 'Interior Partition 115 mm', material: MATERIALS[1], view: 'Level 01', selected: true, inRoom: false, reference: 'Finish layer 1' },
  { id: 'W-206', category: 'Walls', type: 'Interior Partition 115 mm', material: MATERIALS[1], view: 'Level 02', selected: false, inRoom: false, reference: 'Finish layer 1' },
  { id: 'F-104', category: 'Floors', type: 'Concrete Slab 150 mm', material: MATERIALS[2], view: 'Level 01', selected: true, inRoom: false, reference: 'Structure layer 0' },
  { id: 'C-105', category: 'Ceilings', type: 'Gypsum Ceiling 12.5 mm', material: MATERIALS[1], view: 'Level 01', selected: false, inRoom: false, reference: 'Finish layer 0' },
  { id: 'CW-107', category: 'Casework', type: 'Kitchen Base Cabinet', material: MATERIALS[3], view: 'Level 01', selected: false, inRoom: true, reference: 'Instance material' },
  { id: 'FF-113', category: 'Furniture', type: 'Dining Chair', material: MATERIALS[0], view: 'Level 01', selected: false, inRoom: true, reference: 'Instance material' },
]

type MaterialReference = typeof EXAMPLES[number]
type ScanRow = { item: MaterialReference; outside: number; status: string; blocked: boolean }
type Configuration = { scope: string; mode: string; categories: string[]; find: string; replacement: string }
const DEFAULTS: Configuration = { scope: SCOPES[0], mode: MODES[0], categories: CATEGORIES, find: MATERIALS[0], replacement: MATERIALS[0] }

function inScope(item: MaterialReference, scope: string) {
  if (scope === SCOPES[0]) return item.selected
  if (scope === SCOPES[1]) return item.view === 'Level 01'
  if (scope === SCOPES[2]) return item.inRoom
  return true
}

export default function ReplaceMaterials({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [config, setConfig] = useState(DEFAULTS)
  const [query, setQuery] = useState('')
  const [model, setModel] = useState(EXAMPLES)
  const [scan, setScan] = useState<ScanRow[]>()
  const [receipt, setReceipt] = useState<ScanRow[]>()
  const [palette, setPalette] = useState<Configuration>()
  const [keepOpen, setKeepOpen] = useState(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [navigation, setNavigation] = useState('')
  const canScan = config.categories.length > 0 && config.find !== config.replacement
  const canApply = Boolean(scan?.length && !scan.some(row => row.blocked))
  const shown = CATEGORIES.filter(category => category.toLowerCase().includes(query.trim().toLowerCase()))
  const results = scan ?? receipt

  const configure = (patch: Partial<Configuration>) => {
    setConfig(previous => ({ ...previous, ...patch }))
    setScan(undefined)
    setReceipt(undefined)
    setSelectedRows([])
    setNavigation('')
    rewind('scan')
    done('configure')
  }

  const scanImpact = () => {
    const matches = model.filter(item => config.categories.includes(item.category) && item.material === config.find && inScope(item, config.scope))
    const rows = matches.map(item => {
      const instance = item.reference === 'Instance material'
      const outside = instance ? 0 : model.filter(other => other.type === item.type && !inScope(other, config.scope)).length
      const blocked = config.mode === MODES[1] && outside > 0
      return {
        item, outside, blocked,
        status: blocked ? 'Blocked, shared type reaches outside scope' : instance ? 'Writable instance material' : config.mode === MODES[0] ? 'Duplicate system type in scope' : 'Edit reviewed shared type',
      }
    })
    setReceipt(undefined)
    setScan(rows)
    setSelectedRows([])
    setNavigation('')
    done('configure')
    done('scan')
  }

  const apply = () => {
    if (!scan || !canApply) return
    const ids = new Set(scan.map(row => row.item.id))
    setModel(model.map(item => ids.has(item.id) ? {
      ...item,
      material: config.replacement,
      type: config.mode === MODES[0] && item.reference !== 'Instance material' ? `${item.type}, ${config.replacement}` : item.type,
    } : item))
    setReceipt(scan.map(row => ({ ...row, status: `${row.item.material} → ${config.replacement}` })))
    setScan(undefined)
    done('replace')
    notify({ kind: 'success', text: `${ids.size} material references changed in the sample model.` })
    if (!keepOpen) close()
  }

  return (
    <RevitDialog theme={theme} onTheme={setTheme} eyebrow="Arch Forge / Finishes" title="Replace Materials"
      caption={`Browser simulation, ${DEMO_PROJECT.code} ${DEMO_PROJECT.name}`} onClose={close}
      footer={<>
        <span className="ad-status">{receipt ? 'Replacement applied to sample references' : scan ? 'Read-only impact scan' : 'A fresh impact scan is required'}</span>
        <Btn onClick={close}>Close</Btn>
        <Btn demo="replace-scan" disabled={!canScan} onClick={scanImpact}>Scan impact</Btn>
        {!canApply && !receipt && <span className="ad-hint">{scan?.length ? 'Resolve the blocked rows first.' : 'Run Scan impact first.'}</span>}
        <Btn primary demo="replace-apply" disabled={!canApply} onClick={apply}>Replace materials</Btn>
      </>}>
      <div className="ad-card suite-flow-fields" data-demo="replace-configure">
        <div className="ad-row">
          <label className="suite-flow-control"><span>Work scope</span><Select label="Work scope" value={config.scope} options={SCOPES} onChange={scope => configure({ scope })} /></label>
          <label className="suite-flow-control"><span>Type changes</span><Select label="Type changes" value={config.mode} options={MODES} onChange={mode => configure({ mode })} /></label>
        </div>
        <fieldset className="ad-card suite-flow-options">
          <legend>1, Choose categories ({config.categories.length} selected)</legend>
          <div className="ad-row suite-flow-options-row">
            <SearchBox placeholder="Search categories…" value={query} onChange={setQuery} />
            <Btn sm onClick={() => configure({ categories: INTERIORS })}>Interiors</Btn>
            <Btn sm onClick={() => configure({ categories: CATEGORIES })}>All</Btn>
            <Btn sm onClick={() => configure({ categories: [] })}>Clear</Btn>
          </div>
          {shown.map(category => <Check key={category} label={category} checked={config.categories.includes(category)} onChange={checked => configure({
            categories: checked ? [...config.categories, category] : config.categories.filter(item => item !== category),
          })} />)}
          {!shown.length && <p className="ad-note">No categories match this search.</p>}
        </fieldset>
        <fieldset className="ad-card suite-flow-options">
          <legend>2, Choose materials</legend>
          <label className="suite-flow-control"><span>Find material</span><Select label="Find material" value={config.find} options={MATERIALS} onChange={find => configure({ find })} /></label>
          <label className="suite-flow-control"><span>Replace with</span><Select label="Replace with" value={config.replacement} options={MATERIALS} onChange={replacement => configure({ replacement })} /></label>
          <div className="ad-row suite-flow-options-row">
            <Btn sm onClick={() => configure({ find: MATERIALS[1], replacement: MATERIALS[3] })}>Use sample materials</Btn>
            <Btn sm disabled={!canScan} onClick={() => setPalette(config)}>Save sample palette</Btn>
            <Btn sm disabled={!palette} onClick={() => palette && configure(palette)}>Load sample palette</Btn>
          </div>
        </fieldset>
      </div>
      <section className="ad-card suite-flow-fields" aria-label="Material impact review">
        <strong>3, Review impact</strong>
        <p role="status">{receipt ? `${receipt.length} references updated. Scan again to review the changed sample model.`
          : scan ? scan.some(row => row.blocked) ? 'The impact scan found out-of-scope references. Use a different type policy or scan Whole model.'
            : scan.length ? `${scan.length} matching references. Review the scope before replacing.` : 'No matching references in the chosen categories and scope.'
            : 'Choose different materials and at least one category, then scan.'}</p>
        <div className="ad-row">
          <Btn sm disabled={!selectedRows.length} onClick={() => setNavigation('Sample selection, ' + selectedRows.join(', '))}>Select in Revit</Btn>
          <Btn sm disabled={!selectedRows.length} onClick={() => setNavigation('Sample view focus, ' + selectedRows.join(', '))}>Show in Revit</Btn>
        </div>
        <p className="ad-note">These controls select and focus the listed sample references in this browser exercise.</p>
        {navigation && <p role="status">{navigation}</p>}
        {!!results?.length && <>
          <div className="ad-table-wrap suite-flow-table" tabIndex={0} aria-label="Material impact records">
            <table className="ad-table"><thead><tr><th scope="col">Element</th><th scope="col">Category / type</th><th scope="col">Reference</th><th scope="col">Outside scope</th><th scope="col">Result</th></tr></thead>
              <tbody>{results.map(({ item, outside, status }) => <tr key={item.id} className={selectedRows.includes(item.id) ? 'sel' : undefined}>
                <td><button type="button" className="ad-btn sm" aria-label={'Select impact row ' + item.id} aria-pressed={selectedRows.includes(item.id)}
                  onClick={() => { setSelectedRows(selectedRows.includes(item.id) ? selectedRows.filter(id => id !== item.id) : [...selectedRows, item.id]); setNavigation('') }}>{item.id}</button></td>
                <td>{item.category}, {item.type}</td><td>{item.reference}</td><td>{outside}</td><td>{status}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="ad-row"><Btn sm onClick={() => downloadCsv('AT-01-material-impact.csv', ['Element', 'Category', 'Type', 'Reference', 'Outside scope', 'Result'],
            results.map(({ item, outside, status }) => [item.id, item.category, item.type, item.reference, String(outside), status]))}>Export sample CSV</Btn></div>
        </>}
        <Check label="Keep this window open for the next replacement" checked={keepOpen} onChange={setKeepOpen} />
      </section>
    </RevitDialog>
  )
}
