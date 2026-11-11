import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

type Rgb = readonly [number, number, number]
const CONTINUITY_COLORS: Record<string, Rgb> = {
  paper: [243, 238, 230],
  'paper-2': [235, 228, 216],
  stone: [217, 205, 189],
}

const rgb = (color: Rgb) => `rgb(${color[0]} ${color[1]} ${color[2]})`
const blend = (from: Rgb, to: Rgb, progress: number): Rgb => [
  Math.round(from[0] + (to[0] - from[0]) * progress),
  Math.round(from[1] + (to[1] - from[1]) * progress),
  Math.round(from[2] + (to[2] - from[2]) * progress),
]

/**
 * Keeps one light, contrast-safe background on the body. Each marked section is
 * transparent; its next boundary is blended over at least 40vh. Dark demo desks
 * remain self-contained surfaces, so foreground colours never have to interpolate.
 * IntersectionObserver wakes the calculation near boundaries and scroll rAF is the
 * browser fallback. Reduced motion receives the first section's static colour.
 */
export function useContinuityBackground(routeKey: string) {
  useEffect(() => {
    const body = document.body
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let anchors: HTMLElement[] = []
    let frame = 0
    let intersection: IntersectionObserver | undefined

    const color = (anchor?: HTMLElement) => CONTINUITY_COLORS[anchor?.dataset.continuityBg ?? ''] ?? CONTINUITY_COLORS.paper
    const paint = (value: Rgb) => body.style.setProperty('--bg', rgb(value))
    const render = () => {
      frame = 0
      if (!anchors.length) { paint(CONTINUITY_COLORS.paper); return }
      if (motion.matches || anchors.length === 1) { paint(color(anchors[0])); return }

      const center = window.scrollY + window.innerHeight * .5
      const band = Math.max(160, window.innerHeight * .4)
      let current = color(anchors[0])
      for (let index = 1; index < anchors.length; index += 1) {
        const boundary = anchors[index].getBoundingClientRect().top + window.scrollY
        const start = boundary - band * .5
        const end = boundary + band * .5
        if (center < start) { paint(current); return }
        if (center <= end) {
          paint(blend(current, color(anchors[index]), Math.max(0, Math.min(1, (center - start) / band))))
          return
        }
        current = color(anchors[index])
      }
      paint(current)
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(render) }
    const observe = () => {
      anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-continuity-bg]'))
      intersection?.disconnect()
      if ('IntersectionObserver' in window) {
        intersection = new IntersectionObserver(queue, { rootMargin: '60% 0px 60%' })
        anchors.forEach((anchor) => intersection?.observe(anchor))
      }
      queue()
    }

    const mutations = new MutationObserver(observe)
    mutations.observe(document.querySelector('main') ?? body, { childList: true, subtree: true })
    observe()
    addEventListener('scroll', queue, { passive: true })
    addEventListener('resize', queue)
    motion.addEventListener('change', queue)
    return () => {
      mutations.disconnect()
      intersection?.disconnect()
      removeEventListener('scroll', queue)
      removeEventListener('resize', queue)
      motion.removeEventListener('change', queue)
      cancelAnimationFrame(frame)
      body.style.removeProperty('--bg')
    }
  }, [routeKey])
}

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

// Cards that react to the pointer. Blocks no longer fade in on their own: motion is scroll-scrubbed in CSS.
const SPOT = '.pcard, .demo-cards a, .coverage-summary, .inquiry-form, .spec, .ps-card'

/** Site-wide pointer light: a glow on the background grid and card spotlights. */
export function useSiteMotion() {
  useEffect(() => {
    if (reducedMotion()) return
    const root = document.documentElement
    let queued = 0
    const scan = () => {
      queued = 0
      document.querySelectorAll<HTMLElement>('main :is(' + SPOT + '):not([data-spot])').forEach((el) => { el.dataset.spot = '' })
    }
    const observer = new MutationObserver(() => { if (!queued) queued = requestAnimationFrame(scan) })
    observer.observe(document.body, { childList: true, subtree: true })
    scan()
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
    return () => { observer.disconnect(); removeEventListener('pointermove', move); cancelAnimationFrame(frame); cancelAnimationFrame(queued) }
  }, [])
}
