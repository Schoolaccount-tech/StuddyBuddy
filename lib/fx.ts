// Celebrations, sounds and focus noise. Everything is generated in the browser, no files needed.
export const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function confetti(power = 1) {
  if (typeof document === 'undefined' || reduced()) return
  const c = document.createElement('canvas')
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight
  c.width = W * dpr; c.height = H * dpr; document.body.appendChild(c)
  const g = c.getContext('2d'); if (!g) { c.remove(); return }
  g.scale(dpr, dpr)
  const cols = ['#f2c500', '#ff5d8f', '#4cc9f0', '#7bd88f', '#a78bfa', '#ffffff']
  const ps = Array.from({ length: Math.round(150 * power) }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 160, y: H * 0.62, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 17 - 6,
    r: Math.random() * 6 + 3, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, sq: Math.random() < 0.5,
  }))
  let t = 0
  const step = () => {
    t++; g.clearRect(0, 0, W, H); let alive = 0
    for (const p of ps) {
      p.vy += 0.36; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; if (p.y < H + 20) alive++
      g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - t / 170)
      if (p.sq) g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { g.beginPath(); g.arc(0, 0, p.r / 1.5, 0, 7); g.fill() }
      g.restore()
    }
    if (t < 180 && alive) requestAnimationFrame(step); else c.remove()
  }
  requestAnimationFrame(step)
}

let ctx: AudioContext | null = null
const audio = () => { if (!ctx) { const A = window.AudioContext || (window as any).webkitAudioContext; if (A) ctx = new A() } return ctx }
export const soundOn = () => { try { return localStorage.getItem('wob:sound') !== '0' } catch { return true } }
export const setSound = (v: boolean) => { try { localStorage.setItem('wob:sound', v ? '1' : '0') } catch {} }

function tone(f: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  const a = audio(); if (!a) return
  const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + at
  o.type = type; o.frequency.value = f
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.05)
}
export function sfx(k: 'pop' | 'good' | 'bad' | 'win' | 'level') {
  if (!soundOn()) return
  try {
    if (k === 'pop') tone(700, 0, 0.08, 'triangle')
    if (k === 'good') { tone(660, 0, 0.12); tone(880, 0.1, 0.18) }
    if (k === 'bad') { tone(200, 0, 0.22, 'sawtooth', 0.07); tone(150, 0.12, 0.25, 'sawtooth', 0.07) }
    if (k === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle'))
    if (k === 'level') [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.4, 'triangle', 0.14))
  } catch {}
}

let src: AudioBufferSourceNode | null = null
export function noise(on: boolean) {
  try {
    if (!on) { src?.stop(); src = null; return }
    const a = audio(); if (!a || src) return
    const len = a.sampleRate * 3, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0); let last = 0
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 }
    const s = a.createBufferSource(), g = a.createGain(); s.buffer = buf; s.loop = true; g.gain.value = 0.35
    s.connect(g); g.connect(a.destination); s.start(); src = s
  } catch {}
}

export function shareCard(title: string, big: string, line: string, who: string) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350
  const g = c.getContext('2d'); if (!g) return
  const bg = g.createLinearGradient(0, 0, 1080, 1350); bg.addColorStop(0, '#14183a'); bg.addColorStop(1, '#3a2b8c')
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350)
  g.fillStyle = '#f2c500'; g.beginPath(); g.arc(900, 180, 260, 0, 7); g.globalAlpha = 0.14; g.fill(); g.globalAlpha = 1
  g.textAlign = 'center'; g.fillStyle = '#f2c500'; g.font = '700 40px system-ui,sans-serif'; g.fillText('WISE OWL WESTGATE · IGCSE STUDY BUDDY', 540, 140)
  g.fillStyle = '#fff'; g.font = '800 70px system-ui,sans-serif'; g.fillText(title, 540, 420)
  g.fillStyle = '#f2c500'; g.font = '900 300px system-ui,sans-serif'; g.fillText(big, 540, 760)
  g.fillStyle = '#fff'; g.font = '600 54px system-ui,sans-serif'; g.fillText(line, 540, 900)
  g.font = '500 44px system-ui,sans-serif'; g.fillStyle = '#c9cbe4'; g.fillText(who, 540, 1010)
  g.font = '500 34px system-ui,sans-serif'; g.fillText('Ideas by Michael Makadzange · Code by Jayden Ngwenya', 540, 1260)
  c.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'study-buddy-score.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000) })
}
