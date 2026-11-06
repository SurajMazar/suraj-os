import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play } from 'lucide-react'
import { sounds } from '@/lib/sound'
import { useIsTouch } from '@/hooks/system'
import { IconButton } from '@/components/shared/ui'
import { GameOverlay, Kbd, Stat, StatBar } from '../GameUI'
import { isTypingTarget, useScores, useWindowActive } from '../scores'

/** The long side runs along the long side of the space: landscape in a window, portrait on a phone. */
const LONG = 21
const SHORT = 15
type Pt = { x: number; y: number }
type Dir = 'up' | 'down' | 'left' | 'right'
const STEP: Record<Dir, Pt> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}
const KEYS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
}
/** A golden commit appears every fifth byte, is worth 5 and expires after this many ticks. */
const BONUS_TICKS = 50

type Status = 'ready' | 'playing' | 'paused' | 'over'

interface World {
  cols: number
  rows: number
  snake: Pt[]
  dir: Dir
  queue: Dir[]
  food: Pt & { bit: 0 | 1 }
  bonus: (Pt & { ttl: number }) | null
  eaten: number
  /** Bytes are worth 1, golden commits 5. */
  points: number
}

function freeCell(w: Pick<World, 'snake' | 'cols' | 'rows'> & { food?: Pt; bonus?: Pt | null }): Pt {
  const taken = new Set(w.snake.map((p) => `${p.x},${p.y}`))
  if (w.food) taken.add(`${w.food.x},${w.food.y}`)
  if (w.bonus) taken.add(`${w.bonus.x},${w.bonus.y}`)
  const free: Pt[] = []
  for (let y = 0; y < w.rows; y++) for (let x = 0; x < w.cols; x++) if (!taken.has(`${x},${y}`)) free.push({ x, y })
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

function newWorld(portrait = false): World {
  const cols = portrait ? SHORT : LONG
  const rows = portrait ? LONG : SHORT
  const mid = Math.floor(rows / 2)
  const snake = [
    { x: 6, y: mid },
    { x: 5, y: mid },
    { x: 4, y: mid },
  ]
  return {
    cols,
    rows,
    snake,
    dir: 'right',
    queue: [],
    food: { ...freeCell({ snake, cols, rows }), bit: 1 },
    bonus: null,
    eaten: 0,
    points: 0,
  }
}

/** Faster as the snake grows: 130ms a step down to 65ms. */
const tickMs = (eaten: number) => Math.max(65, 130 - eaten * 3)

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.roundRect(x, y, w, h, r)
  c.fill()
}

export default function ByteSnake({ windowId }: { windowId: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const world = useRef<World>(newWorld())
  const [status, setStatus] = useState<Status>('ready')
  const [score, setScore] = useState(0)
  const [newBest, setNewBest] = useState(false)
  const best = useScores((s) => s.best.snake ?? 0)
  const active = useWindowActive(windowId)
  const touch = useIsTouch()
  const statusRef = useRef(status)
  statusRef.current = status

  const draw = useCallback(() => {
    const cv = canvas.current
    if (!cv) return
    const c = cv.getContext('2d')
    if (!c) return
    const css = getComputedStyle(cv)
    const v = (n: string) => css.getPropertyValue(n).trim()
    const w = world.current
    const cell = cv.width / w.cols
    c.clearRect(0, 0, cv.width, cv.height)
    // A faint checkerboard so speed and position read at a glance.
    c.fillStyle = v('--hover')
    for (let y = 0; y < w.rows; y++) for (let x = y % 2; x < w.cols; x += 2) c.fillRect(x * cell, y * cell, cell, cell)

    // Food: a byte with its bit on it.
    const f = w.food
    c.fillStyle = v('--sys-green')
    roundRect(c, f.x * cell + cell * 0.14, f.y * cell + cell * 0.14, cell * 0.72, cell * 0.72, cell * 0.2)
    c.fillStyle = '#fff'
    c.font = `700 ${Math.round(cell * 0.5)}px ${v('--font-mono') || 'monospace'}`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(String(f.bit), f.x * cell + cell / 2, f.y * cell + cell / 2 + cell * 0.03)

    // Bonus: a golden commit that blinks when it is about to go.
    const b = w.bonus
    if (b && (b.ttl > 12 || b.ttl % 2 === 0)) {
      c.fillStyle = v('--sys-orange')
      c.beginPath()
      c.arc(b.x * cell + cell / 2, b.y * cell + cell / 2, cell * 0.38, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#fff'
      c.beginPath()
      c.arc(b.x * cell + cell / 2, b.y * cell + cell / 2, cell * 0.13, 0, Math.PI * 2)
      c.fill()
    }

    // Snake: the head in full accent, the tail fading out.
    const accent = v('--accent')
    w.snake.forEach((p, i) => {
      c.globalAlpha = 1 - (i / Math.max(1, w.snake.length)) * 0.5
      c.fillStyle = accent
      const inset = i === 0 ? cell * 0.04 : cell * 0.1
      roundRect(c, p.x * cell + inset, p.y * cell + inset, cell - inset * 2, cell - inset * 2, cell * 0.28)
    })
    c.globalAlpha = 1
    // Eyes look where the head is going.
    const h = w.snake[0]
    const d = STEP[w.dir]
    c.fillStyle = '#fff'
    for (const side of [-1, 1]) {
      const ex = h.x * cell + cell / 2 + d.x * cell * 0.16 + (d.y ? side * cell * 0.18 : 0)
      const ey = h.y * cell + cell / 2 + d.y * cell * 0.16 + (d.x ? side * cell * 0.18 : 0)
      c.beginPath()
      c.arc(ex, ey, cell * 0.09, 0, Math.PI * 2)
      c.fill()
    }
  }, [])

  // Size the board to the space it has, keeping square cells and a crisp picture on Retina.
  useEffect(() => {
    const el = wrap.current
    const cv = canvas.current
    if (!el || !cv) return
    const fit = () => {
      const r = el.getBoundingClientRect()
      // Between rounds the board turns to match the space; mid-round it only scales.
      const portrait = r.height > r.width * 1.1
      if (statusRef.current !== 'playing' && statusRef.current !== 'paused' && portrait !== world.current.rows > world.current.cols) world.current = newWorld(portrait)
      const { cols, rows } = world.current
      const cell = Math.max(10, Math.floor(Math.min(r.width / cols, r.height / rows)))
      const dpr = window.devicePixelRatio || 1
      cv.style.width = `${cell * cols}px`
      cv.style.height = `${cell * rows}px`
      cv.width = cell * cols * dpr
      cv.height = cell * rows * dpr
      draw()
    }
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [draw])

  const finish = useCallback(() => {
    const final = world.current.points
    setNewBest(final > 0 && useScores.getState().record('snake', final))
    setStatus('over')
    sounds.error()
  }, [])

  const step = useCallback(() => {
    const w = world.current
    const next = w.queue.shift()
    if (next) w.dir = next
    const d = STEP[w.dir]
    const head = { x: w.snake[0].x + d.x, y: w.snake[0].y + d.y }
    const eating = head.x === w.food.x && head.y === w.food.y
    const body = eating ? w.snake : w.snake.slice(0, -1)
    if (head.x < 0 || head.y < 0 || head.x >= w.cols || head.y >= w.rows || body.some((p) => p.x === head.x && p.y === head.y)) {
      finish()
      return
    }
    w.snake = [head, ...body]
    if (eating) {
      w.eaten++
      w.points++
      w.food = { ...freeCell(w), bit: Math.random() < 0.5 ? 0 : 1 }
      if (w.eaten % 5 === 0 && !w.bonus) w.bonus = { ...freeCell(w), ttl: BONUS_TICKS }
      sounds.pop()
    }
    if (w.bonus) {
      if (head.x === w.bonus.x && head.y === w.bonus.y) {
        w.bonus = null
        w.points += 5
        sounds.toggleOn()
      } else if (--w.bonus.ttl <= 0) w.bonus = null
    }
    setScore(w.points)
    draw()
  }, [draw, finish])

  // The game loop: a timer whose pace follows the length of the snake.
  useEffect(() => {
    if (status !== 'playing') return
    let timer: ReturnType<typeof setTimeout>
    const loop = () => {
      step()
      if (statusRef.current === 'playing') timer = setTimeout(loop, tickMs(world.current.eaten))
    }
    timer = setTimeout(loop, tickMs(world.current.eaten))
    return () => clearTimeout(timer)
  }, [status, step])

  const start = useCallback(() => {
    const { cols, rows } = world.current
    world.current = newWorld(rows > cols)
    setScore(0)
    setNewBest(false)
    setStatus('playing')
    draw()
  }, [draw])

  const turn = useCallback(
    (dir: Dir) => {
      if (statusRef.current === 'ready' || statusRef.current === 'over') return start()
      if (statusRef.current === 'paused') setStatus('playing')
      const w = world.current
      const last = w.queue[w.queue.length - 1] ?? w.dir
      if (dir !== last && dir !== OPPOSITE[last] && w.queue.length < 2) w.queue.push(dir)
    },
    [start],
  )

  const togglePause = useCallback(() => {
    const s = statusRef.current
    if (s === 'playing') setStatus('paused')
    else if (s === 'paused') setStatus('playing')
    else start()
  }, [start])

  // Keys reach the game only while its window is in front.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      const dir = KEYS[e.code]
      if (dir) {
        e.preventDefault()
        turn(dir)
      } else if (e.code === 'Space' || e.code === 'KeyP') {
        e.preventDefault()
        togglePause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, turn, togglePause])

  // Moving to another window pauses the round, as games on a Mac do.
  useEffect(() => {
    if (!active && statusRef.current === 'playing') setStatus('paused')
  }, [active])

  // Swipes steer on touch screens.
  const swipe = useRef<Pt | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = swipe.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.hypot(dx, dy) < 18) return
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
    swipe.current = { x: e.clientX, y: e.clientY }
  }

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
        <Stat label="Best" value={Math.max(best, 0)} />
        <Stat label="Length" value={world.current.snake.length} />
      </StatBar>
      <div ref={wrap} className="relative mx-4 mb-4 flex min-h-0 flex-1 items-center justify-center">
        <canvas
          ref={canvas}
          className="touch-none rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (swipe.current = null)}
          onPointerCancel={() => (swipe.current = null)}
          role="img"
          aria-label={`Byte Snake board. Score ${score}.`}
        />
        {status === 'ready' && (
          <GameOverlay
            title="Byte Snake"
            body="Eat the bytes, grow longer, don’t hit the walls or yourself. Golden commits are worth 5, but they don’t wait."
            action="Start"
            onAction={start}
            secondary={
              touch ? (
                'Swipe on the board to steer.'
              ) : (
                <>
                  Arrow keys or <Kbd>W</Kbd>
                  <Kbd>A</Kbd>
                  <Kbd>S</Kbd>
                  <Kbd>D</Kbd> to steer, <Kbd>Space</Kbd> to pause.
                </>
              )
            }
          />
        )}
        {status === 'paused' && (
          <GameOverlay
            title="Paused"
            action="Resume"
            onAction={togglePause}
            secondary={
              touch ? undefined : (
                <>
                  Press <Kbd>Space</Kbd> to resume.
                </>
              )
            }
          />
        )}
        {status === 'over' && <GameOverlay title={newBest ? 'New best!' : 'Game over'} body={`You scored ${score}${newBest ? '' : `. Best: ${best}`}.`} action="Play again" onAction={start} />}
      </div>
      {touch && (
        <div className="mx-auto mb-[max(28px,env(safe-area-inset-bottom))] grid shrink-0 grid-cols-3 gap-1.5" aria-label="Direction pad">
          {(
            [
              ['up', <ArrowUp key="u" size={20} />, 'col-start-2'],
              ['left', <ArrowLeft key="l" size={20} />, 'col-start-1 row-start-2'],
              ['down', <ArrowDown key="d" size={20} />, 'col-start-2 row-start-2'],
              ['right', <ArrowRight key="r" size={20} />, 'col-start-3 row-start-2'],
            ] as const
          ).map(([dir, icon, pos]) => (
            <button
              key={dir}
              type="button"
              aria-label={`Turn ${dir}`}
              onPointerDown={() => turn(dir)}
              className={`grid h-12 w-12 place-items-center rounded-[12px] bg-[var(--surface-3)] text-[var(--text-2)] active:bg-[var(--hover)] ${pos}`}
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
