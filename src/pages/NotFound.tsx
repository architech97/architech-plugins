import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap" style={{ textAlign: 'center', maxWidth: 640 }}>
        <span className="eyebrow">404</span>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '14px 0' }}>This page isn't here.</h1>
        <p className="lead" style={{ margin: '0 auto 28px' }}>The link may be old, or the product may have moved.</p>
        <div className="hero-cta" style={{ justifyContent: 'center' }}><Link className="btn btn-primary" to="/plugins">Browse plugins</Link><Link className="btn btn-ghost" to="/">Home</Link></div>
      </div>
    </section>
  )
}
