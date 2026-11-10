'use client'
import { useEffect, useRef, useState } from 'react'
import Starfield from './Starfield'
import { confetti, celebrate, sfx } from '@/lib/fx'
import { store } from '@/lib/api'
import { readLook, applyLook } from '@/lib/a11y'

const TITLE = 'The Team'
const STATS: [string, string][] = [['12', 'study tabs'], ['7', 'mini-games'], ['33', 'handy tools'], ['8', 'colour themes'], ['1', 'big idea']]
const STORY: [string, string, string][] = [
  ['💡', 'The idea', 'Michael imagined a free, fun revision buddy for every Wise Owl student at Westgate.'],
  ['💻', 'The code', 'Jayden turned the idea into a real website that works on phones, laptops and smartboards.'],
  ['🎮', 'The fun', 'Games, a coin shop, an animated sky, rainbow mode and a hidden surprise were added to make studying exciting.'],
  ['🚀', 'The launch', 'Now every learner can study smarter, one small win at a time.'],
]

function Person({ initials, name, role, emoji, blurb, tags, verified, tone }: { initials: string; name: string; role: string; emoji: string; blurb: string; tags: string[]; verified?: boolean; tone: 'a' | 'b' | 'c' }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => {
    const el = ref.current; if (!el || e.pointerType === 'touch') return
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ry', `${x * 14}deg`); el.style.setProperty('--rx', `${-y * 14}deg`); el.style.setProperty('--mx', `${(x + 0.5) * 100}%`); el.style.setProperty('--my', `${(y + 0.5) * 100}%`)
  }
  const leave = () => { const el = ref.current; if (el) { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg') } }
  return <div className={'pcard ' + tone} ref={ref} onPointerMove={move} onPointerLeave={leave} onClick={() => { confetti(0.8); sfx('good') }}>
    <div className="pshine" />
    <div className="avatar"><span className="orbit o1">{emoji}</span><span className="orbit o2">✨</span><span className="orbit o3">⭐</span><div className="av-in">{initials}</div></div>
    <small className="prole">{role}</small>
    <h2>{name}{verified && <svg className="tick" viewBox="0 0 24 24" aria-label="Verified"><path fill="#1d9bf0" d="M12 1.5l2.6 1.7 3.1-.2 1.3 2.8 2.7 1.5-.5 3.1 1.1 2.9-2 2.4-.2 3.1-3 .9-2 2.4-2.9-1.1-2.9 1.1-2-2.4-3-.9-.2-3.1-2-2.4 1.1-2.9-.5-3.1 2.7-1.5 1.3-2.8 3.1.2z" /><path d="M7.7 12.2l3 3 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</h2>
    <p>{blurb}</p>
    <div className="ptags">{tags.map(t => <span key={t}>{t}</span>)}</div>
  </div>
}

export default function About() {
  const [shown, setShown] = useState<boolean[]>([false, false, false, false])
  const story = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const a = store.get('accent', 'owl'); document.documentElement.dataset.accent = a
      const m = store.get('mode', 'auto'); if (m !== 'auto') document.documentElement.dataset.theme = m
      if (store.get('rainbow', false)) document.documentElement.dataset.rainbow = '1'
      applyLook(readLook())
    } catch {}
    const t = setTimeout(() => { celebrate('stars', '🦉'); confetti(1.1) }, 900)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const root = story.current; if (!root || typeof IntersectionObserver === 'undefined') { setShown([true, true, true, true]); return }
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { const i = Number((e.target as HTMLElement).dataset.i); setShown(s => s.map((v, j) => (j === i ? true : v))) } }) }, { threshold: 0.3 })
    root.querySelectorAll('.step').forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [])

  return <>
    <div className="aurora" aria-hidden><i /><i /><i /></div><Starfield /><div className="rb-bar" aria-hidden />
    <main className="wrap about">
      <nav className="about-nav"><a href="/" className="btn ghost">← Back to Study Buddy</a></nav>
      <header className="about-hero">
        <img className="crest big" src="/logo.png" alt="Wise Owl School crest" />
        <small>Wise Owl School · Westgate</small>
        <h1 aria-label={TITLE}>{TITLE.split('').map((c, i) => <span key={i} className="ltr" style={{ animationDelay: `${i * 70}ms` }}>{c === ' ' ? ' ' : c}</span>)}</h1>
        <p className="lead">Big ideas, clever code, and a team cheering them on, all for every learner.</p>
      </header>

      <section className="duo-p">
        <Person tone="a" initials="MM" name="Michael Makadzange" role="Ideas" emoji="💡" blurb="The dreamer behind the Study Buddy. Michael came up with the ideas that make revision feel fun instead of heavy." tags={['Big ideas', 'Features', 'Vision']} />
        <div className="plus" aria-hidden><span>＋</span><i /></div>
        <Person tone="b" initials="JN" name="Jayden Ngwenya" role="Code" emoji="💻" verified blurb="The builder. Jayden turned the ideas into a real website, with games, animations and tools that work on every screen." tags={['Website', 'Animations', 'Smartboard ready']} />
      </section>

      <section className="solo-p">
        <Person tone="c" initials="EM" name="Emmanuel Makhubo" role="Motivation & morale" emoji="🔥" blurb="The team's cheerleader. Emmanuel kept spirits high and kept the energy going whenever the work got tough." tags={['Motivation', 'Morale', 'Team spirit']} />
      </section>

      <section className="stats-row">{STATS.map(([n, l], i) => <div key={l} className="stat" style={{ animationDelay: `${i * 90}ms` }}><b>{n}</b><span>{l}</span></div>)}</section>

      <section className="story" ref={story}>
        <h2 className="sec-t">How it came to life</h2>
        <div className="line" />
        {STORY.map(([e, t, d], i) => <div key={t} data-i={i} className={'step' + (i % 2 ? ' r' : '') + (shown[i] ? ' in' : '')}><span className="dot-e">{e}</span><div><h3>{t}</h3><p>{d}</p></div></div>)}
      </section>

      <section className="thanks">
        <h2>Made with ❤️ for Wise Owl School Westgate</h2>
        <p className="note">Ideas by <b>Michael Makadzange</b> · Code by <b>Jayden Ngwenya</b> · Motivation by <b>Emmanuel Makhubo</b></p>
        <div className="row"><button className="btn" onClick={() => { celebrate('fireworks'); confetti(1.5); sfx('win') }}>🎉 Celebrate the team</button><a className="btn ghost" href="/">Start studying</a></div>
      </section>
    </main>
  </>
}
