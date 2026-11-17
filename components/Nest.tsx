'use client'
import { useEffect, useRef, useState } from 'react'
import { store } from '@/lib/api'
import { dayKey, GOAL } from '@/lib/progress'
import { sfx, confetti } from '@/lib/fx'
import type { Api } from './api'
import { rpc } from '@/lib/league'
import { OWLS, RARITY, describe, power, buddyOf, petName, loadNest, saveNest, today, NEST_DEF, CODES, ADMIN_HASH, codeHash, type Offer, type Sp, type Nest, type Fx } from '@/lib/owls'

// Owl Nest: hatch eggs by studying (or buy them with coins) and collect owls of twelve rarities, from Common to Sovereign.
type Tier = { id: string; name: string; cost: number; need: number; odds: number[]; c1: string; c2: string; mark: string; blurb: string }
const RAW: Tier[] = [
  { id: 'study', name: 'Study Egg', cost: 0, need: 120, odds: [70, 22, 7, 1, 0, 0, 0], c1: '#fff7e0', c2: '#86d19a', mark: 'dots', blurb: 'Free. Warms up as you earn XP.' },
  { id: 'nest', name: 'Nest Egg', cost: 15, need: 0, odds: [60, 28, 10, 2, 0, 0, 0], c1: '#e0f2ff', c2: '#60a5fa', mark: 'dots', blurb: 'Commons, uncommons and a chance at rare.' },
  { id: 'moon', name: 'Moon Egg', cost: 40, need: 0, odds: [0, 50, 38, 11, 1, 0, 0], c1: '#ede9fe', c2: '#8b5cf6', mark: 'stars', blurb: 'No commons. Good odds at rare and epic.' },
  { id: 'gold', name: 'Golden Egg', cost: 90, need: 0, odds: [0, 0, 55, 35, 9, 1, 0], c1: '#fff3b0', c2: '#f5b301', mark: 'stars', blurb: 'Rare or better every time. Legendary chance!' },
  { id: 'mythic', name: 'Mythic Egg', cost: 400, need: 0, odds: [0, 0, 0, 50, 35, 14, 1], c1: '#ffe4ec', c2: '#ff2d75', mark: 'stars', blurb: 'Epic or better. Real chance of a Mythic owl!' },
  { id: 'cosmic', name: 'Transcendent Egg', cost: 2000, need: 0, odds: [0, 0, 0, 0, 40, 45, 15], c1: '#e0fbff', c2: '#7c3aed', mark: 'stars', blurb: 'Legendary or better. The only way to meet a Transcendent owl.' },
  { id: 'godly', name: 'Godly Egg', cost: 8000, need: 0, odds: [0, 0, 0, 0, 0, 40, 40, 20], c1: '#fff1d6', c2: '#ff8a00', mark: 'stars', blurb: 'Mythic or better. Your way to a Godly owl.' },
  { id: 'divine', name: 'Divine Egg', cost: 20000, need: 0, odds: [0, 0, 0, 0, 0, 0, 45, 40, 15], c1: '#fffbe6', c2: '#e8c75a', mark: 'stars', blurb: 'Transcendent or better. Holy hoots!' },
  { id: 'asc', name: 'Ascendant Egg', cost: 50000, need: 0, odds: [0, 0, 0, 0, 0, 0, 0, 45, 40, 15], c1: '#e0e7ff', c2: '#6366f1', mark: 'stars', blurb: 'Godly or better. Rises above the clouds.' },
  { id: 'unreal', name: 'Unreal Egg', cost: 120000, need: 0, odds: [0, 0, 0, 0, 0, 0, 0, 0, 45, 40, 15], c1: '#d1fae5', c2: '#22ff99', mark: 'stars', blurb: 'Divine or better. Is it even real?' },
  { id: 'sov', name: 'Sovereign Egg', cost: 300000, need: 0, odds: [0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 40, 10], c1: '#ffd6dc', c2: '#ff0033', mark: 'stars', blurb: 'Ascendant or better. Rule them all.' },
]
const TIERS: Tier[] = RAW.map(t => ({ ...t, odds: [...t.odds, ...Array(RARITY.length - t.odds.length).fill(0)] }))

export function OwlArt({ sp, size = 96, still }: { sp: Sp | null; size?: number; still?: boolean }) {
  const a = sp?.acc ?? ['tufts'], body = sp ? sp.body : '#2a2f55', belly = sp ? sp.belly : '#3a4070', eye = sp?.eye ?? '#555'
  const has = (k: string) => a.includes(k) && !!sp, c = sp ? RARITY[sp.r][1] : '#555'
  return <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={sp ? sp.name : 'Undiscovered owl'} className={'ow-art' + (still ? '' : ' idle')} style={sp && sp.r >= 3 ? { filter: `drop-shadow(0 0 ${sp.r >= 7 ? 22 : sp.r >= 5 ? 14 : 8}px ${c})` } : undefined}>
    {(has('tufts') || !sp) && <><path d="M26 34 L20 8 L42 24Z" fill={body} /><path d="M74 34 L80 8 L58 24Z" fill={body} /></>}
    <ellipse cx="50" cy="60" rx="32" ry="34" fill={body} />
    <path d="M21 52 Q8 74 27 88 Q30 70 29 54Z" fill="#000" opacity=".2" /><path d="M79 52 Q92 74 73 88 Q70 70 71 54Z" fill="#000" opacity=".2" />
    <ellipse cx="50" cy="70" rx="19" ry="22" fill={belly} />
    {has('spots') && [[44, 64], [56, 64], [50, 72], [42, 78], [58, 78], [50, 84]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill={body} opacity=".55" />)}
    {has('stars') && [[30, 56], [70, 62], [50, 78], [38, 84], [64, 82], [24, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.4 : 2.2} fill="#fff" opacity=".9" />)}
    {has('snow') && [[36, 70], [64, 74], [50, 86]].map(([x, y], i) => <g key={i} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".9"><path d={`M${x - 4} ${y}H${x + 4}M${x} ${y - 4}V${y + 4}M${x - 3} ${y - 3}L${x + 3} ${y + 3}M${x - 3} ${y + 3}L${x + 3} ${y - 3}`} /></g>)}
    {has('bolt') && <path d="M53 62 L43 77 L50 77 L46 90 L60 72 L52 72Z" fill="#fde047" stroke="#f59e0b" strokeWidth=".8" />}
    {has('flame') && <><path d="M50 -2 Q60 10 53 18 Q58 8 46 14 Q42 6 50 -2Z" fill="#fb923c" /><path d="M50 6 Q54 11 51 15 Q49 11 50 6Z" fill="#fde047" /></>}
    <ellipse cx="50" cy="40" rx="27" ry="22" fill={belly} opacity=".96" />
    {has('rings') && <><circle cx="38" cy="40" r="14" fill="none" stroke={body} strokeWidth="1.2" opacity=".6" /><circle cx="62" cy="40" r="14" fill="none" stroke={body} strokeWidth="1.2" opacity=".6" /></>}
    <g className="ow-eyes">{[38, 62].map(x => <g key={x}><circle cx={x} cy="40" r="10.5" fill="#fff" stroke={body} strokeWidth="1.5" /><circle cx={x} cy="40" r="6.5" fill={eye} /><circle cx={x} cy="40" r="3.2" fill="#111" /><circle cx={x + 2} cy="37.5" r="1.6" fill="#fff" /></g>)}</g>
    {has('lids') && <><path d="M27 36 Q38 28 49 36" stroke="#f472b6" strokeWidth="2.4" fill="none" /><path d="M51 36 Q62 28 73 36" stroke="#f472b6" strokeWidth="2.4" fill="none" /></>}
    {has('glasses') && <g stroke="#e9d5ff" strokeWidth="2" fill="none"><circle cx="38" cy="40" r="13" /><circle cx="62" cy="40" r="13" /><path d="M51 40H49" /></g>}
    <path d="M46 46 L54 46 L50 55Z" fill="#f59e0b" />
    {has('cap') && <g><path d="M22 22 L50 10 L78 22 L50 32Z" fill="#1f2937" /><path d="M36 28 V36 Q50 42 64 36 V28" fill="#374151" /><path d="M76 23 V36" stroke="#facc15" strokeWidth="1.6" /><circle cx="76" cy="38" r="2.4" fill="#facc15" /></g>}
    {has('halo') && <ellipse cx="50" cy="4" rx="17" ry="4.5" fill="none" stroke="#fde047" strokeWidth="2.4" />}
    <rect x="36" y="92" width="10" height="5" rx="2.5" fill="#f59e0b" /><rect x="54" y="92" width="10" height="5" rx="2.5" fill="#f59e0b" />
  </svg>
}

function EggArt({ t, size = 90, crack = 0, wobble }: { t: Tier; size?: number; crack?: number; wobble?: boolean }) {
  const id = 'eg' + t.id
  return <svg width={size} height={size * 1.1} viewBox="0 0 100 110" className={'ow-egg' + (wobble ? ' wob' : '')} role="img" aria-label={t.name}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={t.c1} /><stop offset="1" stopColor={t.c2} /></linearGradient></defs>
    <path d="M50 4 C76 4 92 44 92 70 C92 96 74 106 50 106 C26 106 8 96 8 70 C8 44 24 4 50 4Z" fill={`url(#${id})`} stroke="rgba(0,0,0,.18)" strokeWidth="2" />
    {t.mark === 'dots' ? [[34, 40, 5], [62, 30, 4], [66, 60, 6], [30, 70, 5], [50, 86, 4], [48, 52, 4]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={t.c2} opacity=".55" />) : [[34, 40], [62, 32], [68, 62], [30, 72], [50, 88], [48, 54]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 6}L${x + 2} ${y - 2}L${x + 6} ${y}L${x + 2} ${y + 2}L${x} ${y + 6}L${x - 2} ${y + 2}L${x - 6} ${y}L${x - 2} ${y - 2}Z`} fill="#fff" opacity=".8" />)}
    <ellipse cx="36" cy="30" rx="8" ry="14" fill="#fff" opacity=".35" transform="rotate(20 36 30)" />
    {crack > 0 && <path d="M50 14 L44 34 L56 46 L42 64 L58 80" stroke="#3b2a1a" strokeWidth="3" fill="none" strokeLinejoin="round" />}
    {crack > 1 && <path d="M30 50 L44 56 M70 44 L56 50 M40 90 L50 78 M60 92 L52 80" stroke="#3b2a1a" strokeWidth="2.6" fill="none" strokeLinecap="round" />}
  </svg>
}

const REFUND = [3, 6, 12, 25, 60, 150, 400, 800, 1500, 3000, 6000, 12000]
const SAYS = ['Hoo hoo! 💛', 'That tickles! 🪶', 'Best study buddy ever!', 'Let us learn something new!', '*happy owl noises*', 'You are doing great!']
function rollRarity(w: number[]) { let x = Math.random() * w.reduce((a, b) => a + b, 0), r = 0; for (; r < w.length - 1; r++) { if (x < w[r]) break; x -= w[r] } while (w[r] === 0 && r > 0) r--; return r }
function pickOwl(odds: number[], pity: number, luck: number): Sp {
  let w = odds.slice(); if (pity >= 9 && w[0] + w[1] > 0) w = w.map((v, i) => i < 2 ? 0 : i === 2 ? Math.max(v, 60) : i === 3 ? Math.max(v, 30) : i === 4 ? Math.max(v, 10) : v)
  let r = rollRarity(w); if (luck > 0 && Math.random() * 100 < luck) r = Math.max(r, rollRarity(w))
  const pool = OWLS.filter(o => o.r === r); return pool[Math.floor(Math.random() * pool.length)]
}
const tagC = (r: number) => r === 6 ? ' rb' : r >= 7 ? ' sh' : ''
const tagS = (r: number): React.CSSProperties => { const c = RARITY[r][1]; return r >= 7 ? { background: `linear-gradient(90deg,${c},#ffffffcc,${c})`, color: r === 8 ? '#5b4a00' : '#fff' } : { background: c } }
const mood = (n: Nest, id: string) => { const p = n.pets[id]; if (!p) return ['😐', 'New friend']; const t = today(); if (p.petDay === t || p.feedDay === t) return ['😊', 'Happy']; return ['🥱', 'Sleepy: give it some love'] }

export default function NestTab({ api, onGo }: { api: Api; onGo: (t: string) => void }) {
  const [n, setN] = useState<Nest>(NEST_DEF); const [ready, setReady] = useState(false); const [spent, setSpent] = useState(0)
  const [hatch, setHatch] = useState<null | { t: Tier; sp: Sp; dup: boolean; stars: number; refund: number }>(null); const [stage, setStage] = useState(0); const [sel, setSel] = useState<Sp | null>(null)
  const [code, setCode] = useState(''); const [codeMsg, setCodeMsg] = useState<null | { ok: boolean; t: string }>(null); const [say, setSay] = useState(''); const [hearts, setHearts] = useState(0); const [rename, setRename] = useState('')
  const [tmsg, setTmsg] = useState<null | { ok: boolean; t: string }>(null); const [tcode, setTcode] = useState(''); const [peek, setPeek] = useState<null | { code: string; owl: string }>(null); const [busy, setBusy] = useState(false); const [pickO, setPickO] = useState(''); const [acoins, setAcoins] = useState('1000'); const [aowl, setAowl] = useState('overlord')
  const timers = useRef<number[]>([])
  useEffect(() => { const m0 = loadNest(); setN(m0); if (m0.offers.length) sync(m0); setSpent(store.get<any>('rw', { spent: 0 }).spent || 0); setReady(true); return () => timers.current.forEach(clearTimeout) }, [])
  const save = (m: Nest) => { setN(m); saveNest(m) }
  const pay = (c: number) => { const rw = store.get<any>('rw', { spent: 0, owned: ['a-owl', 't-new'], avatar: 'a-owl', title: 't-new', frame: '' }); rw.spent = (rw.spent || 0) + c; store.set('rw', rw); setSpent(rw.spent) }
  const coins = Math.max(0, Math.floor(api.p.xp / 5) - spent)
  const buddy = buddyOf(n), bp = buddy ? power(n, buddy.id) : 1
  const eff = (k: Fx['k']) => buddy ? buddy.ab.fx.filter(f => f.k === k) : []
  const sumPct = (k: 'warm' | 'luck' | 'discount') => eff(k).reduce((a, f: any) => a + f.pct * bp, 0)
  const need = Math.round(TIERS[0].need * (1 - Math.min(60, sumPct('warm')) / 100)), disc = Math.min(40, sumPct('discount'))
  const cost = (t: Tier) => Math.max(1, Math.ceil(t.cost * (1 - disc / 100)))
  const gift = eff('gift').reduce((a, f: any) => a + Math.round(f.coins * bp), 0); const giftReady = gift > 0 && n.gift !== today()
  const warm = n.egg ? Math.max(0, api.p.xp - n.egg.start) : 0, pct = Math.min(100, Math.round((warm / need) * 100)), ready2 = !!n.egg && warm >= need
  const found = OWLS.filter(o => n.owls[o.id]).length
  const goalN = api.p.goal.d === dayKey() ? Math.min(GOAL, api.p.goal.n) : 0

  function doHatch(t: Tier, base: Nest) {
    const sp = pickOwl(t.odds, base.pity, Math.min(70, sumPct('luck'))), had = base.owls[sp.id] || 0, refund = had ? REFUND[sp.r] : 0
    if (refund) pay(-refund)
    save({ ...base, owls: { ...base.owls, [sp.id]: had + 1 }, hatched: base.hatched + 1, pity: sp.r >= 2 ? 0 : base.pity + 1, buddy: base.buddy || sp.id })
    setHatch({ t, sp, dup: !!had, stars: had + 1, refund }); setStage(0); sfx('pop')
    const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms))
    at(1500, () => { setStage(1); sfx('pop') }); at(2300, () => { setStage(2); sfx('good') })
    at(2800, () => { setStage(3); sfx(sp.r >= 3 ? 'level' : 'win'); confetti(sp.r >= 7 ? 7 : sp.r >= 6 ? 5 : sp.r >= 5 ? 3.5 : sp.r >= 4 ? 2 : sp.r >= 2 ? 1.2 : 0.6) })
  }
  function buy(t: Tier) {
    const c = cost(t)
    if (coins < c) { api.toast('🪙', 'Not enough coins yet', `You need ${c - coins} more. Study to earn XP, and 5 XP = 1 coin.`); sfx('bad'); return }
    pay(c); doHatch(t, n)
  }
  function claim() { pay(-gift); save({ ...n, gift: today() }); sfx('win'); confetti(0.5); api.toast('🎁', `${buddy ? petName(n, buddy) : 'Your owl'} brought ${gift} coins!`, buddy?.ab.name) }
  function care(s: Sp, kind: 'pet' | 'feed') {
    const t = today(), p = n.pets[s.id] || { name: '', bond: 0, petDay: '', feedDay: '' }
    if (kind === 'pet' ? p.petDay === t : p.feedDay === t) return
    if (kind === 'feed') { if (coins < 2) { api.toast('🪙', 'A treat costs 2 coins', 'Study to earn more.'); sfx('bad'); return } pay(2) }
    save({ ...n, pets: { ...n.pets, [s.id]: { ...p, bond: Math.min(10, p.bond + 1), petDay: kind === 'pet' ? t : p.petDay, feedDay: kind === 'feed' ? t : p.feedDay } } })
    setSay(kind === 'feed' ? 'Yum! Thank you! 🍖' : SAYS[Math.floor(Math.random() * SAYS.length)]); setHearts(h => h + 1); sfx('good'); setTimeout(() => setSay(''), 2500)
  }
  async function redeem(e: React.FormEvent) {
    e.preventDefault(); const raw = code.trim(); if (!raw) return
    const h = await codeHash(raw), c = CODES[h]
    if (h === ADMIN_HASH) { save({ ...n, adm: true }); setCode(''); setCodeMsg({ ok: true, t: '👑 Admin mode unlocked on this device. Scroll down to the Admin panel.' }); sfx('level'); confetti(3); return }
    if (!c) { setCodeMsg({ ok: false, t: 'That code does not work. Check the spelling.' }); sfx('bad'); return }
    if (n.codes.includes(h)) { setCodeMsg({ ok: false, t: 'You already used that code on this device.' }); sfx('bad'); return }
    pay(-c.coins); save({ ...n, codes: [...n.codes, h] }); setCode(''); setCodeMsg({ ok: true, t: `🎉 ${c.msg}` }); sfx('win'); confetti(c.coins >= 5000 ? 4 : 1.2)
  }
  const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('')
  const dec = (o: Record<string, number>, id: string) => { const m = { ...o, [id]: (o[id] || 0) - 1 }; if (m[id] <= 0) delete m[id]; return m }
  const nm = (id: string) => OWLS.find(x => x.id === id)?.name || 'an owl'
  async function sync(base: Nest) {
    let m = base, msg = ''
    for (const o of base.offers) {
      try {
        const r = await rpc('ow_trade_status', { p_code: o.code, p_secret: o.secret }); if (!r.ok) continue
        if (r.status === 'claimed') { const c = await rpc('ow_trade_collect', { p_code: o.code, p_secret: o.secret }); if (!c.ok) continue
          const back = OWLS.some(x => x.id === c.reply_owl) ? c.reply_owl as string : ''
          m = { ...m, offers: m.offers.filter(x => x.code !== o.code), owls: back ? { ...m.owls, [back]: (m.owls[back] || 0) + 1 } : m.owls }
          msg += back ? `A friend swapped ${nm(back)} for your ${nm(o.owl)}! ` : `A friend took your ${nm(o.owl)} as a gift. ` }
        else if (r.status === 'cancelled' || r.status === 'collected') m = { ...m, offers: m.offers.filter(x => x.code !== o.code) }
      } catch { break }
    }
    if (m !== base) { save(m); if (msg) { setTmsg({ ok: true, t: '🤝 ' + msg }); sfx('win') } }
  }
  async function offer() {
    const id = pickO; if (!id || !n.owls[id] || busy) return; setBusy(true); setTmsg(null)
    try { const secret = rnd(), r = await rpc('ow_trade_offer', { p_owl: id, p_secret: secret })
      if (!r.ok) { setTmsg({ ok: false, t: r.error }); sfx('bad') } else { save({ ...n, owls: dec(n.owls, id), offers: [...n.offers, { code: r.code, owl: id, secret }] }); setPickO(''); setTmsg({ ok: true, t: `Offer made! Give your friend the code ${r.code}. ${nm(id)} is held safe until then.` }); sfx('good') }
    } catch { setTmsg({ ok: false, t: 'Could not reach the trade desk. Check your internet and try again.' }) } finally { setBusy(false) }
  }
  async function cancelOffer(o: Offer) {
    if (busy) return; setBusy(true)
    try { const r = await rpc('ow_trade_cancel', { p_code: o.code, p_secret: o.secret })
      if (r.ok) { save({ ...n, owls: { ...n.owls, [o.owl]: (n.owls[o.owl] || 0) + 1 }, offers: n.offers.filter(x => x.code !== o.code) }); setTmsg({ ok: true, t: `${nm(o.owl)} is back in your nest.` }); sfx('good') } else { setTmsg({ ok: false, t: r.error }); sync(n) }
    } catch { setTmsg({ ok: false, t: 'Could not reach the trade desk.' }) } finally { setBusy(false) }
  }
  async function peekTrade(e: React.FormEvent) {
    e.preventDefault(); const c = tcode.trim().toUpperCase(); if (!c || busy) return; setBusy(true); setTmsg(null); setPeek(null)
    try { if (n.offers.some(o => o.code === c)) { setTmsg({ ok: false, t: 'That is your own offer. Share the code with a friend.' }); return }
      const r = await rpc('ow_trade_peek', { p_code: c })
      if (!r.ok) { setTmsg({ ok: false, t: r.error }); sfx('bad') } else if (r.status !== 'open') { setTmsg({ ok: false, t: 'That trade has already been taken or cancelled.' }); sfx('bad') } else if (!OWLS.some(x => x.id === r.owl)) { setTmsg({ ok: false, t: 'That owl is not in this version of the game yet.' }) } else setPeek({ code: c, owl: r.owl })
    } catch { setTmsg({ ok: false, t: 'Could not reach the trade desk.' }) } finally { setBusy(false) }
  }
  async function takeTrade(give: string | null) {
    if (!peek || busy) return; setBusy(true)
    try { const r = await rpc('ow_trade_accept', { p_code: peek.code, p_give: give })
      if (!r.ok) { setTmsg({ ok: false, t: r.error }); sfx('bad') } else {
        let owls = { ...n.owls, [peek.owl]: (n.owls[peek.owl] || 0) + 1 }; if (give) owls = dec(owls, give)
        save({ ...n, owls, buddy: n.buddy || peek.owl }); setTmsg({ ok: true, t: `🎉 ${nm(peek.owl)} joined your nest!` }); setPeek(null); setTcode(''); sfx('level'); confetti(OWLS.find(x => x.id === peek.owl)!.r >= 5 ? 4 : 1.5) }
    } catch { setTmsg({ ok: false, t: 'Could not reach the trade desk.' }) } finally { setBusy(false) }
  }
  function adminCoins() { const a = Math.max(0, Math.min(1e9, Math.floor(Number(acoins) || 0))); if (!a) return; pay(-a); sfx('win'); setTmsg({ ok: true, t: `Added ${a.toLocaleString()} coins.` }) }
  function adminOwl() { save({ ...n, owls: { ...n.owls, [aowl]: Math.min(9, (n.owls[aowl] || 0) + 1) }, buddy: n.buddy || aowl }); sfx('good'); setTmsg({ ok: true, t: `Gave you ${nm(aowl)}.` }) }
  function start() { save({ ...n, egg: { start: api.p.xp } }); sfx('good') }
  function close() { timers.current.forEach(clearTimeout); timers.current = []; setHatch(null) }
  if (!ready) return <section className="ow" />
  const sk = (s: Sp) => n.owls[s.id]
  const abil = (s: Sp, p: number) => s.ab.fx.map((f, i) => <li key={i}>{describe(f, p)}</li>)
  return <section className="ow">
    <div className="ow-hero"><div className="ow-hb">{buddy ? <OwlArt sp={buddy} size={104} /> : <EggArt t={TIERS[0]} size={86} wobble />}</div>
      <div><h2>🥚 Owl Nest</h2>{buddy ? <><p><b>{petName(n, buddy)}</b> is your study buddy. {goalN >= GOAL ? 'Daily goal done. Hoot hoot! 🎉' : `Study ${GOAL - goalN} more thing${GOAL - goalN === 1 ? '' : 's'} today to reach your daily goal.`}</p>
        <p className="ow-ab">⚡ <b>{buddy.ab.name}</b>: {buddy.ab.fx.map(f => describe(f, bp)).join(' · ')}</p>{giftReady && <button className="ow-btn pulse sm" onClick={claim}>🎁 Collect today’s {gift} coins</button>}</> : <p>Hatch your first owl! Study to warm your free egg, or spend coins on a special egg.</p>}
        <div className="ow-chips"><span>🪙 <b>{coins}</b> coins</span><span>🦉 <b>{found}</b>/{OWLS.length} owls</span><span>🥚 <b>{n.hatched}</b> hatched</span></div></div></div>

    <h3 className="ow-h">🔥 Incubator</h3>
    <div className="ow-card">{!n.egg ? <><EggArt t={TIERS[0]} size={80} /><div className="ow-grow"><b>Free Study Egg</b><p>Start it, then earn {need} XP from quizzes, cards, exams and focus sessions. It hatches into an owl!</p></div><button className="ow-btn" onClick={start}>Start incubating</button></>
      : <><EggArt t={TIERS[0]} size={80} wobble={ready2} /><div className="ow-grow"><b>{ready2 ? 'Your egg is ready to hatch!' : 'Your egg is warming up…'}</b>
        <div className="ow-bar" aria-label={`Egg warmth ${pct}%`}><i style={{ width: pct + '%' }} /></div><small>{Math.min(warm, need)} / {need} XP</small>
        {!ready2 && <div className="ow-row"><button className="ow-btn ghost sm" onClick={() => onGo('quiz')}>🧠 Quiz</button><button className="ow-btn ghost sm" onClick={() => onGo('decks')}>📚 Decks</button><button className="ow-btn ghost sm" onClick={() => onGo('exam')}>📝 Exam</button></div>}</div>
        {ready2 && <button className="ow-btn pulse" onClick={() => doHatch(TIERS[0], { ...n, egg: null })}>🐣 Hatch!</button>}</>}</div>

    <h3 className="ow-h">🛒 Egg shop</h3>
    <div className="ow-shop">{TIERS.slice(1).map(t => <div key={t.id} className="ow-egg-card">
      <EggArt t={t} size={70} /><b>{t.name}</b><small>{t.blurb}</small>
      <div className="ow-odds" aria-label="Odds">{RARITY.map(([nm, c], i) => t.odds[i] > 0 && <span key={nm} style={{ background: c }} title={`${nm} ${t.odds[i]}%`}>{t.odds[i]}%</span>)}</div>
      <button className="ow-btn" onClick={() => buy(t)} disabled={coins < cost(t)}>🪙 {cost(t)}{cost(t) < t.cost && <s> {t.cost}</s>} · Hatch</button></div>)}</div>
    <p className="ow-note">Colours show the chance of each rarity. {RARITY.map(([nm, c]) => <span key={nm} className="ow-dot" style={{ background: c }}>{nm}</span>)} Bad luck protection: after 9 hatches without a Rare, the next one is guaranteed Rare or better. A duplicate levels your owl up (stronger ability) and gives coins back.</p>

    <h3 className="ow-h">🔐 Secret code</h3>
    <form className="ow-code" onSubmit={redeem}><input value={code} onChange={e => { setCode(e.target.value); setCodeMsg(null) }} placeholder="Type a secret code" aria-label="Secret code" autoCapitalize="none" autoComplete="off" spellCheck={false} maxLength={30} /><button className="ow-btn" disabled={!code.trim()}>Redeem</button></form>
    {codeMsg && <p className={'ow-codemsg ' + (codeMsg.ok ? 'ok' : 'no')} role="status">{codeMsg.t}</p>}

    <h3 className="ow-h">🔁 Trade owls</h3>
    <p className="ow-note">Offer an owl to get a trade code. Your friend types the code to take it as a gift, or swaps one of theirs for it. Your owl is held safe until someone takes it.</p>
    <div className="ow-code"><select value={pickO} onChange={e => setPickO(e.target.value)} aria-label="Owl to offer" className="ow-in"><option value="">Pick an owl to offer…</option>{OWLS.filter(o => n.owls[o.id]).map(o => <option key={o.id} value={o.id}>{o.name} ({RARITY[o.r][0]}) ×{n.owls[o.id]}</option>)}</select><button className="ow-btn" onClick={offer} disabled={!pickO || busy}>Make offer</button></div>
    <form className="ow-code" onSubmit={peekTrade} style={{ marginTop: 10 }}><input value={tcode} onChange={e => { setTcode(e.target.value); setTmsg(null); setPeek(null) }} placeholder="Enter a trade code" aria-label="Trade code" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={8} /><button className="ow-btn" disabled={!tcode.trim() || busy}>Look up</button></form>
    {tmsg && <p className={'ow-codemsg ' + (tmsg.ok ? 'ok' : 'no')} role="status">{tmsg.t}</p>}
    {peek && (() => { const sp = OWLS.find(x => x.id === peek.owl)!; return <div className="ow-card"><OwlArt sp={sp} size={80} still /><div className="ow-grow"><b>{sp.name}</b> <span className={'ow-tag' + tagC(sp.r)} style={tagS(sp.r)}>{RARITY[sp.r][0]}</span><ul className="ow-ul">{abil(sp, 1)}</ul>
      <div className="ow-row"><button className="ow-btn sm" onClick={() => takeTrade(null)} disabled={busy}>🎁 Take as gift</button>{OWLS.some(o => n.owls[o.id]) && <select className="ow-in" aria-label="Swap with one of yours" value="" onChange={e => e.target.value && takeTrade(e.target.value)} disabled={busy}><option value="">🔁 Swap one of mine…</option>{OWLS.filter(o => n.owls[o.id]).map(o => <option key={o.id} value={o.id}>{o.name} ({RARITY[o.r][0]})</option>)}</select>}</div></div></div> })()}
    {n.offers.length > 0 && <div className="ow-offers"><b>Your open offers</b>{n.offers.map(o => <div key={o.code} className="ow-offer"><span>{nm(o.owl)} · code <b className="ow-pin">{o.code}</b></span><button className="ow-btn ghost sm" onClick={() => { try { navigator.clipboard.writeText(o.code); sfx('pop') } catch {} }}>Copy</button><button className="ow-btn ghost sm" onClick={() => cancelOffer(o)} disabled={busy}>Cancel</button></div>)}<button className="ow-btn ghost sm" onClick={() => sync(n)}>🔄 Check my offers</button></div>}

    {n.adm && <><h3 className="ow-h">👑 Admin panel</h3><div className="ow-offers"><div className="ow-code"><input type="number" min={1} max={1000000000} value={acoins} onChange={e => setAcoins(e.target.value)} aria-label="Coins to add" /><button className="ow-btn" onClick={adminCoins}>Add coins</button></div>
      <div className="ow-code"><select className="ow-in" value={aowl} onChange={e => setAowl(e.target.value)} aria-label="Owl to give">{OWLS.map(o => <option key={o.id} value={o.id}>{o.name} ({RARITY[o.r][0]})</option>)}</select><button className="ow-btn" onClick={adminOwl}>Give owl</button></div>
      <button className="ow-btn ghost sm" onClick={() => { save({ ...n, adm: false }); sfx('pop') }}>Lock admin</button></div></>}

    <h3 className="ow-h">📖 Owldex <small>({found}/{OWLS.length})</small></h3>
    <div className="ow-dex">{OWLS.map((s, i) => { const k = sk(s); return <button key={s.id} className={'ow-slot' + (k ? ' got' : '') + (buddy?.id === s.id ? ' buddy' : '')} style={{ ['--rc' as any]: RARITY[s.r][1], animationDelay: i * 25 + 'ms' }} onClick={() => { if (k) { setSel(s); setRename(n.pets[s.id]?.name || '') } }} aria-label={k ? s.name : 'Undiscovered owl'}>
      <OwlArt sp={k ? s : null} size={64} still /><span className="ow-nm">{k ? petName(n, s) : '???'}</span><span className="ow-rar" style={{ color: RARITY[s.r][1] }}>{RARITY[s.r][0]}</span>{k > 1 && <span className="ow-lv">★{Math.min(k, 6)}</span>}</button> })}</div>

    {sel && <div className="ow-ov" onClick={() => setSel(null)}><div className="ow-modal" role="dialog" aria-modal="true" aria-label={sel.name} onClick={e => e.stopPropagation()} style={{ ['--rc' as any]: RARITY[sel.r][1] }}>
      <div className="ow-pet" key={hearts}><OwlArt sp={sel} size={140} />{hearts > 0 && <span className="ow-hearts" aria-hidden>💗💛💗</span>}</div>
      {say && <div className="ow-say" role="status">{say}</div>}
      <h3>{petName(n, sel)}</h3><span className={'ow-tag' + tagC(sel.r)} style={tagS(sel.r)}>{RARITY[sel.r][0]} · {sel.name}</span>
      <p className="ow-note">{mood(n, sel.id)[0]} {mood(n, sel.id)[1]} · Level ★{Math.min(n.owls[sel.id], 6)}{n.owls[sel.id] > 1 ? ` (found ${n.owls[sel.id]}×)` : ''}</p>
      <div className="ow-bond" aria-label={`Bond ${n.pets[sel.id]?.bond || 0} of 10`}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < (n.pets[sel.id]?.bond || 0) ? 'on' : ''} />)}</div><small className="ow-note">Bond grows when you care for it each day. A stronger bond boosts its ability.</small>
      <div className="ow-abox"><b>⚡ {sel.ab.name}</b><ul>{abil(sel, power(n, sel.id))}</ul></div>
      <div className="ow-row"><button className="ow-btn sm" onClick={() => care(sel, 'pet')} disabled={n.pets[sel.id]?.petDay === today()}>{n.pets[sel.id]?.petDay === today() ? '🤲 Petted today' : '🤲 Pet'}</button>
        <button className="ow-btn sm" onClick={() => care(sel, 'feed')} disabled={n.pets[sel.id]?.feedDay === today()}>{n.pets[sel.id]?.feedDay === today() ? '🍖 Fed today' : '🍖 Treat · 🪙 2'}</button></div>
      <form className="ow-row" onSubmit={e => { e.preventDefault(); const p = n.pets[sel.id] || { name: '', bond: 0, petDay: '', feedDay: '' }; save({ ...n, pets: { ...n.pets, [sel.id]: { ...p, name: rename.trim().slice(0, 16) } } }); sfx('good') }}>
        <input value={rename} onChange={e => setRename(e.target.value)} maxLength={16} placeholder="Give it a name" aria-label="Pet name" className="ow-in" /><button className="ow-btn ghost sm">Save name</button></form>
      <p className="ow-fact">{sel.fact}</p>
      <div className="ow-row"><button className="ow-btn" onClick={() => { save({ ...n, buddy: sel.id }); setSel(null); sfx('good'); api.say(`${petName(n, sel)} is your study buddy now!`, 'cheer') }} disabled={buddy?.id === sel.id}>{buddy?.id === sel.id ? '⭐ Current buddy' : 'Make my buddy'}</button><button className="ow-btn ghost" onClick={() => setSel(null)}>Close</button></div></div></div>}

    {hatch && <div className={'ow-ov hatch s' + stage} role="dialog" aria-modal="true" aria-label="Hatching" style={{ ['--rc' as any]: RARITY[hatch.sp.r][1] }} onClick={() => stage >= 3 && close()}>
      {stage < 3 ? <div className="ow-stage"><EggArt t={hatch.t} size={150} crack={stage} wobble /><p>{stage === 0 ? 'Something is moving inside…' : stage === 1 ? 'It is cracking!' : '💥'}</p></div>
        : <div className="ow-reveal"><div className="ow-rays" aria-hidden /><OwlArt sp={hatch.sp} size={190} /><span className={'ow-tag big' + tagC(hatch.sp.r)} style={tagS(hatch.sp.r)}>{RARITY[hatch.sp.r][0]}</span><h2>{hatch.sp.name}</h2>
          <p>{hatch.dup ? `Duplicate! Level ★${Math.min(hatch.stars, 6)} and ${hatch.refund} coins back.` : '✨ New owl added to your Owldex!'}</p><div className="ow-abox"><b>⚡ {hatch.sp.ab.name}</b><ul>{abil(hatch.sp, 1)}</ul></div><button className="ow-btn" onClick={close}>Awesome!</button></div>}</div>}
  </section>
}
