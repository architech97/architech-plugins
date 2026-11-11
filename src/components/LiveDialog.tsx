import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { demoById } from '../demo/registry'
import type { DemoNotice, DialogTheme } from '../demo/types'
import '../demo/dialog.css'
import '../demo/player.css'

const noop = () => {}

/** One demo's dialog, live and interactive, without the guided player around it. Scales down to fit. */
export function LiveDialog({ id }: { id: string }) {
  const demo = demoById(id)!
  const Dialog = useMemo(() => lazy(demo.load), [demo])
  const [theme, setTheme] = useState<DialogTheme>('dark')
  const [note, setNote] = useState<DemoNotice | null>(null)
  const [run, setRun] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ k: 1, h: 0 })
  useEffect(() => {
    const measure = () => {
      if (!box.current || !inner.current) return
      const k = Math.min(1, box.current.clientWidth / demo.width)
      setFit({ k, h: inner.current.offsetHeight * k })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(box.current!)
    observer.observe(inner.current!)
    return () => observer.disconnect()
  }, [demo.width])

  return (
    <div className="live-dialog">
      <div ref={box} className="live-dialog-fit" style={{ height: fit.h || undefined }}>
        <div ref={inner} className="live-dialog-inner" style={{ width: demo.width, transform: `scale(${fit.k})` }}>
          <Suspense fallback={<div className="live-dialog-loading">Loading the {demo.ribbon.button} dialog…</div>}>
            <Dialog key={run} theme={theme} setTheme={setTheme} done={noop} rewind={noop} notify={setNote}
              close={() => { setRun(run + 1); setNote({ kind: 'info', text: 'Dialog reset to its sample state.' }) }} />
          </Suspense>
        </div>
      </div>
      <p className="live-dialog-note" role="status">{note ? note.text : 'Simulated on sample data. Nothing is sent or saved.'}</p>
    </div>
  )
}
