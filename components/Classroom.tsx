'use client'
import { useEffect, useRef, useState } from 'react'
import { store } from '@/lib/api'
import { sfx, confetti, celebrate } from '@/lib/fx'
import { LEVELS, levelOf } from '@/lib/progress'
import { readLook, saveLook, applyLook, LOOK_DEFAULT, type Look } from '@/lib/a11y'
import type { Api } from './api'

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const names = (t: string) => t.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean).slice(0, 60)

export const CLASS_TOOLS: readonly (readonly [string, string])[] = [['sm', '🌧️ Sound mixer'], ['sw', '⏱️ Stopwatch'], ['pk', '🎰 Name picker'], ['gp', '👥 Group maker'], ['bt', '📺 Big timer'], ['lc', '🎁 Daily chest'], ['rm', '🦉 Owl evolution'], ['lk', '🎨 Look & feel'], ['cc', '🎉 Party cannon']]

/* Ambient sound mixer: rain, waves, wind and white noise made live with the Web Audio API. */
function Mixer() {
  const [vols, setVols] = useState<Record<string, number>>({ rain: 0, waves: 0, wind: 0, white: 0 }); const ctx = useRef<AudioContext | null>(null); const gains = useRef<Record<string, GainNode>>({}); const srcs = useRef<AudioBufferSourceNode[]>([])
  const kinds: [string, string][] = [['rain', '🌧️ Rain'], ['waves', '🌊 Waves'], ['wind', '💨 Wind'], ['white', '📻 White noise']]
  function boot() {
    if (ctx.current) return ctx.current
    const AC = window.AudioContext || (window as any).webkitAudioContext; if (!AC) return null
    const c: AudioContext = new AC(); ctx.current = c
    const buf = (brown: boolean) => { const b = c.createBuffer(1, c.sampleRate * 3, c.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5 } else d[i] = w } return b }
    const mk = (id: string, brown: boolean, filt?: BiquadFilterType, freq = 1000, lfo = 0) => {
      const s = c.createBufferSource(); s.buffer = buf(brown); s.loop = true; const g = c.createGain(); g.gain.value = 0; let node: AudioNode = s
      if (filt) { const f = c.createBiquadFilter(); f.type = filt; f.frequency.value = freq; node.connect(f); node = f }
      node.connect(g); g.connect(c.destination); s.start(); srcs.current.push(s); gains.current[id] = g
      if (lfo) { const o = c.createOscillator(), og = c.createGain(); o.frequency.value = lfo; og.gain.value = 0.25; o.connect(og); og.connect(g.gain); o.start(); srcs.current.push(o as unknown as AudioBufferSourceNode) }
    }
    mk('rain', false, 'highpass', 1800); mk('waves', true, 'lowpass', 600, 0.12); mk('wind', true, 'bandpass', 400, 0.07); mk('white', false, 'lowpass', 8000)
    return c
  }
  useEffect(() => () => { try { srcs.current.forEach(s => { try { s.stop() } catch {} }); ctx.current?.close() } catch {} }, [])
  const set = (k: string, v: number) => { const c = boot(); if (!c) return; if (c.state === 'suspended') c.resume(); setVols(x => ({ ...x, [k]: v })); const g = gains.current[k]; if (g) g.gain.value = v * (k === 'white' ? 0.15 : k === 'rain' ? 0.35 : 0.9) }
  return <div><p className="note">Mix your own study atmosphere. Slide up the sounds you like.</p>
    <div className="mixer">{kinds.map(([k, l]) => <label key={k}><span>{l}</span><input type="range" min={0} max={1} step={0.05} value={vols[k]} onChange={e => set(k, +e.target.value)} aria-label={l} /><i style={{ width: `${vols[k] * 100}%` }} /></label>)}</div>
    <button className="btn ghost" onClick={() => kinds.forEach(([k]) => set(k, 0))}>Silence</button></div>
}

function Stopwatch() {
  const [ms, setMs] = useState(0); const [run, setRun] = useState(false); const [laps, setLaps] = useState<number[]>([]); const base = useRef(0)
  useEffect(() => {
    if (!run) return
    base.current = performance.now() - ms
    const id = setInterval(() => setMs(performance.now() - base.current), 47)
    return () => clearInterval(id)
  }, [run]) // eslint-disable-line
  const f = (n: number) => `${String(Math.floor(n / 60000)).padStart(2, '0')}:${String(Math.floor(n / 1000) % 60).padStart(2, '0')}.${String(Math.floor(n / 10) % 100).padStart(2, '0')}`
  return <div className="center"><div className="bigclock">{f(ms)}</div><div className="row"><button className="btn" onClick={() => { setRun(r => !r); sfx('pop') }}>{run ? 'Stop' : ms ? 'Resume' : 'Start'}</button><button className="btn ghost" disabled={!run} onClick={() => { setLaps(l => [ms, ...l].slice(0, 20)); sfx('good') }}>Lap</button><button className="btn ghost" onClick={() => { setRun(false); setMs(0); setLaps([]) }}>Reset</button></div>
    <ol className="laps">{laps.map((l, i) => <li key={i}>Lap {laps.length - i}: <b>{f(l)}</b></li>)}</ol></div>
}

function Picker() {
  const [t, setT] = useState(''); const [cur, setCur] = useState(''); const [spin, setSpin] = useState(false); const [done, setDone] = useState(false); const tm = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => { setT(String(store.get('names', ''))) }, [])
  useEffect(() => () => clearTimeout(tm.current), [])
  const list = names(t)
  function go() {
    if (list.length < 2 || spin) return; setSpin(true); setDone(false); let n = 0; const total = 22 + Math.floor(Math.random() * 10)
    const step = () => { n++; setCur(list[Math.floor(Math.random() * list.length)]); sfx('pop'); if (n < total) tm.current = setTimeout(step, 50 + n * n * 0.9); else { setSpin(false); setDone(true); sfx('win'); confetti(1.2) } }
    step()
  }
  return <div className="center"><textarea className="essay" rows={4} value={t} onChange={e => { setT(e.target.value); store.set('names', e.target.value) }} placeholder="Type names, one per line or separated by commas" aria-label="Names" />
    <div className={'picked' + (done ? ' done' : '') + (spin ? ' spin' : '')}>{cur || '🎰'}</div><button className="btn" onClick={go} disabled={spin || list.length < 2}>{spin ? 'Choosing…' : `Pick someone (${list.length})`}</button></div>
}

function Groups() {
  const [t, setT] = useState(''); const [n, setN] = useState(3); const [gs, setGs] = useState<string[][]>([])
  useEffect(() => { setT(String(store.get('names', ''))) }, [])
  const list = names(t)
  function make() { const s = shuffle(list); const g: string[][] = Array.from({ length: Math.max(1, Math.min(n, s.length)) }, () => []); s.forEach((x, i) => g[i % g.length].push(x)); setGs(g); sfx('win'); confetti(0.8) }
  return <div><textarea className="essay" rows={4} value={t} onChange={e => { setT(e.target.value); store.set('names', e.target.value) }} placeholder="Type names, one per line or separated by commas" aria-label="Names" />
    <div className="row" style={{ margin: '10px 0', justifyContent: 'flex-start' }}><label className="note">Groups: <b>{n}</b> <input type="range" min={2} max={10} value={n} onChange={e => setN(+e.target.value)} /></label><button className="btn" onClick={make} disabled={list.length < 2}>Make groups</button></div>
    <div className="groups">{gs.map((g, i) => <div key={i} className="grp tilt" style={{ animationDelay: `${i * 80}ms` }}><b>Group {i + 1}</b>{g.map(x => <span key={x}>{x}</span>)}</div>)}</div></div>
}

function BigTimer() {
  const [left, setLeft] = useState(300); const [run, setRun] = useState(false); const [flash, setFlash] = useState(false); const [min, setMin] = useState('5')
  useEffect(() => {
    if (!run) return
    if (left <= 0) { setRun(false); setFlash(true); sfx('win'); sfx('level'); const id = setTimeout(() => setFlash(false), 4000); return () => clearTimeout(id) }
    const id = setTimeout(() => setLeft(x => x - 1), 1000)
    return () => clearTimeout(id)
  }, [run, left])
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, '0')
  return <div className={'center bigtimer' + (flash ? ' flash' : '') + (run && left <= 10 ? ' hot' : '')}><div className="bigclock xl">{mm}:{ss}</div>
    <div className="seg wrapseg">{[1, 2, 3, 5, 10, 15, 20, 30].map(m => <button key={m} onClick={() => { setLeft(m * 60); setRun(false); setFlash(false); sfx('pop') }} aria-pressed={left === m * 60 && !run}>{m} min</button>)}</div>
    <div className="row"><input className="grow" style={{ maxWidth: 110 }} value={min} onChange={e => setMin(e.target.value)} inputMode="numeric" aria-label="Custom minutes" /><button className="btn ghost" onClick={() => { const m = Math.min(180, Math.max(1, parseInt(min) || 1)); setLeft(m * 60); setRun(false) }}>Set minutes</button>
      <button className="btn" onClick={() => { setRun(r => !r); setFlash(false); sfx('pop') }}>{run ? 'Pause' : 'Start'}</button></div>{flash && <h2>⏰ Time is up!</h2>}</div>
}

/* Daily chest: log in on consecutive days for bigger rewards. */
type Login = { last: string; streak: number }
const REW = [5, 5, 10, 10, 15, 20, 50]
function Chest({ api }: { api: Api }) {
  const [l, setL] = useState<Login>({ last: '', streak: 0 }); const [open, setOpen] = useState(false)
  useEffect(() => { const s = store.get<Login>('login', { last: '', streak: 0 }); setL(s && typeof s.streak === 'number' ? s : { last: '', streak: 0 }) }, [])
  const today = new Date(); const key = (d: Date) => d.toDateString(); const yest = new Date(); yest.setDate(yest.getDate() - 1)
  const claimed = l.last === key(today); const cont = l.last === key(yest) || claimed; const streak = claimed || cont ? l.streak : 0; const idx = claimed ? (streak - 1) % 7 : streak % 7
  function claim() { if (claimed) return; const s = cont ? l.streak + 1 : 1; const n = { last: key(today), streak: s }; setL(n); store.set('login', n); setOpen(true); const xp = REW[(s - 1) % 7]; api.award({ k: 'bonus', xp }); celebrate(s % 7 === 0 ? 'fireworks' : 'emoji', '🎁'); sfx('win'); api.toast('🎁', `Daily reward: +${xp} XP`, `Day ${((s - 1) % 7) + 1} of 7`, true) }
  return <div className="center"><p className="note">Open your chest every day. Miss a day and the streak starts again.</p>
    <div className="chests">{REW.map((x, i) => <div key={i} className={'chest' + (i < (claimed ? idx + 1 : idx) ? ' got' : '') + (i === idx && !claimed ? ' now' : '')}><span>{i < (claimed ? idx + 1 : idx) ? '✅' : i === 6 ? '💎' : '🎁'}</span><b>+{x}</b><small>Day {i + 1}</small></div>)}</div>
    <button className={'btn' + (open ? ' ' : '')} onClick={claim} disabled={claimed}>{claimed ? 'Come back tomorrow! 🌙' : `Open today’s chest (+${REW[idx]} XP)`}</button></div>
}

function Roadmap({ api }: { api: Api }) {
  const lv = levelOf(api.p.xp); const nxt = LEVELS[lv + 1]
  return <div><p className="note">{nxt ? `${nxt.xp - api.p.xp} XP until you become a ${nxt.n} ${nxt.e}` : 'You reached the top. Grand Owl! 🌟'}</p>
    <div className="road">{LEVELS.map((L, i) => <div key={L.n} className={'rstep' + (i < lv ? ' past' : '') + (i === lv ? ' now' : '') + (i > lv ? ' lock' : '')} style={{ animationDelay: `${i * 90}ms` }}><span className="re">{i > lv ? '🔒' : L.e}</span><b>{L.n}</b><small>{L.xp} XP</small>{L.hat && <em>Hat {L.hat}</em>}</div>)}</div></div>
}

function Look() {
  const [l, setL] = useState<Look>(LOOK_DEFAULT)
  useEffect(() => { setL(readLook()) }, [])
  const up = (p: Partial<Look>) => { const n = { ...l, ...p }; setL(n); saveLook(n) }
  return <div className="look"><p className="note">Make the Study Buddy comfortable for your eyes. Saved on this device.</p>
    <label><span>🔠 Text size <b>{l.size}%</b></span><input type="range" min={80} max={160} step={10} value={l.size} onChange={e => up({ size: +e.target.value })} /></label>
    <label className="tg"><input type="checkbox" checked={l.dys} onChange={e => up({ dys: e.target.checked })} /><span>📖 Easy-read spacing <small>wider letters, words and lines</small></span></label>
    <label className="tg"><input type="checkbox" checked={l.hc} onChange={e => up({ hc: e.target.checked })} /><span>◐ High contrast <small>stronger borders and text</small></span></label>
    <label className="tg"><input type="checkbox" checked={l.calm} onChange={e => up({ calm: e.target.checked })} /><span>🕊️ Calm mode <small>turns off most animations</small></span></label>
    <label><span>🎨 Your own colour</span><div className="row" style={{ justifyContent: 'flex-start' }}><input type="color" value={l.color || '#f2c500'} onChange={e => up({ color: e.target.value })} aria-label="Custom colour" /><button className="btn ghost" onClick={() => up({ color: '' })}>Use theme colour</button></div></label>
    <button className="btn ghost" onClick={() => { setL(LOOK_DEFAULT); saveLook(LOOK_DEFAULT) }}>Reset all</button></div>
}

const EMO = ['🎉', '⭐', '❤️', '🦉', '🔥', '🌈', '🏆', '🥳']
function Cannon() {
  const [e, setE] = useState('🎉')
  return <div className="center"><p className="note">Choose a celebration and fire!</p><div className="seg wrapseg">{EMO.map(x => <button key={x} aria-pressed={e === x} onClick={() => setE(x)}>{x}</button>)}</div>
    <div className="row"><button className="btn" onClick={() => { confetti(1.6); sfx('win') }}>🎊 Confetti</button><button className="btn" onClick={() => { celebrate('emoji', e); sfx('good') }}>{e} Emoji rain</button><button className="btn" onClick={() => { celebrate('fireworks'); sfx('level') }}>🎆 Fireworks</button><button className="btn" onClick={() => { celebrate('stars', e); sfx('good') }}>✨ Stars</button></div></div>
}

export default function Classroom({ api, tool }: { api: Api; tool: string }) {
  return <>{tool === 'sm' && <Mixer />}{tool === 'sw' && <Stopwatch />}{tool === 'pk' && <Picker />}{tool === 'gp' && <Groups />}{tool === 'bt' && <BigTimer />}{tool === 'lc' && <Chest api={api} />}{tool === 'rm' && <Roadmap api={api} />}{tool === 'lk' && <Look />}{tool === 'cc' && <Cannon />}</>
}
export { applyLook, readLook }
