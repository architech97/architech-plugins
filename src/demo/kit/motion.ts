/** One action, one short animation. Every frame changes only transform or opacity. */
export const motion = { fast: 300, standard: 480, slow: 720, stagger: 40, easing: 'cubic-bezier(.2,.75,.25,1)' } as const
export function animateOnce(element: Element | null, frames: Keyframe[], reduced: boolean, duration: number = motion.standard) {
  if (!element || reduced || !element.animate) return undefined
  return element.animate(frames, { duration, easing: motion.easing, iterations: 1 })
}
