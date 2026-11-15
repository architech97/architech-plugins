import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { DesignLockup } from './Brand'
import { CONTACT } from '../data/contact'
import pages from '../data/pageIndex.generated.json'
import { pageMeta } from '../data/pageMeta'
import { useContinuityBackground, useImageFade, useScrollProgress, useSiteMotion } from './motion'
import { useChromeNavigation } from './useChromeNavigation'

const homeUrl = '/'
const designUrl = '/design/'

const SECTIONS = [
  { to: '/', label: 'Overview' },
  { to: '/plugins', label: 'All tools' },
  { to: '/demos', label: 'Dialog gallery' },
  { to: '/connect', label: 'Work with me' },
]

export function Layout() {
  const { pathname, hash } = useLocation()
  const pill = useScrollProgress<HTMLElement>()
  const { chromeRef, dialogRef, menuButtonRef, menuOpen, hidden, isDark, showBackToTop, openMenu, closeMenu } = useChromeNavigation(pathname)
  const route = pathname.replace(/\/+$/, '')
  const tool = route.startsWith('/plugins/') ? pages.find((page) => page.slug === route.slice('/plugins/'.length)) : undefined
  const demo = route.startsWith('/demos/') ? pages.find((page) => page.demo === route.slice('/demos/'.length)) : undefined
  const breadcrumb = tool ? { to: '/plugins', section: 'All tools', name: tool.name }
    : demo ? { to: '/demos', section: 'Dialog gallery', name: demo.name } : undefined
  const siteLinks = <>
    <a href={homeUrl}>Home</a>
    <a href={designUrl} data-division="design">Design</a>
    <Link to="/" data-division="automation" aria-current="page">Automation</Link>
  </>
  const sectionLinks = SECTIONS.map((item) => (
    <NavLink key={item.to} to={item.to} end={item.to === '/'} className={item.to === '/connect' ? 'nav-cta' : undefined}>
      {item.label}
    </NavLink>
  ))
  const crumbs = breadcrumb && <nav className="pill-crumb" aria-label="Breadcrumb">
    <Link to="/">Automation</Link><span aria-hidden="true">&rsaquo;</span>
    <Link to={breadcrumb.to}>{breadcrumb.section}</Link><span aria-hidden="true">&rsaquo;</span>
    <span aria-current="page">{breadcrumb.name}</span>
  </nav>
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
    if (!hash) return
    const target = document.getElementById(hash.slice(1))
    // Finish the route's entrance transform before measuring the fragment position.
    target?.closest('.route-in')?.getAnimations().forEach((animation) => animation.finish())
    target?.scrollIntoView()
  }, [pathname, hash])
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div id="top" tabIndex={-1} />
      <div className={'automation-pill' + (isDark ? ' is-dark' : '')} data-logo="blueprint" ref={chromeRef} data-hidden={hidden} data-menu-open={menuOpen}>
        <header className="navglass" ref={pill}>
          <div className="nav-row">
            <a className="bar-logo" href={homeUrl} aria-label="ArchiTECH home"><DesignLockup /></a>
            <nav className="division-switcher navtabs" aria-label="Site">{siteLinks}</nav>
            <nav className="nav-links" aria-label="Automation">{sectionLinks}</nav>
            <button type="button" className="nav-toggle" ref={menuButtonRef} aria-label="Open menu" aria-expanded={menuOpen} aria-controls="site-menu" onClick={openMenu}>
              <span /><span />
            </button>
          </div>
          {crumbs}
          <div className="pill-progress" aria-hidden="true"><span /></div>
        </header>
        <dialog id="site-menu" className="pill-menu" ref={dialogRef} aria-labelledby="site-menu-title" onCancel={(event) => { event.preventDefault(); closeMenu() }} onClose={closeMenu} onClick={(event) => { if ((event.target as Element).closest('a')) closeMenu() }}>
          <h2 id="site-menu-title" className="sr-only">Menu</h2>
          <div className="nav-row">
            <a className="bar-logo" href={homeUrl} aria-label="ArchiTECH home"><DesignLockup /></a>
            <button type="button" className="nav-toggle is-close" aria-label="Close menu" onClick={closeMenu} autoFocus><span /><span /></button>
          </div>
          {crumbs}
          <div className="pill-menu-body">
            <nav className="nav-menu-divisions" aria-label="Site">{siteLinks}</nav>
            <nav className="nav-menu-inner" aria-label="Automation">
              {SECTIONS.map((item, index) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={item.to === '/connect' ? 'nav-cta' : undefined}>
                <small aria-hidden="true">{String(index + 1).padStart(2, '0')}</small>{item.label}<i aria-hidden="true">→</i>
              </NavLink>)}
            </nav>
            <div className="nav-menu-foot">
              <a href={homeUrl + '#about'}>About</a>
              <a href="#contact">Contact</a>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </div>
          </div>
        </dialog>
      </div>
      <main id="main" tabIndex={-1}><div key={pathname} className="route-in"><Outlet /></div></main>
      <Footer />
      <a className="ax-back-top" href="#top" aria-label="Back to top" hidden={!showBackToTop}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 11 6-6 6 6M12 5v14" /></svg>
      </a>
    </>
  )
}

/** The same night-bar footer as the homepage (architech-design/portal.html). */
function Footer() {
  return (
    <footer className="ax-footer feather" data-logo="blueprint" id="contact">
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
          <a href={CONTACT.linkedin} rel="noopener noreferrer">LinkedIn</a>
          <a href={CONTACT.instagram} rel="noopener noreferrer">Instagram</a>
          <a href={CONTACT.youtube} rel="noopener noreferrer">YouTube</a>
          <a href={CONTACT.x} rel="noopener noreferrer">X</a>
        </div>
        <div className="ax-foot-col">
          <p className="ax-foot-h">Work</p>
          <a href={homeUrl}>Home</a>
          <a href={designUrl}>Design portfolio</a>
          <Link to="/">Automation</Link>
          <Link to="/demos">Dialog gallery</Link>
          <Link to="/connect">Get in touch</Link>
          <a href="/privacy/">Privacy</a>
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
        <a className="ax-foot-mark" href={homeUrl} aria-label="ArchiTECH home"><DesignLockup /></a>
        <a className="ax-foot-top" href="#top">Back to top</a>
        <p>Portfolio of Navneet Singh, New Delhi. Dialog pictures are screenshots and renders of the tools, with sample data. Autodesk, Revit and AutoCAD are trademarks of Autodesk, Inc.; Rhino, SketchUp and Blender are trademarks of their owners.</p>
      </div>
      {/* HOOK(contact-form): Navneet has not chosen a form service. Do not post this anywhere and do not add analytics. */}
      <div id="contact-form" data-form="unconfigured" hidden />
    </footer>
  )
}

/** Kept for existing call sites. Blocks no longer fade up on their own; motion is scroll-scrubbed in CSS. */
export function Reveal({ children, as: Tag = 'div', className = '' }: { children: ReactNode; delay?: number; as?: 'div' | 'section' | 'li'; className?: string }) {
  return <Tag className={className || undefined}>{children}</Tag>
}
