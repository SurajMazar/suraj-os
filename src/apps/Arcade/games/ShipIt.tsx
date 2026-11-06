import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, Pause, Play } from 'lucide-react'
import { sounds } from '@/lib/sound'
import { discover } from '@/lib/easterEggs'
import { useIsDark, useIsTouch } from '@/hooks/system'
import { IconButton } from '@/components/shared/ui'
import { GameOverlay, Kbd, Stat, StatBar } from '../GameUI'
import { isTypingTarget, useScores, useWindowActive } from '../scores'

/*
 * Ship It: an original side-scrolling platformer. A developer in a hoodie runs
 * to the launch pad, collecting commits, hopping over merge conflicts and
 * stomping bugs. Everything is drawn in code; nothing is borrowed.
 */

const T = 32
const ROWS = 14
const COLS = 168

type Status = 'ready' | 'playing' | 'paused' | 'won' | 'over'

interface Level {
  tiles: string[][]
  start: { x: number; y: number }
  checkpoints: number[]
  enemies: { x: number; y: number }[]
  commits: { x: number; y: number }[]
  rocket: number
}

/** The course, laid out in code so it reads as a list of set pieces. */
function buildLevel(): Level {
  const tiles = Array.from({ length: ROWS }, () => Array<string>(COLS).fill(' '))
  const enemies: Level['enemies'] = []
  const commits: Level['commits'] = []
  const ground = (x0: number, x1: number, h = 2) => {
    for (let x = x0; x <= x1; x++) for (let y = ROWS - h; y < ROWS; y++) tiles[y][x] = '#'
  }
  const block = (x0: number, x1: number, y: number) => {
    for (let x = x0; x <= x1; x++) tiles[y][x] = 'B'
  }
  const spikes = (x0: number, x1: number, y = ROWS - 3) => {
    for (let x = x0; x <= x1; x++) tiles[y][x] = '^'
  }
  const row = (x0: number, x1: number, y: number) => {
    for (let x = x0; x <= x1; x++) commits.push({ x, y })
  }
  /** Enemies stand on whatever is below them. */
  const bug = (x: number, surface = ROWS - 2) => enemies.push({ x, y: surface })

  // 1. A gentle start: commits on the floor, a first bug, a first ledge.
  ground(0, 28)
  row(6, 9, 10)
  bug(17)
  block(12, 15, 8)
  row(12, 15, 7)
  // 2. A gap, then stairs.
  ground(32, 55)
  row(29, 31, 8)
  ground(40, 41, 3)
  ground(42, 43, 4)
  ground(44, 45, 5)
  row(42, 45, 7)
  bug(38)
  bug(50)
  // 3. Checkpoint, floating blades and the first merge conflicts.
  ground(59, 80)
  block(64, 68, 8)
  row(64, 68, 7)
  spikes(72, 73)
  bug(70)
  bug(77)
  // 4. Stepping stones over a wide gap.
  block(83, 84, 9)
  row(83, 84, 8)
  block(88, 89, 7)
  ground(92, 112)
  block(95, 96, 9)
  block(98, 104, 6)
  row(98, 104, 5)
  bug(101)
  bug(108)
  spikes(105, 106)
  // 5. The last run: a hill, a final pair of bugs, the launch pad.
  ground(116, COLS - 1)
  ground(124, 125, 3)
  ground(126, 127, 4)
  ground(128, 131, 5)
  row(126, 131, 7)
  ground(132, 133, 4)
  ground(134, 135, 3)
  bug(140)
  bug(146)
  block(142, 145, 8)
  row(142, 145, 7)

  return { tiles, start: { x: 2, y: ROWS - 3 }, checkpoints: [60, 93, 117], enemies, commits, rocket: 156 }
}

const solid = (c: string | undefined) => c === '#' || c === 'B'

interface Body {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
}

interface Bug extends Body {
  alive: boolean
  squash: number
}

interface World {
  level: Level
  p: Body & { ground: boolean; coyote: number; buffer: number; face: 1 | -1; hurt: number; step: number }
  bugs: Bug[]
  got: Set<number>
  checkpoint: number
  lives: number
  score: number
  frame: number
  camera: number
  started: number
  won: boolean
}

const PW = 20
const PH = 28

function spawnPlayer(xTile: number): World['p'] {
  return { x: xTile * T + 6, y: (ROWS - 2) * T - PH - 40, w: PW, h: PH, vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, face: 1, hurt: 0, step: 0 }
}

function newWorld(): World {
  const level = buildLevel()
  const surfaceOf = (x: number, from: number) => {
    let y = from
    while (y > 0 && solid(level.tiles[y - 1]?.[x])) y--
    return y
  }
  return {
    level,
    p: spawnPlayer(level.start.x),
    bugs: level.enemies.map((e) => ({ x: e.x * T + 3, y: surfaceOf(e.x, e.y) * T - 18, w: 26, h: 18, vx: -0.9, vy: 0, alive: true, squash: 0 })),
    got: new Set(),
    checkpoint: level.start.x,
    lives: 3,
    score: 0,
    frame: 0,
    camera: 0,
    started: 0,
    won: false,
  }
}

const tileAt = (w: World, px: number, py: number) => {
  const x = Math.floor(px / T)
  const y = Math.floor(py / T)
  if (x < 0 || x >= COLS) return '#'
  if (y < 0) return ' '
  return w.level.tiles[y]?.[x] ?? ' '
}

/** Move a body one axis at a time and stop it at walls, floors and ceilings. */
function collide(w: World, b: Body, axis: 'x' | 'y') {
  const l = Math.floor(b.x / T)
  const r = Math.floor((b.x + b.w - 0.01) / T)
  const top = Math.floor(b.y / T)
  const bot = Math.floor((b.y + b.h - 0.01) / T)
  let hit = false
  for (let ty = top; ty <= bot; ty++)
    for (let tx = l; tx <= r; tx++) {
      if (!solid(tileAt(w, tx * T + 1, ty * T + 1))) continue
      hit = true
      if (axis === 'x') {
        if (b.vx > 0) b.x = tx * T - b.w
        else if (b.vx < 0) b.x = (tx + 1) * T
      } else {
        if (b.vy > 0) b.y = ty * T - b.h
        else if (b.vy < 0) b.y = (ty + 1) * T
      }
    }
  return hit
}

const overlap = (a: Body, b: Body) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export default function ShipIt({ windowId }: { windowId: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const world = useRef<World>(newWorld())
  const keys = useRef({ left: false, right: false, jump: false })
  const [status, setStatus] = useState<Status>('ready')
  const [hud, setHud] = useState({ score: 0, commits: 0, lives: 3 })
  const [result, setResult] = useState({ score: 0, newBest: false, time: 0 })
  const best = useScores((s) => s.best.shipit ?? 0)
  const active = useWindowActive(windowId)
  const touch = useIsTouch()
  const dark = useIsDark()
  const statusRef = useRef(status)
  statusRef.current = status
  const darkRef = useRef(dark)
  darkRef.current = dark
  const total = world.current.level.commits.length

  const draw = useCallback(() => {
    const cv = canvas.current
    const c = cv?.getContext('2d')
    if (!cv || !c) return
    const w = world.current
    const scale = cv.height / (ROWS * T)
    const viewW = cv.width / scale
    w.camera = Math.max(0, Math.min(COLS * T - viewW, w.p.x - viewW * 0.38))
    const cam = w.camera
    const f = w.frame
    const night = darkRef.current

    // Sky.
    const sky = c.createLinearGradient(0, 0, 0, cv.height)
    sky.addColorStop(0, night ? '#0b1026' : '#7cc4ff')
    sky.addColorStop(1, night ? '#3b2a5c' : '#ffd9b8')
    c.fillStyle = sky
    c.fillRect(0, 0, cv.width, cv.height)
    c.save()
    c.scale(scale, scale)
    if (night)
      for (let i = 0; i < 40; i++) {
        c.fillStyle = `rgba(255,255,255,${0.3 + ((i * 37) % 7) / 10})`
        c.fillRect(((i * 211) % 1400) - ((cam * 0.05) % 1400), (i * 53) % 220, 2, 2)
      }
    // Far and near mountain ranges, moving slower than the ground.
    const range = (speed: number, base: number, amp: number, color: string, seed: number) => {
      c.fillStyle = color
      c.beginPath()
      c.moveTo(0, ROWS * T)
      for (let x = 0; x <= viewW + 20; x += 20) {
        const wx = x + cam * speed
        const y = base - Math.abs(Math.sin(wx / (170 + seed)) * amp) - Math.abs(Math.sin(wx / (61 + seed))) * amp * 0.35
        c.lineTo(x, y)
      }
      c.lineTo(viewW + 20, ROWS * T)
      c.fill()
    }
    range(0.15, 300, 130, night ? '#2a2550' : '#b9c8f0', 9)
    range(0.35, 360, 80, night ? '#1d1b3a' : '#8fb5d9', 0)

    c.translate(-cam, 0)
    const x0 = Math.floor(cam / T) - 1
    const x1 = Math.ceil((cam + viewW) / T) + 1
    for (let y = 0; y < ROWS; y++)
      for (let x = Math.max(0, x0); x < Math.min(COLS, x1); x++) {
        const t = w.level.tiles[y][x]
        const px = x * T
        const py = y * T
        if (t === '#') {
          const top = y === 0 || w.level.tiles[y - 1][x] !== '#'
          c.fillStyle = night ? '#2b3445' : '#55657a'
          c.fillRect(px, py, T, T)
          c.fillStyle = night ? '#323d50' : '#617389'
          if ((x + y) % 2) c.fillRect(px + 4, py + 6, T - 8, 2)
          if (top) {
            c.fillStyle = '#2dd4bf'
            c.fillRect(px, py, T, 6)
            c.fillStyle = 'rgba(255,255,255,.35)'
            c.fillRect(px, py, T, 1.5)
          }
        } else if (t === 'B') {
          // A server blade with blinking lights.
          c.fillStyle = night ? '#4c46a8' : '#6366f1'
          c.beginPath()
          c.roundRect(px + 1, py + 2, T - 2, T - 4, 6)
          c.fill()
          c.fillStyle = 'rgba(255,255,255,.18)'
          c.fillRect(px + 5, py + 8, T - 10, 2)
          c.fillRect(px + 5, py + 14, T - 10, 2)
          c.fillStyle = (f + x * 13) % 60 < 30 ? '#4ade80' : '#14532d'
          c.fillRect(px + T - 9, py + 21, 3, 3)
        } else if (t === '^') {
          // Merge conflicts: red markers that hurt.
          c.fillStyle = '#ef4444'
          for (let k = 0; k < 3; k++) {
            c.beginPath()
            c.moveTo(px + k * 10.6, py + T)
            c.lineTo(px + k * 10.6 + 5.3, py + T - 14)
            c.lineTo(px + k * 10.6 + 10.6, py + T)
            c.fill()
          }
        }
      }

    // Checkpoints: a terminal that turns green once reached.
    for (const k of w.level.checkpoints) {
      const px = k * T + 4
      const py = (ROWS - 2) * T - 34
      c.fillStyle = '#334155'
      c.fillRect(px + 10, py + 22, 4, 12)
      c.fillStyle = '#0f172a'
      c.beginPath()
      c.roundRect(px, py, 24, 22, 4)
      c.fill()
      c.fillStyle = w.checkpoint >= k ? '#4ade80' : '#64748b'
      c.font = '700 10px ui-monospace, monospace'
      c.fillText('>_', px + 5, py + 15)
    }

    // Commits: git nodes that bob.
    w.level.commits.forEach((cm, i) => {
      if (w.got.has(i)) return
      const bob = Math.sin((f + i * 9) / 12) * 2.5
      const cx = cm.x * T + T / 2
      const cy = cm.y * T + T / 2 + bob
      c.fillStyle = '#22c55e'
      c.beginPath()
      c.arc(cx, cy, 8, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#fff'
      c.beginPath()
      c.arc(cx, cy, 3.5, 0, Math.PI * 2)
      c.fill()
    })

    // Bugs: round beetles with wiggling legs.
    for (const b of w.bugs) {
      if (!b.alive && b.squash <= 0) continue
      const squash = b.alive ? 1 : 0.35
      const cx = b.x + b.w / 2
      const by = b.y + b.h
      c.save()
      c.translate(cx, by)
      c.scale(b.vx > 0 ? -1 : 1, squash)
      c.strokeStyle = '#3b0764'
      c.lineWidth = 2
      for (let k = -1; k <= 1; k++) {
        const wig = b.alive ? Math.sin(f / 4 + k) * 2 : 0
        c.beginPath()
        c.moveTo(k * 7, -6)
        c.lineTo(k * 7 + wig - 3, 0)
        c.stroke()
      }
      c.fillStyle = '#a855f7'
      c.beginPath()
      c.ellipse(0, -10, 13, 9, 0, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#7e22ce'
      c.fillRect(-0.75, -18, 1.5, 16)
      c.fillStyle = '#fff'
      c.beginPath()
      c.arc(-9, -12, 3, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#111'
      c.beginPath()
      c.arc(-10, -12, 1.5, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = '#3b0764'
      c.beginPath()
      c.moveTo(-10, -17)
      c.lineTo(-15, -23)
      c.stroke()
      c.restore()
    }

    // The launch pad and its rocket.
    const rx = w.level.rocket * T
    const ry = (ROWS - 2) * T
    c.fillStyle = '#475569'
    c.fillRect(rx - 12, ry - 6, 64, 6)
    c.fillStyle = '#fff'
    c.font = '700 9px ui-sans-serif, system-ui'
    c.fillText('DEPLOY', rx + 2, ry - 10)
    c.save()
    c.translate(rx + 20, ry - 18)
    if (w.won) {
      c.fillStyle = f % 6 < 3 ? '#fb923c' : '#fde047'
      c.beginPath()
      c.moveTo(-7, 30)
      c.lineTo(0, 48 + (f % 5))
      c.lineTo(7, 30)
      c.fill()
    }
    c.fillStyle = '#f97316'
    c.beginPath()
    c.moveTo(-14, 30)
    c.lineTo(-8, 14)
    c.lineTo(-8, 30)
    c.moveTo(14, 30)
    c.lineTo(8, 14)
    c.lineTo(8, 30)
    c.fill()
    c.fillStyle = '#f8fafc'
    c.beginPath()
    c.moveTo(0, -40)
    c.quadraticCurveTo(12, -22, 9, 30)
    c.lineTo(-9, 30)
    c.quadraticCurveTo(-12, -22, 0, -40)
    c.fill()
    c.fillStyle = '#38bdf8'
    c.beginPath()
    c.arc(0, -10, 5, 0, Math.PI * 2)
    c.fill()
    c.restore()

    // The hero: a developer in a teal hoodie with headphones. Blinks when hurt.
    const p = w.p
    if (!(p.hurt > 0 && Math.floor(p.hurt / 4) % 2)) {
      c.save()
      c.translate(p.x + p.w / 2, p.y + p.h)
      c.scale(p.face, 1)
      const run = p.ground && Math.abs(p.vx) > 0.4 ? Math.sin(p.step / 3) * 4 : 0
      c.fillStyle = '#1e293b'
      c.fillRect(-6 + run, -8, 5, 8)
      c.fillRect(1 - run, -8, 5, 8)
      c.fillStyle = '#14b8a6'
      c.beginPath()
      c.roundRect(-9, -21, 18, 15, 5)
      c.fill()
      c.fillStyle = '#0f766e'
      c.fillRect(-2, -19, 4, 6)
      c.fillStyle = '#f2c6a0'
      c.beginPath()
      c.arc(0, -26, 7, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#1f2937'
      c.beginPath()
      c.arc(0, -28, 7, Math.PI, 0)
      c.fill()
      c.fillStyle = '#111827'
      c.fillRect(3, -27, 1.8, 2.4)
      c.strokeStyle = '#f43f5e'
      c.lineWidth = 2
      c.beginPath()
      c.arc(0, -27, 8.5, Math.PI * 1.05, Math.PI * 1.95)
      c.stroke()
      c.fillStyle = '#f43f5e'
      c.fillRect(-9.5, -28, 3, 5)
      c.restore()
    }
    c.restore()
  }, [])

  const syncHud = useCallback(() => {
    const w = world.current
    setHud((h) => (h.score === w.score && h.commits === w.got.size && h.lives === w.lives ? h : { score: w.score, commits: w.got.size, lives: w.lives }))
  }, [])

  const hurt = useCallback(() => {
    const w = world.current
    if (w.p.hurt > 0) return
    w.lives--
    sounds.error()
    if (w.lives <= 0) {
      const newBest = w.score > 0 && useScores.getState().record('shipit', w.score)
      setResult({ score: w.score, newBest, time: 0 })
      setStatus('over')
      return
    }
    w.p = { ...spawnPlayer(w.checkpoint), hurt: 90 }
  }, [])

  /** One 60th of a second of physics. */
  const tick = useCallback(() => {
    const w = world.current
    const p = w.p
    const k = keys.current
    w.frame++
    if (p.hurt > 0) p.hurt--

    const accel = p.ground ? 0.6 : 0.35
    if (k.left) {
      p.vx = Math.max(-4.2, p.vx - accel)
      p.face = -1
    } else if (k.right) {
      p.vx = Math.min(4.2, p.vx + accel)
      p.face = 1
    } else p.vx *= p.ground ? 0.72 : 0.95
    if (Math.abs(p.vx) < 0.05) p.vx = 0

    // Forgiving jumps: a few frames of grace after leaving a ledge or before landing.
    p.coyote = p.ground ? 6 : Math.max(0, p.coyote - 1)
    p.buffer = Math.max(0, p.buffer - 1)
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -11
      p.buffer = 0
      p.coyote = 0
      sounds.toggleOn()
    }
    if (!k.jump && p.vy < -4) p.vy = -4 // let go early for a short hop
    p.vy = Math.min(12, p.vy + 0.55)

    p.x += p.vx
    if (collide(w, p, 'x')) p.vx = 0
    p.x = Math.max(0, p.x)
    p.y += p.vy
    p.ground = false
    if (collide(w, p, 'y')) {
      if (p.vy > 0) p.ground = true
      p.vy = 0
    }
    if (p.ground && Math.abs(p.vx) > 0.4) p.step++

    // Falling into a gap, or onto a merge conflict.
    if (p.y > ROWS * T) return hurt()
    const feet = tileAt(w, p.x + p.w / 2, p.y + p.h - 4)
    if (feet === '^') return hurt()

    for (const cp of w.level.checkpoints) if (p.x > cp * T && w.checkpoint < cp) w.checkpoint = cp

    w.level.commits.forEach((cm, i) => {
      if (w.got.has(i)) return
      if (overlap(p, { x: cm.x * T + 6, y: cm.y * T + 6, w: T - 12, h: T - 12, vx: 0, vy: 0 })) {
        w.got.add(i)
        w.score += 10
        sounds.pop()
      }
    })

    for (const b of w.bugs) {
      if (!b.alive) {
        b.squash--
        continue
      }
      // Patrol: turn at walls and ledges.
      if (Math.abs(b.x - p.x) < 900) {
        b.x += b.vx
        const ahead = b.vx > 0 ? b.x + b.w + 1 : b.x - 1
        if (solid(tileAt(w, ahead, b.y + b.h / 2)) || !solid(tileAt(w, ahead, b.y + b.h + 4))) {
          b.x -= b.vx
          b.vx = -b.vx
        }
      }
      if (!overlap(p, b)) continue
      if (p.vy > 0 && p.y + p.h - p.vy <= b.y + 6) {
        b.alive = false
        b.squash = 24
        p.vy = k.jump ? -10 : -6.5
        w.score += 50
        sounds.pop()
      } else if (p.hurt <= 0) return hurt()
    }

    if (p.x + p.w > w.level.rocket * T + 8) {
      w.won = true
      const seconds = Math.round((performance.now() - w.started) / 1000)
      w.score += w.lives * 100 + Math.max(0, 240 - seconds) * 2
      const newBest = useScores.getState().record('shipit', w.score)
      setResult({ score: w.score, newBest, time: seconds })
      setStatus('won')
      discover('shipped')
      sounds.sent()
    }
  }, [hurt])

  // Fixed-step loop: physics at 60 steps a second whatever the screen's refresh rate.
  useEffect(() => {
    if (status !== 'playing') return
    let raf = 0
    let last = performance.now()
    let acc = 0
    const frame = (now: number) => {
      acc += Math.min(100, now - last)
      last = now
      while (acc >= 1000 / 60) {
        tick()
        acc -= 1000 / 60
        if (statusRef.current !== 'playing') break
      }
      draw()
      syncHud()
      if (statusRef.current === 'playing') raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [status, tick, draw, syncHud])

  // A short victory lap: keep drawing the rocket's flame after the win.
  useEffect(() => {
    if (status !== 'won') return
    let raf = 0
    const loop = () => {
      world.current.frame++
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [status, draw])

  useEffect(() => {
    const el = wrap.current
    const cv = canvas.current
    if (!el || !cv) return
    const fit = () => {
      const r = el.getBoundingClientRect()
      // Never taller than wide-ish, so a phone still sees a good stretch of the course.
      const h = Math.min(r.height, r.width * 0.9)
      const dpr = window.devicePixelRatio || 1
      cv.style.width = `${r.width}px`
      cv.style.height = `${h}px`
      cv.width = Math.round(r.width * dpr)
      cv.height = Math.round(h * dpr)
      draw()
    }
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [draw])

  useEffect(() => draw(), [dark, draw])

  const start = useCallback(() => {
    world.current = newWorld()
    world.current.started = performance.now()
    keys.current = { left: false, right: false, jump: false }
    setHud({ score: 0, commits: 0, lives: 3 })
    setStatus('playing')
  }, [])

  const togglePause = useCallback(() => {
    const s = statusRef.current
    if (s === 'playing') setStatus('paused')
    else if (s === 'paused') setStatus('playing')
    else start()
  }, [start])

  const press = useCallback((key: 'left' | 'right' | 'jump', down: boolean) => {
    if (key === 'jump' && down && !keys.current.jump) world.current.p.buffer = 7
    keys.current[key] = down
  }, [])

  useEffect(() => {
    if (!active) {
      keys.current = { left: false, right: false, jump: false }
      if (statusRef.current === 'playing') setStatus('paused')
      return
    }
    const map: Record<string, 'left' | 'right' | 'jump'> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump' }
    const onDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (statusRef.current === 'playing' || statusRef.current === 'paused') {
          e.preventDefault()
          togglePause()
        }
        return
      }
      const key = map[e.code]
      if (!key) return
      e.preventDefault()
      if (statusRef.current === 'ready') return start()
      if (statusRef.current !== 'playing') return
      if (!e.repeat) press(key, true)
    }
    const onUp = (e: KeyboardEvent) => {
      const key = map[e.code]
      if (key) press(key, false)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [active, press, start, togglePause])

  const hold = (key: 'left' | 'right' | 'jump') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      press(key, true)
    },
    onPointerUp: () => press(key, false),
    onPointerCancel: () => press(key, false),
  })

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
        <Stat label="Score" value={hud.score} />
        <Stat label="Commits" value={`${hud.commits}/${total}`} />
        <Stat label="Lives" value={'♥'.repeat(Math.max(0, hud.lives)) || '–'} />
        <Stat label="Best" value={best} />
      </StatBar>
      <div ref={wrap} className="relative mx-4 mb-3 flex min-h-0 flex-1 items-center justify-center">
        <canvas ref={canvas} className="touch-none rounded-[10px] border border-[var(--border)]" role="img" aria-label={`Ship It course. Score ${hud.score}, ${hud.lives} lives.`} />
        {status === 'ready' && (
          <GameOverlay
            title="Ship It"
            body="Run to the launch pad and deploy. Grab commits, jump on bugs, and stay off the red merge conflicts."
            action="Start"
            onAction={start}
            secondary={
              touch ? (
                'Hold the arrows to run, tap the jump button.'
              ) : (
                <>
                  <Kbd>←</Kbd> <Kbd>→</Kbd> to run, <Kbd>Space</Kbd> or <Kbd>↑</Kbd> to jump (hold for higher), <Kbd>P</Kbd> to pause.
                </>
              )
            }
          />
        )}
        {status === 'paused' && <GameOverlay title="Paused" action="Resume" onAction={togglePause} />}
        {status === 'won' && <GameOverlay title={result.newBest ? 'Shipped! New best!' : 'Shipped!'} body={`Deployed in ${result.time}s with ${result.score} points.`} action="Play again" onAction={start} />}
        {status === 'over' && <GameOverlay title="Build failed" body={`Out of lives with ${result.score} points. Each hit sends you back to the last terminal you passed.`} action="Try again" onAction={start} />}
      </div>
      {touch && (
        <div className="flex shrink-0 items-center justify-between px-6 pb-[max(34px,env(safe-area-inset-bottom))]" aria-label="Controls">
          <div className="flex gap-2">
            <button type="button" aria-label="Run left" {...hold('left')} className="grid h-14 w-14 touch-none place-items-center rounded-full bg-[var(--surface-3)] text-[var(--text-2)] active:bg-[var(--hover)]">
              <ArrowLeft size={22} />
            </button>
            <button type="button" aria-label="Run right" {...hold('right')} className="grid h-14 w-14 touch-none place-items-center rounded-full bg-[var(--surface-3)] text-[var(--text-2)] active:bg-[var(--hover)]">
              <ArrowRight size={22} />
            </button>
          </div>
          <button type="button" aria-label="Jump" {...hold('jump')} className="grid h-16 w-16 touch-none place-items-center rounded-full bg-[var(--accent)] text-white active:brightness-110">
            <ArrowUp size={26} />
          </button>
        </div>
      )}
    </div>
  )
}
