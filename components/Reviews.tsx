'use client'
import { useEffect, useState } from 'react'
import { rpc, lgReady, getCode, setCode, clearCode, when } from '@/lib/league'
import { sfx, confetti } from '@/lib/fx'
import { Gate } from './League'

const Stars = ({ n, size = 18 }: { n: number; size?: number }) => <span className="stars" style={{ fontSize: size }} aria-label={`${n} out of 5 stars`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= Math.round(n) ? 'on' : ''}>★</i>)}</span>

export default function Reviews() {
  const [data, setData] = useState<any>(null); const [err, setErr] = useState(''); const [code, setCodeS] = useState(''); const [mine, setMine] = useState<any>(null)
  const [stars, setStars] = useState(0); const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const loadPublic = () => rpc('lg_reviews_public', {}).then(setData).catch(e => setErr(e.message))
  async function loadMine(c: string) { try { const r = await rpc('lg_review_mine', { p_code: c }); if (r.ok) { setMine(r.mine); if (r.mine) { setStars(r.mine.stars); setText(r.mine.body) } } else { clearCode(); setCodeS('') } } catch {} }
  useEffect(() => { void loadPublic(); const c = getCode(); if (c) { setCodeS(c); void loadMine(c) } return undefined }, [])
  async function signIn(c: string, remember: boolean): Promise<string> {
    try { const r = await rpc('lg_me', { p_code: c }); if (!r.ok) return r.error; setCode(c, remember); setCodeS(c); void loadMine(c); sfx('good'); return '' } catch (e: any) { return e.message }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!stars) { setMsg('Tap the stars to rate Wise Owl.'); return } setBusy(true); setMsg('')
    try { const r = await rpc('lg_review_save', { p_code: code, p_stars: stars, p_body: text }); if (!r.ok) setMsg(r.error); else { setMsg('Thank you! A teacher will check your review before it appears.'); setMine({ stars, body: text, status: 'pending' }); sfx('win'); confetti(0.8) } } catch (x: any) { setMsg(x.message) }
    setBusy(false)
  }
  if (!lgReady()) return <div className="notice">Reviews are not connected yet.</div>
  const max = Math.max(1, ...(data?.dist ?? [0]))
  return <section className="reviews">
    <div className="revsum"><div className="revavg"><b>{data?.avg ? Number(data.avg).toFixed(1) : '–'}</b><Stars n={Number(data?.avg || 0)} size={22} /><small>{data ? `${data.count} review${data.count === 1 ? '' : 's'}` : 'Loading…'}</small></div>
      <div className="revdist">{[5, 4, 3, 2, 1].map(n => <div key={n} className="revbar"><span>{n}★</span><div className="hb-track"><i style={{ width: `${data ? (data.dist[n - 1] / max) * 100 : 0}%`, background: '#f2c500' }} /></div><span>{data?.dist[n - 1] ?? 0}</span></div>)}</div></div>
    <h3>Write a review</h3>
    {!code ? <Gate onSignIn={signIn} note="Set your name once so each student can leave one review. Only your first name and last initial will be shown." /> :
      <form className="lgform" onSubmit={submit}>
        {mine && <p className="note">Your review is <b>{mine.status === 'approved' ? 'published' : mine.status === 'hidden' ? 'hidden by a teacher' : 'waiting for a teacher'}</b>. You can edit it below.</p>}
        <div className="starpick" role="radiogroup" aria-label="Your rating">{[1, 2, 3, 4, 5].map(i => <button type="button" key={i} role="radio" aria-checked={stars === i} aria-label={`${i} star${i > 1 ? 's' : ''}`} className={i <= stars ? 'on' : ''} onClick={() => { setStars(i); sfx('pop') }}>★</button>)}</div>
        <textarea rows={3} maxLength={400} value={text} onChange={e => setText(e.target.value)} placeholder="What do you like? What could be better? (no links, please be kind)" aria-label="Your review" />
        <div className="row"><span className="note">{text.length}/400 · A teacher approves reviews before they show.</span><button className="btn" disabled={busy || text.trim().length < 5}>{busy ? 'Sending…' : mine ? 'Update review' : 'Post review'}</button></div>
        {msg && <div className="notice" role="status">{msg}</div>}
        <button type="button" className="linkish" onClick={() => { clearCode(); setCodeS(''); setMine(null) }}>Not you? Sign out</button></form>}
    <h3>What students say</h3>
    {err && <div className="notice">{err}</div>}
    {data && !data.items.length ? <p className="note">No reviews yet. Be the first!</p> : (data?.items ?? []).map((r: any, i: number) => <div key={i} className="revitem"><div className="hb-top"><b>{r.who}</b><Stars n={r.stars} /></div><p>{r.body}</p><small className="note">{when(r.at)}</small></div>)}
  </section>
}
