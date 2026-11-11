import { useState, type ReactNode } from 'react'
import { Btn, Check, SearchBox, Select, TextBox } from '../ui'
import './forgeDemo.css'

type FamilyMode = 'Transfer' | 'Families'
type Definition = { name: string; type: string; binding: string }
type Family = { name: string; category: string; definitions: Definition[] }
const FAMILIES: Family[] = [
  { name: 'Single Flush', category: 'Doors', definitions: [{ name: 'Hardware Set', type: 'Text', binding: 'Type' }, { name: 'Fire Rating', type: 'Text', binding: 'Type' }] },
  { name: 'Double Flush', category: 'Doors', definitions: [{ name: 'Fire Rating', type: 'Text', binding: 'Type' }] },
  { name: 'Fixed Window', category: 'Windows', definitions: [{ name: 'Glazing Code', type: 'Text', binding: 'Instance' }] },
]
const NEW: Definition = { name: '', type: 'Text', binding: 'Instance' }
const TYPES = ['Text', 'Integer', 'Number', 'Length', 'Yes/No']

export default function ForgeFamilyParameters({ mode, close, nestedTools, familyDocument }: { mode: FamilyMode; close: () => void; nestedTools: ReactNode; familyDocument: boolean }) {
  const [families, setFamilies] = useState(FAMILIES)
  const [source, setSource] = useState(FAMILIES[0].name)
  const [selected, setSelected] = useState<string[]>([])
  const [targets, setTargets] = useState<Record<FamilyMode, string[]>>({ Transfer: [], Families: [] })
  const [draft, setDraft] = useState<Definition>(NEW)
  const [newDefinition, setNewDefinition] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [prefixDraft, setPrefixDraft] = useState('')
  const [queries, setQueries] = useState<Record<FamilyMode, string>>({ Transfer: '', Families: '' })
  const [hideUnchecked, setHideUnchecked] = useState<Record<FamilyMode, boolean>>({ Transfer: false, Families: false })
  const [confirmedMode, setConfirmedMode] = useState<FamilyMode>()
  const [receipt, setReceipt] = useState<{ mode: FamilyMode; created: number; skipped: number }>()
  const sourceFamily = families.find(family => family.name === source) ?? families[0]
  const transfer = mode === 'Transfer'
  const definitions = transfer ? sourceFamily.definitions.filter(definition => selected.includes(definition.name))
    .map(definition => ({ ...definition, name: `${prefix}${definition.name}`.trim() })) : newDefinition && draft.name.trim() ? [{ ...draft, name: draft.name.trim() }] : []
  const destinations = targets[mode].filter(name => !transfer || name !== source)
  const matches = (value: string) => value.toLowerCase().includes(queries[mode].trim().toLowerCase())
  const visibleDefinitions = sourceFamily.definitions.filter(definition => matches(definition.name) && (!hideUnchecked[mode] || selected.includes(definition.name)))
  const visibleTargets = families.filter(family => transfer ? family.name !== source : matches(family.name) && (!hideUnchecked[mode] || destinations.includes(family.name)))
  const clear = () => { setConfirmedMode(undefined); setReceipt(undefined) }

  const apply = () => {
    let created = 0
    let skipped = 0
    const updated = families.map(family => {
      if (!destinations.includes(family.name)) return family
      const next = [...family.definitions]
      for (const definition of definitions) {
        if (next.some(existing => existing.name.toLowerCase() === definition.name.toLowerCase())) { skipped++; continue }
        next.push(definition)
        created++
      }
      return { ...family, definitions: next }
    })
    setFamilies(updated)
    setConfirmedMode(undefined)
    setReceipt({ mode, created, skipped })
  }

  if (!transfer && familyDocument) return <div className="forge-family-demo">
    {nestedTools}
    <p className="ad-note">This sample family has nested components. Choose Nested Parameters to load and associate their definitions.</p>
    <div className="ad-row"><Btn onClick={close}>Close</Btn></div>
  </div>

  return (
    <div className="forge-family-demo">
      <div className="ad-row">
        {!transfer && <Btn onClick={() => { setNewDefinition(true); clear() }}>+ Add Parameter</Btn>}
        <Check label="Hide un-checked" checked={hideUnchecked[mode]} onChange={checked => setHideUnchecked({ ...hideUnchecked, [mode]: checked })} />
        <SearchBox placeholder={transfer ? 'Search parameters…' : 'Search families…'} value={queries[mode]} onChange={query => setQueries({ ...queries, [mode]: query })} />
      </div>
      {!transfer && nestedTools}
      <div className="ad-grid2 crafted-layout">
        <section className="ad-card suite-flow-fields" aria-label={transfer ? 'Transfer source' : 'New family parameter'}>
          <strong>{transfer ? 'Source family and definitions' : 'Define a family parameter'}</strong>
          {transfer ? <>
            <label><span>Select Family</span><Select label="Select source family" value={source} options={families.map(family => family.name)}
              onChange={value => { setSource(value); setSelected([]); setPrefix(''); setPrefixDraft(''); clear() }} /></label>
            {visibleDefinitions.map(definition => <Check key={definition.name} label={`${prefix}${definition.name}, ${definition.type}, ${definition.binding}`}
              checked={selected.includes(definition.name)} onChange={checked => { setSelected(checked ? [...selected, definition.name] : selected.filter(name => name !== definition.name)); clear() }} />)}
            {!visibleDefinitions.length && <p className="ad-note">No source parameters match the current filters.</p>}
            <label><span>Parameter name prefix</span><TextBox aria-label="Parameter name prefix" value={prefixDraft} maxLength={32} onChange={event => setPrefixDraft(event.target.value)} /></label>
            <div className="ad-row"><Btn sm disabled={!selected.length} onClick={() => { setPrefix(prefixDraft); clear() }}>Modify</Btn>
              <Btn sm disabled={!prefix && !prefixDraft} onClick={() => { setPrefix(''); setPrefixDraft(''); clear() }}>Restore names</Btn></div>
          </> : newDefinition ? <>
            <label><span>Parameter name</span><TextBox aria-label="New family parameter name" value={draft.name} maxLength={60}
              onChange={event => { setDraft({ ...draft, name: event.target.value }); clear() }} /></label>
            <label><span>Type of parameter</span><Select label="Family parameter data type" value={draft.type} options={TYPES}
              onChange={type => { setDraft({ ...draft, type }); clear() }} /></label>
            <label><span>Instance / type</span><Select label="Family parameter binding" value={draft.binding} options={['Instance', 'Type']}
              onChange={binding => { setDraft({ ...draft, binding }); clear() }} /></label>
          </> : <p className="ad-note">Choose Add Parameter to define a field for the selected families.</p>}
        </section>
        <fieldset className="ad-card suite-flow-options forge-family-targets">
          <legend>Destination families</legend>
          {visibleTargets.map(family => <Check key={family.name}
            label={`${family.name}, ${family.category}, ${family.definitions.length} definitions`} checked={destinations.includes(family.name)}
            onChange={checked => {
              setTargets({ ...targets, [mode]: checked ? [...destinations, family.name] : destinations.filter(name => name !== family.name) })
              clear()
            }} />)}
          <p className="ad-note">{visibleTargets.length ? 'Existing definitions of the same name are kept.' : 'No destination families match the current filters.'}</p>
        </fieldset>
      </div>
      {confirmedMode === mode ? <div className="ad-card suite-flow-receipt" role="status">
        <strong>Review family edits</strong>
        <p>{definitions.map(definition => definition.name).join(', ')} → {destinations.join(', ')}</p>
        <p className="ad-note">The desktop command opens, edits and reloads the affected families and requires confirmation.</p>
        <div className="ad-row"><Btn onClick={() => setConfirmedMode(undefined)}>Cancel</Btn><Btn primary onClick={apply}>Apply to sample families</Btn></div>
      </div> : <div className="ad-row">
        <span className="ad-status">{definitions.length} parameter(s) {transfer ? `from ${source} ` : ''}to {destinations.length} family(ies)</span>
        <Btn onClick={close}>Close</Btn>
        {!transfer && <Btn disabled={!newDefinition && !destinations.length} onClick={() => { setNewDefinition(false); setDraft(NEW); setTargets({ ...targets, Families: [] }); clear() }}>Clear</Btn>}
        <Btn primary disabled={!definitions.length || !destinations.length} onClick={() => { setConfirmedMode(mode); setReceipt(undefined) }}>Apply</Btn>
      </div>}
      {receipt?.mode === mode && <p className="ad-result" role="status">{receipt.created} definitions added, {receipt.skipped} existing definitions kept in the sample families.</p>}
    </div>
  )
}
