'use client'
import { useEffect, useState } from 'react'
import { store } from '@/lib/api'
import { sfx, confetti, celebrate } from '@/lib/fx'
import { SYLLABUS, MOODS, SHOP } from '@/lib/more'
import { dayKey } from '@/lib/progress'
import type { Api } from './api'

const dkey = (d: Date) => dayKey(d)

/* Past paper score log with a line chart */
type Score = { d: string; s: string; pct: number }
function Scores({ api }: { api: Api }) {
  const [list, setList] = useState<Score[]>([]); const [got, setGot] = useState(''); const [tot, setTot] = useState('100')
  useEffect(() => { const s = store.get<Score[]>('scores', []); setList(Array.isArray(s) ? s : []) }, [])
  const mine = list.filter(x => x.s === api.subj).slice(-12)
  function add() {
    const g = parseFloat(got), t = parseFloat(tot); if (!isFinite(g) || !isFinite(t) || t <= 0 || g < 0) return
    const n = [...list, { d: dkey(new Date()), s: api.subj, pct: Math.min(100, Math.round((g / t) * 100)) }].slice(-120); setList(n); store.set('scores', n); setGot(''); sfx('good'); api.award({ k: 'bonus', xp: 6 })
  }
  const W = 560, H = 170, pad = 24, pts = mine.map((x, i) => [pad + (mine.length < 2 ? (W - 2 * pad) / 2 : (i * (W - 2 * pad)) / (mine.length - 1)), H - pad - (x.pct / 100) * (H - 2 * pad)] as const)
  const avg = mine.length ? Math.round(mine.reduce((a, b) => a + b.pct, 0) / mine.length) : 0
  return <div><p className="note">Log your past paper and test marks for {api.subj}. Watch the line climb.</p>
    <div className="conv"><input value={got} inputMode="decimal" onChange={e => setGot(e.target.value)} placeholder="Marks" aria-label="Marks got" /><span>out of</span><input value={tot} inputMode="decimal" onChange={e => setTot(e.target.value)} aria-label="Total" /><button className="btn" onClick={add}>Add score</button></div>
    {mine.length === 0 ? <p className="note" style={{ marginTop: 14 }}>No scores for this subject yet.</p> :
      <div className="chart-w"><svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Score chart">
        {[0, 50, 100].map(v => <g key={v}><line x1={pad} x2={W - pad} y1={H - pad - (v / 100) * (H - 2 * pad)} y2={H - pad - (v / 100) * (H - 2 * pad)} className="gl-l" /><text x={2} y={H - pad - (v / 100) * (H - 2 * pad) + 4} className="gl-t">{v}</text></g>)}
        <polyline points={pts.map(p => p.join(',')).join(' ')} className="ln" />{pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={5} className="dt"><title>{mine[i].pct}% on {mine[i].d}</title></circle>)}</svg>
        <div className="note">Average {avg}% over {mine.length} {mine.length === 1 ? 'score' : 'scores'} · latest {mine[mine.length - 1].pct}%</div></div>}
    {mine.length > 0 && <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => { const n = list.filter(x => x.s !== api.subj); setList(n); store.set('scores', n) }}>Clear {api.subj} scores</button>}</div>
}

/* Syllabus checklist with progress ring */
function Syllabus({ api }: { api: Api }) {
  const topics = SYLLABUS[api.subj] || []; const [done, setDone] = useState<string[]>([])
  useEffect(() => { const s = store.get<string[]>('syl:' + api.subj, []); setDone(Array.isArray(s) ? s : []) }, [api.subj])
  const tog = (t: string) => { const n = done.includes(t) ? done.filter(x => x !== t) : [...done, t]; setDone(n); store.set('syl:' + api.subj, n); sfx(done.includes(t) ? 'pop' : 'good'); if (n.length === topics.length && n.length > 0) { celebrate('fireworks'); sfx('win'); api.award({ k: 'bonus', xp: 30 }); api.say(`${api.subj} syllabus complete! 🏆`) } }
  const pct = topics.length ? Math.round((done.length / topics.length) * 100) : 0
  return <div><div className="syl-top"><div className="g-ring" style={{ ['--p' as string]: `${pct}%` }}><b>{pct}%</b><small>{done.length}/{topics.length}</small></div><p className="note">Tick each topic when you feel confident. Finish them all for a big celebration.</p></div>
    <div className="syl">{topics.map(t => <button key={t} className={'syl-i' + (done.includes(t) ? ' on' : '')} onClick={() => tog(t)}><span>{done.includes(t) ? '✅' : '⬜'}</span>{t}</button>)}</div></div>
}

/* Habit tracker */
function Habits({ api }: { api: Api }) {
  const [h, setH] = useState<Record<string, string[]>>({}); const [v, setV] = useState('')
  useEffect(() => { const s = store.get<Record<string, string[]>>('habits', {}); setH(s && typeof s === 'object' && !Array.isArray(s) ? s : {}) }, [])
  const put = (n: Record<string, string[]>) => { setH(n); store.set('habits', n) }
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { k: dkey(d), l: d.toLocaleDateString('en-GB', { weekday: 'narrow' }) } })
  const toggle = (name: string, k: string) => { const cur = h[name] || []; const has = cur.includes(k); put({ ...h, [name]: has ? cur.filter(x => x !== k) : [...cur, k] }); sfx(has ? 'pop' : 'good'); if (!has && k === dkey(new Date())) api.award({ k: 'bonus', xp: 2 }) }
  return <div><form className="row" style={{ justifyContent: 'flex-start' }} onSubmit={e => { e.preventDefault(); const t = v.trim().slice(0, 30); if (!t || h[t] || Object.keys(h).length >= 8) return; put({ ...h, [t]: [] }); setV(''); sfx('pop') }}>
    <input className="grow" value={v} onChange={e => setV(e.target.value)} placeholder="New habit, e.g. Read 10 pages" aria-label="New habit" /><button className="btn">Add habit</button></form>
    <div className="habits">{Object.keys(h).length === 0 && <p className="note">Add a habit to start a streak.</p>}
      {Object.keys(h).map(n => <div key={n} className="habit"><b>{n}</b><div className="hd">{days.map(d => <button key={d.k} className={(h[n] || []).includes(d.k) ? 'on' : ''} onClick={() => toggle(n, d.k)} aria-label={`${n} on ${d.k}`}><small>{d.l}</small></button>)}</div>
        <button className="x" onClick={() => { const c = { ...h }; delete c[n]; put(c) }} aria-label="Remove habit">✕</button></div>)}</div></div>
}

/* Mood check-in */
function Mood({ api }: { api: Api }) {
  const [m, setM] = useState<Record<string, string>>({})
  useEffect(() => { const s = store.get<Record<string, string>>('moods', {}); setM(s && typeof s === 'object' ? s : {}) }, [])
  const today = dkey(new Date()); const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return dkey(d) })
  const set = (e: string) => { const n = { ...m, [today]: e }; setM(n); store.set('moods', n); sfx('good'); if (!m[today]) api.award({ k: 'bonus', xp: 3 }); api.say(e === '😟' || e === '😴' ? 'Be kind to yourself. Take a short break.' : 'Love that energy! 🦉', 'cheer') }
  return <div className="center"><h3>How are you feeling today?</h3><div className="moods">{MOODS.map(([e, l]) => <button key={e} className={m[today] === e ? 'on' : ''} onClick={() => set(e)}><span>{e}</span><small>{l}</small></button>)}</div>
    <p className="note">Last 14 days</p><div className="mood-h">{days.map(d => <span key={d} title={d}>{m[d] || '·'}</span>)}</div></div>
}

/* Win of the day */
type Win = { d: string; t: string }
function Wins({ api }: { api: Api }) {
  const [list, setList] = useState<Win[]>([]); const [v, setV] = useState('')
  useEffect(() => { const s = store.get<Win[]>('wins', []); setList(Array.isArray(s) ? s : []) }, [])
  return <div><p className="note">Write one thing you did well today, however small. It trains your brain to notice progress.</p>
    <form className="row" style={{ justifyContent: 'flex-start' }} onSubmit={e => { e.preventDefault(); const t = v.trim().slice(0, 140); if (!t) return; const n = [{ d: dkey(new Date()), t }, ...list].slice(0, 60); setList(n); store.set('wins', n); setV(''); sfx('win'); confetti(0.5); api.award({ k: 'bonus', xp: 3 }) }}>
      <input className="grow" value={v} onChange={e => setV(e.target.value)} placeholder="Today I…" aria-label="Today's win" /><button className="btn">Save win 🌟</button></form>
    <ul className="wins">{list.slice(0, 12).map((w, i) => <li key={i} style={{ animationDelay: `${i * 40}ms` }}><small>{w.d}</small>{w.t}</li>)}</ul></div>
}

/* Exam countdown wall */
type Ex = { n: string; d: string }
function Wall() {
  const [list, setList] = useState<Ex[]>([]); const [n, setN] = useState(''); const [d, setD] = useState('')
  useEffect(() => { const s = store.get<Ex[]>('exams', []); setList(Array.isArray(s) ? s : []) }, [])
  const put = (x: Ex[]) => { const s = [...x].sort((a, b) => a.d.localeCompare(b.d)); setList(s); store.set('exams', s) }
  const left = (dt: string) => Math.ceil((new Date(dt + 'T00:00:00').getTime() - Date.now()) / 864e5)
  return <div><form className="row" style={{ justifyContent: 'flex-start' }} onSubmit={e => { e.preventDefault(); if (!n.trim() || !d || list.length >= 12) return; put([...list, { n: n.trim().slice(0, 30), d }]); setN(''); setD(''); sfx('good') }}>
    <input className="grow" value={n} onChange={e => setN(e.target.value)} placeholder="Paper name, e.g. Maths Paper 2" aria-label="Exam name" /><input type="date" value={d} onChange={e => setD(e.target.value)} aria-label="Exam date" /><button className="btn">Add</button></form>
    <div className="wall">{list.length === 0 && <p className="note">Add your exams to see the countdown wall.</p>}{list.map((x, i) => { const l = left(x.d), s = String(Math.max(0, l)).padStart(3, '0'); return <div key={i} className={'wall-i' + (l <= 7 && l >= 0 ? ' hot' : '')}><div className="flipd">{s.split('').map((c, j) => <span key={j}>{c}</span>)}</div><b>{x.n}</b><small>{l < 0 ? 'Done' : l === 0 ? 'Today! Good luck 🍀' : 'days to go'}</small><button onClick={() => put(list.filter((_, j) => j !== i))} aria-label="Remove exam">✕</button></div> })}</div></div>
}

/* XP shop */
function Shop({ api }: { api: Api }) {
  const [shop, setShop] = useState<{ owned: string[]; spent: number }>({ owned: [], spent: 0 })
  useEffect(() => { const s = store.get<{ owned: string[]; spent: number }>('shop', { owned: [], spent: 0 }); setShop(s && Array.isArray(s.owned) ? s : { owned: [], spent: 0 }) }, [])
  const coins = Math.max(0, Math.floor(api.p.xp / 10) - shop.spent)
  const save = (s: typeof shop) => { setShop(s); store.set('shop', s) }
  const buy = (it: typeof SHOP[number]) => { if (shop.owned.includes(it.id) || coins < it.cost) { sfx('bad'); return } save({ owned: [...shop.owned, it.id], spent: shop.spent + it.cost }); sfx('win'); celebrate('emoji', it.e); apply(it.id); api.toast(it.e, `Unlocked: ${it.name}`, 'Equipped!', true) }
  const apply = (id: string) => { if (id.startsWith('trail-')) api.setCfg({ trail: id.slice(6) as never }); else if (id === 'party') api.setCfg({ party: true }); else if (id === 'crown') api.setCfg({ crown: true }) }
  return <div><div className="coins"><span>🪙</span><b>{coins}</b><small>coins · earn 1 for every 10 XP</small></div>
    <div className="shop">{SHOP.map(it => { const own = shop.owned.includes(it.id); return <div key={it.id} className={'shop-i tilt' + (own ? ' own' : '')}><span className="se">{it.e}</span><b>{it.name}</b><small>{it.desc}</small>
      {own ? <button className="btn ghost" onClick={() => { apply(it.id); sfx('pop') }}>Equip</button> : <button className="btn" disabled={coins < it.cost} onClick={() => buy(it)}>🪙 {it.cost}</button>}</div> })}</div>
    <div className="row" style={{ marginTop: 14 }}><button className="btn ghost" onClick={() => api.setCfg({ trail: 'sparkle', party: false, crown: false })}>Reset looks</button></div></div>
}

/* Backup and restore */
function Backup() {
  const [txt, setTxt] = useState(''); const [msg, setMsg] = useState('')
  const dump = () => { const o: Record<string, string> = {}; try { Object.keys(localStorage).filter(k => k.startsWith('wob:')).forEach(k => { o[k] = localStorage.getItem(k) || '' }) } catch {} return JSON.stringify(o) }
  const download = () => { const a = document.createElement('a'); a.download = 'study-buddy-backup.json'; a.href = URL.createObjectURL(new Blob([dump()], { type: 'application/json' })); a.click(); setMsg('Backup saved to your downloads ✅'); sfx('good') }
  const restore = () => { try { const o = JSON.parse(txt); if (!o || typeof o !== 'object') throw new Error('bad'); Object.entries(o).forEach(([k, v]) => { if (k.startsWith('wob:') && typeof v === 'string') localStorage.setItem(k, v) }); setMsg('Restored! Reloading…'); setTimeout(() => location.reload(), 700) } catch { setMsg('That backup text is not valid.'); sfx('bad') } }
  return <div><p className="note">Your progress lives in this browser. Save a backup to move it to a new phone or computer.</p>
    <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn" onClick={download}>⬇️ Download backup</button><button className="btn ghost" onClick={async () => { try { await navigator.clipboard.writeText(dump()); setMsg('Copied to clipboard ✅') } catch { setMsg('Could not copy. Use download instead.') } }}>📋 Copy backup</button></div>
    <textarea className="essay" rows={4} value={txt} onChange={e => setTxt(e.target.value)} placeholder="Paste a backup here to restore it…" aria-label="Backup text" style={{ marginTop: 12 }} />
    <div className="row" style={{ justifyContent: 'flex-start', marginTop: 8 }}><button className="btn ghost" onClick={restore} disabled={!txt.trim()}>♻️ Restore</button><span className="note">{msg}</span></div></div>
}

/* Personal bests */
function Bests({ api }: { api: Api }) {
  const rows: [string, string][] = [['⚡ Daily 5', 'd5'], ['🃏 Memory', 'mem'], ['⌨️ Typer (WPM)', 'typer'], ['🦉 Hoot Hunt', 'hunt'], ['✅ True/False', 'sprint']]
  return <div><div className="bests">{rows.map(([l, k]) => <div key={k} className="best tilt"><small>{l}</small><b>{store.get<number>('best:' + k, 0)}</b></div>)}
    <div className="best tilt"><small>⚡ Best combo</small><b>{api.p.bestCombo}</b></div><div className="best tilt"><small>🧠 Quizzes</small><b>{api.p.quizzes}</b></div><div className="best tilt"><small>💯 Perfect</small><b>{api.p.perfect}</b></div></div></div>
}

const TABS = [['sc', '📈 Scores'], ['sy', '✅ Syllabus'], ['hb', '🔁 Habits'], ['md', '😊 Mood'], ['wn', '🌟 Wins'], ['wl', '📅 Exam wall'], ['sh', '🛍️ Shop'], ['bs', '🏅 Bests'], ['bk', '💾 Backup']] as const
export default function Track({ api }: { api: Api }) {
  const [t, setT] = useState<typeof TABS[number][0]>('sc')
  return <div><div className="seg wrapseg" role="group" aria-label="Tracking tools">{TABS.map(([k, l]) => <button key={k} aria-pressed={t === k} onClick={() => { setT(k); sfx('pop') }}>{l}</button>)}</div>
    <div className="game" key={t}>{t === 'sc' && <Scores api={api} />}{t === 'sy' && <Syllabus api={api} />}{t === 'hb' && <Habits api={api} />}{t === 'md' && <Mood api={api} />}{t === 'wn' && <Wins api={api} />}{t === 'wl' && <Wall />}{t === 'sh' && <Shop api={api} />}{t === 'bs' && <Bests api={api} />}{t === 'bk' && <Backup />}</div></div>
}
