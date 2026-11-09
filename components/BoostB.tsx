'use client'
import { useEffect, useRef, useState } from 'react'
import { store } from '@/lib/api'
import { sfx, confetti, celebrate } from '@/lib/fx'
import type { Api } from './api'

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }

/* 11. Dictionary (free public API, handled gracefully when offline) */
type Def = { word: string; phonetic?: string; meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[] }
export function Dictionary() {
  const [w, setW] = useState(''); const [res, setRes] = useState<Def | null>(null); const [msg, setMsg] = useState('')
  async function look(e: React.FormEvent) {
    e.preventDefault(); const q = w.trim().toLowerCase(); if (!/^[a-z' -]{1,40}$/.test(q)) { setMsg('Type one English word.'); return }
    setMsg('Looking…'); setRes(null)
    try { const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(q)); if (!r.ok) throw new Error('nf'); const j = await r.json(); setRes(Array.isArray(j) ? j[0] : null); setMsg(''); sfx('good') } catch { setMsg('Could not find that word, or you are offline.'); sfx('bad') }
  }
  return <div><form className="row" style={{ justifyContent: 'flex-start' }} onSubmit={look}><input className="grow" value={w} onChange={e => setW(e.target.value)} placeholder="Look up a word, e.g. photosynthesis" aria-label="Word" /><button className="btn">Search</button></form>
    {msg && <p className="note" style={{ marginTop: 10 }}>{msg}</p>}
    {res && <div className="dict"><h3>{res.word} <small>{res.phonetic}</small></h3>{res.meanings.slice(0, 3).map((m, i) => <div key={i}><b className="pos">{m.partOfSpeech}</b>{m.definitions.slice(0, 2).map((d, j) => <p key={j}>{d.definition}{d.example && <em> “{d.example}”</em>}</p>)}</div>)}</div>}</div>
}

/* 12. Text analyser */
const STOP = new Set('the a an and or but of to in on at for is are was were be been it this that with as by from i you he she we they'.split(' '))
export function TextLab() {
  const [t, setT] = useState('')
  const words = t.toLowerCase().match(/[a-z']+/g) || []; const sents = (t.match(/[^.!?]+[.!?]*/g) || []).filter(x => x.trim()).length
  const syl = words.reduce((p, w) => p + Math.max(1, (w.replace(/e$/, '').match(/[aeiouy]+/g) || []).length), 0)
  const fl = words.length && sents ? 206.835 - 1.015 * (words.length / sents) - 84.6 * (syl / words.length) : NaN
  const freq = new Map<string, number>(); words.filter(w => !STOP.has(w) && w.length > 2).forEach(w => freq.set(w, (freq.get(w) || 0) + 1))
  const top = [...freq].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const lvl = !isFinite(fl) ? '–' : fl > 80 ? 'Very easy' : fl > 60 ? 'Easy to read' : fl > 40 ? 'Medium' : 'Challenging'
  return <div><textarea className="essay" rows={5} value={t} onChange={e => setT(e.target.value)} placeholder="Paste or type your writing here…" aria-label="Your text" />
    <div className="bests" style={{ marginTop: 12 }}>{([['Words', words.length], ['Characters', t.length], ['Sentences', sents], ['Words per sentence', sents ? Math.round((words.length / sents) * 10) / 10 : 0], ['Reading level', lvl], ['Reading time', `${Math.max(0, Math.round((words.length / 220) * 60))}s`]] as [string, string | number][]).map(([l, v]) => <div key={l} className="best"><small>{l}</small><b style={{ fontSize: 24 }}>{v}</b></div>)}</div>
    {top.length > 0 && <p className="note" style={{ marginTop: 10 }}>Most used words: {top.map(x => `${x[0]} (${x[1]})`).join(', ')}</p>}</div>
}

/* 13. Timeline maker */
type Ev = { y: number; t: string }
export function Timeline() {
  const [l, setL] = useState<Ev[]>([]); const [y, setY] = useState(''); const [t, setT] = useState('')
  useEffect(() => { const s = store.get<Ev[]>('timeline', []); setL(Array.isArray(s) ? s : []) }, [])
  const put = (n: Ev[]) => { const s = [...n].sort((a, b) => a.y - b.y); setL(s); store.set('timeline', s) }
  return <div><form className="row" style={{ justifyContent: 'flex-start' }} onSubmit={e => { e.preventDefault(); const Y = parseInt(y, 10); if (!isFinite(Y) || !t.trim() || l.length >= 30) return; put([...l, { y: Y, t: t.trim().slice(0, 60) }]); setY(''); setT(''); sfx('good') }}>
    <input style={{ width: 110 }} value={y} inputMode="numeric" onChange={e => setY(e.target.value)} placeholder="Year" aria-label="Year" /><input className="grow" value={t} onChange={e => setT(e.target.value)} placeholder="What happened?" aria-label="Event" /><button className="btn">Add</button></form>
    <div className="tl-w">{l.length === 0 ? <p className="note">Add events to build a timeline. Great for History.</p> : <div className="tl">{l.map((e, i) => <div key={i} className={'tl-i ' + (i % 2 ? 'dn' : 'up')} style={{ animationDelay: `${i * 70}ms` }}><b>{e.y}</b><span>{e.t}</span><button onClick={() => put(l.filter((_, j) => j !== i))} aria-label="Remove event">✕</button></div>)}</div>}</div></div>
}

/* 14. My flashcards */
type Card = { q: string; a: string }
export function MyCards({ api }: { api: Api }) {
  const key = 'mycards:' + api.subj; const [l, setL] = useState<Card[]>([]); const [q, setQ] = useState(''); const [a, setA] = useState(''); const [i, setI] = useState(0); const [flip, setFlip] = useState(false)
  useEffect(() => { const s = store.get<Card[]>(key, []); setL(Array.isArray(s) ? s : []); setI(0); setFlip(false) }, [key])
  const put = (n: Card[]) => { setL(n); store.set(key, n) }
  const c = l[Math.min(i, Math.max(0, l.length - 1))]
  return <div><form className="row" style={{ justifyContent: 'flex-start' }} onSubmit={e => { e.preventDefault(); if (!q.trim() || !a.trim() || l.length >= 60) return; put([...l, { q: q.trim().slice(0, 120), a: a.trim().slice(0, 200) }]); setQ(''); setA(''); sfx('good'); api.award({ k: 'bonus', xp: 1 }) }}>
    <input className="grow" value={q} onChange={e => setQ(e.target.value)} placeholder="Question or term" aria-label="Question" /><input className="grow" value={a} onChange={e => setA(e.target.value)} placeholder="Answer" aria-label="Answer" /><button className="btn">Add card</button></form>
    {!c ? <p className="note" style={{ marginTop: 12 }}>No cards for {api.subj} yet. Make your own above.</p> :
      <div className="center" style={{ marginTop: 14 }}><button className={'fcard' + (flip ? ' up' : '')} onClick={() => { setFlip(f => !f); sfx('pop') }} aria-label="Flip card"><span className="fc-in"><span className="fc-f">{c.q}</span><span className="fc-b">{c.a}</span></span></button>
        <div className="row"><button className="btn ghost" onClick={() => { setI((i - 1 + l.length) % l.length); setFlip(false) }}>← Prev</button><span className="note">{Math.min(i, l.length - 1) + 1} / {l.length}</span><button className="btn ghost" onClick={() => { setI((i + 1) % l.length); setFlip(false) }}>Next →</button><button className="btn ghost" onClick={() => { put(shuffle(l)); setI(0); setFlip(false) }}>🔀</button><button className="btn ghost" onClick={() => { put(l.filter((_, j) => j !== i)); setI(0); setFlip(false) }}>🗑</button></div></div>}</div>
}

/* 15. Speed reader */
export function Reader() {
  const [t, setT] = useState('Reading faster helps you revise more in less time. Press play, keep your eyes on the middle of the screen, and let the words come to you.'); const [wpm, setWpm] = useState(300); const [on, setOn] = useState(false); const [i, setI] = useState(0)
  const ws = t.split(/\s+/).filter(Boolean)
  useEffect(() => {
    if (!on) return
    if (i >= ws.length) { setOn(false); setI(0); sfx('win'); return }
    const w = ws[i], extra = /[.!?]$/.test(w) ? 2 : /[,;:]$/.test(w) ? 1.5 : 1
    const id = setTimeout(() => setI(x => x + 1), (60000 / wpm) * extra)
    return () => clearTimeout(id)
  }, [on, i, wpm]) // eslint-disable-line
  const w = ws[Math.min(i, ws.length - 1)] || '', mid = Math.max(0, Math.floor((w.length - 1) / 2))
  return <div className="center"><div className="rsvp" aria-live="off"><span>{w.slice(0, mid)}</span><b>{w[mid] || ''}</b><span>{w.slice(mid + 1)}</span></div>
    <div className="pbar" style={{ width: '100%' }}><i style={{ width: `${ws.length ? (i / ws.length) * 100 : 0}%` }} /></div>
    <div className="row"><button className="btn" onClick={() => { if (i >= ws.length) setI(0); setOn(o => !o); sfx('pop') }}>{on ? '⏸ Pause' : '▶ Play'}</button><button className="btn ghost" onClick={() => { setOn(false); setI(0) }}>Restart</button><label className="note">{wpm} wpm <input type="range" min={150} max={800} step={25} value={wpm} onChange={e => setWpm(+e.target.value)} aria-label="Words per minute" /></label></div>
    <textarea className="essay" rows={3} value={t} onChange={e => { setT(e.target.value); setI(0); setOn(false) }} aria-label="Text to read" /></div>
}

/* 17. Owl pet */
type Pet = { name: string; born: number; fed: number; feeds: number }
export function PetTab({ api }: { api: Api }) {
  const [pet, setPet] = useState<Pet | null>(null); const [now, setNow] = useState(0); const [hearts, setHearts] = useState<number[]>([]); const [shop, setShop] = useState<{ owned: string[]; spent: number }>({ owned: [], spent: 0 })
  useEffect(() => { const p = store.get<Pet | null>('pet', null); setPet(p && typeof p.born === 'number' ? p : null); const s = store.get<{ owned: string[]; spent: number }>('shop', { owned: [], spent: 0 }); setShop(s && Array.isArray(s.owned) ? s : { owned: [], spent: 0 }); setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id) }, [])
  const coins = Math.max(0, Math.floor(api.p.xp / 10) - shop.spent)
  const save = (p: Pet) => { setPet(p); store.set('pet', p) }
  if (!pet) return <div className="center"><div className="pet-e big">🥚</div><p className="note">Adopt an owl egg. Feed it with coins and it grows as you study.</p><button className="btn" onClick={() => { save({ name: 'Hoot', born: Date.now(), fed: Date.now(), feeds: 0 }); celebrate('emoji', '🐣'); sfx('win') }}>Adopt an egg 🥚</button></div>
  const hrs = (now - pet.fed) / 36e5, hunger = Math.min(100, Math.round(hrs * 10)); const stage = pet.feeds >= 20 ? ['🦉', 'Wise Owl'] : pet.feeds >= 8 ? ['🦉', 'Owl'] : pet.feeds >= 3 ? ['🐥', 'Owlet'] : pet.feeds >= 1 ? ['🐣', 'Hatchling'] : ['🥚', 'Egg']
  const mood = hunger > 70 ? '😢 Very hungry' : hunger > 35 ? '😐 Peckish' : '😄 Happy'
  const feed = () => { if (coins < 3) { sfx('bad'); api.toast('🪙', 'Not enough coins', 'Study to earn XP, then come back'); return } const s = { owned: shop.owned, spent: shop.spent + 3 }; setShop(s); store.set('shop', s); const nf = pet.feeds + 1; save({ ...pet, fed: Date.now(), feeds: nf }); setNow(Date.now()); sfx('good'); celebrate('emoji', '🍎'); if ([1, 3, 8, 20].includes(nf)) { confetti(1.3); api.toast('🎉', 'Your owl grew!', 'It is now a ' + (nf >= 20 ? 'Wise Owl' : nf >= 8 ? 'Owl' : nf >= 3 ? 'Owlet' : 'Hatchling'), true) } }
  return <div className="center"><button className="pet-e" onClick={() => { setHearts(h => [...h, Date.now()]); setTimeout(() => setHearts(h => h.slice(1)), 1200); sfx('pop') }} aria-label="Pet your owl">{stage[0]}{hearts.map(h => <i key={h} className="heart">💖</i>)}</button>
    <input className="pet-n" value={pet.name} maxLength={14} onChange={e => save({ ...pet, name: e.target.value })} aria-label="Pet name" />
    <p><b>{stage[1]}</b> · {mood}</p><div className="pbar" style={{ width: 220 }}><i style={{ width: `${100 - hunger}%`, background: hunger > 70 ? 'var(--bad)' : undefined }} /></div>
    <button className="btn" onClick={feed}>🍎 Feed · 🪙 3</button><p className="note">🪙 {coins} coins · Fed {pet.feeds} times · Age {Math.max(0, Math.floor((now - pet.born) / 864e5))} days</p></div>
}

/* 21. Team scoreboard */
type Team = { n: string; s: number }
export function Scores() {
  const [t, setT] = useState<Team[]>([]); const [v, setV] = useState('')
  useEffect(() => { const s = store.get<Team[]>('teams', []); setT(Array.isArray(s) ? s : []) }, [])
  const put = (n: Team[]) => { setT(n); store.set('teams', n) }
  const top = t.length ? Math.max(...t.map(x => x.s)) : 0
  const bump = (i: number, d: number) => { const n = t.map((x, j) => (j === i ? { ...x, s: x.s + d } : x)); put(n); sfx(d > 0 ? 'good' : 'bad'); if (d > 0 && n[i].s > top) { celebrate('stars', '⭐') } }
  return <div><form className="row" style={{ justifyContent: 'flex-start' }} onSubmit={e => { e.preventDefault(); const n = v.trim().slice(0, 20); if (!n || t.length >= 8) return; put([...t, { n, s: 0 }]); setV(''); sfx('pop') }}><input className="grow" value={v} onChange={e => setV(e.target.value)} placeholder="Team name" aria-label="Team name" /><button className="btn">Add team</button><button type="button" className="btn ghost" onClick={() => put(t.map(x => ({ ...x, s: 0 })))}>Reset scores</button></form>
    <div className="teams">{t.length === 0 && <p className="note">Add teams for a class game.</p>}{t.map((x, i) => <div key={x.n + i} className={'team' + (x.s === top && top > 0 ? ' lead' : '')}><b>{x.n}{x.s === top && top > 0 ? ' 👑' : ''}</b><div className="tscore">{x.s}</div><div className="row"><button className="btn ghost" onClick={() => bump(i, -1)}>−1</button><button className="btn" onClick={() => bump(i, 1)}>+1</button><button className="btn" onClick={() => bump(i, 5)}>+5</button></div><button className="x" onClick={() => put(t.filter((_, j) => j !== i))} aria-label="Remove team">✕</button></div>)}</div></div>
}
