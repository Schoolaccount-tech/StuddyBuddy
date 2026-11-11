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

export default function Live({ code, staff, me }: Props) {
  const [game, setGame] = useState<{ pin: string; host: boolean } | null>(null)
  const [mode, setMode] = useState<'menu' | 'join' | 'host'>('menu'); const [pin, setPin] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { try { const g = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (g && g.pin) setGame(g) } catch {} return undefined }, [])
  const enter = (g: { pin: string; host: boolean } | null) => { setGame(g); try { if (g) sessionStorage.setItem(KEY, JSON.stringify(g)); else sessionStorage.removeItem(KEY) } catch {} }
  async function join(e: React.FormEvent) {
    e.preventDefault(); if (pin.trim().length < 6) { setErr('Enter the 6-digit game PIN.'); return } setBusy(true); setErr('')
    try { const r = await rpc('lg_game_join', { p_pin: pin.trim(), p_code: code }); if (!r.ok) setErr(r.error); else { sfx('good'); enter({ pin: pin.trim(), host: false }) } } catch (x: any) { setErr(x.message) }
    setBusy(false)
  }
  if (game) return <Game pin={game.pin} host={game.host} code={code} staff={staff} onExit={() => { enter(null); setMode('menu'); setPin('') }} />
  if (mode === 'host') return <Setup code={code} staff={staff} onBack={() => setMode('menu')} onCreated={p => enter({ pin: p, host: true })} />
  return <div className="livemenu">
    {!staff && <p className="note">Playing as <b>{me?.name}</b>. You can join each game once.</p>}
    <form onSubmit={join} className="livejoin"><h3>🎮 Join a live game</h3><p className="note">Enter the PIN shown on the host’s screen.</p>
      <input className="pin" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="Game PIN" aria-label="Game PIN" autoComplete="off" />
      <button className="btn" disabled={busy}>{busy ? 'Joining…' : 'Join'}</button>{err && <div className="notice">{err}</div>}</form>
    <div className="livehost"><h3>📺 Host a game</h3><p className="note">{staff ? 'Teacher-hosted games earn full competition points.' : 'Run a game for your friends. Practice points count when 3 or more play, up to the daily cap.'}</p>
      <button className="btn ghost" onClick={() => setMode('host')}>Create a game</button></div></div>
}

function Setup({ code, staff, onBack, onCreated }: { code?: string; staff?: string; onBack: () => void; onCreated: (pin: string) => void }) {
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
    try { const r = await rpc('lg_game_create', { p_code: staff ? null : code, p_title: title, p_subject: subject, p_questions: qs, p_secs: secs }, staff); if (!r.ok) setErr(r.error); else { sfx('win'); onCreated(r.pin) } } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  return <div className="lgform"><button className="linkish" onClick={onBack}>← Back</button><h3>Create a live game</h3>
    <label>Game title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Cell biology showdown" /></label>
    <label>Subject<input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Biology" /></label>
    <label>Topic (for AI questions)<input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Photosynthesis" /></label>
    <label>Seconds per question<select value={secs} onChange={e => setSecs(Number(e.target.value))}>{[10, 15, 20, 30, 45, 60].map(s => <option key={s}>{s}</option>)}</select></label>
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

function Game({ pin, host, code, staff, onExit }: { pin: string; host: boolean; code?: string; staff?: string; onExit: () => void }) {
  const [s, setS] = useState<any>(null); const [err, setErr] = useState(''); const [now, setNow] = useState(0); const recv = useRef(0); const lastPhase = useRef(''); const auto = useRef(''); const [picked, setPicked] = useState(-1); const [busy, setBusy] = useState(false)
  const bearer = host ? staff : undefined
  const poll = useCallback(async () => {
    try { const r = await rpc('lg_game_state', { p_pin: pin, p_code: code ?? null, p_host: host }, bearer); if (!r.ok) setErr(r.error); else { recv.current = Date.now(); setErr(''); setS(r) } } catch { /* keep trying */ }
  }, [pin, code, host, bearer])
  useEffect(() => { void poll(); const id = setInterval(() => { if (!document.hidden) void poll() }, host ? 1000 : 1200); return () => clearInterval(id) }, [poll, host])
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(id) }, [])
  const key = s ? s.phase + ':' + s.qidx : ''
  useEffect(() => {
    if (!s) return undefined
    if (key !== lastPhase.current) {
      if (s.phase === 'question') { setPicked(-1); sfx('pop') }
      if (s.phase === 'reveal' && !host) sfx(s.me?.right ? 'good' : 'bad')
      if (s.phase === 'finished') { sfx('win'); confetti(host || (s.me && s.me.rank <= 3) ? 1.6 : 0.8) }
      lastPhase.current = key
    }
    return undefined
  }, [key]) // eslint-disable-line
  async function act(a: string) { setBusy(true); try { const r = await rpc('lg_game_host', { p_pin: pin, p_code: code ?? null, p_action: a }, bearer); if (!r.ok) setErr(r.error); await poll() } catch (e: any) { setErr(e.message) } setBusy(false) }
  // The host's screen moves to the answer reveal as soon as everyone has answered.
  useEffect(() => {
    if (host && s && s.phase === 'question' && s.players > 0 && s.answered >= s.players && auto.current !== key) { auto.current = key; void act('reveal') }
    return undefined
  }, [s]) // eslint-disable-line
  async function answer(i: number) {
    if (picked >= 0 || !s) return; setPicked(i); sfx('pop')
    try { const r = await rpc('lg_game_answer', { p_pin: pin, p_code: code, p_choice: i }); if (!r.ok) setErr(r.error) } catch (e: any) { setErr(e.message) }
  }
  if (!s) return <div>{err ? <div className="notice">{err} <button className="linkish" onClick={onExit}>Leave</button></div> : <div className="busy">Connecting…</div>}</div>
  const left = s.phase === 'question' ? Math.max(0, s.left - (now - recv.current) / 1000) : 0
  const q = s.question
  const Bar = <div className="timerbar" aria-hidden><i style={{ width: `${s.phase === 'question' ? (left / s.secs) * 100 : 0}%` }} /></div>
  const Head = <div className="gamehead"><b>{s.title}</b><span className="note">{s.qidx >= 0 && s.phase !== 'finished' ? `Question ${s.qidx + 1} of ${s.total}` : `${s.total} questions`} · {s.players} player{s.players === 1 ? '' : 's'}</span></div>
  const Board = ({ rows }: { rows: any[] }) => <div className="lgtable">{rows.map((r, i) => <div key={i} className={'lgrow r' + Math.min(r.rank, 4)}><b className="lgrank">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</b><span className="lgname">{r.who}</span><b className="lgpts">{r.score}</b></div>)}</div>
  const Podium = () => <div className="podium">{[1, 0, 2].map(i => s.board[i] && <div key={i} className={'pod p' + (i + 1)}><span className="pn">{s.board[i].who}</span><span className="ps">{s.board[i].score}</span><div className="pb">{['🥇', '🥈', '🥉'][i]}</div></div>)}</div>

  if (s.phase === 'finished') return <div className="game">{Head}<h2 className="center">🏁 Game over!</h2><Podium />{s.board.length > 3 && <Board rows={s.board.slice(3)} />}
    {s.me && <div className="resultme"><b>You finished #{s.me.rank}</b> with {s.me.score} points · {s.me.correct_total} correct{s.counts ? (s.me.league_points > 0 ? <> · <b>+{s.me.league_points} league points</b> 🛡️</> : <span className="note"> · no league points this time (needs 3+ players, or your daily practice cap is reached)</span>) : ''}</div>}
    {host && s.counts && <p className="note">League points have been added for players.</p>}<div className="row"><button className="btn" onClick={onExit}>Done</button></div></div>

  if (s.phase === 'lobby') return <div className="game">{Head}
    <div className="bigpin"><small>Game PIN</small><b>{pin}</b></div>
    <div className="chips">{s.names.length ? s.names.map((n: string, i: number) => <span key={i} className="chip">{n}</span>) : <span className="note">Waiting for players to join…</span>}</div>
    {host ? <div className="row"><button className="btn" onClick={() => act('start')} disabled={busy || s.players < 1}>Start game ({s.players})</button><button className="btn ghost" onClick={() => { if (confirm('Cancel this game?')) act('end').then(onExit) }}>Cancel</button></div>
      : <p className="center">You’re in{me_name(s)}! Watch the host’s screen. 👀</p>}{err && <div className="notice">{err}</div>}</div>

  const isQ = s.phase === 'question'
  return <div className="game">{Head}{isQ && Bar}
    {q && <h2 className="gameq">{q.q}</h2>}
    {isQ && host && <div className="center note">{s.answered} of {s.players} answered · {Math.ceil(left)}s</div>}
    {isQ && !host && <div className="center note">{Math.ceil(left)}s</div>}
    <div className="answers">{q && q.options.map((o: string, i: number) => {
      const rev = s.phase === 'reveal'; const right = rev && q.answer === i; const mine = !host && (rev ? s.me?.choice === i : picked === i)
      return <button key={i} disabled={host || !isQ || picked >= 0} onClick={() => answer(i)} className={'ans a' + i + (right ? ' right' : rev ? ' dim' : '') + (mine ? ' mine' : '')} aria-label={`Answer ${i + 1}: ${o}`}>
        <span className="shape">{SHAPES[i]}</span><span className="at">{o}</span>{rev && <span className="cnt">{q.dist[i]}</span>}{right && <span className="tick">✓</span>}</button>
    })}</div>
    {!host && isQ && picked >= 0 && <p className="center">Locked in! Waiting for the others…</p>}
    {!host && s.phase === 'reveal' && <div className={'resultme ' + (s.me?.right ? 'ok' : 'no')}>{s.me?.answered ? (s.me.right ? <>✅ Correct! <b>+{s.me.points}</b></> : '❌ Not this time') : '⏱️ No answer'} · You are #{s.me?.rank} with {s.me?.score}</div>}
    {s.phase === 'reveal' && q?.explain && <p className="why"><b>Why:</b> {q.explain}</p>}
    {s.phase === 'reveal' && <Board rows={s.board.slice(0, 5)} />}
    {host && <div className="row">{isQ ? <button className="btn ghost" onClick={() => act('reveal')} disabled={busy}>Show answer now</button> :
      <button className="btn" onClick={() => act('next')} disabled={busy}>{s.qidx + 1 >= s.total ? 'Finish & show podium' : 'Next question →'}</button>}
      <button className="linkish" onClick={() => { if (confirm('End the game now?')) act('end') }}>End game</button></div>}
    {err && <div className="notice">{err}</div>}</div>
}
const me_name = (_: any) => ''
