'use client'
import { useEffect, useRef, useState } from 'react'
import { store } from '@/lib/api'
import { noise } from '@/lib/fx'

export default function Focus({ sess, onSession }: { sess: number; onSession: (min: number) => void }) {
  const [fm, setFm] = useState(25), [bm, setBm] = useState(5)
  const [left, setLeft] = useState(25 * 60); const [brk, setBrk] = useState(false); const [run, setRun] = useState(false); const [exam, setExam] = useState(''); const [rain, setRain] = useState(false); const [zen, setZen] = useState(false)
  const first = useRef(true)
  useEffect(() => { setExam(store.get('exam', '')); const f = store.get('fm', 25), b = store.get('bm', 5); setFm(f); setBm(b); setLeft(f * 60); return () => noise(false) }, [])
  useEffect(() => { if (!run) return; const id = setInterval(() => setLeft(l => l - 1), 1000); return () => clearInterval(id) }, [run])
  useEffect(() => {
    if (left > 0) return
    setRun(false); if (!brk) onSession(fm); setBrk(!brk); setLeft((brk ? fm : bm) * 60)
  }, [left]) // eslint-disable-line
  useEffect(() => { if (first.current) { first.current = false; return } if (!run) setLeft((brk ? bm : fm) * 60) }, [fm, bm]) // eslint-disable-line
  const total = (brk ? bm : fm) * 60; const m = Math.floor(left / 60), s = left % 60; const clock = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  const days = exam ? Math.ceil((new Date(exam + 'T00:00:00').getTime() - Date.now()) / 864e5) : null
  return <section>
    {zen && <div className="zen" role="dialog" aria-label="Zen focus mode"><div className="breath" /><div className="zen-in"><small>{brk ? 'Break' : 'Focus'}</small><b>{clock}</b><p>Breathe in as the circle grows. Breathe out as it shrinks.</p>
      <div className="row"><button className="btn" onClick={() => setRun(!run)}>{run ? 'Pause' : 'Start'}</button><button className="btn ghost light" onClick={() => setZen(false)}>Exit zen mode</button></div></div></div>}
    <div className="focus">
      <div className={'ring' + (run ? ' live' : '')}><svg viewBox="0 0 120 120"><circle className="bgc" cx="60" cy="60" r="52" /><circle className="fg" cx="60" cy="60" r="52" strokeDasharray="326.7" strokeDashoffset={326.7 * (1 - left / total)} /></svg><b>{clock}</b></div>
      <div><h2 style={{ fontSize: 26, marginBottom: 6 }}>{brk ? `Break for ${bm} minutes` : `Focus for ${fm} minutes`}</h2>
        <div className="setup" style={{ marginBottom: 12 }}>
          <div><span className="note">Focus length</span><div className="seg">{[15, 25, 45, 50].map(n => <button key={n} aria-pressed={fm === n} onClick={() => { setFm(n); store.set('fm', n) }}>{n}m</button>)}</div></div>
          <div><span className="note">Break</span><div className="seg">{[5, 10].map(n => <button key={n} aria-pressed={bm === n} onClick={() => { setBm(n); store.set('bm', n) }}>{n}m</button>)}</div></div></div>
        <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn" onClick={() => setRun(!run)}>{run ? 'Pause' : left === total ? 'Start' : 'Resume'}</button>
          <button className="btn ghost" onClick={() => { setRun(false); setBrk(false); setLeft(fm * 60) }}>Reset</button>
          <button className={'btn ghost' + (rain ? ' on' : '')} onClick={() => { noise(!rain); setRain(!rain) }}>{rain ? '🌧 Calm noise on' : '🌧 Calm noise'}</button>
          <button className="btn ghost" onClick={() => setZen(true)}>🧘 Zen mode</button></div>
        <div className="dots" aria-label="Sessions today">{[0, 1, 2, 3].map(i => <i key={i} className={i < sess ? 'on' : ''} />)}</div>
        <div className="exam" style={{ marginTop: 22 }}><label htmlFor="exam" className="note">Exam date</label><br />
          <input type="date" id="exam" value={exam} onChange={e => { setExam(e.target.value); store.set('exam', e.target.value) }} />
          <span style={{ fontWeight: 700, marginLeft: 8 }}>{days === null ? '' : days > 0 ? `${days} days to go` : days === 0 ? 'Exam day. Good luck!' : 'Date has passed'}</span></div>
      </div></div></section>
}
