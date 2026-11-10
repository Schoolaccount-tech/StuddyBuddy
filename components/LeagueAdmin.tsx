'use client'
import { useEffect, useState } from 'react'
import { rpc, getStaff, staffIn, staffOut, KINDS, when, type Staff } from '@/lib/league'
import { ai } from '@/lib/api'
import type { Api } from './api'

type Q = { q: string; options: string[]; answer: number; explain: string }
const blankQ = (): Q => ({ q: '', options: ['', '', '', ''], answer: 0, explain: '' })
const isoLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

export default function LeagueAdmin({ api, onChange }: { api: Api; onChange: () => void }) {
  const [s, setS] = useState<Staff | null>(null); const [ov, setOv] = useState<any>(null); const [msg, setMsg] = useState(''); const [tab, setTab] = useState('overview')
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false)
  const [studs, setStuds] = useState<any[]>([])
  useEffect(() => { setS(getStaff()); return undefined }, [])
  const call = async (fn: string, args: object = {}) => {
    if (!s) throw new Error('Sign in first.')
    try { return await rpc(fn, args, s.token) } catch (e: any) { if (/jwt|expired/i.test(e.message)) { staffOut(); setS(null); throw new Error('Your session expired. Please sign in again.') } throw e }
  }
  async function load() { try { setOv(await call('lg_admin_overview')); setMsg('') } catch (e: any) { setMsg(e.message) } }
  async function loadStuds() { try { setStuds(await call('lg_admin_students')) } catch (e: any) { setMsg(e.message) } }
  useEffect(() => { if (s) { void load(); if (tab === 'students') void loadStuds() } return undefined }, [s, tab]) // eslint-disable-line
  async function run(fn: string, args: object, ok = 'Done.') {
    setBusy(true); setMsg('')
    try { const r = await call(fn, args); if (r && r.ok === false) setMsg(r.error); else { setMsg(ok); await load(); if (tab === 'students') await loadStuds(); onChange() } return r } catch (e: any) { setMsg(e.message) } finally { setBusy(false) }
  }
  async function login(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMsg(''); try { setS(await staffIn(email, pw)); setPw('') } catch (x: any) { setMsg(x.message) } setBusy(false) }

  if (!s) return <form className="gate" onSubmit={login}><h3>Staff sign-in</h3><p className="note">Teachers and admins use their Merit &amp; Demerit staff login. Students cannot use this area, and the database checks your role on every action.</p>
    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Staff email" type="email" autoComplete="username" aria-label="Staff email" />
    <input value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" type="password" autoComplete="current-password" aria-label="Password" />
    <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>{msg && <div className="notice">{msg}</div>}</form>
  if (!ov) return <div>{msg ? <div className="notice">{msg}</div> : <div className="busy">Loading…</div>}</div>
  const admin = !!ov.admin
  const T: [string, string][] = [['overview', 'Overview'], ['events', 'Competitions'], ['results', `Approvals (${ov.pending.length})`], ...(admin ? [['students', 'Students & houses'], ['points', 'Adjust points'], ['rules', 'Scoring rules']] as [string, string][] : []), ['audit', 'Audit log']]
  return <section className="lgadmin">
    <div className="row"><span className="note">Signed in as {s.email} ({admin ? 'admin' : 'teacher'})</span><button className="linkish" onClick={() => { staffOut(); setS(null); setOv(null) }}>Sign out</button></div>
    <div className="seg wrapseg cats">{T.map(([k, l]) => <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
    {msg && <div className="notice" role="status">{msg}</div>}
    {tab === 'overview' && <Overview ov={ov} admin={admin} run={run} busy={busy} />}
    {tab === 'events' && <Events ov={ov} run={run} busy={busy} admin={admin} api={api} />}
    {tab === 'results' && <Results ov={ov} run={run} admin={admin} />}
    {tab === 'students' && admin && <Students studs={studs} run={run} />}
    {tab === 'points' && admin && <Points studs={studs.length ? studs : null} load={loadStuds} run={run} />}
    {tab === 'rules' && admin && <Rules ov={ov} run={run} />}
    {tab === 'audit' && <div className="lgtable">{ov.audit.length ? ov.audit.map((a: any, i: number) => <div key={i} className="lgrow"><span className="lgname">{a.action}</span><span className="note">{a.table_name}</span><span className="note">{when(a.at)}</span></div>) : <p className="note">Nothing logged yet.</p>}</div>}
  </section>
}

type Run = (fn: string, args: object, ok?: string) => Promise<any>

function Overview({ ov, admin, run, busy }: { ov: any; admin: boolean; run: Run; busy: boolean }) {
  const [n, setN] = useState('Season 1'); const [a, setA] = useState(new Date().toISOString().slice(0, 10)); const [b, setB] = useState(new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10))
  return <div>
    <div className="lgstats"><div className="stat"><b>{ov.counts.students}</b><span>Students</span></div><div className="stat"><b>{ov.counts.no_house}</b><span>Without a house</span></div><div className="stat"><b>{ov.counts.no_code}</b><span>Without a code</span></div><div className="stat"><b>{ov.pending.length}</b><span>To review</span></div></div>
    {ov.counts.no_house > 0 && <div className="notice">Every student must have a house. Assign the rest in Students &amp; houses.</div>}
    {ov.season ? <><h3>Active: {ov.season.name}</h3><p className="note">{ov.season.starts_on} to {ov.season.ends_on}</p>
      {admin && <button className="btn ghost" disabled={busy} onClick={() => { if (confirm('End this season now? Winners are frozen into the Hall of Fame and the season cannot be reopened.')) run('lg_admin_close_season', {}, 'Season ended and winners published.') }}>End season &amp; publish winners</button>}
      {admin && <button className="btn ghost" disabled={busy} onClick={() => run('lg_admin_weekly_awards', {}, 'Student and House of the Week published.')}>Publish Student &amp; House of the Week</button>}</>
      : admin ? <><h3>Start a season</h3><div className="row" style={{ justifyContent: 'flex-start' }}><input value={n} onChange={e => setN(e.target.value)} aria-label="Season name" /><input type="date" value={a} onChange={e => setA(e.target.value)} aria-label="Start" /><input type="date" value={b} onChange={e => setB(e.target.value)} aria-label="End" /><button className="btn" disabled={busy} onClick={() => run('lg_admin_start_season', { p_name: n, p_starts: a, p_ends: b }, 'Season started.')}>Start</button></div></>
        : <p className="note">No season is running. An admin must start one.</p>}
    <h3>Past seasons</h3>{ov.seasons.map((x: any) => <div key={x.id} className="lgrow"><span className="lgname">{x.name}</span><span className="note">{x.status} · {x.starts_on} to {x.ends_on}</span></div>)}
  </div>
}

function Events({ ov, run, busy, admin, api }: { ov: any; run: Run; busy: boolean; admin: boolean; api: Api }) {
  const [f, setF] = useState<any>(null); const [gen, setGen] = useState(false); const [paste, setPaste] = useState(''); const [err, setErr] = useState('')
  const now = new Date()
  const start = () => setF({ kind: 'quiz', title: '', subject: '', join_code: '', auto_approve: true, opens_at: isoLocal(now), closes_at: isoLocal(new Date(now.getTime() + 864e5)), questions: [blankQ()] })
  async function aiGen() {
    if (!f.subject) { setErr('Type a subject first, e.g. Mathematics.'); return } setGen(true); setErr('')
    try { const r = await ai({ mode: 'quiz', subject: f.subject, topic: f.title || f.subject, count: 10, difficulty: 'medium' }); setF({ ...f, questions: r.data }) } catch (e: any) { setErr(e.message) }
    setGen(false)
  }
  function importJson() {
    try { const j = JSON.parse(paste); if (!Array.isArray(j)) throw 0; setF({ ...f, questions: j.map((q: any) => ({ q: String(q.q || ''), options: (q.options || []).slice(0, 4).map(String), answer: Number(q.answer) || 0, explain: String(q.explain || '') })) }); setPaste(''); setErr('') } catch { setErr('That is not a valid list of questions.') }
  }
  async function save() {
    const body = { ...f, opens_at: new Date(f.opens_at).toISOString(), closes_at: new Date(f.closes_at).toISOString() }
    const r = f.advance
      ? await run('lg_admin_advance', { p_event: f.advance.event, p_top: f.advance.top, p_title: f.title, p_questions: f.questions, p_opens: body.opens_at, p_closes: body.closes_at }, 'Next round created.')
      : await run('lg_admin_save_event', { p_event: body }, 'Saved.')
    if (r?.ok) setF(null)
  }
  const setQ = (i: number, p: Partial<Q>) => setF({ ...f, questions: f.questions.map((q: Q, j: number) => j === i ? { ...q, ...p } : q) })
  if (f) return <div className="lgform">
    <h3>{f.id ? 'Edit' : 'New'} competition</h3>
    <label>Type<select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}>{Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
    <label>Title<input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="e.g. Friday Maths Challenge" /></label>
    <label>Subject (optional)<input value={f.subject || ''} onChange={e => setF({ ...f, subject: e.target.value })} placeholder="e.g. Mathematics" /></label>
    <label>Opens<input type="datetime-local" value={f.opens_at} onChange={e => setF({ ...f, opens_at: e.target.value })} /></label>
    <label>Closes<input type="datetime-local" value={f.closes_at} onChange={e => setF({ ...f, closes_at: e.target.value })} /></label>
    <label className="switch"><input type="checkbox" checked={f.auto_approve} onChange={e => setF({ ...f, auto_approve: e.target.checked })} /><span /> Approve results automatically (otherwise a teacher approves each one)</label>
    <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn ghost" onClick={aiGen} disabled={gen}>{gen ? 'Writing…' : '✨ Write 10 questions with AI'}</button><span className="note">Check AI questions before going live.</span></div>
    <details><summary>Paste questions (JSON)</summary><textarea value={paste} onChange={e => setPaste(e.target.value)} rows={4} placeholder='[{"q":"...","options":["a","b","c","d"],"answer":0,"explain":"..."}]' /><button className="btn ghost" onClick={importJson}>Import</button></details>
    {f.questions.map((q: Q, i: number) => <div key={i} className="q"><b>Question {i + 1}</b> <button className="linkish" onClick={() => setF({ ...f, questions: f.questions.filter((_: Q, j: number) => j !== i) })}>remove</button>
      <input value={q.q} onChange={e => setQ(i, { q: e.target.value })} placeholder="Question" />
      {q.options.map((o, j) => <div key={j} className="row" style={{ justifyContent: 'flex-start' }}><input type="radio" name={'c' + i} checked={q.answer === j} onChange={() => setQ(i, { answer: j })} aria-label={'Correct answer ' + (j + 1)} /><input className="grow" value={o} onChange={e => setQ(i, { options: q.options.map((x, k) => k === j ? e.target.value : x) })} placeholder={'Option ' + (j + 1)} /></div>)}
      <input value={q.explain} onChange={e => setQ(i, { explain: e.target.value })} placeholder="Why it is correct (shown after the competition closes)" /></div>)}
    <button className="btn ghost" onClick={() => setF({ ...f, questions: [...f.questions, blankQ()] })} disabled={f.questions.length >= 40}>+ Add question</button>
    {err && <div className="notice">{err}</div>}
    <div className="row"><button className="btn ghost" onClick={() => setF(null)}>Cancel</button><button className="btn" onClick={save} disabled={busy}>Save</button></div></div>
  const next: Record<string, [string, string]> = { draft: ['live', 'Go live'], live: ['closed', 'Close'] }
  return <div><button className="btn" onClick={start}>+ New competition</button>
    {ov.events.length === 0 && <p className="note">No competitions yet.</p>}
    {ov.events.map((e: any) => <div key={e.id} className="lgevent"><div><b>{e.title}</b><div className="note">{KINDS[e.kind]}{e.subject ? ' · ' + e.subject : ''} · {e.questions} questions · {e.played} played</div>
      <div className="note">Code <b className="mono">{e.join_code}</b> · {when(e.opens_at)} to {when(e.closes_at)}</div></div>
      <div className="stack"><span className={'lgphase ' + (e.status === 'live' ? 'open' : '')}>{e.status}</span>
        {next[e.status] && <button className="btn ghost" disabled={busy} onClick={() => run('lg_admin_event_status', { p_id: e.id, p_status: next[e.status][0] })}>{next[e.status][1]}</button>}
        {e.status === 'closed' && admin && <button className="btn ghost" disabled={busy} onClick={() => run('lg_admin_publish_event', { p_id: e.id }, 'Winners published and medals awarded.')}>Publish winners</button>}
        {e.status === 'closed' && e.kind === 'knockout' && <button className="linkish" onClick={() => { const t = Number(prompt('How many top players go through?', '4')); if (t > 0) { setF({ ...{ kind: 'knockout', title: e.title + ' – next round', subject: e.subject || '', join_code: '', auto_approve: true, opens_at: isoLocal(now), closes_at: isoLocal(new Date(now.getTime() + 864e5)), questions: [blankQ()] }, advance: { event: e.id, top: t } }) } }}>Next round…</button>}
        {e.status !== 'closed' && !e.played && <button className="linkish" onClick={async () => { /* editing loads from list data only for header; questions must be re-entered */ setF({ id: e.id, kind: e.kind, title: e.title, subject: e.subject || '', join_code: e.join_code, auto_approve: e.auto_approve, opens_at: isoLocal(new Date(e.opens_at)), closes_at: isoLocal(new Date(e.closes_at)), questions: [blankQ()] }) }}>Edit</button>}</div></div>)}</div>
}

function Results({ ov, run, admin }: { ov: any; run: Run; admin: boolean }) {
  if (!ov.pending.length) return <p className="note">Nothing waiting for review.</p>
  return <div>{ov.pending.map((r: any) => <div key={r.id} className="lgevent"><div><b>{r.who}</b> · {r.event}<div className="note">{r.score}/{r.total} · {r.status}{r.note ? ' · “' + r.note + '”' : ''}</div></div>
    {admin ? <div className="stack"><button className="btn" onClick={() => run('lg_admin_decide_result', { p_result: r.id, p_decision: 'approve', p_note: null }, 'Approved.')}>Approve</button>
      <button className="btn ghost" onClick={() => { const n = prompt('Reason for voiding this result (recorded in the audit log):'); if (n) run('lg_admin_decide_result', { p_result: r.id, p_decision: 'void', p_note: n }, 'Voided.') }}>Void</button></div> : <span className="note">Admin approval needed</span>}</div>)}</div>
}

function Students({ studs, run }: { studs: any[]; run: Run }) {
  const [q, setQ] = useState(''); const [houses, setH] = useState<{ id: number; name: string }[]>([])
  useEffect(() => { const m = new Map<number, string>(); studs.forEach(s => { if (s.house_id && s.house) m.set(s.house_id, s.house) }); setH([...m].map(([id, name]) => ({ id, name }))); return undefined }, [studs])
  const rows = studs.filter(s => s.name.toLowerCase().includes(q.toLowerCase()))
  return <div><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search students" aria-label="Search students" />
    <p className="note">Changing a house moves that student’s points for the whole season. A reason is required and is written to the audit log.</p>
    {rows.map(s => <div key={s.id} className="lgrow"><span className="lgname">{s.name} <small className="note">{s.form || ''}{s.has_code ? '' : ' · no code'}</small></span>
      <select value={s.house_id || ''} aria-label={'House for ' + s.name} onChange={e => { const id = Number(e.target.value); const r = prompt(`Reason for moving ${s.name} to ${houses.find(h => h.id === id)?.name}?`); if (r && r.length >= 3) run('lg_admin_set_house', { p_student: s.id, p_house: id, p_reason: r }, 'House updated.') }}>
        <option value="" disabled>No house</option>{houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select><b className="lgpts">{s.points}</b></div>)}</div>
}

function Points({ studs, load, run }: { studs: any[] | null; load: () => void; run: Run }) {
  const [sid, setSid] = useState(''); const [ip, setIp] = useState(0); const [hp, setHp] = useState(0); const [why, setWhy] = useState(''); const [sub, setSub] = useState('')
  useEffect(() => { if (!studs) load(); return undefined }, []) // eslint-disable-line
  return <div className="lgform"><p className="note">Corrections are added to the ledger as new lines (never edited), with your name and reason in the audit log. Use negative numbers to remove points.</p>
    <label>Student<select value={sid} onChange={e => setSid(e.target.value)}><option value="">Choose…</option>{(studs || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>Individual points<input type="number" value={ip} onChange={e => setIp(Number(e.target.value))} /></label>
    <label>House points<input type="number" value={hp} onChange={e => setHp(Number(e.target.value))} /></label>
    <label>Subject (optional)<input value={sub} onChange={e => setSub(e.target.value)} /></label>
    <label>Reason<input value={why} onChange={e => setWhy(e.target.value)} placeholder="Required" /></label>
    <button className="btn" disabled={!sid || why.trim().length < 3 || (!ip && !hp)} onClick={() => run('lg_admin_adjust', { p_student: sid, p_ip: ip, p_hp: hp, p_reason: why, p_subject: sub || null }, 'Correction recorded.')}>Apply correction</button></div>
}

function Rules({ ov, run }: { ov: any; run: Run }) {
  return <div className="lgtable">{ov.rules.map((r: any) => <RuleRow key={r.key} r={r} run={run} />)}</div>
}
function RuleRow({ r, run }: { r: any; run: Run }) {
  const [ip, setIp] = useState(r.ip); const [hp, setHp] = useState(r.hp); const [on, setOn] = useState(r.active)
  return <div className="lgrow"><span className="lgname">{r.label}</span>
    <input type="number" className="num" value={ip} onChange={e => setIp(Number(e.target.value))} aria-label={r.label + ' individual points'} />
    <input type="number" className="num" value={hp} onChange={e => setHp(Number(e.target.value))} aria-label={r.label + ' house points'} />
    <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} aria-label="Active" />
    <button className="btn ghost" onClick={() => run('lg_admin_set_rule', { p_key: r.key, p_ip: ip, p_hp: hp, p_active: on }, 'Rule saved.')}>Save</button></div>
}
