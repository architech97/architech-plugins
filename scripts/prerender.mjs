// Fills each built route with its rendered HTML and writes that page's Open Graph image.
import { createHash } from 'node:crypto'
import { createServer } from 'vite'
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PurgeCSS } from 'purgecss'
import sharp from 'sharp'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const publicDir = join(root, 'public')
const basePath = (process.env.BASE ?? '/architech-plugins/').replace(/\/$/, '')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      if (dir === dist && ['assets', 'dialogs', 'media', 'og'].includes(name)) continue
      walk(path, out)
    } else if (name === 'index.html') out.push(path)
  }
  return out
}

function routeOf(file) {
  const folder = relative(dist, dirname(file)).replaceAll('\\', '/')
  return folder === '.' ? '' : folder
}

function locationFor(route) {
  const prefix = basePath && basePath !== '/' ? basePath : ''
  return prefix + (route ? `/${route}/` : '/')
}

const esc = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Classes that can appear on the home page, including ones hydration adds.
const HOME_CLASS_SOURCES = [
  'index.html',
  'src/pages/Home.tsx',
  'src/pages/HomeSections.tsx',
  'src/components/DialogGallery.tsx',
  'src/components/Layout.tsx',
  'src/components/Brand.tsx',
  'src/components/mailFallback.tsx',
  'src/components/motion.tsx',
  'src/components/useChromeNavigation.ts',
]

/** The home sentence is the largest paint. The shared stylesheet also carries every other page, so the first paint only waits for the rules this page uses. The full file follows once that paint has settled, for the next page. */
async function slimHomeStylesheet(html) {
  const link = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/)
  if (!link) throw new Error('Home page is missing its stylesheet')
  const href = link[1]
  const prefix = basePath && basePath !== '/' ? basePath : ''
  const rel = href.startsWith(`${prefix}/`) ? href.slice(prefix.length) : href
  const cssFile = join(dist, rel.replace(/^\//, ''))
  const css = readFileSync(cssFile, 'utf8')
  const content = [{ raw: html, extension: 'html' }]
  for (const file of HOME_CLASS_SOURCES) {
    content.push({ raw: readFileSync(join(root, file), 'utf8'), extension: file.endsWith('.html') ? 'html' : 'js' })
  }
  const purged = await new PurgeCSS().purge({
    content,
    css: [{ raw: css }],
    // Keep every face, including the metric-matched fallbacks. Unused faces are not unused: the family is chosen through a custom property.
    fontFace: false,
    keyframes: false,
    variables: false,
  })
  const slim = purged[0]?.css ?? ''
  if (!slim.includes('@font-face') || !slim.includes('Cormorant Garamond') || !slim.includes('.ah-honest') || !slim.includes('.mail-note')) {
    throw new Error('Home stylesheet lost the display font or the home copy styles')
  }
  const hash = createHash('sha256').update(slim).digest('base64url').slice(0, 8)
  const name = `home-${hash}.css`
  writeFileSync(join(dirname(cssFile), name), slim)
  const slimHref = href.slice(0, href.lastIndexOf('/') + 1) + name
  const swapped = html.replaceAll(href, slimHref)
  const boot = 'function boot(){if(started)return;started=true;'
  if (!swapped.includes(boot)) throw new Error('Home page is missing the deferred script boot')
  const fullCss = `var l=document.createElement("link");l.rel="stylesheet";l.href=${JSON.stringify(href)};document.head.appendChild(l);`
  return swapped.replace(boot, boot + fullCss)
}

function wrap(text, max) {
  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > max && line) { lines.push(line); line = word }
    else line = next
  }
  if (line) lines.push(line)
  return lines
}

function kindOf(product) {
  if (!product) return 'ArchiTECH Automation'
  if (product.panel === 'MCP connectors') return 'MCP connector'
  if (product.panel === 'Desktop app' || product.panel === 'Assistant') return 'Desktop app'
  if (product.panel === 'Start') return 'Suite home'
  if (product.slug === 'point-cloud-on-off') return 'Ribbon utility'
  return 'Revit add-in'
}

const STATIC_TITLES = {
  '': 'Tools that finish the drawing set',
  plugins: 'Every tool I have built, by task',
  demos: 'Every dialog, as built',
  connect: 'Get in touch',
  coverage: 'How the pictures were made',
  pricing: 'Discuss a tool',
  'custom-development': 'Discuss a custom workflow',
}

let logoPng
async function logo() {
  if (!logoPng) {
    const svg = readFileSync(new URL('../src/assets/architech-design-lockup.svg', import.meta.url), 'utf8')
      .replaceAll('var(--logo-ink, #F1EFEA)', '#241E1A')
      .replaceAll('var(--logo-accent, #A88752)', '#7B9BE6')
    logoPng = await sharp(Buffer.from(svg)).resize({ width: 248 }).png().toBuffer()
  }
  return logoPng
}

function leadOf(product) {
  if (!product?.dialogs?.length) return undefined
  const area = (shot) => shot.dark[1] * shot.dark[2] + (shot.real ? 1 : 0)
  return product.dialogs.reduce((best, shot) => (area(shot) > area(best) ? shot : best))
}

async function renderCard({ title, kicker, body, imagePath, caption }) {
  const hasImage = Boolean(imagePath)
  const titleLines = wrap(title, hasImage ? 18 : 32).slice(0, 4)
  const bodyLines = wrap(body, hasImage ? 42 : 78).slice(0, 7)
  const text = []
  titleLines.forEach((line, index) => {
    text.push(`<text x="56" y="${214 + index * 58}" fill="#241E1A" font-family="Noto Serif, Liberation Serif, serif" font-size="46">${esc(line)}</text>`)
  })
  const bodyTop = 214 + titleLines.length * 58 + 18
  bodyLines.forEach((line, index) => {
    text.push(`<text x="56" y="${bodyTop + index * 30}" fill="#5C564E" font-family="Inter, Liberation Sans, sans-serif" font-size="20">${esc(line)}</text>`)
  })
  const panel = hasImage
    ? `<rect x="628" y="46" width="520" height="538" rx="8" fill="#171311"/>
       <text x="652" y="556" fill="#F3EEE6" font-family="Inter, Liberation Sans, sans-serif" font-size="18">${esc(caption)}</text>`
    : ''
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F3EEE6"/>
  <rect x="56" y="118" width="64" height="3" fill="#7B9BE6"/>
  <text x="56" y="148" fill="#7B9BE6" font-family="Inter, Liberation Sans, sans-serif" font-size="15" letter-spacing="1.2">${esc(kicker.toUpperCase())}</text>
  ${text.join('\n  ')}
  ${panel}
</svg>`
  const layers = [{ input: await logo(), left: 56, top: 40 }]
  if (hasImage) {
    const fitted = await sharp(imagePath).resize(472, 430, { fit: 'contain', background: { r: 23, g: 19, b: 17, alpha: 1 } }).png().toBuffer()
    layers.push({ input: fitted, left: 652, top: 70 })
  }
  return sharp(Buffer.from(svg)).composite(layers).png().toBuffer()
}

const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
  const { pageMeta } = await server.ssrLoadModule('/src/data/pageMeta.ts')
  const { PRODUCTS } = await server.ssrLoadModule('/src/data/catalog.ts')
  const bySlug = new Map(PRODUCTS.map((product) => [product.slug, product]))
  const byDemo = new Map(PRODUCTS.filter((product) => product.demo).map((product) => [product.demo, product]))
  const featured = bySlug.get('sheet-export')

  let pages = 0
  for (const file of walk(dist)) {
    const route = routeOf(file)
    const markup = await render(locationFor(route))
    if (!markup.includes('<h1')) throw new Error(`Prerender produced no heading for ${route || '/'}\n${markup.slice(0, 400)}`)
    if (markup.includes("This page isn't here.")) throw new Error(`Prerender missed the route ${route || '/'}`)
    const shell = readFileSync(file, 'utf8')
    if (!shell.includes('<div id="root"></div>')) throw new Error(`Built shell has no empty root: ${route || '/'}`)
    let next = shell.replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`)
    if (!route) next = await slimHomeStylesheet(next)
    for (const href of [...next.matchAll(/<link rel="preload" as="image"[^>]*href="([^"]+)"/g)].map((match) => match[1])) {
      if (!next.includes(`src="${href}"`)) throw new Error(`Image preload ${href} is not the picture on ${route || '/'}`)
    }
    writeFileSync(file, next)

    const info = pageMeta(route)
    const product = route.startsWith('plugins/') ? bySlug.get(route.slice('plugins/'.length))
      : route.startsWith('demos/') ? byDemo.get(route.slice('demos/'.length))
      : undefined
    const indexShot = !route || route === 'plugins' || route === 'demos'
    const shot = indexShot ? leadOf(featured) : leadOf(product)
    const imagePath = shot ? join(publicDir, shot.dark[0]) : undefined
    const title = STATIC_TITLES[route] ?? (route.startsWith('demos/') ? `${product?.name ?? 'Dialogs'} dialogs` : product?.name ?? info.title)
    const kicker = route.startsWith('demos/') ? 'Dialogs'
      : product && !product.dialogs.length ? 'Dialog capture coming'
      : product ? kindOf(product)
      : route === 'coverage' ? 'Pictures'
      : route === 'connect' || route === 'pricing' || route === 'custom-development' ? 'Contact'
      : 'ArchiTECH Automation'
    const body = product && !product.dialogs.length
      ? `${product.tagline} Dialog capture coming. This page does not show a window yet.`
      : info.description
    const caption = shot ? `${indexShot ? featured.name : product.name}, as built` : ''
    const png = await renderCard({ title, kicker, body, imagePath, caption })
    const ogFile = join(dist, 'og', route ? `${route}.png` : 'home.png')
    mkdirSync(dirname(ogFile), { recursive: true })
    writeFileSync(ogFile, png)
    pages += 1
  }
  console.log(`prerendered ${pages} pages`)
} finally {
  await server.close()
}
