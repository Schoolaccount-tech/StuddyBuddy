import { GOAL } from './progress'
// Owl data, abilities and pet care. Saved in this browser (key "nest"). Abilities only ever add bonuses, nothing is taken away.
export type Fx =
  | { k: 'xp'; on: 'any' | 'quiz' | 'exam' | 'cards' | 'session' | 'night'; pct: number }
  | { k: 'double'; chance: number } | { k: 'coins'; chance: number; amt: number } | { k: 'gift'; coins: number }
  | { k: 'warm'; pct: number } | { k: 'luck'; pct: number } | { k: 'discount'; pct: number }
  | { k: 'perfect'; pct: number } | { k: 'rescue'; xp: number } | { k: 'floor'; xp: number } | { k: 'big'; pct: number }
  | { k: 'time'; when: 'dawn' | 'weekend' | 'late'; pct: number } | { k: 'nth'; n: number; pct: number } | { k: 'loyal'; per: number; max: number }
  | { k: 'rebate'; chance: number } | { k: 'twin'; chance: number } | { k: 'interest'; pct: number; cap: number } | { k: 'tender' }
  | { k: 'rapid'; pct: number; mins: number } | { k: 'comeback'; pct: number } | { k: 'crit'; chance: number; mult: number } | { k: 'focus'; pct: number }
  | { k: 'variety'; pct: number } | { k: 'marathon'; pct: number } | { k: 'piggy'; coins: number } | { k: 'tenth'; coins: number } | { k: 'goal'; coins: number; xp: number }
  | { k: 'combo'; pct: number } | { k: 'tasks'; xp: number } | { k: 'curious'; pct: number } | { k: 'refund'; pct: number } | { k: 'fate'; n: number } | { k: 'haul'; coins: number }
  | { k: 'bounty'; pct: number } | { k: 'second'; pct: number } | { k: 'echo'; pct: number } | { k: 'prism'; coins: number } | { k: 'collector'; per: number; max: number }
  | { k: 'chain'; per: number; max: number } | { k: 'first'; xp: number } | { k: 'jackpot'; chance: number; coins: number }
export type Sp = { id: string; name: string; r: number; body: string; belly: string; eye: string; acc: string[]; fact: string; ab: { name: string; fx: Fx[] } }
export const RARITY = [['Common', '#8b95a7'], ['Uncommon', '#3fb950'], ['Rare', '#3b82f6'], ['Epic', '#a855f7'], ['Legendary', '#f5b301'], ['Mythic', '#ff2d75'], ['Transcendent', '#19e3ff'], ['Godly', '#ff8a00'], ['Divine', '#ffe9a0'], ['Ascendant', '#6366f1'], ['Unreal', '#22ff99'], ['Sovereign', '#ff0033']] as const
const o = (id: string, name: string, r: number, body: string, belly: string, eye: string, acc: string[], ab: string, fx: Fx[], fact: string): Sp => ({ id, name, r, body, belly, eye, acc, fact, ab: { name: ab, fx } })
export const OWLS: Sp[] = [
  o('barn', 'Barn Owl', 0, '#d9a35f', '#fff1dc', '#2b2b2b', ['spots'], 'Silent Precision', [{ k: 'perfect', pct: 40 }, { k: 'curious', pct: 15 }], 'Its heart-shaped face funnels sound to its ears, so it can hear a mouse under snow.'),
  o('tawny', 'Tawny Owl', 0, '#9b6b43', '#e8d3b5', '#3a2a1a', [], 'Night Hoot', [{ k: 'time', when: 'late', pct: 25 }], 'The classic “twit-twoo” is actually two owls calling to each other.'),
  o('verr', "Verreaux's Eagle-Owl", 0, '#7d8590', '#d5d9de', '#3b2f2f', ['tufts', 'lids'], 'Eagle-Owl Eyes', [{ k: 'xp', on: 'exam', pct: 18 }], 'Africa’s giant “milky” owl, with pink eyelids. Seen in Zimbabwe’s bushveld.'),
  o('pearl', 'Pearl-spotted Owlet', 1, '#8a7358', '#f1e9da', '#facc15', ['spots'], 'Daylight Hunter', [{ k: 'time', when: 'dawn', pct: 35 }], 'A tiny owl found in Zimbabwe that hunts in daylight. It has fake “eyes” on the back of its head.'),
  o('little', 'Little Owl', 1, '#b08968', '#f3e5d0', '#f5d142', [], 'Stern Stare', [{ k: 'xp', on: 'session', pct: 25 }, { k: 'focus', pct: 30 }], 'Only about 22 cm tall, and famous for its stern, frowning look.'),
  o('scops', 'African Scops Owl', 1, '#8d8d86', '#dcdcd4', '#fcd34d', ['tufts'], 'Branch Stash', [{ k: 'gift', coins: 4 }, { k: 'piggy', coins: 1 }], 'Sleeps pressed against a branch and looks exactly like a piece of bark.'),
  o('long', 'Long-eared Owl', 1, '#c28a4a', '#f0d9b0', '#f97316', ['tufts'], 'Never Empty-Handed', [{ k: 'rescue', xp: 8 }, { k: 'second', pct: 20 }], 'Its “ears” are just feathers. Its real ears are hidden on the sides of its head.'),
  o('burrow', 'Burrowing Owl', 1, '#c9a66b', '#fffaf0', '#facc15', ['spots'], 'Tunnel Treasure', [{ k: 'coins', chance: 30, amt: 1 }, { k: 'tenth', coins: 8 }], 'Lives in holes in the ground and bobs its head when it is curious.'),
  o('wood', 'African Wood Owl', 1, '#a0522d', '#f0d9b5', '#2a1a0f', [], 'Dusk Laughter', [{ k: 'warm', pct: 15 }, { k: 'haul', coins: 2 }], 'Its hooting duets at dusk sound like people laughing in the forest.'),
  o('spotted', 'Spotted Owl', 2, '#6e5a47', '#e9dcc8', '#1f1a14', ['spots'], 'Old Forest Loyalty', [{ k: 'loyal', per: 3, max: 30 }, { k: 'comeback', pct: 25 }], 'Needs old, quiet forests and can live for over 15 years.'),
  o('snowy', 'Snowy Owl', 2, '#f4f7fb', '#ffffff', '#fbbf24', ['spots', 'snow'], 'Snowflake Focus', [{ k: 'xp', on: 'session', pct: 35 }, { k: 'marathon', pct: 40 }], 'Flies silently over the Arctic and can see a lemming from far away.'),
  o('grey', 'Great Grey Owl', 2, '#8e98a3', '#d6dbe0', '#fde047', ['rings'], 'Egg Whisperer', [{ k: 'discount', pct: 15 }, { k: 'fate', n: 1 }], 'Huge face discs act like satellite dishes. It can hear prey under 30 cm of snow.'),
  o('pel', "Pel's Fishing Owl", 2, '#d17b32', '#f2c88f', '#111827', ['lids'], 'Fisher’s Catch', [{ k: 'gift', coins: 10 }, { k: 'curious', pct: 20 }], 'A rare giant orange owl that catches fish along African rivers at night.'),
  o('elf', 'Elf Owl', 2, '#b5a48a', '#efe6d6', '#fde047', ['cap'], 'Tiny but Mighty', [{ k: 'floor', xp: 4 }, { k: 'tasks', xp: 4 }], 'The smallest owl in the world, no bigger than a sparrow.'),
  o('galaxy', 'Galaxy Owl', 3, '#2b2a6b', '#5b4fd1', '#ffe66d', ['stars'], 'Lucky Star', [{ k: 'nth', n: 5, pct: 100 }, { k: 'bounty', pct: 40 }], 'Hoots in the night and a new star appears in its feathers every time it learns something.'),
  o('storm', 'Storm Owl', 3, '#3b4a63', '#8aa4c8', '#7dd3fc', ['bolt'], 'Lightning Strike', [{ k: 'double', chance: 20 }, { k: 'crit', chance: 10, mult: 3 }], 'Rides thunderclouds. Its wingbeats sound like distant thunder.'),
  o('ember', 'Ember Owl', 3, '#c2410c', '#fdba74', '#fde047', ['flame'], 'Flawless Flame', [{ k: 'perfect', pct: 50 }, { k: 'combo', pct: 20 }], 'Warms a whole classroom just by sitting on a desk. Loves exam season.'),
  o('frost', 'Frost Owl', 3, '#7dd3fc', '#e0f7ff', '#1e3a8a', ['snow'], 'Frozen Fortune', [{ k: 'rebate', chance: 15 }, { k: 'luck', pct: 25 }, { k: 'refund', pct: 50 }], 'Keeps a calm, cool head even when the test is hard.'),
  o('gold', 'Golden Scholar', 4, '#f5b301', '#fff3b0', '#7c2d12', ['cap', 'halo', 'tufts'], 'Golden Scholar', [{ k: 'xp', on: 'any', pct: 25 }, { k: 'gift', coins: 8 }, { k: 'collector', per: 1, max: 20 }], 'Graduated top of every class in the forest. Only the most dedicated students hatch this one.'),
  o('cosmic', 'Cosmic Professor', 4, '#1a1040', '#7c3aed', '#f0abfc', ['glasses', 'stars', 'halo'], 'Cosmic Mind', [{ k: 'big', pct: 40 }, { k: 'twin', chance: 15 }, { k: 'luck', pct: 20 }, { k: 'prism', coins: 25 }], 'Has read every book in the universe, twice. Knows the answer before you ask.'),
  o('phoenix', 'Phoenix Owl', 5, '#e11d48', '#fbbf24', '#fff7ae', ['flame', 'halo', 'tufts'], 'Rebirth Flames', [{ k: 'rescue', xp: 30 }, { k: 'double', chance: 25 }, { k: 'second', pct: 40 }], 'Burns out after every exam and rises again from its own ashes, smarter each time.'),
  o('void', 'Eclipse Owl', 5, '#0b0720', '#4c1d95', '#ff2d75', ['stars', 'tufts'], 'Total Eclipse', [{ k: 'time', when: 'late', pct: 60 }, { k: 'coins', chance: 40, amt: 3 }, { k: 'discount', pct: 15 }, { k: 'echo', pct: 30 }], 'Appears only when the sun and moon line up. Its feathers swallow light and hide a galaxy of secrets.'),
  o('dragon', 'Dragon Owl', 5, '#047857', '#6ee7b7', '#fde047', ['tufts', 'bolt'], 'Dragon Hoard', [{ k: 'interest', pct: 5, cap: 150 }, { k: 'gift', coins: 30 }, { k: 'xp', on: 'exam', pct: 30 }, { k: 'haul', coins: 15 }], 'Half owl, half dragon, and it hoards coins instead of gold. Guards the Owldex.'),
  o('celestial', 'Celestial Archon', 6, '#fdf4ff', '#a5f3fc', '#7c3aed', ['halo', 'stars', 'glasses', 'tufts'], 'Ascension', [{ k: 'perfect', pct: 80 }, { k: 'loyal', per: 4, max: 40 }, { k: 'twin', chance: 20 }, { k: 'luck', pct: 40 }, { k: 'fate', n: 3 }], 'Lives above the clouds and teaches the stars to shine. Almost no student ever meets one.'),
  o('tuff', 'Too Tuff Owl', 6, '#111827', '#fb7185', '#fde047', ['glasses', 'cap', 'flame', 'halo'], 'Too Tuff to Fail', [{ k: 'double', chance: 40 }, { k: 'rebate', chance: 25 }, { k: 'rescue', xp: 25 }, { k: 'crit', chance: 15, mult: 4 }], 'Wears shades indoors, never studies the night before, and still gets the top mark. Too tuff.'),
  o('zeus', 'Zeus Owl', 7, '#1e3a8a', '#bfdbfe', '#fde047', ['bolt', 'halo', 'tufts'], 'Thunder Verdict', [{ k: 'nth', n: 3, pct: 100 }, { k: 'jackpot', chance: 8, coins: 40 }, { k: 'rapid', pct: 50, mins: 10 }], 'Judges every answer from a storm cloud. Right answers get a lightning bolt of XP.'),
  o('titan', 'Titan Owl', 7, '#78350f', '#fcd34d', '#ef4444', ['tufts', 'rings', 'flame'], 'Titan Stride', [{ k: 'chain', per: 4, max: 60 }, { k: 'xp', on: 'exam', pct: 40 }, { k: 'gift', coins: 60 }, { k: 'marathon', pct: 60 }], 'Each step is bigger than the last. The more you study in a day, the harder it hits.'),
  o('seraph', 'Seraph Owl', 8, '#fff7ed', '#fde68a', '#38bdf8', ['halo', 'stars', 'tufts'], 'Six Wings', [{ k: 'first', xp: 40 }, { k: 'time', when: 'dawn', pct: 60 }, { k: 'gift', coins: 100 }, { k: 'luck', pct: 50 }, { k: 'comeback', pct: 60 }], 'Six shining wings and a golden halo. It greets your first study of the day with a blessing.'),
  o('oracle', 'Oracle Owl', 8, '#312e81', '#c7d2fe', '#f0abfc', ['glasses', 'stars', 'halo'], 'Foresight', [{ k: 'perfect', pct: 100 }, { k: 'rebate', chance: 30 }, { k: 'discount', pct: 30 }, { k: 'luck', pct: 40 }, { k: 'bounty', pct: 100 }], 'Saw your exam questions coming a week ago. Never says how.'),
  o('nebula', 'Nebula Sage', 9, '#4c1d95', '#f0abfc', '#22d3ee', ['stars', 'glasses', 'cap'], 'Nebula Mind', [{ k: 'big', pct: 50 }, { k: 'jackpot', chance: 10, coins: 120 }, { k: 'first', xp: 60 }, { k: 'warm', pct: 40 }, { k: 'collector', per: 2, max: 50 }], 'Grew inside a cloud of stardust and remembers every star by name.'),
  o('aether', 'Aether Owl', 9, '#0e7490', '#a5f3fc', '#fef08a', ['halo', 'snow', 'tufts'], 'Pure Aether', [{ k: 'chain', per: 6, max: 90 }, { k: 'interest', pct: 8, cap: 500 }, { k: 'twin', chance: 20 }, { k: 'variety', pct: 60 }], 'Made of the fifth element. It floats an inch above the branch and never gets tired.'),
  o('glitch', 'Glitch Owl', 10, '#0a0a0a', '#22ff99', '#ff0066', ['bolt', 'stars', 'tufts'], 'Glitch in the System', [{ k: 'floor', xp: 15 }, { k: 'double', chance: 45 }, { k: 'jackpot', chance: 12, coins: 200 }, { k: 'discount', pct: 40 }, { k: 'echo', pct: 60 }], 'Not supposed to exist. The game keeps trying to delete it and it keeps coming back.'),
  o('mirage', 'Mirage Owl', 10, '#c084fc', '#fef3c7', '#0ea5e9', ['rings', 'stars', 'halo'], 'Double Vision', [{ k: 'twin', chance: 35 }, { k: 'double', chance: 40 }, { k: 'rescue', xp: 40 }, { k: 'coins', chance: 60, amt: 10 }, { k: 'prism', coins: 120 }], 'Is it there? Is it two? Even the Owldex is not sure.'),
  o('emperor', 'Emperor Owl', 11, '#7f1d1d', '#fde68a', '#fef08a', ['cap', 'halo', 'tufts', 'glasses'], 'Imperial Decree', [{ k: 'loyal', per: 8, max: 100 }, { k: 'first', xp: 100 }, { k: 'interest', pct: 10, cap: 2000 }, { k: 'gift', coins: 500 }, { k: 'tender' }, { k: 'goal', coins: 100, xp: 100 }, { k: 'collector', per: 3, max: 100 }], 'Rules every nest from a golden throne. Its first decree: all homework gets done.'),
  o('overlord', 'Overlord Owl', 11, '#020617', '#ff0033', '#ffe600', ['flame', 'halo', 'glasses', 'tufts', 'stars'], 'Rule the Leaderboard', [{ k: 'nth', n: 3, pct: 150 }, { k: 'chain', per: 8, max: 150 }, { k: 'jackpot', chance: 15, coins: 500 }, { k: 'double', chance: 50 }, { k: 'tender' }, { k: 'combo', pct: 100 }, { k: 'second', pct: 80 }], 'The final boss of the Owldex. Nobody has seen one that was not already top of the class.'),
]
export type Pet = { name: string; bond: number; petDay: string; feedDay: string }
export type Offer = { code: string; owl: string; secret: string }
export type Nest = { owls: Record<string, number>; egg: { start: number } | null; buddy: string; hatched: number; pity: number; pets: Record<string, Pet>; gift: string; codes: string[]; adm: boolean; offers: Offer[] }
export const NEST_DEF: Nest = { owls: {}, egg: null, buddy: '', hatched: 0, pity: 0, pets: {}, gift: '', codes: [], adm: false, offers: [] }
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
    case 'perfect': return `+${r(f.pct)}% XP when you get a perfect score (quiz, cards or exam)`
    case 'rescue': return `Bad result? Still get ${r(f.xp)} bonus XP so you never leave empty-handed`
    case 'floor': return `Every study move pays at least ${r(f.xp)} XP`
    case 'big': return `+${r(f.pct)}% XP on big study moves (15 XP or more)`
    case 'time': return `+${r(f.pct)}% XP ${({ dawn: 'when you study before 9 am', weekend: 'on Saturdays and Sundays', late: 'when you study after 6 pm' })[f.when]}`
    case 'nth': return `Every ${f.n}${f.n === 3 ? 'rd' : 'th'} study move today gets +${r(f.pct)}% XP`
    case 'loyal': return `Loyalty: +${r(f.per)}% XP for each day in a row you study, up to +${r(f.max)}%`
    case 'rebate': return `${Math.min(60, r(f.chance))}% chance an egg you buy is FREE (coins refunded)`
    case 'twin': return `${Math.min(50, r(f.chance))}% chance a hatched owl comes as a TWIN (two copies)`
    case 'interest': return `Coin interest: collect ${f.pct}% of your coins daily (up to ${r(f.cap)})`
    case 'tender': return 'Treats are free and every pet or treat gives double bond'
    case 'rapid': return `Two study moves within ${f.mins} minutes? +${r(f.pct)}% XP on the second`
    case 'comeback': return `Back after a day off? Your first move gets +${r(f.pct)}% XP`
    case 'crit': return `${Math.min(40, r(f.chance))}% chance of a CRITICAL HIT: ${f.mult}x XP`
    case 'focus': return `+${r(f.pct)}% XP when you stay on the same subject twice in a row`
    case 'variety': return `+${r(f.pct)}% XP when you switch to a different kind of study move`
    case 'marathon': return `+${r(f.pct)}% XP on focus sessions of 25 minutes or more`
    case 'piggy': return `Drops ${Math.max(1, r(f.coins))} coin${r(f.coins) > 1 ? 's' : ''} into your piggy bank after every study move`
    case 'tenth': return `Every 10th study move today pays ${r(f.coins)} coins`
    case 'goal': return `Hit your daily goal: +${r(f.xp)} XP and ${r(f.coins)} coins`
    case 'combo': return `+${r(f.pct)}% XP on quizzes when you get 3 or more right in a row`
    case 'tasks': return `Planner tasks pay ${r(f.xp)} extra XP`
    case 'curious': return `+${r(f.pct)}% XP when you ask the AI tutor or play a blitz`
    case 'refund': return `Duplicate owls give back ${r(f.pct)}% more coins`
    case 'fate': return `Bad luck protection kicks in ${f.n} hatch${f.n > 1 ? 'es' : ''} sooner`
    case 'haul': return `Every hatch also brings ${r(f.coins)} coins`
    case 'bounty': return `Daily bounty (changes each day): +${r(f.pct)}% XP on the bounty move`
    case 'second': return `Had a bad result? Your next move gets +${r(f.pct)}% XP`
    case 'echo': return `Echo: replays ${r(f.pct)}% of your previous move's XP`
    case 'prism': return `Use 5 different kinds of study move in one day: ${r(f.coins)} coins`
    case 'collector': return `Collector: +${r(f.per)}% XP for every different owl you own, up to +${r(f.max)}%`
    case 'chain': return `Study streak: +${r(f.per)}% XP for each study move today, up to +${r(f.max)}%`
    case 'first': return `Your first study move each day gets +${r(f.xp)} bonus XP`
    case 'jackpot': return `${Math.min(40, r(f.chance))}% chance of a JACKPOT of ${r(f.coins)} coins`
    case 'discount': return `Eggs in the shop cost ${Math.min(40, r(f.pct))}% less`
  }
}
export function fxOf(n: Nest) { const b = buddyOf(n); return b ? { b, p: power(n, b.id), fx: b.ab.fx } : null }

export const bountyToday = () => (['Quiz', 'Flashcards', 'Exam', 'Focus session', 'Ask the AI'] as const)[Math.floor(Date.now() / 864e5) % 5]
/** Extra XP and coins from the buddy owl for one study event. */
export function buddyBonus(ev: any, baseXp: number): { xp: number; coins: number; who: string } | null {
  const n = loadNest(), f = fxOf(n); if (!f || ev.k === 'bonus') return null
  let xp = 0, coins = 0; const h = new Date().getHours()
  let st: any = { d: '', n: 0, days: 0, ts: 0, lk: '', ls: '', kinds: [], jx: false, lx: 0, pz: false }; try { st = { ...st, ...(JSON.parse(localStorage.getItem('wob:chainst') || 'null') || {}) } } catch {}
  const t = today(); let gap = false
  if (st.d !== t) { const y = new Date(Date.now() - 864e5); gap = st.d !== '' && st.d !== `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`; st = { ...st, d: t, n: 0, kinds: [], pz: false, days: st.d === `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}` ? (st.days || 1) + 1 : 1 } }
  const before = st.n, now = Date.now(), owned = Object.values(n.owls).filter(v => v > 0).length, bountyKind = ['quiz', 'cards', 'exam', 'session', 'ask'][Math.floor(now / 864e5) % 5]
  const ratio = ev.k === 'quiz' && ev.total > 0 ? ev.right / ev.total : ev.k === 'cards' && ev.total > 0 ? ev.known / ev.total : ev.k === 'exam' && ev.marks > 0 ? ev.awarded / ev.marks : -1
  const dow = new Date().getDay()
  for (const x of f.fx) {
    if (x.k === 'xp' && (x.on === 'any' || x.on === ev.k || (x.on === 'night' && (h >= 18 || h < 5)))) xp += Math.round(baseXp * (x.pct * f.p) / 100)
    else if (x.k === 'double' && baseXp > 0 && Math.random() * 100 < Math.min(60, x.chance * f.p)) xp += baseXp
    else if (x.k === 'perfect') { if (ratio >= (ev.k === 'exam' ? 0.9 : 1)) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'rescue') { if (ratio >= 0 && ratio < 0.5) xp += Math.round(x.xp * f.p) }
    else if (x.k === 'floor') { if (baseXp > 0) xp += Math.max(0, Math.round(x.xp * f.p) - baseXp) }
    else if (x.k === 'big') { if (baseXp >= 15) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'time') { if ((x.when === 'dawn' && h < 9) || (x.when === 'late' && (h >= 18 || h < 5)) || (x.when === 'weekend' && (dow === 0 || dow === 6))) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'nth') { if ((before + 1) % x.n === 0) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'loyal') xp += Math.round(baseXp * Math.min(x.max * f.p, x.per * f.p * Math.max(0, st.days - 1)) / 100)
    else if (x.k === 'rapid') { if (st.ts && now - st.ts <= x.mins * 60000) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'comeback') { if (gap) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'crit') { if (baseXp > 0 && Math.random() * 100 < Math.min(40, x.chance * f.p)) xp += Math.round(baseXp * (x.mult - 1)) }
    else if (x.k === 'focus') { if (ev.subject && ev.subject === st.ls) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'variety') { if (st.lk && st.lk !== ev.k) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'marathon') { if (ev.k === 'session' && ev.min >= 25) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'piggy') coins += Math.max(1, Math.round(x.coins * f.p))
    else if (x.k === 'tenth') { if ((before + 1) % 10 === 0) coins += Math.round(x.coins * f.p) }
    else if (x.k === 'goal') { if (before + 1 === GOAL) { xp += Math.round(x.xp * f.p); coins += Math.round(x.coins * f.p) } }
    else if (x.k === 'combo') { if (ev.k === 'quiz' && ev.combo >= 3) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'tasks') { if (ev.k === 'task') xp += Math.round(x.xp * f.p) }
    else if (x.k === 'curious') { if (ev.k === 'ask' || ev.k === 'blitz') xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'bounty') { if (ev.k === bountyKind) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'second') { if (st.jx && baseXp > 0) xp += Math.round(baseXp * x.pct * f.p / 100) }
    else if (x.k === 'echo') { if (st.lx > 0) xp += Math.round(st.lx * x.pct * f.p / 100) }
    else if (x.k === 'collector') xp += Math.round(baseXp * Math.min(x.max * f.p, x.per * f.p * owned) / 100)
    else if (x.k === 'chain') xp += Math.round(baseXp * Math.min(x.max * f.p, x.per * f.p * before) / 100)
    else if (x.k === 'first' && before === 0) xp += Math.round(x.xp * f.p)
    else if (x.k === 'jackpot' && Math.random() * 100 < Math.min(40, x.chance * f.p)) coins += Math.round(x.coins * f.p)
    else if (x.k === 'coins' && Math.random() * 100 < Math.min(80, x.chance * f.p)) coins += Math.max(1, Math.round(x.amt * f.p))
  }
  if (!st.kinds.includes(ev.k)) st.kinds = [...st.kinds, ev.k]
  const pr = f.fx.find(x => x.k === 'prism') as any; if (pr && st.kinds.length >= 5 && !st.pz) { coins += Math.round(pr.coins * f.p); st.pz = true }
  try { localStorage.setItem('wob:chainst', JSON.stringify({ ...st, n: st.n + 1, ts: now, lk: ev.k, ls: ev.subject || st.ls, jx: ratio >= 0 && ratio < 0.5, lx: baseXp })) } catch {}
  return xp || coins ? { xp, coins, who: petName(n, f.b) } : null
}

/** Secret codes. Only a fingerprint (SHA-256) of each code is stored here, so reading the source does not reveal them. Each works once per device. */
export const CODES: Record<string, { coins: number; msg: string }> = {
  'e21a5f2a2a302d5f3a9442985609b730a97646b297487a45fdaa94a740b1908b': { coins: 10000, msg: 'TOO TUFF! 10,000 coins!' },
  'd44aa1503dc23ead64e68996d0b1bb223b75f671218f7358fd2ab772913ab883': { coins: 500, msg: 'A wise choice! 500 coins!' },
  '065912e1fe1a07c6ae89a6173f0202b0fcfce5f04699b20023a06f64d1df53d9': { coins: 250, msg: 'Hoot hoot! 250 coins!' },
  'dad9b25d267053e8a8a40efac2b2444f3cbfe227f2271b319d1bc70739fa3fc4': { coins: 300, msg: 'Night owl! 300 coins!' },
  '62ac1eaabea0e38346be612e727f7e9caa7285d84a598d58fb09e8863f424b0d': { coins: 750, msg: 'Golden egg found! 750 coins!' },
  '7b72b18ba68fc98ab01fcd9cbbc401736e4d96c04f06acb3d8321618e737fb85': { coins: 1000, msg: 'Thanks Tavonga! 1,000 coins!' },
  'dc8022de5a72faa9079d7d1bb197b803056adea6e4d74f611470619f497a6655': { coins: 1000, msg: 'Motivation unlocked! 1,000 coins!' },
  'a99cd88935437f509f3f386ce4174c4a89db23114d9ff0deb74ee7a88da431c6': { coins: 600, msg: 'Westgate pride! 600 coins!' },
  '149518a141ac7473d50a860c12bc2326b7eb2c903e7fa880132e4a9fe8796207': { coins: 400, msg: 'IGCSE ready! 400 coins!' },
  'b74052c87553fd032f54e4b47e6c63c07ba4d11f4f78b16d3825d49f695c5a38': { coins: 1500, msg: 'Exam beast mode! 1,500 coins!' },
  'f4f3d74aecb0bd1227c4a17101f71c347bf162d39165f0c6bad1ecd7e761570e': { coins: 2500, msg: 'Feather King! 2,500 coins!' },
  'eea036d13a415e4df335ccf58be4e2436309793411296d73ef2ef9bd2d5c509b': { coins: 5000, msg: 'Mythic vibes! 5,000 coins!' },
  '02b6f34da84f046827cc4de36349d00a2776f1be998abe463bcbecd5bfaca155': { coins: 8000, msg: 'Crown jewel! 8,000 coins!' },
}
export async function codeHash(c: string): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('wob-owl-code:' + c.trim().toLowerCase()))
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('')
}

/** Fingerprint of the admin code. Unlocks the local admin panel in the Nest. */
export const ADMIN_HASH = 'eef98d0d7e2a6121f3683a5806c60fb62679aed85341869c4965df7e4a6980d5'
export async function adminHash(c: string): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('wob-owl-admin:' + c.trim()))
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('')
}

/** One-time coin reset. Bump COIN_EPOCH to reset everyone's coins again (and lock admin mode) the next time they open the app. */
export const COIN_EPOCH = '2'
export function coinReset(xp: number): boolean {
  try {
    if (localStorage.getItem('wob:epoch') === COIN_EPOCH) return false
    const rw = JSON.parse(localStorage.getItem('wob:rw') || '{}'); rw.spent = Math.floor(Math.max(0, xp) / 5); localStorage.setItem('wob:rw', JSON.stringify(rw))
    const n = loadNest(); saveNest({ ...n, adm: false }); localStorage.setItem('wob:epoch', COIN_EPOCH); return true
  } catch { return false }
}
