'use client'
import { useEffect, useRef } from 'react'

// Twinkling star particles that drift with the pointer.
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const g = c.getContext('2d'); if (!g) return
    let W = 0, H = 0, id = 0, mx = 0, my = 0
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() * 0.9 + 0.1, p: Math.random() * 7 }))
    const size = () => { const d = Math.min(2, window.devicePixelRatio || 1); W = c.width = innerWidth * d; H = c.height = innerHeight * d; g.setTransform(d, 0, 0, d, 0, 0) }
    size(); addEventListener('resize', size)
    const mv = (e: PointerEvent) => { mx = (e.clientX / innerWidth - 0.5); my = (e.clientY / innerHeight - 0.5) }
    addEventListener('pointermove', mv)
    const draw = (t: number) => {
      g.clearRect(0, 0, innerWidth, innerHeight)
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--owl').trim() || '#f2c500'
      for (const s of stars) {
        const x = ((s.x * innerWidth + mx * 40 * s.z + t * 0.004 * s.z) % innerWidth + innerWidth) % innerWidth, y = s.y * innerHeight + my * 40 * s.z
        g.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t / 900 + s.p)); g.fillStyle = ink; g.beginPath(); g.arc(x, y, s.z * 2, 0, 7); g.fill()
      }
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(id); removeEventListener('resize', size); removeEventListener('pointermove', mv) }
  }, [])
  return <canvas ref={ref} className="stars" aria-hidden />
}
