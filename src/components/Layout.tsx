import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Mark } from './Brand'
import { AUTOMATION_PATH, CONTACT, SITE_ORIGIN } from '../data/contact'
import { pageMeta } from '../data/pageMeta'
import { useContinuityBackground, useImageFade, useScrollProgress, useSiteMotion } from './motion'

const unified = import.meta.env.BASE_URL === AUTOMATION_PATH
const homeUrl = unified ? '/' : SITE_ORIGIN + '/'
const designUrl = unified ? '/design/' : CONTACT.designSite

const SUBNAV = [
  { to: '/plugins', label: 'All tools' },
  { to: '/demos', label: 'Dialog gallery' },
]

export function Layout() {
  const { pathname, hash } = useLocation()
  const subnav = useScrollProgress<HTMLElement>()
  useImageFade()
  useSiteMotion()
  useContinuityBackground(pathname)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const meta = pageMeta(pathname)
    document.title = meta.title
    const set = (selector: string, content: string) => document.head.querySelector(selector)?.setAttribute('content', content)
    set('meta[name="description"]', meta.description)
    set('meta[property="og:title"]', meta.title)
    set('meta[property="og:description"]', meta.description)
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
            <a href={homeUrl}>Home</a>
            <a href={designUrl} data-division="design">Design</a>
            <Link to="/" aria-current="page">Automation</Link>
            <a href={homeUrl + '#about'}>About</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>
      <nav className="ax-subnav" ref={subnav} aria-label="Automation">
        <div className="ax-subnav-inner">
          {/* Where you are, always visible while scrolling: ArchiTECH (home) › Automation (this section). */}
          <p className="ax-crumb"><a href={homeUrl}><Mark size={18} />ArchiTECH</a><span aria-hidden="true">›</span><Link to="/">Automation</Link></p>
          {SUBNAV.map((n) => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          <Link className="ax-subnav-cta" to="/connect">Work with me</Link>
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
          <p className="ax-foot-line">Have a project or a role in mind? Let’s talk.</p>
          {/* TODO(Navneet): confirm the reply-time wording. */}
          <p className="ax-foot-reply">I reply within one working day.</p>
        </div>
        <div className="ax-foot-col">
          <p className="ax-foot-h">Contact</p>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          {CONTACT.phones.map((phone) => <a key={phone} href={'tel:' + phone.replace(/\s/g, '')}>{phone}</a>)}
          <a href={CONTACT.linkedin} rel="noreferrer">LinkedIn</a>
        </div>
        <div className="ax-foot-col">
          <p className="ax-foot-h">Work</p>
          <a href={designUrl}>Design portfolio</a>
          <Link to="/">Automation</Link>
          <Link to="/demos">Dialog gallery</Link>
          <Link to="/connect">Get in touch</Link>
          <Link to="/coverage">How the pictures were made</Link>
        </div>
        <div className="ax-foot-col">
          <p className="ax-foot-h">Tools I built</p>
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
        <p>Portfolio of Navneet Singh, New Delhi. Dialog pictures are screenshots and renders of the tools, with sample data. Autodesk, Revit and AutoCAD are trademarks of Autodesk, Inc.; Rhino, SketchUp and Blender are trademarks of their owners.</p>
      </div>
    </footer>
  )
}

/** Kept for existing call sites. Blocks no longer fade up on their own; motion is scroll-scrubbed in CSS. */
export function Reveal({ children, as: Tag = 'div', className = '' }: { children: ReactNode; delay?: number; as?: 'div' | 'section' | 'li'; className?: string }) {
  return <Tag className={className || undefined}>{children}</Tag>
}
