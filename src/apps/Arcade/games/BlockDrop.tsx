import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ChevronsDown, Pause, Play, RotateCw } from 'lucide-react'
import { sounds } from '@/lib/sound'
import { discover } from '@/lib/easterEggs'
import { useIsTouch } from '@/hooks/system'
import { IconButton } from '@/components/shared/ui'
import { GameOverlay, Kbd, Stat, StatBar } from '../GameUI'
import { isTypingTarget, useScores, useWindowActive } from '../scores'

const W = 10
const H = 20
type Grid = (number | 0)[][]
type Status = 'ready' | 'playing' | 'paused' | 'over'

/** Seven shapes of four squares, each with its own colour from the SurajOS palette. */
const SHAPES: number[][][] = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
]
const COLORS = ['', '#5e5ce6', '#ff9f0a', '#bf5af2', '#0a84ff', '#ff6482', '#30d158', '#64d2ff']

interface Piece {
  shape: number[][]
  color: number
  x: number
  y: number
}

const empty = (): Grid => Array.from({ length: H }, () => Array<number>(W).fill(0))
const rotate = (m: number[][]) => m[0].map((_, i) => m.map((row) => row[i]).reverse())

/** A shuffled bag of all seven, so no shape is starved for long. */
function bag() {
  const b = [0, 1, 2, 3, 4, 5, 6]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

const spawn = (i: number): Piece => ({ shape: SHAPES[i], color: i + 1, x: Math.floor((W - SHAPES[i][0].length) / 2), y: i === 0 ? -1 : 0 })

function fits(grid: Grid, p: Piece, dx = 0, dy = 0, shape = p.shape) {
  return shape.every((row, r) =>
    row.every((v, c) => {
      if (!v) return true
      const x = p.x + c + dx
      const y = p.y + r + dy
      return x >= 0 && x < W && y < H && (y < 0 || !grid[y][x])
    }),
  )
}

const POINTS = [0, 100, 300, 500, 800]
/** Each level drops faster, from 0.8s a row down to a tenth of that. */
const dropMs = (level: number) => Math.max(80, 800 * Math.pow(0.85, level - 1))

export default function BlockDrop({ windowId }: { windowId: string }) {
  const [grid, setGrid] = useState<Grid>(empty)
  const [piece, setPiece] = useState<Piece | null>(null)
  const [queue, setQueue] = useState<number[]>(bag)
  const [status, setStatus] = useState<Status>('ready')
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [flash, setFlash] = useState<number[]>([])
  const [newBest, setNewBest] = useState(false)
  const best = useScores((s) => s.best.blocks ?? 0)
  const active = useWindowActive(windowId)
  const touch = useIsTouch()
  const level = Math.floor(lines / 10) + 1

  // The latest state for the timer and key handlers, which outlive a render.
  const st = useRef({ grid, piece, queue, status, score, lines })
  st.current = { grid, piece, queue, status, score, lines }

  const nextPiece = (q: number[]) => {
    const rest = q.length < 8 ? [...q, ...bag()] : q
    return { piece: spawn(rest[0]), queue: rest.slice(1) }
  }

  const start = useCallback(() => {
    const n = nextPiece(bag())
    setGrid(empty())
    setPiece(n.piece)
    setQueue(n.queue)
    setScore(0)
    setLines(0)
    setNewBest(false)
    setStatus('playing')
  }, [])

  /** Fix the piece in place, clear full rows, and bring in the next one. */
  const lock = useCallback((p: Piece, bonus = 0) => {
    const { grid: g, queue: q, score: sc, lines: ln } = st.current
    const next = g.map((row) => [...row])
    let above = false
    p.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (!v) return
        if (p.y + r < 0) above = true
        else next[p.y + r][p.x + c] = p.color
      }),
    )
    const full = next.map((row, i) => (row.every(Boolean) ? i : -1)).filter((i) => i >= 0)
    const kept = next.filter((_, i) => !full.includes(i))
    const cleared = [...Array.from({ length: full.length }, () => Array<number>(W).fill(0)), ...kept]
    const lvl = Math.floor(ln / 10) + 1
    const gained = POINTS[full.length] * lvl + bonus
    setGrid(cleared)
    setScore(sc + gained)
    setLines(ln + full.length)
    if (full.length) {
      setFlash(full)
      setTimeout(() => setFlash([]), 180)
      if (full.length === 4) {
        sounds.sent()
        discover('tetra')
      }
      else sounds.pop()
    } else sounds.click()
    const n = nextPiece(q)
    if (above || !fits(cleared, n.piece)) {
      setPiece(null)
      setStatus('over')
      setNewBest(sc + gained > 0 && useScores.getState().record('blocks', sc + gained))
      sounds.error()
      return
    }
    setPiece(n.piece)
    setQueue(n.queue)
  }, [])

  const move = useCallback(
    (dx: number, dy: number) => {
      const { grid: g, piece: p, status: s } = st.current
      if (s !== 'playing' || !p) return false
      if (fits(g, p, dx, dy)) {
        setPiece({ ...p, x: p.x + dx, y: p.y + dy })
        return true
      }
      if (dy > 0) lock(p)
      return false
    },
    [lock],
  )

  const turn = useCallback(() => {
    const { grid: g, piece: p, status: s } = st.current
    if (s !== 'playing' || !p) return
    const shape = rotate(p.shape)
    // Nudge sideways (then up) when a turn would hit a wall or another block.
    for (const [kx, ky] of [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
    ]) {
      if (fits(g, p, kx, ky, shape)) {
        setPiece({ ...p, shape, x: p.x + kx, y: p.y + ky })
        return
      }
    }
  }, [])

  const hardDrop = useCallback(() => {
    const { grid: g, piece: p, status: s } = st.current
    if (s !== 'playing' || !p) return
    let d = 0
    while (fits(g, p, 0, d + 1)) d++
    lock({ ...p, y: p.y + d }, d * 2)
  }, [lock])

  const togglePause = useCallback(() => {
    const s = st.current.status
    if (s === 'playing') setStatus('paused')
    else if (s === 'paused') setStatus('playing')
    else start()
  }, [start])

  // Gravity.
  useEffect(() => {
    if (status !== 'playing') return
    const t = setInterval(() => move(0, 1), dropMs(level))
    return () => clearInterval(t)
  }, [status, level, move])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      const map: Record<string, () => unknown> = {
        ArrowLeft: () => move(-1, 0),
        KeyA: () => move(-1, 0),
        ArrowRight: () => move(1, 0),
        KeyD: () => move(1, 0),
        ArrowDown: () => move(0, 1) && setScore((s) => s + 1),
        KeyS: () => move(0, 1) && setScore((s) => s + 1),
        ArrowUp: turn,
        KeyW: turn,
        KeyX: turn,
        Space: () => (st.current.status === 'playing' ? hardDrop() : togglePause()),
        KeyP: togglePause,
        Escape: () => st.current.status === 'playing' && setStatus('paused'),
      }
      const fn = map[e.code]
      if (!fn) return
      e.preventDefault()
      fn()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, move, turn, hardDrop, togglePause])

  useEffect(() => {
    if (!active && st.current.status === 'playing') setStatus('paused')
  }, [active])

  // Where the piece would land, drawn as an outline.
  let ghost = 0
  if (piece) while (fits(grid, piece, 0, ghost + 1)) ghost++
  const cells = grid.map((row) => [...row]) as number[][]
  const ghostCells = new Set<string>()
  if (piece)
    piece.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (!v) return
        if (piece.y + r + ghost >= 0) ghostCells.add(`${piece.y + r + ghost},${piece.x + c}`)
        if (piece.y + r >= 0) cells[piece.y + r][piece.x + c] = piece.color
      }),
    )

  const next = SHAPES[queue[0]]

  return (
    <div className="flex h-full flex-col">
      <StatBar
        right={
          status === 'playing' || status === 'paused' ? (
            <IconButton label={status === 'paused' ? 'Resume' : 'Pause'} onClick={togglePause}>
              {status === 'paused' ? <Play size={15} /> : <Pause size={15} />}
            </IconButton>
          ) : null
        }
      >
        <Stat label="Score" value={score} />
        <Stat label="Lines" value={lines} />
        <Stat label="Level" value={level} />
        <Stat label="Best" value={best} />
      </StatBar>

      <div className="relative mx-4 mb-3 flex min-h-0 flex-1 items-center justify-center gap-4" style={{ containerType: 'size' }}>
        <div
          className="grid touch-none gap-px rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] p-1"
          style={{ gridTemplateColumns: `repeat(${W}, 1fr)`, width: 'min(100cqh * 0.5, 100cqw - 90px, 340px)', aspectRatio: '1 / 2' }}
          role="img"
          aria-label={`Block Drop board. Score ${score}, ${lines} lines.`}
        >
          {cells.flatMap((row, y) =>
            row.map((v, x) => {
              const isGhost = !v && ghostCells.has(`${y},${x}`)
              return (
                <div
                  key={`${y}-${x}`}
                  className={`rounded-[3px] ${flash.includes(y) ? 'bg-white' : ''}`}
                  style={
                    flash.includes(y)
                      ? undefined
                      : v
                        ? { background: COLORS[v], boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), inset 0 -2px 0 rgba(0,0,0,.18)' }
                        : isGhost
                          ? { boxShadow: `inset 0 0 0 1.5px ${COLORS[piece!.color]}`, opacity: 0.6 }
                          : { background: (x + y) % 2 ? 'var(--hover)' : 'transparent' }
                  }
                />
              )
            }),
          )}
        </div>
        <div className="flex w-[74px] shrink-0 flex-col gap-1.5 self-start pt-1">
          <div className="text-[11px] font-medium text-[var(--text-3)]">Next</div>
          <div className="grid h-[62px] place-items-center rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)]">
            {next && status !== 'ready' ? (
              <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${next[0].length}, 12px)` }}>
                {next.flatMap((row, r) => row.map((v, c) => <div key={`${r}${c}`} className="h-3 w-3 rounded-[2px]" style={{ background: v ? COLORS[queue[0] + 1] : 'transparent' }} />))}
              </div>
            ) : null}
          </div>
        </div>
        {status === 'ready' && (
          <GameOverlay
            title="Block Drop"
            body="Slide and turn the falling blocks to fill whole rows. Full rows clear; clear four at once for the big score."
            action="Start"
            onAction={start}
            secondary={
              touch ? (
                'Use the buttons below the board.'
              ) : (
                <>
                  <Kbd>←</Kbd> <Kbd>→</Kbd> move, <Kbd>↑</Kbd> turn, <Kbd>↓</Kbd> soft drop, <Kbd>Space</Kbd> drop, <Kbd>P</Kbd> pause.
                </>
              )
            }
          />
        )}
        {status === 'paused' && <GameOverlay title="Paused" action="Resume" onAction={togglePause} />}
        {status === 'over' && <GameOverlay title={newBest ? 'New best!' : 'Stacked out'} body={`${score} points, ${lines} lines, level ${level}.${newBest ? '' : ` Best: ${best}.`}`} action="Play again" onAction={start} />}
      </div>

      {touch && (
        <div className="flex shrink-0 justify-center gap-2 px-4 pb-[max(34px,env(safe-area-inset-bottom))]" aria-label="Controls">
          {(
            [
              ['Move left', <ArrowLeft key="l" size={20} />, () => move(-1, 0)],
              ['Turn', <RotateCw key="t" size={20} />, turn],
              ['Move down', <ArrowDown key="d" size={20} />, () => move(0, 1)],
              ['Drop', <ChevronsDown key="h" size={20} />, hardDrop],
              ['Move right', <ArrowRight key="r" size={20} />, () => move(1, 0)],
            ] as const
          ).map(([label, icon, fn]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onPointerDown={(e) => (e.preventDefault(), fn())}
              className="grid h-12 w-12 place-items-center rounded-[12px] bg-[var(--surface-3)] text-[var(--text-2)] active:bg-[var(--hover)]"
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
