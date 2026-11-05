'use client'
import { useEffect, useRef, useState } from 'react'

const SUBJ: Record<string, string> = {
  'Mathematics': 'Show every step of working. Method marks are given even when the final answer is wrong, so never skip lines.',
  'Biology': 'Learn command words: describe, explain, suggest. Use the key term from the syllabus, then link it to the cause.',
  'Chemistry': 'Write balanced symbol equations with state symbols and practise mole calculations on every paper.',
  'Physics': 'Write the formula, substitute with units, then give the answer with a unit. Units are marks.',
  'English Language': 'Plan for 5 minutes before you write. Vary sentence openings and keep one paragraph for each idea.',
  'Computer Science': 'Practise pseudocode and tracing algorithms in a table. Dry-run your code on paper.',
  'Business Studies': 'Answer in context. Name the business from the case, then give a point, a reason and a result.',
  'Geography': 'Use case studies with real places, facts and figures. Name the place in every extended answer.',
  'History': 'Structure answers as point, evidence, explanation. Always judge which cause or source matters most.',
  'Economics': 'Define the key term first, explain the chain of cause and effect, then finish with an evaluation.',
  'Accounting': 'Lay out ledgers and statements neatly and label every line. Check that the totals balance.',
}
type Msg = { role: 'user' | 'assistant'; content: string }
type Q = { q: string; options: string[]; answer: number; explain: string }
type Card = { front: string; back: string }

const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem('wob:' + k); return v == null ? d : JSON.parse(v) } catch { return d } },
  set(k: string, v: unknown) { try { localStorage.setItem('wob:' + k, JSON.stringify(v)) } catch {} },
}

async function ai(body: object): Promise<any> {
  const r = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.')
  return j
}

export default function Home() {
  const [subj, setSubj] = useState('Mathematics')
  const [topic, setTopic] = useState('')
  const [tab, setTab] = useState<'ask' | 'quiz' | 'cards' | 'focus'>('ask')
  const [streak, setStreak] = useState(0)
  const [sess, setSess] = useState(0)

  useEffect(() => {
    const s = store.get('subj', ''); if (s && SUBJ[s]) setSubj(s)
    setStreak(store.get('streak', { n: 0, last: '' }).n)
    const t = store.get('sess', { d: '', n: 0 }); setSess(t.d === dayKey() ? t.n : 0)
  }, [])

  const bump = () => {
    const s = store.get('streak', { n: 0, last: '' }); const y = new Date(); y.setDate(y.getDate() - 1)
    if (s.last !== dayKey()) { const n = { n: s.last === dayKey(y) ? s.n + 1 : 1, last: dayKey() }; store.set('streak', n); setStreak(n.n) }
  }
  const addSession = () => { const t = store.get('sess', { d: '', n: 0 }); const n = { d: dayKey(), n: (t.d === dayKey() ? t.n : 0) + 1 }; store.set('sess', n); setSess(n.n); bump() }

  return <div className="wrap">
    <header>
      <img className="crest" src="/logo.png" alt="Wise Owl School crest" />
      <div><small>Wise Owl School · Westgate</small><h1>IGCSE Study Buddy</h1></div>
      <div className="stats"><span className="pill">🔥 {streak}-day streak</span><span className="pill">⏱ {sess} focus session{sess === 1 ? '' : 's'}</span></div>
    </header>

    <div className="rail" role="group" aria-label="Subject">
      {Object.keys(SUBJ).map(n => <button key={n} className="chip" aria-pressed={n === subj} onClick={() => { setSubj(n); store.set('subj', n) }}>{n}</button>)}
    </div>
    <div className="topic"><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional), for example: Quadratic equations, Photosynthesis, Rates of reaction" aria-label="Topic" /></div>

    <div className="tabs" role="tablist">
      {([['ask', 'Ask Buddy'], ['quiz', 'Quiz me'], ['cards', 'Flashcards'], ['focus', 'Focus timer']] as const).map(([k, l]) =>
        <button key={k} className="tab" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
    </div>
    <div className="panel">
      <div className="tip"><b>{subj} exam tip.</b> {SUBJ[subj]}</div>
      {tab === 'ask' && <Ask subj={subj} topic={topic} />}
      {tab === 'quiz' && <Quiz subj={subj} topic={topic} onDone={bump} />}
      {tab === 'cards' && <Cards subj={subj} topic={topic} onDone={bump} />}
      {tab === 'focus' && <Focus sess={sess} onSession={addSession} />}
    </div>

    <footer>
      <div className="credit"><span>💡 Ideas by <b>Michael Makadzange</b></span><span>💻 Code by <b>Jayden Ngwenya</b>
        <svg className="tick" viewBox="0 0 24 24" aria-label="Verified"><path fill="#1d9bf0" d="M12 1.5l2.6 1.7 3.1-.2 1.3 2.8 2.7 1.5-.5 3.1 1.1 2.9-2 2.4-.2 3.1-3 .9-2 2.4-2.9-1.1-2.9 1.1-2-2.4-3-.9-.2-3.1-2-2.4 1.1-2.9-.5-3.1 2.7-1.5 1.3-2.8 3.1.2z"/><path d="M7.7 12.2l3 3 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span></div>
      Made for Wise Owl School Westgate
    </footer>
  </div>
}

function Ask({ subj, topic }: { subj: string; topic: string }) {
  const [log, setLog] = useState<Msg[]>([{ role: 'assistant', content: "Hi, I'm Wise Owl 🦉 Ask me anything about your IGCSE subject. I explain step by step and show you how marks are earned in the exam." }])
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [log, busy])
  const starters = ['Explain the main ideas simply', 'What do examiners usually ask about this?', 'Give me a worked example', 'Common mistakes to avoid']
  async function send(e?: React.FormEvent) {
    e?.preventDefault(); const text = q.trim(); if (!text || busy) return
    const next = [...log, { role: 'user' as const, content: text }]; setLog(next); setQ(''); setBusy(true)
    try { const j = await ai({ mode: 'chat', subject: subj, topic, messages: next.slice(1) }); setLog([...next, { role: 'assistant', content: j.text }]) }
    catch (err: any) { setLog([...next, { role: 'assistant', content: err.message }]) }
    setBusy(false)
  }
  return <section>
    <div className="starters">{starters.map(s => <button key={s} type="button" onClick={() => setQ(s + (topic.trim() ? ' for ' + topic.trim() : ''))}>{s}</button>)}</div>
    <div className="log" aria-live="polite">{log.map((m, i) => <div key={i} className={'msg ' + (m.role === 'user' ? 'me' : 'ai')}>{m.content}</div>)}
      {busy && <div className="msg ai"><span className="busy">Thinking…</span></div>}<div ref={end} /></div>
    <form className="ask" onSubmit={send}>
      <textarea rows={2} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Type your question…" aria-label="Your question" />
      <button className="btn" disabled={busy}>Ask</button></form>
  </section>
}

function Quiz({ subj, topic, onDone }: { subj: string; topic: string; onDone: () => void }) {
  const [qs, setQs] = useState<Q[] | null>(null); const [picked, setPicked] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const done = qs ? Object.keys(picked).length === qs.length : false
  const score = qs ? qs.filter((q, i) => picked[i] === q.answer).length : 0
  useEffect(() => { if (done) onDone() }, [done]) // eslint-disable-line
  async function make() {
    setBusy(true); setErr(''); setPicked({})
    try { const j = await ai({ mode: 'quiz', subject: subj, topic }); setQs(j.data) } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  return <section>
    <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 16 }}><button className="btn" onClick={make} disabled={busy}>{qs ? 'New quiz' : 'Make a 5-question quiz'}</button><span className="note">Based on the subject and topic you picked.</span></div>
    {busy && <div className="busy">Writing your questions…</div>}{err && <div className="notice">{err}</div>}
    {!busy && qs?.map((q, i) => <div className="q" key={i}><h3>{i + 1}. {q.q}</h3>
      {q.options.map((o, j) => { const p = picked[i]; const cls = p === undefined ? '' : j === q.answer ? ' right' : p === j ? ' wrong' : ''
        return <button key={j} className={'opt' + cls} disabled={p !== undefined} onClick={() => setPicked({ ...picked, [i]: j })}>{String.fromCharCode(65 + j)}.  {o}</button> })}
      {picked[i] !== undefined && <div className="why">{q.explain}</div>}</div>)}
    {!busy && done && qs && <div><div className="score">{score} / {qs.length} {score === qs.length ? '🏆' : score >= qs.length * .6 ? '👍' : '💪'}</div>
      <p className="note">{score >= qs.length * .6 ? 'Strong work. Try a harder topic next.' : 'Read the explanations above, then make a new quiz on the same topic.'}</p></div>}
  </section>
}

function Cards({ subj, topic, onDone }: { subj: string; topic: string; onDone: () => void }) {
  const [cards, setCards] = useState<Card[] | null>(null); const [i, setI] = useState(0); const [known, setKnown] = useState(0)
  const [flip, setFlip] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  async function make() {
    setBusy(true); setErr('')
    try { const j = await ai({ mode: 'cards', subject: subj, topic }); setCards(j.data); setI(0); setKnown(0); setFlip(false) } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  const finished = cards && i >= cards.length
  useEffect(() => { if (finished) onDone() }, [finished]) // eslint-disable-line
  const next = (g: boolean) => { if (g) setKnown(k => k + 1); setI(n => n + 1); setFlip(false) }
  return <section>
    <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 16 }}><button className="btn" onClick={make} disabled={busy}>{cards ? 'New cards' : 'Make 8 flashcards'}</button><span className="note">Tap a card to flip it.</span></div>
    {busy && <div className="busy">Making your cards…</div>}{err && <div className="notice">{err}</div>}
    {!busy && cards && !finished && <div className="deck">
      <div className={'card' + (flip ? ' flip' : '')} role="button" tabIndex={0} aria-label="Flip card" onClick={() => setFlip(!flip)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlip(!flip) } }}>
        <div><div className="face front">{cards[i].front}</div><div className="face back">{cards[i].back}</div></div></div>
      <div className="row"><button className="btn ghost" onClick={() => next(false)}>Still learning</button><span className="note">{i + 1} of {cards.length}</span><button className="btn" onClick={() => next(true)}>Got it</button></div></div>}
    {!busy && finished && cards && <div><div className="score">{known} / {cards.length} known</div><p className="note">Make a new set to keep going.</p></div>}
  </section>
}

function Focus({ sess, onSession }: { sess: number; onSession: () => void }) {
  const FOCUS = 25 * 60, BREAK = 5 * 60
  const [left, setLeft] = useState(FOCUS); const [brk, setBrk] = useState(false); const [run, setRun] = useState(false); const [exam, setExam] = useState('')
  useEffect(() => { setExam(store.get('exam', '')) }, [])
  useEffect(() => {
    if (!run) return
    const id = setInterval(() => setLeft(l => l - 1), 1000); return () => clearInterval(id)
  }, [run])
  useEffect(() => {
    if (left > 0) return
    setRun(false); if (!brk) onSession(); setBrk(!brk); setLeft(brk ? FOCUS : BREAK)
  }, [left]) // eslint-disable-line
  const total = brk ? BREAK : FOCUS
  const m = Math.floor(left / 60), s = left % 60
  const days = exam ? Math.ceil((new Date(exam + 'T00:00:00').getTime() - Date.now()) / 864e5) : null
  return <section><div className="focus">
    <div className="ring"><svg viewBox="0 0 120 120"><circle className="bgc" cx="60" cy="60" r="52" /><circle className="fg" cx="60" cy="60" r="52" strokeDasharray="326.7" strokeDashoffset={326.7 * (1 - left / total)} /></svg>
      <b>{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</b></div>
    <div><h2 style={{ fontSize: 26, marginBottom: 6 }}>{brk ? 'Break for 5 minutes' : 'Focus for 25 minutes'}</h2>
      <p className="note" style={{ margin: '0 0 14px' }}>Study with your phone away, then take a 5-minute break. Four sessions a day is a strong start.</p>
      <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn" onClick={() => setRun(!run)}>{run ? 'Pause' : left === total ? 'Start' : 'Resume'}</button><button className="btn ghost" onClick={() => { setRun(false); setBrk(false); setLeft(FOCUS) }}>Reset</button></div>
      <div className="dots" aria-label="Sessions today">{[0, 1, 2, 3].map(i => <i key={i} className={i < sess ? 'on' : ''} />)}</div>
      <div className="exam" style={{ marginTop: 22 }}><label htmlFor="exam" className="note">Exam date</label><br />
        <input type="date" id="exam" value={exam} onChange={e => { setExam(e.target.value); store.set('exam', e.target.value) }} />
        <span style={{ fontWeight: 700, marginLeft: 8 }}>{days === null ? '' : days > 0 ? `${days} days to go` : days === 0 ? 'Exam day. Good luck!' : 'Date has passed'}</span></div>
    </div></div></section>
}
