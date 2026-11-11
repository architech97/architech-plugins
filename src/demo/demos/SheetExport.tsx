import { useEffect, useRef, useState } from 'react'
import { SHEETS } from '../sample'
import type { DemoContext } from '../types'
import { Btn, Check, Radio, RevitDialog, SearchBox, Select, TextBox } from '../ui'
import { downloadCsv } from './craftedTools'
import './suiteWorkflow.css'
import './sheetExport.css'

const stages = [
  ['Selection', 'Tick the sheets or views to export. Search, filter, or pick a publish set.'],
  ['Format', 'Pick the export formats and set the options for each one.'],
  ['Create', 'Check the file names, choose the output folder, then export.'],
] as const
const formats = ['PDF', 'DWG', 'DGN', 'DWF', 'NWC', 'IFC', 'IMG', 'XML'] as const
type Format = typeof formats[number]
type OutputRow = { type: Format; name: string; items: string; label: string; size: string }
const drawingItems = [
  ...SHEETS.filter((sheet) => !sheet.placeholder).map((sheet) => ({ ...sheet, kind: 'Sheet', size: '841 × 594 mm' })),
  { id: -1, number: 'V-01', name: 'Ground Floor Working Plan', revision: 'P02', kind: 'View', size: 'View default' },
  { id: -2, number: 'V-02', name: 'Coordination 3D', revision: 'P02', kind: 'View', size: 'View default' },
]
const publishSets = ['Floor plans', 'P02 issue sheets', 'Coordination views'] as const
const nameFields = ['Sheet Number', 'Sheet Name', 'Current Revision'] as const
const dwgFlags = {
  'Export views on sheets and links as external references': false,
  'Bind Images and PDF as OLE in DWG File': true,
  'Fit each drawing to its sheet and save': true,
  'Clean .pcp files after export': true,
}
type NameField = typeof nameFields[number]
type NamePart = { field: NameField; prefix: string; suffix: string; separator: string }
const defaultRule: NamePart[] = [
  { field: 'Sheet Number', prefix: '', suffix: '', separator: '_' },
  { field: 'Sheet Name', prefix: '', suffix: '', separator: '' },
]
const formatOptions: Partial<Record<Format, [string, string[]]>> = {
  DWG: ['Select Export Setup', ['<in-session default>', 'AT-01 coordination']],
  DGN: ['Select Export Setup', ['<in-session export setup>', 'AT-01 metric']],
  DWF: ['DWF Options', ['DWF', 'DWFx']],
  NWC: ['Export scope', ['Current view', 'Entire project']],
  IFC: ['IFC Version', ['IFC 2x3 Coordination View 2.0', 'IFC4 Reference View', 'IFC4 Design Transfer View']],
  IMG: ['Format', ['PNG', 'JPEG']],
}
const safeNameText = (name: string) => name.replace(/[<>:"/\\|?*]/g, '')
const cleanName = (name: string) => safeNameText(name).trim()
const valueFor = (item: typeof drawingItems[number], field: NameField) =>
  field === 'Sheet Number' ? item.number : field === 'Sheet Name' ? item.name : item.revision
const renderName = (item: typeof drawingItems[number], rule: NamePart[]) =>
  cleanName(rule.map(({ field, prefix, suffix, separator }, index) => prefix + valueFor(item, field) + suffix + (index < rule.length - 1 ? separator : '')).join(''))

type Profile = { output: Format[]; color: string; combine: boolean; choices: Partial<Record<Format, string>>; rule: NamePart[]; dwg: typeof dwgFlags }
type Overlay = 'publish' | 'profile' | 'name' | 'review'

export default function SheetExport({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState('')
  const [showSheets, setShowSheets] = useState(true)
  const [showViews, setShowViews] = useState(false)
  const [selectedOnly, setSelectedOnly] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [output, setOutput] = useState<Format[]>(['PDF'])
  const [format, setFormat] = useState<Format>('PDF')
  const [choices, setChoices] = useState<Profile['choices']>({})
  const [color, setColor] = useState('Color')
  const [combine, setCombine] = useState(false)
  const [combinedName, setCombinedName] = useState('AT-01_P02_Drawing-set')
  const [orientation, setOrientation] = useState('Sheet default')
  const [dwg, setDwg] = useState(dwgFlags)
  const [customNames, setCustomNames] = useState<Record<number, string>>({})
  const [rule, setRule] = useState(defaultRule)
  const [draftRule, setDraftRule] = useState(defaultRule)
  const [paramQuery, setParamQuery] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profile, setProfile] = useState('')
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [publishSet, setPublishSet] = useState<string>(publishSets[0])
  const [folder, setFolder] = useState('')
  const [filePolicy, setFilePolicy] = useState('Stop if a file exists')
  const [separate, setSeparate] = useState(true)
  const [register, setRegister] = useState(false)
  const [complete, setComplete] = useState(false)
  const [overlay, setOverlay] = useState<Overlay>()
  const modal = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (overlay && !modal.current?.open) modal.current?.showModal()
    if (!overlay && modal.current?.open) modal.current.close()
  }, [overlay])

  const chosen = drawingItems.filter((item) => selected.includes(item.id))
  const nameFor = (item: typeof drawingItems[number]) => cleanName(customNames[item.id] ?? '') || renderName(item, rule) || item.number
  const shown = drawingItems.filter((item) =>
    (item.kind === 'Sheet' ? showSheets : showViews)
    && (!selectedOnly || selected.includes(item.id))
    && [item.number, item.name, nameFor(item)].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  const rows = chosen.length ? output.flatMap<OutputRow>((type) => type === 'XML' || (type === 'PDF' && combine)
    ? [{ type, name: type === 'XML' ? 'AT-01_Sheets.xml' : (cleanName(combinedName) || 'AT-01_P02_Drawing-set') + '.pdf', items: chosen.map((item) => item.number).join('; '), label: 'Combined output', size: '—' }]
    : chosen.map((item) => {
      const ext = type === 'IMG' ? (choices.IMG === 'JPEG' ? 'jpg' : 'png') : type === 'DWF' && choices.DWF === 'DWFx' ? 'dwfx' : type.toLowerCase()
      return { type, name: nameFor(item) + '.' + ext, items: item.number, label: item.name, size: item.size }
    })) : []
  const collision = new Set(rows.map((row) => row.name.toLowerCase())).size !== rows.length
  const invalid = !rows.length || !folder.trim() || collision
  const selectedSet = new Set(selected)
  const invalidate = (id: string) => { setComplete(false); rewind(id) }
  const select = (ids: number[]) => { setSelected(ids); invalidate('selection') }
  const toggle = (ids: number[], checked: boolean) => select(checked
    ? [...new Set([...selected, ...ids])]
    : selected.filter((id) => !ids.includes(id)))
  const go = (index: number) => {
    if (index > 0 && chosen.length) done('selection')
    if (index > 1 && output.length && chosen.length) done('format')
    setStep(index)
  }
  const changeFormat = (type: Format) => {
    setOutput(formats.filter((item) => item === type ? !output.includes(item) : output.includes(item)))
    invalidate('format')
  }
  const review = () => {
    go(2)
    if (!invalid) setOverlay('review')
  }
  const choosePublishSet = () => {
    select(drawingItems.filter((item) => publishSet === 'Floor plans'
      ? item.kind === 'Sheet' && ['A-101', 'A-102'].includes(item.number)
      : publishSet === 'P02 issue sheets' ? item.kind === 'Sheet' && item.revision === 'P02' : item.kind === 'View').map((item) => item.id))
    setShowSheets(publishSet !== 'Coordination views')
    setShowViews(publishSet === 'Coordination views')
    setOverlay(undefined)
  }
  const saveProfile = () => {
    const name = profileName.trim()
    if (!name) return
    setProfiles({ ...profiles, [name]: { output, color, combine, choices, rule, dwg } })
    setProfile(name)
    setOverlay(undefined)
  }
  const loadProfile = () => {
    const saved = profiles[profile]
    if (!saved) return
    setOutput(saved.output); setColor(saved.color); setCombine(saved.combine); setChoices(saved.choices); setRule(saved.rule); setDwg(saved.dwg)
    invalidate('format')
    notify({ kind: 'info', text: 'Loaded sample profile ' + profile + '.' })
  }
  const movePart = (index: number, offset: number) => {
    const next = [...draftRule]
    const [part] = next.splice(index, 1)
    next.splice(index + offset, 0, part)
    setDraftRule(next)
  }
  const setting = formatOptions[format]
  const nameExample = chosen[0] ?? drawingItems[0]

  return (
    <RevitDialog theme={theme} onTheme={setTheme} title="Sheet Export" caption="Selection, Format, Create" onClose={close}
      footer={<><span className="ad-status" role="status">{complete ? rows.length + ' sample output entries ready' : step < 2 ? 'Ready' : rows.length + ' item(s) ready to export'}</span>
        <Btn disabled={!step} onClick={() => go(step - 1)}>Back</Btn>
        <Btn demo={step === 0 ? 'continue-selection' : 'continue-format'} disabled={step === 2 || !chosen.length} onClick={() => go(step + 1)}>Next</Btn>
        <Btn primary demo="run-sheet-export" disabled={!chosen.length || (step === 2 && (invalid || complete))} onClick={review}>Review and export</Btn>
      </>}>
      <div className="sheet-export-workspace" onKeyDown={(event) => {
        if (event.ctrlKey && /^[123]$/.test(event.key)) { event.preventDefault(); go(Number(event.key) - 1) }
      }}>
        <nav className="sheet-export-steps" aria-label="Export stages">
          <span className="ad-label">Steps</span>
          {stages.map(([name, hint], index) => <button type="button" key={name} aria-current={step === index ? 'step' : undefined} onClick={() => go(index)}>
            <span aria-hidden="true">{index + 1}</span><strong>{name}</strong><small>{hint}</small>
          </button>)}
          <small className="sheet-export-shortcut">Ctrl+1 to Ctrl+3 switch sections. Each section keeps its choices.</small>
        </nav>
        <div className="sheet-export-content">
          <header className="sheet-export-heading">
            <div><h3>{stages[step][0]}</h3><p>{stages[step][1]}</p></div>
            {step > 0 && <div className="ad-row" role="group" aria-label={step === 1 ? 'Show options for' : 'Export as'}>
              <span className="ad-note">{step === 1 ? 'Show options for' : 'Export as (pick one or more)'}</span>
              {formats.map((type) => <Btn sm key={type} primary={step === 1 ? format === type : output.includes(type)}
                aria-pressed={step === 1 ? format === type : output.includes(type)} onClick={() => step === 1 ? setFormat(type) : changeFormat(type)}>{type}</Btn>)}
            </div>}
          </header>

          {step === 0 && <>
            <div className="ad-row sheet-export-profiles">
              <span className="ad-label">Profile</span><Select label="Profile" value={profile} options={['', ...Object.keys(profiles)]} onChange={setProfile} width={160} />
              <Btn sm onClick={() => { setProfileName(profile); setOverlay('profile') }}>Save</Btn>
              <Btn sm disabled={!profile} onClick={loadProfile}>Load</Btn>
              <Btn sm disabled={!profile} onClick={() => { setProfiles(Object.fromEntries(Object.entries(profiles).filter(([name]) => name !== profile))); setProfile('') }}>Delete</Btn>
              <Btn sm onClick={() => setOverlay('publish')}>Select from Publish Set...</Btn>
            </div>
            <div className="ad-card sheet-export-card">
              <strong>{showViews && !showSheets ? 'Views to export' : showViews ? 'Sheets and views to export' : 'Sheets to export'}</strong>
              <div className="ad-row sheet-export-selection">
                <SearchBox value={query} onChange={setQuery} placeholder="Search number, name or file name" />
                <Btn sm primary={showSheets} aria-pressed={showSheets} onClick={() => { setShowSheets(!showSheets); if (showSheets && !showViews) setShowViews(true) }}>Sheets</Btn>
                <Btn sm primary={showViews} aria-pressed={showViews} onClick={() => { setShowViews(!showViews); if (showViews && !showSheets) setShowSheets(true) }}>Views</Btn>
                <Btn sm primary={selectedOnly} aria-pressed={selectedOnly} onClick={() => setSelectedOnly(!selectedOnly)}>Selected</Btn>
                <Btn sm demo="tick-shown" disabled={!shown.length} onClick={() => toggle(shown.map((item) => item.id), true)}>Tick shown</Btn>
                <Btn sm onClick={() => select([])}>Clear ticks</Btn>
              </div>
              <div className="ad-table-wrap suite-flow-table" tabIndex={0} aria-label="Sheets and views to export">
                <table className="ad-table"><thead><tr><th scope="col"><Check title="Tick all shown" checked={!!shown.length && shown.every((item) => selectedSet.has(item.id))} onChange={(checked) => toggle(shown.map((item) => item.id), checked)} /></th>
                  <th scope="col">Sheet number</th><th scope="col">Sheet name</th><th scope="col">Size</th><th scope="col">Custom file name</th></tr></thead>
                  <tbody>{shown.map((item) => <tr key={item.id}>
                    <td><Check title={'Select ' + item.number} checked={selectedSet.has(item.id)} onChange={(checked) => toggle([item.id], checked)} /></td>
                    <td>{item.number}</td><td>{item.name}</td><td>{item.size}</td>
                    <td><TextBox aria-label={'Custom file name for ' + item.number} value={customNames[item.id] ?? ''} placeholder={nameFor(item)} maxLength={90}
                      onChange={(event) => { setCustomNames({ ...customNames, [item.id]: safeNameText(event.target.value) }); invalidate('selection') }} /></td>
                  </tr>)}</tbody></table>
                {!shown.length && <p className="suite-flow-note">No sheets or views match this search.</p>}
              </div>
              <p className="ad-note" role="status">{shown.filter((item) => selectedSet.has(item.id)).length} of {shown.length} shown ticked, {chosen.length} selected</p>
            </div>
          </>}

          {step === 1 && <div className="sheet-export-options">
            {format === 'PDF' ? <>
              <div className="ad-card sheet-export-card"><strong>Appearance</strong>
                <label>Colors<Select label="PDF colors" value={color} options={['Color', 'Grayscale', 'BlackLine']} onChange={(value) => { setColor(value); invalidate('format') }} /></label>
                <label>Orientation<Select label="Orientation" value={orientation} options={['Sheet default', 'Portrait', 'Landscape']} onChange={(value) => { setOrientation(value); invalidate('format') }} /></label>
              </div>
              <div className="ad-card sheet-export-card"><strong>File</strong>
                <Radio name="sheet-export-pdf-mode" label="Create separate files" checked={!combine} onChange={() => { setCombine(false); invalidate('format') }} />
                <Radio name="sheet-export-pdf-mode" label="Combine into a single file" checked={combine} onChange={() => { setCombine(true); invalidate('format') }} />
                {combine && <label>Combined file name<TextBox value={combinedName} onChange={(event) => { setCombinedName(event.target.value); invalidate('format') }} /></label>}
              </div>
            </> : setting ? <div className="ad-card sheet-export-card">
              <strong>{setting[0]}</strong>
              <Select label={setting[0]} value={choices[format] ?? setting[1][0]} options={setting[1]} onChange={(value) => { setChoices({ ...choices, [format]: value }); invalidate('format') }} />
              {format === 'DWG' && <fieldset className="sheet-export-dwg"><legend>Options</legend>
                {(Object.keys(dwg) as Array<keyof typeof dwg>).map((flag) => <Check key={flag} label={flag} checked={dwg[flag]}
                  disabled={flag === 'Fit each drawing to its sheet and save' && dwg['Bind Images and PDF as OLE in DWG File']} onChange={(value) => {
                  setDwg({ ...dwg, [flag]: value }); invalidate('format')
                }} />)}
                {dwg['Bind Images and PDF as OLE in DWG File'] && <p className="ad-note">Fitting is handled by the OLE operation while binding is on.</p>}
              </fieldset>}
              <p className="ad-note">This setup is included in the sample output manifest.</p>
            </div> : <div className="ad-card sheet-export-card"><strong>Sheet metadata</strong><p className="ad-note">XML combines the selected sheets into one metadata manifest.</p></div>}
          </div>}

          {step === 2 && <>
            <div className="ad-card sheet-export-card">
              <strong>Export Rules</strong>
              <div className="ad-row sheet-export-folder"><label>Folder Selection<TextBox value={folder} placeholder="Choose a sample output folder" onChange={(event) => { setFolder(event.target.value); invalidate('export') }} /></label>
                <Btn sm aria-label="Choose sample output folder" onClick={() => { setFolder('AT-01 / Drawing Issue'); invalidate('export') }}>...</Btn></div>
              <Check label="Drawing Register (sample CSV)" checked={register} onChange={(value) => { setRegister(value); invalidate('export') }} />
            </div>
            <div className="ad-row sheet-export-create">
              <label>Existing files <Select label="Existing file policy" value={filePolicy} options={['Stop if a file exists', 'Replace reviewed files']} onChange={(value) => { setFilePolicy(value); invalidate('export') }} /></label>
              <Check label="Separate format folders" checked={separate} onChange={(value) => { setSeparate(value); invalidate('export') }} />
              <Btn sm onClick={() => { setDraftRule(rule); setParamQuery(''); setOverlay('name') }}>Sheet File Name</Btn>
              <Btn sm onClick={() => notify({ kind: collision ? 'warning' : 'info', text: collision ? 'Resolve duplicate output names before export.' : rows.length + ' sample output entries in the preview.' })}>Refresh preview</Btn>
            </div>
            <div className="ad-table-wrap suite-flow-table" tabIndex={0} aria-label="Planned output files"><table className="ad-table">
              <thead><tr>{['Sheet number', 'Sheet name', 'Output name', 'Format', 'Size', 'Orientation', 'Status'].map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
              <tbody>{rows.map((row, index) => <tr key={index}><td>{row.items}</td><td>{row.label}</td><td>{row.name}</td><td>{row.type}</td><td>{row.size}</td><td>{row.type === 'PDF' ? orientation : 'Sheet default'}</td><td>{complete ? 'Sample ready' : 'Queued'}</td></tr>)}</tbody>
            </table></div>
            {collision && <p role="alert" className="suite-flow-error">Two outputs have the same name. Edit a custom name or the sheet naming rule.</p>}
            {!folder.trim() && <p className="ad-note">Choose a sample output folder to review the export.</p>}
            {complete && <div className="ad-card suite-flow-receipt">
              <div className="ad-row">
                <Btn onClick={() => downloadCsv('AT-01-sheet-export-manifest.csv', ['File name', 'Format', 'Sheets', 'PDF colors', 'Folder', 'Options'],
                  rows.map((row) => [row.name, row.type, row.items, row.type === 'PDF' ? color : '', separate ? folder + '/' + row.type : folder,
                    row.type === 'PDF' ? orientation : [choices[row.type], ...(row.type === 'DWG' ? Object.keys(dwg).filter((flag) => dwg[flag as keyof typeof dwg]) : [])].filter(Boolean).join(', ')]))}>Download sample manifest</Btn>
                {register && <Btn onClick={() => downloadCsv('AT-01-drawing-register.csv', ['Sheet number', 'Sheet name', 'Revision'],
                  chosen.filter((item) => item.kind === 'Sheet').map((item) => [item.number, item.name, item.revision]))}>Download drawing register CSV</Btn>}
              </div>
            </div>}
          </>}
        </div>
      </div>

      <dialog ref={modal} className="sheet-export-modal" aria-labelledby="sheet-export-modal-title" onClose={() => setOverlay(undefined)}>
        <h3 id="sheet-export-modal-title">{overlay === 'publish' ? 'Select from Publish Set' : overlay === 'profile' ? 'Save Profile' : overlay === 'name' ? 'Custom File Name' : 'Review and export'}</h3>
        {overlay === 'publish' && <><Select label="Publish set" value={publishSet} options={[...publishSets]} onChange={setPublishSet} /><div className="ad-row"><Btn onClick={() => setOverlay(undefined)}>Cancel</Btn><Btn primary onClick={choosePublishSet}>OK</Btn></div></>}
        {overlay === 'profile' && <><label>Profile name<TextBox maxLength={48} value={profileName} onChange={(event) => setProfileName(event.target.value)} /></label><div className="ad-row"><Btn onClick={() => setOverlay(undefined)}>Cancel</Btn><Btn primary disabled={!profileName.trim()} onClick={saveProfile}>Save profile</Btn></div></>}
        {overlay === 'name' && <>
          <div className="sheet-export-name">
            <div className="sheet-export-card"><strong>Available parameters</strong><SearchBox placeholder="Search parameters" value={paramQuery} onChange={setParamQuery} />
              {nameFields.filter((field) => field.toLowerCase().includes(paramQuery.toLowerCase())).map((field) => <Btn sm key={field} disabled={draftRule.some((part) => part.field === field)}
                onClick={() => setDraftRule([...draftRule, { field, prefix: '', suffix: '', separator: '_' }])}>Add {field}</Btn>)}</div>
            <div className="ad-table-wrap"><table className="ad-table"><thead><tr>{['Parameter Name', 'Prefix', 'Sample Value', 'Suffix', 'Separator', 'Order'].map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>
              {draftRule.map((part, index) => <tr key={part.field}><th scope="row">{part.field}</th>
                {(['prefix', 'sample', 'suffix', 'separator'] as const).map((key) => <td key={key}>{key === 'sample' ? valueFor(nameExample, part.field) : <TextBox aria-label={part.field + ' ' + key} maxLength={16} value={part[key]} onChange={(event) => setDraftRule(draftRule.map((row, i) => i === index ? { ...row, [key]: event.target.value } : row))} />}</td>)}
                <td className="sheet-export-order">
                  <Btn sm disabled={!index} aria-label={'Move ' + part.field + ' up'} onClick={() => movePart(index, -1)}>↑</Btn>
                  <Btn sm disabled={index === draftRule.length - 1} aria-label={'Move ' + part.field + ' down'} onClick={() => movePart(index, 1)}>↓</Btn>
                  <Btn sm aria-label={'Remove ' + part.field} onClick={() => setDraftRule(draftRule.filter((row) => row.field !== part.field))}>×</Btn>
                </td>
              </tr>)}
            </tbody></table></div>
          </div>
          <p className="ad-note">Custom Name Preview <strong>{renderName(nameExample, draftRule) || '—'}</strong></p>
          <div className="ad-row"><Btn onClick={() => setOverlay(undefined)}>Cancel</Btn><Btn primary disabled={!draftRule.length} onClick={() => { setRule(draftRule); invalidate('export'); setOverlay(undefined) }}>OK</Btn></div>
        </>}
        {overlay === 'review' && <>
          <p>Review {rows.length} sample output entries for {folder}.</p><p className="ad-note">{filePolicy}, {separate ? 'Separate format folders' : 'Single folder'}. The browser produces a manifest of the planned outputs.</p>
          <div className="ad-row"><Btn onClick={() => setOverlay(undefined)}>Cancel</Btn><Btn primary onClick={() => {
            setComplete(true); done('export'); setOverlay(undefined); notify({ kind: 'success', text: 'Prepared ' + rows.length + ' sample output entries.' })
          }}>Run sample export</Btn></div>
        </>}
      </dialog>
    </RevitDialog>
  )
}
