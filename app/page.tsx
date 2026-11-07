'use client'
import { useEffect, useRef, useState } from 'react'
import { confetti, sfx, noise, soundOn, setSound, shareCard } from '@/lib/fx'
import { DEFAULT, LEVELS, BADGES, GOAL, TIPS, apply, levelOf, liveStreak, load, save, dayKey, type Prog, type Ev } from '@/lib/progress'
import Intro from '@/components/Intro'
import Mascot, { type Mood } from '@/components/Mascot'
import Planner from '@/components/Planner'
import CountUp from '@/components/CountUp'

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
type Toast = { id: number; e: string; title: string; sub: string; big: boolean }
type Tab = 'ask' | 'quiz' | 'cards' | 'focus' | 'plan' | 'me'
const ACCENTS = [['owl', '#f2c500'], ['ocean', '#38bdf8'], ['sunset', '#fb7185'], ['forest', '#4ade80']] as const

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
  const [subj, setSubj] = useState('Mathematics'); const [topic, setTopic] = useState(''); const [tab, setTab] = useState<Tab>('ask')
  const [p, setP] = useState<Prog>(DEFAULT); const pRef = useRef<Prog>(DEFAULT)
  const [toasts, setToasts] = useState<Toast[]>([]); const idc = useRef(0)
  const [msg, setMsg] = useState(''); const [mood, setMood] = useState<Mood>('idle'); const mt = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [sound, setSnd] = useState(true); const [accent, setAccent] = useState('owl'); const [mode, setMode] = useState<'auto' | 'light' | 'dark'>('auto')
  const tabsRef = useRef<HTMLDivElement>(null); const [ind, setInd] = useState({ l: 0, w: 0 })

  useEffect(() => {
    const s = store.get('subj', ''); if (s && SUBJ[s]) setSubj(s)
    const l = load(); pRef.current = l; setP(l); setSnd(soundOn())
    const a = store.get('accent', 'owl'); setAccent(a); document.documentElement.dataset.accent = a
    const m = store.get<'auto' | 'light' | 'dark'>('mode', 'auto'); setMode(m); if (m !== 'auto') document.documentElement.dataset.theme = m
    say('Hoot! Ready to learn something?', 'cheer', 5200)
  }, []) // eslint-disable-line
  useEffect(() => { const el = tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]'); if (el) setInd({ l: el.offsetLeft, w: el.offsetWidth }) }, [tab])

  function say(m: string, mo: Mood = 'cheer', ms = 4000) { setMsg(m); setMood(mo); clearTimeout(mt.current); mt.current = setTimeout(() => { setMsg(''); setMood('idle') }, ms) }
  function toast(e: string, title: string, sub = '', big = false) {
    const id = ++idc.current; setToasts(t => [...t, { id, e, title, sub, big }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), big ? 5200 : 3400)
  }
  function award(ev: Ev) {
    const r = apply(pRef.current, ev); pRef.current = r.p; setP(r.p); save(r.p)
    if (r.xp >= 5) toast('✨', `+${r.xp} XP`)
    if (r.leveled >= 0) { const L = LEVELS[r.leveled]; toast(L.e, `Level up: ${L.n}`, 'You are getting wiser', true); confetti(1.8); sfx('level'); say(`You are now a ${L.n}!`) }
    r.newB.forEach((b, i) => setTimeout(() => { toast(b.e, `Badge unlocked: ${b.name}`, b.desc, true); confetti(1); sfx('win') }, 700 + i * 1000))
    if (r.goalHit) setTimeout(() => { toast('🎯', 'Daily goal complete!', `${GOAL} study moves today. Great work.`, true); confetti(1.3); sfx('win') }, 300)
    if (r.milestone) setTimeout(() => { toast('🔥', `${r.milestone}-day streak!`, 'Keep the flame alive', true); confetti(1.4) }, 500)
  }
  function finishQuiz(right: number, total: number, combo: number) {
    award({ k: 'quiz', subject: subj, right, total, combo })
    if (right / total >= 0.6) { confetti(right === total ? 2 : 1.1); sfx('win'); say(right === total ? 'Perfect score! 🏆' : 'Brilliant work!') } else say('Good effort. Read the explanations and go again.', 'think', 5000)
  }

  const lv = levelOf(p.xp), cur = LEVELS[lv], nxt = LEVELS[lv + 1]
  const pct = nxt ? Math.round(((p.xp - cur.xp) / (nxt.xp - cur.xp)) * 100) : 100
  const goalN = p.goal.d === dayKey() ? Math.min(GOAL, p.goal.n) : 0; const streak = liveStreak(p)
  const sessToday = p.today.d === dayKey() ? p.today.sessions : 0
  const tip = TIPS[Math.floor(Date.now() / 864e5) % TIPS.length]
  const days = (() => { const v = store.get('exam', ''); return v ? Math.ceil((new Date(v + 'T00:00:00').getTime() - Date.now()) / 864e5) : null })()
  const changeTab = (t: Tab) => { setTab(t); sfx('pop'); if (t !== 'focus') noise(false) }
  const cycleMode = () => { const n = mode === 'auto' ? 'dark' : mode === 'dark' ? 'light' : 'auto'; setMode(n); store.set('mode', n); if (n === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = n }

  return <>
    <Intro />
    <div className="aurora" aria-hidden><i /><i /><i /></div>
    <div className="toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className={'toast' + (t.big ? ' big' : '')}><span className="te">{t.e}</span><div><b>{t.title}</b>{t.sub && <small>{t.sub}</small>}</div></div>)}</div>
    <div className="wrap">
      <header>
        <img className="crest" src="/logo.png" alt="Wise Owl School crest" />
        <div><small>Wise Owl School · Westgate</small><h1>IGCSE Study Buddy</h1></div>
        <div className="stats">
          <button className="xp" onClick={() => changeTab('me')} aria-label="Your level and progress"><span className="lvl">{cur.e}</span><span><b>{cur.n}</b><span className="xpbar"><i style={{ width: pct + '%' }} /></span></span><span className="xpn"><CountUp to={p.xp} /> XP</span></button>
          <span className="pill"><span className={'flame' + (streak ? ' on' : '')}>🔥</span> {streak}-day streak</span>
          <span className="pill goal" title="Daily goal"><svg viewBox="0 0 36 36" width="26" height="26"><circle cx="18" cy="18" r="15" className="g0" /><circle cx="18" cy="18" r="15" className="g1" strokeDasharray="94.2" strokeDashoffset={94.2 * (1 - goalN / GOAL)} /></svg>{goalN}/{GOAL} today</span>
        </div>
      </header>

      <div className="ctl">
        <button onClick={() => { const v = !sound; setSnd(v); setSound(v); if (v) sfx('pop') }} aria-label={sound ? 'Mute sounds' : 'Turn sounds on'}>{sound ? '🔊' : '🔇'}</button>
        <button onClick={cycleMode} aria-label="Switch light or dark mode">{mode === 'auto' ? '🌗' : mode === 'dark' ? '🌙' : '☀️'}</button>
        {ACCENTS.map(([n, c]) => <button key={n} className={'dot' + (accent === n ? ' on' : '')} style={{ background: c }} aria-label={n + ' theme'} onClick={() => { setAccent(n); store.set('accent', n); document.documentElement.dataset.accent = n; sfx('pop') }} />)}
        {days !== null && days >= 0 && <span className="pill exam">📅 {days === 0 ? 'Exam day!' : `${days} days to your exam`}</span>}
      </div>

      <div className="daily"><span className="spark">💡</span><div><b>Today’s study tip</b><br /><span className="note">{tip}</span></div></div>

      <div className="rail" role="group" aria-label="Subject">
        {Object.keys(SUBJ).map(n => <button key={n} className="chip" aria-pressed={n === subj} onClick={() => { setSubj(n); store.set('subj', n); sfx('pop') }}>{n}</button>)}
      </div>
      <div className="topic"><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional), for example: Quadratic equations, Photosynthesis, Rates of reaction" aria-label="Topic" /></div>

      <div className="tabs" role="tablist" ref={tabsRef}>
        {([['ask', 'Ask Buddy'], ['quiz', 'Quiz me'], ['cards', 'Flashcards'], ['focus', 'Focus'], ['plan', 'Planner'], ['me', 'My progress']] as const).map(([k, l]) =>
          <button key={k} className="tab" role="tab" aria-selected={tab === k} onClick={() => changeTab(k)}>{l}</button>)}
        <span className="tab-ind" style={{ left: ind.l, width: ind.w }} />
      </div>
      <div className="panel" key={tab}>
        <div className="tip"><b>{subj} exam tip.</b> {SUBJ[subj]}</div>
        {tab === 'ask' && <Ask subj={subj} topic={topic} onAsk={() => award({ k: 'ask' })} onMood={m => setMood(m)} />}
        {tab === 'quiz' && <Quiz subj={subj} topic={topic} onFinish={finishQuiz} onCombo={n => { if (n >= 2) { sfx('good'); if (n === 5) { confetti(0.7); say('Combo king! ⚡') } } }} level={`${cur.e} ${cur.n}`} />}
        {tab === 'cards' && <Cards subj={subj} topic={topic} onFinish={(k, t) => { award({ k: 'cards', known: k, total: t }); confetti(k / t >= 0.6 ? 1.2 : 0.5); sfx('win'); say('Deck complete!') }} />}
        {tab === 'focus' && <Focus sess={sessToday} onSession={() => { award({ k: 'session' }); confetti(1.4); sfx('win'); say('Focus session complete! Take a break.') }} />}
        {tab === 'plan' && <Planner onDone={() => { award({ k: 'task' }); sfx('good') }} />}
        {tab === 'me' && <Me p={p} lv={lv} pct={pct} />}
      </div>

      <footer>
        <div className="credit"><span>💡 Ideas by <b>Michael Makadzange</b></span><span>💻 Code by <b>Jayden Ngwenya</b>
          <svg className="tick" viewBox="0 0 24 24" aria-label="Verified"><path fill="#1d9bf0" d="M12 1.5l2.6 1.7 3.1-.2 1.3 2.8 2.7 1.5-.5 3.1 1.1 2.9-2 2.4-.2 3.1-3 .9-2 2.4-2.9-1.1-2.9 1.1-2-2.4-3-.9-.2-3.1-2-2.4 1.1-2.9-.5-3.1 2.7-1.5 1.3-2.8 3.1.2z" /><path d="M7.7 12.2l3 3 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span></div>
        Made for Wise Owl School Westgate
      </footer>
    </div>
    <Mascot msg={msg} mood={mood} />
  </>
}

function Ask({ subj, topic, onAsk, onMood }: { subj: string; topic: string; onAsk: () => void; onMood: (m: Mood) => void }) {
  const [log, setLog] = useState<Msg[]>([{ role: 'assistant', content: "Hi, I'm Wise Owl 🦉 Ask me anything about your IGCSE subject. I explain step by step and show you how marks are earned in the exam." }])
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [log, busy])
  const starters = ['Explain the main ideas simply', 'What do examiners usually ask about this?', 'Give me a worked example', 'Common mistakes to avoid']
  async function send(e?: React.FormEvent) {
    e?.preventDefault(); const text = q.trim(); if (!text || busy) return
    const next = [...log, { role: 'user' as const, content: text }]; setLog(next); setQ(''); setBusy(true); onMood('think'); sfx('pop')
    try { const j = await ai({ mode: 'chat', subject: subj, topic, messages: next.slice(1) }); setLog([...next, { role: 'assistant', content: j.text }]); onAsk() }
    catch (err: any) { setLog([...next, { role: 'assistant', content: err.message }]) }
    setBusy(false); onMood('idle')
  }
  return <section>
    <div className="starters">{starters.map(s => <button key={s} type="button" onClick={() => setQ(s + (topic.trim() ? ' for ' + topic.trim() : ''))}>{s}</button>)}</div>
    <div className="log" aria-live="polite">{log.map((m, i) => <div key={i} className={'msg ' + (m.role === 'user' ? 'me' : 'ai')}>{m.content}</div>)}
      {busy && <div className="msg ai"><span className="typing"><i /><i /><i /></span></div>}<div ref={end} /></div>
    <form className="ask" onSubmit={send}>
      <textarea rows={2} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Type your question…" aria-label="Your question" />
      <button className="btn" disabled={busy}>Ask</button></form>
  </section>
}

function Quiz({ subj, topic, onFinish, onCombo, level }: { subj: string; topic: string; onFinish: (r: number, t: number, c: number) => void; onCombo: (n: number) => void; level: string }) {
  const [qs, setQs] = useState<Q[] | null>(null); const [picked, setPicked] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [combo, setCombo] = useState(0); const best = useRef(0); const fin = useRef(false)
  const done = qs ? Object.keys(picked).length === qs.length : false
  const score = qs ? qs.filter((q, i) => picked[i] === q.answer).length : 0
  async function make() {
    setBusy(true); setErr(''); setPicked({}); setCombo(0); best.current = 0; fin.current = false
    try { const j = await ai({ mode: 'quiz', subject: subj, topic }); setQs(j.data) } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  function pick(i: number, j: number) {
    if (!qs || picked[i] !== undefined) return
    const ok = j === qs[i].answer; const nc = ok ? combo + 1 : 0
    setCombo(nc); best.current = Math.max(best.current, nc); sfx(ok ? 'good' : 'bad'); if (ok) onCombo(nc)
    const np = { ...picked, [i]: j }; setPicked(np)
    if (Object.keys(np).length === qs.length && !fin.current) { fin.current = true; const r = qs.filter((q, k) => np[k] === q.answer).length; setTimeout(() => onFinish(r, qs.length, best.current), 500) }
  }
  return <section>
    <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 16 }}><button className="btn" onClick={make} disabled={busy}>{qs ? 'New quiz' : 'Make a 5-question quiz'}</button>
      {combo >= 2 && <span className="combo" key={combo}>⚡ x{combo} combo</span>}<span className="note">Earn 10 XP per right answer.</span></div>
    {busy && <div className="busy">Writing your questions…</div>}{err && <div className="notice">{err}</div>}
    {!busy && qs && <div className="qbar"><i style={{ width: `${(Object.keys(picked).length / qs.length) * 100}%` }} /></div>}
    {!busy && qs?.map((q, i) => <div className="q" key={i} style={{ animationDelay: `${i * 80}ms` }}><h3>{i + 1}. {q.q}</h3>
      {q.options.map((o, j) => { const pk = picked[i]; const cls = pk === undefined ? '' : j === q.answer ? ' right' : pk === j ? ' wrong' : ''
        return <button key={j} className={'opt' + cls} disabled={pk !== undefined} onClick={() => pick(i, j)}><b>{String.fromCharCode(65 + j)}</b>{o}</button> })}
      {picked[i] !== undefined && <div className="why">{q.explain}</div>}</div>)}
    {!busy && done && qs && <div className="result"><div className="score">{score} / {qs.length} {score === qs.length ? '🏆' : score >= qs.length * .6 ? '👍' : '💪'}</div>
      <p className="note">{score >= qs.length * .6 ? 'Strong work. Try a harder topic next.' : 'Read the explanations above, then make a new quiz on the same topic.'}</p>
      <button className="btn ghost" onClick={() => shareCard(subj + (topic ? ': ' + topic : ''), `${score}/${qs.length}`, 'Quiz score', level)}>Save my score card</button></div>}
  </section>
}

function Cards({ subj, topic, onFinish }: { subj: string; topic: string; onFinish: (k: number, t: number) => void }) {
  const [cards, setCards] = useState<Card[] | null>(null); const [i, setI] = useState(0); const [known, setKnown] = useState(0)
  const [flip, setFlip] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  async function make() {
    setBusy(true); setErr('')
    try { const j = await ai({ mode: 'cards', subject: subj, topic }); setCards(j.data); setI(0); setKnown(0); setFlip(false) } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  const finished = !!cards && i >= cards.length
  const next = (g: boolean) => { const k = known + (g ? 1 : 0); sfx(g ? 'good' : 'pop'); if (g) setKnown(k); setFlip(false); if (cards && i + 1 >= cards.length) onFinish(k, cards.length); setI(n => n + 1) }
  return <section>
    <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 16 }}><button className="btn" onClick={make} disabled={busy}>{cards ? 'New cards' : 'Make 8 flashcards'}</button><span className="note">Tap a card to flip it.</span></div>
    {busy && <div className="busy">Making your cards…</div>}{err && <div className="notice">{err}</div>}
    {!busy && cards && !finished && <div className="deck">
      <div className={'card' + (flip ? ' flip' : '')} key={i} role="button" tabIndex={0} aria-label="Flip card" onClick={() => { setFlip(!flip); sfx('pop') }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlip(!flip) } }}>
        <div><div className="face front">{cards[i].front}</div><div className="face back">{cards[i].back}</div></div></div>
      <div className="row"><button className="btn ghost" onClick={() => next(false)}>Still learning</button><span className="note">{i + 1} of {cards.length}</span><button className="btn" onClick={() => next(true)}>Got it</button></div></div>}
    {!busy && finished && cards && <div className="result"><div className="score">{known} / {cards.length} known 🎉</div><p className="note">Make a new set to keep going.</p></div>}
  </section>
}

function Focus({ sess, onSession }: { sess: number; onSession: () => void }) {
  const FOCUS = 25 * 60, BREAK = 5 * 60
  const [left, setLeft] = useState(FOCUS); const [brk, setBrk] = useState(false); const [run, setRun] = useState(false); const [exam, setExam] = useState(''); const [rain, setRain] = useState(false)
  useEffect(() => { setExam(store.get('exam', '')); return () => noise(false) }, [])
  useEffect(() => { if (!run) return; const id = setInterval(() => setLeft(l => l - 1), 1000); return () => clearInterval(id) }, [run])
  useEffect(() => { if (left > 0) return; setRun(false); if (!brk) onSession(); setBrk(!brk); setLeft(brk ? FOCUS : BREAK) }, [left]) // eslint-disable-line
  const total = brk ? BREAK : FOCUS; const m = Math.floor(left / 60), s = left % 60
  const days = exam ? Math.ceil((new Date(exam + 'T00:00:00').getTime() - Date.now()) / 864e5) : null
  return <section><div className="focus">
    <div className={'ring' + (run ? ' live' : '')}><svg viewBox="0 0 120 120"><circle className="bgc" cx="60" cy="60" r="52" /><circle className="fg" cx="60" cy="60" r="52" strokeDasharray="326.7" strokeDashoffset={326.7 * (1 - left / total)} /></svg>
      <b>{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</b></div>
    <div><h2 style={{ fontSize: 26, marginBottom: 6 }}>{brk ? 'Break for 5 minutes' : 'Focus for 25 minutes'}</h2>
      <p className="note" style={{ margin: '0 0 14px' }}>Study with your phone away, then take a 5-minute break. Finish a session for 25 XP and a celebration.</p>
      <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn" onClick={() => setRun(!run)}>{run ? 'Pause' : left === total ? 'Start' : 'Resume'}</button><button className="btn ghost" onClick={() => { setRun(false); setBrk(false); setLeft(FOCUS) }}>Reset</button>
        <button className={'btn ghost' + (rain ? ' on' : '')} onClick={() => { noise(!rain); setRain(!rain) }}>{rain ? '🌧 Rain noise on' : '🌧 Calm noise'}</button></div>
      <div className="dots" aria-label="Sessions today">{[0, 1, 2, 3].map(i => <i key={i} className={i < sess ? 'on' : ''} />)}</div>
      <div className="exam" style={{ marginTop: 22 }}><label htmlFor="exam" className="note">Exam date</label><br />
        <input type="date" id="exam" value={exam} onChange={e => { setExam(e.target.value); store.set('exam', e.target.value) }} />
        <span style={{ fontWeight: 700, marginLeft: 8 }}>{days === null ? '' : days > 0 ? `${days} days to go` : days === 0 ? 'Exam day. Good luck!' : 'Date has passed'}</span></div>
    </div></div></section>
}

function Me({ p, lv, pct }: { p: Prog; lv: number; pct: number }) {
  const cur = LEVELS[lv], nxt = LEVELS[lv + 1]; const subs = Object.entries(p.mastery)
  return <section>
    <div className="hero-me"><div className="big-e">{cur.e}</div><div style={{ flex: 1, minWidth: 0 }}><h2 style={{ fontSize: 28 }}>{cur.n}</h2>
      <p className="note" style={{ margin: '4px 0 10px' }}>{nxt ? `${nxt.xp - p.xp} XP to ${nxt.n} ${nxt.e}` : 'You reached the top level!'}</p>
      <div className="xpbar wide"><i style={{ width: pct + '%' }} /></div></div></div>
    <div className="stat-row">{([['🧠', 'Quizzes', p.quizzes], ['🃏', 'Card sets', p.cards], ['⏱️', 'Focus sessions', p.sessions], ['✅', 'Tasks done', p.tasks]] as const).map(([e, l, n], i) =>
      <div key={l} className="stat" style={{ animationDelay: `${i * 90}ms` }}><span>{e}</span><b><CountUp to={n} /></b><small>{l}</small></div>)}</div>
    <h3 className="sec">Subject mastery</h3>
    {subs.length ? subs.map(([n, m]) => { const v = m.total ? Math.round((m.right / m.total) * 100) : 0
      return <div key={n} className="mast"><span>{n}</span><div className="mbar"><i style={{ width: v + '%' }} /></div><b>{v}%</b></div> }) : <p className="note">Finish a quiz and your subject bars will grow here.</p>}
    <h3 className="sec">Badges <small className="note">{p.badges.length} of {BADGES.length}</small></h3>
    <div className="badges">{BADGES.map(b => { const on = p.badges.includes(b.id)
      return <div key={b.id} className={'badge' + (on ? '' : ' locked')}><span className="em">{on ? b.e : '🔒'}</span><b>{b.name}</b><small>{b.desc}</small></div> })}</div>
  </section>
}
