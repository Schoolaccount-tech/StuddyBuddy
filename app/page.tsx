'use client'
import { useEffect, useRef, useState } from 'react'
import { confetti, celebrate, sfx, noise, soundOn, setSound } from '@/lib/fx'
import { DEFAULT, LEVELS, GOAL, TIPS, apply, levelOf, liveStreak, load, save, dayKey, type Prog, type Ev } from '@/lib/progress'
import { store } from '@/lib/api'
import Intro from '@/components/Intro'
import Mascot, { type Mood } from '@/components/Mascot'
import Starfield from '@/components/Starfield'
import LevelUp from '@/components/LevelUp'
import Planner from '@/components/Planner'
import Timetable from '@/components/Timetable'
import Ask from '@/components/Ask'
import Quiz from '@/components/Quiz'
import Cards from '@/components/Cards'
import Exam from '@/components/Exam'
import Focus from '@/components/Focus'
import Tools from '@/components/Tools'
import Me from '@/components/Me'
import CountUp from '@/components/CountUp'
import Play from '@/components/Play'
import Lab from '@/components/Lab'
import Track from '@/components/Track'
import Boost from '@/components/Boost'
import League from '@/components/League'
import IgcseHub from '@/components/IgcseHub'
import WeakSpots from '@/components/Weak'
import { reportPractice, getCode } from '@/lib/league'
import Share from '@/components/Share'
import { readLook, applyLook } from '@/lib/a11y'
import Palette, { type Cmd } from '@/components/Palette'
import { CursorTrail, Ripple, Konami, Sky, Ticker, Daily, type Trail } from '@/components/Extras'
import type { Api, Cfg } from '@/components/api'

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
type Toast = { id: number; e: string; title: string; sub: string; big: boolean }
const TABS = [['ask', 'Ask Buddy'], ['quiz', 'Quiz'], ['cards', 'Cards'], ['exam', 'Exam'], ['focus', 'Focus'], ['plan', 'Planner'], ['tools', 'Tools'], ['play', 'Play'], ['lab', 'Lab'], ['track', 'Track'], ['boost', 'Boost'], ['weak', 'Weak spots'], ['igcse', 'IGCSE Hub'], ['league', 'Competitions'], ['me', 'Progress']] as const
type Tab = typeof TABS[number][0]
const ACCENTS = [['owl', '#f2c500'], ['ocean', '#38bdf8'], ['sunset', '#fb7185'], ['forest', '#4ade80'], ['violet', '#a78bfa'], ['mint', '#2dd4bf'], ['lava', '#fb923c'], ['lime', '#a3e635']] as const

export default function Home() {
  const [subj, setSubj] = useState('Mathematics'); const [topic, setTopic] = useState(''); const [askSeed, setAskSeed] = useState<{ t: string; n: number } | null>(null); const [tab, setTab] = useState<Tab>('ask'); const prevTab = useRef(0)
  const [p, setP] = useState<Prog>(DEFAULT); const pRef = useRef<Prog>(DEFAULT)
  const [toasts, setToasts] = useState<Toast[]>([]); const idc = useRef(0)
  const [msg, setMsg] = useState(''); const [mood, setMood] = useState<Mood>('idle'); const mt = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [sound, setSnd] = useState(true); const [accent, setAccent] = useState('owl'); const [mode, setMode] = useState<'auto' | 'light' | 'dark'>('auto')
  const [lvUp, setLvUp] = useState<{ e: string; n: string } | null>(null); const [help, setHelp] = useState(false); const [inst, setInst] = useState<any>(null); const [planTab, setPlanTab] = useState<'tasks' | 'time'>('tasks')
  const [tip, setTip] = useState(TIPS[0]); const [days, setDays] = useState<number | null>(null)
  const [cfg, setCfgS] = useState<Cfg>({ trail: 'sparkle', party: false, crown: false, remind: true }); const cfgRef = useRef(cfg); const [pal, setPal] = useState(false); const [share, setShare] = useState(false); const [board, setBoard] = useState(false); const [rb, setRb] = useState(false); const [spin, setSpin] = useState(false); const crestN = useRef(0)
  const tabsRef = useRef<HTMLDivElement>(null); const [ind, setInd] = useState({ l: 0, w: 0 })
  const dir = TABS.findIndex(t => t[0] === tab) >= prevTab.current ? 'r' : 'l'

  useEffect(() => {
    const s = store.get('subj', ''); if (s && SUBJ[s]) setSubj(s)
    setTip(TIPS[Math.floor(Date.now() / 864e5) % TIPS.length]); const ex = store.get('exam', ''); setDays(ex ? Math.ceil((new Date(ex + 'T00:00:00').getTime() - Date.now()) / 864e5) : null)
    const c = store.get<Partial<Cfg>>('cfg', {}); if (c && typeof c === 'object') { const n = { trail: (c.trail as Trail) || 'sparkle', party: !!c.party, crown: !!c.crown, remind: c.remind !== false }; cfgRef.current = n; setCfgS(n) }
    const rbo = store.get('rainbow', false); setRb(!!rbo); if (rbo) document.documentElement.dataset.rainbow = '1'
    applyLook(readLook())
    const bd = store.get('board', false); setBoard(!!bd); if (bd) document.documentElement.dataset.board = '1'
    const l = load(); pRef.current = l; setP(l); setSnd(soundOn())
    const a = store.get('accent', 'owl'); setAccent(a); document.documentElement.dataset.accent = a
    const m = store.get<'auto' | 'light' | 'dark'>('mode', 'auto'); setMode(m); if (m !== 'auto') document.documentElement.dataset.theme = m
    say(l.nick ? `Welcome back, ${l.nick}!` : 'Hoot! Ready to learn something?', 'cheer', 5200)
    const bip = (e: Event) => { e.preventDefault(); setInst(e) }; addEventListener('beforeinstallprompt', bip); return () => removeEventListener('beforeinstallprompt', bip)
  }, []) // eslint-disable-line
  useEffect(() => { const el = tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]'); if (el) { setInd({ l: el.offsetLeft, w: el.offsetWidth }); el.scrollIntoView({ block: 'nearest', inline: 'center' }) } }, [tab])

  // Pointer effects: 3D tilt, cursor spotlight, magnetic buttons.
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let lastT: HTMLElement | null = null, lastB: HTMLElement | null = null
    const mv = (e: PointerEvent) => {
      const t = e.target as HTMLElement; if (!t.closest) return
      const pn = t.closest<HTMLElement>('.panel'); if (pn) { const r = pn.getBoundingClientRect(); pn.style.setProperty('--mx', e.clientX - r.left + 'px'); pn.style.setProperty('--my', e.clientY - r.top + 'px') }
      const el = t.closest<HTMLElement>('.tilt'); if (lastT && lastT !== el) { lastT.style.transform = ''; lastT = null }
      if (el) { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateY(-3px)`; lastT = el }
      const b = t.closest<HTMLElement>('.btn'); if (lastB && lastB !== b) { lastB.style.transform = ''; lastB = null }
      if (b && !(b as HTMLButtonElement).disabled) { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.14}px, ${(e.clientY - r.top - r.height / 2) * 0.22}px)`; lastB = b }
    }
    addEventListener('pointermove', mv); return () => removeEventListener('pointermove', mv)
  }, [])
  // Keyboard shortcuts.
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal(o => !o); return }
      const t = e.target as HTMLElement; if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '?') setHelp(h => !h)
      else if (e.key === 'Escape') { setHelp(false); setPal(false) }
      else if (e.key === 'm') toggleSound()
      else if (/^[1-9]$/.test(e.key)) changeTab(TABS[+e.key - 1][0])
    }
    addEventListener('keydown', kd); return () => removeEventListener('keydown', kd)
  }) // eslint-disable-line

  function say(m: string, mo: Mood = 'cheer', ms = 4000) { setMsg(m); setMood(mo); clearTimeout(mt.current); mt.current = setTimeout(() => { setMsg(''); setMood('idle') }, ms) }
  function toast(e: string, title: string, sub = '', big = false) { const id = ++idc.current; setToasts(t => [...t, { id, e, title, sub, big }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), big ? 5200 : 3400) }
  function patch(f: (p: Prog) => Prog) { const n = f(pRef.current); pRef.current = n; setP(n); save(n) }
  function award(ev: Ev) {
    try {
      if (getCode() && (ev.k === 'quiz' || ev.k === 'exam')) {
        const units = ev.k === 'quiz' ? ev.right : Math.round((ev.awarded / Math.max(1, ev.marks)) * 5)
        if (units > 0) void reportPractice(ev.k, units, ev.k === 'quiz' ? ev.subject : subj, `${ev.k}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`).then(n => { if (n && n > 0) toast('🛡️', `+${n} league points`, 'For you and your house') }).catch(() => {})
      }
    } catch {}
    const r = apply(pRef.current, ev); pRef.current = r.p; setP(r.p); save(r.p)
    if (r.xp > 0) floatXP(r.xp)
    if (r.xp >= 5 && ev.k !== 'bonus') toast('✨', `+${r.xp} XP`)
    r.questsDone.forEach((q, i) => setTimeout(() => { toast('🎯', 'Quest complete!', `${q.t} · +${q.xp} XP`, true); sfx('good') }, 400 + i * 700))
    if (r.leveled >= 0) { const L = LEVELS[r.leveled]; setLvUp({ e: L.e, n: L.n }); celebrate('fireworks'); sfx('level'); say(`You are now a ${L.n}!`) }
    r.newB.forEach((b, i) => setTimeout(() => { toast(b.e, `Badge unlocked: ${b.name}`, b.desc, true); celebrate('stars', b.e); sfx('win') }, 900 + i * 1100))
    if (r.goalHit) setTimeout(() => { toast('🎯', 'Daily goal complete!', `${GOAL} study moves today. Great work.`, true); celebrate('emoji', '🎯'); sfx('win') }, 300)
    if (r.milestone) setTimeout(() => { toast('🔥', `${r.milestone}-day streak!`, 'Keep the flame alive', true); celebrate('emoji', '🔥') }, 500)
  }
  function finishQuiz(right: number, total: number, combo: number) {
    award({ k: 'quiz', subject: subj, right, total, combo })
    if (right / total >= 0.6) { if (right === total) celebrate('fireworks'); else confetti(1.1); sfx('win'); say(right === total ? 'Perfect score! 🏆' : 'Brilliant work!') } else say('Good effort. Check your mistakes and go again.', 'think', 5000)
  }
  function setCfg(c: Partial<Cfg>) { const n = { ...cfgRef.current, ...c }; cfgRef.current = n; setCfgS(n); store.set('cfg', n) }
  function toggleBoard() { const n = !board; setBoard(n); store.set('board', n); if (n) document.documentElement.dataset.board = '1'; else delete document.documentElement.dataset.board; sfx('pop'); say(n ? 'Big screen mode on 📺' : 'Big screen mode off', 'cheer', 2500) }
  function fullscreen() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen() } catch {} }
  function rainbow() { const n = !document.documentElement.dataset.rainbow; setRb(n); store.set('rainbow', n); if (n) document.documentElement.dataset.rainbow = '1'; else delete document.documentElement.dataset.rainbow; celebrate(n ? 'fireworks' : 'stars', '🌈'); sfx(n ? 'level' : 'pop'); say(n ? 'Rainbow mode ON! 🌈' : 'Rainbow mode off', 'cheer', 3500); if (n) award({ k: 'bonus', xp: 5 }) }
  function crestClick() { setSpin(true); setTimeout(() => setSpin(false), 900); sfx('pop'); crestN.current++; if (crestN.current >= 5) { crestN.current = 0; rainbow() } }
  function floatXP(n: number) { try { const el = document.querySelector('.xp'); if (!el) return; const r = el.getBoundingClientRect(), d = document.createElement('div'); d.className = 'xpfloat'; d.textContent = `+${n} XP`; d.style.left = r.left + r.width / 2 + 'px'; d.style.top = r.bottom + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 1500) } catch {} }
  function toggleSound() { setSnd(s => { setSound(!s); if (!s) sfx('pop'); return !s }) }
  function changeTab(t: Tab) { prevTab.current = TABS.findIndex(x => x[0] === tab); setTab(t); sfx('pop'); if (t !== 'focus') noise(false); if (cfgRef.current.party) confetti(0.5) }
  function cycleMode() { const n = mode === 'auto' ? 'dark' : mode === 'dark' ? 'light' : 'auto'; setMode(n); store.set('mode', n); if (n === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = n }

  useEffect(() => {
    if (!cfg.remind) return
    const tips = ['Time for a sip of water 💧', 'Stand up and stretch for 30 seconds 🧘', 'Look at something far away for 20 seconds 👀', 'Roll your shoulders and breathe slowly 🌬️']
    let k = 0
    const id = setInterval(() => { if (document.visibilityState === 'visible') { toast('⏰', 'Quick break?', tips[k++ % tips.length], true); sfx('pop') } }, 30 * 60 * 1000)
    return () => clearInterval(id)
  }, [cfg.remind]) // eslint-disable-line
  const api: Api = { p, patch, award, say, toast, subj, topic, cfg, setCfg }
  const lv = levelOf(p.xp), cur = LEVELS[lv], nxt = LEVELS[lv + 1]
  const pct = nxt ? Math.round(((p.xp - cur.xp) / (nxt.xp - cur.xp)) * 100) : 100
  const goalN = p.goal.d === dayKey() ? Math.min(GOAL, p.goal.n) : 0; const streak = liveStreak(p)
  const sessToday = p.today.d === dayKey() ? p.today.sessions : 0
    const spinReady = p.spin !== dayKey()

  const cmds: Cmd[] = [
    ...TABS.map(([k, l], i) => ({ id: 't' + k, e: ['💬', '🧠', '🃏', '📝', '⏱️', '🗓️', '🛠️', '🎮', '🧪', '📈', '🚀', '🎯', '🎓', '🛡️', '🏆'][i] || '➡️', label: `Go to ${l}`, hint: 'tab', run: () => changeTab(k) })),
    ...Object.keys(SUBJ).map(n => ({ id: 's' + n, e: '📚', label: `Subject: ${n}`, hint: 'subject', run: () => { setSubj(n); store.set('subj', n); sfx('pop') } })),
    ...ACCENTS.map(([n]) => ({ id: 'a' + n, e: '🎨', label: `Theme: ${n}`, hint: 'colour', run: () => { setAccent(n); store.set('accent', n); document.documentElement.dataset.accent = n; sfx('pop') } })),
    { id: 'snd', e: sound ? '🔇' : '🔊', label: sound ? 'Mute sounds' : 'Turn sounds on', run: toggleSound },
    { id: 'mode', e: '🌗', label: 'Switch light / dark mode', hint: 'dark light', run: cycleMode },
    { id: 'bd', e: '📺', label: board ? 'Big screen mode: turn off' : 'Big screen mode (smartboard)', hint: 'smartboard projector large', run: toggleBoard },
    { id: 'fs', e: '🖥️', label: 'Toggle fullscreen', run: fullscreen },
    { id: 'rb', e: '🌈', label: 'Rainbow mode', hint: 'party', run: rainbow },
    { id: 'br', e: '🌬️', label: 'Breathe (calm down)', hint: 'lab relax', run: () => changeTab('lab') },
    { id: 'share', e: '📱', label: 'Share / QR code', hint: 'qr join phone link', run: () => setShare(true) },
    { id: 'remind', e: '💧', label: cfg.remind ? 'Break reminders: turn off' : 'Break reminders: turn on', hint: 'water stretch', run: () => { setCfg({ remind: !cfg.remind }); say(cfg.remind ? 'Reminders off' : 'I will remind you to take breaks 💧', 'cheer', 3000) } },
    { id: 'about', e: '✨', label: 'Meet the team (Jayden & Michael)', hint: 'about credits', run: () => { location.href = '/about' } },
    { id: 'help', e: '⌨️', label: 'Keyboard shortcuts', run: () => setHelp(true) },
  ]

  return <>
    <Intro />
    <div className="aurora" aria-hidden><i /><i /><i /></div><Starfield /><CursorTrail kind={rb ? 'rainbow' : cfg.trail} /><div className="rb-bar" aria-hidden /><Ripple /><Konami onHit={rainbow} />
    {pal && <Palette cmds={cmds} onClose={() => setPal(false)} />}
    {share && <Share onClose={() => setShare(false)} />}
    {lvUp && <LevelUp e={lvUp.e} n={lvUp.n} onClose={() => setLvUp(null)} />}
    {help && <div className="help" onClick={() => setHelp(false)} role="dialog" aria-label="Keyboard shortcuts"><div className="help-in" onClick={e => e.stopPropagation()}><h3>Keyboard shortcuts</h3>
      <ul><li><kbd>1</kbd>–<kbd>9</kbd> Switch tabs</li><li><kbd>Ctrl</kbd>+<kbd>K</kbd> Command palette</li><li><kbd>↑↑↓↓←→←→BA</kbd> A surprise 🌈</li><li><kbd>M</kbd> Mute or unmute sounds</li><li><kbd>?</kbd> Show or hide this help</li><li><kbd>Esc</kbd> Close</li></ul><button className="btn" onClick={() => setHelp(false)}>Got it</button></div></div>}
    <div className="toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className={'toast' + (t.big ? ' big' : '')}><span className="te">{t.e}</span><div><b>{t.title}</b>{t.sub && <small>{t.sub}</small>}</div></div>)}</div>
    <div className="wrap">
      <header>
        <img className={'crest' + (spin ? ' spin' : '')} src="/logo.png" alt="Wise Owl School crest" onClick={crestClick} />
        <div><small className={cfg.crown ? 'crown' : ''}>Wise Owl School · Westgate{p.nick ? ` · Hi, ${p.nick}!` : ''}</small><h1 className="title">IGCSE Study Buddy</h1></div>
        <div className="stats">
          <button className="xp glow" onClick={() => changeTab('me')} aria-label="Your level and progress"><span className="lvl">{cur.e}</span><span><b>{cur.n}</b><span className="xpbar"><i style={{ width: pct + '%' }} /></span></span><span className="xpn"><CountUp to={p.xp} /> XP</span></button>
          <span className="pill"><span className={'flame' + (streak ? ' on' : '')}>🔥</span> {streak}-day streak</span>
          <span className="pill goal" title="Daily goal"><svg viewBox="0 0 36 36" width="26" height="26"><circle cx="18" cy="18" r="15" className="g0" /><circle cx="18" cy="18" r="15" className="g1" strokeDasharray="94.2" strokeDashoffset={94.2 * (1 - goalN / GOAL)} /></svg>{goalN}/{GOAL} today</span>
        </div>
      </header>

      <div className="ctl">
        <button onClick={toggleSound} aria-label={sound ? 'Mute sounds' : 'Turn sounds on'}>{sound ? '🔊' : '🔇'}</button>
        <button onClick={cycleMode} aria-label="Switch light or dark mode">{mode === 'auto' ? '🌗' : mode === 'dark' ? '🌙' : '☀️'}</button>
        {ACCENTS.map(([n, c]) => <button key={n} className={'dot' + (accent === n ? ' on' : '')} style={{ background: c }} aria-label={n + ' theme'} onClick={() => { setAccent(n); store.set('accent', n); document.documentElement.dataset.accent = n; sfx('pop') }} />)}
        {spinReady && <button className="gift" onClick={() => changeTab('me')} aria-label="Daily spin is ready">🎁</button>}
        {inst && <button onClick={() => { inst.prompt(); setInst(null) }} aria-label="Install as an app">📲</button>}
        <button onClick={() => setShare(true)} aria-label="Share with a QR code" title="Share / QR">📱</button>
        <button onClick={() => setPal(true)} aria-label="Open command palette" title="Ctrl+K">🔎</button>
        <button className={'rbbtn' + (rb ? ' on' : '')} onClick={rainbow} aria-label="Rainbow mode" aria-pressed={rb} title="Rainbow mode">🌈</button>
        <button className={board ? 'on' : ''} onClick={toggleBoard} aria-label="Big screen mode for smartboards" aria-pressed={board} title="Big screen mode">📺</button>
        <button onClick={fullscreen} aria-label="Toggle fullscreen">🖥️</button>
        <button onClick={() => setHelp(true)} aria-label="Keyboard shortcuts">⌨️</button>
        {days !== null && days >= 0 && <span className="pill exam">📅 {days === 0 ? 'Exam day!' : `${days} days to your exam`}</span>}
      </div>

      <Sky /><Ticker />
      <div className="daily"><span className="spark">💡</span><div><b>Today’s study tip</b><br /><span className="note">{tip}</span></div></div>

      <Daily subj={subj} />
      <div className="rail" role="group" aria-label="Subject">
        {Object.keys(SUBJ).map(n => <button key={n} className="chip" aria-pressed={n === subj} onClick={() => { setSubj(n); store.set('subj', n); sfx('pop') }}>{n}</button>)}
      </div>
      <div className="topic"><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional), for example: Quadratic equations, Photosynthesis, Rates of reaction" aria-label="Topic" /></div>

      <div className="tabs" role="tablist" ref={tabsRef}>
        {TABS.map(([k, l], i) => <button key={k} className="tab" role="tab" aria-selected={tab === k} title={`Shortcut: ${i + 1}`} onClick={() => changeTab(k)}>{l}</button>)}
        <span className="tab-ind" style={{ left: ind.l, width: ind.w }} />
      </div>
      <div className={'panel slide-' + dir} key={tab}>
        <div className="tip"><b>{subj} exam tip.</b> {SUBJ[subj]}</div>
        {tab === 'ask' && <Ask api={api} onMood={m => setMood(m)} seed={askSeed} />}
        {tab === 'quiz' && <Quiz api={api} onFinish={finishQuiz} onCombo={n => { if (n >= 2) { sfx('good'); if (n === 5) { confetti(0.7); say('Combo king! ⚡') } } }} level={`${cur.e} ${cur.n}`} />}
        {tab === 'cards' && <Cards api={api} onFinish={(k, t) => { award({ k: 'cards', known: k, total: t }); confetti(k / t >= 0.6 ? 1.2 : 0.5); sfx('win'); say('Deck complete!') }} />}
        {tab === 'exam' && <Exam api={api} />}
        {tab === 'focus' && <Focus sess={sessToday} onSession={min => { award({ k: 'session', min }); celebrate('stars', '⏱️'); confetti(1.2); sfx('win'); say('Focus session complete! Take a break.') }} />}
        {tab === 'plan' && <div><div className="seg" style={{ marginBottom: 14 }}><button aria-pressed={planTab === 'tasks'} onClick={() => setPlanTab('tasks')}>✅ Tasks</button><button aria-pressed={planTab === 'time'} onClick={() => setPlanTab('time')}>🗓 7-day timetable</button></div>
          {planTab === 'tasks' ? <Planner onDone={() => { award({ k: 'task' }); sfx('good') }} /> : <Timetable current={subj} />}</div>}
        {tab === 'tools' && <Tools api={api} />}
        {tab === 'play' && <Play api={api} setTopic={setTopic} />}
        {tab === 'lab' && <Lab api={api} />}
        {tab === 'track' && <Track api={api} />}
        {tab === 'boost' && <Boost api={api} />}
        {tab === 'weak' && <WeakSpots onExplain={(s, t) => { if (SUBJ[s]) { setSubj(s); store.set('subj', s) } setTopic(t); setAskSeed({ t: `I keep losing marks on "${t}" in ${s}. Explain it step by step, show how marks are earned in the exam, and end with a quick question to check I understand.`, n: Date.now() }); changeTab('ask') }} onQuiz={(s, t) => { if (SUBJ[s]) { setSubj(s); store.set('subj', s) } setTopic(t); changeTab('quiz') }} />}
        {tab === 'igcse' && <IgcseHub subj={subj} />}
        {tab === 'league' && <League api={api} />}
        {tab === 'me' && <Me api={api} pct={pct} />}
      </div>

      <footer>
        <div className="credit"><span>💡 Ideas by <b>Michael Makadzange</b></span><span>💻 Code by <b>Jayden Ngwenya</b>
          <svg className="tick" viewBox="0 0 24 24" aria-label="Verified"><path fill="#1d9bf0" d="M12 1.5l2.6 1.7 3.1-.2 1.3 2.8 2.7 1.5-.5 3.1 1.1 2.9-2 2.4-.2 3.1-3 .9-2 2.4-2.9-1.1-2.9 1.1-2-2.4-3-.9-.2-3.1-2-2.4 1.1-2.9-.5-3.1 2.7-1.5 1.3-2.8 3.1.2z" /><path d="M7.7 12.2l3 3 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span></div>
        <div><a className="aboutlink" href="/about">Meet the team ✨</a></div>
        Made for Wise Owl School Westgate · press <kbd>?</kbd> for shortcuts
      </footer>
    </div>
    <Mascot msg={msg} mood={mood} hat={cur.hat} />
  </>
}
