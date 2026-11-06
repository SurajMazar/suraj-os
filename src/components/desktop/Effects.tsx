import { useEffect, useRef } from 'react'
import { sounds } from '@/lib/sound'
import { useEffects } from '@/lib/easterEggs'
import { useReduceMotion } from '@/hooks/system'

const DURATION = { confetti: 3200, matrix: 7000, panic: 3600, snow: 9000 } as const

/** Full-screen effects set off by Easter eggs. A click or Escape ends any of them. */
export function Effects() {
  const effect = useEffects((s) => s.effect)
  const key = useEffects((s) => s.key)
  const reduce = useReduceMotion()

  useEffect(() => {
    if (!effect) return
    const t = setTimeout(() => useEffects.getState().stop(), DURATION[effect])
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useEffects.getState().stop()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      if (effect === 'panic') sounds.startup()
    }
  }, [effect, key])

  if (!effect) return null
  if (effect === 'panic') return <Panic key={key} />
  if (reduce) return null
  if (effect === 'snow') return <Snow key={key} />
  return effect === 'confetti' ? <Confetti key={key} /> : <Rain key={key} />
}

function useCanvas(draw: (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = innerWidth * dpr
    cv.height = innerHeight * dpr
    c.scale(dpr, dpr)
    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      draw(c, innerWidth, innerHeight, now - start)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // The drawing function is fixed for the life of the effect.
  }, [])
  return ref
}

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 160 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: innerHeight * 0.55,
      vx: (Math.random() - 0.5) * 16,
      vy: -8 - Math.random() * 14,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 6,
      color: ['#a78bfa', '#f472b6', '#fb923c', '#facc15', '#4ade80', '#38bdf8'][Math.floor(Math.random() * 6)],
    })),
  )
  const ref = useCanvas((c, w, h, t) => {
    c.clearRect(0, 0, w, h)
    for (const p of pieces.current) {
      p.vy += 0.35
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.r += p.vr
      c.save()
      c.globalAlpha = Math.max(0, 1 - t / DURATION.confetti)
      c.translate(p.x, p.y)
      c.rotate(p.r)
      c.fillStyle = p.color
      c.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2)
      c.restore()
    }
  })
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[300] h-full w-full" aria-hidden />
}

/** Falling green code, drawn on a canvas that fades its own trail. */
function Rain() {
  const drops = useRef<number[]>([])
  const glyphs = '01<>{}[]/=;:+*アイウエオカキクケコサシスセソ'
  const ref = useCanvas((c, w, h) => {
    const size = 16
    const cols = Math.ceil(w / size)
    if (drops.current.length !== cols) drops.current = Array.from({ length: cols }, () => Math.random() * -40)
    c.fillStyle = 'rgba(0, 0, 0, 0.08)'
    c.fillRect(0, 0, w, h)
    c.font = `${size}px ui-monospace, monospace`
    drops.current.forEach((y, i) => {
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)]
      c.fillStyle = Math.random() < 0.06 ? '#d1fae5' : '#22c55e'
      c.fillText(ch, i * size, y * size)
      drops.current[i] = y * size > h && Math.random() > 0.975 ? 0 : y + 0.6
    })
  })
  return (
    <div className="fixed inset-0 z-[300] cursor-pointer bg-black" onClick={() => useEffects.getState().stop()} role="presentation">
      <canvas ref={ref} className="h-full w-full" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-10 text-center font-mono text-[13px] text-green-300/80">Compiling the whole internet… click to come back.</div>
    </div>
  )
}

/** A pretend crash after `rm -rf /`, which comes back on its own. */
function Panic() {
  return (
    <div className="fixed inset-0 z-[300] grid cursor-pointer place-items-center bg-black p-8 text-center text-white" onClick={() => useEffects.getState().stop()} role="alertdialog" aria-label="Pretend crash">
      <div className="max-w-[460px]">
        <div className="text-[15px] font-semibold">SurajOS deleted everything.</div>
        <div className="mt-3 text-[13px] leading-relaxed text-white/70">Just kidding. The files are read-only and nothing was harmed. Restarting so you can keep exploring…</div>
        <div className="mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/20">
          <div className="h-full origin-left animate-[panic-bar_3.4s_linear_forwards] rounded-full bg-white" />
        </div>
      </div>
    </div>
  )
}

/** Soft snow drifting over everything; clicks still reach the desktop. */
function Snow() {
  const flakes = useRef(
    Array.from({ length: 140 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * -innerHeight,
      r: 1.5 + Math.random() * 3,
      v: 0.6 + Math.random() * 1.4,
      drift: Math.random() * Math.PI * 2,
    })),
  )
  const ref = useCanvas((c, w, h, t) => {
    c.clearRect(0, 0, w, h)
    c.globalAlpha = Math.min(1, (DURATION.snow - t) / 1200)
    c.fillStyle = '#fff'
    for (const f of flakes.current) {
      f.y += f.v
      f.x += Math.sin(t / 900 + f.drift) * 0.5
      if (f.y > h + 5) {
        f.y = -5
        f.x = Math.random() * w
      }
      c.beginPath()
      c.arc(f.x, f.y, f.r, 0, Math.PI * 2)
      c.fill()
    }
  })
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[300] h-full w-full" aria-hidden />
}
