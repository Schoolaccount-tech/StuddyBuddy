'use client'
import { useEffect, useState } from 'react'
import { store } from '@/lib/api'
import { dayKey } from '@/lib/progress'
import { getTM, weakSpots } from '@/lib/learn'
import { sfx, confetti } from '@/lib/fx'
import type { Api } from './api'

type Item = { id: string; k: 'avatar' | 'title' | 'frame'; e: string; name: string; cost: number }
const ITEMS: Item[] = [
  { id: 'a-owl', k: 'avatar', e: '🦉', name: 'Wise Owl', cost: 0 }, { id: 'a-eagle', k: 'avatar', e: '🦅', name: 'Eagle Eye', cost: 20 }, { id: 'a-parrot', k: 'avatar', e: '🦜', name: 'Parrot', cost: 20 },
  { id: 'a-fox', k: 'avatar', e: '🦊', name: 'Clever Fox', cost: 30 }, { id: 'a-pen', k: 'avatar', e: '🐧', name: 'Penguin', cost: 30 }, { id: 'a-lion', k: 'avatar', e: '🦁', name: 'Lion', cost: 45 },
  { id: 'a-uni', k: 'avatar', e: '🦄', name: 'Unicorn', cost: 60 }, { id: 'a-robot', k: 'avatar', e: '🤖', name: 'Robot', cost: 60 }, { id: 'a-dragon', k: 'avatar', e: '🐲', name: 'Dragon', cost: 90 }, { id: 'a-crown', k: 'avatar', e: '👑', name: 'Royal Owl', cost: 150 },
  { id: 't-new', k: 'title', e: '🌱', name: 'Fresh Learner', cost: 0 }, { id: 't-night', k: 'title', e: '🌙', name: 'Night Owl', cost: 25 }, { id: 't-math', k: 'title', e: '➗', name: 'Maths Wizard', cost: 40 },
  { id: 't-sci', k: 'title', e: '🔬', name: 'Lab Legend', cost: 40 }, { id: 't-exam', k: 'title', e: '🎯', name: 'Exam Slayer', cost: 70 }, { id: 't-house', k: 'title', e: '🛡️', name: 'House Hero', cost: 70 }, { id: 't-star', k: 'title', e: '🌟', name: 'Scholar of Westgate', cost: 120 },
  { id: 'f-gold', k: 'frame', e: '🟡', name: 'Gold frame', cost: 30 }, { id: 'f-sky', k: 'frame', e: '🔵', name: 'Sky frame', cost: 30 }, { id: 'f-rose', k: 'frame', e: '🌸', name: 'Rose frame', cost: 30 }, { id: 'f-rainbow', k: 'frame', e: '🌈', name: 'Rainbow frame', cost: 100 },
]
const FRAME: Record<string, string> = { 'f-gold': '#f2c500', 'f-sky': '#38bdf8', 'f-rose': '#fb7185', 'f-rainbow': 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }
type Rw = { spent: number; owned: string[]; avatar: string; title: string; frame: string }
const DEF: Rw = { spent: 0, owned: ['a-owl', 't-new'], avatar: 'a-owl', title: 't-new', frame: '' }

export default function Rewards({ api }: { api: Api }) {
  const [rw, setRw] = useState<Rw>(DEF); const [exam, setExam] = useState(''); const [copied, setCopied] = useState(false)
  useEffect(() => { setRw({ ...DEF, ...store.get<Rw>('rw', DEF) }); setExam(store.get('hub-exam', '')); return undefined }, [])
  const save = (n: Rw) => { setRw(n); store.set('rw', n) }
  const coins = Math.max(0, Math.floor(api.p.xp / 5) - rw.spent)
  const cur = (k: Item['k']) => ITEMS.find(i => i.id === rw[k === 'avatar' ? 'avatar' : k === 'title' ? 'title' : 'frame'])
  function act(i: Item) {
    if (rw.owned.includes(i.id)) { save({ ...rw, [i.k]: rw[i.k] === i.id && i.k === 'frame' ? '' : i.id } as Rw); sfx('pop'); return }
    if (coins < i.cost) { api.toast('🪙', 'Not enough coins yet', `You need ${i.cost - coins} more. Quizzes and exam questions earn XP.`); sfx('bad'); return }
    save({ ...rw, spent: rw.spent + i.cost, owned: [...rw.owned, i.id], [i.k]: i.id } as Rw); sfx('win'); confetti(0.8); api.toast(i.e, `Unlocked: ${i.name}`, 'Equipped for you', true)
  }
  // Weekly report card from real activity.
  const days = Array.from({ length: 7 }, (_, n) => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d) })
  const weekAct = days.reduce((a, k) => a + (api.p.act[k] ?? 0), 0), weekMins = days.reduce((a, k) => a + (api.p.mins[k] ?? 0), 0), activeDays = days.filter(k => (api.p.act[k] ?? 0) > 0).length
  const tm = getTM(), tot = Object.values(tm).reduce((a, v) => ({ r: a.r + v.r, t: a.t + v.t }), { r: 0, t: 0 }), acc = tot.t ? Math.round((tot.r / tot.t) * 100) : null
  const weak = weakSpots()[0]; const daysLeft = exam ? Math.ceil((new Date(exam + 'T08:00:00').getTime() - Date.now()) / 864e5) : null
  const report = `📊 My Wise Owl week\n${weekAct} study actions on ${activeDays}/7 days · ${weekMins} focus minutes · ${api.p.streak.n}-day streak\n${acc !== null ? `Quiz accuracy: ${acc}% across ${tot.t} questions\n` : ''}${weak ? `Next focus: ${weak.topic} (${weak.subj})\n` : ''}${daysLeft !== null && daysLeft >= 0 ? `${daysLeft} days to my first exam\n` : ''}Wise Owl Westgate Study Buddy 🦉`
  async function copy() { try { await navigator.clipboard.writeText(report); setCopied(true); sfx('good'); setTimeout(() => setCopied(false), 2000) } catch {} }
  const av = cur('avatar'), ti = cur('title'), fr = rw.frame
  return <section className="rewards">
    <div className="avatarcard"><div className="avatar" style={{ background: fr ? FRAME[fr] : 'var(--owl)' }}><span>{av?.e}</span></div><div><h3>{api.p.nick || 'Wise Owl student'}</h3><div className="note">{ti?.e} {ti?.name}</div><div className="coins">🪙 <b>{coins}</b> coins</div><div className="note">Earn 1 coin for every 5 XP.</div></div></div>
    {(['avatar', 'title', 'frame'] as const).map(k => <div key={k}><h3>{k === 'avatar' ? '🦉 Avatars' : k === 'title' ? '🏷️ Titles' : '🖼️ Frames'}</h3>
      <div className="shopgrid">{ITEMS.filter(i => i.k === k).map(i => { const own = rw.owned.includes(i.id), on = rw[k] === i.id
        return <button key={i.id} className={'shopitem' + (on ? ' on' : '') + (own ? '' : ' locked')} onClick={() => act(i)} aria-pressed={on}><span className="se">{i.e}</span><b>{i.name}</b><small>{on ? 'Equipped' : own ? 'Tap to equip' : `🪙 ${i.cost}`}</small></button> })}</div></div>)}
    <h3>📊 Weekly report card</h3>
    <div className="hubcard"><pre className="report">{report}</pre><div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn" onClick={copy}>{copied ? 'Copied ✓' : 'Copy to share'}</button></div>
      <p className="note">Built from your own activity on this device. Send it to a parent or teacher.</p></div>
  </section>
}
