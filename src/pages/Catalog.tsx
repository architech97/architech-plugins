import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, ListFilter, Search, X } from 'lucide-react'
import { PRODUCTS, searchText } from '../data/catalog'
import { SUITES, suiteById } from '../data/suites'
import { ProductCard } from '../components/ProductCard'
import './pages-v2.css'

const TASKS = [
  { id: 'drawings', label: 'Prepare drawings', note: 'Views, details and annotation', panels: ['Views', 'View Templates', 'Detailing', 'Annotation'] },
  { id: 'deliverables', label: 'Issue deliverables', note: 'Sheets, schedules and export', panels: ['Sheets', 'Schedules', 'Publish'] },
  { id: 'modeling', label: 'Build and finish the model', note: 'Rooms, finishes and point clouds', panels: ['Rooms', 'Finishes', 'Scan to BIM'] },
  { id: 'data', label: 'Manage model data', note: 'Parameters, worksets and standards', panels: ['Parameters', 'Standards'] },
  { id: 'coordination', label: 'Check and coordinate', note: 'Warnings, linked models and cleanup', panels: ['Model Health', 'Clean Up', 'Coordination', 'Links'] },
  { id: 'automation', label: 'Automate across apps', note: 'Photo to 3D, connectors and Assistant', panels: ['Desktop app', 'MCP connectors', 'Assistant'] },
]

const SOFTWARE = [...new Set(PRODUCTS.flatMap((product) => product.software))].sort()
const YEARS = [...new Set(PRODUCTS.flatMap((product) => product.revit))].sort()
const FILTER_KEYS = ['suite', 'software', 'panel', 'revit'] as const
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const INDEX = PRODUCTS.map((product) => {
  const task = TASKS.find((item) => item.panels.includes(product.panel))
  return {
    product,
    task: task?.id,
    name: normalize(product.name),
    text: normalize([
      searchText(product), product.slug, product.key, suiteById(product.suite).name,
      product.problem, ...product.capabilities, task?.label, task?.note,
    ].join(' ')),
  }
})

const TASK_COUNTS = new Map(TASKS.map((task) => [task.id, INDEX.filter((entry) => entry.task === task.id).length]))

function searchRank(name: string, term: string, words: string[]) {
  if (!term) return 0
  if (name === term) return 100
  if (name.startsWith(term)) return 80
  if (name.includes(term)) return 60
  return words.filter((word) => name.includes(word)).length
}

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(() => FILTER_KEYS.some((key) => params.has(key)))
  const query = params.get('q') ?? ''
  const task = params.get('task') ?? ''
  const suite = params.get('suite') ?? ''
  const software = params.get('software') ?? ''
  const panel = params.get('panel') ?? ''
  const year = params.get('revit') ?? ''
  const selectedTask = TASKS.find((item) => item.id === task)

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'suite') next.delete('panel')
    setParams(next, { replace: true })
  }

  function clear(keys: readonly string[]) {
    const next = new URLSearchParams(params)
    keys.forEach((key) => next.delete(key))
    setParams(next, { replace: true })
  }

  const term = normalize(query)
  const words = term ? term.split(' ') : []
  const results = INDEX
    .filter((item) => words.every((word) => item.text.includes(word))
      && (!task || item.task === task)
      && (!suite || item.product.suite === suite)
      && (!software || item.product.software.includes(software))
      && (!panel || item.product.panel === panel)
      && (!year || item.product.revit.includes(year)))
    .sort((a, b) => searchRank(b.name, term, words) - searchRank(a.name, term, words))
  const panels = [...new Set(PRODUCTS.filter((product) => !suite || product.suite === suite).map((product) => product.panel))].sort()
  const active = [suite, software, panel, year].filter(Boolean).length

  return (
    <section className="section catalog-section" aria-labelledby="catalog-title">
      <div className="wrap">
        <header className="catalog-heading">
          <h1 id="catalog-title">{PRODUCTS.length} tools, <em>sorted by the job</em></h1>
          <p className="lead">Pick what you need to get done. Every tool has a page with its windows and a walkthrough you can try on sample data.</p>
        </header>

        <div className="catalog-tasks" role="group" aria-label="Browse by task">
          <div className="catalog-task-heading">
            <h2>What do you need to do?</h2>
            <button type="button" aria-pressed={!task} onClick={() => update('task', '')}>Show all {PRODUCTS.length}</button>
          </div>
          <div className="catalog-task-options">
            {TASKS.map((item, index) => (
              <button key={item.id} type="button" aria-pressed={item.id === task} onClick={() => update('task', item.id === task ? '' : item.id)}>
                <span className="catalog-task-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span><strong>{item.label}</strong><small>{item.note}</small></span>
                <span className="catalog-task-count">{TASK_COUNTS.get(item.id)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="catalog-toolbar">
          <div className="search">
            <Search size={19} aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => update('q', event.target.value)} placeholder="Search plugins" aria-label="Search plugins" />
            {query && <button type="button" onClick={() => update('q', '')} aria-label="Clear search"><X size={18} aria-hidden="true" /></button>}
          </div>
          <button className="btn btn-ghost catalog-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen(!filtersOpen)}><ListFilter size={17} aria-hidden="true" /> Filters{active ? ' (' + active + ')' : ''}</button>
        </div>

        <div className="catalog">
          <aside className={'catalog-filters' + (filtersOpen ? ' is-open' : '')} id="catalog-filters" aria-label="Filter plugins">
            <div className="catalog-filter-heading"><strong>Refine results</strong>{active > 0 && <button type="button" onClick={() => clear(FILTER_KEYS)}>Clear filters</button>}</div>
            <label>Suite<select value={suite} onChange={(event) => update('suite', event.target.value)}>
              <option value="">All suites</option>{SUITES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select></label>
            <label>Host application<select value={software} onChange={(event) => update('software', event.target.value)}>
              <option value="">All hosts</option>{SOFTWARE.map((item) => <option key={item}>{item}</option>)}
            </select></label>
            <label>Revit version<select value={year} onChange={(event) => update('revit', event.target.value)}>
              <option value="">Any version</option>{YEARS.map((item) => <option key={item}>{item}</option>)}
            </select></label>
            <label>Ribbon category<select value={panel} onChange={(event) => update('panel', event.target.value)}>
              <option value="">All categories</option>{panels.map((item) => <option key={item}>{item}</option>)}
            </select></label>
          </aside>

          <section className="catalog-results" aria-labelledby="catalog-result-title">
            <div className="catalog-top">
              <div>
                <h2 id="catalog-result-title">{selectedTask?.label ?? 'Plugin library'}</h2>
                <p className="muted" role="status">{results.length} of {PRODUCTS.length} tools</p>
              </div>
              <Link to="/demos#sample-project">Try the sample project <ArrowUpRight size={15} aria-hidden="true" /></Link>
            </div>
            {results.length === 0 ? (
              <div className="glass empty-state">
                <h3>No tools match</h3>
                <p>Try another term or remove a filter.</p>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => clear(['q', 'task', ...FILTER_KEYS])}>Reset search and filters</button>
              </div>
            ) : (
              <div className="catalog-cards">
                {results.map(({ product }) => <ProductCard key={product.slug} p={product} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
