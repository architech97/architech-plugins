import type { DialogImage, DialogShot, Product } from '../data/types'
import { asset } from './Brand'

type Named = Pick<Product, 'name' | 'software' | 'suite'>
const isRevit = (p: Named) => p.software.includes('Revit') && p.suite !== 'i3d'

/** "<Tool> - <dialog title> dialog in Revit", with the state when one dialog is pictured more than once. */
export const dialogAlt = (p: Named, shot: DialogShot, theme = 'dark') =>
  `${p.name} - ${shot.title}${shot.state !== shot.title && shot.state !== 'Main window' ? ' (' + shot.state + ')' : ''} dialog${isRevit(p) ? ' in Revit' : ''}${theme === 'light' ? ', light theme' : ''}`

const smallUrl = (url: string) => url.replace(/\.webp$/, '-720.webp')

/** src, srcset and intrinsic size for one published image. `slot` is the widest it is drawn, in CSS pixels. */
export function imageProps([src, w, h, small]: DialogImage, slot = 1100) {
  const url = asset(src)
  return {
    src: url, width: w, height: h,
    ...(small ? { srcSet: `${smallUrl(url)} 720w, ${url} ${w}w`, sizes: `(max-width: 720px) calc(100vw - 40px), ${Math.min(w, slot)}px` } : {}),
  }
}

/** A preview no wider than 420 CSS pixels: the 720px copy where one exists. */
export function thumbProps([src, w, h, small]: DialogImage) {
  return { src: small ? smallUrl(asset(src)) : asset(src), width: w, height: h }
}
