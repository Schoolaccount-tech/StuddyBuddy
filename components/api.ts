import type { Prog, Ev } from '@/lib/progress'
import type { Mood } from './Mascot'
export type Api = {
  p: Prog; patch: (f: (p: Prog) => Prog) => void; award: (e: Ev) => void
  say: (m: string, mo?: Mood, ms?: number) => void; toast: (e: string, t: string, s?: string, big?: boolean) => void
  subj: string; topic: string
}
