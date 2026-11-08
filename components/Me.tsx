'use client'
import { useRef, useState } from 'react'
import { LEVELS, BADGES, QUESTS, dayKey, levelOf, fresh } from '@/lib/progress'
import { confetti, celebrate, sfx, passport } from '@/lib/fx'
import CountUp from './CountUp'
import type { Api } from './api'

const PRIZES = [10, 5, 20, 15, 50, 5, 25, 100]
const WEIGHTS = [18, 22, 14, 16, 6, 22, 10, 2]

function Spin({ api }: { api: Api }) {
  const can = api.p.spin !== dayKey(); const [rot, setRot] = useState(0); const [busy, setBusy] = useState(false); const [won, setWon] = useState<number | null>(null)
  function go() {
    if (!can || busy) return
    let r = Math.random() * WEIGHTS.reduce((a, b) => a + b, 0), idx = 0; for (; idx < WEIGHTS.length; idx++) { r -= WEIGHTS[idx]; if (r <= 0) break }
    idx = Math.min(idx, PRIZES.length - 1); setBusy(true); sfx('pop'); api.patch(p => ({ ...p, spin: dayKey() }))
    setRot(360 * 6 - (idx * 45 + 22.5))
    setTimeout(() => { const xp = PRIZES[idx]; setWon(xp); setBusy(false); api.award({ k: 'bonus', xp }); api.toast('🎁', `You won ${xp} XP!`, 'Come back tomorrow for another spin', true); celebrate('stars', '🎁'); confetti(xp >= 50 ? 2 : 1) }, 4200)
  }
  const cols = ['#f2c500', '#ff5d8f', '#4cc9f0', '#7bd88f', '#a78bfa', '#fb923c', '#38bdf8', '#f472b6']
  return <div className="spin-card"><div className="wheel-wrap"><div className="pointer">▼</div>
    <div className="wheel" style={{ transform: `rotate(${rot}deg)`, background: `conic-gradient(${cols.map((c, i) => `${c} ${i * 45}deg ${(i + 1) * 45}deg`).join(',')})` }}>
      {PRIZES.map((x, i) => <span key={i} style={{ transform: `rotate(${i * 45 + 22.5}deg) translateY(-62px)` }}>{x}</span>)}</div></div>
    <div><h3 style={{ fontSize: 22 }}>Daily lucky spin</h3><p className="note" style={{ margin: '4px 0 10px' }}>{busy ? 'Good luck… 🍀' : won !== null ? `You won ${won} XP today!` : can ? 'Spin once a day for bonus XP.' : 'You already spun today. See you tomorrow!'}</p>
      <button className="btn" onClick={go} disabled={!can || busy}>{busy ? 'Spinning…' : can ? 'Spin the wheel' : 'Come back tomorrow'}</button></div></div>
}

function Heat({ api }: { api: Api }) {
  const days: { k: string; n: number }[] = []; const now = new Date()
  for (let i = 83; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); const k = dayKey(d); days.push({ k, n: api.p.act[k] ?? 0 }) }
  const pad = (new Date(now.getFullYear(), now.getMonth(), now.getDate() - 83).getDay() + 6) % 7
  const lvl = (n: number) => n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - (6 - i)); return { l: d.toLocaleDateString('en-GB', { weekday: 'narrow' }), m: api.p.mins[dayKey(d)] ?? 0 } })
  const mx = Math.max(30, ...week.map(w => w.m))
  return <div className="two"><div><h3 className="sec">Study activity</h3><div className="heat">{Array.from({ length: pad }, (_, i) => <i key={'p' + i} className="pad" />)}{days.map((d, i) => <i key={d.k} className={'h' + lvl(d.n)} title={`${d.k}: ${d.n} activities`} style={{ animationDelay: `${i * 8}ms` }} />)}</div><p className="note">Last 12 weeks. Darker means more study.</p></div>
    <div><h3 className="sec">Focus minutes, last 7 days</h3><div className="bars">{week.map((w, i) => <div key={i}><div className="bar"><i style={{ height: `${(w.m / mx) * 100}%`, animationDelay: `${i * 80}ms` }} /></div><small>{w.l}</small><b>{w.m}</b></div>)}</div></div></div>
}

export default function Me({ api, pct }: { api: Api; pct: number }) {
  const p = api.p; const lv = levelOf(p.xp); const cur = LEVELS[lv], nxt = LEVELS[lv + 1]; const subs = Object.entries(p.mastery); const [confirm, setConfirm] = useState(false)
  const top = subs.sort((a, b) => b[1].right / (b[1].total || 1) - a[1].right / (a[1].total || 1))[0]?.[0] ?? ''
  const nick = useRef<HTMLInputElement>(null)
  return <section>
    <div className="hero-me glow tilt"><div className="big-e">{cur.e}</div><div style={{ flex: 1, minWidth: 0 }}><h2 style={{ fontSize: 28 }}>{p.nick ? `${p.nick} the ${cur.n}` : cur.n}</h2>
      <p className="note" style={{ margin: '4px 0 10px' }}>{nxt ? `${nxt.xp - p.xp} XP to ${nxt.n} ${nxt.e}` : 'You reached the top level!'}</p><div className="xpbar wide"><i style={{ width: pct + '%' }} /></div></div></div>
    <div className="row" style={{ justifyContent: 'flex-start', margin: '12px 0' }}><input ref={nick} className="plain" style={{ maxWidth: 240 }} defaultValue={p.nick} maxLength={18} placeholder="Your name or nickname" aria-label="Nickname" onBlur={e => api.patch(x => ({ ...x, nick: e.target.value.trim() }))} />
      <button className="btn ghost" onClick={() => { sfx('win'); passport({ name: nick.current?.value.trim() || p.nick, level: `${cur.e} ${cur.n}`, xp: p.xp, streak: p.streak.n, badges: p.badges.length, total: BADGES.length, top }) }}>🪪 Save my study passport</button></div>
    <div className="stat-row">{([['🧠', 'Quizzes', p.quizzes], ['🃏', 'Card sets', p.cards], ['⏱️', 'Focus sessions', p.sessions], ['✅', 'Tasks done', p.tasks], ['🎯', 'Exam questions', p.exams]] as const).map(([e, l, n], i) =>
      <div key={l} className="stat tilt" style={{ animationDelay: `${i * 90}ms` }}><span>{e}</span><b><CountUp to={n} /></b><small>{l}</small></div>)}</div>
    <h3 className="sec">Today’s quests</h3>
    <div className="quests">{p.quests.items.map((q, i) => { const d = QUESTS.find(x => x.id === q.id)!; return <div key={q.id} className={'quest tilt' + (q.done ? ' done' : '')} style={{ animationDelay: `${i * 100}ms` }}>
      <span className="qe">{q.done ? '✅' : '🎯'}</span><div><b>{d.t}</b><div className="mbar"><i style={{ width: `${Math.min(100, (q.n / d.need) * 100)}%` }} /></div></div><span className="qx">+{d.xp} XP</span></div> })}</div>
    <Spin api={api} />
    <Heat api={api} />
    <h3 className="sec">Subject mastery</h3>
    {subs.length ? subs.map(([n, m]) => { const v = m.total ? Math.round((m.right / m.total) * 100) : 0; return <div key={n} className="mast"><span>{n}</span><div className="mbar"><i style={{ width: v + '%' }} /></div><b>{v}%</b></div> }) : <p className="note">Finish a quiz and your subject bars will grow here.</p>}
    <h3 className="sec">Badges <small className="note">{p.badges.length} of {BADGES.length}</small></h3>
    <div className="badges">{BADGES.map(b => { const on = p.badges.includes(b.id); return <div key={b.id} className={'badge tilt' + (on ? '' : ' locked')}><span className="em">{on ? b.e : '🔒'}</span><b>{b.name}</b><small>{b.desc}</small></div> })}</div>
    <div className="row" style={{ justifyContent: 'flex-start', marginTop: 24 }}>
      {!confirm ? <button className="linkish" onClick={() => setConfirm(true)}>Reset all my progress</button> : <><span className="note">This cannot be undone.</span>
        <button className="btn ghost" onClick={() => { api.patch(() => fresh()); setConfirm(false) }}>Yes, reset</button><button className="linkish" onClick={() => setConfirm(false)}>Cancel</button></>}</div>
  </section>
}
