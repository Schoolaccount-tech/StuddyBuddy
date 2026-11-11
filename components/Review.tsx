'use client'
import { useEffect, useState } from 'react'
import { store, ai } from '@/lib/api'
import { sfx, confetti } from '@/lib/fx'
import { getMistakes } from '@/lib/learn'
import { SUBJECTS } from '@/lib/igcse'
import Md from './Md'
import type { Api } from './api'

type SR = Record<string, { box: number; due: number }>
const GAPS = [1, 3, 7, 14, 30]
const DAY = 864e5
const SECS = [['sr', '🔁 Spaced review'], ['teach', '🧑‍🏫 Teach it back'], ['essay', '✍️ Essay marker']] as const

async function ask(subject: string, content: string) {
  const j = await ai({ mode: 'chat', style: 'exam', subject, topic: '', messages: [{ role: 'user', content }] }); return j.text as string
}

export default function Review({ api }: { api: Api }) {
  const [sec, setSec] = useState<typeof SECS[number][0]>('sr')
  return <section className="hub">
    <div className="seg wrapseg cats" role="group" aria-label="Review tools">{SECS.map(([k, l]) => <button key={k} aria-pressed={sec === k} onClick={() => { setSec(k); sfx('pop') }}>{l}</button>)}</div>
    {sec === 'sr' && <Spaced />}{sec === 'teach' && <Teach api={api} />}{sec === 'essay' && <Essay api={api} />}
  </section>
}

function Spaced() {
  const [sr, setSr] = useState<SR>({}); const [list, setList] = useState<ReturnType<typeof getMistakes>>([]); const [i, setI] = useState(0); const [show, setShow] = useState(false); const [done, setDone] = useState(0)
  const reload = () => { setList(getMistakes().filter(m => m.q && m.a && !m.fixed)); setSr(store.get<SR>('sr', {})) }
  useEffect(() => { reload(); return undefined }, [])
  const now = Date.now(); const due = list.filter(m => (sr[m.id]?.due ?? 0) <= now)
  const m = due[0]; const upcoming = list.length - due.length
  function grade(ok: boolean) {
    if (!m) return; const cur = sr[m.id] ?? { box: 0, due: 0 }; const box = ok ? cur.box + 1 : 0
    const next = { ...sr, [m.id]: { box, due: Date.now() + (ok ? GAPS[Math.min(box, GAPS.length) - 1] : 1) * DAY } }; store.set('sr', next); setSr(next)
    if (ok && box >= 4) { store.set('err', getMistakes().map(x => x.id === m.id ? { ...x, fixed: true } : x)); sfx('win'); confetti(0.8) } else sfx(ok ? 'good' : 'bad')
    setShow(false); setDone(d => d + 1); setI(i + 1); reload()
  }
  return <div className="lgform"><div className="hubnote">Spaced review brings your mistakes back at the right time: tomorrow, then in 3, 7, 14 and 30 days. Get a question right 4 times in a row and it is marked fixed. This is the most effective way to remember.</div>
    <div className="lgstats"><div className="stat"><b>{due.length}</b><span>Due now</span></div><div className="stat"><b>{upcoming}</b><span>Coming later</span></div><div className="stat"><b>{done}</b><span>Done this session</span></div></div>
    {!list.length ? <p className="note">No mistakes to review yet. Do a quiz or an exam question, and wrong answers will appear here automatically.</p> : !m ? <div className="resultme ok">🎉 All caught up! Come back tomorrow for your next review.</div> :
      <div className="q"><p className="note">{m.subj} · {m.topic}</p><h3>{m.q}</h3>{show ? <div className="why"><b>Answer:</b> {m.a}{m.note ? <><br />{m.note}</> : null}</div> : <button className="btn ghost" onClick={() => setShow(true)}>Show answer</button>}
        {show && <div className="row"><button className="btn ghost" onClick={() => grade(false)}>😅 Not yet</button><button className="btn" onClick={() => grade(true)}>✅ I knew it</button></div>}</div>}</div>
}

function Teach({ api }: { api: Api }) {
  const [topic, setTopic] = useState(''); const [text, setText] = useState(''); const [out, setOut] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  useEffect(() => { setTopic(api.topic); return undefined }, [api.topic])
  async function go() {
    setBusy(true); setErr(''); setOut('')
    try { setOut(await ask(api.subj, `A student is using the Feynman technique: they are teaching "${topic}" (${api.subj}) back to you in their own words. Their explanation:\n\n"""${text.slice(0, 3000)}"""\n\nRespond as a friendly, sharp teacher. 1) Give a score out of 10 for accuracy and clarity. 2) List what they got right. 3) List gaps, mistakes or missing key terms (correct them clearly). 4) Give a better 3-sentence version. 5) Ask one follow-up question to test deeper understanding.`)); sfx('good') } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  return <div className="lgform"><div className="hubnote">If you can explain it simply, you understand it. Teach the topic in your own words and Wise Owl will find the gaps.</div>
    <label>Topic<input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Photosynthesis" /></label>
    <label>Your explanation<textarea rows={6} value={text} onChange={e => setText(e.target.value)} placeholder="Explain it as if you were teaching a younger student…" /></label>
    <button className="btn" onClick={go} disabled={busy || topic.trim().length < 2 || text.trim().length < 30}>{busy ? 'Reading your explanation…' : 'Check my understanding'}</button>
    {err && <div className="notice">{err}</div>}{out && <div className="hubcard"><Md text={out} /></div>}</div>
}

function Essay({ api }: { api: Api }) {
  const [kind, setKind] = useState('Extended writing'); const [q, setQ] = useState(''); const [text, setText] = useState(''); const [out, setOut] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [sub, setSub] = useState('')
  const subject = sub || api.subj; const words = text.trim() ? text.trim().split(/\s+/).length : 0
  async function go() {
    setBusy(true); setErr(''); setOut('')
    try { setOut(await ask(subject, `Mark this student's ${kind.toLowerCase()} for Cambridge IGCSE ${subject} like an experienced examiner.\n\nQuestion/task: ${q || '(not given, judge it as a general piece of writing)'}\n\nStudent answer (${words} words):\n"""${text.slice(0, 6000)}"""\n\nGive: 1) An estimated level and mark out of the usual total, clearly labelled as an AI estimate, not an official mark. 2) Two real strengths, quoting short phrases. 3) The three most valuable improvements, each with a concrete example rewrite of one of their sentences. 4) Mistakes in spelling, punctuation or grammar (list the most important). 5) One tip on exam technique for this type of question. Be honest, specific and encouraging.`)); sfx('good') } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  return <div className="lgform"><div className="hubnote">Paste an essay, a long answer or a creative piece. You get examiner-style feedback. It is an AI estimate, so use your teacher’s marking as the final word.</div>
    <label>Subject<select value={sub} onChange={e => setSub(e.target.value)}><option value="">{api.subj} (current)</option>{[...new Set(SUBJECTS.map(s => s.name))].sort().map(n => <option key={n}>{n}</option>)}</select></label>
    <label>Type<select value={kind} onChange={e => setKind(e.target.value)}>{['Extended writing', 'Essay', 'Creative writing', 'Source-based answer', 'Case study answer', 'Practical report'].map(k => <option key={k}>{k}</option>)}</select></label>
    <label>The question (optional)<input value={q} onChange={e => setQ(e.target.value)} /></label>
    <label>Your answer ({words} words)<textarea rows={9} value={text} onChange={e => setText(e.target.value)} /></label>
    <button className="btn" onClick={go} disabled={busy || words < 25}>{busy ? 'Marking…' : 'Mark my writing'}</button>
    {err && <div className="notice">{err}</div>}{out && <div className="hubcard"><Md text={out} /></div>}</div>
}
