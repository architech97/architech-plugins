import { Link } from 'react-router-dom'
import { ArrowUpRight, Play } from 'lucide-react'
import type { Product } from '../data/types'
import { suiteById } from '../data/suites'
import { asset } from './Brand'

export function ProductCard({ p }: { p: Product }) {
  const suite = suiteById(p.suite)
  const shot = p.dialogs[0]?.dark ?? p.media?.find((item) => item.kind === 'image')?.src
  return (
    <article className="pcard">
      <Link to={'/plugins/' + p.slug} className={`thumb ${shot ? '' : 'placeholder'}`} aria-label={`View ${p.name} details`}>
        {shot
          ? <img src={asset(shot)} alt="" loading="lazy" decoding="async" />
          : <span className="product-drawing-label"><b>{p.software[0]}</b><small>{p.panel}</small></span>}
      </Link>
      <span className="suite-tag" style={{ ['--suite' as string]: suite.color }}>{suite.short} · {p.panel}</span>
      <h3><Link to={'/plugins/' + p.slug}>{p.name}</Link></h3>
      <p>{p.tagline}</p>
      <div className="meta">
        {p.revit.length > 0 && <span className="chip">Revit {p.revit.join(' / ')}</span>}
        {p.software.filter((item) => item !== 'Revit' || !p.revit.length).map((item) => <span key={item} className="chip">{item}</span>)}
      </div>
      <div className="pcard-actions">
        {p.demo && <Link to={'/demos/' + p.demo} aria-label={`Try ${p.name} demo`}><Play size={14} /> Try demo</Link>}
        <Link to={'/plugins/' + p.slug} aria-label={`${p.name} product details`}>Details <ArrowUpRight size={14} /></Link>
      </div>
    </article>
  )
}
