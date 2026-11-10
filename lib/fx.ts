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

// Fireworks, emoji rain and star bursts on one lightweight canvas.
export function celebrate(kind: 'fireworks' | 'emoji' | 'stars', emoji = '⭐') {
  if (typeof document === 'undefined' || reduced()) return
  const c = document.createElement('canvas')
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight
  c.width = W * dpr; c.height = H * dpr; document.body.appendChild(c)
  const g = c.getContext('2d'); if (!g) { c.remove(); return }
  g.scale(dpr, dpr)
  type P = { x: number; y: number; vx: number; vy: number; g: number; life: number; max: number; c: string; e?: string; s: number }
  const ps: P[] = []; const cols = ['#f2c500', '#ff5d8f', '#4cc9f0', '#7bd88f', '#a78bfa', '#ffffff']
  const burst = (x: number, y: number, n: number, col: string, em?: string) => { for (let i = 0; i < n; i++) { const a = (Math.PI * 2 * i) / n + Math.random() * 0.2, sp = Math.random() * 6 + 3; ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.12, life: 0, max: 70 + Math.random() * 30, c: col, e: em, s: em ? 22 : 2.6 }) } }
  const plan: [number, () => void][] = []
  if (kind === 'fireworks') for (let i = 0; i < 6; i++) plan.push([i * 16, () => burst(W * (0.15 + Math.random() * 0.7), H * (0.15 + Math.random() * 0.4), 46, cols[i % cols.length])])
  if (kind === 'stars') plan.push([0, () => burst(W / 2, H * 0.45, 28, '#fff', emoji)], [14, () => burst(W / 2, H * 0.45, 22, '#fff', emoji)])
  if (kind === 'emoji') for (let i = 0; i < 46; i++) plan.push([Math.floor(Math.random() * 50), () => ps.push({ x: Math.random() * W, y: -30, vx: (Math.random() - 0.5) * 1.2, vy: Math.random() * 3 + 2.5, g: 0.02, life: 0, max: 200, c: '#fff', e: emoji, s: 24 + Math.random() * 18 })])
  let t = 0
  const step = () => {
    t++; plan.filter(x => x[0] === t).forEach(x => x[1]()); g.clearRect(0, 0, W, H)
    for (const p of ps) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.life++
      g.globalAlpha = Math.max(0, 1 - p.life / p.max)
      if (p.e) { g.font = `${p.s}px serif`; g.fillText(p.e, p.x, p.y) } else { g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 7); g.fill() }
    }
    g.globalAlpha = 1
    if (t < 260) requestAnimationFrame(step); else c.remove()
  }
  requestAnimationFrame(step)
}

/** Turn markdown and chat symbols into plain words so the voice never says "hashtag" or "asterisk". */
export function cleanForSpeech(t: string): string {
  return t
    .replace(/```[\s\S]*?```/g, ' (code example) ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' link ')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*([-*+•]|\d+[.)])\s+/gm, '')
    .replace(/^\s*\|?[\s:|-]{3,}\|?\s*$/gm, ' ')
    .replace(/\|/g, ', ')
    .replace(/(\*\*|__|\*|_|~~)/g, '')
    .replace(/#/g, ' ')
    .replace(/\$\$?([^$]+)\$\$?/g, '$1')
    .replace(/\\(frac|times|div|sqrt|pi|theta|alpha|beta)\b/g, (_, w) => ({ frac: '', times: ' times ', div: ' divided by ', sqrt: ' square root of ', pi: ' pi ', theta: ' theta ', alpha: ' alpha ', beta: ' beta ' } as Record<string, string>)[w])
    .replace(/[{}\\^]/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/([.!?:;])\s*\./g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
export function speak(t: string) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(cleanForSpeech(t).slice(0, 1200)); u.lang = 'en-GB'; speechSynthesis.speak(u) } catch {} }
export function stopSpeak() { try { speechSynthesis.cancel() } catch {} }
export const canListen = () => typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
export function listen(onText: (t: string) => void, onEnd: () => void): (() => void) | null {
  const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!R) return null
  const r = new R(); r.lang = 'en-GB'; r.interimResults = true
  r.onresult = (e: any) => onText(Array.from(e.results).map((x: any) => x[0].transcript).join(' ')); r.onend = onEnd; r.onerror = onEnd
  try { r.start() } catch { return null }
  return () => { try { r.stop() } catch {} }
}

export function passport(d: { name: string; level: string; xp: number; streak: number; badges: number; total: number; top: string }) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350
  const g = c.getContext('2d'); if (!g) return
  const bg = g.createLinearGradient(0, 0, 1080, 1350); bg.addColorStop(0, '#0d1030'); bg.addColorStop(1, '#41318f')
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350); g.textAlign = 'center'
  g.fillStyle = '#f2c500'; g.font = '700 38px system-ui,sans-serif'; g.fillText('WISE OWL WESTGATE · STUDY PASSPORT', 540, 130)
  g.fillStyle = '#fff'; g.font = '800 96px system-ui,sans-serif'; g.fillText(d.name || 'Wise Owl Student', 540, 330)
  g.fillStyle = '#f2c500'; g.font = '800 68px system-ui,sans-serif'; g.fillText(d.level, 540, 430)
  const rows: [string, string][] = [['XP', String(d.xp)], ['Day streak', String(d.streak)], ['Badges', `${d.badges} / ${d.total}`], ['Best subject', d.top || '-']]
  rows.forEach((r, i) => { const y = 560 + i * 150; g.fillStyle = '#ffffff18'; g.fillRect(140, y - 80, 800, 120); g.fillStyle = '#c9cbe4'; g.font = '500 40px system-ui,sans-serif'; g.textAlign = 'left'; g.fillText(r[0], 180, y); g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = '800 54px system-ui,sans-serif'; g.fillText(r[1], 900, y + 4) })
  g.textAlign = 'center'; g.fillStyle = '#c9cbe4'; g.font = '500 32px system-ui,sans-serif'; g.fillText('Ideas by Michael Makadzange · Code by Jayden Ngwenya', 540, 1260)
  c.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'study-passport.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000) })
}
