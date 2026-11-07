'use client'
export type Mood = 'idle' | 'cheer' | 'think'
export default function Mascot({ msg, mood }: { msg: string; mood: Mood }) {
  return <div className={'mascot ' + mood} aria-live="polite">
    {msg && <div className="bubble" key={msg}>{msg}</div>}
    <img src="/logo.png" alt="Wise Owl mascot" />
  </div>
}
