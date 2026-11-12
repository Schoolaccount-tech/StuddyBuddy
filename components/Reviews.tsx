'use client'
import { useEffect, useState } from 'react'
import { rpc, lgReady, when } from '@/lib/league'
import { sfx, confetti } from '@/lib/fx'

const Stars = ({ n, size = 18 }: { n: number; size?: number }) => <span className="stars" style={{ fontSize: size }} aria-label={`${n} out of 5 stars`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= Math.round(n) ? 'on' : ''}>★</i>)}</span>
// One rating per browser. The id is random and never leaves this site; it only stops the same device voting twice.
function deviceId(): string {
  try { let d = localStorage.getItem('wob:dev'); if (!d || d.length < 16) { d = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '').slice(0, 40); localStorage.setItem('wob:dev', d) } return d } catch { return 'nodev' + Math.random().toString(36).slice(2) + Date.now().toString(36) }
}

export default function Reviews() {
  const [data, setData] = useState<any>(null); const [err, setErr] = useState(''); const [dev, setDev] = useState(''); const [mine, setMine] = useState<any>(null)
  const [stars, setStars] = useState(0); const [name, setName] = useState(''); const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const loadPublic = () => rpc('lg_site_ratings_public', {}).then(setData).catch(e => setErr(e.message))
  useEffect(() => {
    const d = deviceId(); setDev(d); void loadPublic()
    rpc('lg_site_rate_mine', { p_device: d }).then((m: any) => { if (m) { setMine(m); setStars(m.stars); setName(m.name || ''); setText(m.body || '') } }).catch(() => {})
    return undefined
  }, [])
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!stars) { setMsg('Tap the stars to rate Wise Owl.'); return } setBusy(true); setMsg('')
    try {
      const r = await rpc('lg_site_rate', { p_device: dev, p_stars: stars, p_name: name || null, p_body: text || null })
      if (!r.ok) setMsg(r.error); else { setMsg(r.pending ? 'Thank you! Your stars count now. A teacher checks comments before they appear.' : 'Thank you for rating Wise Owl!'); setMine({ stars, name, body: text, shown: false }); sfx('win'); confetti(0.8); void loadPublic() }
    } catch (x: any) { setMsg(x.message) }
    setBusy(false)
  }
  if (!lgReady()) return <div className="notice">Ratings are not connected yet.</div>
  const max = Math.max(1, ...(data?.dist ?? [0]))
  return <section className="reviews">
    <div className="revsum"><div className="revavg"><b>{data?.avg ? Number(data.avg).toFixed(1) : '–'}</b><Stars n={Number(data?.avg || 0)} size={22} /><small>{data ? `${data.count} rating${data.count === 1 ? '' : 's'}` : 'Loading…'}</small></div>
      <div className="revdist">{[5, 4, 3, 2, 1].map(n => <div key={n} className="revbar"><span>{n}★</span><div className="hb-track"><i style={{ width: `${data ? (data.dist[n - 1] / max) * 100 : 0}%`, background: '#f2c500' }} /></div><span>{data?.dist[n - 1] ?? 0}</span></div>)}</div></div>
    <h3>Rate Wise Owl</h3>
    <form className="lgform" onSubmit={submit}>
      <p className="note">{mine ? 'You have already rated. You can change your rating below.' : 'How would you rate this website out of 5? No sign-in needed.'}</p>
      <div className="starpick" role="radiogroup" aria-label="Your rating out of 5">{[1, 2, 3, 4, 5].map(i => <button type="button" key={i} role="radio" aria-checked={stars === i} aria-label={`${i} star${i > 1 ? 's' : ''}`} className={i <= stars ? 'on' : ''} onClick={() => { setStars(i); sfx('pop') }}>★</button>)}</div>
      <input value={name} maxLength={30} onChange={e => setName(e.target.value)} placeholder="Your first name (optional)" aria-label="Your name" />
      <textarea rows={3} maxLength={300} value={text} onChange={e => setText(e.target.value)} placeholder="Say what you like or what we should improve (optional, no links)" aria-label="Your comment" />
      <div className="row"><span className="note">{text.length}/300 · Comments are checked by a teacher before they show.</span><button className="btn" disabled={busy || !stars}>{busy ? 'Sending…' : mine ? 'Update rating' : 'Submit rating'}</button></div>
      {msg && <div className="notice" role="status">{msg}</div>}</form>
    <h3>What people say</h3>
    {err && <div className="notice">{err}</div>}
    {data && !data.items.length ? <p className="note">No comments yet. Be the first!</p> : (data?.items ?? []).map((r: any, i: number) => <div key={i} className="revitem"><div className="hb-top"><b>{r.who}</b><Stars n={r.stars} /></div><p>{r.body}</p><small className="note">{when(r.at)}</small></div>)}
  </section>
}
