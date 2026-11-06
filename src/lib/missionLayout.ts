import type { Rect } from '@/types'

export interface MissionCell {
  /** Translation from the window's real position to its cell. */
  dx: number
  dy: number
  scale: number
  /** Cell center and scaled size, for labels. */
  cx: number
  cy: number
  sw: number
  sh: number
}

/** Lay windows out in a grid, keeping each one's aspect ratio. */
export function missionLayout(wins: (Rect & { id: string })[], vw: number, vh: number): Record<string, MissionCell> {
  const out: Record<string, MissionCell> = {}
  const n = wins.length
  if (!n) return out
  const cols = Math.ceil(Math.sqrt(n * (vw / vh) / 1.6))
  const rows = Math.ceil(n / cols)
  const top = 70
  const bottom = 120
  const side = 48
  const cellW = (vw - side * 2) / cols
  const cellH = (vh - top - bottom) / rows
  wins.forEach((w, i) => {
    const row = Math.floor(i / cols)
    const inRow = row === rows - 1 ? n - row * cols : cols
    const col = i % cols
    const rowOffset = ((cols - inRow) * cellW) / 2
    const cx = side + rowOffset + cellW * (col + 0.5)
    const cy = top + cellH * (row + 0.5) - 10
    const scale = Math.min((cellW * 0.84) / w.w, (cellH * 0.74) / w.h, 0.85)
    out[w.id] = {
      dx: cx - (w.x + w.w / 2),
      dy: cy - (w.y + w.h / 2),
      scale,
      cx,
      cy,
      sw: w.w * scale,
      sh: w.h * scale,
    }
  })
  return out
}
