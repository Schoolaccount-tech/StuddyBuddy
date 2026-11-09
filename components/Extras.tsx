'use client'
import { useEffect, useRef, useState } from 'react'
import { QUOTES, FACTS, TERMS } from '@/lib/more'

// Every effect here returns nothing or a cleanup function. Nothing browser-only renders on the server.

export type Trail = 'off' | 'sparkle' | 'gold' | 'rainbow' | 'hearts'

/** Sparkle particles that follow the mouse. */
export function CursorTrail({ kind }: { kind: Trail }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || kind === 'off') return
    if (window.matchMedia('(pointer: fine)').matches === false || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const g = c.getContext('2d'); if (!g) return
    type P = { x: number; y: number; vx: number; vy: number; life: number; h: number; s: number }
    let ps: P[] = [], id = 0, last = 0
    const size = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    size(); window.addEventListener('resize', size)
    const mv = (e: PointerEvent) => {
      const now = performance.now(); if (now - last < 18) return; last = now
      for (let i = 0; i < 2; i++) ps.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6 - 0.4, life: 1, h: (now / 4 + i * 60) % 360, s: 3 + Math.random() * 5 })
      if (ps.length > 140) ps = ps.slice(-140)
    }
    window.addEventListener('pointermove', mv)
    const star = (x: number, y: number, r: number) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? r * 0.4 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) } g.closePath(); g.fill() }
    const draw = () => {
      g.clearRect(0, 0, c.width, c.height)
      ps = ps.filter(p => p.life > 0.02)
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.life *= 0.93; g.globalAlpha = p.life
        if (kind === 'hearts') { g.font = `${p.s * 3}px serif`; g.fillText('💖', p.x, p.y) }
        else { g.fillStyle = kind === 'rainbow' ? `hsl(${p.h},95%,60%)` : kind === 'gold' ? '#ffd23f' : 'hsl(48,100%,70%)'; star(p.x, p.y, p.s * p.life + 1) }
      }
      g.globalAlpha = 1; id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', size); window.removeEventListener('pointermove', mv) }
  }, [kind])
  return <canvas ref={ref} className="trail" aria-hidden />
}

/** Material-style ripple on every button click. */
export function Ripple() {
  useEffect(() => {
    const dn = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null; const b = t && t.closest ? t.closest<HTMLElement>('button, .opt, .tab') : null
      if (!b || (b as HTMLButtonElement).disabled) return
      const r = b.getBoundingClientRect(), s = document.createElement('span'), d = Math.max(r.width, r.height) * 2
      s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`
      const cs = getComputedStyle(b); if (cs.position === 'static') b.style.position = 'relative'; if (cs.overflow === 'visible') b.style.overflow = 'hidden'
      b.appendChild(s); setTimeout(() => s.remove(), 650)
    }
    document.addEventListener('pointerdown', dn)
    return () => document.removeEventListener('pointerdown', dn)
  }, [])
  return null
}

/** Up, up, down, down, left, right, left, right, B, A = rainbow mode. */
export function Konami({ onHit }: { onHit: () => void }) {
  const seq = useRef<string[]>([]); const cb = useRef(onHit); cb.current = onHit
  useEffect(() => {
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
    const kd = (e: KeyboardEvent) => {
      seq.current = [...seq.current, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-10)
      if (seq.current.join() === code.join()) { seq.current = []; cb.current() }
    }
    window.addEventListener('keydown', kd)
    return () => window.removeEventListener('keydown', kd)
  }, [])
  return null
}

/** A little sky: sun by day, moon and stars at night, drifting clouds. Chosen after mount so it never mismatches. */
export function Sky() {
  const [h, setH] = useState<number | null>(null); const [lang, setLang] = useState(0)
  useEffect(() => { setH(new Date().getHours()) }, [])
  if (h === null) return <div className="sky" aria-hidden />
  const night = h < 6 || h >= 19, dusk = (h >= 17 && h < 19) || (h >= 5 && h < 7)
  const slot = h < 12 ? 0 : h < 17 ? 1 : 2
  const GREET = [['Good morning', 'Good afternoon', 'Good evening'], ['Mangwanani', 'Masikati', 'Manheru'], ['Livukile', 'Salibonani', 'Salibonani']]
  const LNAME = ['English', 'Shona', 'Ndebele']
  const word = h >= 21 || h < 5 ? (lang === 0 ? 'Late night study' : GREET[lang][2]) : GREET[lang][slot]
  return <div className={'sky ' + (night ? 'night' : dusk ? 'dusk' : 'day')} onClick={() => setLang(l => (l + 1) % 3)} title="Tap to change language">
    <span className="orb">{night ? '🌙' : '☀️'}</span>
    <span className="cloud c1">☁️</span><span className="cloud c2">☁️</span>
    {night && <><i className="tw t1" /><i className="tw t2" /><i className="tw t3" /><i className="tw t4" /></>}
    <b className="sky-t">{word}, owl! 🦉</b><small className="sky-l">{LNAME[lang]} · tap me</small>
  </div>
}

/** Scrolling fun facts. */
export function Ticker() {
  const [on, setOn] = useState(false)
  useEffect(() => { setOn(true) }, [])
  if (!on) return null
  const all = [...FACTS, ...FACTS]
  return <div className="ticker" aria-label="Fun facts"><div className="ticker-in">{all.map((f, i) => <span key={i}>💡 {f}</span>)}</div></div>
}

/** Quote of the day plus word of the day, both chosen from the date after mount. */
export function Daily({ subj }: { subj: string }) {
  const [d, setD] = useState<number | null>(null)
  useEffect(() => { setD(Math.floor(Date.now() / 864e5)) }, [])
  if (d === null) return null
  const q = QUOTES[d % QUOTES.length]; const t = TERMS[subj] || TERMS['Mathematics']; const w = t[d % t.length]
  return <div className="duo">
    <div className="quote"><span className="qm">“</span><p>{q[0]}</p><small>— {q[1]}</small></div>
    <div className="wotd"><small>📖 Word of the day · {subj}</small><b>{w[0].charAt(0) + w[0].slice(1).toLowerCase()}</b><span>{w[1]}</span></div>
  </div>
}
