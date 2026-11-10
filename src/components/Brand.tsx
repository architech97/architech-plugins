// The ArchiTECH mark uses the official geometry and the site palette.
export function Mark({ size = 34, blade = 'var(--cyan)' }: { size?: number; blade?: string }) {
  return (
    <svg viewBox="1 0 100 100" width={size} height={size} aria-hidden="true">
      <path d="M8 87.3 L51.06 12.70 A86.14 86.14 0 0 1 94.14 87.3 A140 140 0 0 0 64 28.17 L53.96 28.17 L24.03 80.01 L28.24 87.3 Z" fill="var(--text)" />
      <path d="M46.50 48.18 L94.14 87.30 L40.94 57.82 Z" fill={blade} />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <Mark size={compact ? 30 : 36} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ font: `300 ${compact ? 22 : 25}px/0.9 var(--font-display)`, color: 'var(--text)', letterSpacing: '-.01em' }}>
          Archi<span style={{ fontWeight: 600, color: 'var(--cyan-2)' }}>TECH</span>
        </span>
        <span style={{ font: '500 8.5px/1 var(--font-display)', letterSpacing: '.46em', color: 'var(--text-2)' }}>AUTOMATION</span>
      </span>
    </span>
  )
}

export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '')
