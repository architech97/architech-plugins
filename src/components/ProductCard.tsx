import { Link } from 'react-router-dom'
import { PlayCircle } from 'lucide-react'
import type { Product } from '../data/types'
import { suiteById } from '../data/suites'
import { asset } from './Brand'

export function ProductCard({ p }: { p: Product }) {
  const suite = suiteById(p.suite)
  const shot = p.dialogs[0]?.dark ?? p.media?.find((m) => m.kind === 'image')?.src
  return (
    <Link to={`/plugins/${p.slug}`} className="pcard" aria-label={`${p.name}: ${p.tagline}`}>
      <div className={`thumb ${shot ? '' : 'placeholder'}`}>
        {shot ? <img src={asset(shot)} alt="" loading="lazy" decoding="async" /> : <span>{p.software.join(' · ')}<br />{p.panel}</span>}
      </div>
      {p.demo && <span className="chip demo-flag" style={{ background: 'rgba(5,7,13,.85)', borderColor: 'rgba(34,211,238,.5)', color: '#fff' }}><PlayCircle size={13} /> Live demo</span>}
      <span className="suite-tag" style={{ ['--suite' as string]: suite.color }}>{suite.short} · {p.panel}</span>
      <h3>{p.name}</h3>
      <p>{p.tagline}</p>
      <div className="meta">
        {p.software.map((s) => <span key={s} className="chip">{s}</span>)}
        {p.revit.length > 0 && <span className="chip">Revit {p.revit.length > 1 ? `${p.revit[0]}–${p.revit[p.revit.length - 1]}` : p.revit[0]}</span>}
      </div>
    </Link>
  )
}
