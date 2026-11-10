'use client'
import { useEffect, useRef, useState } from 'react'
import { rpc, lgReady, getCode, setCode, clearCode, PERIODS, KINDS, houseColour, when } from '@/lib/league'
import { sfx, confetti } from '@/lib/fx'
import type { Api } from './api'
import LeagueAdmin from './LeagueAdmin'

const VIEWS = [['home', '🏠 Overview'], ['league', '🥇 Individual league'], ['houses', '🛡️ Houses'], ['play', '⚔️ Compete'], ['me', '👤 My profile'], ['trophies', '🏆 Trophies'], ['rules', '📜 Rules'], ['staff', '🔐 Staff']] as const
type View = typeof VIEWS[number][0]

function useRpc<T = any>(fn: string, args: object, deps: unknown[]) {
  const [d, setD] = useState<T | null>(null); const [err, setErr] = useState('')
  useEffect(() => {
    let on = true; setErr('')
    rpc<T>(fn, args).then(x => { if (on) setD(x) }).catch(e => { if (on) setErr(e.message) })
    return () => { on = false }
  }, deps) // eslint-disable-line
  return [d, err] as const
}

function Period({ v, set }: { v: string; set: (p: string) => void }) {
  return <div className="seg" role="group" aria-label="Time period">{PERIODS.map(([k, l]) => <button key={k} aria-pressed={v === k} onClick={() => { set(k); sfx('pop') }}>{l}</button>)}</div>
}
const Chip = ({ house }: { house?: string | null }) => house ? <span className="hchip" style={{ background: houseColour(house) }}>{house}</span> : null

function HouseBars({ rows }: { rows: any[] }) {
  const max = Math.max(1, ...rows.map(r => r.points))
  if (!rows.length) return <p className="note">No houses found.</p>
  return <div className="hbars">{rows.map((r, i) => <div key={r.house} className="hbar">
    <div className="hb-top"><b>{['🥇', '🥈', '🥉'][i] || ''} {r.house}</b><span>{r.points} pts</span></div>
    <div className="hb-track"><i style={{ width: `${Math.max(2, (r.points / max) * 100)}%`, background: houseColour(r.house, r.colour) }} /></div>
    <small>{r.players} of {r.students} students taking part ({r.students ? Math.round((r.players / r.students) * 100) : 0}%)</small></div>)}</div>
}

function Board({ period, subject }: { period: string; subject: string }) {
  const [rows, err] = useRpc<any[]>('lg_board', { p_period: period, p_subject: subject || null }, [period, subject])
  if (err) return <div className="notice">{err}</div>
  if (!rows) return <div className="busy">Loading…</div>
  if (!rows.length) return <p className="note">No points yet in this period. Be the first on the board!</p>
  return <div className="lgtable" role="table">{rows.map((r, i) => <div key={i} className={'lgrow r' + Math.min(r.rank, 4)} role="row">
    <b className="lgrank">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</b>
    <span className="lgname">{r.who} <Chip house={r.house} /></span>
    <span className="lgmedals">{r.gold > 0 && `🥇${r.gold} `}{r.silver > 0 && `🥈${r.silver} `}{r.bronze > 0 && `🥉${r.bronze}`}</span>
    <b className="lgpts">{r.points}</b></div>)}</div>
}

function Gate({ onSignIn, note }: { onSignIn: (code: string, remember: boolean) => Promise<string>; note?: string }) {
  const [c, setC] = useState(''); const [rem, setRem] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function go(e: React.FormEvent) { e.preventDefault(); if (c.trim().length < 4) return; setBusy(true); setErr(''); const m = await onSignIn(c.trim(), rem); if (m) setErr(m); setBusy(false) }
  return <form className="gate" onSubmit={go}>
    <h3>Enter your student code</h3><p className="note">{note || 'Your 8-character student code is on your school ID. Ask your teacher if you do not have one.'}</p>
    <div className="row" style={{ justifyContent: 'flex-start' }}><input className="grow" value={c} onChange={e => setC(e.target.value)} placeholder="Student code" aria-label="Student code" autoComplete="off" autoCapitalize="characters" maxLength={20} />
      <button className="btn" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button></div>
    <label className="switch"><input type="checkbox" checked={rem} onChange={e => setRem(e.target.checked)} /><span /> Remember me on this device (only on your own phone or laptop)</label>
    {err && <div className="notice">{err}</div>}</form>
}

function Play({ code, me, refresh }: { code: string; me: any; refresh: () => void }) {
  const [join, setJoin] = useState(''); const [ev, setEv] = useState<any>(null); const [ans, setAns] = useState<number[]>([]); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<any>(null); const [review, setReview] = useState<any>(null); const t0 = useRef(0)
  async function open(e: React.FormEvent) {
    e.preventDefault(); if (join.trim().length < 4) return; setBusy(true); setErr('')
    try { const r = await rpc('lg_event_questions', { p_code: code, p_join: join }); if (!r.ok) setErr(r.error); else { setEv(r); setAns(Array(r.questions.length).fill(-1)); t0.current = Date.now(); sfx('pop') } } catch (x: any) { setErr(x.message) }
    setBusy(false)
  }
  async function submit() {
    if (ans.includes(-1) && !confirm('Some questions are unanswered and will count as wrong. Submit anyway?')) return
    setBusy(true); setErr('')
    try {
      const r = await rpc('lg_submit_event', { p_code: code, p_join: join, p_answers: ans, p_secs: Math.round((Date.now() - t0.current) / 1000) })
      if (!r.ok) setErr(r.error); else { setRes(r); sfx(r.score === r.total ? 'win' : 'good'); if (r.score / r.total >= 0.7) confetti(r.score === r.total ? 1.8 : 1); refresh() }
    } catch (x: any) { setErr(x.message) }
    setBusy(false)
  }
  async function showReview() { setBusy(true); try { const r = await rpc('lg_event_review', { p_code: code, p_join: join }); if (!r.ok) setErr(r.error); else setReview(r.review) } catch (x: any) { setErr(x.message) } setBusy(false) }
  if (res) return <section className="result"><div className="score">{res.score} / {res.total} {res.score === res.total ? '🏆' : '👏'}</div>
    <p>{res.status === 'approved' ? <>You earned <b>{res.points} points</b> for yourself and for {me.house || 'your house'}.</> : 'Your result is waiting for a teacher to approve it.'}</p>
    <p className="note">Correct answers are shown once the competition closes. Come back to this page and enter the same code to review.</p>
    {review && <div className="review">{review.map((q: any, i: number) => <div key={i} className="q"><h3>{q.q}</h3><div className="why"><b>Answer:</b> {q.options[q.answer]}{q.mine === q.answer ? ' ✅' : q.mine >= 0 ? ` (you chose ${q.options[q.mine]})` : ' (not answered)'}. {q.explain}</div></div>)}</div>}
    {err && <div className="notice">{err}</div>}
    <div className="row"><button className="btn ghost" onClick={showReview} disabled={busy}>Review answers</button><button className="btn" onClick={() => { setRes(null); setEv(null); setJoin(''); setReview(null); setErr('') }}>Done</button></div></section>
  if (!ev) return <form onSubmit={open} className="gate"><h3>Join a competition</h3><p className="note">Your teacher gives you a 6-letter competition code. Each competition can be played once.</p>
    <div className="row" style={{ justifyContent: 'flex-start' }}><input className="grow" value={join} onChange={e => setJoin(e.target.value.toUpperCase())} placeholder="Competition code" aria-label="Competition code" maxLength={8} autoComplete="off" /><button className="btn" disabled={busy}>{busy ? 'Opening…' : 'Start'}</button></div>
    {err && <div className="notice">{err}</div>}</form>
  return <section><div className="qhead"><b>{ev.title}</b><span className="note">{KINDS[ev.kind] || ev.kind}{ev.subject ? ' · ' + ev.subject : ''}</span></div>
    {ev.questions.map((q: any, i: number) => <div key={i} className="q"><h3>{i + 1}. {q.q}</h3><div className="opts">{q.options.map((o: string, j: number) => <button key={j} className={'opt' + (ans[i] === j ? ' sel' : '')} aria-pressed={ans[i] === j} onClick={() => { setAns(a => a.map((v, k) => k === i ? j : v)); sfx('pop') }}>{o}</button>)}</div></div>)}
    {err && <div className="notice">{err}</div>}
    <div className="row"><span className="note">{ans.filter(a => a >= 0).length} of {ans.length} answered</span><button className="btn" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit answers'}</button></div></section>
}

function Me({ me, code, refresh, signOut }: { me: any; code: string; refresh: () => void; signOut: () => void }) {
  const [msg, setMsg] = useState(''); const maxSub = Math.max(1, ...(me.subjects || []).map((s: any) => s.points))
  async function hide(h: boolean) { try { await rpc('lg_set_hidden', { p_code: code, p_hidden: h }); refresh() } catch (e: any) { setMsg(e.message) } }
  async function dispute(id: string) { const n = prompt('Why do you think this result is wrong?') ; if (!n) return; try { const r = await rpc('lg_dispute', { p_code: code, p_result: id, p_note: n }); setMsg(r.ok ? 'Your teacher will review this result.' : r.error); refresh() } catch (e: any) { setMsg(e.message) } }
  return <section className="lgme">
    <div className="lgme-head"><div><h2>{me.name}</h2><Chip house={me.house} /> <span className="note">{me.season ? me.season : 'No season running'}</span></div>
      <div className="lgme-rank">{me.rank ? <><b>#{me.rank}</b><small>of {me.ranked} ranked</small></> : <small>Not ranked yet</small>}</div></div>
    <div className="lgstats">{[['This week', me.points.week], ['This month', me.points.month], ['Season', me.points.season], ['All time', me.points.all]].map(([l, v]) => <div key={l as string} className="stat"><b>{v as number}</b><span>{l}</span></div>)}</div>
    <div className="lgcap"><span className="note">Practice points today: {me.practice_today} / {me.practice_cap}</span><div className="hb-track"><i style={{ width: `${Math.min(100, (me.practice_today / Math.max(1, me.practice_cap)) * 100)}%`, background: 'var(--owl)' }} /></div></div>
    <div className="lgstats"><div className="stat"><b>{me.events.played}</b><span>Competitions</span></div><div className="stat"><b>{me.events.avg ?? '–'}{me.events.avg != null ? '%' : ''}</b><span>Average score</span></div><div className="stat"><b>{me.events.perfect}</b><span>Full marks</span></div>
      <div className="stat"><b>🥇{me.medals.gold} 🥈{me.medals.silver} 🥉{me.medals.bronze}</b><span>Medals</span></div></div>
    {me.subjects.length > 0 && <><h3>Subject performance</h3>{me.subjects.map((s: any) => <div key={s.subject} className="hbar"><div className="hb-top"><b>{s.subject}</b><span>{s.points} pts</span></div><div className="hb-track"><i style={{ width: `${(s.points / maxSub) * 100}%`, background: 'var(--owl)' }} /></div></div>)}</>}
    {me.awards.length > 0 && <><h3>Awards</h3><div className="row" style={{ justifyContent: 'flex-start' }}>{me.awards.map((a: any, i: number) => <span key={i} className="badge">🏅 {a.label}</span>)}</div></>}
    {me.results.length > 0 && <><h3>My competitions</h3>{me.results.map((r: any) => <div key={r.id} className="lgrow"><span className="lgname">{r.title}</span><span className="note">{r.score}/{r.total} · {r.status}</span>{(r.status === 'approved' || r.status === 'pending') && <button className="linkish" onClick={() => dispute(r.id)}>Dispute</button>}</div>)}</>}
    {me.recent.length > 0 && <><h3>Recent points</h3>{me.recent.map((r: any, i: number) => <div key={i} className="lgrow"><span className="lgname">{r.note}</span><span className="note">{r.source}</span><b className="lgpts">{r.ip > 0 ? '+' : ''}{r.ip}</b></div>)}</>}
    <label className="switch"><input type="checkbox" checked={me.hidden} onChange={e => hide(e.target.checked)} /><span /> Hide my name on public leaderboards (show me as “Anonymous owl”)</label>
    <p className="note">Only your first name and last initial are ever shown to others. Your points, house and class are set by the system and teachers, never by you.</p>
    {msg && <div className="notice">{msg}</div>}
    <div className="row"><button className="btn ghost" onClick={refresh}>Refresh</button><button className="btn ghost" onClick={signOut}>Sign out</button></div></section>
}

export default function League({ api }: { api: Api }) {
  const [view, setView] = useState<View>('home'); const [period, setPeriod] = useState('season'); const [subject, setSubject] = useState('')
  const [code, setCodeS] = useState(''); const [me, setMe] = useState<any>(null); const [tick, setTick] = useState(0)
  async function signIn(c: string, remember: boolean): Promise<string> {
    try { const r = await rpc('lg_me', { p_code: c }); if (!r.ok) return r.error; setCode(c, remember); setCodeS(c); setMe(r); sfx('good'); return '' } catch (e: any) { return e.message }
  }
  async function refresh() { if (!code) return; try { const r = await rpc('lg_me', { p_code: code }); if (r.ok) setMe(r) } catch {} ; setTick(t => t + 1) }
  function signOut() { clearCode(); setCodeS(''); setMe(null); sfx('pop') }
  useEffect(() => { const c = getCode(); if (c) void signIn(c, !!(() => { try { return localStorage.getItem('wob:lgcode') } catch { return '' } })()); return undefined }, []) // eslint-disable-line
  const [subs] = useRpc<string[]>('lg_subjects', {}, [tick])
  const [season] = useRpc<any>('lg_season_public', {}, [tick])
  const [events] = useRpc<any[]>('lg_events_public', {}, [tick, view])
  const [houseSeason] = useRpc<any[]>('lg_house_board', { p_period: period }, [period, tick])
  const [hw] = useRpc<any[]>('lg_house_board', { p_period: 'week' }, [tick, view]); const [hm] = useRpc<any[]>('lg_house_board', { p_period: 'month' }, [tick, view]); const [hs] = useRpc<any[]>('lg_house_board', { p_period: 'season' }, [tick, view])
  const [troph] = useRpc<any[]>('lg_trophies', {}, [tick, view]); const [hall] = useRpc<any[]>('lg_hall', {}, [tick, view]); const [rules] = useRpc<any[]>('lg_rules_public', {}, [view])
  if (!lgReady()) return <div className="notice">The league is not connected yet. The site owner needs to add the Supabase settings in Vercel.</div>
  return <div className="lg">
    <div className="seg wrapseg cats" role="group" aria-label="Competition sections">{VIEWS.map(([k, l]) => <button key={k} aria-pressed={view === k} onClick={() => { setView(k); sfx('pop') }}>{l}</button>)}</div>
    <div className="lgbanner"><div><small>Wise Owl Westgate</small><h2>House Championship &amp; Individual League</h2></div>
      <div className="lgseason">{season ? <><b>{season.name}</b><small>{season.starts_on} to {season.ends_on}</small></> : <small>No season is running right now</small>}</div></div>

    {view === 'home' && <section>
      <h3>🛡️ House Championship</h3><Period v={period} set={setPeriod} /><HouseBars rows={houseSeason || []} />
      <h3>🥇 Top 5 students</h3><Top period={period} />
      <h3>⚡ Live &amp; upcoming competitions</h3>
      {!events ? <div className="busy">Loading…</div> : events.length === 0 ? <p className="note">No competitions are scheduled yet. Check back soon!</p> :
        events.map((e: any, i: number) => <div key={i} className="lgevent"><div><b>{e.title}</b><div className="note">{KINDS[e.kind] || e.kind}{e.subject ? ' · ' + e.subject : ''}{e.restricted ? ' · qualifiers only' : ''}</div></div>
          <div className={'lgphase ' + e.phase}>{e.phase === 'open' ? '🟢 Open now' : e.phase === 'upcoming' ? '🕒 ' + when(e.opens_at) : 'Ended'}<small>closes {when(e.closes_at)}</small></div></div>)}
      <div className="row"><button className="btn" onClick={() => setView('play')}>⚔️ Join a competition</button></div></section>}

    {view === 'league' && <section><Period v={period} set={setPeriod} />
      <div className="row" style={{ justifyContent: 'flex-start' }}><label className="note">Subject <select value={subject} onChange={e => setSubject(e.target.value)} aria-label="Subject filter"><option value="">All subjects</option>{(subs || []).map(s => <option key={s}>{s}</option>)}</select></label></div>
      <Board period={period} subject={subject} /></section>}

    {view === 'houses' && <section>
      <h3>Standings</h3><div className="lg3"><div><h4>This week</h4><HouseBars rows={hw || []} /></div><div><h4>This month</h4><HouseBars rows={hm || []} /></div><div><h4>Season</h4><HouseBars rows={hs || []} /></div></div>
      <h3>Championship history</h3>{!hall || !hall.length ? <p className="note">No season has finished yet. The first champions will appear here.</p> : hall.map((h: any, i: number) => <div key={i} className="lgevent"><div><b>{h.season}</b><div className="note">{(h.snapshot?.houses || []).map((x: any) => `${x.house} ${x.points}`).join(' · ')}</div></div><div className="lgphase open">{h.winner ? '🏆 ' + h.winner : h.snapshot?.tie ? 'Tied' : '–'}</div></div>)}</section>}

    {view === 'play' && <section>{!code || !me ? <Gate onSignIn={signIn} /> : <>
      <p className="note">Signed in as <b>{me.name}</b> <Chip house={me.house} /> · <button className="linkish" onClick={signOut}>not you?</button></p><Play code={code} me={me} refresh={refresh} /></>}</section>}

    {view === 'me' && <section>{!code || !me ? <Gate onSignIn={signIn} note="Sign in to see your points, rank, medals and subject performance." /> : <Me me={me} code={code} refresh={refresh} signOut={signOut} />}</section>}

    {view === 'trophies' && <section>
      <h3>🏆 Trophy cabinet</h3>{!troph ? <div className="busy">Loading…</div> : !troph.length ? <p className="note">No trophies yet. Win a competition or finish top of your house to start the cabinet!</p> :
        <div className="lgtrophies">{troph.map((t: any, i: number) => <div key={i} className="lgtrophy"><span className="t-e">{t.kind === 'house_trophy' ? '🏆' : t.kind === 'individual_trophy' ? '👑' : t.kind === 'subject_champion' ? '🎓' : t.kind === 'student_of_week' ? '🌟' : '🏠'}</span><b>{t.label}</b><small>{t.who || t.house}{t.who && t.house ? ' · ' + t.house : ''}{t.week ? ' · week of ' + t.week : ''}</small></div>)}</div>}
      <h3>🏛️ Hall of Fame</h3>{!hall || !hall.length ? <p className="note">The Hall of Fame fills up as seasons finish.</p> : hall.map((h: any, i: number) => <div key={i} className="lgevent"><div><b>{h.season}</b><div className="note">Top students: {(h.snapshot?.top || []).slice(0, 3).map((x: any) => `${x.who} (${x.points})`).join(', ') || '–'}</div></div><div className="lgphase open">{h.winner ? '🏆 ' + h.winner : '–'}</div></div>)}</section>}

    {view === 'rules' && <section><h3>How points work</h3>
      <p>Every point is worked out by the school’s database, not by your browser, using the rules below. The same activity can never be paid twice. A student’s points count toward their own ranking <b>and</b> toward their house.</p>
      {!rules ? <div className="busy">Loading…</div> : <div className="lgtable">{rules.map((r: any) => <div key={r.key} className="lgrow"><span className="lgname">{r.label}{!r.active && ' (switched off)'}</span><span className="note">you {r.ip} · house {r.hp}</span></div>)}</div>}
      <ul className="note"><li>Competition quizzes and exams are graded by the school database and approved by teachers.</li><li>AI practice, missions and streaks are limited each day, so the league rewards steady work, not endless clicking.</li><li>Teachers can correct a score, but every correction is written to an audit log with the reason.</li><li>Ties on a medal are broken by who finished first.</li></ul></section>}

    {view === 'staff' && <LeagueAdmin api={api} onChange={() => setTick(t => t + 1)} />}
  </div>
}

function Top({ period }: { period: string }) {
  const [rows, err] = useRpc<any[]>('lg_board', { p_period: period, p_subject: null }, [period])
  if (err) return <div className="notice">{err}</div>
  if (!rows) return <div className="busy">Loading…</div>
  if (!rows.length) return <p className="note">No points yet. Finish a competition or an AI practice quiz to get on the board!</p>
  return <div className="lgtable">{rows.slice(0, 5).map((r, i) => <div key={i} className={'lgrow r' + Math.min(r.rank, 4)}><b className="lgrank">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</b><span className="lgname">{r.who} <Chip house={r.house} /></span><b className="lgpts">{r.points}</b></div>)}</div>
}
