import { useId } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../data/types'
import { suiteById } from '../data/suites'
import { asset } from './Brand'
import { dialogAlt, thumbProps } from './dialogImage'
import './catalog.css'

type Specimen = {
  title: string
  lines: string
  marks: string
  guides?: string
  shade?: string
  labels?: [number, number, string][]
}

const SPECIMENS: Partial<Record<string, Specimen>> = {
  'rhino-mcp': {
    title: 'Solid bounds and volume',
    guides: 'M64 122l113-64 119 34m-220 47 111-63 113 35M180 30v125',
    shade: 'M91 104l100-55 78 21-99 57zM170 127l99-57v28l-99 57z',
    lines: 'M91 104l100-55 78 21-99 57zm0 0v27l79 24 99-57V70m-99 57v28',
    marks: 'M89 95l100-56m-104 55 4 5m99-61 4 5m-22 119 105-57m-105 52v10m105-68v10M282 70v29m-4-29h9m-9 29h9',
    labels: [[111, 58, '1 200'], [242, 137, '600'], [290, 88, '300']],
  },
  'sketchup-mcp': {
    title: 'Signed extrusion bounds',
    guides: 'M73 91l106-52 110 50-106 54zm106-67v132m-106-65 216-2',
    shade: 'M116 97l64-33 56 25-62 34zM174 123l62-34v28l-62 32z',
    lines: 'M116 97l64-33 56 25-62 34zm0 0v26l58 26 62-32V89m-62 34v26M116 97V67l64-33 56 25v30m-120-22 58 26 62-34m-62 34v30',
    marks: 'M249 59v57m-5-51 5-6 5 6m-10 45 5 6 5-6M169 93h10m-5-5v10',
    labels: [[258, 64, '+Z'], [258, 119, '−Z'], [85, 153, 'SIGNED HEIGHT']],
  },
  'autocad-mcp': {
    title: 'Drawing block takeoff',
    lines: 'M42 49h175v94H42zm67 0v94m0-43h108m-65-51v51M232 60h87v73h-87zm0 25h87m-87 16h87m-87 16h87m-27-32v48',
    shade: 'M232 60h87v25h-87z',
    marks: 'M65 78h16v11H65zm0 35h16v11H65zm54-36 13-6 13 6-13 6zm43 31h32v19h-32zm-6 7h5m34 0h5m-6 13 16 8',
    labels: [[237, 76, 'BLOCK QTY'], [239, 96, 'DOOR'], [301, 96, '4'], [239, 112, 'CHAIR'], [301, 112, '4'], [239, 128, 'DESK'], [301, 128, '2']],
  },
  'blender-mcp': {
    title: 'Walkthrough camera clearance',
    guides: 'M47 43h266v104H47zM69 113h222M155 43v104m77-104v104',
    shade: 'M74 56h83v27H74zM190 70h45v26h-45z',
    lines: 'M74 56h83v27H74zm116 14h45v26h-45zM279 53v31m-10-21h20',
    marks: 'M75 119l88 5 61-13 54-15m-203 18v10m88-5v10m61-23v10m54-25v10M257 106l21-10-20-3',
    labels: [[80, 74, 'SOFA'], [65, 141, '01'], [156, 143, '02'], [276, 122, '03']],
  },
}

function SpecimenDrawing({ specimen }: { specimen: Specimen }) {
  return (
    <svg className="product-specimen" viewBox="0 0 360 184" role="img" aria-label={specimen.title}>
      <path className="specimen-frame" d="M25 31V19h12m286 0h12v12m0 122v12h-12m-286 0H25v-12" />
      {specimen.guides && <path className="specimen-guides" d={specimen.guides} />}
      {specimen.shade && <path className="specimen-shade" d={specimen.shade} fillRule="evenodd" />}
      <path className="specimen-lines" d={specimen.lines} />
      <path className="specimen-marks" d={specimen.marks} />
      {specimen.labels?.map(([x, y, text]) => <text key={[x, y, text].join(':')} x={x} y={y}>{text}</text>)}
    </svg>
  )
}

export function ProductCard({ p }: { p: Product }) {
  const titleId = useId()
  const suite = suiteById(p.suite)
  const dialog = p.dialogs[0]
  const media = dialog ? undefined : p.media?.find((item) => item.kind === 'image')
  const specimen = SPECIMENS[p.slug]
  const previewScale = dialog ? Math.max(1, Math.min(1.55, dialog.dark[1] / 680)) : 1
  const productPath = '/plugins/' + p.slug

  return (
    <article className="pcard product-card" aria-labelledby={titleId}>
      {(dialog || media || specimen) && (
        <figure className="product-preview">
          <div className={'product-preview-art ' + (dialog ? 'is-native' : media ? 'is-desktop' : 'is-specimen')}>
            {dialog
              ? <img {...thumbProps(dialog.dark)} alt={dialogAlt(p, dialog)} style={{ ['--preview-scale' as string]: previewScale }} loading="lazy" decoding="async" />
              : media ? <img src={asset(media.src)} alt={media.alt} loading="lazy" decoding="async" />
              : specimen && <SpecimenDrawing specimen={specimen} />}
          </div>
          <figcaption>{dialog ? (dialog.real ? 'Screenshot' : 'Its own window, sample data') : media ? 'Desktop capture' : 'Workflow drawing'}</figcaption>
        </figure>
      )}
      <div className="product-card-body">
        <span className="suite-tag" style={{ ['--suite' as string]: suite.color }}>{suite.short} <span aria-hidden="true">/</span> {p.panel}</span>
        <h3 id={titleId}>{p.name}</h3>
        <p>{p.tagline}</p>
        <ul className="product-hosts" aria-label="Supported hosts">
          {p.revit.length > 0 && <li>Revit {p.revit.join(' / ')}</li>}
          {p.software.filter((item) => item !== 'Revit' || !p.revit.length).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div className="product-card-actions">
        {p.demo && <Link to={'/demos/' + p.demo} aria-label={p.name + ' dialogs'}>See dialogs</Link>}
        <Link to={productPath} aria-label={p.name + ' product details'}>Details</Link>
      </div>
    </article>
  )
}
