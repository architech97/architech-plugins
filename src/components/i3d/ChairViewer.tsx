import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export type ViewMode = 'textured' | 'clay' | 'wireframe'

type Props = {
  src: string
  mode: ViewMode
  /** Model height in mm; the chair was exported at 900 mm. */
  height: number
  /** 0..1: how much of the model is built, bottom to top (the Engine step animates it). */
  reveal: number
  resetKey: number
  onReady?: () => void
}

const EXPORTED_HEIGHT = 900
const CLAY = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.85, metalness: 0 })
const WIRE = new THREE.MeshBasicMaterial({ color: 0x3fe0dc, wireframe: true, transparent: true, opacity: 0.55 })

/** The real I3D chair in a small three.js stage: drag to orbit, scroll to zoom. */
export function ChairViewer({ src, mode, height, reveal, resetKey, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<{ setMode(m: ViewMode): void; setHeight(h: number): void; setReveal(r: number): void; reset(): void } | null>(null)
  const latest = useRef({ mode, height, reveal })
  latest.current = { mode, height, reveal }

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.localClippingEnabled = true
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3d44, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(1.5, 2.5, 2); scene.add(sun)
    const grid = new THREE.GridHelper(2.4, 24, 0x6b7180, 0x4a4f59); (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = 0.5
    scene.add(grid)

    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50)
    const controls = new OrbitControls(camera, renderer.domElement)
    // No wheel zoom: scrolling over the demo must keep scrolling the page.
    controls.enableDamping = true; controls.enableZoom = false; controls.enablePan = false; controls.maxPolarAngle = Math.PI * 0.49
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.9
    controls.addEventListener('start', () => { controls.autoRotate = false })
    const home = () => { camera.position.set(0.55, 1.15, 2.35); controls.target.set(0, 0.42, 0); controls.update() }
    home()

    const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10)
    CLAY.clippingPlanes = [clip]; WIRE.clippingPlanes = [clip]
    const model = new THREE.Group(); scene.add(model)
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()
    let modelHeight = 1

    const apply = () => {
      const { mode: m, height: h, reveal: r } = latest.current
      originals.forEach((mat, mesh) => { mesh.material = m === 'textured' ? mat : m === 'clay' ? CLAY : WIRE })
      model.scale.setScalar(h / EXPORTED_HEIGHT)
      clip.constant = r >= 1 ? 10 : modelHeight * (h / EXPORTED_HEIGHT) * r
    }
    api.current = { setMode: apply, setHeight: apply, setReveal: apply, reset: () => { home(); controls.autoRotate = false } }

    new GLTFLoader().load(src, (gltf) => {
      const root = gltf.scene
      const box = new THREE.Box3().setFromObject(root)
      const centre = box.getCenter(new THREE.Vector3())
      root.position.set(-centre.x, -box.min.y, -centre.z)
      modelHeight = box.max.y - box.min.y
      root.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => { m.clippingPlanes = [clip] })
        originals.set(mesh, mesh.material)
      })
      model.add(root); apply(); onReady?.()
    })

    const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix() }
    const observer = new ResizeObserver(resize); observer.observe(el); resize()
    let visible = true
    const seen = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); seen.observe(el)
    renderer.setAnimationLoop(() => { if (!visible) return; controls.update(); renderer.render(scene, camera) })

    return () => {
      renderer.setAnimationLoop(null); observer.disconnect(); seen.disconnect(); controls.dispose()
      scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose() })
      renderer.dispose(); el.removeChild(renderer.domElement); api.current = null
    }
  }, [src, onReady])

  useEffect(() => { api.current?.setMode(mode) }, [mode])
  useEffect(() => { api.current?.setHeight(height) }, [height])
  useEffect(() => { api.current?.setReveal(reveal) }, [reveal])
  useEffect(() => { if (resetKey) api.current?.reset() }, [resetKey])

  return <div ref={host} className="i3d-canvas" role="img" aria-label="Interactive 3D model of the chair. Drag to rotate." />
}
