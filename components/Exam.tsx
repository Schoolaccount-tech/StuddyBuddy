'use client'
import { useState } from 'react'
import { ai } from '@/lib/api'
import { recordTopic, addMistake } from '@/lib/learn'
import { sfx, confetti } from '@/lib/fx'
import { tokens, spendToken } from '@/lib/powers'
import type { Api } from './api'

type EQ = { question: string; marks: number; scheme: string[]; hint: string }
type Res = { awarded: number; marks: number; feedback: string }

export default function Exam({ api }: { api: Api }) {
  const [q, setQ] = useState<EQ | null>(null); const [ans, setAns] = useState(''); const [res, setRes] = useState<Res | null>(null)
  const [eagle, setEagle] = useState<null | { text: string; why: string }[]>(null); const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const [hint, setHint] = useState(false)
  async function make() {
    setBusy('q'); setErr(''); setRes(null); setEagle(null); setAns(''); setHint(false)
    try { const j = await ai({ mode: 'exam', subject: api.subj, topic: api.topic, seed: Date.now() }); setQ(j.data); sfx('pop') } catch (e: any) { setErr(e.message) }
    setBusy('')
  }
  async function mark() {
    if (!q || !ans.trim()) return; setBusy('m'); setErr('')
    try {
      const j = await ai({ mode: 'mark', subject: api.subj, question: q.question, scheme: q.scheme, marks: q.marks, answer: ans }); const r: Res = j.data; setRes(r)
      api.award({ k: 'exam', awarded: r.awarded, marks: r.marks }); { const tp = (q as any).topic || api.topic || 'General'; recordTopic(api.subj, tp, r.awarded, r.marks); if (r.awarded < r.marks) addMistake({ subj: api.subj, topic: tp, type: 'Not enough detail', note: r.feedback, src: 'exam', q: q.question, a: ans.slice(0, 300) }) } sfx(r.awarded / r.marks >= 0.6 ? 'win' : 'pop'); if (r.awarded / r.marks >= 0.7) confetti(r.awarded === r.marks ? 1.6 : 1)
    } catch (e: any) { setErr(e.message) }
    setBusy('')
  }
  async function eyes() {
    if (!q || busy || !spendToken('eagle')) return; setBusy('e')
    try { const j = await ai({ mode: 'eagle', subject: api.subj, question: q.question, scheme: q.scheme, answer: ans }); setEagle(j.data.marks); sfx('good') } catch (e: any) { setErr(e.message) }
    setBusy('')
  }
  const segs = (() => { if (!eagle) return null; const hits = eagle.map(m => ({ m, i: ans.indexOf(m.text) })).filter(h => h.i >= 0).sort((a, b) => a.i - b.i); const out: { t: string; why?: string }[] = []; let at = 0
    for (const h of hits) { if (h.i < at) continue; if (h.i > at) out.push({ t: ans.slice(at, h.i) }); out.push({ t: h.m.text, why: h.m.why }); at = h.i + h.m.text.length } if (at < ans.length) out.push({ t: ans.slice(at) }); return out })()
  const pct = res ? res.awarded / res.marks : 0
  return <section>
    <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 16 }}><button className="btn" onClick={make} disabled={!!busy}>{q ? 'New exam question' : 'Give me an exam question'}</button><span className="note">Write your answer, then the AI marks it against the mark scheme.</span></div>
    {busy === 'q' && <div className="busy">Writing your question…</div>}{err && <div className="notice">{err}</div>}
    {q && busy !== 'q' && <div className="q glow" key={q.question}>
      <div className="qhead"><span className="marks">{q.marks} mark{q.marks === 1 ? '' : 's'}</span><button className="linkish" onClick={() => setHint(!hint)}>{hint ? 'Hide hint' : '💡 Hint'}</button></div>
      <h3>{q.question}</h3>{hint && <div className="why">Hint: {q.hint}</div>}
      <textarea className="answer" rows={5} value={ans} onChange={e => setAns(e.target.value)} placeholder="Write your answer here…" disabled={!!res} aria-label="Your answer" />
      {!res && <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}><button className="btn" onClick={mark} disabled={!!busy || !ans.trim()}>{busy === 'm' ? 'Marking…' : 'Mark my answer'}</button></div>}
      {res && <div className="marked">
        <div className="mring"><svg viewBox="0 0 120 120"><circle className="bgc" cx="60" cy="60" r="52" /><circle className="fg" cx="60" cy="60" r="52" strokeDasharray="326.7" strokeDashoffset={326.7 * (1 - pct)} /></svg><b>{res.awarded}/{res.marks}</b></div>
        <div><p style={{ margin: '0 0 8px' }}>{res.feedback}</p><div className="note">Mark scheme</div>
          <ul className="scheme">{q.scheme.map((s, k) => <li key={k} style={{ animationDelay: `${k * 90}ms` }}>{s}</li>)}</ul>
          {!eagle && tokens('eagle') > 0 && <button className="btn ghost" onClick={eyes} disabled={!!busy}>{busy === 'e' ? '🦅 Looking…' : '🦅 Eagle Eyes: highlight my mistakes'}</button>}
          {segs && <div className="eagle"><div className="note">🦅 Eagle Eyes</div><p>{segs.map((s, k) => s.why ? <mark key={k} title={s.why}>{s.t}</mark> : <span key={k}>{s.t}</span>)}</p>{eagle && eagle.length === 0 ? <p className="note">No clear mistakes found. Nice answer!</p> : <ul>{eagle!.map((m, k) => <li key={k}><mark>{m.text}</mark> {m.why}</li>)}</ul>}</div>}</div></div>}
    </div>}
  </section>
}
