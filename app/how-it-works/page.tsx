import fs from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'

export const dynamic = 'force-static'
export const metadata: Metadata = { title: 'How Wise Owl Study Buddy works', description: 'A step-by-step guide to how the Wise Owl Westgate Study Buddy is built: pages, database, live games, security and deployment.' }

// Code samples are read from the real source files at build time, so this guide can never drift from the code.
function ex(file: string, from: string, count: number, skip = 0): string {
  try {
    const lines = fs.readFileSync(path.join(process.cwd(), file), 'utf8').split('\n'); const i = lines.findIndex(l => l.includes(from))
    if (i < 0) return `// see ${file}`
    return lines.slice(i + skip, i + skip + count).map(l => l.length > 150 ? l.slice(0, 147) + '…' : l).join('\n')
  } catch { return `// see ${file}` }
}
const Code = ({ file, from, n, skip, lang }: { file: string; from: string; n: number; skip?: number; lang?: string }) => <figure className="dcode"><figcaption>{file}</figcaption><pre><code className={lang}>{ex(file, from, n, skip)}</code></pre></figure>
const Cmd = ({ children }: { children: string }) => <figure className="dcode"><figcaption>Terminal</figcaption><pre><code>{children}</code></pre></figure>
const H = ({ id, n, t }: { id: string; n?: number; t: string }) => <h2 id={id}>{n ? <span className="dn">{n}</span> : null}{t}</h2>

const TOC: [string, string][] = [['big-picture', 'The big picture'], ['tools', 'What you need'], ['s1', '1. Create the project'], ['s2', '2. The folder map'], ['s3', '3. One page, many tabs'], ['s4', '4. Saving progress on the device'], ['s5', '5. The tutor route'], ['s6', '6. Quizzes and the learning loop'], ['s7', '7. IGCSE paper finder'], ['s8', '8. The database'], ['s9', '9. League scoring'], ['s10', '10. Signing in without passwords'], ['s11', '11. Live quiz games'], ['s12', '12. Ratings and moderation'], ['s13', '13. Deploying'], ['s14', '14. Testing'], ['security', 'Security and honest limits'], ['glossary', 'Glossary']]

export default function HowItWorks() {
  return <main className="doc">
    <a className="docback" href="/">← Back to Study Buddy</a>
    <h1>How Wise Owl Study Buddy works</h1>
    <p className="lead">A complete walk-through of how the site is put together: what each part does, why it was built that way, and the real code behind it. You can follow it from the top to rebuild a version of your own.</p>
    <nav className="dtoc" aria-label="Contents"><b>Contents</b><ol>{TOC.map(([id, t]) => <li key={id}><a href={'#' + id}>{t}</a></li>)}</ol></nav>

    <H id="big-picture" t="The big picture" />
    <p>The site has three layers. Each has one job.</p>
    <figure className="dcode"><figcaption>How the pieces connect</figcaption><pre><code>{`  Student's phone or laptop (the browser)
  ┌─────────────────────────────────────────┐
  │ React pages and tabs (Next.js)          │──► saves progress in the browser (localStorage)
  └───────────────┬─────────────────────────┘
                  │ 1. "Ask the tutor", "mark my answer"
                  ▼
  ┌─────────────────────────────────────────┐
  │ Server route  /api/ai   (on Vercel)     │──► language-model service (only for tutor,
  │ holds the secret key, limits requests   │     quiz writing and marking)
  └─────────────────────────────────────────┘
                  │ 2. League, live games, ratings
                  ▼
  ┌─────────────────────────────────────────┐
  │ Database (Supabase / PostgreSQL)        │
  │ locked tables + permission-checked      │
  │ functions that do all scoring           │
  └─────────────────────────────────────────┘`}</code></pre></figure>
    <ul>
      <li><b>The browser</b> draws everything and remembers each student’s own progress (XP, streaks, mistakes) on their device.</li>
      <li><b>The server route</b> is the only place that talks to an external language-model service. It exists so the secret key is never sent to a student’s phone. The tutor, the quiz writer, the answer marker and the photo reader use it. Nothing else on the site does.</li>
      <li><b>The database</b> holds the shared things: the league, houses, live games and ratings. Students can never edit it directly. They can only call small, checked functions.</li>
    </ul>

    <H id="tools" t="What you need" />
    <ul><li><b>Node.js 20 or newer</b> and a code editor such as VS Code.</li><li><b>A GitHub account</b> to store the code.</li><li><b>A Vercel account</b> to host the site (free tier is enough).</li><li><b>A Supabase project</b> for the database (free tier is enough).</li><li><b>One secret key</b> for the tutor service, kept only on the server.</li></ul>
    <p className="note">Never put a secret key in the code, in a screenshot or in a message. It belongs in Vercel’s environment settings only (step 13).</p>

    <H id="s1" n={1} t="Create the project" />
    <Cmd>{`npx create-next-app@latest studybuddy --typescript --app --no-tailwind
cd studybuddy
npm install qrcode
npm run dev        # opens http://localhost:3000`}</Cmd>
    <p>Next.js 15 with the <b>App Router</b> means every folder inside <code>app/</code> becomes a web address, and <code>route.ts</code> files become server endpoints. TypeScript catches mistakes before the site ever runs.</p>
    <Code file="package.json" from='"dependencies"' n={7} />

    <H id="s2" n={2} t="The folder map" />
    <figure className="dcode"><figcaption>Where things live</figcaption><pre><code>{`app/
  layout.tsx            page shell, title, icons
  page.tsx              the whole app: header, subject bar, tab bar
  globals.css           all styling (light, dark and rainbow modes)
  about/ how-it-works/  extra pages
  api/ai/route.ts       the only server endpoint (tutor, quiz, marking)
components/             one file per tab or tool
  Ask.tsx Quiz.tsx Exam.tsx Cards.tsx Weak.tsx Review.tsx
  IgcseHub.tsx League.tsx LeagueAdmin.tsx Live.tsx Reviews.tsx Rewards.tsx
lib/                    plain logic with no screens
  progress.ts           XP, levels, badges, quests
  learn.ts              topic mastery + weak-spot detection
  igcse.ts              subjects, papers, component-number rules
  subjects.ts           the subject bar
  league.ts             talks to the database
  fx.ts                 sounds, confetti, speech
supabase/migrations/    every database change, with an "up" and a "down" file`}</code></pre></figure>
    <p><b>Rule of thumb:</b> screens go in <code>components/</code>, rules and data go in <code>lib/</code>. That keeps each file small enough to understand.</p>

    <H id="s3" n={3} t="One page, many tabs" />
    <p>The home page keeps one piece of state, the current tab, and shows one component for it. Switching tabs never reloads the page, so it feels instant on a phone.</p>
    <Code file="app/page.tsx" from="const TABS" n={4} />
    <Code file="app/page.tsx" from="{tab === 'weak'" n={2} />
    <p>The subject bar is built from one list. Picking a subject sets a single value that the tutor, quizzes, exam questions and weak-spot tracker all read.</p>
    <Code file="lib/subjects.ts" from="export const POPULAR" n={2} />

    <H id="s4" n={4} t="Saving progress on the device" />
    <p>Each student’s XP, streak, mistakes and notes are stored in the browser’s <code>localStorage</code>, under keys that start with <code>wob:</code>. No account is needed and nothing personal is sent anywhere.</p>
    <Code file="lib/api.ts" from="export const store" n={8} />
    <p><b>Hydration rule.</b> The server draws the page first, then the browser takes over. If the two disagree (for example, because the page printed today’s date) React complains. The fix used everywhere in this project: read <code>localStorage</code>, dates and <code>window</code> only inside <code>useEffect</code>, never while drawing.</p>

    <H id="s5" n={5} t="The tutor route" />
    <p>The browser sends a question to <code>/api/ai</code>. The route (running on the server) adds instructions, calls the language-model service with the secret key and returns the answer. This keeps the key private and lets us control what is allowed.</p>
    <Code file="app/api/ai/route.ts" from="Small per-visitor limit" n={7} />
    <ol>
      <li><b>Limit requests.</b> 20 per minute per visitor, so nobody can drain the school’s credit.</li>
      <li><b>Clean the input.</b> The subject name is checked against a safe pattern; message length and count are capped.</li>
      <li><b>Pick a mode.</b> <code>chat</code> returns text; <code>quiz</code>, <code>cards</code>, <code>exam</code> and <code>mark</code> ask for structured data and the route checks its shape before sending it back.</li>
      <li><b>Photos.</b> The browser shrinks a photo to about 1400 pixels, then sends it as base64 text. The route only accepts real image types and caps the size.</li>
    </ol>
    <Code file="components/Ask.tsx" from="async function shrink" n={6} />
    <p><b>Voice.</b> The browser’s built-in speech tools listen and speak. Before speaking, a clean-up function removes symbols such as <code>#</code> and <code>*</code> so they are never read aloud.</p>
    <Code file="lib/fx.ts" from="export function cleanForSpeech" n={6} />

    <H id="s6" n={6} t="Quizzes and the learning loop" />
    <p>Every quiz question carries a short topic tag. When a student answers, two things are saved on their device: a running score for that topic, and (if wrong) the question in a mistake notebook. Everything else grows from those two records.</p>
    <Code file="lib/learn.ts" from="export function recordTopic" n={5} />
    <p>The <b>weakness detector</b> is just a sorting rule over that data: a topic is weak if it is below 70% after at least two tries, or has two open mistakes. The worst topics go first.</p>
    <Code file="lib/learn.ts" from="export function weakSpots" n={13} />
    <p>From a weak topic the student can tap <b>Explain it</b> (opens the tutor with the topic filled in), <b>Quiz me</b> (starts a quiz on it) or <b>Make my revision plan</b>. The spaced review tab brings old mistakes back after 1, 3, 7, 14 and 30 days. This is the loop: <i>struggle → explanation → quiz → saved mistakes → plan → improvement</i>.</p>

    <H id="s7" n={7} t="IGCSE paper finder" />
    <p>Cambridge component numbers follow a pattern. In <code>22</code>, the first digit is the <b>paper</b> and the second is the <b>variant</b> (1 to 3). Codes that start with 0 are single components with no variants. The finder turns that rule into code so it can explain any number the student types.</p>
    <Code file="lib/igcse.ts" from="export function parseComp" n={14} />
    <p>Past papers are copyrighted, so the site never hosts them. It builds the exact file name (for example <code>0580_s24_qp_22</code>) and links to Cambridge’s official page or to a search for that file.</p>

    <H id="s8" n={8} t="The database" />
    <p>Shared data lives in a PostgreSQL database on Supabase. The key idea is <b>lock everything, then open small doors</b>.</p>
    <ol>
      <li>Every table has Row Level Security switched on and no direct access for the public. A visitor cannot read or change any row.</li>
      <li>All reading and writing goes through <b>functions</b> marked <code>security definer</code>. They run with the database’s own permissions but check who is calling and what is allowed.</li>
      <li>The browser calls those functions through one tiny helper:</li>
    </ol>
    <Code file="lib/league.ts" from="export async function rpc" n={7} />
    <p>The scoring table is an <b>append-only ledger</b>. Points are never edited. A correction is a new line with a reason, so the history is always honest. The last line makes it impossible to pay the same activity twice.</p>
    <Code file="supabase/migrations/20261110_league_v1_up.sql" from="create table public.lg_ledger" n={14} lang="sql" />
    <p>Every change to the database is a numbered file in <code>supabase/migrations/</code> with a matching <b>down</b> file that undoes it, so the school can roll back safely.</p>

    <H id="s9" n={9} t="League scoring" />
    <p>There are two separate scores: <b>individual points</b> (the student’s own ranking) and <b>house points</b> (Barn, Verraux and Tawny). One activity can add to both using the same transparent rule table, which anyone can read on the Rules page.</p>
    <ul><li><b>Competitions</b> are graded inside the database from the stored answers. The browser never sends a score.</li><li><b>Practice</b> (AI quizzes, missions, streaks) is reported by the browser, so it is capped each day and can be corrected by a teacher.</li><li><b>House points</b> follow the student’s <i>current</i> house, so fixing a wrong house fixes the totals.</li><li><b>Seasons</b>: only one can be active. Ending a season freezes the winners into the Hall of Fame.</li><li><b>Time</b> is worked out in Africa/Harare so “this week” matches the school calendar.</li></ul>
    <p>Teachers and admins sign in with their existing staff accounts. The database re-checks their role on every single action, and every correction is written to an audit log with a reason.</p>

    <H id="s10" n={10} t="Signing in without passwords" />
    <p>Students are not given accounts. They pick their name from the class list <b>once</b>. The database then creates a long random secret, stores only a fingerprint (hash) of it, and gives the secret to that device. From then on the device proves who it is with the secret.</p>
    <Code file="supabase/migrations/20261111_league_v2_live_up.sql" from="create or replace function public.lg_claim" n={14} lang="sql" />
    <p>Because a name can be claimed only once, nobody can join twice. If a phone is lost, an admin resets that name and the student claims it again. Wrong guesses of the older 8-character student code are counted and blocked after 30 tries in 10 minutes.</p>

    <H id="s11" n={11} t="Live quiz games" />
    <p>A live game behaves like a small machine with four states: <b>lobby → question → reveal → finished</b>. The host presses buttons to move it forward. The database is the referee; screens only display what it says.</p>
    <ol>
      <li><b>Create.</b> The host sends the title and questions. The database cleans them, makes a random 6-digit PIN and stores the game.</li>
      <li><b>Join.</b> Players enter the PIN. The database checks their secret and adds them once. The host can join as a player too.</li>
      <li><b>Ask a question.</b> The database stamps the start time. Players receive the question and options but <i>not</i> the answer.</li>
      <li><b>Answer.</b> The database measures the time itself (a phone’s clock cannot be trusted), marks the answer and scores it. Faster correct answers earn more, from 1000 down to 500.</li>
      <li><b>Reveal.</b> The correct answer, how many chose each option, an explanation and the top five appear.</li>
      <li><b>Finish.</b> League points are paid once, with each game’s own reference so it cannot be paid twice.</li>
    </ol>
    <Code file="supabase/migrations/20261111_league_v2_live_up.sql" from="v_ms := least(g.q_secs * 1000" n={4} lang="sql" />
    <p><b>Keeping the screen smooth.</b> Players and the host ask for the game’s state about once a second. Two things stop the leaderboard from stuttering:</p>
    <ul><li>The countdown runs in its own small component, so the rest of the screen redraws only when the game really changes, not ten times a second.</li><li>The state is compared before it is shown. If nothing changed, the screen is left alone. The countdown hitting zero triggers an immediate check, so the reveal appears right away.</li></ul>
    <Code file="components/Live.tsx" from="function Timer" n={5} />
    <p>When everyone has answered, the host’s screen moves to the reveal automatically, just like the games students already know.</p>

    <H id="s12" n={12} t="Ratings and moderation" />
    <p>Anyone can rate the site from 1 to 5 stars without signing in. To stop the same browser voting twice, the page makes a random id and keeps it in <code>localStorage</code>; one id can have one rating, which it can edit. A written comment is optional and only appears after a teacher approves it in the staff panel. Links are blocked and each network can only add a limited number of new ratings per day.</p>
    <Code file="components/Reviews.tsx" from="function deviceId" n={3} />

    <H id="s13" n={13} t="Deploying" />
    <ol>
      <li><b>Push to GitHub.</b><Cmd>{`git add -A
git commit -m "My change"
git push`}</Cmd></li>
      <li><b>Import the repository in Vercel.</b> Choose the Next.js preset. Every push to <code>main</code> becomes a new version of the live site.</li>
      <li><b>Add environment variables</b> in Vercel → Project → Settings → Environment Variables:
        <ul><li><code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>: public values, safe in the browser because the database is locked.</li><li>The tutor service key: <b>server only</b>, never starting with <code>NEXT_PUBLIC_</code>.</li></ul>
        Variables that start with <code>NEXT_PUBLIC_</code> are baked in at build time, so redeploy after changing them.</li>
      <li><b>Run the migrations</b> in the Supabase SQL editor, oldest first. Keep the matching <code>down</code> files for roll-backs.</li>
      <li><b>Open the site</b> and check the tabs, then the Competitions tab and the Staff panel with a staff login.</li>
    </ol>

    <H id="s14" n={14} t="Testing" />
    <ul>
      <li><b>Types and build.</b> <code>npx tsc --noEmit</code> and <code>npx next build</code> must pass before every release.</li>
      <li><b>Database logic.</b> Scoring and permissions are tested with SQL that does the whole scenario (claim a name, host a game, answer, finish) and then <b>rolls back</b>, so tests leave no data behind. It checks that wrong answers score nothing, double answers are refused, late answers are refused and outsiders are blocked.</li>
      <li><b>Screens.</b> A browser script opens each tab at phone width and desktop width and fails on any console error.</li>
      <li><b>Real use.</b> Before a competition, run a practice game with a few students on their own phones.</li>
    </ul>

    <H id="security" t="Security and honest limits" />
    <ul>
      <li>Tables are closed to the public; all access is through checked functions.</li>
      <li>Students cannot change their own scores or houses. Competition scoring happens in the database.</li>
      <li>Only first name and last initial are shown publicly, and students can hide even that.</li>
      <li>The secret key never reaches the browser.</li>
      <li>Anyone holding a device’s stored secret can act as that student, so students should not share phones while signed in. Admins can reset a name at any time.</li>
      <li>Practice points come from the browser, so they are capped and correctable. Teacher-hosted competitions are the trusted source for prizes.</li>
      <li>Ratings are one per browser. Someone who clears their browser data could rate again, which is why comments are moderated.</li>
      <li>Practice questions written by the tutor can contain mistakes. They are labelled and are not official Cambridge material.</li>
      <li>Wise Owl is not affiliated with Cambridge University Press &amp; Assessment. Always check papers, marks and dates on the official syllabus.</li>
    </ul>

    <H id="glossary" t="Glossary" />
    <dl className="dgloss">
      <dt>Next.js</dt><dd>A framework that turns React components into web pages and server routes.</dd>
      <dt>Component</dt><dd>A reusable piece of screen, such as a quiz or a leaderboard.</dd>
      <dt>State</dt><dd>Data a component remembers while it is on screen.</dd>
      <dt>localStorage</dt><dd>A small store inside the browser that survives closing the page.</dd>
      <dt>Hydration</dt><dd>The moment the browser attaches React to the already-drawn page.</dd>
      <dt>API route</dt><dd>A function that runs on the server and answers requests from the browser.</dd>
      <dt>Environment variable</dt><dd>A setting (often a secret) kept outside the code.</dd>
      <dt>Row Level Security</dt><dd>A database rule that decides which rows a caller may touch.</dd>
      <dt>Security definer function</dt><dd>A database function that runs with extra power but checks the caller itself.</dd>
      <dt>Ledger</dt><dd>A list where lines are only ever added, never edited.</dd>
      <dt>Hash</dt><dd>A one-way fingerprint of a secret, so the secret itself is never stored.</dd>
      <dt>Migration</dt><dd>A saved, numbered database change with an undo file.</dd>
      <dt>Polling</dt><dd>Asking the server for the latest state every second or so.</dd>
    </dl>
    <p className="note">Ideas by Michael Makadzange · Code by Jayden Ngwenya · Motivation by Emmanuel Makhubo</p>
  </main>
}
