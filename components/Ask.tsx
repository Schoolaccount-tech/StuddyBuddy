'use client'
import { useEffect, useRef, useState } from 'react'
import { ai } from '@/lib/api'
import { sfx, speak, speakThen, stopSpeak, canListen, listen } from '@/lib/fx'
import { SUBJECTS } from '@/lib/igcse'
import Md from './Md'
import type { Api } from './api'

type Msg = { role: 'user' | 'assistant'; content: string; fresh?: boolean; pic?: string }
const STYLES = [['simple', '🧒 Simple'], ['exam', '🎯 Exam style'], ['deep', '🔬 Go deeper']] as const
const FOLLOW = ['Quiz me on this (5 questions)', 'Explain it more simply', 'Give me another worked example', 'What mistakes do students make here?']

function Typed({ text, fresh, onTick }: { text: string; fresh: boolean; onTick: () => void }) {
  const [n, setN] = useState(fresh ? 0 : text.length)
  useEffect(() => {
    if (!fresh) return undefined
    const id = setInterval(() => setN(v => { if (v >= text.length) { clearInterval(id); return v } return Math.min(text.length, v + 8) }), 16)
    return () => clearInterval(id)
  }, [text, fresh])
  useEffect(() => { void onTick() }, [n]) // eslint-disable-line
  return <><Md text={text.slice(0, n)} />{n < text.length && <span className="caret" />}</>
}

// Shrink photos in the browser so uploads are fast on school data and phones.
async function shrink(file: File): Promise<{ type: string; data: string; url: string }> {
  const bmp = await createImageBitmap(file); const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  const g = c.getContext('2d'); if (!g) throw new Error('no canvas'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height)
  const url = c.toDataURL('image/jpeg', 0.82); return { type: 'image/jpeg', data: url.split(',')[1], url }
}

export default function Ask({ api, onMood, seed }: { api: Api; onMood: (m: 'idle' | 'think') => void; seed?: { t: string; n: number } | null }) {
  const [canMic, setCanMic] = useState(false)
  useEffect(() => { setCanMic(canListen()) }, [])
  const [log, setLog] = useState<Msg[]>([{ role: 'assistant', content: "Hi, I'm **Wise Owl** 🦉. Ask me **anything**: IGCSE subjects, homework, essays, coding, general knowledge. Tap 📷 to photograph a question and I'll solve it step by step." }])
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const [style, setStyle] = useState<string>('exam'); const [mic, setMic] = useState(false)
  const [sub, setSub] = useState(''); const [pic, setPic] = useState<{ type: string; data: string; url: string } | null>(null); const [voice, setVoice] = useState(false)
  const end = useRef<HTMLDivElement>(null); const stop = useRef<(() => void) | null>(null); const voiceRef = useRef(false); const logRef = useRef(log); const busyRef = useRef(false); const file = useRef<HTMLInputElement>(null)
  logRef.current = log
  const scroll = () => end.current?.scrollIntoView({ block: 'nearest' })
  useEffect(() => { void scroll() }, [log, busy]) // eslint-disable-line
  useEffect(() => () => { voiceRef.current = false; stop.current?.(); stopSpeak() }, [])
  useEffect(() => { if (seed) setQ(seed.t); return undefined }, [seed?.n]) // eslint-disable-line
  const subject = sub || api.subj
  const starters = ['Explain the main ideas simply', 'What do examiners usually ask about this?', 'Give me a worked example', 'Common mistakes to avoid']

  async function send(text0?: string, spoken = false) {
    const text = (text0 ?? q).trim(); if ((!text && !pic) || busyRef.current) return
    busyRef.current = true; setBusy(true)
    const p = pic; const next: Msg[] = [...logRef.current.map(m => ({ ...m, fresh: false })), { role: 'user', content: text || 'Please solve the question in this photo.', pic: p?.url }]
    setLog(next); setQ(''); setPic(null); onMood('think'); sfx('pop')
    try {
      const j = await ai({ mode: 'chat', style: spoken ? 'voice' : style, subject, topic: api.topic, image: p ? { type: p.type, data: p.data } : undefined, messages: next.slice(1).map(m => ({ role: m.role, content: m.content })) })
      setLog([...next, { role: 'assistant', content: j.text, fresh: true }]); api.award({ k: 'ask' })
      if (spoken && voiceRef.current) speakThen(j.text, () => { if (voiceRef.current) setTimeout(listenLoop, 300) })
    } catch (err: any) { setLog([...next, { role: 'assistant', content: err.message }]); if (voiceRef.current) setTimeout(listenLoop, 1500) }
    busyRef.current = false; setBusy(false); onMood('idle')
  }
  function listenLoop() {
    if (!voiceRef.current) return; let heard = ''
    const s = listen(t => { heard = t; setQ(t) }, () => { setMic(false); if (!voiceRef.current) return; if (heard.trim().length > 1) void send(heard, true); else setTimeout(listenLoop, 600) })
    if (s) { stop.current = s; setMic(true) } else { voiceRef.current = false; setVoice(false) }
  }
  function toggleVoice() {
    if (voice) { voiceRef.current = false; setVoice(false); stop.current?.(); stopSpeak(); setMic(false); return }
    voiceRef.current = true; setVoice(true); sfx('good'); listenLoop()
  }
  function toggleMic() {
    if (mic) { stop.current?.(); setMic(false); return }
    const s = listen(t => setQ(t), () => setMic(false)); if (s) { stop.current = s; setMic(true) }
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    try { setPic(await shrink(f)); sfx('good') } catch { setLog(l => [...l, { role: 'assistant', content: 'I could not read that photo. Try again with a clearer picture.' }]) }
  }
  const lastAi = log.length > 1 && log[log.length - 1].role === 'assistant' && !busy
  return <section>
    <div className="row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
      <label className="note">Subject <select value={sub} onChange={e => setSub(e.target.value)} aria-label="Subject for the tutor"><option value="">{api.subj} (current)</option><option value="Anything">🌍 Anything</option>{[...new Set(SUBJECTS.map(x => x.name))].sort().map(n => <option key={n}>{n}</option>)}</select></label>
      <div className="seg" role="group" aria-label="Tutor style">{STYLES.map(([k, l]) => <button key={k} type="button" aria-pressed={style === k} onClick={() => { setStyle(k); sfx('pop') }}>{l}</button>)}</div>
      {canMic && <button type="button" className={'btn ghost' + (voice ? ' on' : '')} aria-pressed={voice} onClick={toggleVoice}>{voice ? '⏹️ End voice chat' : '🗣️ Voice chat'}</button>}</div>
    {log.length === 1 && <div className="starters">{starters.map(s => <button key={s} type="button" onClick={() => setQ(s + (api.topic.trim() ? ' for ' + api.topic.trim() : ''))}>{s}</button>)}</div>}
    <div className="log" aria-live="polite">{log.map((m, i) => <div key={i} className={'msg ' + (m.role === 'user' ? 'me' : 'ai')}>
      {m.pic && <img className="askpic" src={m.pic} alt="Your photo" />}
      {m.role === 'assistant' ? <Typed text={m.content} fresh={!!m.fresh} onTick={scroll} /> : m.content}
      {m.role === 'assistant' && i > 0 && <button className="speak" aria-label="Read aloud" onClick={() => speak(m.content)}>🔊</button>}</div>)}
      {busy && <div className="msg ai"><span className="typing"><i /><i /><i /></span></div>}<div ref={end} /></div>
    {lastAi && <div className="starters">{FOLLOW.map(f => <button key={f} type="button" onClick={() => send(f)}>{f}</button>)}</div>}
    {pic && <div className="picprev"><img src={pic.url} alt="Photo to send" /><button type="button" className="linkish" onClick={() => setPic(null)}>remove photo</button></div>}
    <form className="ask" onSubmit={e => { e.preventDefault(); void send() }}>
      <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <button type="button" className="mic" onClick={() => file.current?.click()} aria-label="Attach or take a photo of a question">📷</button>
      <textarea rows={2} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }} placeholder={mic ? 'Listening…' : pic ? 'Add a note about the photo (optional)…' : 'Ask me anything…'} aria-label="Your question" />
      {canMic && !voice && <button type="button" className={'mic' + (mic ? ' on' : '')} onClick={toggleMic} aria-label="Speak your question">🎤</button>}
      <button className="btn" disabled={busy}>Ask</button></form>
  </section>
}
