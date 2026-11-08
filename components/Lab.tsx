'use client'
import { useEffect, useRef, useState } from 'react'
import { store } from '@/lib/api'
import { sfx, confetti } from '@/lib/fx'
import { ELEMENTS, UNITS, GRADES, TERMS } from '@/lib/more'
import type { Api } from './api'

/* Periodic table explorer (first 36 elements) */
function Periodic() {
  const [sel, setSel] = useState(ELEMENTS[5])
  const cat = (z: number) => [2, 10, 18, 36].includes(z) ? 'ng' : [3, 11, 19].includes(z) ? 'al' : [9, 17, 35].includes(z) ? 'hl' : z >= 21 && z <= 30 ? 'tm' : [1, 6, 7, 8, 15, 16, 34].includes(z) ? 'nm' : 'mt'
  return <div><div className="pt">{ELEMENTS.map(e => <button key={e[0]} className={'el ' + cat(e[0]) + (sel[0] === e[0] ? ' on' : '')} onClick={() => { setSel(e); sfx('pop') }} aria-label={e[2]}><small>{e[0]}</small><b>{e[1]}</b></button>)}</div>
    <div className="el-d tilt"><div className={'el-big ' + cat(sel[0])}><small>{sel[0]}</small><b>{sel[1]}</b><span>{sel[3]}</span></div><div><h3>{sel[2]}</h3><p>{sel[4]}</p><p className="note">Protons: {sel[0]} · Mass number ≈ {Math.round(sel[3])} · Neutrons ≈ {Math.round(sel[3]) - sel[0]}</p></div></div>
    <div className="legend"><span className="al">Alkali</span><span className="hl">Halogen</span><span className="ng">Noble gas</span><span className="tm">Transition</span><span className="nm">Non-metal</span><span className="mt">Other metal</span></div></div>
}

/* Unit converter */
function Convert() {
  const [grp, setGrp] = useState('Length'); const [v, setV] = useState('1'); const names = Object.keys(UNITS[grp]); const [a, setA] = useState('m'); const [b, setB] = useState('cm')
  const f = UNITS[grp]; const n = parseFloat(v); const out = isFinite(n) && f[a] && f[b] ? (n * f[a]) / f[b] : NaN
  const pick = (g: string) => { setGrp(g); const k = Object.keys(UNITS[g]); setA(k[1] || k[0]); setB(k[2] || k[0]); sfx('pop') }
  return <div><div className="seg wrapseg">{Object.keys(UNITS).map(g => <button key={g} aria-pressed={grp === g} onClick={() => pick(g)}>{g}</button>)}</div>
    <div className="conv"><input value={v} inputMode="decimal" onChange={e => setV(e.target.value)} aria-label="Value" />
      <select value={a} onChange={e => setA(e.target.value)} aria-label="From">{names.map(x => <option key={x}>{x}</option>)}</select>
      <button className="btn ghost" onClick={() => { setA(b); setB(a); sfx('pop') }} aria-label="Swap">⇄</button>
      <select value={b} onChange={e => setB(e.target.value)} aria-label="To">{names.map(x => <option key={x}>{x}</option>)}</select></div>
    <div className="conv-out">{isFinite(out) ? <><b>{+out.toPrecision(8)}</b> {b}</> : 'Enter a number'}</div></div>
}

/* Grade calculator: what grade am I on and what do I need? */
function Grade() {
  const [got, setGot] = useState('64'); const [tot, setTot] = useState('100'); const [want, setWant] = useState('A')
  const pc = Math.max(0, Math.min(100, (parseFloat(got) / (parseFloat(tot) || 1)) * 100)); const g = GRADES.find(x => pc >= x[1])?.[0] || 'U'
  const target = GRADES.find(x => x[0] === want)?.[1] ?? 80; const T = parseFloat(tot) || 100; const need = Math.ceil((target / 100) * T)
  return <div><p className="note">A simple guide. Real grade boundaries change every exam series.</p>
    <div className="conv"><input value={got} inputMode="decimal" onChange={e => setGot(e.target.value)} aria-label="Marks got" /><span>out of</span><input value={tot} inputMode="decimal" onChange={e => setTot(e.target.value)} aria-label="Total marks" /></div>
    <div className="grade-o"><div className="g-ring" style={{ ['--p' as string]: `${isFinite(pc) ? pc : 0}%` }}><b>{isFinite(pc) ? Math.round(pc) : 0}%</b><small>Grade {g}</small></div>
      <div><p>Want a grade…</p><div className="seg wrapseg">{GRADES.slice(0, 5).map(x => <button key={x[0]} aria-pressed={want === x[0]} onClick={() => setWant(x[0])}>{x[0]}</button>)}</div>
        <p>You need about <b>{need}</b> out of <b>{T}</b> ({target}%). {parseFloat(got) >= need ? '✅ You are there!' : `That is ${Math.max(0, need - (parseFloat(got) || 0))} more marks.`}</p></div></div></div>
}

/* Scribble pad */
function Scribble() {
  const cv = useRef<HTMLCanvasElement>(null); const [col, setCol] = useState('#14183a'); const [w, setW] = useState(4); const down = useRef(false); const last = useRef<[number, number]>([0, 0]); const colR = useRef(col); const wR = useRef(w)
  colR.current = col; wR.current = w
  useEffect(() => {
    const c = cv.current; if (!c) return; const g = c.getContext('2d'); if (!g) return
    const r = () => { const b = c.getBoundingClientRect(); c.width = b.width * 1; c.height = 320; g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.lineCap = 'round'; g.lineJoin = 'round' }
    r()
    const pos = (e: PointerEvent): [number, number] => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top] }
    const dn = (e: PointerEvent) => { down.current = true; last.current = pos(e); c.setPointerCapture?.(e.pointerId) }
    const mv = (e: PointerEvent) => { if (!down.current) return; const p = pos(e); g.strokeStyle = colR.current; g.lineWidth = wR.current * (colR.current === '#ffffff' ? 3 : 1); g.beginPath(); g.moveTo(last.current[0], last.current[1]); g.lineTo(p[0], p[1]); g.stroke(); last.current = p }
    const up = () => { down.current = false }
    c.addEventListener('pointerdown', dn); c.addEventListener('pointermove', mv); c.addEventListener('pointerup', up); c.addEventListener('pointerleave', up)
    return () => { c.removeEventListener('pointerdown', dn); c.removeEventListener('pointermove', mv); c.removeEventListener('pointerup', up); c.removeEventListener('pointerleave', up) }
  }, [])
  const clear = () => { const c = cv.current, g = c?.getContext('2d'); if (c && g) { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); sfx('pop') } }
  const save = () => { const c = cv.current; if (!c) return; const a = document.createElement('a'); a.download = 'scribble.png'; a.href = c.toDataURL('image/png'); a.click(); sfx('good') }
  return <div><div className="row" style={{ justifyContent: 'flex-start', marginBottom: 10 }}>
    {['#14183a', '#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#9333ea'].map(c => <button key={c} className={'sw' + (col === c ? ' on' : '')} style={{ background: c }} onClick={() => setCol(c)} aria-label={'Colour ' + c} />)}
    <button className={'btn ghost' + (col === '#ffffff' ? ' on' : '')} onClick={() => setCol('#ffffff')}>🧽 Eraser</button>
    <input type="range" min={1} max={14} value={w} onChange={e => setW(+e.target.value)} aria-label="Pen size" /><button className="btn ghost" onClick={clear}>Clear</button><button className="btn" onClick={save}>Save PNG</button></div>
    <canvas ref={cv} className="scribble" aria-label="Drawing area" /></div>
}

/* Sticky notes */
type Sticky = { id: number; t: string; c: number }
function Stickies() {
  const [list, setList] = useState<Sticky[]>([]); const [v, setV] = useState(''); const [c, setC] = useState(0)
  useEffect(() => { const s = store.get<Sticky[]>('stickies', []); setList(Array.isArray(s) ? s : []) }, [])
  const put = (n: Sticky[]) => { setList(n); store.set('stickies', n) }
  return <div><form className="row" style={{ justifyContent: 'flex-start' }} onSubmit={e => { e.preventDefault(); const t = v.trim(); if (!t) return; put([{ id: Date.now(), t: t.slice(0, 140), c }, ...list].slice(0, 24)); setV(''); sfx('good') }}>
    <input className="grow" value={v} onChange={e => setV(e.target.value)} placeholder="Write a quick reminder…" aria-label="New sticky note" />
    {[0, 1, 2, 3].map(i => <button type="button" key={i} className={'sw st' + i + (c === i ? ' on' : '')} onClick={() => setC(i)} aria-label={'Note colour ' + (i + 1)} />)}<button className="btn">Stick it</button></form>
    <div className="stick-g">{list.length === 0 && <p className="note">No notes yet. Add one above.</p>}{list.map((s, i) => <div key={s.id} className={'stick st' + s.c} style={{ ['--r' as string]: `${((i * 7) % 7) - 3}deg` }}><p>{s.t}</p><button onClick={() => { put(list.filter(x => x.id !== s.id)); sfx('pop') }} aria-label="Delete note">✕</button></div>)}</div></div>
}

/* Breathing guide, 4-7-8 */
function Breathe() {
  const [on, setOn] = useState(false); const [step, setStep] = useState(0); const [cyc, setCyc] = useState(0)
  const steps: [string, number][] = [['Breathe in', 4], ['Hold', 7], ['Breathe out', 8]]
  useEffect(() => {
    if (!on) return
    const id = setTimeout(() => { if (step === 2) { setCyc(c => c + 1); setStep(0) } else setStep(s => s + 1) }, steps[step][1] * 1000)
    return () => clearTimeout(id)
  }, [on, step]) // eslint-disable-line
  return <div className="center"><p className="note">Exam nerves? Try the 4-7-8 breath. Follow the circle.</p>
    <div className={'lungs' + (on ? ' on s' + step : '')}><span>{on ? steps[step][0] : 'Ready?'}</span></div>
    <button className="btn" onClick={() => { setOn(o => !o); setStep(0); sfx('pop'); if (on && cyc >= 3) confetti(0.6) }}>{on ? 'Stop' : 'Begin'}</button><p className="note">Cycles done: {cyc}</p></div>
}

/* Essay planner with word count */
function Essay() {
  const [pts, setPts] = useState(['', '', '']); const [txt, setTxt] = useState('')
  useEffect(() => { const s = store.get<{ p: string[]; t: string }>('essay', { p: ['', '', ''], t: '' }); if (s && Array.isArray(s.p)) { setPts(s.p); setTxt(s.t || '') } }, [])
  const save = (p: string[], t: string) => { setPts(p); setTxt(t); store.set('essay', { p, t }) }
  const words = txt.trim() ? txt.trim().split(/\s+/).length : 0
  return <div><p className="note">Plan with PEEL: Point, Evidence, Explain, Link. Then write.</p>
    <div className="peel">{['Point', 'Evidence', 'Explain & Link'].map((l, i) => <label key={l}><b>{['P', 'E', 'E+L'][i]}</b><span>{l}</span><input value={pts[i]} onChange={e => save(pts.map((x, j) => (j === i ? e.target.value : x)), txt)} placeholder={['My main point is…', 'The evidence is…', 'This shows… so…'][i]} /></label>)}</div>
    <textarea className="essay" rows={7} value={txt} onChange={e => save(pts, e.target.value)} placeholder="Write your paragraph here…" aria-label="Essay" />
    <div className="note">{words} words · about {Math.max(0, Math.round(words / 2.2) / 100)} minutes of speaking · saved on this device</div></div>
}

/* Glossary search */
function Glossary({ api }: { api: Api }) {
  const [q, setQ] = useState(''); const all = Object.entries(TERMS).flatMap(([s, l]) => l.map(t => ({ s, t: t[0], d: t[1] })))
  const mine = all.filter(x => x.s === api.subj), list = (q.trim() ? all.filter(x => (x.t + x.d).toLowerCase().includes(q.trim().toLowerCase())) : mine).slice(0, 40)
  return <div><input className="grow" style={{ width: '100%', marginBottom: 12 }} value={q} onChange={e => setQ(e.target.value)} placeholder={`Search all subjects, or browse ${api.subj}…`} aria-label="Search glossary" />
    <div className="gl">{list.map((x, i) => <div key={x.s + x.t} className="gl-i tilt" style={{ animationDelay: `${i * 30}ms` }}><b>{x.t.charAt(0) + x.t.slice(1).toLowerCase()}</b><small>{x.s}</small><p>{x.d}</p></div>)}{list.length === 0 && <p className="note">No matches.</p>}</div></div>
}

const TOOLS = [['pt', '⚗️ Periodic table'], ['cv', '🔁 Converter'], ['gr', '🎓 Grade calc'], ['sc', '✏️ Scribble pad'], ['st', '📌 Sticky notes'], ['br', '🌬️ Breathe'], ['es', '📝 Essay planner'], ['gl', '📖 Glossary']] as const
export default function Lab({ api }: { api: Api }) {
  const [t, setT] = useState<typeof TOOLS[number][0]>('pt')
  return <div><div className="seg wrapseg" role="group" aria-label="Lab tools">{TOOLS.map(([k, l]) => <button key={k} aria-pressed={t === k} onClick={() => { setT(k); sfx('pop') }}>{l}</button>)}</div>
    <div className="game" key={t}>{t === 'pt' && <Periodic />}{t === 'cv' && <Convert />}{t === 'gr' && <Grade />}{t === 'sc' && <Scribble />}{t === 'st' && <Stickies />}{t === 'br' && <Breathe />}{t === 'es' && <Essay />}{t === 'gl' && <Glossary api={api} />}</div></div>
}
