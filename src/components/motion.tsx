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
