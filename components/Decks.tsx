'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { store, ai } from '@/lib/api'
import { sfx, confetti, canListen, listen } from '@/lib/fx'
import type { Api } from './api'

// My Decks: turn your own notes, a photo of a page, dictation or a topic into flashcards, then study them
// with swipe cards on a spaced schedule and quiz yourself. Decks are saved in this browser and can be shared with a code.
type C = { id: string; front: string; back: string; box: number; due: number }
type D = { id: string; title: string; subj: string; cards: C[]; at: number }
const GAP = [0, 1, 3, 7, 14, 30]
const day = () => Math.floor(Date.now() / 864e5)
const uid = () => Math.random().toString(36).slice(2, 9)
const shuffle = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] } return r }
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3)
const dueOf = (d: D) => d.cards.filter(c => c.due <= day())
const mastery = (d: D) => d.cards.length ? Math.round((d.cards.filter(c => c.box >= 3).length / d.cards.length) * 100) : 0

async function shrink(file: File): Promise<{ type: string; data: string; url: string }> {
  const bmp = await createImageBitmap(file); const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  const g = c.getContext('2d'); if (!g) throw new Error('no canvas'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height)
  const url = c.toDataURL('image/jpeg', 0.82); return { type: 'image/jpeg', data: url.split(',')[1], url }
}
const enc = (d: D) => 'WOD1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ t: d.title, s: d.subj, c: d.cards.map(c => [c.front, c.back]) }))))
function dec(code: string): D | null {
  try {
    const j = JSON.parse(decodeURIComponent(escape(atob(code.trim().replace(/^WOD1:/, '')))))
    const cards: C[] = (j.c as string[][]).slice(0, 60).filter(x => x[0] && x[1]).map(x => ({ id: uid(), front: String(x[0]).slice(0, 200), back: String(x[1]).slice(0, 300), box: 0, due: day() }))
    return cards.length ? { id: uid(), title: String(j.t || 'Shared deck').slice(0, 60), subj: String(j.s || ''), cards, at: Date.now() } : null
  } catch { return null }
}

export default function Decks({ api }: { api: Api }) {
  const [decks, setDecks] = useState<D[]>([]); const [view, setView] = useState<'lib' | 'new' | 'deck'>('lib'); const [cur, setCur] = useState(''); const [ready, setReady] = useState(false)
  useEffect(() => { setDecks(store.get<D[]>('decks', [])); setReady(true); return undefined }, [])
  const save = (n: D[]) => { setDecks(n); store.set('decks', n) }
  const upd = (d: D) => save(decks.map(x => x.id === d.id ? d : x))
  const deck = decks.find(d => d.id === cur)
  if (!ready) return <section className="dk" />
  if (view === 'new') return <section className="dk"><Make api={api} onBack={() => setView('lib')} onDone={d => { save([d, ...decks]); setCur(d.id); setView('deck') }} /></section>
  if (view === 'deck' && deck) return <section className="dk"><DeckView key={deck.id} api={api} deck={deck} onChange={upd} onBack={() => setView('lib')} onDelete={() => { save(decks.filter(x => x.id !== deck.id)); setView('lib') }} /></section>
  return <section className="dk"><Library decks={decks} onNew={() => setView('new')} onOpen={id => { setCur(id); setView('deck') }} onImport={d => { save([d, ...decks]); setCur(d.id); setView('deck') }} /></section>
}

function Library({ decks, onNew, onOpen, onImport }: { decks: D[]; onNew: () => void; onOpen: (id: string) => void; onImport: (d: D) => void }) {
  const [code, setCode] = useState(''); const [err, setErr] = useState('')
  const totalDue = decks.reduce((a, d) => a + dueOf(d).length, 0)
  return <>
    <div className="dk-hero"><div><h2>📚 My Decks</h2><p>Turn your own notes into flashcards and quizzes, then let spaced repetition tell you what to study today.</p></div>
      <button className="dk-btn big" onClick={onNew}>✨ Magic import</button></div>
    {decks.length > 0 && <div className="dk-today"><b>{totalDue}</b> card{totalDue === 1 ? '' : 's'} due today across {decks.length} deck{decks.length === 1 ? '' : 's'}</div>}
    {decks.length === 0 && <div className="dk-empty"><div className="dk-big">🪄</div><h3>No decks yet</h3><p>Paste your class notes, snap a photo of a textbook page, dictate with your voice, or pick a topic. Wise Owl writes the flashcards for you.</p><button className="dk-btn" onClick={onNew}>Make my first deck</button></div>}
    <div className="dk-grid">{decks.map((d, i) => { const due = dueOf(d).length, m = mastery(d); return <button key={d.id} className="dk-deck" style={{ animationDelay: i * 50 + 'ms' }} onClick={() => onOpen(d.id)}>
      <span className="dk-stack" aria-hidden><i /><i /><i /></span><h3>{d.title}</h3><span className="dk-meta">{d.cards.length} cards{d.subj ? ' · ' + d.subj : ''}</span>
      <span className="dk-bar" aria-label={`Mastery ${m}%`}><i style={{ width: m + '%' }} /></span>
      <span className={'dk-pill' + (due ? ' on' : '')}>{due ? `${due} due` : 'All caught up ✓'}</span></button> })}</div>
    <details className="dk-imp"><summary>Got a deck code from a friend?</summary>
      <div className="dk-row"><input value={code} onChange={e => { setCode(e.target.value); setErr('') }} placeholder="Paste deck code (starts with WOD1:)" aria-label="Deck code" />
        <button className="dk-btn" onClick={() => { const d = dec(code); if (d) { sfx('good'); onImport(d) } else setErr('That code did not work. Copy the whole code and try again.') }} disabled={!code.trim()}>Add deck</button></div>{err && <p className="dk-err">{err}</p>}</details>
  </>
}

function Make({ api, onBack, onDone }: { api: Api; onBack: () => void; onDone: (d: D) => void }) {
  const [src, setSrc] = useState<'notes' | 'photo' | 'topic'>('notes'); const [text, setText] = useState(''); const [topic, setTopic] = useState(api.topic)
  const [pic, setPic] = useState<{ type: string; data: string; url: string } | null>(null); const [count, setCount] = useState(20); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [mic, setMic] = useState(false); const [canMic, setCanMic] = useState(false)
  const stop = useRef<(() => void) | null>(null); const file = useRef<HTMLInputElement>(null); const txt = useRef<HTMLInputElement>(null)
  useEffect(() => { setCanMic(canListen()); return () => stop.current?.() }, [])
  const ok = src === 'notes' ? text.trim().length >= 40 : src === 'photo' ? !!pic : topic.trim().length >= 3
  async function go() {
    setBusy(true); setErr('')
    try {
      const j = await ai({ mode: 'deck', subject: api.subj, topic: src === 'topic' ? topic.trim() : '', text: src === 'notes' ? text : '', image: src === 'photo' && pic ? { type: pic.type, data: pic.data } : undefined, count })
      const cards: C[] = j.data.cards.map((c: any) => ({ id: uid(), front: c.front, back: c.back, box: 0, due: day() }))
      sfx('win'); confetti(0.6); onDone({ id: uid(), title: j.data.title, subj: api.subj, cards, at: Date.now() })
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  function dictate() {
    if (mic) { stop.current?.(); setMic(false); return }
    const base = text ? text.trim() + ' ' : ''; const s = listen(t => setText(base + t), () => setMic(false)); if (s) { stop.current = s; setMic(true) }
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    try { setPic(await shrink(f)); sfx('good') } catch { setErr('I could not read that photo. Try a clearer picture.') }
  }
  async function onTxt(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    if (f.size > 400_000) { setErr('That file is too big. Paste the part you want to learn.'); return }
    setText((await f.text()).slice(0, 14000)); sfx('good')
  }
  return <>
    <button className="dk-link" onClick={onBack}>← My decks</button>
    <h2 className="dk-h">✨ Magic import</h2><p className="dk-sub">Choose where your cards come from. You can edit every card afterwards.</p>
    <div className="dk-seg" role="group" aria-label="Source">{([['notes', '📝 Paste notes'], ['photo', '📷 Photo of a page'], ['topic', '💡 Just a topic']] as const).map(([k, l]) => <button key={k} aria-pressed={src === k} onClick={() => { setSrc(k); sfx('pop') }}>{l}</button>)}</div>
    {src === 'notes' && <div className="dk-box"><textarea rows={9} value={text} onChange={e => setText(e.target.value)} placeholder="Paste your notes or a textbook section here…" aria-label="Your notes" />
      <div className="dk-row">{canMic && <button className={'dk-btn ghost' + (mic ? ' rec' : '')} onClick={dictate}>{mic ? '⏹️ Stop' : '🎤 Dictate'}</button>}
        <input ref={txt} type="file" accept=".txt,.md,text/plain" hidden onChange={onTxt} /><button className="dk-btn ghost" onClick={() => txt.current?.click()}>📄 Upload .txt</button>
        <span className="dk-count">{text.trim().length} characters</span></div></div>}
    {src === 'photo' && <div className="dk-box"><input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      {pic ? <div className="dk-pic"><img src={pic.url} alt="Your page" /><button className="dk-link" onClick={() => setPic(null)}>Remove photo</button></div> : <button className="dk-drop" onClick={() => file.current?.click()}><span>📷</span>Take or choose a photo of your notes or textbook page</button>}</div>}
    {src === 'topic' && <div className="dk-box"><label>Topic in {api.subj}<input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Photosynthesis" /></label><p className="dk-sub">Wise Owl will use the Cambridge syllabus. Change the subject in the top bar first if needed.</p></div>}
    <div className="dk-row"><label className="dk-sel">Cards <select value={count} onChange={e => setCount(+e.target.value)}>{[10, 20, 30].map(n => <option key={n}>{n}</option>)}</select></label>
      <button className="dk-btn big" onClick={go} disabled={busy || !ok}>{busy ? 'Writing your cards…' : '✨ Make my deck'}</button></div>
    {busy && <div className="dk-busy"><i /><i /><i /></div>}{err && <p className="dk-err" role="alert">{err}</p>}
  </>
}

function DeckView({ api, deck, onChange, onBack, onDelete }: { api: Api; deck: D; onChange: (d: D) => void; onBack: () => void; onDelete: () => void }) {
  const [mode, setMode] = useState<'cards' | 'study' | 'quiz'>('cards'); const [msg, setMsg] = useState('')
  const due = dueOf(deck)
  const set = (cards: C[]) => onChange({ ...deck, cards })
  if (mode === 'study') return <Study api={api} deck={deck} onChange={onChange} onExit={() => setMode('cards')} />
  if (mode === 'quiz') return <Quiz api={api} deck={deck} onChange={onChange} onExit={() => setMode('cards')} />
  return <>
    <button className="dk-link" onClick={onBack}>← My decks</button>
    <input className="dk-title" value={deck.title} onChange={e => onChange({ ...deck, title: e.target.value.slice(0, 60) })} aria-label="Deck name" />
    <div className="dk-row wrap">
      <button className="dk-btn big" onClick={() => { setMode('study'); sfx('pop') }} disabled={!deck.cards.length}>▶ Study {due.length ? `${due.length} due` : 'all cards'}</button>
      <button className="dk-btn" onClick={() => { setMode('quiz'); sfx('pop') }} disabled={!deck.cards.length}>🧪 Quiz me</button>
      <button className="dk-btn ghost" onClick={async () => { try { await navigator.clipboard.writeText(enc(deck)); setMsg('Deck code copied. Send it to a friend!') } catch { setMsg('Could not copy. Long-press the code below.') } setTimeout(() => setMsg(''), 3000) }}>📤 Share code</button>
      <button className="dk-btn ghost danger" onClick={() => { if (confirm(`Delete "${deck.title}"?`)) onDelete() }}>🗑️</button></div>
    {msg && <p className="dk-ok" role="status">{msg}</p>}
    <div className="dk-stats"><div><b>{deck.cards.length}</b><span>Cards</span></div><div><b>{due.length}</b><span>Due today</span></div><div><b>{mastery(deck)}%</b><span>Mastered</span></div></div>
    <div className="dk-list">{deck.cards.map((c, i) => <div key={c.id} className="dk-edit" style={{ animationDelay: Math.min(i, 12) * 30 + 'ms' }}>
      <span className="dk-n">{i + 1}</span>
      <div><textarea rows={2} value={c.front} onChange={e => set(deck.cards.map(x => x.id === c.id ? { ...x, front: e.target.value.slice(0, 200) } : x))} aria-label={`Card ${i + 1} front`} />
        <textarea rows={2} value={c.back} onChange={e => set(deck.cards.map(x => x.id === c.id ? { ...x, back: e.target.value.slice(0, 300) } : x))} aria-label={`Card ${i + 1} back`} /></div>
      <button className="dk-x" aria-label={`Delete card ${i + 1}`} onClick={() => set(deck.cards.filter(x => x.id !== c.id))}>✕</button></div>)}</div>
    <button className="dk-btn ghost" onClick={() => set([...deck.cards, { id: uid(), front: '', back: '', box: 0, due: day() }])} disabled={deck.cards.length >= 60}>+ Add a card</button>
  </>
}

function Study({ api, deck, onChange, onExit }: { api: Api; deck: D; onChange: (d: D) => void; onExit: () => void }) {
  const start = useMemo(() => { const d = dueOf(deck).filter(c => c.front.trim() && c.back.trim()); const base = d.length ? d : deck.cards.filter(c => c.front.trim() && c.back.trim()); return shuffle(base).map(c => c.id) }, []) // eslint-disable-line
  const [queue, setQueue] = useState<string[]>(start); const [i, setI] = useState(0); const [flip, setFlip] = useState(false); const [dx, setDx] = useState(0); const [fly, setFly] = useState(0)
  const [known, setKnown] = useState(0); const [seen, setSeen] = useState(0); const [done, setDone] = useState(false); const drag = useRef<{ x: number; moved: boolean } | null>(null); const redo = useRef<Set<string>>(new Set())
  const cards = useRef(deck.cards); cards.current = deck.cards
  const card = cards.current.find(c => c.id === queue[i])
  function grade(g: boolean) {
    if (!card || fly) return
    setFly(g ? 1 : -1); sfx(g ? 'good' : 'pop')
    setTimeout(() => {
      const box = g ? Math.min(GAP.length - 1, card.box + 1) : 0
      onChange({ ...deck, cards: cards.current.map(c => c.id === card.id ? { ...c, box, due: g ? day() + GAP[box] : day() } : c) })
      if (g) setKnown(k => k + 1)
      let q = queue; if (!g && !redo.current.has(card.id)) { redo.current.add(card.id); q = [...queue, card.id]; setQueue(q) }
      setSeen(s => s + 1); setFlip(false); setDx(0); setFly(0)
      if (i + 1 >= q.length) { setDone(true); const k = known + (g ? 1 : 0); api.award({ k: 'cards', known: k, total: Math.max(k, start.length) }); confetti(0.9); sfx('win') } else setI(i + 1)
    }, 220)
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (done) return; if (e.key === 'ArrowRight') grade(true); else if (e.key === 'ArrowLeft') grade(false); else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setFlip(f => !f) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  })
  if (!start.length) return <><button className="dk-link" onClick={onExit}>← Back</button><p className="dk-sub">This deck has no complete cards yet.</p></>
  if (done) return <div className="dk-finish"><div className="dk-big">🎉</div><h2>Session complete</h2><p>You knew <b>{known}</b> of {start.length} cards first time round.</p><p className="dk-sub">Cards you missed come back sooner. The rest are scheduled for later.</p>
    <div className="dk-row center"><button className="dk-btn" onClick={onExit}>Back to deck</button></div></div>
  const pct = Math.round((i / queue.length) * 100)
  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, moved: false }; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId) }
  const onMove = (e: React.PointerEvent) => { if (!drag.current) return; const d = e.clientX - drag.current.x; if (Math.abs(d) > 6) drag.current.moved = true; setDx(d) }
  const onUp = () => { const d = dx; const moved = drag.current?.moved; drag.current = null; if (d > 90) grade(true); else if (d < -90) grade(false); else { setDx(0); if (!moved) { setFlip(f => !f); sfx('pop') } } }
  const x = fly ? fly * 520 : dx
  return <>
    <div className="dk-top"><button className="dk-link" onClick={onExit}>✕ End</button><div className="dk-prog" aria-label={`Card ${i + 1} of ${queue.length}`}><i style={{ width: pct + '%' }} /></div><span className="dk-count">{i + 1}/{queue.length}</span></div>
    <div className="dk-stage">
      <div className={'dk-hint l' + (dx < -30 ? ' on' : '')}>😅 Still learning</div><div className={'dk-hint r' + (dx > 30 ? ' on' : '')}>I know it ✅</div>
      <div className={'dk-card' + (flip ? ' flip' : '') + (drag.current ? ' drag' : '')} style={{ transform: `translateX(${x}px) rotate(${x / 18}deg)`, opacity: fly ? 0 : 1 }} role="button" tabIndex={0} aria-label="Flip card (space). Left arrow: still learning. Right arrow: I know it."
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null; setDx(0) }}>
        <div><div className="face front"><small>QUESTION</small>{card?.front}</div><div className="face back"><small>ANSWER</small>{card?.back}</div></div></div></div>
    <p className="dk-sub center">Tap to flip · swipe right if you know it, left if not</p>
    <div className="dk-row center"><button className="dk-btn ghost" onClick={() => grade(false)}>😅 Still learning</button><button className="dk-btn" onClick={() => grade(true)}>✅ I know it</button></div>
  </>
}

type Q = { c: C; kind: 'mc' | 'type'; opts: string[] }
function Quiz({ api, deck, onChange, onExit }: { api: Api; deck: D; onChange: (d: D) => void; onExit: () => void }) {
  const qs = useMemo<Q[]>(() => {
    const ok = deck.cards.filter(c => c.front.trim() && c.back.trim()); const pick = shuffle(ok).slice(0, 10)
    return pick.map((c, i) => {
      const others = shuffle([...new Set(ok.filter(o => o.id !== c.id && o.back !== c.back).map(o => o.back))]).slice(0, 3)
      return others.length >= 3 && i % 3 !== 2 ? { c, kind: 'mc' as const, opts: shuffle([c.back, ...others]) } : { c, kind: 'type' as const, opts: [] }
    })
  }, []) // eslint-disable-line
  const [i, setI] = useState(0); const [pick, setPick] = useState<string | null>(null); const [typed, setTyped] = useState(''); const [res, setRes] = useState<null | boolean>(null); const [right, setRight] = useState(0); const [done, setDone] = useState(false); const missed = useRef<string[]>([])
  const q = qs[i]
  function judge(ok: boolean) {
    setRes(ok); sfx(ok ? 'good' : 'bad'); if (ok) setRight(r => r + 1); else missed.current.push(q.c.id)
  }
  function next() {
    setPick(null); setTyped(''); setRes(null)
    if (i + 1 >= qs.length) {
      const m = new Set(missed.current)
      onChange({ ...deck, cards: deck.cards.map(c => m.has(c.id) ? { ...c, box: 0, due: day() } : c) })
      setDone(true); const k = right; api.award({ k: 'cards', known: k, total: qs.length }); if (k / qs.length >= 0.6) { confetti(1); sfx('win') }
    } else setI(i + 1)
  }
  function check() {
    const a = words(q.c.back), t = new Set(words(typed)); if (!typed.trim()) return
    const hit = a.length ? a.filter(w => t.has(w)).length / a.length : 0
    judge(typed.trim().toLowerCase() === q.c.back.trim().toLowerCase() || hit >= 0.6)
  }
  if (!qs.length) return <><button className="dk-link" onClick={onExit}>← Back</button><p className="dk-sub">Add some complete cards first.</p></>
  if (done) return <div className="dk-finish"><div className="dk-big">{right / qs.length >= 0.8 ? '🏆' : right / qs.length >= 0.5 ? '👏' : '💪'}</div><h2>{right} / {qs.length}</h2><p className="dk-sub">Questions you missed are back in your study queue for today.</p><div className="dk-row center"><button className="dk-btn" onClick={onExit}>Back to deck</button></div></div>
  return <>
    <div className="dk-top"><button className="dk-link" onClick={onExit}>✕ End</button><div className="dk-prog"><i style={{ width: (i / qs.length) * 100 + '%' }} /></div><span className="dk-count">{i + 1}/{qs.length}</span></div>
    <div className="dk-q" key={i}><small>{q.kind === 'mc' ? 'CHOOSE THE ANSWER' : 'TYPE THE ANSWER'}</small><h3>{q.c.front}</h3>
      {q.kind === 'mc' ? <div className="dk-opts">{q.opts.map(o => <button key={o} disabled={res !== null} className={'dk-opt' + (res !== null && o === q.c.back ? ' right' : pick === o && res === false ? ' wrong' : '')} onClick={() => { setPick(o); judge(o === q.c.back) }}>{o}</button>)}</div>
        : <form onSubmit={e => { e.preventDefault(); if (res === null) check() }}><textarea rows={2} value={typed} onChange={e => setTyped(e.target.value)} disabled={res !== null} placeholder="Type what you remember…" aria-label="Your answer" autoFocus />
          {res === null && <button className="dk-btn" disabled={!typed.trim()}>Check</button>}</form>}
      {res !== null && <div className={'dk-fb ' + (res ? 'ok' : 'no')} role="status"><b>{res ? 'Correct! 🎉' : 'Not quite'}</b>{(q.kind === 'type' || !res) && <p>Answer: {q.c.back}</p>}
        {q.kind === 'type' && !res && <button className="dk-link" onClick={() => { setRes(true); setRight(r => r + 1); missed.current = missed.current.filter(x => x !== q.c.id) }}>I was actually right</button>}
        <button className="dk-btn" onClick={next}>{i + 1 >= qs.length ? 'See score' : 'Next'}</button></div>}</div>
  </>
}
