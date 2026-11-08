'use client'
export default function GlobalError({ error }: { error: Error }) {
  const wipe = () => { try { Object.keys(localStorage).filter(k => k.startsWith('wob:')).forEach(k => localStorage.removeItem(k)); sessionStorage.clear() } catch {}; location.reload() }
  return (
    <html lang="en"><body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 56, marginTop: '12vh' }}>🦉</div>
      <h1>Oops, the Study Buddy tripped</h1>
      <button onClick={wipe} style={{ padding: '12px 22px', borderRadius: 12, border: 0, background: '#f2c500', fontWeight: 700, fontSize: 16 }}>Reset and reload</button>
      <pre style={{ marginTop: 24, textAlign: 'left', whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(error?.message || error)}</pre>
    </body></html>
  )
}
