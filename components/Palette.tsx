'use client'
import { useEffect, useRef, useState } from 'react'

export type Cmd = { id: string; e: string; label: string; hint?: string; run: () => void }

/** Ctrl/Cmd + K quick launcher. */
export default function Palette({ cmds, onClose }: { cmds: Cmd[]; onClose: () => void }) {
  const [q, setQ] = useState(''); const [sel, setSel] = useState(0); const inp = useRef<HTMLInputElement>(null)
  useEffect(() => { inp.current?.focus() }, [])
  const list = cmds.filter(c => (c.label + ' ' + (c.hint || '')).toLowerCase().includes(q.trim().toLowerCase()))
  const go = (c?: Cmd) => { if (!c) return; onClose(); setTimeout(() => c.run(), 30) }
  return <div className="pal-bg" onClick={onClose} role="dialog" aria-label="Command palette">
    <div className="pal" onClick={e => e.stopPropagation()}>
      <input ref={inp} value={q} placeholder="Type a command… (try “quiz”, “dark”, “breathe”)" aria-label="Search commands"
        onChange={e => { setQ(e.target.value); setSel(0) }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(list.length - 1, s + 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)) }
          else if (e.key === 'Enter') { e.preventDefault(); go(list[sel]) }
          else if (e.key === 'Escape') onClose()
        }} />
      <div className="pal-l">{list.length === 0 && <div className="note" style={{ padding: 14 }}>Nothing found. Try another word.</div>}
        {list.slice(0, 40).map((c, i) => <button key={c.id} className={'pal-i' + (i === sel ? ' on' : '')} onMouseEnter={() => setSel(i)} onClick={() => go(c)}>
          <span>{c.e}</span><b>{c.label}</b>{c.hint && <small>{c.hint}</small>}</button>)}
      </div>
      <div className="pal-f"><kbd>↑</kbd><kbd>↓</kbd> move <kbd>Enter</kbd> go <kbd>Esc</kbd> close</div>
    </div>
  </div>
}
