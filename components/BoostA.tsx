'use client'
import { useEffect, useRef, useState } from 'react'
import { sfx, confetti } from '@/lib/fx'
import { ELEMENTS } from '@/lib/more'
import type { Api } from './api'

const num = (s: string) => { const x = parseFloat(s); return isFinite(x) ? x : NaN }
const f = (x: number) => (isFinite(x) ? String(+x.toPrecision(8)) : '–')
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

/* 1. Times tables trainer */
export function Tables({ api }: { api: Api }) {
  const [tb, setTb] = useState(7); const [qs, setQs] = useState<[number, number][]>([]); const [i, setI] = useState(0); const [v, setV] = useState(''); const [ok, setOk] = useState(0); const [flash, setFlash] = useState('')
  const inp = useRef<HTMLInputElement>(null)
  function start() { const l: [number, number][] = []; for (let k = 0; k < 10; k++) l.push([tb === 0 ? rnd(2, 12) : tb, rnd(1, 12)]); setQs(l); setI(0); setOk(0); setV(''); sfx('pop'); setTimeout(() => inp.current?.focus(), 60) }
  function submit(e: React.FormEvent) {
    e.preventDefault(); if (!qs.length || i >= qs.length) return; const right = num(v) === qs[i][0] * qs[i][1]
    setFlash(right ? 'ok' : 'bad'); setTimeout(() => setFlash(''), 250); sfx(right ? 'good' : 'bad'); const n = ok + (right ? 1 : 0); setOk(n); setV('')
    if (i + 1 >= qs.length) { setI(i + 1); api.award({ k: 'bonus', xp: n }); if (n === 10) confetti(1.2); sfx('win') } else setI(i + 1)
  }
  return <div className="center"><div className="seg wrapseg">{[0, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12].map(n => <button key={n} aria-pressed={tb === n} onClick={() => setTb(n)}>{n === 0 ? 'Mixed' : `×${n}`}</button>)}</div>
    {!qs.length || i >= qs.length ? <div className="center">{qs.length > 0 && <><div className="big-score">{ok}/10</div><p>{ok === 10 ? 'Perfect! 🏆' : 'Good practice!'}</p></>}<button className="btn" onClick={start}>{qs.length ? 'Go again' : 'Start 10 questions'}</button></div>
      : <form onSubmit={submit} className={'center sprint ' + flash}><div className="note">Question {i + 1} of 10</div><div className="bigq">{qs[i][0]} × {qs[i][1]} = ?</div><input ref={inp} className="type-i" inputMode="numeric" value={v} onChange={e => setV(e.target.value)} aria-label="Answer" /><button className="btn">Check</button></form>}</div>
}

/* 2. Mental maths blitz */
export function Mental({ api }: { api: Api }) {
  const [ph, setPh] = useState<'idle' | 'play' | 'done'>('idle'); const [t, setT] = useState(45); const [q, setQ] = useState<{ s: string; a: number }>({ s: '', a: 0 }); const [v, setV] = useState(''); const [n, setN] = useState(0); const inp = useRef<HTMLInputElement>(null)
  const make = () => { const k = rnd(0, 2); if (k === 0) { const a = rnd(10, 99), b = rnd(10, 99); return { s: `${a} + ${b}`, a: a + b } } if (k === 1) { const a = rnd(30, 99), b = rnd(10, a); return { s: `${a} − ${b}`, a: a - b } } const a = rnd(3, 12), b = rnd(3, 12); return { s: `${a} × ${b}`, a: a * b } }
  function start() { setQ(make()); setN(0); setV(''); setT(45); setPh('play'); sfx('pop'); setTimeout(() => inp.current?.focus(), 60) }
  useEffect(() => {
    if (ph !== 'play') return
    if (t <= 0) { setPh('done'); api.award({ k: 'bonus', xp: Math.min(20, 3 + n * 2) }); sfx('win'); if (n >= 12) confetti(1); return }
    const id = setTimeout(() => setT(x => x - 1), 1000)
    return () => clearTimeout(id)
  }, [t, ph]) // eslint-disable-line
  function type(s: string) { setV(s); if (num(s) === q.a) { setN(x => x + 1); setV(''); setQ(make()); sfx('good') } }
  if (ph === 'idle') return <div className="center"><p className="note">Answer as many sums as you can in 45 seconds. It checks automatically as you type.</p><button className="btn" onClick={start}>Start</button></div>
  if (ph === 'done') return <div className="center"><div className="big-score">{n}</div><p>sums solved</p><button className="btn" onClick={start}>Again</button></div>
  return <div className="center"><div className={'timer-c' + (t <= 5 ? ' low' : '')}>{t}</div><div className="bigq">{q.s} = ?</div><input ref={inp} className="type-i" inputMode="numeric" value={v} onChange={e => type(e.target.value)} aria-label="Answer" /><p className="note">{n} solved</p></div>
}

/* 3. Quadratic solver */
export function Quadratic() {
  const [a, setA] = useState('1'); const [b, setB] = useState('-5'); const [c, setC] = useState('6')
  const A = num(a), B = num(b), C = num(c); const D = B * B - 4 * A * C
  let body: React.ReactNode = <p className="note">Enter numbers for a, b and c.</p>
  if (isFinite(A) && isFinite(B) && isFinite(C)) {
    if (A === 0) body = <div className="steps"><p>a = 0, so this is a straight line: {f(B)}x + {f(C)} = 0</p><p>x = {B === 0 ? '–' : f(-C / B)}</p></div>
    else body = <div className="steps"><p>Discriminant: b² − 4ac = {f(B)}² − 4×{f(A)}×{f(C)} = <b>{f(D)}</b></p>
      {D > 0 && <p>Two real roots: x = (−b ± √D) ÷ 2a<br /><b>x₁ = {f((-B + Math.sqrt(D)) / (2 * A))}</b> and <b>x₂ = {f((-B - Math.sqrt(D)) / (2 * A))}</b></p>}
      {D === 0 && <p>One repeated root: <b>x = {f(-B / (2 * A))}</b></p>}
      {D < 0 && <p>No real roots (D is negative).</p>}
      <p>Turning point: ({f(-B / (2 * A))}, {f(C - (B * B) / (4 * A))}) · y-intercept: {f(C)}</p></div>
  }
  return <div><p className="note">Solve ax² + bx + c = 0 with working shown.</p><div className="conv"><input value={a} onChange={e => setA(e.target.value)} inputMode="decimal" aria-label="a" /><span>x² +</span><input value={b} onChange={e => setB(e.target.value)} inputMode="decimal" aria-label="b" /><span>x +</span><input value={c} onChange={e => setC(e.target.value)} inputMode="decimal" aria-label="c" /><span>= 0</span></div>{body}</div>
}

/* 4. Statistics */
export function Stats() {
  const [t, setT] = useState('4, 8, 15, 16, 23, 42, 8')
  const xs = t.split(/[\s,;]+/).map(num).filter(isFinite); const n = xs.length; const s = [...xs].sort((p, q) => p - q)
  const sum = xs.reduce((p, q) => p + q, 0), mean = sum / n, med = n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN
  const cnt = new Map<number, number>(); xs.forEach(x => cnt.set(x, (cnt.get(x) || 0) + 1)); const mx = Math.max(0, ...cnt.values()); const modes = mx > 1 ? [...cnt].filter(e => e[1] === mx).map(e => e[0]) : []
  const sd = n ? Math.sqrt(xs.reduce((p, q) => p + (q - mean) ** 2, 0) / n) : NaN
  const rows: [string, string][] = [['Count', String(n)], ['Sum', f(sum)], ['Mean', f(mean)], ['Median', f(med)], ['Mode', modes.length ? modes.map(f).join(', ') : 'none'], ['Range', n ? f(s[n - 1] - s[0]) : '–'], ['Smallest', n ? f(s[0]) : '–'], ['Largest', n ? f(s[n - 1]) : '–'], ['Std deviation', f(sd)]]
  return <div><p className="note">Type numbers separated by commas or spaces.</p><textarea className="essay" rows={2} value={t} onChange={e => setT(e.target.value)} aria-label="Numbers" />
    <div className="bests" style={{ marginTop: 12 }}>{rows.map(([l, v]) => <div key={l} className="best"><small>{l}</small><b style={{ fontSize: 24 }}>{v}</b></div>)}</div></div>
}

/* 5. Pythagoras */
export function Pythag() {
  const [mode, setMode] = useState<'h' | 's'>('h'); const [a, setA] = useState('3'); const [b, setB] = useState('4')
  const A = num(a), B = num(b); const r = mode === 'h' ? Math.sqrt(A * A + B * B) : Math.sqrt(B * B - A * A)
  return <div><div className="seg"><button aria-pressed={mode === 'h'} onClick={() => setMode('h')}>Find hypotenuse</button><button aria-pressed={mode === 's'} onClick={() => setMode('s')}>Find a shorter side</button></div>
    <div className="conv"><input value={a} onChange={e => setA(e.target.value)} inputMode="decimal" aria-label="Side a" /><span>{mode === 'h' ? 'and' : 'and hypotenuse'}</span><input value={b} onChange={e => setB(e.target.value)} inputMode="decimal" aria-label="Side b" /></div>
    <div className="tri"><svg viewBox="0 0 160 110" aria-hidden><polygon points="10,100 150,100 10,10" className="tri-p" /><rect x="10" y="88" width="12" height="12" className="tri-r" /></svg></div>
    <div className="steps">{isFinite(r) ? <><p>{mode === 'h' ? `c² = a² + b² = ${f(A * A)} + ${f(B * B)} = ${f(A * A + B * B)}` : `a² = c² − b² = ${f(B * B)} − ${f(A * A)} = ${f(B * B - A * A)}`}</p><p>{mode === 'h' ? 'Hypotenuse' : 'Missing side'} = <b>{f(r)}</b></p></> : <p className="note">The hypotenuse must be the longest side.</p>}</div></div>
}

/* 6. Fraction, decimal, percent */
export function Fractions() {
  const [t, setT] = useState('3/8')
  let d = NaN; const s = t.trim()
  if (s.includes('/')) { const [p, q] = s.split('/').map(num); d = q ? p / q : NaN } else if (s.endsWith('%')) d = num(s.slice(0, -1)) / 100; else d = num(s)
  let fr = '–'; if (isFinite(d)) { let den = 1; while (den < 1e6 && Math.abs(Math.round(d * den) - d * den) > 1e-9) den *= 10; const nu = Math.round(d * den), g = gcd(nu, den) || 1; fr = `${nu / g}/${den / g}` }
  return <div><p className="note">Type a fraction (3/8), a decimal (0.375) or a percent (37.5%).</p><input className="grow" style={{ width: '100%' }} value={t} onChange={e => setT(e.target.value)} aria-label="Value" />
    <div className="bests" style={{ marginTop: 12 }}><div className="best"><small>Fraction</small><b>{fr}</b></div><div className="best"><small>Decimal</small><b>{f(d)}</b></div><div className="best"><small>Percent</small><b>{isFinite(d) ? f(d * 100) + '%' : '–'}</b></div></div></div>
}

/* 7. Ohm's law and power */
export function Ohm() {
  const [v, setV] = useState('12'); const [i, setI] = useState('2'); const [r, setR] = useState(''); const [p, setP] = useState('')
  const V = num(v), I = num(i), R = num(r), P = num(p); const have = [V, I, R, P].map(isFinite)
  let o: number[] | null = null
  if (have[0] && have[1]) o = [V, I, V / I, V * I]; else if (have[0] && have[2]) o = [V, V / R, R, (V * V) / R]; else if (have[1] && have[2]) o = [I * R, I, R, I * I * R]
  else if (have[0] && have[3]) o = [V, P / V, (V * V) / P, P]; else if (have[1] && have[3]) o = [P / I, I, P / (I * I), P]
  return <div><p className="note">Fill in any two boxes. The rest are worked out for you.</p>
    <div className="conv"><label>Volts<input value={v} onChange={e => setV(e.target.value)} inputMode="decimal" /></label><label>Amps<input value={i} onChange={e => setI(e.target.value)} inputMode="decimal" /></label><label>Ohms<input value={r} onChange={e => setR(e.target.value)} inputMode="decimal" /></label><label>Watts<input value={p} onChange={e => setP(e.target.value)} inputMode="decimal" /></label></div>
    {o ? <div className="bests"><div className="best"><small>V = I × R</small><b>{f(o[0])} V</b></div><div className="best"><small>Current</small><b>{f(o[1])} A</b></div><div className="best"><small>Resistance</small><b>{f(o[2])} Ω</b></div><div className="best"><small>P = V × I</small><b>{f(o[3])} W</b></div></div> : <p className="note">Waiting for two values…</p>}</div>
}

/* 8. Molar mass calculator */
function parseFormula(s: string): Map<string, number> | null {
  let i = 0
  const readNum = () => { let k = ''; while (i < s.length && /\d/.test(s[i])) k += s[i++]; return k ? parseInt(k, 10) : 1 }
  function group(): Map<string, number> | null {
    const m = new Map<string, number>()
    while (i < s.length && s[i] !== ')') {
      if (s[i] === '(') { i++; const g = group(); if (!g || s[i] !== ')') return null; i++; const k = readNum(); g.forEach((v, e) => m.set(e, (m.get(e) || 0) + v * k)) }
      else if (/[A-Z]/.test(s[i])) { let e = s[i++]; if (i < s.length && /[a-z]/.test(s[i])) e += s[i++]; if (!ELEMENTS.some(x => x[1] === e)) return null; const k = readNum(); m.set(e, (m.get(e) || 0) + k) }
      else return null
    }
    return m
  }
  const g = group(); return g && i === s.length && g.size ? g : null
}
export function Molar() {
  const [t, setT] = useState('Ca(OH)2'); const m = parseFormula(t.replace(/\s/g, ''))
  const rows = m ? [...m].map(([e, k]) => { const el = ELEMENTS.find(x => x[1] === e)!; return { e, k, ar: el[3], name: el[2] } }) : []
  const mr = rows.reduce((p, r) => p + r.ar * r.k, 0)
  return <div><p className="note">Works out Mr from a formula such as H2O, CO2, Ca(OH)2 or C6H12O6. Uses the first 36 elements.</p><input className="grow" style={{ width: '100%' }} value={t} onChange={e => setT(e.target.value)} aria-label="Formula" />
    {m ? <div className="steps" style={{ marginTop: 12 }}>{rows.map(r => <p key={r.e}>{r.e} ({r.name}): {r.k} × {f(r.ar)} = {f(r.k * r.ar)}</p>)}<p>Mr = <b>{f(mr)}</b></p></div> : <p className="note" style={{ marginTop: 12 }}>Check the formula. Use capital letters for elements, for example NaCl.</p>}</div>
}

/* 9. Binary, hex, decimal */
export function Bases() {
  const [base, setBase] = useState(10); const [v, setV] = useState('202')
  const ok = new RegExp('^[' + '0123456789abcdef'.slice(0, base) + ']+$', 'i').test(v.trim()); const n = ok ? parseInt(v.trim(), base) : NaN
  return <div><div className="seg">{([[2, 'Binary'], [8, 'Octal'], [10, 'Decimal'], [16, 'Hex']] as const).map(([b, l]) => <button key={b} aria-pressed={base === b} onClick={() => setBase(b)}>{l}</button>)}</div>
    <input className="grow" style={{ width: '100%', marginTop: 10 }} value={v} onChange={e => setV(e.target.value)} aria-label="Number" />
    {isFinite(n) ? <div className="bests" style={{ marginTop: 12 }}><div className="best"><small>Binary</small><b style={{ fontSize: 22 }}>{n.toString(2)}</b></div><div className="best"><small>Octal</small><b>{n.toString(8)}</b></div><div className="best"><small>Decimal</small><b>{n}</b></div><div className="best"><small>Hex</small><b>{n.toString(16).toUpperCase()}</b></div></div> : <p className="note" style={{ marginTop: 12 }}>That is not a valid base {base} number.</p>}</div>
}

/* 10. Caesar cipher */
export function Caesar() {
  const [t, setT] = useState('Wise Owls Study Hard'); const [k, setK] = useState(3)
  const shift = (s: string, n: number) => s.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - b + n + 26 * 10) % 26) + b) })
  return <div><p className="note">A secret-code classic. Shift every letter along the alphabet.</p><textarea className="essay" rows={2} value={t} onChange={e => setT(e.target.value)} aria-label="Message" />
    <div className="conv"><span>Shift: <b>{k}</b></span><input type="range" min={1} max={25} value={k} onChange={e => setK(+e.target.value)} aria-label="Shift" /></div>
    <div className="conv-out" style={{ fontSize: 22 }}>{shift(t, k)}</div><p className="note">To decode, paste it above and move the slider to {26 - k}.</p></div>
}
