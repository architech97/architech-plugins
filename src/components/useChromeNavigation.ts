import { useCallback, useEffect, useRef, useState } from 'react'

/** Floating shell behaviour, including the native modal's focus and scroll lock. */
export function useChromeNavigation(routeKey: string) {
  const chromeRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  const closeMenu = useCallback(() => {
    const dialog = dialogRef.current
    const wasOpen = dialog?.open
    dialog?.close()
    setMenuOpen(false)
    if (wasOpen) menuButtonRef.current?.focus({ preventScroll: true })
  }, [])

  const openMenu = () => {
    dialogRef.current?.showModal()
    dialogRef.current?.querySelector<HTMLButtonElement>('.is-close')?.focus({ preventScroll: true })
    setMenuOpen(true)
    setHidden(false)
  }

  useEffect(() => {
    if (dialogRef.current?.open) closeMenu()
  }, [routeKey, closeMenu])

  useEffect(() => {
    const desktop = matchMedia('(min-width: 861px)')
    const resize = () => {
      if (desktop.matches && dialogRef.current?.open) {
        closeMenu()
        chromeRef.current?.querySelector<HTMLElement>('.navtabs [aria-current="page"]')?.focus({ preventScroll: true })
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
    const capsule = chrome.querySelector<HTMLElement>('.navglass')!
    const row = chrome.querySelector<HTMLElement>('.nav-row')!
    let previousY = Math.max(0, window.scrollY)
    let height = chrome.getBoundingClientRect().height
    let frame = 0

    const update = () => {
      frame = 0
      // Defer layout writes until after ResizeObserver delivery to avoid a
      // feedback loop when wrapped breadcrumbs change the main content offset.
      height = chrome.getBoundingClientRect().height
      const measuredHeight = height + 'px'
      if (root.style.getPropertyValue('--chrome-height') !== measuredHeight) root.style.setProperty('--chrome-height', measuredHeight)
      const y = Math.max(0, window.scrollY)
      const focused = chrome.contains(document.activeElement)
      if (motion.matches || menuOpen || focused || y <= height) setHidden(false)
      else if (y !== previousY) setHidden(y > previousY)
      previousY = y
      setShowBackToTop(y >= window.innerHeight * .8)
      // Lift the floating control clear of the footer's brand, top link and legal text.
      const footerTop = footerBase?.getBoundingClientRect().top ?? window.innerHeight
      root.style.setProperty('--back-top-bottom', Math.max(24, window.innerHeight - footerTop + 16) + 'px')
      if (!menuOpen) {
        // Use the resting capsule position so hiding the bar never changes the probe.
        // Native modal hit testing excludes the background, so hold its theme while open.
        const box = capsule.getBoundingClientRect()
        const probeX = Math.min(window.innerWidth - 1, Math.max(0, box.left + box.width / 2))
        const probeY = parseFloat(getComputedStyle(chrome).paddingTop) + row.offsetHeight / 2
        const surface = document.elementsFromPoint(probeX, probeY)
          .find((element) => !chrome.contains(element) && !element.closest('.ax-back-top'))
        const themed = surface?.closest('.ax-footer, .wall-band, [data-theme]')
        setIsDark(!!themed && (themed.matches('.ax-footer, .wall-band') || themed.getAttribute('data-theme') === 'dark'))
      }
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(queue)
    observer.observe(chrome)
    observer.observe(document.body)
    if (footerBase) observer.observe(footerBase)
    queue()
    addEventListener('scroll', queue, { passive: true })
    addEventListener('resize', queue)
    chrome.addEventListener('focusin', queue)
    chrome.addEventListener('focusout', queue)
    motion.addEventListener('change', queue)
    return () => {
      observer.disconnect()
      removeEventListener('scroll', queue)
      removeEventListener('resize', queue)
      chrome.removeEventListener('focusin', queue)
      chrome.removeEventListener('focusout', queue)
      motion.removeEventListener('change', queue)
      cancelAnimationFrame(frame)
      root.style.removeProperty('--chrome-height')
      root.style.removeProperty('--back-top-bottom')
    }
  }, [menuOpen, routeKey])

  return { chromeRef, dialogRef, menuButtonRef, menuOpen, hidden, isDark, showBackToTop, openMenu, closeMenu }
}
