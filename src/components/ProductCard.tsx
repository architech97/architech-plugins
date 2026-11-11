import { useId } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import type { Product } from '../data/types'
import { suiteById } from '../data/suites'
import { asset } from './Brand'
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
  'coord-plan': {
    title: 'Coordination floor plan',
    guides: 'M61 33v118m88-118v118m88-118v118m-202-95h243M35 123h243M285 30v118',
    lines: 'M61 55h176v68H61zM149 55v28m0 20v20M61 92h41m18 0h29m0-14h42m22 0h24M250 54l29-13 27 11 19-13m-75 80 25 13 31-14 19 7',
    marks: 'M51 46h196v86H51zM264 88h42m-21-21v42m-9-21a9 9 0 1 0 18 0 9 9 0 1 0-18 0',
    labels: [[54, 23, 'A'], [145, 23, 'B'], [232, 23, 'C'], [66, 147, '01 / COORDINATION']],
  },
  'navis-view': {
    title: 'Isometric coordination view',
    guides: 'M81 88l98-57 108 36v64l-98 29-108-36zm0 0 108 36 98-57m-98 57v36m-10-129v38',
    shade: 'M110 107l78 30 77-45v20l-77 43-78-29zM121 91l61-35 54 20-61 35z',
    lines: 'M110 107l78 30 77-45v20l-77 43-78-29zm11-16 61-35 54 20-61 35zm0 0v26m54-6v23m61-58v30M142 78v22m19-32v20',
    marks: 'M137 107l44-23 45 15 26-15m-71 0V65m45 34v14',
    labels: [[78, 154, 'SECTION BOX'], [247, 54, 'MEP']],
  },
  'links-inspector': {
    title: 'Linked file audit',
    lines: 'M39 37h282v104H39zm0 26h282M39 89h282m-282 26h282M200 37v104m70-104v104',
    shade: 'M39 63h282v26H39z',
    marks: 'M211 74l5 4 8-8m-13 30 5 4 8-8m-12 25 10 10m0-10-10 10M289 73h12m-12 26h12m-12 26h12',
    labels: [[52, 54, 'REFERENCE'], [210, 54, 'STATUS'], [279, 54, 'INST.'], [52, 80, 'Architecture.rvt'], [52, 106, 'Structure.rvt'], [52, 132, 'Site survey.dwg']],
  },
  'pin-unpin-links': {
    title: 'Bulk link pinning',
    guides: 'M49 45h113v88H49zM198 45h113v88H198z',
    lines: 'M63 62h77v51H63zm25 0v51m0-25h52M212 62h77v51h-77zm25 0v51m0-25h52',
    marks: 'M117 58h14m-11 0v10l-4 5h16l-4-5V58m-4 15v10M266 58h14m-11 0v10l-4 5h16l-4-5V58m-4 15v10M153 87h46m-7-6 7 6-7 6',
    labels: [[50, 148, 'REVIT LINKS'], [199, 148, 'CAD LINKS'], [156, 76, 'PIN']],
  },
  'in-place-inspector': {
    title: 'In-place family inspection',
    guides: 'M56 117l104-64 131 41-103 63zM74 85h213m-205 21h211',
    lines: 'M95 105l34-21 44 16-35 21zv-15l34-21 44 16v15m-35 6v-16M220 109l26-17 36 11-26 17zm0 0v14l36 12 26-17v-15m-26 17v15',
    shade: 'M146 94l38-24 48 17-38 26zM194 113l38-26v22l-38 25z',
    marks: 'M146 94l38-24 48 17-38 26zm0 0v20l48 20 38-25V87m-38 26v21m21-57 16-24h63',
    labels: [[233, 45, 'IN-PLACE'], [68, 151, 'ISOLATE IN 3D']],
  },
  'model-health': {
    title: 'Model health check report',
    guides: 'M43 39h274v106H43zM43 63h274m-274 27h274m-274 27h274',
    shade: 'M43 39h274v24H43zM214 69h78v12h-78zM214 96h45v12h-45zM214 123h25v12h-25z',
    lines: 'M59 74h119m-119 27h119m-119 27h119M202 63v82',
    marks: 'M214 69h78v12h-78zM214 96h45v12h-45zM214 123h25v12h-25zM303 50h6m-3-3v6',
    labels: [[58, 55, 'RULE CHECK'], [214, 55, 'FINDINGS'], [45, 162, 'FILTER / EXPORT']],
  },
  'split-floor-ceiling': {
    title: 'Separate slab sketch regions',
    guides: 'M47 45h266v88H47zM170 37v105',
    lines: 'M60 65h85l13 37-19 17H60zm21 14h36v23H81zM195 63h105v47l-37 9h-68zm36 14h35v22h-35z',
    shade: 'M60 65h85l13 37-19 17H60zm21 14v23h36V79zM195 63h105v47l-37 9h-68zm36 14v22h35V77z',
    marks: 'M60 65h85l13 37-19 17H60zm135-2h105v47l-37 9h-68zm-43 27h39m-8-6 8 6-8 6',
    labels: [[58, 147, 'REGION 01'], [197, 147, 'REGION 02']],
  },
  'spot-elevation-line': {
    title: 'Spot elevation line overrides',
    guides: 'M51 47h256m-256 44h256m-256 44h256',
    lines: 'M61 126h67v-18h67V82h70V58h35M90 126l20-20h36m24 2 20-20h35m13-6 17-17h45',
    marks: 'M80 126h20m-10-10v20m70-28h20m-10-10v20m58-36h20m-10-10v20M101 101h46m38-18h44m23-23h47',
    labels: [[112, 97, '+0.000'], [194, 79, '+0.450'], [262, 56, '+0.900'], [60, 154, 'PROJECTION / CUT']],
  },
  'split-region-with-line': {
    title: 'Filled region split along detail line',
    guides: 'M47 43h266v94H47zM183 31v117',
    shade: 'M56 63l96-12v72l-96-6zM198 53l98 14v51l-98 6z',
    lines: 'M56 63l96-12v72l-96-6zm16 1 52 54m-37-56 54 57m-38-58 47 51m-89-32 38 39M198 53l98 14v51l-98 6zm2 5 62 64m-47-65 63 65m-46-62 57 59m-42-56 48 51',
    marks: 'M181 38v102m-6-95 6-7 6 7m-12 88 6 7 6-7M151 85h47',
    labels: [[60, 151, 'FILL A'], [197, 151, 'FILL B'], [190, 40, 'CUT LINE']],
  },
  'revit-mcp': {
    title: 'Verified sheet creation',
    lines: 'M53 36h181v114H53zm12 12h157v67H65zm0 67h157v23H65zm86 0v23M83 63h119m-119 15h91m-91 15h104M250 65h58v55h-58z',
    shade: 'M65 115h157v23H65z',
    marks: 'M259 92l12 11 26-29m-63 19h15',
    labels: [[72, 131, 'BUILDING SECTIONS'], [157, 131, 'A-302'], [249, 139, 'READBACK']],
  },
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
  'architech-assistant': {
    title: 'Approved parameter update',
    lines: 'M42 44h276v98H42zm0 26h276m-276 46h276M153 70v46m-88-20h67m41 0h66',
    shade: 'M42 44h276v26H42zM153 70h165v46H153z',
    marks: 'M262 94l9 8 17-17m-10 40 8 7 15-14',
    labels: [[54, 61, 'WALL 401284 / COMMENTS'], [58, 88, 'BEFORE'], [165, 88, 'PROPOSED'], [54, 134, 'READBACK COMPLETE']],
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

/** A product's picture for galleries: its dialog (Dark, crossfading to Light on hover), a capture, or a drawing. */
export function ProductThumb({ p }: { p: Product }) {
  const dialog = p.dialogs.find((item) => item.dark || item.light)
  const shot = dialog?.dark ?? dialog?.light ?? p.media?.find((item) => item.kind === 'image')?.src
  const specimen = SPECIMENS[p.slug]
  return (
    <div className={'product-thumb' + (shot ? '' : ' is-specimen')}>
      {shot ? <img src={asset(shot)} alt="" loading="lazy" decoding="async" /> : specimen && <SpecimenDrawing specimen={specimen} />}
      {dialog?.dark && dialog.light && <img className="product-thumb-light" src={asset(dialog.light)} alt="" loading="lazy" decoding="async" />}
    </div>
  )
}

export function ProductCard({ p }: { p: Product }) {
  const titleId = useId()
  const suite = suiteById(p.suite)
  const dialog = p.dialogs.find((item) => item.dark || item.light)
  const media = p.media?.find((item) => item.kind === 'image')
  const shot = dialog?.dark ?? dialog?.light ?? media?.src
  const specimen = SPECIMENS[p.slug]
  const previewScale = dialog?.w ? Math.max(1, Math.min(1.55, dialog.w / 680)) : 1
  const productPath = '/plugins/' + p.slug

  return (
    <article className="pcard product-card" aria-labelledby={titleId}>
      {(shot || specimen) && (
        <figure className="product-preview">
          <div className={'product-preview-art ' + (dialog ? 'is-native' : shot ? 'is-desktop' : 'is-specimen')}>
            {shot
              ? <img src={asset(shot)} alt={dialog ? dialog.title + ' interface' : media?.alt ?? ''} style={{ ['--preview-scale' as string]: previewScale }} loading="lazy" decoding="async" />
              : specimen && <SpecimenDrawing specimen={specimen} />}
          </div>
          <figcaption>{dialog ? (dialog.source === 'reconstructed' ? 'Source-derived dialog' : 'Plugin dialog') : shot ? 'Desktop capture' : 'Workflow specimen'}</figcaption>
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
        {p.demo && <Link to={'/demos/' + p.demo} aria-label={'Try ' + p.name + ' demo'}><Play size={14} aria-hidden="true" /> Try demo</Link>}
        <Link to={productPath} aria-label={p.name + ' product details'}>Details <ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
    </article>
  )
}
