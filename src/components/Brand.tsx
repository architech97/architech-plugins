// The ArchiTECH mark, as used by the shared header and footer (see styles/chrome.css).
export function Mark({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="1 0 100 100" width={size} height={size} aria-hidden="true">
      <path fill="currentColor" d="M8 87.3L51.06 12.7a86.14 86.14 0 0 1 43.08 74.6A140 140 0 0 0 64 28.17H53.96L24.03 80.01l4.21 7.29Z" />
      <path className="ax-blade" d="m46.5 48.18 47.64 39.12-53.2-29.48Z" />
    </svg>
  )
}

export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '')
