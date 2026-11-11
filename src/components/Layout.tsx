import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Mark } from './Brand'
import { AUTOMATION_PATH, CONTACT, SITE_ORIGIN } from '../data/contact'
import { useImageFade, useScrollProgress, useSiteMotion } from './motion'

const unified = import.meta.env.BASE_URL === AUTOMATION_PATH
const homeUrl = unified ? '/' : SITE_ORIGIN + '/'
const designUrl = unified ? '/design/' : CONTACT.designSite

const SUBNAV = [
  { to: '/plugins', label: 'Plugins' },
  { to: '/demos', label: 'Demos' },
  { to: '/coverage', label: 'Coverage' },
  { to: '/connect', label: 'Connect' },
]

export function Layout() {
  const { pathname, hash } = useLocation()
  const subnav = useScrollProgress<HTMLElement>()
  useImageFade()
  useSiteMotion()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const heading = document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim()
    document.title = heading ? heading + ' · ArchiTECH Automation' : 'ArchiTECH Automation'
  }, [pathname])
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [pathname, hash])
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="ax-header">
        <div className="ax-bar">
          <a className="ax-brand" href={homeUrl} aria-label="ArchiTECH home"><Mark /><span>Archi<strong>TECH</strong></span></a>
          <nav className="ax-nav" aria-label="Site">
            <a href={designUrl} data-division="design">Design</a>
            <Link to="/" aria-current="true">Automation</Link>
            <a href={homeUrl + '#about'}>About</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>
      <nav className="ax-subnav" ref={subnav} aria-label="Automation">
        <div className="ax-subnav-inner">
          {SUBNAV.map((n) => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          <Link className="ax-subnav-cta" to="/demos#sample-project">Try a walkthrough <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </nav>
      <main id="main" tabIndex={-1}><div key={pathname} className="route-in"><Outlet /></div></main>
      <Footer />
    </>
  )
}

/** The same night-bar footer as the homepage (architech-design/portal.html). */
function Footer() {
  return (
    <footer className="ax-footer feather" id="contact">
      <div className="ax-foot-grid">
        <div className="ax-foot-lead">
          <p className="ax-foot-line">Have a project or a workflow to talk through?</p>
          {/* TODO(Navneet): confirm the reply-time wording. */}
          <p className="ax-foot-reply">I reply within one working day.</p>
        </div>
        <div className="ax-foot-col">
          <h2 className="ax-foot-h">Contact</h2>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          {CONTACT.phones.map((phone) => <a key={phone} href={'tel:' + phone.replace(/\s/g, '')}>{phone}</a>)}
          {CONTACT.whatsapp && <a href={'https://wa.me/' + CONTACT.whatsapp} rel="noreferrer">WhatsApp ↗</a>}
          <a href={CONTACT.linkedin} rel="noreferrer">LinkedIn ↗</a>
        </div>
        <div className="ax-foot-col">
          <h2 className="ax-foot-h">Work</h2>
          <a href={designUrl}>Design portfolio →</a>
          <Link to="/">Automation →</Link>
          <Link to="/demos">Browser demos →</Link>
          <Link to="/connect">Discuss a workflow →</Link>
        </div>
        <div className="ax-foot-col">
          <h2 className="ax-foot-h">Products</h2>
          <Link to="/plugins?suite=folio">Arch Folio</Link>
          <Link to="/plugins?suite=forge">Arch Forge</Link>
          <Link to="/plugins?suite=sentinel">Arch Sentinel</Link>
          <Link to="/plugins/architech-i3d">ArchiTECH I3D</Link>
          <Link to="/plugins/architech-assistant">ArchiTECH Assistant</Link>
          <Link to="/plugins?suite=ai">ArchiTECH MCP Connector</Link>
        </div>
      </div>
      <div className="ax-foot-base">
        <span className="ax-foot-mark"><Mark size={26} />Archi<strong>TECH</strong></span>
        <p>Portfolio of Navneet Singh, New Delhi. Demos are browser simulations on sample data; nothing connects to Revit. Autodesk, Revit and AutoCAD are trademarks of Autodesk, Inc.; Rhino, SketchUp and Blender are trademarks of their owners.</p>
      </div>
    </footer>
  )
}

/** Kept for existing call sites. Blocks no longer fade up on their own; motion is scroll-scrubbed in CSS. */
export function Reveal({ children, as: Tag = 'div', className = '' }: { children: ReactNode; delay?: number; as?: 'div' | 'section' | 'li'; className?: string }) {
  return <Tag className={className || undefined}>{children}</Tag>
}
