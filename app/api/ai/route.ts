import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
const MODELS = ['claude-sonnet-5-5', 'claude-sonnet-4-5']
const hits = new Map<string, number[]>()

// Small per-visitor limit so nobody can drain the school's AI credit.
function limited(ip: string) {
  const now = Date.now(), win = (hits.get(ip) ?? []).filter(t => now - t < 60_000)
  win.push(now); hits.set(ip, win)
  return win.length > 20
}

const SUBJECTS = ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'English Language', 'Computer Science', 'Business Studies', 'Geography', 'History', 'Economics', 'Accounting']
const STYLES: Record<string, string> = {
  voice: ' You are speaking aloud: answer in 2 to 4 short, natural spoken sentences. No lists, no symbols, no markdown.',
  simple: ' Explain like the student is 12: very simple words, a friendly example, no jargon.',
  exam: ' Answer the way a top examiner would: key terms, mark-scheme style points and how many marks each part earns.',
  deep: ' Go deeper than the syllabus: explain why it works, link to related topics, and give one challenge question at the end.',
}
const LEVELS: Record<string, string> = { easy: 'easy, recall-based', medium: 'medium, standard exam level', hard: 'hard, grade A*/9 level with multi-step thinking', exam: 'real exam style with tricky distractors' }

function extract(text: string, open: '[' | '{') {
  const close = open === '[' ? ']' : '}'
  const a = text.indexOf(open), b = text.lastIndexOf(close)
  if (a < 0 || b <= a) throw new Error('no json')
  return JSON.parse(text.slice(a, b + 1))
}
const str = (v: unknown, n: number) => String(v ?? '').slice(0, n)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'x'
  if (limited(ip)) return NextResponse.json({ error: 'Slow down a little and try again in a minute.' }, { status: 429 })
  const key = (process.env.ANTHROPIC_API_KEY ?? '').trim()
  if (!key) return NextResponse.json({ error: 'The AI is not switched on yet. The site owner must add ANTHROPIC_API_KEY in Vercel.' }, { status: 503 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }) }
  const subject = SUBJECTS.includes(body.subject) ? body.subject : (str(body.subject, 60).replace(/[^\w &,'()/.+-]/g, '').trim() || 'Mathematics')
  const topic = str(body.topic, 120).replace(/[\r\n]+/g, ' ')
  const mode = body.mode as string
  const base = `You are Wise Owl, a warm, clear tutor for Cambridge IGCSE students at Wise Owl School Westgate in Harare, Zimbabwe. The subject is IGCSE ${subject}${topic ? ` on the topic "${topic}"` : ''}. Use plain language for a teenager. Only help with schoolwork.`

  let system = base, max = 900
  let messages: { role: 'user' | 'assistant'; content: any }[] = []
  if (mode === 'chat') {
    max = 2500
    const general = subject === 'Anything' || subject === 'General'
    system = `You are Wise Owl, the AI study companion of Wise Owl School Westgate in Harare, Zimbabwe. You are as capable as the best general AI assistants and the best private tutor combined: you can answer ANY question the student asks, on any topic, accurately and helpfully, including homework, essays, coding, maths, science, languages, careers, study skills and general knowledge.
How you answer:
- Give the real answer first, then explain. Think carefully; for maths and science show every step and check the result. Never invent facts, quotes, past-paper details or mark schemes; if you are not sure, say so plainly.
- Match the depth to the question: short for simple things, thorough with headings, lists and worked examples for hard ones. Use Markdown (headings, bullets, tables, bold key terms). Write maths in plain text such as x^2 or 3/4.
- ${general ? 'The student has not picked a subject, so infer it from the question.' : `The student's current subject is Cambridge IGCSE ${subject}${topic ? ` (topic: "${topic}")` : ''}. For this subject, teach to the Cambridge syllabus: use the correct command words and key terms, and show how marks are earned in the exam. Where a question is outside this subject, just answer it well.`}
- End school-subject answers with one short check-your-understanding question or a next step. Do not do this for casual chat.
- The student is a teenager: be warm, encouraging and honest, never condescending. Help them learn, not just copy: for graded homework, guide with the method and a worked similar example, then give the answer if they ask.
- If an image is attached, read it carefully (handwriting, diagrams, graphs), say what you see, then solve or explain it step by step.
- Politely decline anything harmful, sexual or dangerous, and gently point to a trusted adult for serious personal problems.` + (STYLES[body.style] ?? '')
    messages = (Array.isArray(body.messages) ? body.messages : []).slice(-24)
      .map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: str(m.content, 6000) })) as any
    if (!messages.length || messages[messages.length - 1].role !== 'user') return NextResponse.json({ error: 'Ask a question first.' }, { status: 400 })
    const img = body.image
    if (img && typeof img.data === 'string' && /^image\/(jpeg|png|webp|gif)$/.test(img.type) && img.data.length < 6_000_000 && /^[A-Za-z0-9+/=]+$/.test(img.data)) {
      const lastM: any = messages[messages.length - 1]
      lastM.content = [{ type: 'image', source: { type: 'base64', media_type: img.type, data: img.data } }, { type: 'text', text: lastM.content || 'Please solve or explain the question in this photo, step by step.' }]
    }
  } else if (mode === 'quiz') {
    max = 4000; const n = body.count === 10 ? 10 : 5, lv = LEVELS[body.difficulty] ?? LEVELS.medium
    messages = [{ role: 'user', content: `Write ${n} multiple-choice revision questions, difficulty: ${lv}. Return ONLY a JSON array of ${n} objects: {"q": string, "options": [4 short strings], "answer": index 0-3, "explain": one or two sentences}. Spread the correct answers across positions.` }]
  } else if (mode === 'cards') {
    max = 2000
    messages = [{ role: 'user', content: 'Write 8 revision flashcards. Return ONLY a JSON array of 8 objects: {"front": short question or term, "back": clear answer under 30 words}.' }]
  } else if (mode === 'exam') {
    max = 1200
    messages = [{ role: 'user', content: `Write ONE exam-style question worth 3 to 6 marks. Return ONLY JSON: {"question": string, "marks": number, "scheme": [one short marking point per mark], "hint": one short hint}. Seed: ${str(body.seed, 20)}` }]
  } else if (mode === 'mark') {
    max = 700
    const scheme = (Array.isArray(body.scheme) ? body.scheme : []).slice(0, 8).map((x: any) => str(x, 200))
    const marks = Math.max(1, Math.min(8, Number(body.marks) || scheme.length || 3))
    messages = [{ role: 'user', content: `Mark this student answer like an examiner.\nQuestion: ${str(body.question, 600)}\nMarking points: ${scheme.join(' | ')}\nMarks available: ${marks}\nStudent answer: ${str(body.answer, 1200)}\nReturn ONLY JSON: {"awarded": integer 0-${marks}, "feedback": two short encouraging sentences saying what earned marks and what was missing}.` }]
    body.__marks = marks
  } else if (mode === 'sheet') {
    max = 1800
    messages = [{ role: 'user', content: 'Make a one-page revision cheat sheet. Return ONLY JSON: {"title": string, "sections": [4 to 6 objects {"h": section heading, "points": [3 to 5 short bullet strings]}]}.' }]
  } else if (mode === 'map') {
    max = 1500
    messages = [{ role: 'user', content: 'Make a mind map. Return ONLY JSON: {"center": the topic, "branches": [4 to 6 objects {"name": branch name, "leaves": [3 to 4 short strings]}]}.' }]
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
    try {
      if (mode === 'quiz') {
        const data = (extract(text, '[') as any[]).filter(q => q && typeof q.q === 'string' && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3)
          .map(q => ({ q: str(q.q, 400), options: q.options.map((o: any) => str(o, 160)), answer: q.answer, explain: str(q.explain, 400) }))
        if (!data.length) throw new Error('bad')
        return NextResponse.json({ data })
      }
      if (mode === 'cards') {
        const data = (extract(text, '[') as any[]).filter(c => c && c.front && c.back).map(c => ({ front: str(c.front, 200), back: str(c.back, 300) }))
        if (!data.length) throw new Error('bad')
        return NextResponse.json({ data })
      }
      const o = extract(text, '{')
      if (mode === 'exam') {
        const scheme = (Array.isArray(o.scheme) ? o.scheme : []).slice(0, 8).map((x: any) => str(x, 200))
        if (!o.question || !scheme.length) throw new Error('bad')
        return NextResponse.json({ data: { question: str(o.question, 700), marks: Math.max(1, Math.min(8, Number(o.marks) || scheme.length)), scheme, hint: str(o.hint, 200) } })
      }
      if (mode === 'mark') {
        const m = body.__marks as number
        return NextResponse.json({ data: { awarded: Math.max(0, Math.min(m, Math.round(Number(o.awarded) || 0))), marks: m, feedback: str(o.feedback, 500) } })
      }
      if (mode === 'sheet') {
        const sections = (Array.isArray(o.sections) ? o.sections : []).slice(0, 7).map((s: any) => ({ h: str(s.h, 80), points: (Array.isArray(s.points) ? s.points : []).slice(0, 6).map((x: any) => str(x, 200)) }))
        if (!sections.length) throw new Error('bad')
        return NextResponse.json({ data: { title: str(o.title, 100), sections } })
      }
      const branches = (Array.isArray(o.branches) ? o.branches : []).slice(0, 7).map((b: any) => ({ name: str(b.name, 60), leaves: (Array.isArray(b.leaves) ? b.leaves : []).slice(0, 5).map((x: any) => str(x, 100)) }))
      if (!branches.length) throw new Error('bad')
      return NextResponse.json({ data: { center: str(o.center, 80), branches } })
    } catch { return NextResponse.json({ error: 'I could not build that. Try again.' }, { status: 502 }) }
  }
  return NextResponse.json({ error: 'The AI is unavailable right now.' + (last ? '' : '') }, { status: 502 })
}
