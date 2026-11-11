import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Counts up to `to` the first time it scrolls into view. Shows the final value without motion. */
export function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(to)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    setN(0)
    let frame = 0
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 900)
        setN(Math.round(to * (1 - (1 - p) ** 3)))
        if (p < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(frame) }
  }, [to])
  return <span ref={ref}>{n}</span>
}

/** Fades every image in `main` in once it has loaded, so pictures never pop into a flat block. */
export function useImageFade() {
  useEffect(() => {
    const loaded = (img: HTMLImageElement) => { img.dataset.loaded = '1' }
    const scan = () => document.querySelectorAll<HTMLImageElement>('main img:not([data-loaded])').forEach((img) => {
      if (img.complete) { loaded(img); return }
      img.addEventListener('load', () => loaded(img), { once: true })
      img.addEventListener('error', () => loaded(img), { once: true })
    })
    scan()
    const observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })
    document.documentElement.classList.add('img-fade')
    return () => { observer.disconnect(); document.documentElement.classList.remove('img-fade') }
  }, [])
}

/** Writes page scroll progress (0 to 1) to --scroll on the element. */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      ref.current?.style.setProperty('--scroll', String(max > 0 ? scrollY / max : 0))
    }
    update()
    addEventListener('scroll', update, { passive: true })
    return () => removeEventListener('scroll', update)
  }, [])
  return ref
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const list = matchMedia(query)
    const change = () => setMatches(list.matches)
    list.addEventListener('change', change)
    return () => list.removeEventListener('change', change)
  }, [query])
  return matches
}

// Blocks that reveal as they scroll into view, and cards that react to the pointer.
const REVEAL = '.native-title, .catalog-heading, .pcard, .glass, .ps-card, .feature-list li, .coverage-summary > div, .coverage-notes, .coverage-scroll, .inquiry-intro, .inquiry-next, .demo-section-title, .project-metadata, .project-workbench, .demo-featured li, .demo-group-label, .p-hero-grid > *, .home-stats > div, .shot, .dialog-wall-head, .native-capture, .demo-basis'
const SPOT = '.pcard, .demo-cards a, .home-desktop-grid article, .coverage-summary, .inquiry-form, .spec, .ps-card'

/** Site-wide motion: staggered scroll reveals, a pointer light on the background, and card spotlights. */
export function useSiteMotion() {
  useEffect(() => {
    if (reducedMotion()) return
    const root = document.documentElement
    const show = (el: Element) => {
      el.classList.add('mo-in')
      // Hand the element back to its own hover transitions once it has arrived.
      window.setTimeout(() => { (el as HTMLElement).dataset.mo = 'done' }, 1400)
    }
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { io.unobserve(entry.target); show(entry.target) }
    }), { rootMargin: '0px 0px -6% 0px' })
    let queued = 0
    const scan = () => {
      queued = 0
      document.querySelectorAll<HTMLElement>('main :is(' + REVEAL + '):not([data-mo])').forEach((el) => {
        // Leave alone anything inside a live demo or a block that already animates itself.
        if (el.closest('.reveal, .player, .ad, .hero-stage, [data-mo="1"]')) { el.dataset.mo = 'skip'; return }
        el.dataset.mo = '1'
        el.style.setProperty('--mo-i', String(Math.min(el.parentElement ? [...el.parentElement.children].indexOf(el) % 6 : 0, 5)))
        io.observe(el)
      })
      document.querySelectorAll<HTMLElement>('main :is(' + SPOT + '):not([data-spot])').forEach((el) => { el.dataset.spot = '' })
    }
    const observer = new MutationObserver(() => { if (!queued) queued = requestAnimationFrame(scan) })
    observer.observe(document.body, { childList: true, subtree: true })
    scan()
    // If a block was never reported as visible (for example a background tab), show it anyway.
    const failsafe = window.setInterval(() => document.querySelectorAll('[data-mo="1"]:not(.mo-in)').forEach((el) => {
      const box = el.getBoundingClientRect()
      if (box.top < innerHeight && box.bottom > 0) show(el)
    }), 2500)

    let frame = 0
    const move = (event: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        root.style.setProperty('--gx', event.clientX + 'px')
        root.style.setProperty('--gy', event.clientY + 'px')
        root.style.setProperty('--glow', '1')
        const card = (event.target as Element | null)?.closest<HTMLElement>('[data-spot]')
        if (!card) return
        const box = card.getBoundingClientRect()
        card.style.setProperty('--mx', event.clientX - box.left + 'px')
        card.style.setProperty('--my', event.clientY - box.top + 'px')
        card.style.setProperty('--px', ((event.clientX - box.left) / box.width - .5).toFixed(3))
        card.style.setProperty('--py', ((event.clientY - box.top) / box.height - .5).toFixed(3))
      })
    }
    addEventListener('pointermove', move, { passive: true })
    return () => { io.disconnect(); observer.disconnect(); window.clearInterval(failsafe); removeEventListener('pointermove', move); cancelAnimationFrame(frame); cancelAnimationFrame(queued) }
  }, [])
}
