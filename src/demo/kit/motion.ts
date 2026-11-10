/** One action, one short animation. Every frame changes only transform or opacity. */
export const motion = { fast: 300, standard: 480, slow: 720, stagger: 40, easing: 'cubic-bezier(.2,.75,.25,1)' } as const
const activeAnimations = new Set<Animation>()
export function animateOnce(element: Element | null, frames: Keyframe[], reduced: boolean, duration: number = motion.standard) {
  if (!element || reduced || !element.animate) return undefined
  for (const active of activeAnimations) if (active.playState !== 'running') activeAnimations.delete(active)
  if (activeAnimations.size >= 3) return undefined
  const animation = element.animate(frames, { duration, easing: motion.easing, iterations: 1 })
  activeAnimations.add(animation)
  void animation.finished.then(() => activeAnimations.delete(animation), () => activeAnimations.delete(animation))
  return animation
}
