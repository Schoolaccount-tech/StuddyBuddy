'use client'
import { useEffect, useRef, useState } from 'react'
import { store, ai } from '@/lib/api'
import { sfx } from '@/lib/fx'
import { GROUPS, SERIES, DOCS, SUBJECTS, YEARS, parseComp, paperCode, stem, findDoc, findLoose, findExemplar, findExemplarOpen, officialPast, officialPage, decodeCode, dur, subjectLabel, GRADE_TABLES, SUPPORT_HUB, type Subject } from '@/lib/igcse'
import Md from './Md'

const SECS = [['find', '🔎 Paper finder'], ['subjects', '📚 All subjects'], ['log', '📝 Past-paper log'], ['grade', '🎓 Grade estimator'], ['journal', '🧾 Mistake journal'], ['words', '🗣️ Command words'], ['ms', '✅ Mark scheme codes'], ['timer', '⏱️ Mock timer'], ['count', '📅 Countdown & plan'], ['check', '🎒 Exam-day checklist']] as const
type Sec = typeof SECS[number][0]
const A = ({ href, children }: { href: string; children: React.ReactNode }) => <a className="hublink" href={href} target="_blank" rel="noopener noreferrer">{children}</a>

const WORDS: [string, string][] = [['State / Name / Give', 'Short answer. No explanation needed.'], ['Define', 'Give the precise meaning of a term.'], ['Identify', 'Pick out or recognise from information given.'], ['Describe', 'Say what something is like, or what a graph or process shows. Features only, not reasons.'], ['Explain', 'Give reasons using “because”, linking cause to effect.'], ['Outline', 'Give the main points briefly.'], ['Suggest', 'Apply your knowledge to an unfamiliar situation. There may be more than one valid answer.'], ['Compare', 'Give similarities AND differences, every time.'], ['Calculate', 'Work out a number. Show working and units.'], ['Determine / Deduce', 'Work out from the information or data given.'], ['Estimate', 'Give an approximate value using sensible rounding.'], ['Predict', 'Say what will happen using your knowledge.'], ['Sketch / Draw', 'Sketch: rough shape with key features. Draw: accurate, to scale.'], ['Show that', 'Prove the given result with full working. Do not just write the answer.'], ['Discuss', 'Give arguments for and against, then a balanced conclusion.'], ['Evaluate / Assess', 'Weigh strengths and weaknesses and reach a justified judgement.'], ['Justify', 'Support a decision or conclusion with evidence.'], ['Analyse', 'Break into parts and examine how they relate.'], ['Comment', 'Give your view or interpretation supported by evidence.']]
const MS: [string, string][] = [['M', 'Method mark: for a correct method, even if the answer is wrong.'], ['A', 'Accuracy mark: depends on a correct method mark being earned.'], ['B', 'Independent mark: awarded without needing a method.'], ['FT / ft', 'Follow through: correct working from an earlier wrong answer still earns marks.'], ['ecf', 'Error carried forward: same idea as follow through.'], ['cao', 'Correct answer only.'], ['oe', 'Or equivalent: another correct form of the answer is fine.'], ['awrt', 'Answer which rounds to.'], ['soi', 'Seen or implied: the step can be shown or clearly used later.'], ['isw', 'Ignore subsequent working.'], ['dep', 'Dependent: only earned if a previous mark was earned.'], ['nfww', 'Not from wrong working.'], ['BOD', 'Benefit of the doubt.'], ['ORA', 'Or reverse argument.'], ['owtte', 'Or words to that effect.'], ['/', 'A slash in a mark scheme separates alternative acceptable answers.']]
const CHECK = ['Check the exact date, time and venue of each paper', 'Candidate number and ID ready', 'Two black pens plus a spare', 'Pencil, ruler, eraser and sharpener', 'Approved calculator with fresh batteries (cleared memory)', 'Geometry set, protractor and compasses if needed', 'Water in a clear bottle', 'Watch (no smart watches)', 'Early night and a proper breakfast', 'Arrive 30 minutes early', 'Read every instruction and the mark on each question', 'Plan time per mark: about 1 minute per mark', 'Leave nothing blank. Attempt every question', 'Keep 5 minutes at the end to check']
const gradeOf = (pct: number, b: number[]) => { const g = [9, 8, 7, 6, 5, 4, 3, 2, 1]; for (let i = 0; i < b.length; i++) if (pct >= b[i]) return String(g[i]); return 'U' }
const LET: Record<string, string> = { 9: 'A*', 8: 'A*/A', 7: 'A', 6: 'B', 5: 'B/C', 4: 'C', 3: 'D/E', 2: 'E/F', 1: 'G', U: 'U' }

type Log = { id: number; code: string; subject: string; comp: string; series: string; year: number; got: number; total: number; at: string }
type Jr = { id: number; subject: string; what: string; fix: string; done: boolean }

export default function IgcseHub({ subj }: { subj: string }) {
  const [sec, setSec] = useState<Sec>('find')
  const [sub, setSub] = useState<Subject>(() => SUBJECTS.find(s => s.name === subj) || SUBJECTS[0])
  const [comp, setComp] = useState(''); const [ser, setSer] = useState('s'); const [yr, setYr] = useState(YEARS[1]); const [quick, setQuick] = useState('')
  const [log, setLog] = useState<Log[]>([]); const [jr, setJr] = useState<Jr[]>([]); const [bounds, setBounds] = useState([90, 80, 70, 60, 50, 40, 30, 20, 10]); const [exam, setExam] = useState(''); const [chk, setChk] = useState<Record<number, boolean>>({})
  const [q, setQ] = useState(''); const [pct, setPct] = useState(''); const [mark, setMark] = useState(''); const [aiq, setAiq] = useState<any>(null); const [aiAns, setAiAns] = useState(''); const [aiRes, setAiRes] = useState<any>(null); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  useEffect(() => { setLog(store.get('hub-log', [])); setJr(store.get('hub-jr', [])); setBounds(store.get('hub-b', [90, 80, 70, 60, 50, 40, 30, 20, 10])); setExam(store.get('hub-exam', '')); setChk(store.get('hub-chk', {})); return undefined }, [])
  const saveLog = (l: Log[]) => { setLog(l); store.set('hub-log', l) }
  const saveJr = (l: Jr[]) => { setJr(l); store.set('hub-jr', l) }
  const c = parseComp(sub, comp)
  const compOk = /^\d{2}$/.test(comp) && c.ok
  function decode() { const d = decodeCode(quick); if (!d) { setMsg('I could not read that. Try a format like 0580/22/M/J/24 or 0580_s24_qp_22.'); return } setMsg(''); setSub(d.s); if (d.comp) setComp(d.comp); if (d.ser) setSer(d.ser); if (d.yr) setYr(d.yr); sfx('good') }
  async function aiPractice() {
    setBusy(true); setAiq(null); setAiRes(null); setAiAns('')
    try { const r = await ai({ mode: 'exam', subject: sub.name, topic: `Cambridge IGCSE ${sub.name} Paper ${c.paper || ''} style`, seed: String(Date.now()) }); setAiq(r.data) } catch (e: any) { setMsg(e.message) }
    setBusy(false)
  }
  async function aiMark() {
    setBusy(true)
    try { const r = await ai({ mode: 'mark', subject: sub.name, question: aiq.question, scheme: aiq.scheme, marks: aiq.marks, answer: aiAns }); setAiRes(r.data); sfx('good') } catch (e: any) { setMsg(e.message) }
    setBusy(false)
  }
  const days = exam ? Math.ceil((new Date(exam + 'T08:00:00').getTime() - Date.now()) / 864e5) : null
  const bySubj = log.reduce<Record<string, { n: number; p: number }>>((a, l) => { const k = l.subject; a[k] = a[k] || { n: 0, p: 0 }; a[k].n++; a[k].p += (l.got / Math.max(1, l.total)) * 100; return a }, {})

  return <section className="hub">
    <div className="seg wrapseg cats" role="group" aria-label="IGCSE hub sections">{SECS.map(([k, l]) => <button key={k} aria-pressed={sec === k} onClick={() => { setSec(k); sfx('pop') }}>{l}</button>)}</div>
    {msg && <div className="notice" role="status">{msg}</div>}

    {sec === 'find' && <div className="lgform">
      <div className="hubnote">Cambridge owns the past papers, so Wise Owl never copies them. This finder tells you exactly which paper you need, then opens the official Cambridge page or a search for the exact file name.</div>
      <label>Paste a paper code or file name<div className="row" style={{ justifyContent: 'flex-start' }}><input className="grow" value={quick} onChange={e => setQuick(e.target.value)} placeholder="0580/22/M/J/24  or  0580_s24_qp_22" /><button className="btn ghost" onClick={decode}>Decode</button></div></label>
      <label>Subject<select value={sub.code + sub.name} onChange={e => { setSub(SUBJECTS.find(s => s.code + s.name === e.target.value)!); setComp('') }}>{GROUPS.map(g => <optgroup key={g} label={g}>{SUBJECTS.filter(s => s.g === g).map(s => <option key={s.code + s.name} value={s.code + s.name}>{subjectLabel(s)}</option>)}</optgroup>)}</select></label>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <label>Component number<input className="num" inputMode="numeric" maxLength={2} value={comp} onChange={e => setComp(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 22" /></label>
        <label>Series<select value={ser} onChange={e => setSer(e.target.value)}>{SERIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>Year<select value={yr} onChange={e => setYr(Number(e.target.value))}>{YEARS.map(y => <option key={y}>{y}</option>)}</select></label></div>
      {sub.note && <p className="note">ℹ️ {sub.note}</p>}{sub.chk && <p className="note">⚠️ Check the exact paper structure for your exam year on the Cambridge syllabus.</p>}
      {comp.length === 2 && !c.ok && <div className="notice">{c.msg}</div>}
      {!comp && <div><b>Papers in {sub.name}</b><div className="hubpapers">{sub.papers.map(p => <button key={p.n} className="chip" onClick={() => setComp(p.nv ? '0' + p.n : p.n + '1')}>Paper {p.n}: {p.t}</button>)}</div></div>}
      {compOk && c.p && <div className="hubcard">
        <h3>{subjectLabel(sub)}: component {comp}</h3>
        <div className="lgstats"><div className="stat"><b>Paper {c.paper}</b><span>{c.p.t}</span></div>{!c.nv && <div className="stat"><b>Variant {c.variant}</b><span>version of the paper</span></div>}{c.p.d !== undefined && <div className="stat"><b>{dur(c.p.d)}</b><span>duration</span></div>}{c.p.m !== undefined && <div className="stat"><b>{c.p.m}</b><span>marks</span></div>}{c.p.w !== undefined && <div className="stat"><b>{c.p.w}%</b><span>of the grade</span></div>}</div>
        <p className="note">{c.p.tier ? `Tier: ${c.p.tier}. ` : ''}{c.p.calc === true ? 'Calculator allowed. ' : c.p.calc === false ? 'No calculator. ' : ''}{c.nv ? 'No variants: this component is the same for everyone (for example coursework or speaking).' : 'Variants 1, 2 and 3 are the same paper type set in different regions or time zones.'}</p>
        <p>Full code: <b className="mono">{paperCode(sub, comp, ser, yr)}</b> · file stem <b className="mono">{stem(sub.code, ser, yr, 'qp', comp)}</b></p>
        <div className="hubdocs">{DOCS.map(([k, l]) => <span key={k}><A href={findDoc(sub, comp, ser, yr, k)}>{l}</A> <small><A href={findLoose(sub, comp, ser, yr, k)}>more</A></small></span>)}</div>
        <div className="row" style={{ justifyContent: 'flex-start' }}><A href={officialPast(sub)}>📂 Official Cambridge past papers</A><A href={officialPage(sub)}>📘 Syllabus page</A><A href={GRADE_TABLES}>📊 Grade thresholds</A></div>
        <h4>Exemplar responses</h4><p className="note">Cambridge publishes “example candidate responses” with examiner comments for many subjects. The official copies are on the School Support Hub, which needs your school’s login.</p>
        <div className="row" style={{ justifyContent: 'flex-start' }}><A href={SUPPORT_HUB}>🏫 School Support Hub</A><A href={findExemplar(sub)}>🔎 Find on Cambridge site</A><A href={findExemplarOpen(sub)}>🔎 Search more widely</A></div>
        <h4>Practise in this style</h4><button className="btn ghost" onClick={aiPractice} disabled={busy}>{busy ? 'Writing…' : '✨ AI exam-style question'}</button>
        {aiq && <div className="q"><p className="note">AI-written practice question, not a real Cambridge question.</p><h3>{aiq.question} <small>[{aiq.marks} marks]</small></h3><p className="note">Hint: {aiq.hint}</p>
          <textarea rows={4} value={aiAns} onChange={e => setAiAns(e.target.value)} placeholder="Write your answer…" /><button className="btn" onClick={aiMark} disabled={busy || aiAns.length < 3}>Mark it</button>
          {aiRes && <div className="why"><b>{aiRes.awarded}/{aiRes.marks}</b> · {aiRes.feedback}<details><summary>Marking points</summary><ul>{aiq.scheme.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></details></div>}</div>}
        <h4>Log this paper</h4><div className="row" style={{ justifyContent: 'flex-start' }}><input className="num" type="number" min={0} placeholder="Your mark" value={mark} onChange={e => setMark(e.target.value)} /><span className="note">out of {c.p.m ?? '?'}</span>
          <button className="btn ghost" disabled={!mark || !c.p.m} onClick={() => { saveLog([{ id: Date.now(), code: paperCode(sub, comp, ser, yr), subject: sub.name, comp, series: ser, year: yr, got: Math.min(Number(mark), c.p!.m!), total: c.p!.m!, at: new Date().toISOString().slice(0, 10) }, ...log]); setMark(''); setMsg('Saved to your past-paper log.'); sfx('good') }}>Save result</button></div></div>}
    </div>}

    {sec === 'subjects' && <div>{GROUPS.map(g => <div key={g}><h3>{g}</h3>{SUBJECTS.filter(s => s.g === g).map(s => <details key={s.code + s.name} className="hubsub"><summary>{subjectLabel(s)}</summary>
      <div className="lgtable">{s.papers.map(p => <div key={p.n} className="lgrow"><b>Paper {p.n}</b><span className="lgname">{p.t}{p.tier ? ` · ${p.tier}` : ''}</span><span className="note">{[dur(p.d), p.m ? p.m + ' marks' : '', p.w ? p.w + '%' : ''].filter(Boolean).join(' · ')}</span></div>)}</div>
      {s.note && <p className="note">{s.note}</p>}<div className="row" style={{ justifyContent: 'flex-start' }}><A href={officialPast(s)}>Past papers</A><A href={officialPage(s)}>Syllabus</A><button className="linkish" onClick={() => { setSub(s); setComp(''); setSec('find') }}>Open in finder</button></div></details>)}</div>)}</div>}

    {sec === 'log' && <div><p className="note">Every paper you log from the finder appears here, with your average per subject.</p>
      {Object.keys(bySubj).length > 0 && <div className="lgstats">{Object.entries(bySubj).map(([k, v]) => <div key={k} className="stat"><b>{Math.round(v.p / v.n)}%</b><span>{k} ({v.n})</span></div>)}</div>}
      {!log.length ? <p className="note">Nothing logged yet.</p> : <div className="lgtable">{log.map(l => <div key={l.id} className="lgrow"><span className="lgname">{l.code}</span><span className="note">{l.got}/{l.total} · {Math.round((l.got / l.total) * 100)}% · {l.at}</span><button className="linkish" onClick={() => saveLog(log.filter(x => x.id !== l.id))}>delete</button></div>)}</div>}</div>}

    {sec === 'grade' && <div className="lgform"><div className="hubnote">Boundaries change every exam series and for every paper combination. These starting values are only a rough guide. Replace them with the real ones from Cambridge’s grade threshold tables.</div>
      <label>Your percentage<input type="number" min={0} max={100} value={pct} onChange={e => setPct(e.target.value)} placeholder="e.g. 72" /></label>
      {pct !== '' && <div className="resultme"><b>Estimated grade {gradeOf(Number(pct), bounds)}</b> ({LET[gradeOf(Number(pct), bounds)]})</div>}
      <details><summary>Edit boundaries (minimum % for each grade)</summary><div className="row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>{bounds.map((b, i) => <label key={i}>Grade {9 - i}<input className="num" type="number" value={b} onChange={e => { const n = bounds.slice(); n[i] = Number(e.target.value); setBounds(n); store.set('hub-b', n) }} /></label>)}</div></details>
      <A href={GRADE_TABLES}>📊 Official Cambridge grade thresholds</A></div>}

    {sec === 'journal' && <div className="lgform"><p className="note">Write down what went wrong and how to fix it. Review the open items before each paper.</p>
      <JournalAdd subjects={[...new Set(SUBJECTS.map(s => s.name))].sort()} cur={sub.name} onAdd={j => saveJr([{ ...j, id: Date.now(), done: false }, ...jr])} />
      {jr.map(j => <div key={j.id} className="lgrow"><input type="checkbox" checked={j.done} onChange={() => saveJr(jr.map(x => x.id === j.id ? { ...x, done: !x.done } : x))} aria-label="Fixed" /><span className="lgname" style={{ textDecoration: j.done ? 'line-through' : 'none' }}><b>{j.subject}</b>: {j.what}<br /><small className="note">Fix: {j.fix}</small></span><button className="linkish" onClick={() => saveJr(jr.filter(x => x.id !== j.id))}>delete</button></div>)}</div>}

    {sec === 'words' && <div className="lgtable">{WORDS.map(([w, d]) => <div key={w} className="lgrow"><b className="cw">{w}</b><span className="lgname">{d}</span></div>)}</div>}
    {sec === 'ms' && <div><p className="note">You will see these codes in Cambridge mark schemes. Knowing them tells you how to earn marks.</p><div className="lgtable">{MS.map(([w, d]) => <div key={w} className="lgrow"><b className="cw mono">{w}</b><span className="lgname">{d}</span></div>)}</div></div>}
    {sec === 'timer' && <Mock sub={sub} />}
    {sec === 'count' && <div className="lgform"><label>Your first exam date<input type="date" value={exam} onChange={e => { setExam(e.target.value); store.set('hub-exam', e.target.value) }} /></label>
      {days !== null && (days < 0 ? <p className="note">That date has passed. Pick your next exam.</p> : <><div className="resultme"><b>{days} days</b> to go ({Math.ceil(days / 7)} weeks)</div>
        <ul><li>{days > 56 ? 'Now to 8 weeks out: finish the syllabus and make short notes for each topic.' : 'Syllabus should be covered. Spend your time on weak topics.'}</li><li>Do one timed past paper per subject each week from 8 weeks out.</li><li>Mark every paper with the mark scheme, then write each lost mark in the Mistake journal.</li><li>Last 2 weeks: reread notes, redo mistakes and command words. Sleep well.</li></ul></>)}</div>}
    {sec === 'check' && <div className="lgtable">{CHECK.map((t, i) => <label key={i} className="lgrow"><input type="checkbox" checked={!!chk[i]} onChange={e => { const n = { ...chk, [i]: e.target.checked }; setChk(n); store.set('hub-chk', n) }} /><span className="lgname">{t}</span></label>)}</div>}
    <p className="note">Wise Owl is not affiliated with Cambridge University Press &amp; Assessment. Always confirm papers, marks and dates on the official Cambridge syllabus.</p>
  </section>
}

function JournalAdd({ subjects, cur, onAdd }: { subjects: string[]; cur: string; onAdd: (j: { subject: string; what: string; fix: string }) => void }) {
  const [s, setS] = useState(cur); const [w, setW] = useState(''); const [f, setF] = useState('')
  return <div className="lgform"><select value={s} onChange={e => setS(e.target.value)}>{subjects.map(x => <option key={x}>{x}</option>)}</select><input value={w} onChange={e => setW(e.target.value)} placeholder="What went wrong?" /><input value={f} onChange={e => setF(e.target.value)} placeholder="How will I fix it?" />
    <button className="btn ghost" disabled={w.trim().length < 3} onClick={() => { onAdd({ subject: s, what: w.trim(), fix: f.trim() || 'Review the topic' }); setW(''); setF(''); sfx('good') }}>Add</button></div>
}

function Mock({ sub }: { sub: Subject }) {
  const [p, setP] = useState(sub.papers[0]?.n ?? 1); const [left, setLeft] = useState(0); const [run, setRun] = useState(false); const end = useRef(0)
  useEffect(() => { if (!run) return undefined; const id = setInterval(() => { const l = Math.max(0, Math.round((end.current - Date.now()) / 1000)); setLeft(l); if (l === 0) { setRun(false); sfx('win') } }, 500); return () => clearInterval(id) }, [run])
  const pp = sub.papers.find(x => x.n === p); const mins = pp?.d ?? 60
  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return <div className="lgform"><p className="note">Time yourself under real exam conditions. Aim for about 1 minute per mark.</p>
    <label>Paper<select value={p} onChange={e => { setP(Number(e.target.value)); setRun(false); setLeft(0) }}>{sub.papers.map(x => <option key={x.n} value={x.n}>Paper {x.n}: {x.t} ({dur(x.d) || 'time not set'})</option>)}</select></label>
    <div className="bigpin"><b>{fmt(run || left ? left : mins * 60)}</b></div>
    <div className="row"><button className="btn" onClick={() => { end.current = Date.now() + (left > 0 && !run ? left : mins * 60) * 1000; setLeft(left > 0 && !run ? left : mins * 60); setRun(true); sfx('good') }} disabled={run}>{left > 0 && !run ? 'Resume' : 'Start'}</button><button className="btn ghost" onClick={() => setRun(false)} disabled={!run}>Pause</button><button className="btn ghost" onClick={() => { setRun(false); setLeft(0) }}>Reset</button></div></div>
}
