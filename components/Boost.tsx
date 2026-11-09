'use client'
import { useState } from 'react'
import { sfx } from '@/lib/fx'
import type { Api } from './api'
import { Tables, Mental, Quadratic, Stats, Pythag, Fractions, Ohm, Molar, Bases, Caesar } from './BoostA'
import { Dictionary, TextLab, Timeline, MyCards, Reader, PetTab, Scores } from './BoostB'
import Classroom, { CLASS_TOOLS } from './Classroom'

type T = readonly [string, string]
const CATS: { k: string; l: string; tools: readonly T[] }[] = [
  { k: 'm', l: '➗ Maths', tools: [['tb', '✖️ Times tables'], ['mm', '🧮 Mental maths'], ['qd', '📐 Quadratics'], ['st', '📊 Statistics'], ['py', '🔺 Pythagoras'], ['fr', '½ Fractions']] },
  { k: 's', l: '🔬 Science', tools: [['oh', '⚡ Ohm’s law'], ['mo', '⚗️ Molar mass']] },
  { k: 'c', l: '💻 Computing', tools: [['bs', '🔢 Binary & hex'], ['cz', '🔐 Caesar cipher']] },
  { k: 'e', l: '✍️ English & more', tools: [['di', '📖 Dictionary'], ['tx', '📝 Text analyser'], ['tl', '🕰️ Timeline']] },
  { k: 'r', l: '🧠 Memory', tools: [['mc', '🗂️ My flashcards'], ['rd', '👀 Speed reader']] },
  { k: 'k', l: '🏫 Classroom & me', tools: [...CLASS_TOOLS, ['sb', '🏆 Scoreboard']] },
  { k: 'p', l: '🦉 Owl pet', tools: [['pt', '🥚 My owl pet']] },
]

export default function Boost({ api }: { api: Api }) {
  const [cat, setCat] = useState('m'); const [tool, setTool] = useState('tb')
  const c = CATS.find(x => x.k === cat) || CATS[0]
  const pickCat = (k: string) => { setCat(k); setTool(CATS.find(x => x.k === k)!.tools[0][0]); sfx('pop') }
  const mine = ['tb', 'mm', 'qd', 'st', 'py', 'fr', 'oh', 'mo', 'bs', 'cz', 'di', 'tx', 'tl', 'mc', 'rd', 'sb', 'pt']
  return <div>
    <div className="seg wrapseg cats" role="group" aria-label="Categories">{CATS.map(x => <button key={x.k} aria-pressed={cat === x.k} onClick={() => pickCat(x.k)}>{x.l}</button>)}</div>
    <div className="seg wrapseg sub" role="group" aria-label="Tools">{c.tools.map(([k, l]) => <button key={k} aria-pressed={tool === k} onClick={() => { setTool(k); sfx('pop') }}>{l}</button>)}</div>
    <div className="game" key={tool}>
      {tool === 'tb' && <Tables api={api} />}{tool === 'mm' && <Mental api={api} />}{tool === 'qd' && <Quadratic />}{tool === 'st' && <Stats />}{tool === 'py' && <Pythag />}{tool === 'fr' && <Fractions />}
      {tool === 'oh' && <Ohm />}{tool === 'mo' && <Molar />}{tool === 'bs' && <Bases />}{tool === 'cz' && <Caesar />}
      {tool === 'di' && <Dictionary />}{tool === 'tx' && <TextLab />}{tool === 'tl' && <Timeline />}
      {tool === 'mc' && <MyCards api={api} />}{tool === 'rd' && <Reader />}{tool === 'sb' && <Scores />}{tool === 'pt' && <PetTab api={api} />}
      {!mine.includes(tool) && <Classroom api={api} tool={tool} />}
    </div></div>
}
