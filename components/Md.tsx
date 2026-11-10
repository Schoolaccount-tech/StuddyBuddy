'use client'
import type { ReactNode } from 'react'

// Tiny, safe markdown renderer: no raw HTML is ever inserted, so chat replies cannot inject anything.
function inline(s: string, key: string): ReactNode[] {
  const out: ReactNode[] = []; const re = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_|\[[^\]]+\]\(https?:[^)\s]+\))/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    const t = m[0], k = `${key}-${i++}`
    if (t.startsWith('**') || t.startsWith('__')) out.push(<strong key={k}>{inline(t.slice(2, -2), k)}</strong>)
    else if (t[0] === '`') out.push(<code key={k}>{t.slice(1, -1)}</code>)
    else if (t[0] === '*' || t[0] === '_') out.push(<em key={k}>{inline(t.slice(1, -1), k)}</em>)
    else { const mm = t.match(/^\[([^\]]+)\]\((.+)\)$/)!; out.push(<a key={k} href={mm[2]} target="_blank" rel="noopener noreferrer">{mm[1]}</a>) }
    last = m.index + t.length
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

export default function Md({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n'); const blocks: ReactNode[] = []; let i = 0, n = 0
  const key = () => 'b' + n++
  while (i < lines.length) {
    const l = lines[i]
    if (/^\s*```/.test(l)) { const buf: string[] = []; i++; while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]); i++; blocks.push(<pre key={key()}><code>{buf.join('\n')}</code></pre>); continue }
    const h = l.match(/^\s{0,3}(#{1,6})\s+(.*)$/)
    if (h) { blocks.push(<p key={key()} className={'mdh h' + Math.min(3, h[1].length)}>{inline(h[2], 'h' + n)}</p>); i++; continue }
    if (/^\s*([-*+•])\s+/.test(l)) { const items: string[] = []; while (i < lines.length && /^\s*([-*+•])\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*+•])\s+/, '')); const k = key(); blocks.push(<ul key={k}>{items.map((x, j) => <li key={j}>{inline(x, k + j)}</li>)}</ul>); continue }
    if (/^\s*\d+[.)]\s+/.test(l)) { const items: string[] = []; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, '')); const k = key(); blocks.push(<ol key={k}>{items.map((x, j) => <li key={j}>{inline(x, k + j)}</li>)}</ol>); continue }
    if (/^\s*>\s?/.test(l)) { const buf: string[] = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, '')); blocks.push(<blockquote key={key()}>{inline(buf.join(' '), 'q' + n)}</blockquote>); continue }
    if (/^\s*\|.*\|\s*$/.test(l)) {
      const rows: string[][] = []; while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { const r = lines[i++]; if (!/^\s*\|?[\s:|-]+\|?\s*$/.test(r) || !/-{2,}/.test(r)) rows.push(r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())) }
      const k = key(); blocks.push(<div key={k} className="mdt"><table><tbody>{rows.map((r, j) => <tr key={j}>{r.map((c, x) => j === 0 ? <th key={x}>{inline(c, k + j + x)}</th> : <td key={x}>{inline(c, k + j + x)}</td>)}</tr>)}</tbody></table></div>); continue
    }
    if (!l.trim()) { i++; continue }
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() && !/^\s*(```|#{1,6}\s|([-*+•]|\d+[.)])\s|>|\|)/.test(lines[i])) buf.push(lines[i++])
    if (!buf.length) buf.push(lines[i++])
    const k = key(); blocks.push(<p key={k}>{buf.flatMap((x, j) => j ? [<br key={'br' + j} />, ...inline(x, k + j)] : inline(x, k + j))}</p>)
  }
  return <div className="md">{blocks}</div>
}
