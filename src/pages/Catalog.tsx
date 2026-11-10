import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ListFilter, Search, X } from 'lucide-react'
import { PRODUCTS, searchText } from '../data/catalog'
import { SUITES } from '../data/suites'
import { ProductCard } from '../components/ProductCard'

const SOFTWARE = [...new Set(PRODUCTS.flatMap((p) => p.software))].sort()
const YEARS = [...new Set(PRODUCTS.flatMap((p) => p.revit))].sort()

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = params.get('q') ?? ''
  const suite = params.get('suite') ?? ''
  const software = params.get('software') ?? ''
  const panel = params.get('panel') ?? ''
  const year = params.get('revit') ?? ''

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'suite') next.delete('panel')
    setParams(next, { replace: true })
  }
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const results = PRODUCTS.filter((p) => words.every((word) => searchText(p).includes(word))
    && (!suite || p.suite === suite) && (!software || p.software.includes(software))
    && (!panel || p.panel === panel) && (!year || p.revit.includes(year)))
  const panels = [...new Set(PRODUCTS.filter((p) => !suite || p.suite === suite).map((p) => p.panel))].sort()
  const active = [suite, software, panel, year].filter(Boolean).length
  const clearFilters = () => setParams(query ? { q: query } : {}, { replace: true })

  return (
    <section className="section catalog-section">
      <div className="wrap">
        <div className="section-head catalog-heading">
          <div><span className="eyebrow">Plugin catalogue</span><h1>{PRODUCTS.length} tools for design and BIM</h1></div>
          <p className="lead">Find a tool by task or host application. Open its product details or go straight to the browser demo.</p>
        </div>
        <div className="catalog-toolbar">
          <div className="search">
            <Search size={19} aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => update('q', e.target.value)} placeholder="Search by tool or task" aria-label="Search plugins" />
            {query && <button type="button" onClick={() => update('q', '')} aria-label="Clear search"><X size={18} /></button>}
          </div>
          <button className="btn btn-ghost catalog-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen(!filtersOpen)}><ListFilter size={17} /> Filters{active ? ` (${active})` : ''}</button>
        </div>
        <div className="catalog">
          <aside className={`catalog-filters ${filtersOpen ? 'is-open' : ''}`} id="catalog-filters" aria-label="Filter plugins">
            <div className="catalog-filter-heading"><strong>Filter results</strong>{active > 0 && <button type="button" onClick={clearFilters}>Clear</button>}</div>
            <label>Suite<select value={suite} onChange={(e) => update('suite', e.target.value)}>
              <option value="">All suites</option>{SUITES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></label>
            <label>Software<select value={software} onChange={(e) => update('software', e.target.value)}>
              <option value="">All hosts</option>{SOFTWARE.map((item) => <option key={item}>{item}</option>)}
            </select></label>
            <label>Revit version<select value={year} onChange={(e) => update('revit', e.target.value)}>
              <option value="">Any version</option>{YEARS.map((item) => <option key={item}>{item}</option>)}
            </select></label>
            <label>Category<select value={panel} onChange={(e) => update('panel', e.target.value)}>
              <option value="">All categories</option>{panels.map((item) => <option key={item}>{item}</option>)}
            </select></label>
          </aside>
          <div className="catalog-results">
            <div className="catalog-top">
              <span className="muted" role="status">{results.length} of {PRODUCTS.length} products</span>
              <Link to="/demos#sample-project">Try the sample project <span aria-hidden="true">↗</span></Link>
            </div>
            {results.length === 0 ? (
              <div className="glass empty-state">
                <h3>No products match</h3>
                <p style={{ margin: '8px 0 16px' }}>Try another term or remove a filter.</p>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setParams({}, { replace: true })}>Reset search and filters</button>
              </div>
            ) : (
              <div className="catalog-cards">
                {results.map((product) => <ProductCard key={product.slug} p={product} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
