import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { asset } from '../components/Brand'
import { DEMO_PROJECT } from '../data/demoProject'
import { fixtureCell, fixtureChoices, fixtureRowLimit, isSelectionColumn } from './generatedFixtures'
import { DEFAULT_KEEP_AS_TYPED, folioTextSettings, folioTextTransform } from './folioTextPreview'
import { DYNAMIC_ACTIONS, getActions, LAYOUTS } from './generatedRegistry'
import { MATERIALS, simulatedResult, TEMPLATE_NAMES, type WorkflowRecord, type WorkflowResult } from './generatedWorkflow'
import { reviewField } from './sentinelFixtures'
import { FINISH_VIEWS, finishTypes, forgePreparation, forgeSettings } from './forgeFixtures'
import type { DemoContext } from './types'
import { loadToolWorkflow, type ToolWorkflow } from './toolDiscovery'
import { WorkflowPreview } from './kit/WorkflowPreview'
import type { WorkflowField, WorkflowInput } from './generatedWorkflow'
import './generated.css'

// A live replica generated from the plugin's real dialog: every control sits where the shipping
// dialog puts it (positions, text and tooltips are exported from the plugin's own layout).
// Lists show sample rows; lists the plugin fills from a model show sample options.

interface Node {
  k: string; x: number; y: number; w: number; h: number; s?: string; bg?: string | null; bd?: string | null; bw?: number[]; r?: number
  fs?: number; fw?: number; c?: string | null; al?: string; o?: number; icon?: number; on?: number; g?: string; tip?: string; off?: number
  ph?: string | null; ml?: number; i?: number; main?: number; hh?: number; cols?: { h: string; w: number }[]; fg?: string | null
}
interface Layout { w: number; h: number; tabs: string[]; states: Node[][] }
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const isSearch = (node: Node) => node.k === 'input' && /^search|^filter|type to filter/i.test([node.ph, node.tip].filter(Boolean).join(' '))
const scopeLabel = (node: Node, nodes: Node[]) => {
  let best = ''
  let score = 110
  for (const text of nodes) {
    if (text.k !== 'text' || text.icon || !text.s || text.s.length > 56) continue
    const left = node.x - (text.x + text.w)
    const top = node.y - text.y
    const next = left >= -8 && Math.abs(top) < 10 ? Math.max(left, 0) + Math.abs(top) * 4
      : top > 4 && top < 42 && Math.abs(node.x - text.x) < 55 ? top + Math.abs(node.x - text.x) + 18 : Infinity
    if (next < score) { score = next; best = text.s }
  }
  return best.trim().replace(/:$/, '')
}
// The plugins' Dark palette -> theme tokens, so the replica follows Dark and Light.
const TOKENS: Record<string, string> = {
  '#3B3E45': 'bg', '#484C54': 'surface', '#51565F': 'card', '#575C66': 'row-hover', '#5F646E': 'button', '#686D77': 'button-hover',
  '#2E3137': 'input', '#666B75': 'border', '#80858F': 'border-strong', '#8F949E': 'control-border', '#A3A8B2': 'button-border',
  '#7B9BE6': 'accent', '#6A8BDB': 'accent-hover', '#4B556D': 'accent-soft', '#A7BCEE': 'accent-text', '#F5F5F7': 'text', '#E3E6EB': 'text-2',
  '#CDD1D8': 'muted', '#9EA2AA': 'disabled', '#121315': 'on-accent', '#A2D9B6': 'success', '#BACEEB': 'info', '#E5C996': 'warning', '#FFBCB8': 'error',
}
const col = (c?: string | null) => (c ? (TOKENS[c.toUpperCase()] ? `var(--d-${TOKENS[c.toUpperCase()]})` : c) : undefined)
const gridLabel = (slug: string, n: Node, row: number, cell: (header: string, row: number) => string) => {
  if (slug === 'reorder-pro') return fixtureCell(slug, 'Name', row)
  if (slug === 'manage-text') return cell('Note', row)
  return n.cols?.map((c, i) => isSelectionColumn(c.h, c.w, i) ? '' : cell(c.h, row)).filter((value) => value && value !== '—').slice(0, 2).join(', ') || `Sample row ${row + 1}`
}
const EMPTY_NODES: Node[] = []
const SAMPLE_DEFAULTS: Record<string, Record<string, string>> = {
  'reorder-pro': { 'WRITE TO': 'Comments', Prefix: '', Suffix: '', 'Start at': '1', Step: '1', 'Digits (zero padding)': '0', Separator: '' },
  'point-cloud-slicer': { 'Bottom Offset (mm)': '-150', 'Top Offset (mm)': '300', 'XY Planar Buffer (mm)': '500' },
  'family-param-transfer': { 'Shared parameter file': 'AT-01-Shared-Parameters.txt', 'Source RFA file': 'Door – Single Flush.rfa' },
}

export async function loadGenerated(slug: string) {
  return { default: makeGenerated(slug, await loadToolWorkflow(slug)) }
}

export function makeGenerated(slug: string, workflow?: ToolWorkflow) {
  const rowCount = (n: Node) => Math.max(0, Math.min(slug === 'manage-text' ? 3 : fixtureRowLimit(slug), Math.floor((n.h - (n.hh ?? 30)) / 30)))
  return function GeneratedDemo({ theme, setTheme, done, rewind, notify, close }: DemoContext) {
    const metas = LAYOUTS[slug] ?? []
    const [win, setWin] = useState(0)
    const [request, setRequest] = useState<{ file: string; attempt: number; layout?: Layout }>()
    const [attempt, setAttempt] = useState(0)
    const [tab, setTab] = useState(0)
    const [vals, setVals] = useState<Record<string, string | boolean>>((): Record<string, string | boolean> => slug === 'detail-view' ? { 'detailviewwindow:sample:0': true } : {})
    const [touched, setTouched] = useState(false)
    const [plan, setPlan] = useState<{ revision: number; input: WorkflowInput; output: WorkflowResult }>()
    const [k, setK] = useState(1)
    const [fullSize, setFullSize] = useState(false)
    const [layoutView, setLayoutView] = useState(() => window.matchMedia('(min-width: 1000px)').matches)
    const [result, setResult] = useState<WorkflowResult>()
    const [validation, setValidation] = useState('')
    const [reviewed, setReviewed] = useState(false)
    const [preparedSignature, setPreparedSignature] = useState('')
    const [visitedFields, setVisitedFields] = useState<Record<string, WorkflowField[]>>({})
    const wrap = useRef<HTMLDivElement>(null)
    const planRevision = useRef(0)
    const meta = metas[win]
    const response = request?.file === meta.file && request.attempt === attempt ? request : undefined

    useEffect(() => {
      const abort = new AbortController()
      fetch(asset(meta.file), { signal: abort.signal })
        .then((r) => {
          if (!r.ok) throw new Error(`Dialog data returned ${r.status}`)
          return r.json() as Promise<Layout>
        })
        .then((layout) => {
          if (!Array.isArray(layout.states) || !layout.states.length) throw new Error('Invalid dialog layout')
          if (!abort.signal.aborted) setRequest({ file: meta.file, attempt, layout })
        })
        .catch(() => {
          if (!abort.signal.aborted) setRequest({ file: meta.file, attempt })
        })
      return () => abort.abort()
    }, [meta.file, attempt])
    useEffect(() => {
      const el = wrap.current; if (!el) return
      const fit = () => setK(Math.min(1, el.clientWidth / meta.w))
      fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect()
    }, [meta.w, layoutView])

    const nodes = response?.layout?.states[tab] ?? EMPTY_NODES
    const tabKey = `${meta.win}:${tab}`
    const controlKey = (index: number) => `${tabKey}:${index}`
    const settingsKey = (name: string) => `${tabKey}:setting:${name}`
    const setting = (name: string, initial: string) => String(vals[settingsKey(name)] ?? initial)
    const setSetting = (name: string, value: string | boolean) => set(settingsKey(name), value)
    const advanced = nodes.find((node, index) => node.k === 'exp' && (vals[controlKey(index)] ?? !!node.on))?.s
    const rowKey = (grid: Node, index: number, row: number) => `${meta.win}:grid:${grid.cols?.map((column) => column.h).join('|') || index}:${row}`
    const gridSearch = nodes.findIndex((node) => isSearch(node) && !/^search (categories|families|types)(?:\.|…|$)/i.test(node.ph ?? ''))
    const query = gridSearch === -1 ? '' : String(vals[controlKey(gridSearch)] ?? '').trim().toLowerCase()
    const tickedOnly = vals[`${tabKey}:tickedOnly`] === true
    const modeIndex = slug === 'structural-qa' ? nodes.findIndex((node) => node.k === 'combo') : -1
    const mode = modeIndex < 0 ? undefined : String(vals[controlKey(modeIndex)] ?? nodes[modeIndex].s)
    const shownRows = (grid: Node, index: number) => Array.from({ length: rowCount(grid) }, (_, row) => row).filter((row) => {
      if (tickedOnly && !rowSelected(rowSelectionKey(rowKey(grid, index, row)))) return false
      return !query || grid.cols?.some((column) => cell(column.h, row).toLowerCase().includes(query))
    })
    const navLabel = nodes.find((n) => n.k === 'text' && (n.s === 'TOOLS' || n.s === 'STEPS'))
    const labels = getActions(slug, meta)
    const dynamicLabel = win === 0 ? DYNAMIC_ACTIONS[slug]?.[tab] : undefined
    const radioKey = (n: Node) => `${tabKey}:radio:${n.g}`
    const radioChecked = (n: Node, key: string) => vals[radioKey(n)] === undefined ? !!n.on || (slug === 'family-param-transfer' && n.s === 'Shared parameter file') || (slug === 'reorder-pro' && (n.s === 'Active View' || n.s === 'Element id')) : vals[radioKey(n)] === key
    const isChecked = (n: Node, key: string) => {
      if (n.k === 'radio') return radioChecked(n, key)
      const activeDefault = slug === 'reorder-pro' && n.s === 'Increment each element'
        || slug === 'point-cloud-slicer' && n.s === 'Generate 3D Section Box Slices'
        || slug === 'parameter-mapping' && n.s === 'Filter by family and type'
      return Boolean(vals[key] ?? (activeDefault || n.on))
    }
    const fieldLabel = (n: Node, i: number) => {
      if (slug === 'section-box' && n.k === 'input') return 'Padding'
      if (slug === 'deviation-inspector' && n.k === 'combo') return 'Point cloud'
      if (slug === 'fr-to-finishes' && n.k === 'combo') return 'Finish type'
      if (slug === 'fr-to-finishes' && n.k === 'check' && !n.s) return 'Delete successfully converted source regions'
      if (slug === 'family-param-transfer' && n.k === 'combo') return 'Loaded source family'
      if (slug === 'family-param-transfer' && n.k === 'input' && !n.ph) return n.y < 250 ? 'Shared parameter file' : 'Source RFA file'
      if (slug === 'parameter-mapping' && n.k === 'input' && n.y > 700) return 'Manual text value'
      if (slug === 'structural-qa' && n.k === 'combo') return 'Inspection mode'
      if (meta.win === 'reviewcenterwindow' && n.k === 'combo') return reviewField(nodes.slice(0, i).filter((node) => node.k === 'combo').length)?.label ?? 'Review option'
      return n.k === 'check' || n.k === 'radio'
        ? n.s || n.tip || `Option ${i + 1}`
        : n.ph || scopeLabel(n, nodes) || n.tip || n.s || `Setting ${i + 1}`
    }
    const choicesFor = (n: Node, i: number) => slug === 'fr-to-finishes' ? finishTypes(setting('Active view', FINISH_VIEWS[0]))
      : fixtureChoices(slug, fieldLabel(n, i), n.s ?? '', n.tip ?? '', nodes.slice(0, i).filter((node) => node.k === 'combo').length, meta.win)
    const inputValue = (n: Node, i: number) => {
      const initial = n.s?.replace(/Sample item 5\nSample item 6\nSample item 7/g, 'Door Schedule: 3 edits ready\nWindow Schedule: 1 row not found\nRoom Finish Schedule: read-only column skipped') ?? ''
      const label = fieldLabel(n, i)
      if (slug === 'fr-to-finishes' && n.k === 'combo') {
        const choices = choicesFor(n, i)
        const selected = String(vals[controlKey(i)] ?? '')
        return choices.includes(selected) ? selected : choices[0]
      }
      if (transfer && n.k === 'combo' && label === 'Copy to') return String(vals[controlKey(i)] ?? choicesFor(n, i)[1])
      const fallback = SAMPLE_DEFAULTS[slug]?.[label]
      return String(vals[controlKey(i)] ?? (n.k === 'combo' ? fallback || n.s || choicesFor(n, i)[0] : initial || fallback || ''))
    }
    const actionLabel = (n: Node) => {
      if (n.k !== 'btn') return undefined
      if (n.s) return labels.find((label) => n.s === label || (slug === 'text-tag-align' && n.s?.startsWith(`${label} `))) ?? (n.s === dynamicLabel ? n.s : undefined)
      if (dynamicLabel && n.w >= 100 && !nodes.some((other) => other.k === 'btn' && other.s === dynamicLabel)) return dynamicLabel
    }
    const firstOf = {
      option: nodes.findIndex((n, i) => n.k === 'check' || n.k === 'combo' || (n.k === 'input' && !n.ml && !isSearch(n)) || (n.k === 'radio' && !radioChecked(n, controlKey(i)))),
      tab: nodes.findIndex((n) => n.k === 'tab' && n.main && n.i !== tab),
      grid: nodes.findIndex((n) => n.k === 'grid' && rowCount(n) > 0),
      run: nodes.findIndex((n) => !!actionLabel(n)),
    }
    const touch = (step = 'configure') => { setTouched(true); done(step) }
    const clearResult = () => {
      if (validation) setValidation('')
      if (plan) { setPlan(undefined); rewind('run') }
      if (result) { setResult(undefined); setReviewed(false); rewind('run') }
    }
    const set = (key: string, value: string | boolean, step = 'configure') => {
      clearResult()
      if (preparationKeys.has(key)) setPreparedSignature('')
      setVals((previous) => ({ ...previous, [key]: value })); touch(step)
    }
    const changeTheme = (value: 'dark' | 'light') => { setTheme(value) }
    const changeTab = (index: number) => {
      if (index === tab) return
      setVisitedFields((current) => ({ ...current, [tabKey]: fieldsForRun().map((field) => ({ ...field, tab })) }))
      clearResult(); setTab(index)
    }
    const tickRows = (selected: boolean) => {
      const updates: Record<string, boolean> = {}
      nodes.forEach((node, index) => {
        if (node.k !== 'grid') return
        const rows = selected ? shownRows(node, index) : Array.from({ length: rowCount(node) }, (_, row) => row)
        rows.forEach((row) => { updates[rowSelectionKey(rowKey(node, index, row))] = selected })
      })
      clearResult()
      setVals((previous) => ({ ...previous, ...updates }))
      touch(selected && Object.keys(updates).length ? 'row' : 'explore')
    }
    const openWindow = (index: number) => {
      if (index === win) return
      setVisitedFields((current) => ({ ...current, [tabKey]: fieldsForRun().map((field) => ({ ...field, tab })) }))
      clearResult(); setWin(index); setTab(0)
      if (slug === 'template-manager' && index === 1) done('window')
    }

    const transfer = meta.win === 'templatetransferwindow' && tab === 0
    const selectedRadio = (group: string) => nodes.find((node, index) => node.k === 'radio' && node.g === group && isChecked(node, controlKey(index)))?.s ?? ''
    const textOperation = slug === 'manage-text' && tab === 0 ? selectedRadio('Op') : ''
    const forgeExtras = [...forgeSettings(slug), ...(workflow?.settings?.(meta.win, tab) ?? [])]
    const extras = slug === 'replace-materials' ? [
      { label: 'Material to replace', choices: MATERIALS, initial: MATERIALS[0] },
      { label: 'Replacement material', choices: MATERIALS, initial: MATERIALS[2] },
    ] : slug === 'deviation-inspector' ? [
      { label: 'Maximum points / element', initial: '100' },
      { label: 'Spacing (mm)', initial: '30.48' },
      { label: 'Evaluate', choices: ['95th percentile', 'Mean', 'Maximum'], initial: '95th percentile' },
    ] : textOperation ? folioTextSettings(textOperation, selectedRadio('Case')) : forgeExtras
    const sourceFields = nodes.flatMap((node, index) => {
      if (!['combo', 'input', 'check', 'radio'].includes(node.k) || isSearch(node) || node.ml || /^Tick \/ untick/i.test(node.tip ?? '')) return []
      const label = fieldLabel(node, index)
      if (transfer && /no source model selected/i.test(label)) return []
      if (textOperation && textOperation !== 'Change case' && node.g === 'Case') return []
      return [{ node, index, label }]
    })
    const reorderField = /^(write to|prefix|suffix|start at|step|digits|separator|increment each element)/i
    if (slug === 'reorder-pro') sourceFields.sort((a, b) => Number(reorderField.test(b.label)) - Number(reorderField.test(a.label)))
    const fieldsForRun = () => [
      ...sourceFields.flatMap(({ node, index, label: name }) => node.k === 'radio'
        ? isChecked(node, controlKey(index)) ? [{ label: node.g || 'Selected option', value: name }] : []
        : [{ label: name, value: node.k === 'check' ? (isChecked(node, controlKey(index)) ? 'On' : 'Off') : inputValue(node, index) }]),
      ...extras.map(({ label: name, initial }) => ({ label: name, value: setting(name, initial) })),
    ]
    const textTransform = textOperation ? folioTextTransform(fieldsForRun()) : undefined
    const cell = (header: string, row: number) => textOperation && header === 'After'
      ? typeof textTransform === 'function' ? textTransform(fixtureCell(slug, 'Before', row), fixtureCell(slug, 'Note', row)) : '—'
      : fixtureCell(slug, header, row, mode)
    const preparation = forgePreparation(slug)
    const preparationFields = preparation ? fieldsForRun().filter(({ label }) => preparation.fields.includes(label)) : []
    const preparationKeys = new Set([
      ...sourceFields.filter(({ node, label }) => preparation?.fields.includes(node.k === 'radio' ? node.g ?? '' : label))
        .map(({ node, index }) => node.k === 'radio' ? radioKey(node) : controlKey(index)),
      ...extras.filter(({ label }) => preparation?.fields.includes(label)).map(({ label }) => settingsKey(label)),
    ])
    const signature = JSON.stringify(preparationFields)
    const prepared = !preparation || preparedSignature === signature
    const sourceMode = preparationFields.find(({ label }) => label === 'SrcMode')?.value
    const sourceField = sourceMode === 'Loaded family' ? 'Loaded source family' : sourceMode === 'Browse .rfa' ? 'Source RFA file' : 'Shared parameter file'
    const canPrepare = slug === 'family-param-transfer' ? !!preparationFields.find(({ label }) => label === sourceField)?.value.trim()
      : slug === 'parameter-mapping' ? !!preparationFields.find(({ label }) => label === 'Category')?.value.trim() : true
    const prepare = () => {
      if (!preparation || !canPrepare) return
      if (slug === 'family-param-transfer') selectRecords(false)
      clearResult(); setPreparedSignature(signature); touch()
      notify({ kind: 'info', text: preparation.ready })
    }
    const prepareButton = (node: Node) => !!preparation && node.s === preparation.label && (slug !== 'parameter-mapping' || /collect the elements/i.test(node.tip ?? ''))
    const mappingText = preparationFields.filter(({ label }) => ['Room property', 'On', 'Element parameter'].includes(label)).map(({ value }) => value).join(' → ')
    const scopeGrid = slug === 'update-schedule' ? nodes.findLastIndex((node) => node.k === 'grid') : firstOf.grid
    const scopedNode = nodes[scopeGrid]
    const supplementalRecords = transfer ? TEMPLATE_NAMES : slug === 'detail-view' ? ['Level 01', 'Level 02', 'Roof'] : slug === 'spell-check' ? ['A-101 · Level 01 Floor Plan', 'A-102 · Level 02 Floor Plan', 'A-501 · Typical Details'] : []
    const recordTotal = supplementalRecords.length || (scopedNode ? rowCount(scopedNode) : 0)
    const sampleKey = (index: number) => `${meta.win}:sample:${index}`
    const records = (supplementalRecords.length ? supplementalRecords.flatMap((label, index) => !query || label.toLowerCase().includes(query) ? [{ key: sampleKey(index), label, columns: { Record: label } }] : [])
      : scopedNode ? shownRows(scopedNode, scopeGrid).map((row) => ({
        key: rowKey(scopedNode, scopeGrid, row),
        label: gridLabel(slug, scopedNode, row, cell),
        columns: Object.fromEntries(scopedNode.cols?.filter((column, index) => !isSelectionColumn(column.h, column.w, index)).map((column) => [column.h, cell(column.h, row)]) ?? []),
      })) : []) as (WorkflowRecord & { key: string })[]
    function rowSelected(key: string) { return vals[key] === true || (vals[key] === undefined && (slug === 'point-cloud-slicer' || slug === 'in-place-converter')) }
    const checkedRecords = records.filter((record) => rowSelected(rowSelectionKey(record.key)))
    function rowSelectionKey(key: string) { return slug === 'family-param-transfer' ? key + ':' + signature : key }
    const requiresTicks = slug === 'family-param-transfer' || slug === 'detail-view'
    const blockRun = !prepared || (requiresTicks && checkedRecords.length === 0)
    const showRecords = slug !== 'family-param-transfer' || prepared
    const matchedActions = new Set(nodes.map(actionLabel).filter((label): label is string => Boolean(label)))
    const availableActions = [...new Set([
      ...labels.filter((label) => matchedActions.has(label)),
      ...matchedActions,
      ...(workflow?.actions?.(meta.win, tab) ?? []),
    ])]
    const selectRecords = (selected: boolean) => {
      clearResult()
      const keys = selected ? records.map((record) => record.key)
        : Array.from({ length: recordTotal }, (_, row) => supplementalRecords.length ? sampleKey(row) : rowKey(scopedNode, scopeGrid, row))
      setVals((previous) => ({ ...previous, ...Object.fromEntries(keys.map((key) => [rowSelectionKey(key), selected])) }))
      touch(selected ? 'row' : 'configure')
    }
    const error = (message: string) => { setValidation(message); notify({ kind: 'warning', text: message }) }
    const getOutput = (input: WorkflowInput) => workflow?.default(input) ?? simulatedResult(input)
    const run = (label: string) => {
      clearResult()
      if (!prepared) { error(`Choose ${preparation?.caption} before running this command.`); return }
      if (recordTotal > 0 && !records.length) {
        error('No sample records are visible. Clear the filter and try again.')
        return
      }
      if (recordTotal > 0 && !checkedRecords.length && (/\bselected\b|^delete reviewed/i.test(label) || slug === 'point-cloud-slicer' || requiresTicks)) {
        error('Select at least one sample record for this command.')
        return
      }
      const scope = checkedRecords.length && !(slug === 'off-axis-resolver' && label === 'Fix all fixable') ? checkedRecords : records
      const priorFields = Object.entries(visitedFields).filter(([key]) => key !== tabKey).flatMap(([, fields]) => fields)
      const input = { slug, action: label, fields: fieldsForRun(), priorFields, records: scope, windowName: meta.win, tab }
      const output = getOutput(input)
      if (typeof output === 'string') { error(output); return }
      done('configure')
      if (scope.length) done('row')
      setPlan({ revision: ++planRevision.current, input: { ...input, records: output.records ?? input.records }, output })
      done('run')
    }

    const apply = (output: WorkflowResult) => {
      if (!plan) return
      setValidation('')
      setPlan(undefined)
      setResult(output)
      notify({ kind: 'success', text: `${plan.input.action} · sample receipt ready.` })
      done('apply')
    }

    const render = (n: Node, i: number) => {
      const key = controlKey(i)
      const pos: CSSProperties = { position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h }
      switch (n.k) {
        case 'box': {
          const bw = n.bw ?? [0, 0, 0, 0]
          return <div key={key} style={{ ...pos, pointerEvents: 'none', background: col(n.bg), borderStyle: 'solid', borderColor: col(n.bd) ?? 'transparent', borderWidth: `${bw[0]}px ${bw[1]}px ${bw[2]}px ${bw[3]}px`, borderRadius: n.r }} />
        }
        case 'text': {
          if (n.icon) return null
          const single = n.h < (n.fs ?? 12) * 2
          const content = slug === 'assign-room-properties' && prepared && n.s?.startsWith('Build a mapping') ? mappingText : n.s
          return <div key={key} style={{ ...pos, pointerEvents: 'none', width: single ? undefined : n.w + 2, height: single ? undefined : n.h + 2, minWidth: single && n.al ? n.w : undefined, fontSize: n.fs, fontWeight: n.fw, lineHeight: single ? `${n.h}px` : 1.36, color: col(n.c), whiteSpace: single ? 'nowrap' : 'normal', overflow: 'hidden', textAlign: n.al === 'c' ? 'center' : n.al === 'r' ? 'right' : 'left', opacity: n.o }}>{content}</div>
        }
        case 'logo': return <img key={key} alt="ArchiTECH" style={{ ...pos, pointerEvents: 'none', objectFit: 'contain', objectPosition: 'left center' }} src={asset(theme === 'dark' ? 'media/brand/architech-logo-dark-ui.webp' : 'media/brand/architech-logo-light-ui.webp')} />
        case 'mark': return <img key={key} alt="" style={{ ...pos, pointerEvents: 'none', borderRadius: 10 }} src={asset('favicon.svg')} />
        case 'theme': return <select key={key} className="ad-select" aria-label="Dialog theme" data-demo="gen-theme" style={pos} value={theme} onChange={(e) => changeTheme(e.target.value as 'dark' | 'light')}><option value="dark">Dark</option><option value="light">Light</option></select>
        case 'close': return <button key={key} className="ad-close" aria-label="Close (simulation)" style={pos} onClick={close}>✕</button>
        case 'tab': {
          if (!n.main) return <span key={key} className={`ad-tab ${n.on ? 'on' : ''}`} style={{ ...pos, pointerEvents: 'none', display: 'grid', placeItems: 'center', padding: 0 }}>{n.s}</span>
          const style: CSSProperties = navLabel ? { position: 'absolute', left: navLabel.x - 8, top: navLabel.y + 28 + (n.i ?? 0) * 34, width: 156, height: 30, textAlign: 'left', padding: '0 10px', borderRadius: 6, border: 0, borderBottom: 0, background: n.i === tab ? 'var(--d-accent-soft)' : 'transparent', boxShadow: n.i === tab ? 'inset 3px 0 0 var(--d-accent)' : undefined, color: n.i === tab ? 'var(--d-text)' : 'var(--d-text-2)', fontWeight: n.i === tab ? 600 : 500 } : { ...pos, padding: 0 }
          return <button key={key} aria-pressed={n.i === tab} className={navLabel ? '' : `ad-tab ${n.i === tab ? 'on' : ''}`} data-demo={i === firstOf.tab ? 'gen-tab' : undefined} style={{ ...style, cursor: 'pointer', font: 'inherit', fontSize: 12.5 }} onClick={() => { if (n.i !== undefined) changeTab(n.i) }}>{n.s || response?.layout?.tabs[n.i ?? 0] || 'Overview'}</button>
        }
        case 'check': case 'radio': {
          const checked = isChecked(n, key)
          const name = n.s || (slug === 'fr-to-finishes' ? fieldLabel(n, i) : undefined)
          return (
            <label key={key} className={n.k === 'check' ? 'ad-check' : 'ad-radio'} title={n.tip} style={{ ...pos, minHeight: 0, whiteSpace: 'nowrap' }} data-demo={i === firstOf.option ? 'gen-configure' : undefined}>
              <input type={n.k === 'check' ? 'checkbox' : 'radio'} name={n.k === 'radio' ? radioKey(n) : undefined} checked={checked} aria-label={name || n.tip || 'Option'} onChange={(e) => (n.k === 'radio' ? set(radioKey(n), key) : set(key, e.target.checked))} />
              <span className={n.k === 'check' ? 'ad-box' : 'ad-dot'} />{name && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>}
            </label>
          )
        }
        case 'combo': {
          return (
            <select key={key} className="ad-select" title={n.tip} aria-label={fieldLabel(n, i)} style={pos} value={inputValue(n, i)} data-demo={i === firstOf.option ? 'gen-configure' : undefined} onChange={(e) => set(key, e.target.value)}>
              {choicesFor(n, i).map((choice) => <option key={choice}>{choice}</option>)}
            </select>
          )
        }
        case 'input': {
          if (slug === 'update-schedule' && n.ml && !advanced) return null
          const caption = fieldLabel(n, i)
          const value = inputValue(n, i)
          return n.ml
            ? <textarea key={key} className="ad-input" title={n.tip} aria-label={caption} placeholder={n.ph ?? ''} style={{ ...pos, padding: 8, resize: 'none' }} value={value} onChange={(e) => set(key, e.target.value, 'explore')} />
            : <input key={key} className="ad-input" title={n.tip} aria-label={caption} placeholder={n.ph ?? ''} style={pos} value={value} data-demo={i === firstOf.option ? 'gen-configure' : undefined} onChange={(e) => set(key, e.target.value, isSearch(n) ? 'explore' : 'configure')} onKeyDown={(e) => { if (e.key === 'Escape' && isSearch(n)) { e.preventDefault(); set(key, '', 'explore') } }} />
        }
        case 'prog': return <div key={key} className="ad-progress" style={{ ...pos, pointerEvents: 'none' }}><i style={{ width: result ? '100%' : '0%' }} /></div>
        case 'exp': {
          const expanded = Boolean(vals[key] ?? n.on)
          return <button key={key} aria-expanded={expanded} style={{ ...pos, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 0, color: 'var(--d-text)', font: 'inherit', fontSize: 12.5, cursor: 'pointer', padding: 0, textAlign: 'left' }} onClick={() => set(key, !expanded, 'explore')}><span className="ad-disc" style={{ width: 18, height: 18, borderRadius: 9, border: '1px solid var(--d-control-border)', background: 'var(--d-input)', display: 'grid', placeItems: 'center', fontSize: 9 }}>{expanded ? '▴' : '▾'}</span>{n.s}</button>
        }
        case 'btn': {
          const action = actionLabel(n)
          const label = n.s || action || n.tip
          if (!label) return <span key={key} className="ad-btn sm" style={{ ...pos, pointerEvents: 'none', padding: 0 }} />
          const isPreparation = prepareButton(n)
          const resetsPreparation = (slug === 'assign-room-properties' && /^(clear|remove)$/i.test(label)) || (slug === 'parameter-mapping' && label === 'Clear' && n.y > 600)
          const tickFilter = firstOf.grid >= 0 && /^ticked only$/i.test(label)
          const onClick = () => {
            if (isPreparation) { prepare(); return }
            if (resetsPreparation) { clearResult(); setPreparedSignature(''); return }
            if (action) { run(action); return }
            if (label === 'Close' || label === 'Cancel') { close(); return }
            if (tickFilter) { set(`${tabKey}:tickedOnly`, !tickedOnly, 'explore'); return }
            if (firstOf.grid >= 0 && /^(tick shown|select all(?: visible)?|tick all mirrored)$/i.test(label)) { if (showRecords) tickRows(true); return }
            if (firstOf.grid >= 0 && (/^(clear ticks|deselect all)$/i.test(label) || slug === 'family-param-transfer' && label === 'Clear')) { tickRows(false); return }
            const destination = metas.findIndex((item, index) => index !== win && normalize(item.title) === normalize(label))
            if (destination >= 0) { openWindow(destination); return }
            touch()
            notify({ kind: 'info', text: n.tip ?? `${label} uses the active Revit document in the desktop plugin.` })
          }
          const disabled = isPreparation ? !canPrepare : resetsPreparation ? !prepared : action ? blockRun : !!n.off && !touched
          return <button key={key} className={`ad-btn ${action || n.bg?.toUpperCase() === '#7B9BE6' ? 'primary' : ''}`} title={n.tip} disabled={disabled} aria-pressed={tickFilter ? tickedOnly : undefined} data-demo={i === firstOf.run ? 'gen-run' : undefined} style={{ ...pos, padding: '0 6px', minHeight: 0, overflow: 'hidden', fontSize: Math.min(12.5, Math.max(10.5, n.h * 0.42)) }} onClick={onClick}>{label}</button>
        }
        case 'grid': {
          const cols = n.cols ?? []; const hh = n.hh ?? 30; const rows = showRecords ? shownRows(n, i) : []
          const total = cols.reduce((a, c) => a + c.w, 0)
          return (
            <div key={key} style={{ ...pos, overflow: 'auto', background: 'var(--d-input)', border: '1px solid var(--d-border)', borderRadius: 4 }} data-demo={i === firstOf.grid ? 'gen-grid' : undefined}>
              <div style={{ width: Math.max(total, n.w) }}>
                <div style={{ display: 'flex', height: hh, background: 'var(--d-surface)', borderBottom: '1px solid var(--d-border)', color: 'var(--d-text-2)', fontWeight: 600, fontSize: 12 }}>
                  {cols.map((c, ci) => <div key={ci} style={{ width: c.w, flex: 'none', padding: '0 8px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.h === '[]' ? <span className="ad-box" /> : c.h}</div>)}
                </div>
                {rows.map((r) => {
                  const rk = rowSelectionKey(rowKey(n, i, r)); const on = rowSelected(rk)
                  const toggle = () => set(rk, !on, 'row')
                  return (
                    <div key={r} role="button" tabIndex={0} aria-pressed={on} aria-label={gridLabel(slug, n, r, cell)} onClick={toggle} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle() } }} style={{ display: 'flex', height: 30, cursor: 'pointer', background: on ? 'var(--d-accent-soft)' : 'var(--d-card)', borderBottom: '1px solid color-mix(in srgb, var(--d-sep) 55%, transparent)', color: 'var(--d-text)', fontSize: 12 }}>
                      {cols.map((c, ci) => {
                        const value = cell(c.h, r)
                        return <div key={ci} title={value} style={{ width: c.w, flex: 'none', padding: '0 8px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>{isSelectionColumn(c.h, c.w, ci) ? <span className="ad-box" style={on ? { background: 'var(--d-accent)', borderColor: 'var(--d-accent)' } : undefined} /> : value.startsWith('#') ? <><i aria-hidden="true" style={{ display: 'inline-block', background: value, width: 13, height: 13, marginRight: 6, borderRadius: 3 }} />{value}</> : value}</div>
                      })}
                    </div>
                  )
                })}
                {!rows.length && <p style={{ padding: '5px 8px', fontSize: 12, color: 'var(--d-muted)' }}>{!showRecords ? 'Load parameters to show sample definitions' : query || tickedOnly ? 'No matching records' : 'No sample records'}</p>}
              </div>
            </div>
          )
        }
        default: return null
      }
    }

    const renderField = ({ node, index, label }: typeof sourceFields[number]) => {
      const key = controlKey(index)
      if (node.k === 'check' || node.k === 'radio') {
        return (
          <label key={key} className="gen-field gen-check">
            <input type={node.k === 'check' ? 'checkbox' : 'radio'} name={node.k === 'radio' ? radioKey(node) : undefined} checked={isChecked(node, key)}
              onChange={(event) => node.k === 'radio' ? set(radioKey(node), key) : set(key, event.target.checked)} />
            <span>{label}</span>
          </label>
        )
      }
      return (
        <label key={key} className="gen-field">
          <span>{label}</span>
          {node.k === 'combo'
            ? <select aria-label={label} value={inputValue(node, index)} onChange={(event) => set(key, event.target.value)}>{choicesFor(node, index).map((option) => <option key={option}>{option}</option>)}</select>
            : <input value={inputValue(node, index)} onChange={(event) => set(key, event.target.value)} />}
        </label>
      )
    }

    const renderExtra = ({ label, initial, choices }: typeof extras[number]) => (
      <label key={label} className="gen-field"><span>{label}</span>
        {choices ? <select aria-label={label} value={setting(label, initial)} onChange={(event) => setSetting(label, event.target.value)}>{choices.map((option) => <option key={option}>{option}</option>)}</select>
          : <input value={setting(label, initial)} inputMode={slug === 'manage-text' ? 'text' : 'decimal'} onChange={(event) => setSetting(label, event.target.value)} />}
      </label>
    )
    const preparationStatus = preparation && (prepared ? preparation.ready : `Choose ${preparation.caption} before applying changes.`)
    const resultPanel = result && (
      <section className="gen-result" aria-labelledby="generated-result-heading">
        <span className="gen-kicker">Sample output · {DEMO_PROJECT.code}</span>
        <h3 id="generated-result-heading">Sample receipt</h3>
        <p role="status">{result.summary}</p>
        {result.rows.length > 0 && <dl>{result.rows.map(({ label, value }, index) => <div key={`${index}:${label}`}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        <button className="gen-action" type="button" data-demo="gen-review" disabled={reviewed} onClick={() => { setReviewed(true); done('review') }}>{reviewed ? 'Result reviewed' : 'Mark result reviewed'}</button>
      </section>
    )

    const scale = fullSize ? 1 : k
    return (
      <div className="gen-shell">
        <div className="gen-mode" role="group" aria-label="Simulation view">
          <button type="button" aria-pressed={layoutView} onClick={() => setLayoutView(true)}>Dialog layout</button>
          <button type="button" aria-pressed={!layoutView} onClick={() => setLayoutView(false)}>Browser workflow</button>
        </div>
        {metas.length > 1 && (
          <div className="gen-windows" role="group" aria-label="Dialogs of this tool">
            {metas.map((m, i) => <button key={m.file} aria-pressed={i === win} data-demo={slug === 'template-manager' && i === 1 ? 'gen-window' : undefined} className={i === win ? 'on' : ''} onClick={() => openWindow(i)}>{m.title}</button>)}
          </div>
        )}
        {response?.layout && meta.tabs.length > 1 && (!layoutView || firstOf.tab === -1) && (
          <div className="gen-windows" role="group" aria-label="Sections of this dialog">
            {meta.tabs.map((label, index) => <button key={label || index} aria-pressed={index === tab} data-demo={index === (tab === 0 ? 1 : 0) ? 'gen-tab' : undefined} className={index === tab ? 'on' : ''} onClick={() => changeTab(index)}>{label || 'Overview'}</button>)}
          </div>
        )}
        {!layoutView && (
          <section className="gen-workflow" aria-label={`${meta.title} browser workflow`}>
            <header className="gen-workflow-title"><span className="gen-kicker">Interactive simulation · {DEMO_PROJECT.code}</span><h3>{meta.title}</h3><p>{DEMO_PROJECT.name} · Fictional project data</p></header>
            {!response?.layout && (
              <div className="gen-scope" role="status">
                {response ? <>This workflow could not load. <button className="gen-action" type="button" onClick={() => setAttempt((previous) => previous + 1)}>Retry</button></> : 'Loading the sample workflow…'}
              </div>
            )}
            {response?.layout && (sourceFields.length > 0 || extras.length > 0 || meta.options > 0) && (
              <section className="gen-settings" data-demo="gen-configure" aria-label="Sample settings">
                <h4>Settings</h4>
                <div className="gen-fields">
                  {extras.map(renderExtra)}
                  {sourceFields.slice(0, 8).map(renderField)}
                </div>
                {textOperation === 'Apply an Excel file' && <p className="gen-empty">The sample workbook contains one edit to the entry wall note.</p>}
                {!sourceFields.length && !extras.length && <p className="gen-empty">This section uses the sample settings. Open another section to see its controls.</p>}
                {sourceFields.length > 8 && <details><summary>More settings</summary><div className="gen-fields">{sourceFields.slice(8).map(renderField)}</div></details>}
                <button type="button" className="gen-action" disabled={!!preparation && !canPrepare} onClick={preparation ? prepare : () => touch()}>{preparation?.caption ?? 'Use these settings'}</button>
                {preparationStatus && <p className="gen-empty" role="status">{preparationStatus}</p>}
              </section>
            )}
            {response?.layout && recordTotal > 0 && showRecords && (
              <section className="gen-scope" data-demo="gen-grid" aria-label="Sample records">
                <div className="gen-scope-header"><h4>Sample records</h4><span>{checkedRecords.length ? `${checkedRecords.length} selected` : `${records.length} shown`}</span></div>
                {gridSearch !== -1 && <label className="gen-field"><span>{fieldLabel(nodes[gridSearch], gridSearch)}</span><input value={inputValue(nodes[gridSearch], gridSearch)} onChange={(event) => set(controlKey(gridSearch), event.target.value, 'explore')} /></label>}
                {records.length > 0 ? <>
                  <div className="gen-records">
                    {records.map((record) => (
                      <label key={record.key} className="gen-record">
                        <input type="checkbox" checked={rowSelected(rowSelectionKey(record.key))} onChange={(event) => set(rowSelectionKey(record.key), event.target.checked, 'row')} />
                        <span><strong>{record.label}</strong>{Object.entries(record.columns).filter(([, value]) => value && value !== '—').slice(2, 4).length > 0 && <small>{Object.entries(record.columns).filter(([, value]) => value && value !== '—').slice(2, 4).map(([name, value]) => `${name}: ${value}`).join(' · ')}</small>}</span>
                      </label>
                    ))}
                  </div>
                  <div className="gen-actions"><button type="button" className="gen-action" onClick={() => selectRecords(true)}>Select shown</button>{checkedRecords.length > 0 && <button type="button" className="gen-action" onClick={() => selectRecords(false)}>Clear selection</button>}</div>
                </> : <p>No sample records match the filter.</p>}
              </section>
            )}
            {response?.layout && availableActions.length > 0 && (
              <section className="gen-command" aria-label="Simulated commands">
                <div className="gen-actions">
                  {availableActions.map((label, index) => <button type="button" key={label} className={`gen-action${index === 0 ? ' is-primary' : ''}`} disabled={blockRun} data-demo={index === 0 ? 'gen-run' : undefined} onClick={() => run(label)}>{label}</button>)}
                </div>
              </section>
            )}
            {response?.layout && !availableActions.length && metas.length > 1 && <p className="gen-empty">Choose a dialog above to open its sample workflow.</p>}
          </section>
        )}
        {layoutView && response?.layout && !nodes.some((n) => n.k === 'theme') && (
          <div className="gen-windows"><button data-demo="gen-theme" onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}>Use {theme === 'dark' ? 'light' : 'dark'} theme</button></div>
        )}
        {layoutView && k < 0.9 && <div className="gen-windows"><button aria-pressed={fullSize} onClick={() => setFullSize((current) => !current)}>{fullSize ? 'Fit dialog to screen' : 'View dialog at full size'}</button></div>}
        {layoutView && <>
        {response?.layout && forgeExtras.length > 0 && <section className="gen-settings" aria-label="Sample model inputs"><h4>Sample model inputs</h4><div className="gen-fields">{forgeExtras.map(renderExtra)}</div></section>}
        <div ref={wrap} style={{ width: '100%', maxHeight: fullSize ? '75dvh' : undefined, overflow: 'auto' }}>
          <div style={{ width: meta.w * scale, height: meta.h * scale, position: 'relative', overflow: 'hidden' }}>
            <div className="ad gen" data-theme={theme} role="dialog" aria-label={`${meta.title} (simulation)`} style={{ display: 'block', position: 'absolute', left: 0, top: 0, width: meta.w, height: meta.h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              {response?.layout ? nodes.map(render) : (
                <div style={{ padding: 40, color: 'var(--d-muted)' }} role="status">
                  {response ? <>This dialog could not load. <button className="ad-btn" onClick={() => setAttempt((previous) => previous + 1)}>Retry</button></> : 'Loading the dialog…'}
                </div>
              )}
            </div>
          </div>
        </div>
        {response?.layout && preparationStatus && <p className="gen-empty" role="status">{preparationStatus}</p>}
        {advanced && slug !== 'update-schedule' && (
          <section aria-label={advanced} className="ad" data-theme={theme} style={{ marginTop: 12, padding: 14, gap: 10 }}>
            <b>{advanced}</b>
            {slug === 'deviation-inspector' && <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {([['Maximum points / element', '100'], ['Spacing (mm)', '30.48']] as const).map(([name, initial]) => <label key={name} style={{ display: 'grid', gap: 4 }}>{name}<input className="ad-input" inputMode="decimal" style={{ width: 125 }} value={setting(name, initial)} onChange={(event) => setSetting(name, event.target.value)} /></label>)}
              <label style={{ display: 'grid', gap: 4 }}>Evaluate<select aria-label="Evaluate" className="ad-select" value={setting('Evaluate', '95th percentile')} onChange={(event) => setSetting('Evaluate', event.target.value)}>{['95th percentile', 'Mean', 'Maximum'].map((metric) => <option key={metric}>{metric}</option>)}</select></label>
            </div>}
            {slug === 'manage-text' && <label style={{ display: 'grid', gap: 4 }}>Keep as typed<input className="ad-input" value={setting('Keep as typed', DEFAULT_KEEP_AS_TYPED)} placeholder="GWB, FF&E" onChange={(event) => setSetting('Keep as typed', event.target.value)} /></label>}
            {slug === 'model-query-pro' && (advanced.startsWith('Inspect') ? <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap' }}>
              <label style={{ display: 'grid', gap: 4 }}>Element ID<input className="ad-input" inputMode="numeric" value={setting('Element ID', '348211')} onChange={(event) => setSetting('Element ID', event.target.value)} /></label>
              <button className="ad-btn" onClick={() => {
                const id = setting('Element ID', '348211').trim()
                const row = [0, 1, 2, 3, 4, 5].find((index) => fixtureCell(slug, 'Element ID', index) === id)
                notify(row === undefined ? { kind: 'warning', text: `Element ${id || 'ID'} was not found in the sample project.` } : { kind: 'info', text: `Element ${id} · ${fixtureCell(slug, 'Family', row)} · ${fixtureCell(slug, 'Level', row)}.` })
              }}>Inspect ID</button>
            </div> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Room enclosure', 'Duplicate walls', 'FF&E metadata'].map((name) => <label key={name} className="ad-check"><input type="checkbox" checked={Boolean(vals[settingsKey(name)] ?? true)} onChange={(event) => setSetting(name, event.target.checked)} /><span className="ad-box" />{name}</label>)}
            </div>)}
          </section>
        )}
        </>}
        {layoutView && response?.layout && availableActions.some((label) => !matchedActions.has(label)) && <div className="gen-windows" aria-label="Dialog actions">
          {availableActions.filter((label) => !matchedActions.has(label)).map((label) => <button type="button" key={label} disabled={blockRun} onClick={() => run(label)}>{label}</button>)}
        </div>}
        {validation && <p className="gen-validation" role="alert">{validation}</p>}
        {plan && <WorkflowPreview key={plan.revision} plan={plan} evaluate={getOutput} onApply={apply} onCancel={clearResult} />}
        {resultPanel}
      </div>
    )
  }
}
