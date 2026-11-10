export type SuiteId = 'folio' | 'forge' | 'sentinel' | 'i3d' | 'ai'

export interface DialogShot {
  title: string
  dark?: string
  light?: string
  w?: number
  h?: number
}

export interface Product {
  slug: string
  key: string
  name: string
  suite: SuiteId
  panel: string
  software: string[]
  /** Revit versions the shipping build targets (empty when not a Revit add-in). */
  revit: string[]
  /** The product's own one-line summary (ribbon tooltip or repository description). */
  tagline: string
  /** The product's own long description, as shipped. */
  description: string
  capabilities: string[]
  safeguards: string[]
  dialogs: DialogShot[]
  /** The everyday problem it addresses; written from the product's own description. */
  problem?: string
  /** Interactive demo id, when one exists. */
  demo?: string
  /** Extra media published by the product itself (screenshots, animations). */
  media?: { src: string; alt: string; kind: 'image' | 'animation' }[]
  status: 'available' | 'preview' | 'enterprise'
  platform?: string
  requirements?: string[]
}

export interface Suite {
  id: SuiteId
  name: string
  short: string
  color: string
  summary: string
  focus: string
}
