'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { rpc } from '@/lib/league'
import { ai } from '@/lib/api'
import { sfx, confetti } from '@/lib/fx'

type Q = { q: string; options: string[]; answer: number; explain: string }
const SHAPES = ['▲', '◆', '●', '■']
const blankQ = (): Q => ({ q: '', options: ['', '', '', ''], answer: 0, explain: '' })
const KEY = 'wob:lggame'

type Props = { code?: string; staff?: string; me?: { name: string } | null }
type Deck = { id: string; title: string; cards: { front: string; back: string }[] }
const PINKEY = 'wob:livepin'
const shuffleA = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
const linkFor = (pin: string) => `${location.origin}/?live=${pin}`

// Gizmo Live style: pick a deck or any topic, share a code / QR / link, race the clock for XP, bet on friends, then play round 2.
export default function Live({ code, staff, me }: Props) {
  const [game, setGame] = useState<{ pin: string; host: boolean } | null>(null)
  const [mode, setMode] = useState<'menu' | 'deck' | 'topic' | 'custom'>('menu'); const [pin, setPin] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [decks, setDecks] = useState<Deck[]>([]); const [topic, setTopic] = useState('')
  const [secs, setSecs] = useState(20); const [bets, setBets] = useState(true); const [playToo, setPlayToo] = useState(true); const [codeBox, setCodeBox] = useState(false)
  useEffect(() => {
    try { const g = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (g && g.pin) setGame(g); const lp = sessionStorage.getItem(PINKEY); if (lp && /^\d{6}$/.test(lp)) { setPin(lp); setCodeBox(true) } } catch {}
    try { setDecks(JSON.parse(localStorage.getItem('wob:decks') || '[]')) } catch {}
    return undefined
  }, [])
  const enter = (g: { pin: string; host: boolean } | null) => { setGame(g); try { if (g) sessionStorage.setItem(KEY, JSON.stringify(g)); else sessionStorage.removeItem(KEY); sessionStorage.removeItem(PINKEY) } catch {} }
  async function join(e: React.FormEvent) {
    e.preventDefault(); if (pin.trim().length < 6) { setErr('Enter the 6-digit game code.'); return } setBusy(true); setErr('')
    try { const r = await rpc('lg_game_join', { p_pin: pin.trim(), p_code: code }); if (!r.ok) setErr(r.error); else { sfx('good'); enter({ pin: pin.trim(), host: false }) } } catch (x: any) { setErr(x.message) }
    setBusy(false)
  }
  // Create the game straight away from a list of questions, then open the lobby with the code and QR.
  async function create(title: string, subject: string, qs: Q[]) {
    setBusy(true); setErr('')
    try {
      const r = await rpc('lg_game_create_g', { p_code: staff ? null : code, p_title: title, p_subject: subject, p_questions: qs, p_secs: secs, p_blind: false, p_bets: bets }, staff)
      if (!r.ok) { setErr(r.error); setBusy(false); return }
      if (!staff && playToo) { try { await rpc('lg_game_join', { p_pin: r.pin, p_code: code }) } catch {} }
      sfx('win'); enter({ pin: r.pin, host: true })
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  function fromDeck(d: Deck) {
    const ok = d.cards.filter(c => c.front.trim() && c.back.trim()); const backs = [...new Set(ok.map(c => c.back))]
    if (ok.length < 4 || backs.length < 4) { setErr('A deck needs at least 4 cards with different answers to make a live quiz.'); return }
    const qs: Q[] = shuffleA(ok).slice(0, 10).map(c => { const o = shuffleA(backs.filter(b => b !== c.back)).slice(0, 3); const opts = shuffleA([c.back, ...o]); return { q: c.front, options: opts, answer: opts.indexOf(c.back), explain: 'Answer: ' + c.back } })
    void create(d.title, '', qs)
  }
  async function fromTopic(e: React.FormEvent) {
    e.preventDefault(); const t = topic.trim(); if (t.length < 3) { setErr('Type a topic, e.g. Photosynthesis.'); return }
    setBusy(true); setErr('')
    try { const r = await ai({ mode: 'quiz', subject: t, topic: t, count: 10, difficulty: 'medium' }); setBusy(false); await create(t + ' quiz', t, r.data) } catch (x: any) { setErr(x.message); setBusy(false) }
  }
  if (game) return <Game pin={game.pin} host={game.host} code={code} staff={staff} onExit={() => { enter(null); setMode('menu'); setPin('') }} onSwitch={p => enter({ pin: p, host: game.host })} />
  if (mode === 'custom') return <Setup code={code} staff={staff} onBack={() => setMode('menu')} onCreated={p => enter({ pin: p, host: true })} />
  const Settings = <div className="gzset"><label>⏱️ Seconds per question<select value={secs} onChange={e => setSecs(Number(e.target.value))}>{[10, 15, 20, 30, 45, 60].map(x => <option key={x}>{x}</option>)}</select></label>
    <label className="switch"><input type="checkbox" checked={bets} onChange={e => setBets(e.target.checked)} /><span /> 🎲 Let players bet XP on each other</label>
    {!staff && <label className="switch"><input type="checkbox" checked={playToo} onChange={e => setPlayToo(e.target.checked)} /><span /> I want to play too</label>}</div>
  return <div className="gzmenu">
    {!staff && <p className="note">Playing as <b>{me?.name}</b>. You can join each game once.</p>}
    <h3 className="gzh">🎮 Live quiz</h3>
    {mode === 'menu' && <>
      <div className="gzopts">
        <button className="gzopt" onClick={() => { setMode('deck'); setErr('') }}><span>📚</span><b>Deck</b><small>Quiz on one of your decks</small></button>
        <button className="gzopt" onClick={() => { setMode('topic'); setErr('') }}><span>💡</span><b>Any topic</b><small>Type a topic, get a quiz</small></button>
        <button className="gzopt" onClick={() => { setCodeBox(true); setErr('') }}><span>🔑</span><b>Have a code?</b><small>Join a friend’s game</small></button></div>
      {codeBox && <form onSubmit={join} className="gzcodeform"><input className="pin" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="Game code" aria-label="Game code" autoComplete="off" autoFocus />
        <button className="btn" disabled={busy}>{busy ? 'Joining…' : 'Join'}</button></form>}
      <button className="linkish" onClick={() => setMode('custom')}>✍️ Write my own questions</button>
      <p className="note">{staff ? 'Teacher-hosted games earn full competition points.' : 'League points count when 3 or more play. There is no daily cap on live games.'} Players race the clock: faster correct answers earn more XP.</p></>}
    {mode === 'deck' && <><button className="linkish" onClick={() => setMode('menu')}>← Back</button><h4>Choose a deck</h4>
      {decks.length === 0 ? <p className="note">You have no decks yet. Open the <b>My Decks</b> tab, make one from your notes, then come back.</p> :
        <div className="gzdecks">{decks.map(d => <button key={d.id} className="gzdeck" disabled={busy} onClick={() => fromDeck(d)}><b>{d.title}</b><small>{d.cards.length} cards</small></button>)}</div>}{Settings}{busy && <div className="busy">Creating your game…</div>}</>}
    {mode === 'topic' && <><button className="linkish" onClick={() => setMode('menu')}>← Back</button><h4>Any topic</h4>
      <form onSubmit={fromTopic} className="gzcodeform"><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Photosynthesis, World War 1, Quadratic equations" aria-label="Topic" maxLength={80} autoFocus /><button className="btn" disabled={busy}>{busy ? 'Writing questions…' : 'Create game'}</button></form>{Settings}<p className="note">Wise Owl writes 10 questions. They can contain mistakes, so teachers should read them first.</p></>}
    {err && <div className="notice" role="alert">{err}</div>}
  </div>
}

function Setup({ code, staff, onBack, onCreated }: { code?: string; staff?: string; onBack: () => void; onCreated: (pin: string) => void }) {
  const [playToo, setPlayToo] = useState(true)
  const [title, setTitle] = useState(''); const [subject, setSubject] = useState(''); const [topic, setTopic] = useState(''); const [secs, setSecs] = useState(20)
  const [qs, setQs] = useState<Q[]>([]); const [paste, setPaste] = useState(''); const [err, setErr] = useState(''); const [gen, setGen] = useState(false); const [busy, setBusy] = useState(false)
  async function aiGen() {
    if (!subject.trim()) { setErr('Type a subject first, e.g. Biology.'); return } setGen(true); setErr('')
    try { const r = await ai({ mode: 'quiz', subject: subject.trim(), topic: topic.trim() || subject.trim(), count: 10, difficulty: 'medium' }); setQs(r.data); if (!title) setTitle((topic || subject) + ' quiz') } catch (e: any) { setErr(e.message) }
    setGen(false)
  }
  function imp() { try { const j = JSON.parse(paste); if (!Array.isArray(j)) throw 0; setQs(j.map((q: any) => ({ q: String(q.q || ''), options: (q.options || []).slice(0, 4).map(String), answer: Number(q.answer) || 0, explain: String(q.explain || '') }))); setPaste(''); setErr('') } catch { setErr('That is not a valid list of questions.') } }
  const set = (i: number, p: Partial<Q>) => setQs(qs.map((q, j) => j === i ? { ...q, ...p } : q))
  async function create() {
    setBusy(true); setErr('')
    try { const r = await rpc('lg_game_create_g', { p_code: staff ? null : code, p_title: title, p_subject: subject, p_questions: qs, p_secs: secs, p_blind: false, p_bets: true }, staff); if (!r.ok) setErr(r.error); else { if (!staff && playToo) { try { await rpc('lg_game_join', { p_pin: r.pin, p_code: code }) } catch {} } sfx('win'); onCreated(r.pin) } } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  return <div className="lgform"><button className="linkish" onClick={onBack}>← Back</button><h3>Create a live game</h3>
    <label>Game title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Cell biology showdown" /></label>
    <label>Subject<input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Biology" /></label>
    <label>Topic (for AI questions)<input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Photosynthesis" /></label>
    <label>Seconds per question<select value={secs} onChange={e => setSecs(Number(e.target.value))}>{[10, 15, 20, 30, 45, 60].map(s => <option key={s}>{s}</option>)}</select></label>
    {!staff && <label className="switch"><input type="checkbox" checked={playToo} onChange={e => setPlayToo(e.target.checked)} /><span /> I want to play too (answer on my own screen)</label>}
    <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn ghost" onClick={aiGen} disabled={gen}>{gen ? 'Writing…' : '✨ Write 10 questions with AI'}</button><span className="note">Read them through before you start.</span></div>
    <details><summary>Paste questions (JSON)</summary><textarea rows={4} value={paste} onChange={e => setPaste(e.target.value)} placeholder='[{"q":"...","options":["a","b","c","d"],"answer":0}]' /><button className="btn ghost" onClick={imp}>Import</button></details>
    {qs.map((q, i) => <div key={i} className="q"><b>Question {i + 1}</b> <button className="linkish" onClick={() => setQs(qs.filter((_, j) => j !== i))}>remove</button>
      <input value={q.q} onChange={e => set(i, { q: e.target.value })} placeholder="Question" />
      {q.options.map((o, j) => <div key={j} className="row" style={{ justifyContent: 'flex-start' }}><input type="radio" name={'lc' + i} checked={q.answer === j} onChange={() => set(i, { answer: j })} aria-label={'Correct answer ' + (j + 1)} /><input className="grow" value={o} onChange={e => set(i, { options: q.options.map((x, k) => k === j ? e.target.value : x) })} placeholder={'Option ' + (j + 1)} /></div>)}
      <input value={q.explain} onChange={e => set(i, { explain: e.target.value })} placeholder="Why it is correct (optional)" /></div>)}
    <button className="btn ghost" onClick={() => setQs([...qs, blankQ()])} disabled={qs.length >= 30}>+ Add a question by hand</button>
    {err && <div className="notice">{err}</div>}
    <button className="btn" onClick={create} disabled={busy || !qs.length || title.trim().length < 2}>{busy ? 'Creating…' : `Create game (${qs.length} questions)`}</button></div>
}

type Row = { who: string; score: number; correct: number; rank: number }
const medal = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r
const Board = ({ rows }: { rows: Row[] }) => <div className="lgtable">{rows.map(r => <div key={r.who + r.rank} className={'lgrow r' + Math.min(r.rank, 4)}><b className="lgrank">{medal(r.rank)}</b><span className="lgname">{r.who}</span><b className="lgpts">{r.score}</b></div>)}</div>
const Podium = ({ rows }: { rows: Row[] }) => <div className="podium">{[1, 0, 2].map(i => rows[i] && <div key={i} className={'pod p' + (i + 1)}><span className="pn">{rows[i].who}</span><span className="ps">{rows[i].score}</span><div className="pb">{['🥇', '🥈', '🥉'][i]}</div></div>)}</div>

// The countdown owns its own fast clock so the rest of the screen only redraws when the game state really changes.
function Timer({ secs, getLeft, onZero, show }: { secs: number; getLeft: () => number; onZero: () => void; show: 'bar' | 'text' }) {
  const [l, setL] = useState(getLeft()); const fired = useRef(false)
  useEffect(() => { fired.current = false; const id = setInterval(() => { const v = getLeft(); setL(v); if (v <= 0 && !fired.current) { fired.current = true; onZero() } }, 100); return () => clearInterval(id) }, [getLeft, onZero])
  return show === 'bar' ? <div className="timerbar" aria-hidden><i style={{ width: `${(l / secs) * 100}%` }} /></div> : <span>{Math.ceil(l)}s</span>
}

function Lobby({ s, pin, host, staff, busy, err, act, joinSelf, onExit }: { s: any; pin: string; host: boolean; staff?: string; busy: boolean; err: string; act: (a: string) => Promise<any>; joinSelf: () => void; onExit: () => void }) {
  const [qr, setQr] = useState(''); const [msg, setMsg] = useState('')
  useEffect(() => { let on = true; import('qrcode').then(m => m.toDataURL(linkFor(pin), { width: 300, margin: 1, color: { dark: '#14183a', light: '#ffffff' } })).then(d => { if (on) setQr(d) }).catch(() => {}); return () => { on = false } }, [pin])
  const min = staff ? 1 : 2
  async function copy(t: string, m: string) { try { await navigator.clipboard.writeText(t); setMsg(m) } catch { setMsg('Could not copy') } setTimeout(() => setMsg(''), 2200) }
  return <div className="gzlobby">
    <div className="gzcode"><small>Game code</small><b aria-label={'Game code ' + pin.split('').join(' ')}>{pin}</b></div>
    {host && <div className="gzshare">{qr && <img src={qr} alt="QR code to join the game" width={150} height={150} />}
      <div><p className="note">Players go to the Live quiz tab and enter the code, scan the QR code, or open the link.</p>
        <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn ghost sm" onClick={() => copy(pin, 'Code copied')}>📋 Copy code</button><button className="btn ghost sm" onClick={() => copy(linkFor(pin), 'Invite link copied')}>🔗 Copy invite link</button></div>{msg && <p className="note" role="status">{msg}</p>}</div></div>}
    <h4 className="center">{s.title}</h4>
    <p className="note center">{s.total} questions · {s.secs}s each{s.gz?.bets_on ? ' · 🎲 betting on' : ''}</p>
    <div className="pchips">{s.names.length ? s.names.map((n: string, i: number) => <span key={n + i} className="pchip pop">{n}</span>) : <span className="note">Waiting for players to join…</span>}</div>
    <p className="center"><b>{s.players}</b> player{s.players === 1 ? '' : 's'} in the lobby</p>
    {host ? <><div className="row"><button className="btn big" onClick={() => act('start')} disabled={busy || s.players < min}>{s.players < min ? `Need ${min} players to start` : `▶ Start game (${s.players})`}</button>
        {!staff && !s.me && <button className="btn ghost" onClick={joinSelf}>Join as a player too</button>}
        <button className="btn ghost" onClick={() => { if (confirm('Cancel this game?')) act('end').then(onExit) }}>Cancel</button></div></>
      : <p className="center">You’re in! Waiting for the host to start… 👀</p>}{err && <div className="notice">{err}</div>}</div>
}

function BetPanel({ s, pin, code, poll }: { s: any; pin: string; code?: string; poll: () => Promise<void> }) {
  const gz = s.gz; const [seat, setSeat] = useState(0); const [pred, setPred] = useState(true); const [stake, setStake] = useState(100); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const score = s.me?.score || 0; const cap = Math.max(100, score)
  const open = (gz.seats as any[]).filter(x => x.seat !== gz.my_seat && !x.answered)
  if (gz.bet) return <div className="gzbet placed">🎲 You bet <b>{gz.bet.stake}</b> XP that <b>{gz.bet.who}</b> gets it <b>{gz.bet.predict ? 'right' : 'wrong'}</b>. Result after the answer!</div>
  if (!open.length) return <div className="gzbet note">🎲 Everyone else has answered, so no one is left to bet on.</div>
  async function place() {
    if (!seat) { setMsg('Pick a player first.'); return } setBusy(true); setMsg('')
    try { const r = await rpc('lg_game_bet', { p_pin: pin, p_code: code, p_seat: seat, p_predict: pred, p_stake: stake }); if (!r.ok) setMsg(r.error); else { sfx('good'); await poll() } } catch (e: any) { setMsg(e.message) }
    setBusy(false)
  }
  return <div className="gzbet"><b>🎲 Bet XP on a player</b><p className="note">Will they get this question right? Win the stake if you are correct, lose it if not.</p>
    <div className="gzseats">{open.map(x => <button key={x.seat} className={seat === x.seat ? 'on' : ''} onClick={() => setSeat(x.seat)}>{x.who}</button>)}</div>
    <div className="gzpred"><button className={pred ? 'on' : ''} onClick={() => setPred(true)}>✅ Gets it right</button><button className={!pred ? 'on' : ''} onClick={() => setPred(false)}>❌ Gets it wrong</button></div>
    <div className="gzstakes">{[100, 250, 500].map(v => <button key={v} className={stake === v ? 'on' : ''} disabled={v > cap} onClick={() => setStake(v)}>{v} XP</button>)}</div>
    <button className="btn" onClick={place} disabled={busy || !seat}>Place bet</button>{msg && <p className="note" role="alert">{msg}</p>}</div>
}

function Review({ pin, code, onSubject }: { pin: string; code?: string; onSubject?: string }) {
  const [items, setItems] = useState<any[] | null>(null); const [subject, setSubject] = useState(''); const [exp, setExp] = useState<Record<number, string>>({}); const [load, setLoad] = useState(-1)
  useEffect(() => { rpc('lg_game_review', { p_pin: pin, p_code: code }).then(r => { if (r.ok) { setItems(r.items); setSubject(r.subject || onSubject || '') } }).catch(() => {}); return undefined }, [pin, code]) // eslint-disable-line
  async function explain(i: number) {
    const it = items![i]; if (exp[i]) { setExp(e => { const { [i]: _, ...r } = e; return r }); return } setLoad(i)
    try { const j = await ai({ mode: 'chat', style: 'simple', subject: subject || 'Anything', topic: '', messages: [{ role: 'user', content: `Explain this quiz question simply. Question: ${it.q}\nOptions: ${it.options.join(' | ')}\nCorrect answer: ${it.options[it.answer]}\n${it.choice != null ? 'The student chose: ' + it.options[it.choice] : 'The student did not answer.'}\nExplain why the correct answer is right and why the other options are wrong, in under 120 words.` }] }); setExp(e => ({ ...e, [i]: j.text })) } catch { setExp(e => ({ ...e, [i]: it.explain || 'Could not load an explanation right now.' })) }
    setLoad(-1)
  }
  if (!items) return null
  return <div className="gzrev"><h3>Your answers</h3>{items.map((it, i) => { const ok = it.choice === it.answer
    return <div key={i} className={'gzri ' + (it.choice == null ? 'skip' : ok ? 'ok' : 'no')}><div className="gzrq"><span>{it.choice == null ? '⏱️' : ok ? '✅' : '❌'}</span><b>{it.q}</b></div>
      <p className="note">{ok ? <>Correct: {it.options[it.answer]} · +{it.points} XP{it.ms != null ? ` · ${(it.ms / 1000).toFixed(1)}s` : ''}</> : <>{it.choice != null && <>You chose: {it.options[it.choice]}. </>}Right answer: <b>{it.options[it.answer]}</b></>}</p>
      <button className="linkish" onClick={() => explain(i)} disabled={load === i}>{load === i ? 'Thinking…' : exp[i] ? 'Hide explanation' : '💡 Explain'}</button>{exp[i] && <div className="why">{exp[i]}</div>}</div> })}</div>
}

function Game({ pin, host, code, staff, onExit, onSwitch }: { pin: string; host: boolean; code?: string; staff?: string; onExit: () => void; onSwitch: (pin: string) => void }) {
  const [s, setS] = useState<any>(null); const [err, setErr] = useState(''); const [picked, setPicked] = useState(-1); const [busy, setBusy] = useState(false); const [took, setTook] = useState(0); const [next, setNext] = useState('')
  const leftRef = useRef(0); const recv = useRef(0); const last = useRef(''); const lastPhase = useRef(''); const auto = useRef(''); const polling = useRef(false)
  const bearer = host ? staff : undefined
  const getLeft = useCallback(() => Math.max(0, leftRef.current - (Date.now() - recv.current) / 1000), [])
  const poll = useCallback(async () => {
    if (polling.current) return; polling.current = true
    try {
      const r = await rpc('lg_game_state_g', { p_pin: pin, p_code: code ?? null, p_host: host }, bearer)
      if (!r.ok) setErr(r.error); else {
        leftRef.current = r.left; recv.current = Date.now(); setErr('')
        const { left, ...rest } = r; const sig = JSON.stringify(rest)
        if (sig !== last.current) { last.current = sig; setS(r) }
      }
    } catch { /* keep trying */ }
    polling.current = false
  }, [pin, code, host, bearer])
  useEffect(() => { void poll(); const id = setInterval(() => { if (!document.hidden) void poll() }, host ? 800 : 1000); return () => clearInterval(id) }, [poll, host])
  const key = s ? s.phase + ':' + s.qidx : ''
  const canAnswer = !!s?.me && (!host || !s?.hosted_by_staff)
  useEffect(() => {
    if (!s) return undefined
    if (key !== lastPhase.current) {
      if (s.phase === 'question') { setPicked(-1); setTook(0); sfx('pop') }
      if (s.phase === 'reveal' && s.me) sfx(s.me.right ? 'good' : 'bad')
      if (s.phase === 'finished') { sfx('win'); confetti(host || (s.me && s.me.rank <= 3) ? 1.6 : 0.8) }
      lastPhase.current = key
    }
    return undefined
  }, [key]) // eslint-disable-line
  // Round 2: when the host starts another round, everyone is moved to the new game automatically.
  useEffect(() => {
    if (!s || s.phase !== 'finished') return undefined
    const id = setInterval(async () => { try { const r = await rpc('lg_game_next', { p_pin: pin }); if (r.next_pin) { setNext(r.next_pin); clearInterval(id) } } catch {} }, 2000)
    return () => clearInterval(id)
  }, [s?.phase, pin]) // eslint-disable-line
  useEffect(() => { if (!next) return undefined; const t = setTimeout(() => onSwitch(next), host ? 300 : 2500); return () => clearTimeout(t) }, [next]) // eslint-disable-line
  const act = useCallback(async (a: string) => { setBusy(true); try { const r = await rpc('lg_game_host', { p_pin: pin, p_code: code ?? null, p_action: a }, bearer); if (!r.ok) setErr(r.error); await poll(); return r } catch (e: any) { setErr(e.message) } finally { setBusy(false) } }, [pin, code, bearer, poll])
  async function round2() { setBusy(true); try { const r = await rpc('lg_game_rematch', { p_pin: pin, p_code: code ?? null }, bearer); if (!r.ok) setErr(r.error); else setNext(r.pin) } catch (e: any) { setErr(e.message) } setBusy(false) }
  // As soon as everyone has answered, the host's screen moves on to the answer reveal.
  useEffect(() => {
    if (host && s && s.phase === 'question' && s.players > 0 && s.answered >= s.players && auto.current !== key) { auto.current = key; void act('reveal') }
    return undefined
  }, [s]) // eslint-disable-line
  const onZero = useCallback(() => { void poll() }, [poll])
  async function answer(i: number) {
    if (picked >= 0 || !s) return; setPicked(i); setTook(Math.round((s.secs - getLeft()) * 10) / 10); sfx('pop')
    try { const r = await rpc('lg_game_answer', { p_pin: pin, p_code: code, p_choice: i }); if (!r.ok) setErr(r.error); void poll() } catch (e: any) { setErr(e.message) }
  }
  async function joinSelf() { try { const r = await rpc('lg_game_join', { p_pin: pin, p_code: code }); if (!r.ok) setErr(r.error); await poll() } catch (e: any) { setErr(e.message) } }
  if (!s) return <div>{err ? <div className="notice">{err} <button className="linkish" onClick={onExit}>Leave</button></div> : <div className="busy">Connecting…</div>}</div>
  const q = s.question; const isQ = s.phase === 'question'; const board: Row[] = s.board; const gz = s.gz || {}
  const Head = <div className="gzbar"><div><b>{s.title}</b><span className="note">{s.qidx >= 0 && s.phase !== 'finished' ? `Question ${s.qidx + 1} of ${s.total}` : `${s.total} questions`} · {s.players} player{s.players === 1 ? '' : 's'}</span></div>
    {s.me && <div className="gzxp" aria-label={`Your XP ${s.me.score}`}><small>XP</small><b key={s.me.score}>{s.me.score}</b></div>}</div>
  const MeRow = s.me && s.me.rank > board.length && board.length > 0 ? <div className="lgrow me"><b className="lgrank">{s.me.rank}</b><span className="lgname">You</span><b className="lgpts">{s.me.score}</b></div> : null

  if (s.phase === 'finished') return <div className="game">{Head}<h2 className="center">🏁 Game over!</h2><Podium rows={board} />{board.length > 3 && <Board rows={board.slice(3)} />}
    {s.me && <div className="resultme"><b>You finished #{s.me.rank}</b> with {s.me.score} XP · {s.me.correct_total} correct{s.counts ? (s.me.league_points > 0 ? <> · <b>+{s.me.league_points} league points</b> 🛡️</> : <span className="note"> · no league points this time (classmate-hosted games need 3 or more players)</span>) : ''}</div>}
    {host && s.counts && <p className="note">League points have been added for players.</p>}
    {next && !host && <div className="resultme ok">🔁 Round 2 is starting… joining you now!</div>}
    <div className="row">{host && !next && <button className="btn big" onClick={round2} disabled={busy}>🔁 Start round 2</button>}<button className="btn ghost" onClick={onExit}>Done</button></div>
    {err && <div className="notice">{err}</div>}{s.me && <Review pin={pin} code={code} />}</div>

  if (s.phase === 'lobby') return <div className="game">{Head}<Lobby s={s} pin={pin} host={host} staff={staff} busy={busy} err={err} act={act} joinSelf={joinSelf} onExit={onExit} /></div>

  const mine = (i: number) => canAnswer && (s.phase === 'reveal' ? s.me?.choice === i : picked === i)
  const rev = s.phase === 'reveal'; const hasAnswered = picked >= 0 || !!s.me?.answered
  return <div className="game">{Head}{isQ && <Timer secs={s.secs} getLeft={getLeft} onZero={onZero} show="bar" />}
    {q ? <h2 className="gameq" key={s.qidx}>{q.q}</h2> : <p className="center note">🙈 The question is hidden on the host screen.</p>}
    {isQ && <div className="center note">{host ? `${s.answered} of ${s.players} answered · ` : ''}<Timer secs={s.secs} getLeft={getLeft} onZero={onZero} show="text" /></div>}
    {isQ && gz.first && <p className="gzfeed" key={gz.first.who}>⚡ <b>{gz.first.who}</b> answered first!</p>}
    <div className="answers">{q && q.options.map((o: string, i: number) => {
      const right = rev && q.answer === i
      return <button key={i} disabled={!canAnswer || !isQ || hasAnswered} onClick={() => answer(i)} className={'ans a' + i + (right ? ' right' : rev ? ' dim' : '') + (mine(i) ? ' mine' : '')} aria-label={`Answer ${i + 1}: ${o}`}>
        <span className="shape">{SHAPES[i]}</span><span className="at">{o}</span>{rev && <span className="cnt">{q.dist[i]}</span>}{right && <span className="tick">✓</span>}</button>
    })}</div>
    {canAnswer && isQ && hasAnswered && <p className="center gzlock">Locked in{took ? ` in ${took}s` : ''}! Waiting for the others…</p>}
    {canAnswer && isQ && gz.bets_on && gz.my_seat && <BetPanel s={s} pin={pin} code={code} poll={poll} />}
    {canAnswer && rev && <div className={'resultme gzres ' + (s.me?.right ? 'ok' : 'no')}>{s.me?.answered ? (s.me.right ? <>✅ <b>Correct!</b> +{s.me.points} XP{took ? ` · ${took}s` : ''}</> : <>❌ <b>Not this time</b> · 0 XP{q ? <> · Right answer: <b>{q.options[q.answer]}</b></> : null}</>) : <>⏱️ <b>No answer</b>{q ? <> · Right answer: <b>{q.options[q.answer]}</b></> : null}</>} · You are #{s.me?.rank} with {s.me?.score} XP</div>}
    {rev && gz.bet && gz.bet.result != null && <div className={'gzbet placed ' + (gz.bet.result >= 0 ? 'win' : 'lose')}>🎲 Your bet on <b>{gz.bet.who}</b>: <b>{gz.bet.result >= 0 ? '+' : ''}{gz.bet.result} XP</b></div>}
    {rev && gz.fastest_right && <p className="gzfeed">🏎️ Fastest correct answer: <b>{gz.fastest_right.who}</b> ({(gz.fastest_right.ms / 1000).toFixed(1)}s)</p>}
    {rev && q?.explain && <p className="why"><b>Why:</b> {q.explain}</p>}
    {rev && gz.bets && gz.bets.length > 0 && <div className="gzbets"><b>🎲 Bets this round</b>{gz.bets.slice(0, 5).map((b: any, i: number) => <p key={i} className="note">{b.by} bet {b.stake} on {b.on} to be {b.predict ? 'right' : 'wrong'}: <b className={b.result >= 0 ? 'up' : 'dn'}>{b.result >= 0 ? '+' : ''}{b.result}</b></p>)}</div>}
    {rev && <><h4 className="center">🏆 Leaderboard</h4><Board rows={board} />{MeRow}</>}
    {host && <div className="row">{isQ ? <button className="btn ghost" onClick={() => act('reveal')} disabled={busy}>Show answer now</button> :
      <button className="btn" onClick={() => act('next')} disabled={busy}>{s.qidx + 1 >= s.total ? 'Finish & show podium' : 'Next question →'}</button>}
      <button className="linkish" onClick={() => { if (confirm('End the game now?')) act('end') }}>End game</button></div>}
    {err && <div className="notice">{err}</div>}</div>
}
