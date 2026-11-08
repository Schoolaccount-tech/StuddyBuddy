'use client'
import { useEffect, useRef, useState } from 'react'
import { store } from '@/lib/api'
import { sfx, confetti, celebrate } from '@/lib/fx'
import { BANK, TF, TERMS, SLOT_ICONS } from '@/lib/more'
import type { Api } from './api'

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const terms = (s: string) => TERMS[s] || TERMS['Mathematics']
const best = (k: string) => store.get<number>('best:' + k, 0)
const setBest = (k: string, v: number) => { if (v > best(k)) { store.set('best:' + k, v); return true } return false }

/* 1. Daily 5: five instant questions from the built-in bank, no AI needed. */
function Daily5({ api }: { api: Api }) {
  const [qs, setQs] = useState<typeof BANK>([]); const [i, setI] = useState(0); const [sel, setSel] = useState<number | null>(null); const [right, setRight] = useState(0); const [done, setDone] = useState(false)
  function start() {
    const mine = shuffle(BANK.filter(b => b.s === api.subj)), rest = shuffle(BANK.filter(b => b.s !== api.subj))
    setQs([...mine, ...rest].slice(0, 5)); setI(0); setSel(null); setRight(0); setDone(false); sfx('pop')
  }
  function pick(n: number) {
    if (sel !== null) return; setSel(n); const ok = n === qs[i].a; if (ok) { setRight(r => r + 1); sfx('good') } else sfx('bad')
  }
  function next() {
    if (i + 1 >= qs.length) { setDone(true); const r = right; api.award({ k: 'bonus', xp: r * 4 + 2 }); if (setBest('d5', r)) api.toast('🏅', 'New personal best!', `${r}/5 in Daily 5`); if (r === 5) celebrate('fireworks'); else confetti(0.8); sfx('win') }
    else { setI(i + 1); setSel(null) }
  }
  if (!qs.length) return <div className="center"><p className="note">Five quick questions from your subject. Instant, no waiting for AI.</p><button className="btn" onClick={start}>Start Daily 5</button><p className="note">Best: {best('d5')}/5</p></div>
  if (done) return <div className="center"><div className="big-score">{right}/5</div><p>{right === 5 ? 'Perfect! 🏆' : right >= 3 ? 'Nice work! 🎉' : 'Keep going, you will get there 💪'}</p><button className="btn" onClick={start}>Play again</button></div>
  const q = qs[i]
  return <div><div className="note">Question {i + 1} of 5 · {right} correct</div><div className="pbar"><i style={{ width: `${(i / 5) * 100}%` }} /></div>
    <h3 style={{ margin: '14px 0' }}>{q.q}</h3>
    {q.o.map((o, n) => <button key={n} className={'opt' + (sel !== null ? (n === q.a ? ' right' : n === sel ? ' wrong' : '') : '')} disabled={sel !== null} onClick={() => pick(n)}>{o}</button>)}
    {sel !== null && <div className="row" style={{ marginTop: 14 }}><button className="btn" onClick={next}>{i + 1 >= 5 ? 'See result' : 'Next'}</button></div>}</div>
}

/* 2. Memory match: flip cards to pair each term with its meaning. */
function Memory({ api }: { api: Api }) {
  type C = { id: number; pair: number; text: string; kind: 't' | 'd' }
  const [cards, setCards] = useState<C[]>([]); const [open, setOpen] = useState<number[]>([]); const [done, setDone] = useState<number[]>([]); const [moves, setMoves] = useState(0)
  function start() {
    const pick = shuffle(terms(api.subj)).slice(0, 6); const cs: C[] = []
    pick.forEach((t, i) => { cs.push({ id: i * 2, pair: i, text: t[0].charAt(0) + t[0].slice(1).toLowerCase(), kind: 't' }, { id: i * 2 + 1, pair: i, text: t[1], kind: 'd' }) })
    setCards(shuffle(cs)); setOpen([]); setDone([]); setMoves(0); sfx('pop')
  }
  function flip(id: number) {
    if (open.length >= 2 || open.includes(id) || done.includes(id)) return
    const o = [...open, id]; setOpen(o); sfx('pop')
    if (o.length === 2) {
      setMoves(m => m + 1); const a = cards.find(c => c.id === o[0]), b = cards.find(c => c.id === o[1])
      if (a && b && a.pair === b.pair) { setTimeout(() => { setDone(d => { const n = [...d, ...o]; if (n.length === cards.length) win(); return n }); setOpen([]); sfx('good') }, 450) }
      else setTimeout(() => setOpen([]), 900)
    }
  }
  function win() { setTimeout(() => { confetti(1.3); sfx('win'); api.award({ k: 'bonus', xp: Math.max(5, 25 - moves) }); const sc = Math.max(1, 20 - moves); if (setBest('mem', sc)) api.toast('🏅', 'New personal best!', 'Memory match') }, 300) }
  if (!cards.length) return <div className="center"><p className="note">Match each key term to its meaning. Fewer moves means more XP.</p><button className="btn" onClick={start}>Start matching</button></div>
  return <div><div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}><span className="note">Moves: <b>{moves}</b> · Pairs: <b>{done.length / 2}/{cards.length / 2}</b></span><button className="btn ghost" onClick={start}>Shuffle</button></div>
    <div className="mem">{cards.map(c => { const up = open.includes(c.id) || done.includes(c.id); return <button key={c.id} className={'mc' + (up ? ' up' : '') + (done.includes(c.id) ? ' ok' : '')} onClick={() => flip(c.id)} aria-label={up ? c.text : 'Hidden card'}><span className="mc-in"><span className="mc-f">🦉</span><span className={'mc-b ' + c.kind}>{c.text}</span></span></button> })}</div>
    {done.length === cards.length && <div className="center" style={{ marginTop: 14 }}><b>Cleared in {moves} moves! 🎉</b></div>}</div>
}

/* 3. Hangman with subject terms. */
function Hangman({ api }: { api: Api }) {
  const [w, setW] = useState<[string, string] | null>(null); const [g, setG] = useState<string[]>([])
  const miss = w ? g.filter(x => !w[0].includes(x)).length : 0, won = w ? w[0].split('').every(c => g.includes(c)) : false, lost = miss >= 7
  function start() { setW(shuffle(terms(api.subj))[0]); setG([]); sfx('pop') }
  function guess(l: string) {
    if (!w || g.includes(l) || won || lost) return; const n = [...g, l]; setG(n); const ok = w[0].includes(l); sfx(ok ? 'good' : 'bad')
    if (w[0].split('').every(c => n.includes(c))) { confetti(1); sfx('win'); api.award({ k: 'bonus', xp: Math.max(4, 14 - miss * 2) }) }
  }
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (/^[a-z]$/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName)) guess(e.key.toUpperCase()) }
    window.addEventListener('keydown', kd)
    return () => window.removeEventListener('keydown', kd)
  })
  if (!w) return <div className="center"><p className="note">Guess the key term before the owl runs out of feathers. You can type on your keyboard too.</p><button className="btn" onClick={start}>Start hangman</button></div>
  const feathers = '🪶'.repeat(Math.max(0, 7 - miss))
  return <div className="center"><div className="feathers" aria-label={`${7 - miss} tries left`}>{feathers || '💀'}</div>
    <div className="hang-w">{w[0].split('').map((c, i) => <span key={i} className={g.includes(c) || lost ? 'on' : ''}>{g.includes(c) || lost ? c : ''}</span>)}</div>
    <p className="note">Clue: {w[1]}</p>
    {(won || lost) ? <div><p><b>{won ? 'You got it! 🎉' : `It was ${w[0]}`}</b></p><button className="btn" onClick={start}>Next word</button></div>
      : <div className="keys">{'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => <button key={l} disabled={g.includes(l)} className={g.includes(l) ? (w[0].includes(l) ? 'ok' : 'no') : ''} onClick={() => guess(l)}>{l}</button>)}</div>}</div>
}

/* 4. Term Typer: type the key terms against the clock. */
function Typer({ api }: { api: Api }) {
  const [phase, setPhase] = useState<'idle' | 'play' | 'done'>('idle'); const [t, setT] = useState(30); const [word, setWord] = useState(''); const [v, setV] = useState(''); const [n, setN] = useState(0); const [chars, setChars] = useState(0)
  const pool = useRef<string[]>([]); const inp = useRef<HTMLInputElement>(null)
  const nextWord = () => { if (!pool.current.length) pool.current = shuffle(terms(api.subj).map(x => x[0])); setWord(pool.current.pop() || '') }
  function start() { pool.current = []; setN(0); setChars(0); setV(''); setT(30); nextWord(); setPhase('play'); sfx('pop'); setTimeout(() => inp.current?.focus(), 50) }
  useEffect(() => {
    if (phase !== 'play') return
    if (t <= 0) { setPhase('done'); const wpm = Math.round(chars / 5 * 2); if (setBest('typer', wpm)) api.toast('🏅', 'New personal best!', `${wpm} WPM`); api.award({ k: 'bonus', xp: Math.min(20, 3 + n * 2) }); sfx('win'); if (n >= 6) confetti(1); return }
    const id = setTimeout(() => setT(x => x - 1), 1000)
    return () => clearTimeout(id)
  }, [t, phase]) // eslint-disable-line
  function type(s: string) { const u = s.toUpperCase(); setV(s); if (u === word) { setN(x => x + 1); setChars(c => c + word.length); setV(''); sfx('good'); nextWord() } }
  if (phase === 'idle') return <div className="center"><p className="note">Type as many key terms as you can in 30 seconds.</p><button className="btn" onClick={start}>Start typing</button><p className="note">Best: {best('typer')} WPM</p></div>
  if (phase === 'done') return <div className="center"><div className="big-score">{Math.round(chars / 5 * 2)}</div><p>words per minute · {n} terms</p><button className="btn" onClick={start}>Go again</button></div>
  return <div className="center"><div className={'timer-c' + (t <= 5 ? ' low' : '')}>{t}</div><div className="type-w">{word.split('').map((c, i) => <span key={i} className={v.toUpperCase()[i] === undefined ? '' : v.toUpperCase()[i] === c ? 'ok' : 'no'}>{c}</span>)}</div>
    <input ref={inp} className="type-i" value={v} onChange={e => type(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} aria-label="Type the word" /><p className="note">{n} done</p></div>
}

/* 5. Topic slot machine: spin three reels to choose what to study. */
function Slots({ api, setTopic }: { api: Api; setTopic: (t: string) => void }) {
  const [reels, setReels] = useState(['🎰', '🎰', '🎰']); const [spin, setSpin] = useState(false); const [pick, setPick] = useState('')
  function go() {
    if (spin) return; setSpin(true); setPick(''); sfx('pop'); let k = 0
    const id = setInterval(() => {
      k++; setReels(r => r.map((x, i) => (k > 10 + i * 6 ? x : SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)])))
      if (k % 3 === 0) sfx('pop')
      if (k > 28) { clearInterval(id); const list = terms(api.subj); const t = shuffle(list)[0]; setPick(t[0].charAt(0) + t[0].slice(1).toLowerCase()); setSpin(false); sfx('win'); confetti(0.6) }
    }, 70)
  }
  return <div className="center"><p className="note">Cannot decide what to revise? Pull the lever.</p>
    <div className="slots">{reels.map((r, i) => <div key={i} className={'reel' + (spin ? ' spin' : '')}>{r}</div>)}</div>
    <button className="btn" onClick={go} disabled={spin}>{spin ? 'Spinning…' : '🎰 Spin for a topic'}</button>
    {pick && <div className="slot-pick"><b>Revise: {pick}</b><button className="btn ghost" onClick={() => { setTopic(pick); api.toast('🎯', 'Topic set', pick) }}>Use as my topic</button></div>}</div>
}

/* 6. Hoot Hunt: tap the owls as they pop up. */
function Hunt({ api }: { api: Api }) {
  const [phase, setPhase] = useState<'idle' | 'play' | 'done'>('idle'); const [t, setT] = useState(20); const [score, setScore] = useState(0); const [spots, setSpots] = useState<number[]>([])
  function start() { setScore(0); setT(20); setSpots([]); setPhase('play'); sfx('pop') }
  useEffect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => { setSpots(s => { const n = Math.floor(Math.random() * 12); return [...s.filter(x => x !== n), n].slice(-3) }) }, 520)
    return () => clearInterval(id)
  }, [phase])
  useEffect(() => {
    if (phase !== 'play') return
    if (t <= 0) { setPhase('done'); if (setBest('hunt', score)) api.toast('🏅', 'New personal best!', `${score} owls`); api.award({ k: 'bonus', xp: Math.min(15, 2 + Math.floor(score / 2)) }); sfx('win'); if (score >= 12) confetti(1); return }
    const id = setTimeout(() => setT(x => x - 1), 1000)
    return () => clearTimeout(id)
  }, [t, phase]) // eslint-disable-line
  const hit = (n: number) => { setSpots(s => s.filter(x => x !== n)); setScore(x => x + 1); sfx('good') }
  if (phase === 'idle') return <div className="center"><p className="note">Tap the owls before they hide. A fun brain break.</p><button className="btn" onClick={start}>Start hunt</button><p className="note">Best: {best('hunt')}</p></div>
  if (phase === 'done') return <div className="center"><div className="big-score">{score}</div><p>owls caught</p><button className="btn" onClick={start}>Hunt again</button></div>
  return <div><div className="row" style={{ justifyContent: 'space-between' }}><b>⏱ {t}s</b><b>🦉 {score}</b></div>
    <div className="hunt">{Array.from({ length: 12 }, (_, i) => <button key={i} className={'hole' + (spots.includes(i) ? ' up' : '')} onPointerDown={() => spots.includes(i) && hit(i)} aria-label="owl">{spots.includes(i) ? '🦉' : ''}</button>)}</div></div>
}

/* 7. True or false sprint. */
function Sprint({ api }: { api: Api }) {
  const [phase, setPhase] = useState<'idle' | 'play' | 'done'>('idle'); const [t, setT] = useState(30); const [score, setScore] = useState(0); const [q, setQ] = useState<[string, boolean]>(TF[0]); const [flash, setFlash] = useState('')
  const deck = useRef<[string, boolean][]>([])
  const draw = () => { if (!deck.current.length) deck.current = shuffle(TF); setQ(deck.current.pop() || TF[0]) }
  function start() { deck.current = []; setScore(0); setT(30); draw(); setPhase('play'); sfx('pop') }
  useEffect(() => {
    if (phase !== 'play') return
    if (t <= 0) { setPhase('done'); if (setBest('sprint', score)) api.toast('🏅', 'New personal best!', `${score} correct`); api.award({ k: 'bonus', xp: Math.min(18, 2 + score) }); sfx('win'); if (score >= 10) confetti(1); return }
    const id = setTimeout(() => setT(x => x - 1), 1000)
    return () => clearTimeout(id)
  }, [t, phase]) // eslint-disable-line
  function ans(v: boolean) { const ok = v === q[1]; setFlash(ok ? 'ok' : 'bad'); setTimeout(() => setFlash(''), 220); sfx(ok ? 'good' : 'bad'); if (ok) setScore(s => s + 1); else setT(x => Math.max(0, x - 2)); draw() }
  if (phase === 'idle') return <div className="center"><p className="note">True or false? Answer fast. Wrong answers cost 2 seconds.</p><button className="btn" onClick={start}>Start sprint</button><p className="note">Best: {best('sprint')}</p></div>
  if (phase === 'done') return <div className="center"><div className="big-score">{score}</div><p>correct answers</p><button className="btn" onClick={start}>Sprint again</button></div>
  return <div className={'center sprint ' + flash}><div className={'timer-c' + (t <= 5 ? ' low' : '')}>{t}</div><h3 style={{ minHeight: 70 }}>{q[0]}</h3>
    <div className="row"><button className="btn tf-t" onClick={() => ans(true)}>✅ True</button><button className="btn tf-f" onClick={() => ans(false)}>❌ False</button></div><p className="note">Score: {score}</p></div>
}

const GAMES = [['d5', '⚡ Daily 5'], ['mem', '🃏 Memory'], ['hang', '🔤 Hangman'], ['type', '⌨️ Typer'], ['slot', '🎰 Topic slots'], ['hunt', '🦉 Hoot Hunt'], ['tf', '✅ True/False']] as const
export default function Play({ api, setTopic }: { api: Api; setTopic: (t: string) => void }) {
  const [g, setG] = useState<typeof GAMES[number][0]>('d5')
  return <div><div className="seg wrapseg" role="group" aria-label="Games">{GAMES.map(([k, l]) => <button key={k} aria-pressed={g === k} onClick={() => { setG(k); sfx('pop') }}>{l}</button>)}</div>
    <div className="game" key={g}>
      {g === 'd5' && <Daily5 api={api} />}{g === 'mem' && <Memory api={api} />}{g === 'hang' && <Hangman api={api} />}{g === 'type' && <Typer api={api} />}
      {g === 'slot' && <Slots api={api} setTopic={setTopic} />}{g === 'hunt' && <Hunt api={api} />}{g === 'tf' && <Sprint api={api} />}
    </div></div>
}
