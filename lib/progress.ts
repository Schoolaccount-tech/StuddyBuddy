// XP, levels, badges, streak, quests, heatmap data. Saved in the student's own browser.
export const GOAL = 3
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
export const epochDay = () => Math.floor(Date.now() / 864e5)

export type Box = { front: string; back: string; subj: string; box: number; due: number }
export type Miss = { q: string; options: string[]; answer: number; explain: string; subj: string }
export type Quest = { id: string; n: number; done: boolean }
export type Prog = {
  xp: number; quizzes: number; perfect: number; cards: number; sessions: number; tasks: number; asked: number; bestCombo: number; exams: number; blitz: number
  streak: { n: number; last: string }; goal: { d: string; n: number }; today: { d: string; sessions: number }
  mastery: Record<string, { right: number; total: number }>; badges: string[]
  act: Record<string, number>; mins: Record<string, number>; nick: string; quests: { d: string; items: Quest[] }; spin: string; box: Box[]; miss: Miss[]
}
export const DEFAULT: Prog = {
  xp: 0, quizzes: 0, perfect: 0, cards: 0, sessions: 0, tasks: 0, asked: 0, bestCombo: 0, exams: 0, blitz: 0,
  streak: { n: 0, last: '' }, goal: { d: '', n: 0 }, today: { d: '', sessions: 0 }, mastery: {}, badges: [],
  act: {}, mins: {}, nick: '', quests: { d: '', items: [] }, spin: '', box: [], miss: [],
}
export const LEVELS = [
  { n: 'Egg', xp: 0, e: '🥚', hat: '' }, { n: 'Hatchling', xp: 50, e: '🐣', hat: '🎀' }, { n: 'Fledgling', xp: 150, e: '🐥', hat: '🧢' },
  { n: 'Night Owl', xp: 300, e: '🦉', hat: '🎩' }, { n: 'Scholar Owl', xp: 600, e: '🎓', hat: '🎓' }, { n: 'Wise Owl', xp: 1000, e: '👑', hat: '👑' }, { n: 'Grand Owl', xp: 2000, e: '🌟', hat: '🌟' },
]
export const levelOf = (xp: number) => LEVELS.reduce((a, l, i) => (xp >= l.xp ? i : a), 0)
const totalMins = (p: Prog) => Object.values(p.mins).reduce((a, b) => a + b, 0)

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
  { id: 'lv5', e: '👑', name: 'Wise Owl Rank', desc: 'Reach level Wise Owl', ok: p => levelOf(p.xp) >= 5 },
  { id: 'exam', e: '🎯', name: 'Exam Ready', desc: 'Mark an exam question', ok: p => p.exams >= 1 },
  { id: 'blitz', e: '⚡', name: 'Formula Whiz', desc: 'Play Formula Blitz 3 times', ok: p => p.blitz >= 3 },
  { id: 'mara', e: '🏃', name: 'Marathon', desc: 'Focus for 300 minutes in total', ok: p => totalMins(p) >= 300 },
]

export const QUESTS: { id: string; t: string; need: number; ev: string; xp: number }[] = [
  { id: 'quiz', t: 'Finish a quiz', need: 1, ev: 'quiz', xp: 20 },
  { id: 'cards', t: 'Finish a flashcard set', need: 1, ev: 'cards', xp: 15 },
  { id: 'focus', t: 'Complete a focus session', need: 1, ev: 'session', xp: 25 },
  { id: 'ask', t: 'Ask Buddy 3 questions', need: 3, ev: 'ask', xp: 15 },
  { id: 'task', t: 'Tick off 2 planner tasks', need: 2, ev: 'task', xp: 15 },
  { id: 'exam', t: 'Mark an exam question', need: 1, ev: 'exam', xp: 25 },
  { id: 'blitz', t: 'Play Formula Blitz', need: 1, ev: 'blitz', xp: 15 },
]
function pickQuests(): Quest[] {
  const seed = epochDay(), out: Quest[] = []
  for (let i = 0; out.length < 3; i++) { const q = QUESTS[(seed * 5 + i * 3) % QUESTS.length]; if (!out.find(o => o.id === q.id)) out.push({ id: q.id, n: 0, done: false }) }
  return out
}

export type Ev =
  | { k: 'quiz'; subject: string; right: number; total: number; combo: number }
  | { k: 'cards'; known: number; total: number } | { k: 'session'; min: number } | { k: 'ask' } | { k: 'task' }
  | { k: 'exam'; awarded: number; marks: number } | { k: 'blitz'; score: number } | { k: 'bonus'; xp: number }

export function apply(prev: Prog, ev: Ev) {
  const p: Prog = JSON.parse(JSON.stringify(prev)); const t = dayKey()
  let xp = 0, counts = true
  if (ev.k === 'quiz') {
    const full = ev.total > 0 && ev.right === ev.total
    xp = ev.right * 10 + (full ? 20 : 0); p.quizzes++; if (full) p.perfect++; p.bestCombo = Math.max(p.bestCombo, ev.combo)
    const m = p.mastery[ev.subject] ?? { right: 0, total: 0 }; m.right += ev.right; m.total += ev.total; p.mastery[ev.subject] = m
  } else if (ev.k === 'cards') { xp = ev.known * 3 + 10; p.cards++ }
  else if (ev.k === 'session') { xp = Math.max(10, Math.round(ev.min)); p.sessions++; p.today = { d: t, sessions: (p.today.d === t ? p.today.sessions : 0) + 1 }; p.mins[t] = (p.mins[t] ?? 0) + ev.min }
  else if (ev.k === 'ask') { xp = 2; p.asked++; counts = false }
  else if (ev.k === 'task') { xp = 5; p.tasks++ }
  else if (ev.k === 'exam') { xp = ev.awarded * 4 + 10; p.exams++ }
  else if (ev.k === 'blitz') { xp = ev.score * 3; p.blitz++ }
  else { xp = ev.xp; counts = false }
  if (ev.k !== 'bonus' && ev.k !== 'ask') p.act[t] = (p.act[t] ?? 0) + 1

  if (p.quests.d !== t) p.quests = { d: t, items: pickQuests() }
  const questsDone: typeof QUESTS = []
  for (const it of p.quests.items) {
    const def = QUESTS.find(q => q.id === it.id); if (!def || it.done || def.ev !== ev.k) continue
    it.n++; if (it.n >= def.need) { it.done = true; xp += def.xp; questsDone.push(def) }
  }

  const before = levelOf(prev.xp); p.xp += xp; const after = levelOf(p.xp)
  let milestone = 0
  if (ev.k !== 'bonus' && p.streak.last !== t) {
    const y = new Date(); y.setDate(y.getDate() - 1)
    p.streak = { n: p.streak.last === dayKey(y) ? p.streak.n + 1 : 1, last: t }
    if ([3, 7, 14, 30, 60, 100].includes(p.streak.n)) milestone = p.streak.n
  }
  let goalHit = false
  if (p.goal.d !== t) p.goal = { d: t, n: 0 }
  if (counts) { p.goal.n++; if (p.goal.n === GOAL) goalHit = true }
  const have = new Set(p.badges); const newB = BADGES.filter(b => !have.has(b.id) && b.ok(p)); p.badges = [...p.badges, ...newB.map(b => b.id)]
  return { p, xp, leveled: after > before ? after : -1, newB, goalHit, milestone, questsDone }
}

export const liveStreak = (p: Prog) => { const y = new Date(); y.setDate(y.getDate() - 1); return p.streak.last === dayKey() || p.streak.last === dayKey(y) ? p.streak.n : 0 }
export function load(): Prog {
  try { const v = localStorage.getItem('wob:prog'); const o = v ? { ...DEFAULT, ...JSON.parse(v) } : { ...DEFAULT }; if (o.quests.d !== dayKey()) o.quests = { d: dayKey(), items: pickQuests() }; return o } catch { return { ...DEFAULT } }
}
export const fresh = (): Prog => ({ ...DEFAULT, quests: { d: dayKey(), items: pickQuests() } })
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
