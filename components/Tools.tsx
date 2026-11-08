'use client'
import { useEffect, useState } from 'react'
import { ai, store } from '@/lib/api'
import { sfx } from '@/lib/fx'
import { FORMULAS } from '@/lib/data'
import Blitz from './Blitz'
import type { Api } from './api'

type Sheet = { title: string; sections: { h: string; points: string[] }[] }
type MapD = { center: string; branches: { name: string; leaves: string[] }[] }
const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); return true } catch { return false } }

function SheetTool({ api }: { api: Api }) {
  const [d, setD] = useState<Sheet | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState(false)
  async function make() { setBusy(true); setErr(''); try { setD((await ai({ mode: 'sheet', subject: api.subj, topic: api.topic })).data); sfx('win') } catch (e: any) { setErr(e.message) } setBusy(false) }
  const text = d ? `${d.title}\n\n${d.sections.map(s => `${s.h}\n${s.points.map(p => '• ' + p).join('\n')}`).join('\n\n')}` : ''
  return <div><div className="row" style={{ justifyContent: 'flex-start', marginBottom: 14 }}><button className="btn" onClick={make} disabled={busy}>{d ? 'New cheat sheet' : 'Make a cheat sheet'}</button>
    {d && <button className="btn ghost" onClick={async () => { setOk(await copy(text)); setTimeout(() => setOk(false), 1800) }}>{ok ? 'Copied ✓' : 'Copy text'}</button>}<span className="note">One page of the key points for your subject and topic.</span></div>
    {busy && <div className="busy">Writing your cheat sheet…</div>}{err && <div className="notice">{err}</div>}
    {d && !busy && <div className="sheet"><h3>{d.title}</h3><div className="sheet-g">{d.sections.map((s, i) => <div key={i} className="sheet-s tilt" style={{ animationDelay: `${i * 90}ms` }}><b>{s.h}</b><ul>{s.points.map((p, j) => <li key={j}>{p}</li>)}</ul></div>)}</div></div>}</div>
}

function MapTool({ api }: { api: Api }) {
  const [d, setD] = useState<MapD | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [open, setOpen] = useState<number | null>(null)
  async function make() { setBusy(true); setErr(''); setOpen(null); try { setD((await ai({ mode: 'map', subject: api.subj, topic: api.topic })).data); sfx('win') } catch (e: any) { setErr(e.message) } setBusy(false) }
  return <div><div className="row" style={{ justifyContent: 'flex-start', marginBottom: 14 }}><button className="btn" onClick={make} disabled={busy}>{d ? 'New mind map' : 'Make a mind map'}</button><span className="note">Tap a branch to open it.</span></div>
    {busy && <div className="busy">Drawing your mind map…</div>}{err && <div className="notice">{err}</div>}
    {d && !busy && <div className="mm"><div className="mm-c">{d.center}</div><div className="mm-b">{d.branches.map((b, i) => <div key={i} className={'mm-n' + (open === i ? ' open' : '')} style={{ animationDelay: `${i * 110}ms` }}>
      <button onClick={() => { setOpen(open === i ? null : i); sfx('pop') }}>{b.name}<span>{open === i ? '−' : '+'}</span></button>{open === i && <ul>{b.leaves.map((l, j) => <li key={j} style={{ animationDelay: `${j * 70}ms` }}>{l}</li>)}</ul>}</div>)}</div></div>}</div>
}

function Notes({ subj }: { subj: string }) {
  const [t, setT] = useState(''); const [saved, setSaved] = useState(true)
  useEffect(() => { setT(store.get('notes:' + subj, '')); setSaved(true) }, [subj])
  useEffect(() => { if (saved) return; const id = setTimeout(() => { store.set('notes:' + subj, t); setSaved(true) }, 500); return () => clearTimeout(id) }, [t, saved, subj])
  return <div><textarea className="answer" rows={10} value={t} onChange={e => { setT(e.target.value); setSaved(false) }} placeholder={`Your ${subj} notes. They save automatically on this device.`} aria-label="Notes" />
    <p className="note">{saved ? 'Saved ✓' : 'Saving…'} · {t.trim() ? t.trim().split(/\s+/).length : 0} words</p></div>
}

// A small safe calculator: no eval, just a tiny parser.
function calc(src: string, deg: boolean): number {
  const toks = src.replace(/π/g, 'pi').match(/\d+\.?\d*|\.\d+|[a-z]+|[+\-*/^()]/gi) ?? []; let i = 0
  const peek = () => toks[i], eat = () => toks[i++]
  const fn = (n: string, x: number) => { const r = deg ? (x * Math.PI) / 180 : x; if (n === 'sin') return Math.sin(r); if (n === 'cos') return Math.cos(r); if (n === 'tan') return Math.tan(r); if (n === 'sqrt') return Math.sqrt(x); if (n === 'log') return Math.log10(x); if (n === 'ln') return Math.log(x); throw new Error('fn') }
  function prim(): number {
    const t = eat(); if (t === undefined) throw new Error('end')
    if (t === '(') { const v = expr(); if (eat() !== ')') throw new Error(')'); return v }
    if (t === '-') return -pow(); if (t === '+') return pow()
    if (/^\d|^\./.test(t)) return parseFloat(t)
    if (t.toLowerCase() === 'pi') return Math.PI; if (t.toLowerCase() === 'e') return Math.E
    if (eat() !== '(') throw new Error('('); const v = expr(); if (eat() !== ')') throw new Error(')'); return fn(t.toLowerCase(), v)
  }
  function pow(): number { const b = prim(); if (peek() === '^') { eat(); return Math.pow(b, pow()) } return b }
  function term(): number { let v = pow(); while (peek() === '*' || peek() === '/') { const o = eat(); const r = pow(); v = o === '*' ? v * r : v / r } return v }
  function expr(): number { let v = term(); while (peek() === '+' || peek() === '-') { const o = eat(); const r = term(); v = o === '+' ? v + r : v - r } return v }
  const out = expr(); if (i < toks.length) throw new Error('extra'); return out
}
function Calc() {
  const [s, setS] = useState(''); const [deg, setDeg] = useState(true); const [r, setR] = useState('')
  const add = (t: string) => { setS(v => v + t); setR(''); sfx('pop') }
  const eq = () => { try { const v = calc(s, deg); setR(Number.isFinite(v) ? String(parseFloat(v.toPrecision(12))) : 'Error'); sfx('good') } catch { setR('Error'); sfx('bad') } }
  const keys = ['7', '8', '9', '/', 'sin(', '4', '5', '6', '*', 'cos(', '1', '2', '3', '-', 'tan(', '0', '.', '^', '+', 'sqrt(', '(', ')', 'π', 'ln(', 'log(']
  return <div className="calc"><div className="calc-d"><small>{s || '0'}</small><b>{r || ' '}</b></div>
    <div className="calc-k">{keys.map(k => <button key={k} onClick={() => add(k)}>{k.replace('*', '×').replace('/', '÷')}</button>)}
      <button className="alt" onClick={() => { setS(''); setR('') }}>AC</button><button className="alt" onClick={() => { setS(v => v.replace(/(sin\(|cos\(|tan\(|sqrt\(|log\(|ln\(|.)$/, '')); setR('') }}>⌫</button>
      <button className="alt" onClick={() => setDeg(!deg)}>{deg ? 'DEG' : 'RAD'}</button><button className="eq" onClick={eq}>=</button></div></div>
}

function Formulas({ subj }: { subj: string }) {
  const list = FORMULAS[subj]; const [f, setF] = useState('')
  if (!list) return <p className="note">The built-in formula sheet covers Mathematics, Physics and Chemistry. Pick one of those subjects above, or use the AI cheat sheet for the others.</p>
  return <div><input className="plain" style={{ width: '100%', marginBottom: 12 }} value={f} onChange={e => setF(e.target.value)} placeholder="Search formulas…" aria-label="Search formulas" />
    <div className="fgrid">{list.filter(x => (x.n + x.f).toLowerCase().includes(f.toLowerCase())).map((x, i) => <div key={x.n} className="fcard tilt" style={{ animationDelay: `${i * 40}ms` }}><small>{x.n}</small><b>{x.f}</b></div>)}</div></div>
}

const PILLS = [['sheet', '📄 Cheat sheet'], ['map', '🗺 Mind map'], ['notes', '📝 Notes'], ['calc', '🧮 Calculator'], ['formulas', '📐 Formulas'], ['blitz', '⚡ Formula Blitz']] as const
export default function Tools({ api }: { api: Api }) {
  const [t, setT] = useState<typeof PILLS[number][0]>('sheet')
  return <section><div className="seg wrap-seg" role="tablist">{PILLS.map(([k, l]) => <button key={k} aria-pressed={t === k} onClick={() => { setT(k); sfx('pop') }}>{l}</button>)}</div>
    <div className="subpanel" key={t}>{t === 'sheet' && <SheetTool api={api} />}{t === 'map' && <MapTool api={api} />}{t === 'notes' && <Notes subj={api.subj} />}{t === 'calc' && <Calc />}{t === 'formulas' && <Formulas subj={api.subj} />}{t === 'blitz' && <Blitz api={api} />}</div></section>
}
