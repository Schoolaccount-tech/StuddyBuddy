'use client'
export type Mood = 'idle' | 'cheer' | 'think'
export default function Mascot({ msg, mood, hat }: { msg: string; mood: Mood; hat: string }) {
  return <div className={'mascot ' + mood} aria-live="polite">
    {msg && <div className="bubble" key={msg}>{msg}</div>}
    <div className="m-wrap">{hat && <span className="hat" aria-hidden>{hat}</span>}<img src="/logo.png" alt="Wise Owl mascot" /></div>
  </div>
}
