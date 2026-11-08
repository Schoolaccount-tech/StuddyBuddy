export const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem('wob:' + k); return v == null ? d : JSON.parse(v) } catch { return d } },
  set(k: string, v: unknown) { try { localStorage.setItem('wob:' + k, JSON.stringify(v)) } catch {} },
}
export async function ai(body: object): Promise<any> {
  const r = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.')
  return j
}
