'use client'
import { useEffect, useRef, useState } from 'react'
import { ai } from '@/lib/api'
import { sfx, confetti } from '@/lib/fx'
import { recordTopic, getTM } from '@/lib/learn'
import type { Api } from './api'

type Q = { q: string; options: string[]; answer: number; explain: string; topic?: string }
type Card = { front: string; back: string }
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Owl Power sessions: Quick Learner (5-minute cards), Knowledge Scan (pre-test) and Perfect Recall (revision quiz). */
export default function PowerRun({ id, api, onClose }: { id: 'quick' | 'scan' | 'recall'; api: Api; onClose: () => void }) {
  const [busy, setBusy] = useState(true); const [err, setErr] = useState(''); const [qs, setQs] = useState<Q[]>([]); const [cards, setCards] = useState<Card[]>([])
  const [i, setI] = useState(0); const [sel, setSel] = useState<number | null>(null); const [right, setRight] = useState(0); const [show, setShow] = useState(false); const [known, setKnown] = useState(0); const [left, setLeft] = useState(300); const [done, setDone] = useState(false)
  const paid = useRef(false); const src = useRef('')
  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        if (id === 'quick') { const j = await ai({ mode: 'cards', subject: api.subj, topic: api.topic }); if (!dead) setCards(j.data.slice(0, 8)) }
        else if (id === 'scan') { const j = await ai({ mode: 'quiz', subject: api.subj, topic: api.topic, difficulty: 'medium', count: 5 }); if (!dead) setQs(j.data.slice(0, 5)) }
        else {
          const miss = api.p.miss.slice(0, 8).map(m => ({ q: m.q, options: m.options, answer: m.answer, explain: m.explain }))
          if (miss.length >= 3) { src.current = 'Built from your past mistakes'; if (!dead) setQs(miss) }
          else { const tm = getTM(), tops = Object.entries(tm).sort((a, b) => b[1].last - a[1].last).slice(0, 3).map(([k]) => k.split('::')[1]).filter(Boolean); src.current = tops.length ? 'Built from: ' + tops.join(', ') : 'Built from your subject'
            const j = await ai({ mode: 'quiz', subject: api.subj, topic: tops.join(', ') || api.topic, difficulty: 'medium', count: 5 }); if (!dead) setQs(j.data.slice(0, 5)) }
        }
      } catch (e: any) { if (!dead) setErr(e.message || 'Could not start. Try again.') }
      if (!dead) setBusy(false)
    })()
    return () => { dead = true }
  }, []) // eslint-disable-line
  useEffect(() => { if (id !== 'quick' || busy || done || err) return; const t = setInterval(() => setLeft(l => { if (l <= 1) { setDone(true); return 0 } return l - 1 }), 1000); return () => clearInterval(t) }, [busy, done, err]) // eslint-disable-line
  useEffect(() => {
    if (!done || paid.current) return; paid.current = true
    if (id === 'quick') { if (cards.length) api.award({ k: 'cards', known, total: Math.max(known, Math.min(cards.length, i)) || 1 }) }
    else if (qs.length) api.award({ k: 'quiz', subject: api.subj, right, total: qs.length, combo: 0 })
    sfx('win'); confetti(0.8)
  }, [done]) // eslint-disable-line
  const title = id === 'quick' ? '⚡ Quick Learner' : id === 'scan' ? '🔍 Knowledge Scan' : '🧠 Perfect Recall'
  const q = qs[i]
  function pick(j: number) { if (!q || sel !== null) return; const ok = j === q.answer; setSel(j); if (ok) setRight(r => r + 1); recordTopic(api.subj, q.topic || api.topic || 'General', ok ? 1 : 0, 1); sfx(ok ? 'good' : 'bad') }
  const nextQ = () => { if (i + 1 >= qs.length) setDone(true); else { setI(i + 1); setSel(null); sfx('pop') } }
  const nextC = (got: boolean) => { if (got) setKnown(k => k + 1); setShow(false); if (i + 1 >= cards.length) setDone(true); else setI(i + 1); sfx(got ? 'good' : 'pop') }
  const pct = qs.length ? Math.round((right / qs.length) * 100) : 0
  return <div className="ow-ov" role="dialog" aria-modal="true" aria-label={title}><div className="pr-box">
    <div className="pr-top"><h3>{title}</h3>{id === 'quick' && !busy && !done && <span className={'pr-time' + (left < 30 ? ' hot' : '')}>⏱ {fmt(left)}</span>}<button className="ow-btn ghost sm" onClick={onClose}>✕ Close</button></div>
    <p className="note">{api.subj}{api.topic ? ': ' + api.topic : ''}{src.current ? ' · ' + src.current : ''}</p>
    {busy && <div className="busy">{id === 'quick' ? 'Building your 5-minute session…' : id === 'scan' ? 'Writing your scan…' : 'Gathering what you studied…'}</div>}
    {err && <div className="notice">{err}</div>}
    {!busy && !err && !done && id === 'quick' && cards[i] && <div className="pr-card"><small>Card {i + 1} of {cards.length}</small><h3>{cards[i].front}</h3>{show ? <><p className="pr-back">{cards[i].back}</p><div className="ow-row"><button className="ow-btn" onClick={() => nextC(true)}>✅ Got it</button><button className="ow-btn ghost" onClick={() => nextC(false)}>🔁 Again later</button></div></> : <button className="ow-btn" onClick={() => setShow(true)}>Show answer</button>}</div>}
    {!busy && !err && !done && id !== 'quick' && q && <div className="q"><small className="note">Question {i + 1} of {qs.length}</small><h3>{q.q}</h3>
      {q.options.map((o, j) => <button key={j} className={'opt' + (sel === null ? '' : j === q.answer ? ' right' : sel === j ? ' wrong' : '')} disabled={sel !== null} onClick={() => pick(j)}><b>{String.fromCharCode(65 + j)}</b>{o}</button>)}
      {sel !== null && <><div className="why">{q.explain}</div><div className="ow-row"><button className="ow-btn" onClick={nextQ}>{i + 1 >= qs.length ? 'See results' : 'Next →'}</button></div></>}</div>}
    {done && <div className="pr-res">{id === 'quick' ? <><div className="score">{known} / {cards.length}</div><p>{left === 0 ? 'Time is up! ' : ''}{known >= cards.length * 0.7 ? 'Brilliant. That is a solid 5 minutes.' : 'Good start. Run it again to lock them in.'}</p></>
      : id === 'scan' ? <><div className="score">{right} / {qs.length}</div><p>{pct >= 80 ? '🌟 You already know this topic well. Jump to harder questions.' : pct >= 40 ? '📘 You know some of it. Focus on the gaps from the review below.' : '🌱 This topic is new to you. Start with the basics and use flashcards first.'}</p></>
      : <><div className="score">{right} / {qs.length}</div><p>{pct >= 80 ? 'Perfect recall! Your memory is sharp.' : 'Some of it slipped. Revise those and try again tomorrow.'}</p></>}
      <div className="ow-row"><button className="ow-btn" onClick={onClose}>Done</button></div></div>}
  </div></div>
}
