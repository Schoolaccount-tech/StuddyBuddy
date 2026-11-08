'use client'
import { useState } from 'react'
import { sfx } from '@/lib/fx'

const SUBJ = ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'English Language', 'Computer Science', 'Business Studies', 'Geography', 'History', 'Economics', 'Accounting']
type Block = { s: string; m: number; done: boolean }
type Day = { label: string; blocks: Block[] }

export default function Timetable({ current }: { current: string }) {
  const [pick, setPick] = useState<string[]>([current]); const [hrs, setHrs] = useState(2); const [plan, setPlan] = useState<Day[] | null>(null)
  const toggle = (s: string) => setPick(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  function build() {
    const subs = pick.length ? pick : [current]; const blocks = Math.max(1, Math.round((hrs * 60) / 45)); let k = 0; const out: Day[] = []
    for (let d = 0; d < 7; d++) {
      const dt = new Date(); dt.setDate(dt.getDate() + d)
      const bl: Block[] = Array.from({ length: blocks }, () => ({ s: subs[k++ % subs.length], m: 45, done: false }))
      out.push({ label: dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), blocks: bl })
    }
    setPlan(out); sfx('win')
  }
  return <section>
    <p className="note">Pick your subjects and how long you can study each day. I will lay out the next 7 days in 45-minute blocks.</p>
    <div className="rail" role="group" aria-label="Subjects to plan">{SUBJ.map(s => <button key={s} className="chip" aria-pressed={pick.includes(s)} onClick={() => toggle(s)}>{s}</button>)}</div>
    <div className="row" style={{ justifyContent: 'flex-start', margin: '10px 0 16px' }}><span className="note">Hours per day</span><div className="seg">{[1, 2, 3, 4].map(h => <button key={h} aria-pressed={hrs === h} onClick={() => setHrs(h)}>{h}h</button>)}</div><button className="btn" onClick={build}>Build my timetable</button></div>
    {plan && <div className="tt">{plan.map((d, i) => <div key={i} className="tt-day tilt" style={{ animationDelay: `${i * 70}ms` }}><b>{d.label}</b>
      {d.blocks.map((b, j) => <label key={j} className={'tt-b' + (b.done ? ' done' : '')}><input type="checkbox" checked={b.done} onChange={() => { sfx('good'); setPlan(plan.map((x, xi) => xi === i ? { ...x, blocks: x.blocks.map((y, yj) => yj === j ? { ...y, done: !y.done } : y) } : x)) }} /><span>{b.s}</span><small>{b.m} min</small></label>)}</div>)}</div>}
  </section>
}
