'use client'
import { useEffect, useRef, useState } from 'react'
import { ai } from '@/lib/api'
import { sfx, speak, stopSpeak, canListen, listen } from '@/lib/fx'
import type { Api } from './api'

type Msg = { role: 'user' | 'assistant'; content: string; fresh?: boolean }
const STYLES = [['simple', '🧒 Simple'], ['exam', '🎯 Exam style'], ['deep', '🔬 Go deeper']] as const

function Typed({ text, fresh, onTick }: { text: string; fresh: boolean; onTick: () => void }) {
  const [n, setN] = useState(fresh ? 0 : text.length)
  useEffect(() => {
    if (!fresh) return
    const id = setInterval(() => setN(v => { if (v >= text.length) { clearInterval(id); return v } return Math.min(text.length, v + 3) }), 16)
    return () => clearInterval(id)
  }, [text, fresh])
  useEffect(onTick, [n]) // eslint-disable-line
  return <>{text.slice(0, n)}{n < text.length && <span className="caret" />}</>
}

export default function Ask({ api, onMood }: { api: Api; onMood: (m: 'idle' | 'think') => void }) {
  const [canMic, setCanMic] = useState(false)
  useEffect(() => { setCanMic(canListen()) }, [])
  const [log, setLog] = useState<Msg[]>([{ role: 'assistant', content: "Hi, I'm Wise Owl 🦉 Ask me anything about your IGCSE subject. I explain step by step and show you how marks are earned in the exam." }])
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const [style, setStyle] = useState<string>('exam'); const [mic, setMic] = useState(false)
  const end = useRef<HTMLDivElement>(null); const stop = useRef<(() => void) | null>(null)
  const scroll = () => end.current?.scrollIntoView({ block: 'nearest' })
  useEffect(scroll, [log, busy])
  useEffect(() => () => stopSpeak(), [])
  const starters = ['Explain the main ideas simply', 'What do examiners usually ask about this?', 'Give me a worked example', 'Common mistakes to avoid']
  async function send(e?: React.FormEvent) {
    e?.preventDefault(); const text = q.trim(); if (!text || busy) return
    const next: Msg[] = [...log.map(m => ({ ...m, fresh: false })), { role: 'user', content: text }]; setLog(next); setQ(''); setBusy(true); onMood('think'); sfx('pop')
    try { const j = await ai({ mode: 'chat', style, subject: api.subj, topic: api.topic, messages: next.slice(1).map(m => ({ role: m.role, content: m.content })) }); setLog([...next, { role: 'assistant', content: j.text, fresh: true }]); api.award({ k: 'ask' }) }
    catch (err: any) { setLog([...next, { role: 'assistant', content: err.message }]) }
    setBusy(false); onMood('idle')
  }
  function toggleMic() {
    if (mic) { stop.current?.(); setMic(false); return }
    const s = listen(t => setQ(t), () => setMic(false)); if (s) { stop.current = s; setMic(true) }
  }
  return <section>
    <div className="starters">{starters.map(s => <button key={s} type="button" onClick={() => setQ(s + (api.topic.trim() ? ' for ' + api.topic.trim() : ''))}>{s}</button>)}</div>
    <div className="seg" role="group" aria-label="Tutor style">{STYLES.map(([k, l]) => <button key={k} type="button" aria-pressed={style === k} onClick={() => { setStyle(k); sfx('pop') }}>{l}</button>)}</div>
    <div className="log" aria-live="polite">{log.map((m, i) => <div key={i} className={'msg ' + (m.role === 'user' ? 'me' : 'ai')}>
      {m.role === 'assistant' ? <Typed text={m.content} fresh={!!m.fresh} onTick={scroll} /> : m.content}
      {m.role === 'assistant' && i > 0 && <button className="speak" aria-label="Read aloud" onClick={() => speak(m.content)}>🔊</button>}</div>)}
      {busy && <div className="msg ai"><span className="typing"><i /><i /><i /></span></div>}<div ref={end} /></div>
    <form className="ask" onSubmit={send}>
      <textarea rows={2} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={mic ? 'Listening…' : 'Type your question…'} aria-label="Your question" />
      {canMic && <button type="button" className={'mic' + (mic ? ' on' : '')} onClick={toggleMic} aria-label="Speak your question">🎤</button>}
      <button className="btn" disabled={busy}>Ask</button></form>
  </section>
}
