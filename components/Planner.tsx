'use client'
import { useEffect, useState } from 'react'
type T = { id: number; t: string; done: boolean }

export default function Planner({ onDone }: { onDone: () => void }) {
  const [tasks, setTasks] = useState<T[]>([]); const [v, setV] = useState('')
  useEffect(() => { try { setTasks(JSON.parse(localStorage.getItem('wob:tasks') || '[]')) } catch {} }, [])
  const put = (n: T[]) => { setTasks(n); try { localStorage.setItem('wob:tasks', JSON.stringify(n)) } catch {} }
  const add = (e: React.FormEvent) => { e.preventDefault(); const t = v.trim(); if (!t) return; put([{ id: Date.now(), t: t.slice(0, 90), done: false }, ...tasks]); setV('') }
  const left = tasks.filter(x => !x.done).length
  return <section>
    <form className="ask" onSubmit={add}><input className="plain" value={v} onChange={e => setV(e.target.value)} placeholder="Add a study task, for example: Chemistry past paper 2" aria-label="New task" /><button className="btn">Add</button></form>
    <p className="note" style={{ margin: '12px 0' }}>{tasks.length ? `${left} to do, ${tasks.length - left} done. Each ticked task earns XP.` : 'Plan your session. Small tasks are easy to start and satisfying to tick.'}</p>
    {tasks.map(x => <div key={x.id} className={'task' + (x.done ? ' done' : '')}>
      <button className="tick-btn" aria-label={x.done ? 'Mark not done' : 'Mark done'} aria-pressed={x.done} onClick={() => { if (!x.done) onDone(); put(tasks.map(y => y.id === x.id ? { ...y, done: !y.done } : y)) }}><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></button>
      <span>{x.t}</span><button className="x" aria-label="Delete task" onClick={() => put(tasks.filter(y => y.id !== x.id))}>×</button></div>)}
  </section>
}
