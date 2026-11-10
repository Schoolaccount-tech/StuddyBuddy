// Wise Owl League client. Every call goes to a permission-checked database function; nothing here can change scores directly.
export const LG_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const LG_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const lgReady = () => !!(LG_URL && LG_KEY)

export async function rpc<T = any>(fn: string, args: object = {}, token?: string): Promise<T> {
  if (!lgReady()) throw new Error('The league is not connected yet.')
  const r = await fetch(`${LG_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: LG_KEY, authorization: `Bearer ${token || LG_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(args) })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error((j && (j.message || j.error_description)) || 'Could not reach the league. Please try again.')
  return j as T
}

// A student's code lives in this tab only (sessionStorage) unless they choose to remember it on their own device.
const KEY = 'wob:lgcode'
export function getCode(): string {
  try { return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || '' } catch { return '' }
}
export function setCode(code: string, remember: boolean) {
  try { sessionStorage.setItem(KEY, code); if (remember) localStorage.setItem(KEY, code); else localStorage.removeItem(KEY) } catch {}
}
export function clearCode() { try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY) } catch {} }

/** Report AI practice, missions and streaks. Capped and flagged as practice on the server. Returns points earned, or null. */
export async function reportPractice(kind: 'quiz' | 'exam' | 'mission' | 'streak', units: number, subject: string, ref: string): Promise<number | null> {
  const code = getCode(); if (!code || !lgReady()) return null
  try { const j = await rpc('lg_report_practice', { p_code: code, p_kind: kind, p_units: units, p_subject: subject, p_ref: ref }); return j && j.ok ? Number(j.points) || 0 : null } catch { return null }
}

// Staff sign in with their existing Merit & Demerit account. The session lasts only while the tab is open.
const SK = 'wob:lgstaff'
export type Staff = { token: string; refresh: string; email: string; exp: number }
export function getStaff(): Staff | null { try { const s = JSON.parse(sessionStorage.getItem(SK) || 'null'); return s && s.exp > Date.now() ? s : null } catch { return null } }
export function staffOut() { try { sessionStorage.removeItem(SK) } catch {} }
export async function staffIn(email: string, password: string): Promise<Staff> {
  const r = await fetch(`${LG_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: LG_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ email: email.trim(), password }) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j.access_token) throw new Error('Those details were not accepted. Use your Merit & Demerit staff login.')
  const s: Staff = { token: j.access_token, refresh: j.refresh_token, email: email.trim(), exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 - 60000 }
  try { sessionStorage.setItem(SK, JSON.stringify(s)) } catch {}
  return s
}

export const HOUSE_COLOURS: Record<string, string> = { Barn: '#d9534f', Verraux: '#3b82f6', Tawny: '#e0a526' }
export const houseColour = (name: string, c?: string | null) => (c && /^#[0-9a-f]{3,8}$/i.test(c) ? c : HOUSE_COLOURS[name] || '#8884d8')
export const PERIODS = [['week', 'This week'], ['month', 'This month'], ['season', 'Season'], ['all', 'All time']] as const
export const KINDS: Record<string, string> = { quiz: 'Quiz', exam: 'Exam challenge', house_battle: 'House battle', subject: 'Subject championship', knockout: 'Knockout round', weekly: 'Weekly challenge', monthly: 'Monthly championship' }
export const when = (iso: string) => { try { return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '' } }
