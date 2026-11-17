// Owl data, abilities and pet care. Saved in this browser (key "nest"). Abilities only ever add bonuses, nothing is taken away.
export type Fx =
  | { k: 'xp'; on: 'any' | 'quiz' | 'exam' | 'cards' | 'session' | 'night'; pct: number }
  | { k: 'double'; chance: number } | { k: 'coins'; chance: number; amt: number } | { k: 'gift'; coins: number }
  | { k: 'warm'; pct: number } | { k: 'luck'; pct: number } | { k: 'discount'; pct: number }
export type Sp = { id: string; name: string; r: number; body: string; belly: string; eye: string; acc: string[]; fact: string; ab: { name: string; fx: Fx[] } }
export const RARITY = [['Common', '#8b95a7'], ['Uncommon', '#3fb950'], ['Rare', '#3b82f6'], ['Epic', '#a855f7'], ['Legendary', '#f5b301'], ['Mythic', '#ff2d75'], ['Transcendent', '#19e3ff']] as const
const o = (id: string, name: string, r: number, body: string, belly: string, eye: string, acc: string[], ab: string, fx: Fx[], fact: string): Sp => ({ id, name, r, body, belly, eye, acc, fact, ab: { name: ab, fx } })
export const OWLS: Sp[] = [
  o('barn', 'Barn Owl', 0, '#d9a35f', '#fff1dc', '#2b2b2b', ['spots'], 'Silent Wings', [{ k: 'xp', on: 'quiz', pct: 12 }], 'Its heart-shaped face funnels sound to its ears, so it can hear a mouse under snow.'),
  o('tawny', 'Tawny Owl', 0, '#9b6b43', '#e8d3b5', '#3a2a1a', [], 'Night Hoot', [{ k: 'xp', on: 'night', pct: 20 }], 'The classic “twit-twoo” is actually two owls calling to each other.'),
  o('verr', "Verreaux's Eagle-Owl", 0, '#7d8590', '#d5d9de', '#3b2f2f', ['tufts', 'lids'], 'Eagle-Owl Eyes', [{ k: 'xp', on: 'exam', pct: 18 }], 'Africa’s giant “milky” owl, with pink eyelids. Seen in Zimbabwe’s bushveld.'),
  o('pearl', 'Pearl-spotted Owlet', 1, '#8a7358', '#f1e9da', '#facc15', ['spots'], 'Daylight Hunter', [{ k: 'xp', on: 'cards', pct: 20 }], 'A tiny owl found in Zimbabwe that hunts in daylight. It has fake “eyes” on the back of its head.'),
  o('little', 'Little Owl', 1, '#b08968', '#f3e5d0', '#f5d142', [], 'Stern Stare', [{ k: 'xp', on: 'session', pct: 25 }], 'Only about 22 cm tall, and famous for its stern, frowning look.'),
  o('scops', 'African Scops Owl', 1, '#8d8d86', '#dcdcd4', '#fcd34d', ['tufts'], 'Branch Stash', [{ k: 'gift', coins: 4 }], 'Sleeps pressed against a branch and looks exactly like a piece of bark.'),
  o('long', 'Long-eared Owl', 1, '#c28a4a', '#f0d9b0', '#f97316', ['tufts'], 'Listening Ears', [{ k: 'xp', on: 'any', pct: 6 }, { k: 'coins', chance: 15, amt: 1 }], 'Its “ears” are just feathers. Its real ears are hidden on the sides of its head.'),
  o('burrow', 'Burrowing Owl', 1, '#c9a66b', '#fffaf0', '#facc15', ['spots'], 'Tunnel Treasure', [{ k: 'coins', chance: 30, amt: 1 }], 'Lives in holes in the ground and bobs its head when it is curious.'),
  o('wood', 'African Wood Owl', 1, '#a0522d', '#f0d9b5', '#2a1a0f', [], 'Dusk Laughter', [{ k: 'warm', pct: 15 }], 'Its hooting duets at dusk sound like people laughing in the forest.'),
  o('spotted', 'Spotted Owl', 2, '#6e5a47', '#e9dcc8', '#1f1a14', ['spots'], 'Old Forest Wisdom', [{ k: 'xp', on: 'any', pct: 10 }], 'Needs old, quiet forests and can live for over 15 years.'),
  o('snowy', 'Snowy Owl', 2, '#f4f7fb', '#ffffff', '#fbbf24', ['spots', 'snow'], 'Snowflake Focus', [{ k: 'xp', on: 'session', pct: 35 }], 'Flies silently over the Arctic and can see a lemming from far away.'),
  o('grey', 'Great Grey Owl', 2, '#8e98a3', '#d6dbe0', '#fde047', ['rings'], 'Egg Whisperer', [{ k: 'discount', pct: 15 }], 'Huge face discs act like satellite dishes. It can hear prey under 30 cm of snow.'),
  o('pel', "Pel's Fishing Owl", 2, '#d17b32', '#f2c88f', '#111827', ['lids'], 'Fisher’s Catch', [{ k: 'gift', coins: 10 }], 'A rare giant orange owl that catches fish along African rivers at night.'),
  o('elf', 'Elf Owl', 2, '#b5a48a', '#efe6d6', '#fde047', ['cap'], 'Tiny but Mighty', [{ k: 'warm', pct: 25 }], 'The smallest owl in the world, no bigger than a sparrow.'),
  o('galaxy', 'Galaxy Owl', 3, '#2b2a6b', '#5b4fd1', '#ffe66d', ['stars'], 'Star Collector', [{ k: 'xp', on: 'any', pct: 15 }, { k: 'coins', chance: 20, amt: 2 }], 'Hoots in the night and a new star appears in its feathers every time it learns something.'),
  o('storm', 'Storm Owl', 3, '#3b4a63', '#8aa4c8', '#7dd3fc', ['bolt'], 'Lightning Strike', [{ k: 'double', chance: 20 }], 'Rides thunderclouds. Its wingbeats sound like distant thunder.'),
  o('ember', 'Ember Owl', 3, '#c2410c', '#fdba74', '#fde047', ['flame'], 'Exam Fire', [{ k: 'xp', on: 'quiz', pct: 25 }, { k: 'xp', on: 'exam', pct: 25 }], 'Warms a whole classroom just by sitting on a desk. Loves exam season.'),
  o('frost', 'Frost Owl', 3, '#7dd3fc', '#e0f7ff', '#1e3a8a', ['snow'], 'Frozen Fortune', [{ k: 'luck', pct: 25 }, { k: 'discount', pct: 8 }], 'Keeps a calm, cool head even when the test is hard.'),
  o('gold', 'Golden Scholar', 4, '#f5b301', '#fff3b0', '#7c2d12', ['cap', 'halo', 'tufts'], 'Golden Scholar', [{ k: 'xp', on: 'any', pct: 25 }, { k: 'gift', coins: 8 }], 'Graduated top of every class in the forest. Only the most dedicated students hatch this one.'),
  o('cosmic', 'Cosmic Professor', 4, '#1a1040', '#7c3aed', '#f0abfc', ['glasses', 'stars', 'halo'], 'Cosmic Mind', [{ k: 'xp', on: 'any', pct: 20 }, { k: 'double', chance: 15 }, { k: 'luck', pct: 20 }], 'Has read every book in the universe, twice. Knows the answer before you ask.'),
  o('phoenix', 'Phoenix Owl', 5, '#e11d48', '#fbbf24', '#fff7ae', ['flame', 'halo', 'tufts'], 'Rebirth Flames', [{ k: 'xp', on: 'any', pct: 35 }, { k: 'double', chance: 25 }], 'Burns out after every exam and rises again from its own ashes, smarter each time.'),
  o('void', 'Eclipse Owl', 5, '#0b0720', '#4c1d95', '#ff2d75', ['stars', 'tufts'], 'Total Eclipse', [{ k: 'xp', on: 'any', pct: 30 }, { k: 'coins', chance: 40, amt: 3 }, { k: 'discount', pct: 15 }], 'Appears only when the sun and moon line up. Its feathers swallow light and hide a galaxy of secrets.'),
  o('dragon', 'Dragon Owl', 5, '#047857', '#6ee7b7', '#fde047', ['tufts', 'bolt'], 'Dragon Hoard', [{ k: 'gift', coins: 30 }, { k: 'coins', chance: 35, amt: 3 }, { k: 'xp', on: 'exam', pct: 30 }], 'Half owl, half dragon, and it hoards coins instead of gold. Guards the Owldex.'),
  o('celestial', 'Celestial Archon', 6, '#fdf4ff', '#a5f3fc', '#7c3aed', ['halo', 'stars', 'glasses', 'tufts'], 'Ascension', [{ k: 'xp', on: 'any', pct: 60 }, { k: 'double', chance: 35 }, { k: 'luck', pct: 40 }, { k: 'gift', coins: 40 }], 'Lives above the clouds and teaches the stars to shine. Almost no student ever meets one.'),
  o('tuff', 'Too Tuff Owl', 6, '#111827', '#fb7185', '#fde047', ['glasses', 'cap', 'flame', 'halo'], 'Too Tuff to Fail', [{ k: 'xp', on: 'any', pct: 50 }, { k: 'double', chance: 40 }, { k: 'coins', chance: 50, amt: 5 }, { k: 'discount', pct: 25 }], 'Wears shades indoors, never studies the night before, and still gets the top mark. Too tuff.'),
]
export type Pet = { name: string; bond: number; petDay: string; feedDay: string }
export type Nest = { owls: Record<string, number>; egg: { start: number } | null; buddy: string; hatched: number; pity: number; pets: Record<string, Pet>; gift: string; codes: string[] }
export const NEST_DEF: Nest = { owls: {}, egg: null, buddy: '', hatched: 0, pity: 0, pets: {}, gift: '', codes: [] }
export const loadNest = (): Nest => { try { return { ...NEST_DEF, ...JSON.parse(localStorage.getItem('wob:nest') || '{}') } } catch { return { ...NEST_DEF } } }
export const saveNest = (n: Nest) => { try { localStorage.setItem('wob:nest', JSON.stringify(n)) } catch {} }
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }

/** How strong an owl's ability is: grows with duplicates (levels) and with daily care (bond). 1.0 to about 2.1. */
export const power = (n: Nest, id: string) => 1 + 0.12 * Math.min(5, Math.max(0, (n.owls[id] || 1) - 1)) + 0.05 * Math.min(10, n.pets[id]?.bond || 0)
export const buddyOf = (n: Nest) => OWLS.find(x => x.id === n.buddy && n.owls[x.id]) || OWLS.find(x => n.owls[x.id]) || null
export const petName = (n: Nest, s: Sp) => n.pets[s.id]?.name || s.name
export function describe(f: Fx, p = 1): string {
  const r = (v: number) => Math.round(v * p)
  switch (f.k) {
    case 'xp': return `+${r(f.pct)}% XP ${({ any: 'on everything you study', quiz: 'from quizzes', exam: 'from exam questions', cards: 'from flashcards', session: 'from focus sessions', night: 'when you study after 6 pm' })[f.on]}`
    case 'double': return `${Math.min(60, r(f.chance))}% chance to DOUBLE the XP of any study move`
    case 'coins': return `${Math.min(80, r(f.chance))}% chance to dig up ${f.amt} bonus coin${f.amt > 1 ? 's' : ''} after studying`
    case 'gift': return `Brings you ${r(f.coins)} coins once a day`
    case 'warm': return `Your Study Egg hatches ${Math.min(60, r(f.pct))}% sooner`
    case 'luck': return `${Math.min(70, r(f.pct))}% luck: a second chance at a rarer owl when you hatch`
    case 'discount': return `Eggs in the shop cost ${Math.min(40, r(f.pct))}% less`
  }
}
export function fxOf(n: Nest) { const b = buddyOf(n); return b ? { b, p: power(n, b.id), fx: b.ab.fx } : null }

/** Extra XP and coins from the buddy owl for one study event. */
export function buddyBonus(ev: { k: string }, baseXp: number): { xp: number; coins: number; who: string } | null {
  const n = loadNest(), f = fxOf(n); if (!f || ev.k === 'bonus') return null
  let xp = 0, coins = 0; const h = new Date().getHours()
  for (const x of f.fx) {
    if (x.k === 'xp' && (x.on === 'any' || x.on === ev.k || (x.on === 'night' && (h >= 18 || h < 5)))) xp += Math.round(baseXp * (x.pct * f.p) / 100)
    else if (x.k === 'double' && baseXp > 0 && Math.random() * 100 < Math.min(60, x.chance * f.p)) xp += baseXp
    else if (x.k === 'coins' && Math.random() * 100 < Math.min(80, x.chance * f.p)) coins += Math.max(1, Math.round(x.amt * f.p))
  }
  return xp || coins ? { xp, coins, who: petName(n, f.b) } : null
}

/** Secret codes. Only a fingerprint (SHA-256) of each code is stored here, so reading the source does not reveal them. Each works once per device. */
export const CODES: Record<string, { coins: number; msg: string }> = {
  'e21a5f2a2a302d5f3a9442985609b730a97646b297487a45fdaa94a740b1908b': { coins: 10000, msg: 'TOO TUFF! 10,000 coins!' },
  'd44aa1503dc23ead64e68996d0b1bb223b75f671218f7358fd2ab772913ab883': { coins: 500, msg: 'A wise choice! 500 coins!' },
  '065912e1fe1a07c6ae89a6173f0202b0fcfce5f04699b20023a06f64d1df53d9': { coins: 250, msg: 'Hoot hoot! 250 coins!' },
}
export async function codeHash(c: string): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('wob-owl-code:' + c.trim().toLowerCase()))
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('')
}
