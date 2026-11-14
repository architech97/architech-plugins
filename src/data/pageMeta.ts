import counts from './counts.generated.json'
import pages from './pageIndex.generated.json'

const SUFFIX = ' | ArchiTECH Automation'

type PageRecord = { slug: string; name: string; tagline: string; demo: string | null; windows: number }

const PAGES = pages as PageRecord[]

export type PageMeta = { title: string; description: string }

const home: PageMeta = {
  title: 'ArchiTECH Automation | BIM tools by Navneet Singh',
  description: `BIM tools by Navneet Singh: ${counts.revitTools} Revit add-ins, ${counts.suiteHomes} suite homes, ${counts.desktopApps} desktop apps and ${counts.connectors} AI connectors.`,
}

const STATIC: Record<string, PageMeta> = {
  plugins: {
    title: 'All tools' + SUFFIX,
    description: `All ${counts.products} ArchiTECH products, sorted by the job each one does: ${counts.revitTools} Revit add-ins, ${counts.suiteHomes} suite homes, ${counts.utilities} ribbon utility, ${counts.desktopApps} desktop apps and ${counts.connectors} AI connectors.`,
  },
  demos: {
    title: 'Dialog gallery' + SUFFIX,
    description: `Dialog gallery of every ArchiTECH window as built, grouped by the job each tool does. Open a tool to see its real dialogs.`,
  },
  connect: {
    title: 'Get in touch' + SUFFIX,
    description: 'Get in touch with Navneet Singh about a role, a project, or one of his tools.',
  },
  coverage: {
    title: 'How the pictures were made' + SUFFIX,
    description: 'How the pictures were made: what each dialog picture is, which are screenshots, and which products have no picture yet.',
  },
  pricing: {
    title: 'Discuss a tool' + SUFFIX,
    description: 'Pricing depends on the tool, host application and deployment scope. This legacy route continues to the contact page.',
  },
  'custom-development': {
    title: 'Discuss a custom workflow' + SUFFIX,
    description: 'Describe a repetitive BIM task or integration requirement. This legacy route continues to the contact page.',
  },
}

/** Title and description for one route. Plugin pages and their dialog pages never share either string. */
export function pageMeta(route: string): PageMeta {
  const path = route.replace(/^\/+|\/+$/g, '')
  if (!path) return home
  const fixed = STATIC[path]
  if (fixed) return fixed

  const pluginSlug = path.startsWith('plugins/') ? path.slice('plugins/'.length) : ''
  const plugin = pluginSlug ? PAGES.find((page) => page.slug === pluginSlug) : undefined
  if (plugin) {
    return {
      title: `${plugin.name}${SUFFIX}`,
      description: `${plugin.name}. ${plugin.tagline}`,
    }
  }

  const demoId = path.startsWith('demos/') ? path.slice('demos/'.length) : ''
  const demo = demoId ? PAGES.find((page) => page.demo === demoId) : undefined
  if (demo) {
    const windows = demo.windows === 1 ? '1 window' : `${demo.windows} windows`
    return {
      title: `${demo.name} live demo${SUFFIX}`,
      description: `${demo.name} live demo: ${windows} as built. ${demo.tagline}`,
    }
  }

  return {
    title: 'Page not found' + SUFFIX,
    description: 'This ArchiTECH Automation page is not here. Browse the tools, or go back to the Automation home.',
  }
}
