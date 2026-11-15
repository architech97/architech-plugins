import { useCallback, useEffect, useRef, useState } from 'react'

/** Shared shell behaviour; the CSS remains portable to the static site. */
export function useChromeNavigation(routeKey: string) {
  const chromeRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  const closeMenu = useCallback(() => {
    dialogRef.current?.close()
    setMenuOpen(false)
    menuButtonRef.current?.focus({ preventScroll: true })
  }, [])

  const openMenu = () => {
    dialogRef.current?.showModal()
    setMenuOpen(true)
    setHidden(false)
  }

  useEffect(() => {
    if (dialogRef.current?.open) closeMenu()
  }, [routeKey, closeMenu])

  useEffect(() => {
    const desktop = matchMedia('(min-width: 721px)')
    const resize = () => {
      if (desktop.matches && dialogRef.current?.open) {
        closeMenu()
        chromeRef.current?.querySelector<HTMLElement>('.ax-nav [aria-current="page"]')?.focus({ preventScroll: true })
      }
    }
    desktop.addEventListener('change', resize)
    return () => desktop.removeEventListener('change', resize)
  }, [closeMenu])

  useEffect(() => {
    if (!menuOpen) return
    const root = document.documentElement
    const previousRootOverflow = root.style.overflow
    const previousOverflow = document.body.style.overflow
    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    const dialog = dialogRef.current!
    // Keep Tab and Shift+Tab within the menu in addition to native modal inertness.
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const targets = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      const first = targets[0]
      const last = targets.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    dialog.addEventListener('keydown', trap)
    return () => {
      dialog.removeEventListener('keydown', trap)
      root.style.overflow = previousRootOverflow
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  useEffect(() => {
    const root = document.documentElement
    const chrome = chromeRef.current!
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const footerBase = document.querySelector<HTMLElement>('.ax-foot-base')
    let previousY = Math.max(0, window.scrollY)
    let height = chrome.getBoundingClientRect().height
    let frame = 0

    const update = () => {
      frame = 0
      const y = Math.max(0, window.scrollY)
      const focused = chrome.contains(document.activeElement)
      if (motion.matches || menuOpen || focused || y <= height) setHidden(false)
      else if (y !== previousY) setHidden(y > previousY)
      previousY = y
      setShowBackToTop(y >= window.innerHeight * .8)
      // Lift the floating control clear of the footer's brand, top link and legal text.
      const footerTop = footerBase?.getBoundingClientRect().top ?? window.innerHeight
      root.style.setProperty('--back-top-bottom', Math.max(24, window.innerHeight - footerTop + 16) + 'px')
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    const measure = () => {
      height = chrome.getBoundingClientRect().height
      root.style.setProperty('--chrome-height', height + 'px')
      queue()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(chrome)
    observer.observe(document.body)
    if (footerBase) observer.observe(footerBase)
    measure()
    addEventListener('scroll', queue, { passive: true })
    addEventListener('resize', measure)
    chrome.addEventListener('focusin', queue)
    chrome.addEventListener('focusout', queue)
    motion.addEventListener('change', queue)
    return () => {
      observer.disconnect()
      removeEventListener('scroll', queue)
      removeEventListener('resize', measure)
      chrome.removeEventListener('focusin', queue)
      chrome.removeEventListener('focusout', queue)
      motion.removeEventListener('change', queue)
      cancelAnimationFrame(frame)
      root.style.removeProperty('--chrome-height')
      root.style.removeProperty('--back-top-bottom')
    }
  }, [menuOpen])

  return { chromeRef, dialogRef, menuButtonRef, menuOpen, hidden, showBackToTop, openMenu, closeMenu }
}
