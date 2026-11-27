import { useEffect, useState, type ReactNode } from 'react'

/** Renders `fallback` on the server and the first client paint, then `children`. */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])
  return ready ? children : fallback
}
