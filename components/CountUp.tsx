'use client'
import { useEffect, useRef, useState } from 'react'
export default function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(to); const from = useRef(to)
  useEffect(() => {
    const a = from.current, b = to; if (a === b) return
    const t0 = performance.now(); let id = 0
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 900); setN(Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)))); if (k < 1) id = requestAnimationFrame(step); else from.current = b }
    id = requestAnimationFrame(step); return () => cancelAnimationFrame(id)
  }, [to])
  return <>{n}</>
}
