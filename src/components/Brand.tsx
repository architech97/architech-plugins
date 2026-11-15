import lockupSvg from '../assets/architech-design-lockup.svg?raw'

// Inline the official asset so the host's colour variables reach every path.
// The links supply the accessible name; omit document-only metadata and shared IDs.
const inlineLockup = lockupSvg
  .replace(/<\?xml[^>]*\?>\s*/, '')
  .replace('role="img" aria-labelledby="ax-logo-title"', 'aria-hidden="true" focusable="false"')
  .replace(' id="ax-logo-title"', '')

export function DesignLockup() {
  return <span className="ax-lockup" aria-hidden="true" dangerouslySetInnerHTML={{ __html: inlineLockup }} />
}

export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '')
