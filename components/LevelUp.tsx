'use client'
import { useEffect } from 'react'
export default function LevelUp({ e, n, onClose }: { e: string; n: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4200); return () => clearTimeout(t) }, [onClose])
  return <div className="lvup" onClick={onClose} role="dialog" aria-label="Level up">
    <div className="rays" /><div className="lvup-in"><small>LEVEL UP</small><div className="lvup-e">{e}</div><h2>{n}</h2><p>You are getting wiser. Keep going!</p></div>
  </div>
}
