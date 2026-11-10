// The connected learning loop: every quiz, exam question, scan and tutor chat feeds the same
// topic-mastery table and mistake journal, so the weakness detector and revision plan always have real data.
import { store } from './api'

export type Mistake = { id: string; subj: string; topic: string; type: string; note: string; src: string; at: number; fixed?: boolean; q?: string; a?: string }
export type TM = Record<string, { r: number; t: number; last: number }>
export type Weak = { subj: string; topic: string; pct: number; total: number; open: number; score: number }

export const MISTAKE_TYPES = ['Knowledge gap', 'Careless slip', 'Misread the question', 'Wrong command word', 'Calculation error', 'Ran out of time', 'Not enough detail'] as const

export const topicKey = (subj: string, topic: string) => `${subj}::${(topic || 'General').trim() || 'General'}`
export const getTM = () => store.get<TM>('tm', {})
export const getMistakes = () => store.get<Mistake[]>('err', [])

export function recordTopic(subj: string, topic: string, right: number, total: number) {
  if (total <= 0) return
  const tm = getTM(), k = topicKey(subj, topic), cur = tm[k] ?? { r: 0, t: 0, last: 0 }
  tm[k] = { r: cur.r + right, t: cur.t + total, last: Date.now() }; store.set('tm', tm)
}

export function addMistake(m: Omit<Mistake, 'id' | 'at'>) {
  const all = getMistakes()
  if (m.q && all.some(x => x.q === m.q && !x.fixed)) return
  all.unshift({ ...m, id: Math.random().toString(36).slice(2, 9), at: Date.now() }); store.set('err', all.slice(0, 300))
}

/** Topics where marks are being lost, worst first. Needs at least 2 attempts or 2 open mistakes to say anything. */
export function weakSpots(): Weak[] {
  const tm = getTM(), open = getMistakes().filter(m => !m.fixed), out = new Map<string, Weak>()
  for (const [k, v] of Object.entries(tm)) {
    const [subj, topic] = k.split('::'); const pct = v.t ? Math.round((v.r / v.t) * 100) : 100
    out.set(k, { subj, topic, pct, total: v.t, open: 0, score: 0 })
  }
  for (const m of open) {
    const k = topicKey(m.subj, m.topic); const w = out.get(k) ?? { subj: m.subj, topic: m.topic || 'General', pct: 100, total: 0, open: 0, score: 0 }
    w.open++; out.set(k, w)
  }
  return [...out.values()].map(w => ({ ...w, score: (100 - w.pct) + w.open * 8 + Math.min(10, w.total) }))
    .filter(w => (w.total >= 2 && w.pct < 70) || w.open >= 2).sort((a, b) => b.score - a.score)
}

export const masteryLabel = (pct: number, total: number) => total < 2 ? ['New', '⚪'] as const : pct >= 85 ? ['Mastered', '🟢'] as const : pct >= 65 ? ['Getting there', '🟠'] as const : ['Needs work', '🔴'] as const
