import { Link, useParams } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { PRODUCTS, productBySlug } from '../data/catalog'
import { suiteById } from '../data/suites'
import { DialogGallery } from '../components/DialogGallery'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Layout'
import { asset } from '../components/Brand'
import NotFound from './NotFound'
import './product-evidence.css'
import './product.css'

const CHAIR_PREVIEW = 'media/i3d/chair-mesh.png'
const DRAGON_PLACEMENT = 'media/i3d/revit-placement-0.6.36.webp'

/** A sentence that opens with a short tab or mode name ("Renumber / rename: ...") shows that name as a label. */
function Point({ text }: { text: string }) {
  const label = /^([A-Z][A-Za-z/&]*(?: [A-Za-z/&]+){0,4}):\s+(.+)$/.exec(text)
  if (!label) return <>{text}</>
  const rest = label[2].charAt(0).toUpperCase() + label[2].slice(1)
  return <><strong>{label[1]}</strong>{rest}</>
}

export default function Product() {
  const { slug = '' } = useParams()
  const p = productBySlug(slug)
  if (!p) return <NotFound />
  const suite = suiteById(p.suite)
  const dialogCount = new Set(p.dialogs.map((d) => d.id)).size
  const screenshots = p.dialogs.filter((d) => d.real).length
  const hasRecordedPlacement = p.media?.some(({ src }) => src === DRAGON_PLACEMENT)
  const hasChairPreview = p.slug === 'architech-i3d'
  const related = PRODUCTS.filter((x) => x.slug !== p.slug && x.suite === p.suite && x.panel === p.panel).concat(PRODUCTS.filter((x) => x.slug !== p.slug && x.suite === p.suite && x.panel !== p.panel)).slice(0, 3)
  const ribbon = ['folio', 'forge', 'sentinel'].includes(p.suite) ? `${suite.name} › ${p.panel}` : p.panel
  const revit = p.revit.length ? (p.revit.length > 1 ? p.revit.join(', ') : p.revit[0]) : '—'
  const isRevitTool = ['folio', 'forge', 'sentinel'].includes(p.suite)

  // The shipped description is the source of every line below. Nothing is shown twice:
  // a sentence that only repeats the summary under the title is dropped.
  const same = (x: string, y: string) => x.replace(/\s+/g, ' ').trim().toLowerCase() === y.replace(/\s+/g, ' ').trim().toLowerCase()
  const points = p.capabilities.filter((c) => !same(c, p.tagline))
  const does = points.length ? points : same(p.description, p.tagline) ? [] : [p.description]
  const checks = p.safeguards.filter((c) => !does.some((d) => same(c, d)))
  const hasStory = Boolean(p.problem) || does.length > 0 || checks.length > 0 || Boolean(p.requirements)
  const sources = [
    screenshots > 0 && `${screenshots} ${screenshots === 1 ? 'picture is a screenshot' : 'pictures are screenshots'} of the installed build.`,
    p.dialogs.length > screenshots && `${p.dialogs.length - screenshots} ${p.dialogs.length - screenshots === 1 ? 'picture is' : 'pictures are'} rendered from the product’s own window code with sample data.`,
    hasRecordedPlacement && 'The Revit placement image records a separate host run of the Dragon fixture.',
  ].filter(Boolean) as string[]

  return (
    <>
      <section className="tp-hero">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/plugins">All tools</Link><span>/</span><Link to={`/plugins?suite=${p.suite}`}>{suite.name}</Link><span>/</span><span>{p.name}</span>
          </nav>
          <div className="tp-head">
            <div>
              <p className="tp-suite" style={{ ['--suite' as string]: suite.color }}>{suite.name}<span>{p.panel}</span></p>
              <h1>{p.name}</h1>
              <p className="lead">{p.tagline}</p>
              <div className="hero-cta">
                {p.dialogs.length > 0
                  ? <a className="btn btn-primary" href="#dialog-reference">See the {dialogCount === 1 ? 'dialog' : dialogCount + ' dialogs'}</a>
                  : p.media?.length ? <a className="btn btn-primary" href="#dialog-reference">View desktop visuals</a> : null}
                <Link className="btn btn-ghost" to={`/connect?type=walkthrough&product=${p.slug}`}><MessageSquare size={17} /> Ask me about this tool</Link>
              </div>
              {(hasChairPreview || hasRecordedPlacement) && (
                <div className="product-scenario-links">
                  {hasChairPreview && <a href="#desktop-chair-preview">See the desktop chair preview</a>}
                  {hasRecordedPlacement && <a href="#recorded-placement">See the separate Revit 2024 capture</a>}
                </div>
              )}
            </div>
            <dl className="tp-facts" aria-label="Compatibility">
              <div><dt>{isRevitTool ? 'On the ribbon' : 'Type'}</dt><dd>{ribbon}</dd></div>
              <div><dt>Software</dt><dd>{p.software.join(', ')}{(isRevitTool || p.software.join() === 'Revit') && p.revit?.length ? ' ' + revit : ''}</dd></div>
              {p.platform && <div><dt>Platform</dt><dd>{p.platform}</dd></div>}
              {p.dialogs.length > 0 && <div><dt>Shown here</dt><dd>{dialogCount} {dialogCount === 1 ? 'dialog' : 'dialogs'}{p.dialogs.length > dialogCount ? `, ${p.dialogs.length} pictures` : ''}</dd></div>}
            </dl>
          </div>
        </div>
      </section>

      {(p.dialogs.length > 0 || p.media?.length) && (
        <section className="tp-dialogs" id="dialog-reference">
          <div className="wrap">
            <h2 className="sr-only">{p.dialogs.length ? `${p.name} dialogs` : 'Desktop captures and illustrations'}</h2>
            {p.dialogs.length > 0 && <DialogGallery key={p.slug} product={p} eager />}
            {sources.length > 0 && <p className="tp-source">{sources.join(' ')}</p>}
            {p.media && (
              <div className={hasChairPreview ? 'grid-2 product-media-pair' : 'grid-3'} style={{ marginTop: 20 }}>
                {hasChairPreview && (
                  <figure id="desktop-chair-preview" className="product-media">
                    <img src={asset(CHAIR_PREVIEW)} alt="Upholstered chair in the textured I3D Desktop Material workspace" loading="lazy" />
                    <figcaption>
                      <strong>Captured in I3D Desktop</strong>
                      <span>Chair geometry and texture at the desktop preview stage, before export.</span>
                    </figcaption>
                  </figure>
                )}
                {p.media.map((media) => {
                  const placement = media.src === DRAGON_PLACEMENT
                  const label = placement ? 'Recorded in Revit 2024' : media.kind === 'animation' ? 'Workflow illustration' : 'Desktop capture'
                  return (
                    <figure key={media.src} id={placement ? 'recorded-placement' : undefined} className="product-media">
                      <img src={asset(media.src)} alt={media.alt} loading="lazy" />
                      <figcaption>
                        <strong>{label}</strong>
                        <span>{placement ? 'Dragon placement from a separate desktop validation run.' : media.alt}</span>
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {p.showcase && (
        <section className="tp-show" aria-labelledby="tp-show-title">
          <div className="wrap">
            <header className="tp-show-head">
              <p className="tp-label">How it works</p>
              <h2 id="tp-show-title">{p.showcase.title}</h2>
              <p>{p.showcase.lead}</p>
            </header>
            <ol className="tp-show-steps" style={{ ['--steps' as string]: p.showcase.steps.length }}>
              {p.showcase.steps.map((step, i) => (
                <li key={step.src}>
                  <a className="tp-show-shot" href={asset(step.src)} target="_blank" rel="noreferrer" aria-label={step.title + ", full-size picture"}><img src={asset(step.src)} alt={step.title} loading="lazy" decoding="async" /></a>
                  <p className="tp-show-n">{String(i + 1).padStart(2, '0')}</p>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {hasStory && (
        <section className="tp-story">
          <div className={'wrap tp-story-grid' + (p.problem && (does.length > 0 || checks.length > 0 || p.requirements) ? '' : ' no-problem')}>
            {p.problem && (
              <Reveal className="tp-problem">
                <h2>The problem</h2>
                <p>{p.problem}</p>
              </Reveal>
            )}
            {(does.length > 0 || checks.length > 0 || p.requirements) && <Reveal delay={80} className="tp-does">
              {does.length > 0 && <>
                <h2>What it does</h2>
                <ol className="tp-points">{does.map((c) => <li key={c}><Point text={c} /></li>)}</ol>
              </>}
              {checks.length > 0 && <>
                <h2>Checks before it changes anything</h2>
                <ul className="tp-points checks">{checks.map((c) => <li key={c}><Point text={c} /></li>)}</ul>
              </>}
              {p.requirements && <>
                <h2>Requirements</h2>
                <ul className="tp-points checks">{p.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
              </>}
            </Reveal>}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="tp-related">
          <div className="wrap">
            <div className="section-head"><div><h2>More in {suite.name}</h2></div><Link className="btn btn-ghost" to={`/plugins?suite=${p.suite}`}>All {suite.short} products</Link></div>
            <div className="grid-3">{related.map((r) => <ProductCard key={r.slug} p={r} />)}</div>
          </div>
        </section>
      )}
    </>
  )
}
