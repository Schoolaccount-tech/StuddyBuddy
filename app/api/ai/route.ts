import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
const MODELS = ['claude-sonnet-5-5', 'claude-sonnet-4-5']
const hits = new Map<string, number[]>()

// Very small per-visitor limit so nobody can drain the school's AI credit.
function limited(ip: string) {
  const now = Date.now(), win = (hits.get(ip) ?? []).filter(t => now - t < 60_000)
  win.push(now); hits.set(ip, win)
  return win.length > 12
}

const SUBJECTS = ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'English Language', 'Computer Science', 'Business Studies', 'Geography', 'History', 'Economics', 'Accounting']

function parseJson(text: string) {
  const m = text.match(/\[[\s\S]*\]/)
  if (!m) throw new Error('no json')
  return JSON.parse(m[0])
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'x'
  if (limited(ip)) return NextResponse.json({ error: 'Slow down a little and try again in a minute.' }, { status: 429 })
  const key = (process.env.ANTHROPIC_API_KEY ?? '').trim()
  if (!key) return NextResponse.json({ error: 'The AI is not switched on yet. The site owner must add ANTHROPIC_API_KEY in Vercel.' }, { status: 503 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }) }
  const subject = SUBJECTS.includes(body.subject) ? body.subject : 'Mathematics'
  const topic = String(body.topic ?? '').slice(0, 120).replace(/[\r\n]+/g, ' ')
  const mode = body.mode as 'chat' | 'quiz' | 'cards'
  const base = `You are Wise Owl, a warm, clear tutor for Cambridge IGCSE students at Wise Owl School Westgate in Harare, Zimbabwe. The subject is IGCSE ${subject}${topic ? ` on the topic "${topic}"` : ''}. Use plain language for a teenager. Only help with schoolwork.`

  let system = base, max = 900
  let messages: { role: 'user' | 'assistant'; content: string }[] = []
  if (mode === 'chat') {
    system += ' Keep answers short, show worked steps, and say how marks are earned in the exam.'
    messages = (Array.isArray(body.messages) ? body.messages : []).slice(-8)
      .map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content ?? '').slice(0, 1500) }))
    if (!messages.length || messages[messages.length - 1].role !== 'user') return NextResponse.json({ error: 'Ask a question first.' }, { status: 400 })
  } else if (mode === 'quiz') {
    max = 2500
    messages = [{ role: 'user', content: 'Write 5 multiple-choice revision questions in IGCSE exam style. Return ONLY a JSON array of 5 objects: {"q": string, "options": [4 short strings], "answer": index 0-3, "explain": one or two sentences}. Spread the correct answers across positions.' }]
  } else if (mode === 'cards') {
    max = 2000
    messages = [{ role: 'user', content: 'Write 8 revision flashcards. Return ONLY a JSON array of 8 objects: {"front": short question or term, "back": clear answer under 30 words}.' }]
  } else return NextResponse.json({ error: 'Bad request.' }, { status: 400 })

  let last = ''
  for (const model of MODELS) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: max, system, messages }),
    })
    if (r.status === 401) return NextResponse.json({ error: 'The AI key was rejected. The site owner must check ANTHROPIC_API_KEY in Vercel.' }, { status: 502 })
    if (r.status === 402 || r.status === 429) return NextResponse.json({ error: 'The AI is busy or out of credit. Try again later.' }, { status: 502 })
    if (!r.ok) { last = await r.text(); continue }
    const j = await r.json()
    const text = (j.content ?? []).map((c: any) => c.text ?? '').join('')
    if (mode === 'chat') return NextResponse.json({ text })
    try { return NextResponse.json({ data: parseJson(text) }) } catch { return NextResponse.json({ error: 'I could not build that. Try again.' }, { status: 502 }) }
  }
  return NextResponse.json({ error: 'The AI is unavailable right now.' + (last ? '' : '') }, { status: 502 })
}
