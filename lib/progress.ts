// XP, levels, badges, streak, daily goal and subject mastery. Saved in the student's own browser.
export const GOAL = 3
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

export type Prog = {
  xp: number; quizzes: number; perfect: number; cards: number; sessions: number; tasks: number; asked: number; bestCombo: number
  streak: { n: number; last: string }; goal: { d: string; n: number }; today: { d: string; sessions: number }
  mastery: Record<string, { right: number; total: number }>; badges: string[]
}
export const DEFAULT: Prog = {
  xp: 0, quizzes: 0, perfect: 0, cards: 0, sessions: 0, tasks: 0, asked: 0, bestCombo: 0,
  streak: { n: 0, last: '' }, goal: { d: '', n: 0 }, today: { d: '', sessions: 0 }, mastery: {}, badges: [],
}
export const LEVELS = [
  { n: 'Egg', xp: 0, e: '🥚' }, { n: 'Hatchling', xp: 50, e: '🐣' }, { n: 'Fledgling', xp: 150, e: '🐥' },
  { n: 'Night Owl', xp: 300, e: '🦉' }, { n: 'Scholar Owl', xp: 600, e: '🎓' }, { n: 'Wise Owl', xp: 1000, e: '👑' }, { n: 'Grand Owl', xp: 2000, e: '🌟' },
]
export const levelOf = (xp: number) => LEVELS.reduce((a, l, i) => (xp >= l.xp ? i : a), 0)

export const BADGES: { id: string; e: string; name: string; desc: string; ok: (p: Prog) => boolean }[] = [
  { id: 'first', e: '🚀', name: 'First Steps', desc: 'Finish your first quiz', ok: p => p.quizzes >= 1 },
  { id: 'perfect', e: '💯', name: 'Flawless', desc: 'Score full marks in a quiz', ok: p => p.perfect >= 1 },
  { id: 'q5', e: '🧠', name: 'Quiz Master', desc: 'Finish 5 quizzes', ok: p => p.quizzes >= 5 },
  { id: 'cards', e: '🃏', name: 'Card Shark', desc: 'Finish 3 flashcard sets', ok: p => p.cards >= 3 },
  { id: 's1', e: '⏱️', name: 'Focus Starter', desc: 'Finish a focus session', ok: p => p.sessions >= 1 },
  { id: 's10', e: '🧘', name: 'Deep Worker', desc: 'Finish 10 focus sessions', ok: p => p.sessions >= 10 },
  { id: 'st3', e: '🔥', name: 'On Fire', desc: 'Reach a 3-day streak', ok: p => p.streak.n >= 3 },
  { id: 'st7', e: '☄️', name: 'Unstoppable', desc: 'Reach a 7-day streak', ok: p => p.streak.n >= 7 },
  { id: 'combo', e: '⚡', name: 'Combo King', desc: 'Get 5 right in a row', ok: p => p.bestCombo >= 5 },
  { id: 'ask', e: '❓', name: 'Curious Owl', desc: 'Ask Buddy 5 questions', ok: p => p.asked >= 5 },
  { id: 'plan', e: '📝', name: 'Planner Pro', desc: 'Tick off 5 tasks', ok: p => p.tasks >= 5 },
  { id: 'all', e: '🌍', name: 'All-Rounder', desc: 'Practise 3 different subjects', ok: p => Object.keys(p.mastery).length >= 3 },
  { id: 'lv3', e: '🦉', name: 'Night Owl Rank', desc: 'Reach level Night Owl', ok: p => levelOf(p.xp) >= 3 },
]

export type Ev =
  | { k: 'quiz'; subject: string; right: number; total: number; combo: number }
  | { k: 'cards'; known: number; total: number } | { k: 'session' } | { k: 'ask' } | { k: 'task' }

export function apply(prev: Prog, ev: Ev) {
  const p: Prog = JSON.parse(JSON.stringify(prev)); const t = dayKey()
  let xp = 0, counts = true
  if (ev.k === 'quiz') {
    const full = ev.total > 0 && ev.right === ev.total
    xp = ev.right * 10 + (full ? 20 : 0); p.quizzes++; if (full) p.perfect++; p.bestCombo = Math.max(p.bestCombo, ev.combo)
    const m = p.mastery[ev.subject] ?? { right: 0, total: 0 }; m.right += ev.right; m.total += ev.total; p.mastery[ev.subject] = m
  } else if (ev.k === 'cards') { xp = ev.known * 3 + 10; p.cards++ }
  else if (ev.k === 'session') { xp = 25; p.sessions++; p.today = { d: t, sessions: (p.today.d === t ? p.today.sessions : 0) + 1 } }
  else if (ev.k === 'ask') { xp = 2; p.asked++; counts = false }
  else { xp = 5; p.tasks++ }

  const before = levelOf(prev.xp); p.xp += xp; const after = levelOf(p.xp)
  let milestone = 0
  if (p.streak.last !== t) {
    const y = new Date(); y.setDate(y.getDate() - 1)
    p.streak = { n: p.streak.last === dayKey(y) ? p.streak.n + 1 : 1, last: t }
    if ([3, 7, 14, 30, 60, 100].includes(p.streak.n)) milestone = p.streak.n
  }
  let goalHit = false
  if (p.goal.d !== t) p.goal = { d: t, n: 0 }
  if (counts) { p.goal.n++; if (p.goal.n === GOAL) goalHit = true }
  const have = new Set(p.badges); const newB = BADGES.filter(b => !have.has(b.id) && b.ok(p)); p.badges = [...p.badges, ...newB.map(b => b.id)]
  return { p, xp, leveled: after > before ? after : -1, newB, goalHit, milestone }
}

export const liveStreak = (p: Prog) => { const y = new Date(); y.setDate(y.getDate() - 1); return p.streak.last === dayKey() || p.streak.last === dayKey(y) ? p.streak.n : 0 }
export function load(): Prog { try { const v = localStorage.getItem('wob:prog'); return v ? { ...DEFAULT, ...JSON.parse(v) } : DEFAULT } catch { return DEFAULT } }
export function save(p: Prog) { try { localStorage.setItem('wob:prog', JSON.stringify(p)) } catch {} }

export const TIPS = [
  'Test yourself before you reread. Pulling answers out of your head beats highlighting.',
  'Study in short bursts. 25 focused minutes beat 2 distracted hours.',
  'Explain a topic out loud as if teaching a friend. Gaps show up fast.',
  'Do past papers under timed conditions at least once a week.',
  'Sleep is revision. Memory is stored while you rest.',
  'Start with your weakest topic while your brain is fresh.',
  'Mix subjects in one evening. Switching helps you remember more.',
  'Write the mark scheme words down. Examiners reward key terms.',
  'Review yesterday’s notes for 5 minutes before starting new work.',
  'Drink water and take a walk between sessions.',
  'Turn every wrong answer into a flashcard.',
  'Plan tomorrow tonight. A plan removes the hardest part: starting.',
]
