'use client'
import { useState } from 'react'
import { ai } from '@/lib/api'
import { sfx } from '@/lib/fx'
import { epochDay, type Box } from '@/lib/progress'
import type { Api } from './api'

type Card = { front: string; back: string }
const GAP = [0, 1, 3, 7, 14]

export default function Cards({ api, onFinish }: { api: Api; onFinish: (k: number, t: number) => void }) {
  const [cards, setCards] = useState<Card[] | null>(null); const [rev, setRev] = useState(false); const [i, setI] = useState(0); const [known, setKnown] = useState(0)
  const [flip, setFlip] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const due = api.p.box.filter(b => b.due <= epochDay())

  async function make() {
    setBusy(true); setErr('')
    try { const j = await ai({ mode: 'cards', subject: api.subj, topic: api.topic }); setCards(j.data); setRev(false); setI(0); setKnown(0); setFlip(false) } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  function review() { setCards(due.slice(0, 10).map(b => ({ front: b.front, back: b.back }))); setRev(true); setI(0); setKnown(0); setFlip(false) }
  function next(g: boolean) {
    if (!cards) return; const c = cards[i]; sfx(g ? 'good' : 'pop')
    api.patch(p => {
      const ex = p.box.find(b => b.front === c.front)
      if (g && ex) { const bx = ex.box + 1; return { ...p, box: bx >= GAP.length ? p.box.filter(b => b !== ex) : p.box.map(b => b === ex ? { ...b, box: bx, due: epochDay() + GAP[bx] } : b) } }
      if (!g) { const nb: Box = { front: c.front, back: c.back, subj: api.subj, box: 0, due: epochDay() + 1 }; return { ...p, box: [nb, ...p.box.filter(b => b.front !== c.front)].slice(0, 120) } }
      return p
    })
    const k = known + (g ? 1 : 0); if (g) setKnown(k); setFlip(false); if (i + 1 >= cards.length) onFinish(k, cards.length); setI(n => n + 1)
  }
  const finished = !!cards && i >= cards.length
  return <section>
    <div className="row" style={{ justifyContent: 'flex-start', marginBottom: 16 }}><button className="btn" onClick={make} disabled={busy}>{cards ? 'New cards' : 'Make 8 flashcards'}</button>
      <button className="btn ghost" onClick={review} disabled={!due.length}>🧠 Review due cards ({due.length})</button><span className="note">Cards you miss come back later (spaced repetition).</span></div>
    {busy && <div className="busy">Making your cards…</div>}{err && <div className="notice">{err}</div>}
    {!busy && cards && !finished && <div className="deck">
      <span className="note">{rev ? 'Review session' : 'New cards'} · {api.p.box.length} in your review box</span>
      <div className={'card' + (flip ? ' flip' : '')} key={i} role="button" tabIndex={0} aria-label="Flip card" onClick={() => { setFlip(!flip); sfx('pop') }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlip(!flip) } }}>
        <div><div className="face front">{cards[i].front}</div><div className="face back">{cards[i].back}</div></div></div>
      <div className="row"><button className="btn ghost" onClick={() => next(false)}>Still learning</button><span className="note">{i + 1} of {cards.length}</span><button className="btn" onClick={() => next(true)}>Got it</button></div></div>}
    {!busy && finished && cards && <div className="result"><div className="score">{known} / {cards.length} known 🎉</div><p className="note">Make a new set or review your due cards.</p></div>}
  </section>
}
