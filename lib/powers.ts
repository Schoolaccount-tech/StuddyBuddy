import { store } from './api'
// Owl Powers: active abilities your buddy owl lets you use. Saved in this browser.
export type PowerId = 'freeze' | 'xpm' | 'night' | 'second' | 'eagle' | 'quick' | 'scan' | 'recall'
export const POWERS: { id: PowerId; name: string; e: string; desc: string; daily: boolean }[] = [
  { id: 'freeze', name: 'Time Freeze', e: '❄️', desc: 'Starts a distraction-free study session. Everything else hides until you exit.', daily: true },
  { id: 'xpm', name: 'XP Multiplier', e: '✖️', desc: 'Earn bonus XP on everything for 30 minutes. Rarer buddy, bigger bonus.', daily: true },
  { id: 'night', name: 'Night Owl', e: '🌙', desc: 'Unlocks special night study themes. Tap to switch between them.', daily: false },
  { id: 'second', name: 'Second Chance', e: '🔁', desc: 'Gives another attempt at a hard question, with a hint. Used on your next wrong quiz answer.', daily: true },
  { id: 'eagle', name: 'Eagle Eyes', e: '🦅', desc: 'Highlights the mistakes in your exam answer after it is marked.', daily: true },
  { id: 'quick', name: 'Quick Learner', e: '⚡', desc: 'Builds a 5-minute revision session of flashcards on your subject.', daily: true },
  { id: 'scan', name: 'Knowledge Scan', e: '🔍', desc: 'A 5-question test of what you already know, before you start a topic.', daily: true },
  { id: 'recall', name: 'Perfect Recall', e: '🧠', desc: 'A revision quiz built from the things you studied or got wrong before.', daily: true },
]
export const NIGHTS = [['', 'Off'], ['moon', '🌙 Moonlight'], ['aurora', '🌌 Aurora'], ['ember', '🔥 Ember night']] as const
const day = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
/** Uses per day: 1 for common owls, 2 for rarity 4 and up, 3 for rarity 8 and up. */
export const usesPerDay = (rarity: number) => 1 + Math.floor(rarity / 4)
export const usedToday = (id: PowerId) => { const u = store.get<{ d: string; u: Record<string, number> }>('pwr', { d: '', u: {} }); return u.d === day() ? u.u[id] || 0 : 0 }
export const markUsed = (id: PowerId) => { const u = store.get<{ d: string; u: Record<string, number> }>('pwr', { d: '', u: {} }); const cur = u.d === day() ? u : { d: day(), u: {} as Record<string, number> }; cur.u[id] = (cur.u[id] || 0) + 1; store.set('pwr', cur) }
export const tokens = (k: 'second' | 'eagle') => { const t = store.get<{ d: string; second: number; eagle: number }>('ptok', { d: '', second: 0, eagle: 0 }); return t.d === day() ? t[k] || 0 : 0 }
export const addToken = (k: 'second' | 'eagle') => { const t = store.get<any>('ptok', { d: '', second: 0, eagle: 0 }); const c = t.d === day() ? t : { d: day(), second: 0, eagle: 0 }; c[k] = (c[k] || 0) + 1; store.set('ptok', c) }
export const spendToken = (k: 'second' | 'eagle'): boolean => { const t = store.get<any>('ptok', { d: '', second: 0, eagle: 0 }); if (t.d !== day() || !(t[k] > 0)) return false; t[k]--; store.set('ptok', t); return true }
export const startXpMult = (pct: number) => store.set('xpm', { until: Date.now() + 30 * 60000, pct })
export const xpMultActive = (): { until: number; pct: number } | null => { const m = store.get<{ until: number; pct: number }>('xpm', { until: 0, pct: 0 }); return m.until > Date.now() ? m : null }
export const applyNight = (mode: string) => { try { if (mode) document.documentElement.dataset.night = mode; else delete document.documentElement.dataset.night } catch {} }
