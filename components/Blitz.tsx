'use client'
import { useEffect, useRef, useState } from 'react'
import { FORMULAS } from '@/lib/data'
import { sfx, confetti } from '@/lib/fx'
import { store } from '@/lib/api'
import type { Api } from './api'

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
type Round = { n: string; opts: string[]; ans: string }

export default function Blitz({ api }: { api: Api }) {
  const list = FORMULAS[api.subj]; const [phase, setPhase] = useState<'idle' | 'play' | 'done'>('idle'); const [t, setT] = useState(60); const [score, setScore] = useState(0); const [combo, setCombo] = useState(0)
  const [round, setRound] = useState<Round | null>(null); const [flash, setFlash] = useState(''); const best = useRef(0); const [bestS, setBestS] = useState(0)
  useEffect(() => { setBestS(store.get('blitz:' + api.subj, 0)) }, [api.subj])
  const make = (): Round => { const c = list[Math.floor(Math.random() * list.length)]; const wrong = shuffle(list.filter(x => x.f !== c.f)).slice(0, 3).map(x => x.f); return { n: c.n, opts: shuffle([c.f, ...wrong]), ans: c.f } }
  function start() { setScore(0); setCombo(0); setT(60); setRound(make()); setPhase('play'); sfx('pop') }
  useEffect(() => {
    if (phase !== 'play') return
    if (t <= 0) { setPhase('done'); const b = Math.max(bestS, score); setBestS(b); store.set('blitz:' + api.subj, b); api.award({ k: 'blitz', score }); if (score >= 8) confetti(1.2); sfx('win'); return }
    const id = setTimeout(() => setT(x => x - 1), 1000); return () => clearTimeout(id)
  }, [t, phase]) // eslint-disable-line
  function pick(f: string) {
    if (!round) return; const ok = f === round.ans; setFlash(ok ? 'ok' : 'bad'); setTimeout(() => setFlash(''), 250); sfx(ok ? 'good' : 'bad')
    if (ok) { setScore(s => s + 1); setCombo(c => c + 1) } else setCombo(0)
    setRound(make())
  }
  if (!list) return <p className="note">Formula Blitz works for Mathematics, Physics and Chemistry. Pick one of those subjects above.</p>
  void best
  return <section className={'blitz ' + flash}>
    {phase === 'idle' && <div className="result"><div className="big-e">⚡</div><h3 style={{ fontSize: 24 }}>Formula Blitz</h3><p className="note">Match each formula name to the right formula. You have 60 seconds. Best for {api.subj}: <b>{bestS}</b></p><button className="btn" onClick={start}>Start blitz</button></div>}
    {phase === 'play' && round && <div><div className="qhead"><span className="pill">Score {score}</span>{combo >= 2 && <span className="combo" key={combo}>⚡ x{combo}</span>}<span className={'pill' + (t <= 10 ? ' hot' : '')}>⏱ {t}s</span></div>
      <div className="qbar"><i style={{ width: `${(t / 60) * 100}%`, transition: 'width 1s linear' }} /></div>
      <h3 className="blitz-q" key={round.n}>{round.n}</h3>
      <div className="blitz-opts">{round.opts.map(o => <button key={o} className="opt" onClick={() => pick(o)}>{o}</button>)}</div></div>}
    {phase === 'done' && <div className="result"><div className="score">{score} correct ⚡</div><p className="note">Your best for {api.subj} is {bestS}.</p><button className="btn" onClick={start}>Play again</button></div>}
  </section>
}
