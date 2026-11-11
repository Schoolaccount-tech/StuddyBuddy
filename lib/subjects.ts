// Every subject offered in the top bar. Cambridge IGCSE subjects come from lib/igcse.ts; a few school subjects that are not
// Cambridge IGCSE syllabuses (Fashion, CAD) are added so Wise Owl students can still use them with the tutor, quizzes and exam practice.
import { SUBJECTS, GROUPS } from './igcse'

export const EXTRA: { name: string; g: string; tip: string }[] = [
  { name: 'Fashion and Textiles', g: 'Creative', tip: 'Link every design choice to the user, the fabric and the construction method. Use technical words: tension, seam allowance, drape, fibre properties.' },
  { name: 'CAD (Computer-Aided Design)', g: 'Technology', tip: 'Describe the tool and why you used it: extrude, fillet, mirror, constraints. Show dimensions and views, and explain how CAD saves time and errors compared with drawing by hand.' },
  { name: 'Technical Graphics', g: 'Technology', tip: 'Use correct line types and projection: first-angle and third-angle, isometric and orthographic. Label every dimension with units.' },
]
const TIPS: Record<string, string> = {
  'Mathematics': 'Show every step of working. Method marks are given even when the final answer is wrong, so never skip steps.',
  'Design and Technology': 'Answer with the design context: user, need, materials and manufacturing. Give a reason for every choice and use sketches with labels and notes.',
  'Literature (English)': 'Point, quotation, explanation. Zoom in on one word or technique, then link it to the writer’s purpose and the effect on the reader.',
  'World Literature': 'Say what the writer does and why. Use short quotations and comment on language, structure and the cultural context.',
  'Art and Design': 'Show your process: research, development and a final piece. Annotate with the artist, technique and why you made each choice.',
  'Drama': 'Link your ideas to character, intention and audience effect. Use theatre words: blocking, proxemics, pace, tension.',
  'Music': 'Use musical vocabulary precisely: tempo, dynamics, texture, harmony. Always say what you hear and the effect it creates.',
  'Food and Nutrition': 'Name nutrients and their functions, link to dietary needs and explain the science of cooking: gelatinisation, coagulation, denaturation.',
  'Information and Communication Technology': 'Answer with a real-world example. Name the software feature or the legal issue and explain the impact.',
  'Additional Mathematics': 'Show full algebra, keep exact values (surds and π) until the end and check answers by substitution.',
  'Combined Science': 'Learn the command words and the required practicals. Use units in every calculation and link ideas across biology, chemistry and physics.',
  'Physical Education': 'Use the correct term (aerobic, anaerobic, muscle names) and link every point to the effect on performance.',
  'Religious Studies': 'Give the belief, the source or teaching, then explain how it affects believers. Give balanced views where asked.',
  'Sociology': 'Define the concept, give evidence from studies, then evaluate with a counter-argument.',
  'Travel and Tourism': 'Use named destinations and organisations. Link a factor to its impact on tourists, locals and the economy.',
  'Global Perspectives': 'Show different viewpoints with evidence, reference your sources, then reach a justified conclusion.',
  'Enterprise': 'Link to the business context. Define the term, apply it to the case and judge the best option.',
  'Environmental Management': 'Use named case studies with facts and figures, and explain both causes and sustainable solutions.',
  'Agriculture': 'Link practice to yield and sustainability. Use correct farming terms and explain cause and effect.',
  'Marine Science': 'Use exact terms for ecosystems and processes. Give examples from named habitats and explain human impacts.',
}
const BY_GROUP: Record<string, string> = {
  Maths: 'Show every step of working and units. Method marks are given even when the final answer is wrong.',
  Sciences: 'Learn the command words (describe, explain, suggest) and use the exact key term from the syllabus. Units are marks.',
  English: 'Plan for 5 minutes before writing. Answer the question set, use precise vocabulary and keep one idea to a paragraph.',
  Languages: 'Practise all four skills every week. Learn verb patterns and connectives, and always check your spelling and agreements.',
  Humanities: 'Use specific evidence, dates, places and examples. Structure answers as point, evidence, explanation.',
  Business: 'Answer in context. Define the term, apply it to the business in the question and give a reasoned judgement.',
  Technology: 'Be precise and practical. Name the tool, process or concept, and explain why it is the right choice.',
  Creative: 'Show your thinking and process. Annotate your work and justify every choice you made.',
}
const seen = new Set<string>()
const groups: Record<string, string> = {}
for (const s of SUBJECTS) { if (!seen.has(s.name)) { seen.add(s.name); groups[s.name] = s.g } }
for (const x of EXTRA) groups[x.name] = x.g
// The popular row: what most students need first, with the subjects people asked for.
export const POPULAR = ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'English Language', 'Literature (English)', 'Computer Science', 'Business Studies', 'Geography', 'History', 'Economics', 'Accounting', 'Design and Technology', 'Fashion and Textiles', 'CAD (Computer-Aided Design)', 'Art and Design', 'Food and Nutrition', 'Information and Communication Technology', 'Additional Mathematics', 'Combined Science']
const legacy = ['English Language']
export const ALL_NAMES: string[] = [...new Set([...POPULAR, ...Object.keys(groups), ...legacy])]
export const groupOf = (n: string) => groups[n] || (n === 'English Language' ? 'English' : 'Humanities')
export const GROUP_ORDER = GROUPS
export const tipFor = (n: string) => TIPS[n] || EXTRA.find(x => x.name === n)?.tip || (n === 'English Language' ? 'Plan for 5 minutes before you write. Vary sentence openings and keep one paragraph for each idea.' : BY_GROUP[groupOf(n)])
export const isSubject = (n: string) => ALL_NAMES.includes(n)
