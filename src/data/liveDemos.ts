/** Products with a working browser demo on their own page. Dialog galleries are not live demos. */
export const BROWSER_DEMOS = ['architech-i3d', 'architech-assistant', 'revit-mcp'] as const

export function isBrowserDemo(slug: string) {
  return (BROWSER_DEMOS as readonly string[]).includes(slug)
}
