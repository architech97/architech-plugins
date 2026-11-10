import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from './Brand'
import { CONTACT } from '../data/contact'

const NAV = [
  { to: '/plugins', label: 'Plugins' },
  { to: '/demos', label: 'Live demos' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/custom-development', label: 'Custom development' },
]

export function Layout() {
  const [open, setOpen] = useState(false)
  const nav = useRef<HTMLElement>(null)
  const menu = useRef<HTMLButtonElement>(null)
  const { pathname, hash } = useLocation()
  useEffect(() => {
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
    const heading = document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim()
    document.title = heading ? heading + ' · ArchiTECH Automation' : 'ArchiTECH Automation'
  }, [pathname])
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [pathname, hash])
  useEffect(() => {
    if (!open) return
    nav.current?.querySelector<HTMLElement>('a')?.focus()
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      menu.current?.focus()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [open])
  return (
    <>
      <div className="bg-grid" aria-hidden="true" />
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="staging-strip">Staging preview · Browser demos use sample data</div>
      <header className="site-header">
        <div className="wrap bar">
          <Link to="/" aria-label="ArchiTECH Automation home"><Logo /></Link>
          <nav ref={nav} id="site-nav" className={'nav' + (open ? ' open' : '')} aria-label="Main">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>)}
          </nav>
          <div className="nav-cta">
            <Link className="btn btn-ghost btn-sm" to="/custom-development?type=demo">Request a demo</Link>
            <Link className="btn btn-primary btn-sm" to="/demos">Try a live demo</Link>
            <button ref={menu} className="menu-btn" aria-controls="site-nav" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}><Outlet /></main>
      <Footer />
    </>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Logo />
            <p className="muted" style={{ marginTop: 18, maxWidth: '36ch', fontSize: 14.5 }}>
              BIM productivity software for architects, BIM teams and design studios, built from six years of architectural and BIM practice.
            </p>
          </div>
          <div>
            <h4>Products</h4>
            <Link to="/plugins?suite=folio">Arch Folio</Link>
            <Link to="/plugins?suite=forge">Arch Forge</Link>
            <Link to="/plugins?suite=sentinel">Arch Sentinel</Link>
            <Link to="/plugins/architech-i3d">ArchiTECH-I3D</Link>
            <Link to="/plugins?suite=ai">AI &amp; MCP</Link>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/demos">Live demos</Link>
            <Link to="/plugins">Full catalogue</Link>
            <Link to="/pricing">Pricing &amp; licensing</Link>
            <Link to="/custom-development">Custom development</Link>
          </div>
          <div>
            <h4>Contact</h4>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href={CONTACT.designSite} target="_blank" rel="noreferrer">ArchiTECH Design ↗</a>
          </div>
        </div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} ArchiTECH · Navneet Singh. Autodesk, Revit and AutoCAD are trademarks of Autodesk, Inc.; Rhino, SketchUp and Blender are trademarks of their owners.</span>
          <span>Demos run in your browser using sample data.</span>
        </div>
      </div>
    </footer>
  )
}

/** Fades content in once it scrolls into view (respects reduced motion via CSS). */
export function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }: { children: ReactNode; delay?: number; as?: 'div' | 'section' | 'li'; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.getBoundingClientRect().top < window.innerHeight) { setShown(true); return }   // already on screen: no fade-in
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <Tag ref={ref as never} className={`reveal ${shown ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>
}
