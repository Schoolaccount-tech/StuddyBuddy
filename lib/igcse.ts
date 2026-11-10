// Cambridge IGCSE subjects, papers and past-paper helpers.
// Structures come from Cambridge entry sheets. Marks and weightings are only filled in where they are certain;
// anything marked `chk` should be confirmed against the syllabus for the student's exam year.

export type Paper = { n: number; t: string; d?: number; m?: number; w?: number; tier?: 'Core' | 'Extended' | 'Both'; calc?: boolean; nv?: boolean }
export type Subject = { code: string; name: string; g: string; nine?: string; slug?: string; papers: Paper[]; chk?: boolean; note?: string }

const P = (n: number, t: string, d?: number, m?: number, w?: number, o: Partial<Paper> = {}): Paper => ({ n, t, d, m, w, ...o })
const NV = { nv: true }
const sci = (marks: boolean): Paper[] => [
  P(1, 'Multiple Choice (Core)', 45, marks ? 40 : undefined, marks ? 30 : undefined, { tier: 'Core', calc: true }),
  P(2, 'Multiple Choice (Extended)', 45, marks ? 40 : undefined, marks ? 30 : undefined, { tier: 'Extended', calc: true }),
  P(3, 'Theory (Core)', 75, marks ? 80 : undefined, marks ? 50 : undefined, { tier: 'Core', calc: true }),
  P(4, 'Theory (Extended)', 75, marks ? 80 : undefined, marks ? 50 : undefined, { tier: 'Extended', calc: true }),
  P(5, 'Practical Test', 75, marks ? 40 : undefined, marks ? 20 : undefined, { tier: 'Both', calc: true }),
  P(6, 'Alternative to Practical', 60, marks ? 40 : undefined, marks ? 20 : undefined, { tier: 'Both', calc: true }),
]
const lang4 = (): Paper[] => [P(1, 'Listening (Multiple Choice)', 50), P(2, 'Reading', 60), P(3, 'Speaking', 10, undefined, undefined, NV), P(4, 'Writing', 60)]
const two = (a = 'Paper 1', b = 'Paper 2'): Paper[] => [P(1, a), P(2, b)]

export const GROUPS = ['Maths', 'Sciences', 'English', 'Languages', 'Humanities', 'Business', 'Technology', 'Creative'] as const

export const SUBJECTS: Subject[] = [
  // Maths
  { code: '0580', name: 'Mathematics', g: 'Maths', nine: '0980', slug: 'mathematics-0580', note: 'Core students sit Papers 1 and 3 (grades C to G). Extended students sit Papers 2 and 4 (grades A* to E). Papers 1 and 2 are non-calculator.', papers: [
    P(1, 'Non-calculator (Core)', 90, 80, 50, { tier: 'Core', calc: false }), P(2, 'Non-calculator (Extended)', 120, 100, 50, { tier: 'Extended', calc: false }),
    P(3, 'Calculator (Core)', 90, 80, 50, { tier: 'Core', calc: true }), P(4, 'Calculator (Extended)', 120, 100, 50, { tier: 'Extended', calc: true })] },
  { code: '0606', name: 'Additional Mathematics', g: 'Maths', slug: 'mathematics-additional-0606', papers: [P(1, 'Non-calculator', 120, 80, 50, { calc: false }), P(2, 'Calculator', 120, 80, 50, { calc: true })] },
  { code: '0607', name: 'International Mathematics', g: 'Maths', chk: true, papers: [
    P(1, 'Non-calculator (Core)', 75, undefined, undefined, { tier: 'Core', calc: false }), P(2, 'Non-calculator (Extended)', 90, undefined, undefined, { tier: 'Extended', calc: false }),
    P(3, 'Calculator (Core)', 75, undefined, undefined, { tier: 'Core', calc: true }), P(4, 'Calculator (Extended)', 90, undefined, undefined, { tier: 'Extended', calc: true }),
    P(5, 'Investigation (Core)', 75, undefined, undefined, { tier: 'Core' }), P(6, 'Investigation and Modelling (Extended)', 90, undefined, undefined, { tier: 'Extended' })] },
  // Sciences
  { code: '0610', name: 'Biology', g: 'Sciences', nine: '0970', slug: 'biology-0610', note: 'Core: Papers 1, 3 and 5 or 6. Extended: Papers 2, 4 and 5 or 6.', papers: sci(true) },
  { code: '0620', name: 'Chemistry', g: 'Sciences', nine: '0971', slug: 'chemistry-0620', note: 'Core: Papers 1, 3 and 5 or 6. Extended: Papers 2, 4 and 5 or 6.', papers: sci(true) },
  { code: '0625', name: 'Physics', g: 'Sciences', nine: '0972', slug: 'physics-0625', note: 'Core: Papers 1, 3 and 5 or 6. Extended: Papers 2, 4 and 5 or 6.', papers: sci(true) },
  { code: '0653', name: 'Combined Science', g: 'Sciences', slug: 'science-combined-0653', chk: true, papers: sci(false) },
  { code: '0654', name: 'Co-ordinated Sciences (Double)', g: 'Sciences', nine: '0973', chk: true, papers: [
    P(1, 'Multiple Choice (Core)', 45, undefined, undefined, { tier: 'Core' }), P(2, 'Multiple Choice (Extended)', 45, undefined, undefined, { tier: 'Extended' }),
    P(3, 'Theory (Core)', 120, undefined, undefined, { tier: 'Core' }), P(4, 'Theory (Extended)', 120, undefined, undefined, { tier: 'Extended' }),
    P(5, 'Practical Test', 120, undefined, undefined, { tier: 'Both' }), P(6, 'Alternative to Practical', 90, undefined, undefined, { tier: 'Both' })] },
  { code: '0680', name: 'Environmental Management', g: 'Sciences', chk: true, papers: [P(1, 'Theory', 105), P(2, 'Management in Context', 105)] },
  { code: '0697', name: 'Marine Science', g: 'Sciences', chk: true, papers: [P(1, 'Theory and Data Handling', 105), P(2, 'Theory and Practical Skills', 105)] },
  { code: '0600', name: 'Agriculture', g: 'Sciences', chk: true, papers: [P(1, 'Written Paper', 105), P(2, 'Coursework', undefined, undefined, undefined, NV)] },
  // English
  { code: '0500', name: 'First Language English', g: 'English', nine: '0990', papers: [P(1, 'Reading', 120, 50, 50), P(2, 'Directed Writing and Composition', 120, 50, 50), P(3, 'Coursework Portfolio', undefined, undefined, undefined, NV), P(4, 'Speaking and Listening', 12, undefined, undefined, NV)] },
  { code: '0510', name: 'English as a Second Language (speaking endorsement)', g: 'English', nine: '0993', chk: true, papers: [P(1, 'Reading and Writing', 120), P(2, 'Listening (Multiple Choice)', 50), P(3, 'Speaking', 15, undefined, undefined, NV)] },
  { code: '0511', name: 'English as a Second Language (count-in speaking)', g: 'English', nine: '0991', chk: true, papers: [P(1, 'Reading and Writing', 120), P(2, 'Listening (Multiple Choice)', 50), P(3, 'Speaking', 15, undefined, undefined, NV)] },
  { code: '0472', name: 'English as an Additional Language', g: 'English', nine: '0772', chk: true, papers: [P(2, 'Paper 2'), P(4, 'Paper 4')] },
  { code: '0475', name: 'Literature (English)', g: 'English', nine: '0992', papers: [P(1, 'Poetry and Prose', 90), P(2, 'Drama', 90), P(3, 'Drama (Open Text)', 45), P(4, 'Unseen', 75), P(5, 'Coursework', undefined, undefined, undefined, NV)] },
  { code: '0408', name: 'World Literature', g: 'English', chk: true, papers: [P(1, 'Coursework', undefined, undefined, undefined, NV), P(2, 'Unseen Poetry', 75), P(3, 'Set Text', 90)] },
  // Languages
  { code: '0520', name: 'French', g: 'Languages', nine: '7156', papers: lang4() },
  { code: '0525', name: 'German', g: 'Languages', nine: '7159', papers: lang4() },
  { code: '0530', name: 'Spanish', g: 'Languages', nine: '7160', papers: lang4() },
  { code: '0535', name: 'Italian', g: 'Languages', nine: '7164', chk: true, papers: [P(2, 'Reading'), P(4, 'Writing')] },
  { code: '0544', name: 'Arabic (foreign language)', g: 'Languages', nine: '7180', chk: true, papers: [P(2, 'Reading'), P(4, 'Writing')] },
  { code: '0546', name: 'Malay (foreign language)', g: 'Languages', chk: true, papers: [P(2, 'Reading'), P(4, 'Writing')] },
  { code: '0547', name: 'Mandarin Chinese (foreign language)', g: 'Languages', chk: true, papers: [P(2, 'Reading'), P(4, 'Writing')] },
  { code: '0262', name: 'Swahili', g: 'Languages', chk: true, papers: two() },
  { code: '0480', name: 'Latin', g: 'Languages', chk: true, papers: [P(2, 'Paper 2')] },
  { code: '0523', name: 'Chinese (second language)', g: 'Languages', chk: true, papers: two() },
  { code: '0538', name: 'Bahasa Indonesia', g: 'Languages', chk: true, papers: two() },
  { code: '0539', name: 'Urdu (second language)', g: 'Languages', chk: true, papers: two() },
  { code: '0549', name: 'Hindi (second language)', g: 'Languages', chk: true, papers: [P(1, 'Paper 1', 120), P(2, 'Paper 2', 45), P(3, 'Speaking', 12, undefined, undefined, NV)] },
  { code: '0695', name: 'Vietnamese', g: 'Languages', chk: true, papers: two() },
  { code: '0501', name: 'First Language French', g: 'Languages', chk: true, papers: two() },
  { code: '0502', name: 'First Language Spanish', g: 'Languages', chk: true, papers: [P(1, 'Reading', 120), P(2, 'Directed Writing and Composition', 120), P(3, 'Speaking and Listening', 12, undefined, undefined, NV)] },
  { code: '0504', name: 'First Language Portuguese', g: 'Languages', chk: true, papers: two() },
  { code: '0505', name: 'First Language German', g: 'Languages', chk: true, papers: two() },
  { code: '0508', name: 'First Language Arabic', g: 'Languages', nine: '7184', chk: true, papers: [P(1, 'Reading', 120), P(2, 'Writing', 120)] },
  { code: '0509', name: 'First Language Chinese', g: 'Languages', chk: true, papers: two() },
  { code: '0513', name: 'First Language Turkish', g: 'Languages', chk: true, papers: two() },
  { code: '0518', name: 'First Language Thai', g: 'Languages', chk: true, papers: two() },
  { code: '0696', name: 'First Language Malay', g: 'Languages', chk: true, papers: two() },
  { code: '0698', name: 'First Language Setswana', g: 'Languages', chk: true, papers: [P(1, 'Reading and Writing', 120), P(2, 'Literature', 120)] },
  // Humanities
  { code: '0460', name: 'Geography', g: 'Humanities', nine: '0976', slug: 'geography-0460', papers: [P(1, 'Geographical Themes', 105), P(2, 'Geographical Skills', 90), P(3, 'Coursework', undefined, undefined, undefined, NV), P(4, 'Alternative to Coursework', 90)] },
  { code: '0470', name: 'History', g: 'Humanities', nine: '0977', slug: 'history-0470', papers: [P(1, 'Structured Questions', 120), P(2, 'Document Questions', 105), P(3, 'Coursework', undefined, undefined, undefined, NV), P(4, 'Alternative to Coursework', 60)] },
  { code: '0457', name: 'Global Perspectives', g: 'Humanities', chk: true, papers: [P(1, 'Written Exam', 85), P(2, 'Individual Report', undefined, undefined, undefined, NV), P(3, 'Team Project', undefined, undefined, undefined, NV)] },
  { code: '0490', name: 'Religious Studies', g: 'Humanities', chk: true, papers: [P(1, 'Worship, Beliefs, Scriptures and Sacred Places', 105), P(2, 'Festivals, Fasts, Family Life and Social Action', 105)] },
  { code: '0493', name: 'Islamiyat', g: 'Humanities', papers: [P(1, 'Paper 1', 90), P(2, 'Paper 2', 90)] },
  { code: '0495', name: 'Sociology', g: 'Humanities', papers: [P(1, 'Research Methods, Identity and Inequality', 120), P(2, 'Family, Education and Crime', 105)] },
  { code: '0471', name: 'Travel and Tourism', g: 'Humanities', papers: [P(1, 'Key Terms and Concepts', 90), P(2, 'Managing and Marketing Destinations', 120)] },
  { code: '0448', name: 'Pakistan Studies', g: 'Humanities', chk: true, papers: two() },
  { code: '0409', name: 'American History (US)', g: 'Humanities', chk: true, papers: two() },
  // Business
  { code: '0450', name: 'Business Studies', g: 'Business', nine: '0986', papers: [P(1, 'Short Answer and Data Response', 90, 80, 50, { calc: true }), P(2, 'Case Study', 90, 80, 50, { calc: true })] },
  { code: '0452', name: 'Accounting', g: 'Business', nine: '0985', slug: 'accounting-0452', papers: [P(1, 'Multiple Choice', 75, undefined, undefined, { calc: true }), P(2, 'Structured Questions', 105, undefined, undefined, { calc: true })] },
  { code: '0454', name: 'Enterprise', g: 'Business', chk: true, papers: [P(1, 'Case Study', 90), P(2, 'Coursework', undefined, undefined, undefined, NV)] },
  { code: '0455', name: 'Economics', g: 'Business', nine: '0987', slug: 'economics-0455', papers: [P(1, 'Multiple Choice', 45, 30, 30, { calc: true }), P(2, 'Structured Questions', 135, 90, 70, { calc: true })] },
  // Technology
  { code: '0478', name: 'Computer Science', g: 'Technology', nine: '0984', slug: 'computer-science-0478', papers: [P(1, 'Computer Systems', 105, 75, 50), P(2, 'Algorithms, Programming and Logic', 105, 75, 50)] },
  { code: '0417', name: 'Information and Communication Technology', g: 'Technology', nine: '0983', papers: [P(1, 'Theory', 90), P(2, 'Practical Test', 135), P(3, 'Practical Test', 135)] },
  { code: '0445', name: 'Design and Technology', g: 'Technology', nine: '0979', chk: true, papers: [P(1, 'Product Design', 75), P(2, 'School Based Assessment', undefined, undefined, undefined, NV), P(3, 'Resistant Materials', 60), P(4, 'Systems and Control', 60), P(5, 'Graphic Products', 60)] },
  { code: '0648', name: 'Food and Nutrition', g: 'Technology', chk: true, papers: [P(1, 'Theory', 120), P(2, 'Practical', 150, undefined, undefined, NV)] },
  // Creative
  { code: '0400', name: 'Art and Design', g: 'Creative', nine: '0989', papers: [P(1, 'Coursework Assignment', undefined, undefined, undefined, NV), P(2, 'Externally Set Assignment', 480, undefined, undefined, NV)] },
  { code: '0411', name: 'Drama', g: 'Creative', nine: '0994', papers: [P(1, 'Written Paper', 150), P(2, 'Coursework', undefined, undefined, undefined, NV)] },
  { code: '0410', name: 'Music', g: 'Creative', nine: '0978', papers: [P(1, 'Listening', 75), P(2, 'Performing', undefined, undefined, undefined, NV), P(3, 'Composing', undefined, undefined, undefined, NV)] },
  { code: '0413', name: 'Physical Education', g: 'Creative', nine: '0995', papers: [P(1, 'Theory', 105), P(2, 'Coursework', undefined, undefined, undefined, NV)] },
]

export const SERIES = [['m', 'Feb/Mar', 'F/M'], ['s', 'May/Jun', 'M/J'], ['w', 'Oct/Nov', 'O/N']] as const
export const DOCS = [['qp', 'Question paper'], ['ms', 'Mark scheme'], ['er', 'Examiner report'], ['in', 'Insert / source booklet'], ['ci', 'Confidential instructions'], ['gt', 'Grade thresholds']] as const

export const findSubject = (q: string): Subject | undefined => {
  const c = q.trim().replace(/\D/g, '')
  if (c.length === 4) return SUBJECTS.find(s => s.code === c || s.nine === c)
  const t = q.trim().toLowerCase(); if (!t) return undefined
  return SUBJECTS.find(s => s.name.toLowerCase() === t) || SUBJECTS.find(s => s.name.toLowerCase().includes(t))
}
export const subjectLabel = (s: Subject) => `${s.name} (${s.code}${s.nine ? ' / ' + s.nine : ''})`
export const dur = (d?: number) => d === undefined ? '' : d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? ' ' + (d % 60) + 'm' : ''}` : `${d} min`

export type Comp = { ok: boolean; paper: number; variant: number; nv: boolean; p?: Paper; msg: string }
/** "42" means Paper 4, variant 2. "03" means component 3 with no variants. */
export function parseComp(s: Subject, raw: string): Comp {
  const c = raw.trim()
  if (!/^\d{2}$/.test(c)) return { ok: false, paper: 0, variant: 0, nv: false, msg: 'A component number has two digits, for example 22 or 42.' }
  const a = +c[0], b = +c[1]
  const nv = a === 0, paper = nv ? b : a, variant = nv ? 0 : b
  const p = s.papers.find(x => x.n === paper)
  if (!p) return { ok: false, paper, variant, nv, msg: `${s.name} has no component ${c}. Its papers are ${s.papers.map(x => x.n).join(', ')}.` }
  if (!nv && (variant < 1 || variant > 3)) return { ok: false, paper, variant, nv, p, msg: 'The second digit is the variant and is normally 1, 2 or 3.' }
  return { ok: true, paper, variant, nv, p, msg: '' }
}

export const paperCode = (s: Subject, comp: string, ser: string, yr: number) => `${s.code}/${comp}/${ser === 'm' ? 'F/M' : ser === 's' ? 'M/J' : 'O/N'}/${String(yr).slice(-2)}`
export const stem = (code: string, ser: string, yr: number, doc: string, comp: string) => `${code}_${ser}${String(yr).slice(-2)}_${doc}_${comp}`
const g = (q: string) => 'https://www.google.com/search?q=' + encodeURIComponent(q)

export const officialPast = (s: Subject) => s.slug
  ? `https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-${s.slug}/past-papers/`
  : g(`site:cambridgeinternational.org Cambridge IGCSE ${s.name} ${s.code} past papers`)
export const officialPage = (s: Subject) => s.slug
  ? `https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-${s.slug}/`
  : g(`site:cambridgeinternational.org Cambridge IGCSE ${s.name} ${s.code}`)
export const GRADE_TABLES = 'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/grade-threshold-tables/'
export const SUPPORT_HUB = 'https://schoolsupporthub.cambridge.org'
export const findDoc = (s: Subject, comp: string, ser: string, yr: number, doc: string) => g(`"${stem(s.code, ser, yr, doc, comp)}" pdf`)
export const findLoose = (s: Subject, comp: string, ser: string, yr: number, doc: string) => g(`${s.code} ${SERIES.find(x => x[0] === ser)![1]} ${yr} ${DOCS.find(d => d[0] === doc)![1]} paper ${comp[0]} variant ${comp[1]} IGCSE ${s.name}`)
export const findExemplar = (s: Subject) => g(`site:cambridgeinternational.org "example candidate responses" ${s.name} ${s.code}`)
export const findExemplarOpen = (s: Subject) => g(`Cambridge IGCSE ${s.name} ${s.code} example candidate responses with examiner comments`)

/** Understands 0580/22/M/J/24, 0580_s24_qp_22(.pdf), 0580 w25 ms 42, 0580/22 etc. */
export type Decoded = { s: Subject; comp?: string; ser?: string; yr?: number; doc?: string }
export function decodeCode(raw: string): Decoded | null {
  const t = raw.trim().toLowerCase().replace(/\.pdf$/, '')
  let m = t.match(/^(\d{4})[\s_\-/]*([msw])\s?(\d{2})[\s_\-/]*(qp|ms|er|in|ci|gt|sf|sp)?[\s_\-/]*(\d{2})?$/)
  if (m) { const s = findSubject(m[1]); if (s) return { s, ser: m[2], yr: 2000 + +m[3], doc: m[4], comp: m[5] } }
  m = t.match(/^(\d{4})\s*\/\s*(\d{2})\s*\/\s*(f\/m|m\/j|o\/n|fm|mj|on)\s*\/\s*(\d{2})$/)
  if (m) { const s = findSubject(m[1]); const k = m[3].replace('/', ''); if (s) return { s, comp: m[2], ser: k === 'fm' ? 'm' : k === 'mj' ? 's' : 'w', yr: 2000 + +m[4] } }
  m = t.match(/^(\d{4})\s*\/?\s*(\d{2})$/)
  if (m) { const s = findSubject(m[1]); if (s) return { s, comp: m[2] } }
  return null
}

export const YEARS = Array.from({ length: 13 }, (_, i) => 2026 - i)
