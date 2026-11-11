import { useState } from 'react'
import type { DemoContext } from '../../types'
import { Btn, Check } from '../../ui'
import { Receipt } from '../../kit'
import { FolioChoice, FolioFrame, FolioPreview, FolioText } from '../folioFrame'
import { sampleResidence } from '../../fixtures/sampleResidence'
import evaluate from './result'

const sections = [
  { title: 'Overviews', summary: 'Which overviews to draw, and the text type for their labels.' },
  { title: 'Lines', summary: 'Sizes for the line overviews, and the scales for line weights.' },
  { title: 'Regions', summary: 'Sizes for the region type and drafting pattern swatches.' },
  { title: 'Materials', summary: 'Sizes for the material table.' },
]
const kinds = ['Line styles', 'Line patterns', 'Line weights', 'Region types', 'Drafting patterns', 'Materials']
const initial = { 'Line width': '150', 'Line spacing': '50', 'Line-weight view scales': '10,25,50,100,200,500,1000',
  'Region width': '150', 'Region height': '75', 'Region spacing': '30', 'Box width': '200', 'Box height': '75', 'Box spacing': '30', 'Column width': '600' }
type Key = keyof typeof initial

export default function GraphicOverviews(ctx: DemoContext) {
  const [section, setSection] = useState(0)
  const [selected, setSelected] = useState(kinds)
  const [textType, setTextType] = useState(sampleResidence.textTypes[0])
  const [settings, setSettings] = useState(initial)
  const [place, setPlace] = useState(true)
  const [created, setCreated] = useState<{ name: string; detail: string; sheet: string }[]>([])
  const [receipt, setReceipt] = useState<string[]>([])
  const output = evaluate({ slug: 'graphic-overviews', action: 'Create', records: [], fields: [
    ...kinds.map((label) => ({ label, value: selected.includes(label) ? 'On' : 'Off' })),
    ...Object.entries(settings).map(([label, value]) => ({ label, value })),
    { label: 'Text type', value: textType }, { label: 'Place the views on a new sheet', value: place ? 'On' : 'Off' },
  ] })
  const error = typeof output === 'string' ? output : ''
  function create() {
    if (typeof output === 'string') return
    const rows = output.rows.filter(({ label }) => label !== 'New sheet')
    const used = new Set(created.map(({ name }) => name))
    const add = rows.map(({ label, value }) => {
      const base = 'Graphic Standards - ' + label
      let name = base, n = 2
      while (used.has(name)) name = base + ' (' + n++ + ')'
      used.add(name)
      return { name, detail: value, sheet: place ? 'A-' + (801 + new Set(created.map(({ sheet }) => sheet).filter(Boolean)).size) : '' }
    })
    setCreated([...created, ...add])
    setReceipt(add.map(({ name, sheet }) => name + (sheet ? ', Placed on ' + sheet : ', Unplaced')))
    ctx.done('configure'); ctx.done('run'); ctx.done('apply'); ctx.done('review')
    ctx.notify({ kind: 'success', text: 'Created ' + add.length + ' sample drafting views.' })
  }
  const fields: Key[] = section === 1 ? ['Line width', 'Line spacing', 'Line-weight view scales'] :
    section === 2 ? ['Region width', 'Region height', 'Region spacing'] : ['Box width', 'Box height', 'Box spacing', 'Column width']
  return <FolioFrame ctx={ctx} title="Graphic Overviews" sections={sections} section={section} onSection={setSection}
    footer={<><span className="ad-status">{error || (typeof output !== 'string' ? output.summary : '')}</span><Btn onClick={ctx.close}>Cancel</Btn>
      <Btn primary demo="overviews-create" disabled={!!error} onClick={create}>Create</Btn></>}>
    {section === 0 ? <section className="ad-card folio-runtime-stack"><b className="ad-label">Overviews to create</b>
      {kinds.map((name) => <Check key={name} label={name} checked={selected.includes(name)} onChange={(checked) => setSelected(checked ? [...selected, name] : selected.filter((item) => item !== name))} />)}
      <FolioChoice label="Text type" options={sampleResidence.textTypes} value={textType} onChange={setTextType} />
    </section> : <section className="ad-card folio-runtime-stack"><b className="ad-label">{section === 1 ? 'Line settings (cm)' : section === 2 ? 'Region settings (cm)' : 'Material table (cm)'}</b>
      <div className="folio-runtime-fields">{fields.map((label) => <FolioText key={label} label={label} value={settings[label]} onChange={(value) => setSettings({ ...settings, [label]: value })} />)}</div>
      {section === 1 && <p className="ad-note">One view per scale, each showing Revit's 16 line weights.</p>}
    </section>}
    <Check label="Place the views on a new sheet" checked={place} onChange={setPlace} />
    <FolioPreview rows={typeof output === 'string' ? [] : output.rows} />
    {created.length > 0 && <FolioPreview title="Created sample drafting views" rows={created.map(({ name, detail, sheet }) => ({ label: name, value: detail + (sheet ? ', ' + sheet : ', Unplaced') }))} />}
    {receipt.length > 0 && <Receipt entries={receipt} title="Last sample run" />}
  </FolioFrame>
}
