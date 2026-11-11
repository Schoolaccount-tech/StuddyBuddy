'use client'
import { useEffect, useState } from 'react'
import { store, ai } from '@/lib/api'
import { sfx } from '@/lib/fx'
import { getMistakes, getTM, weakSpots, masteryLabel, MISTAKE_TYPES, type Mistake, type Weak } from '@/lib/learn'
import Md from './Md'

type Props = { onExplain: (subj: string, topic: string) => void; onQuiz: (subj: string, topic: string) => void }

export default function WeakSpots({ onExplain, onQuiz }: Props) {
  const [weak, setWeak] = useState<Weak[]>([]); const [mist, setMist] = useState<Mistake[]>([]); const [tm, setTm] = useState<ReturnType<typeof getTM>>({}); const [plan, setPlan] = useState<{ text: string; at: string } | null>(null)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [show, setShow] = useState<'open' | 'all'>('open')
  const reload = () => { setWeak(weakSpots()); setMist(getMistakes()); setTm(getTM()) }
  useEffect(() => { reload(); setPlan(store.get('plan-ai', null)); return undefined }, [])
  const setM = (f: (m: Mistake[]) => Mistake[]) => { const n = f(getMistakes()); store.set('err', n); reload() }
  const topics = Object.entries(tm).map(([k, v]) => { const [subj, topic] = k.split('::'); return { subj, topic, pct: Math.round((v.r / Math.max(1, v.t)) * 100), total: v.t } }).sort((a, b) => a.pct - b.pct)
  const openN = mist.filter(m => !m.fixed).length
  async function makePlan() {
    setBusy(true); setErr('')
    const lines = weak.slice(0, 8).map(w => `- ${w.subj}: ${w.topic} (${w.pct}% correct over ${w.total} questions, ${w.open} open mistakes)`).join('\n')
    const ex = mist.filter(m => !m.fixed).slice(0, 8).map(m => `- [${m.subj} / ${m.topic}] ${m.type}: ${m.q ?? m.note}`).join('\n')
    try {
      const j = await ai({ mode: 'chat', style: 'exam', subject: 'Anything', topic: '', messages: [{ role: 'user', content: `You are building a personalised revision plan for a Cambridge IGCSE student from real data about where they lose marks.\n\nWeak topics:\n${lines}\n\nRecent mistakes:\n${ex || '(none recorded)'}\n\nMake a 5-day plan (about 30 to 40 minutes a day). For each day give: the topic, 2 or 3 specific things to do (read, practise, past-paper style questions), and one check question. Start with the weakest topic. Finish with how to know they have improved (for example "score 80% on a 10-question quiz on this topic").` }] })
      const v = { text: j.text as string, at: new Date().toLocaleDateString('en-GB') }; setPlan(v); store.set('plan-ai', v); sfx('win')
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  return <section className="weak">
    <div className="hubnote">The Weakness Detector watches every quiz answer and exam question. When a topic is below 70% after at least 2 tries, or has 2 open mistakes, it appears here with the next steps: <b>Explain it → Quiz me → Fix the mistakes</b>. Your data stays on this device.</div>
    <div className="lgstats"><div className="stat"><b>{weak.length}</b><span>Weak topics</span></div><div className="stat"><b>{openN}</b><span>Open mistakes</span></div><div className="stat"><b>{topics.length}</b><span>Topics tracked</span></div><div className="stat"><b>{topics.filter(t => t.total >= 2 && t.pct >= 85).length}</b><span>Mastered</span></div></div>
    <h3>🎯 Where you are losing marks</h3>
    {!weak.length ? <p className="note">{topics.length ? 'No weak topics right now. Great work! Keep quizzing to stay sharp.' : 'Nothing yet. Do a quiz or an exam question and Wise Owl will start finding your patterns.'}</p> :
      weak.map(w => <div key={w.subj + w.topic} className="weakcard">
        <div className="hb-top"><b>{w.topic}</b><span className="note">{w.subj} · {w.total ? w.pct + '% over ' + w.total : 'no quiz data'}{w.open ? ` · ${w.open} open mistake${w.open > 1 ? 's' : ''}` : ''}</span></div>
        <div className="hb-track"><i style={{ width: Math.max(4, w.pct) + '%', background: w.pct < 50 ? '#e21b3c' : '#d89e00' }} /></div>
        <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn ghost" onClick={() => { sfx('pop'); onExplain(w.subj, w.topic) }}>💬 Explain it</button><button className="btn" onClick={() => { sfx('pop'); onQuiz(w.subj, w.topic) }}>🧠 Quiz me</button></div></div>)}
    {weak.length > 0 && <div><button className="btn" onClick={makePlan} disabled={busy}>{busy ? 'Building your plan…' : '🗓️ Make my revision plan'}</button>{err && <div className="notice">{err}</div>}</div>}
    {plan && <div className="hubcard"><b>Your revision plan <span className="note">({plan.at})</span></b><Md text={plan.text} /><button className="linkish" onClick={() => { setPlan(null); store.set('plan-ai', null) }}>clear plan</button></div>}
    <h3>📈 Topic mastery</h3>
    {!topics.length ? <p className="note">No topics tracked yet.</p> : <div className="lgtable">{topics.slice(0, 30).map(t => { const [l, e] = masteryLabel(t.pct, t.total); return <div key={t.subj + t.topic} className="lgrow"><span>{e}</span><span className="lgname">{t.topic} <small className="note">{t.subj}</small></span><span className="note">{l} · {t.pct}% ({t.total})</span></div> })}</div>}
    <h3>🧾 Mistake notebook</h3>
    <div className="seg"><button aria-pressed={show === 'open'} onClick={() => setShow('open')}>Open ({openN})</button><button aria-pressed={show === 'all'} onClick={() => setShow('all')}>All ({mist.length})</button></div>
    {(show === 'open' ? mist.filter(m => !m.fixed) : mist).slice(0, 40).map(m => <div key={m.id} className="lgrow" style={{ alignItems: 'flex-start' }}>
      <input type="checkbox" checked={!!m.fixed} onChange={() => setM(a => a.map(x => x.id === m.id ? { ...x, fixed: !x.fixed } : x))} aria-label="Mark as fixed" />
      <span className="lgname"><b>{m.topic}</b> <small className="note">{m.subj} · {m.src}</small><br />{m.q && <span>{m.q}<br /></span>}{m.a && <small className="note">Right answer: {m.a}</small>}
        <br /><select value={m.type} aria-label="Type of mistake" onChange={e => setM(a => a.map(x => x.id === m.id ? { ...x, type: e.target.value } : x))}>{MISTAKE_TYPES.map(t => <option key={t}>{t}</option>)}</select></span>
      <button className="linkish" onClick={() => setM(a => a.filter(x => x.id !== m.id))}>delete</button></div>)}
    {!mist.length && <p className="note">Wrong answers are saved here automatically.</p>}
  </section>
}
