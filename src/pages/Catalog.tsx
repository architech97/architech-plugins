import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, PlayCircle, X } from 'lucide-react'
import { PRODUCTS, searchText } from '../data/catalog'
import { SUITES } from '../data/suites'
import { ProductCard } from '../components/ProductCard'


export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const suite = params.get('suite') ?? ''
  const software = params.get('software') ?? ''
  const panel = params.get('panel') ?? ''
  const year = params.get('revit') ?? ''
  const demoOnly = params.get('demo') === '1'

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v); else p.delete(k)
    if (k === 'suite') p.delete('panel')
    setParams(p, { replace: true })
  }

  const base = PRODUCTS.filter((p) => !q || q.toLowerCase().split(/\s+/).every((w) => searchText(p).includes(w)))
  const results = base.filter((p) => (!suite || p.suite === suite) && (!software || p.software.includes(software))
    && (!panel || p.panel === panel) && (!year || p.revit.includes(year)) && (!demoOnly || p.demo))

  const YEARS = useMemo(() => [...new Set(PRODUCTS.flatMap((p) => p.revit))].sort(), [])
  const softwares = useMemo(() => [...new Set(PRODUCTS.flatMap((p) => p.software))].sort(), [])
  const panels = useMemo(() => [...new Set(PRODUCTS.filter((p) => !suite || p.suite === suite).map((p) => p.panel))].sort(), [suite])
  const active = [suite, software, panel, year, demoOnly ? '1' : ''].filter(Boolean).length

  const Opt = ({ k, v, label, n }: { k: string; v: string; label: string; n?: number }) => {
    const on = (params.get(k) ?? '') === v
    return <button className={`filter-opt ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => set(k, on ? '' : v)}><span>{label}</span>{n !== undefined && <small>{n}</small>}</button>
  }

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <span className="eyebrow">Plugin catalogue</span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', margin: '14px 0 14px' }}>{PRODUCTS.length} products for BIM teams.</h1>
        <p className="lead" style={{ marginBottom: 30 }}>Search by task, tool name or BIM term, then filter by suite, software, category or Revit version. Products with a live demo can be tried in your browser.</p>

        <div className="catalog">
          <aside className="glass filters" aria-label="Filters">
            <div>
              <h4>Suite</h4>
              {SUITES.map((s) => <Opt key={s.id} k="suite" v={s.id} label={s.name} n={base.filter((p) => p.suite === s.id).length} />)}
            </div>
            <div>
              <h4>Software</h4>
              {softwares.map((s) => <Opt key={s} k="software" v={s} label={s} n={base.filter((p) => p.software.includes(s)).length} />)}
            </div>
            <div>
              <h4>Revit version</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {YEARS.map((y) => <Opt key={y} k="revit" v={y} label={y} />)}
              </div>
            </div>
            <div>
              <h4>Category</h4>
              {panels.map((p) => <Opt key={p} k="panel" v={p} label={p} n={base.filter((x) => x.panel === p && (!suite || x.suite === suite)).length} />)}
            </div>
            <div>
              <button className={`filter-opt ${demoOnly ? 'on' : ''}`} aria-pressed={demoOnly} onClick={() => set('demo', demoOnly ? '' : '1')}><span><PlayCircle size={15} style={{ verticalAlign: -3, marginRight: 8 }} />With a live demo</span></button>
            </div>
          </aside>

          <div>
            <div className="search" style={{ marginBottom: 16 }}>
              <Search size={19} aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search: renumber sheets, warnings, room finishes, shared parameters, point cloud..." aria-label="Search plugins" />
            </div>
            <div className="catalog-top">
              <span className="muted" role="status">{results.length} of {PRODUCTS.length} products</span>
              {active > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setParams(q ? { q } : {}, { replace: true })}><X size={15} /> Clear {active} filter{active > 1 ? 's' : ''}</button>}
            </div>
            {results.length === 0 ? (
              <div className="glass empty-state">
                <h3>No products match</h3>
                <p style={{ marginTop: 8 }}>Try fewer words or clear a filter. Need something that doesn't exist yet? <Link to="/custom-development">Ask for a custom tool</Link>.</p>
              </div>
            ) : (
              <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {results.map((p) => <ProductCard key={p.slug} p={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
