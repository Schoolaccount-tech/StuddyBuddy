'use client'
import { useState } from 'react'
import { ai } from '@/lib/api'
import { sfx, confetti } from '@/lib/fx'
import type { Api } from './api'

type EQ = { question: string; marks: number; scheme: string[]; hint: string }
type Res = { awarded: number; marks: number; feedback: string }

export default function Exam({ api }: { api: Api }) {
  const [q, setQ] = useState<EQ | null>(null); const [ans, setAns] = useState(''); const [res, setRes] = useState<Res | null>(null)
  const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const [hint, setHint] = useState(false)
  async function make() {
    setBusy('q'); setErr(''); setRes(null); setAns(''); setHint(false)
    try { const j = await ai({ mode: 'exam', subject: api.subj, topic: api.topic, seed: Date.now() }); setQ(j.data); sfx('pop') } catch (e: any) { setErr(e.message) }
    setBusy('')
  }
  async function mark() {
    if (!q || !ans.trim()) return; setBusy('m'); setErr('')
    try {
      const j = await ai({ mode: 'mark', subject: api.subj, question: q.question, scheme: q.scheme, marks: q.marks, answer: ans }); const r: Res = j.data; setRes(r)
      api.award({ k: 'exam', awarded: r.awarded, marks: r.marks }); sfx(r.awarded / r.marks >= 0.6 ? 'win' : 'pop'); if (r.awarded / r.marks >= 0.7) confetti(r.awarded === r.marks ? 1.6 : 1)
    } catch (e: any) { setErr(e.message) }
    setBusy('')
  }
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
          <ul className="scheme">{q.scheme.map((s, k) => <li key={k} style={{ animationDelay: `${k * 90}ms` }}>{s}</li>)}</ul></div></div>}
    </div>}
  </section>
}
