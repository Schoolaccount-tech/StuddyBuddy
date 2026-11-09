'use client'
import { useEffect, useState } from 'react'
import { sfx } from '@/lib/fx'

/** Share window with a QR code so a whole class can join from the smartboard. */
export default function Share({ onClose }: { onClose: () => void }) {
  const [img, setImg] = useState(''); const [url, setUrl] = useState(''); const [msg, setMsg] = useState(''); const [canShare, setCanShare] = useState(false)
  useEffect(() => {
    const u = location.origin + '/'; setUrl(u); setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
    let alive = true
    import('qrcode').then(m => m.toDataURL(u, { width: 360, margin: 1, color: { dark: '#14183a', light: '#ffffff' } })).then(d => { if (alive) setImg(d) }).catch(() => { if (alive) setMsg('Could not make the QR code.') })
    return () => { alive = false }
  }, [])
  const copy = async () => { try { await navigator.clipboard.writeText(url); setMsg('Link copied ✅'); sfx('good') } catch { setMsg('Copy the link above by hand.') } }
  const share = async () => { try { await navigator.share({ title: 'Wise Owl Westgate IGCSE Study Buddy', text: 'Free IGCSE revision with games, quizzes and an AI tutor.', url }) } catch {} }
  return <div className="pal-bg" onClick={onClose} role="dialog" aria-label="Share the Study Buddy">
    <div className="share" onClick={e => e.stopPropagation()}>
      <h2>📱 Scan to join</h2><p className="note">Point a phone camera at this code to open the Study Buddy.</p>
      <div className="qr">{img ? <img src={img} alt="QR code for the Study Buddy website" width={260} height={260} /> : <span className="note">Making QR…</span>}</div>
      <code className="share-url">{url}</code>
      <div className="row"><button className="btn" onClick={copy}>📋 Copy link</button>{canShare && <button className="btn ghost" onClick={share}>Share…</button>}<button className="btn ghost" onClick={onClose}>Close</button></div>
      <p className="note">{msg}</p>
    </div></div>
}
