'use client'
import { useEffect } from 'react'

// Friendly crash screen: shows what went wrong and offers a clean restart.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // First crash in this tab: wipe saved study data (the most common cause) and try once more.
    try {
      if (!sessionStorage.getItem('wob:recovered')) {
        sessionStorage.setItem('wob:recovered', '1')
        Object.keys(localStorage).filter(k => k.startsWith('wob:')).forEach(k => localStorage.removeItem(k))
        location.reload()
      }
    } catch {}
  }, [])
  const wipe = () => { try { Object.keys(localStorage).filter(k => k.startsWith('wob:')).forEach(k => localStorage.removeItem(k)); sessionStorage.clear() } catch {}; location.reload() }
  return (
    <div style={{ maxWidth: 560, margin: '12vh auto', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <div style={{ fontSize: 56 }}>🦉</div>
      <h1 style={{ fontSize: 24 }}>Oops, the Study Buddy tripped</h1>
      <p>Tap the button to reset and try again. Your saved XP on this device will be cleared.</p>
      <button onClick={wipe} style={{ padding: '12px 22px', borderRadius: 12, border: 0, background: '#f2c500', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Reset and reload</button>{' '}
      <button onClick={reset} style={{ padding: '12px 22px', borderRadius: 12, border: '1px solid #999', background: 'transparent', fontSize: 16, cursor: 'pointer' }}>Try again</button>
      <pre style={{ marginTop: 24, textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, background: '#0001', padding: 12, borderRadius: 8, maxHeight: 220, overflow: 'auto' }}>
        {String(error?.message || error)}{'\n'}{(error?.stack || '').split('\n').slice(0, 6).join('\n')}
      </pre>
    </div>
  )
}
