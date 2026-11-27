import { useEffect, useState } from 'react'
import { useSearchParams, type SetURLSearchParams } from 'react-router-dom'

const EMPTY = new URLSearchParams()

/**
 * The prerendered page has no query string. The first render uses an empty query so it matches
 * that HTML; the address-bar query is applied after mount.
 */
export function useDeferredSearchParams(): [URLSearchParams, SetURLSearchParams] {
  const [params, setParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])
  return [ready ? params : EMPTY, setParams]
}
