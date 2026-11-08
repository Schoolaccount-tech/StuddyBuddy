'use client'
import { useEffect, useRef, useState } from 'react'
import { ai } from '@/lib/api'
import { sfx, shareCard } from '@/lib/fx'
import type { Miss } from '@/lib/progress'
import type { Api } from './api'

type Q = { q: string; options: string[]; answer: number; explain: string }
const DIFF = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard'], ['exam', 'Exam level']] as const
const SECS = 20

export default function Quiz({ api, onFinish, onCombo, level }: { api: Api; onFinish: (r: number, t: number, c: number) => void; onCombo: (n: number) => void; level: string }) {
  const [phase, setPhase] = useState<'setup' | 'play' | 'done'>('setup'); const [qs, setQs] = useState<Q[]>([]); const [i, setI] = useState(0); const [sel, setSel] = useState<number | null>(null)
  const [diff, setDiff] = useState('medium'); const [count, setCount] = useState(5); const [timed, setTimed] = useState(false); const [left, setLeft] = useState(SECS)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [combo, setCombo] = useState(0); const [right, setRight] = useState(0); const best = useRef(0); const retake = useRef(false)
  const [wrongs, setWrongs] = useState<Q[]>([])

  async function start() {
    setBusy(true); setErr('')
    try { const j = await ai({ mode: 'quiz', subject: api.subj, topic: api.topic, difficulty: diff, count }); begin(j.data, false) } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  function begin(list: Q[], isRetake: boolean) { retake.current = isRetake; setQs(list); setI(0); setSel(null); setRight(0); setCombo(0); best.current = 0; setWrongs([]); setLeft(SECS); setPhase('play'); sfx('pop') }
  const redo = () => { const m = api.p.miss.slice(0, 5); if (m.length) begin(m.map(x => ({ q: x.q, options: x.options, answer: x.answer, explain: x.explain })), true) }

  const q = qs[i]
  function pick(j: number) {
    if (!q || sel !== null) return
    const ok = j === q.answer; const nc = ok ? combo + 1 : 0
    setSel(j); setCombo(nc); best.current = Math.max(best.current, nc); sfx(ok ? 'good' : 'bad')
    if (ok) { setRight(r => r + 1); onCombo(nc); if (retake.current) api.patch(p => ({ ...p, miss: p.miss.filter(m => m.q !== q.q) })) }
    else { setWrongs(w => [...w, q]); const m: Miss = { ...q, subj: api.subj }; api.patch(p => ({ ...p, miss: [m, ...p.miss.filter(x => x.q !== q.q)].slice(0, 40) })) }
  }
  useEffect(() => { setLeft(SECS) }, [i])
  useEffect(() => {
    if (phase !== 'play' || !timed || sel !== null) return
    if (left <= 0) { pick(-1); return }
    const id = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(id)
  }, [left, phase, timed, sel]) // eslint-disable-line
  function next() { if (i + 1 >= qs.length) { setPhase('done'); onFinish(right, qs.length, best.current) } else { setI(i + 1); setSel(null); sfx('pop') } }

  if (phase === 'setup') return <section>
    <div className="setup">
      <div><span className="note">Difficulty</span><div className="seg">{DIFF.map(([k, l]) => <button key={k} aria-pressed={diff === k} onClick={() => setDiff(k)}>{l}</button>)}</div></div>
      <div><span className="note">Questions</span><div className="seg">{[5, 10].map(n => <button key={n} aria-pressed={count === n} onClick={() => setCount(n)}>{n}</button>)}</div></div>
      <label className="switch"><input type="checkbox" checked={timed} onChange={e => setTimed(e.target.checked)} /><span /> Timed mode ({SECS}s per question)</label>
    </div>
    <div className="row" style={{ justifyContent: 'flex-start', margin: '16px 0' }}>
      <button className="btn" onClick={start} disabled={busy}>{busy ? 'Writing questions…' : 'Start quiz'}</button>
      {api.p.miss.length > 0 && <button className="btn ghost" onClick={redo}>🔁 Retake my mistakes ({api.p.miss.length})</button>}
    </div>
    {busy && <div className="busy">Writing your questions…</div>}{err && <div className="notice">{err}</div>}
    <p className="note">Earn 10 XP per right answer, plus a bonus for full marks. Wrong answers go into your mistake notebook.</p>
  </section>

  if (phase === 'done') return <section className="result">
    <div className="score">{right} / {qs.length} {right === qs.length ? '🏆' : right >= qs.length * .6 ? '👍' : '💪'}</div>
    <p className="note">{right >= qs.length * .6 ? 'Strong work. Try a harder level next.' : 'Check what you missed below, then retake your mistakes.'}</p>
    {wrongs.length > 0 && <div className="review">{wrongs.map((w, k) => <div key={k} className="q"><h3>{w.q}</h3><div className="why"><b>Answer:</b> {w.options[w.answer]}. {w.explain}</div></div>)}</div>}
    <div className="row"><button className="btn" onClick={() => setPhase('setup')}>New quiz</button><button className="btn ghost" onClick={() => shareCard(api.subj + (api.topic ? ': ' + api.topic : ''), `${right}/${qs.length}`, 'Quiz score', level)}>Save my score card</button></div>
  </section>

  return <section>
    <div className="qhead"><span className="note">Question {i + 1} of {qs.length}</span>{combo >= 2 && <span className="combo" key={combo}>⚡ x{combo} combo</span>}
      {timed && <span className={'qtimer' + (left <= 5 && sel === null ? ' hot' : '')}><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" className="g0" /><circle cx="18" cy="18" r="15" className="g1" strokeDasharray="94.2" strokeDashoffset={94.2 * (1 - left / SECS)} /></svg><b>{left}</b></span>}</div>
    <div className="qbar"><i style={{ width: `${(i / qs.length) * 100}%` }} /></div>
    <div className="q qslide glow tilt" key={i}><h3>{q.q}</h3>
      {q.options.map((o, j) => { const cls = sel === null ? '' : j === q.answer ? ' right' : sel === j ? ' wrong' : ''
        return <button key={j} className={'opt' + cls} disabled={sel !== null} onClick={() => pick(j)}><b>{String.fromCharCode(65 + j)}</b>{o}</button> })}
      {sel !== null && <div className="why">{sel === -1 ? '⏰ Time is up. ' : ''}{q.explain}</div>}</div>
    {sel !== null && <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={next}>{i + 1 >= qs.length ? 'See results' : 'Next question →'}</button></div>}
  </section>
}
