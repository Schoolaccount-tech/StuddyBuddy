// Look & feel settings: text size, easy-read spacing, high contrast, calm mode and a custom colour.
import { store } from './api'
export type Look = { size: number; dys: boolean; hc: boolean; calm: boolean; color: string }
export const LOOK_DEFAULT: Look = { size: 100, dys: false, hc: false, calm: false, color: '' }

export function readLook(): Look {
  const l = store.get<Partial<Look>>('look', {})
  const o = l && typeof l === 'object' ? l : {}
  const size = Number(o.size); const color = typeof o.color === 'string' && /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : ''
  return { size: size >= 80 && size <= 160 ? size : 100, dys: !!o.dys, hc: !!o.hc, calm: !!o.calm, color }
}
export function applyLook(l: Look) {
  try {
    const h = document.documentElement
    h.style.setProperty('--fz', String(l.size / 100))
    l.dys ? (h.dataset.dys = '1') : delete h.dataset.dys
    l.hc ? (h.dataset.hc = '1') : delete h.dataset.hc
    l.calm ? (h.dataset.calm = '1') : delete h.dataset.calm
    if (l.color) {
      const n = parseInt(l.color.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      h.style.setProperty('--owl', l.color); h.style.setProperty('--owl-ink', lum > 0.55 ? '#14183a' : '#ffffff')
    } else { h.style.removeProperty('--owl'); h.style.removeProperty('--owl-ink') }
  } catch {}
}
export function saveLook(l: Look) { store.set('look', l); applyLook(l) }
