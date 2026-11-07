'use client'
import { useEffect, useState } from 'react'

// Opening animation, once per visit. Click to skip.
export default function Intro() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try { if (sessionStorage.getItem('wob:intro')) return; sessionStorage.setItem('wob:intro', '1') } catch {}
    setShow(true); const t = setTimeout(() => setShow(false), 4300); return () => clearTimeout(t)
  }, [])
  if (!show) return null
  const word = 'Study Buddy'
  return <div className="intro" onClick={() => setShow(false)} role="presentation">
    <div className="intro-rings"><i /><i /><i /></div>
    <div className="intro-in">
      <img src="/logo.png" alt="" />
      <small>Wise Owl School · Westgate</small>
      <h1 aria-label={word}>{word.split('').map((c, i) => <span key={i} style={{ animationDelay: `${0.7 + i * 0.06}s` }}>{c === ' ' ? ' ' : c}</span>)}</h1>
      <p className="intro-by">Ideas by <b>Michael Makadzange</b> <span>·</span> Code by <b>Jayden Ngwenya</b>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-label="Verified"><path fill="#1d9bf0" d="M12 1.5l2.6 1.7 3.1-.2 1.3 2.8 2.7 1.5-.5 3.1 1.1 2.9-2 2.4-.2 3.1-3 .9-2 2.4-2.9-1.1-2.9 1.1-2-2.4-3-.9-.2-3.1-2-2.4 1.1-2.9-.5-3.1 2.7-1.5 1.3-2.8 3.1.2z" /><path d="M7.7 12.2l3 3 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></p>
      <div className="intro-bar"><i /></div>
    </div>
  </div>
}
