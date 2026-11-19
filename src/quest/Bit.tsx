import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useWindows } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { useIsMobile, useReduceMotion } from '@/hooks/system'
import { useQuest } from './questStore'
import type { Mood } from './story'

const SIZE = 44

/** Bit, drawn in SVG: a round little helper with an antenna, big eyes and tiny feet. */
export function BitSprite({ mood = 'neutral', look = 0, size = SIZE }: { mood?: Mood; look?: number; size?: number }) {
  const px = Math.max(-1.6, Math.min(1.6, look * 1.6))
  const eye = (cx: number) => {
    if (mood === 'happy') return <path d={`M${cx - 3.2} 23.5 q3.2 -4 6.4 0`} stroke="#1e1b4b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    if (mood === 'sad')
      return (
        <g>
          <ellipse cx={cx} cy="23.5" rx="3.4" ry="3.8" fill="#fff" />
          <circle cx={cx + px * 0.6} cy="25" r="1.8" fill="#1e1b4b" />
          <path d={`M${cx - 3.6} 18.6 l7 1.6`} stroke="#1e1b4b" strokeWidth="1.4" strokeLinecap="round" transform={cx > 22 ? `rotate(-20 ${cx} 19)` : `rotate(20 ${cx} 19)`} />
        </g>
      )
    const r = mood === 'surprised' ? 4.4 : 3.6
    return (
      <g className="bit-blink" style={{ transformOrigin: `${cx}px 23px` }}>
        <ellipse cx={cx} cy="23" rx={r} ry={r + 0.6} fill="#fff" />
        <circle cx={cx + px} cy={mood === 'thinking' ? 21.6 : 23.4} r={mood === 'surprised' ? 2.4 : 2} fill="#1e1b4b" />
        <circle cx={cx + px + 0.8} cy="22" r="0.7" fill="#fff" />
      </g>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={mood === 'glitch' ? 'bit-glitch' : undefined} aria-hidden>
      <defs>
        <radialGradient id="bit-body" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#a5f3fc" />
          <stop offset=".55" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#7c3aed" />
        </radialGradient>
      </defs>
      {/* antenna */}
      <path d="M22 10 Q23.5 6 26 4.6" stroke="#7c3aed" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="26.4" cy="4.4" r="2.6" fill="#fde047" className="bit-glow" />
      {/* feet */}
      <ellipse cx="16" cy="40.4" rx="4" ry="2.2" fill="#5b21b6" />
      <ellipse cx="28" cy="40.4" rx="4" ry="2.2" fill="#5b21b6" />
      {/* body */}
      <circle cx="22" cy="24.5" r="15.5" fill="url(#bit-body)" />
      <ellipse cx="16.5" cy="16" rx="5" ry="3" fill="#fff" opacity=".45" />
      {eye(16.4)}
      {eye(27.6)}
      <ellipse cx="12.6" cy="29" rx="2.4" ry="1.4" fill="#f472b6" opacity=".55" />
      <ellipse cx="31.4" cy="29" rx="2.4" ry="1.4" fill="#f472b6" opacity=".55" />
      {mood === 'surprised' ? (
        <ellipse cx="22" cy="31" rx="1.8" ry="2.2" fill="#1e1b4b" />
      ) : mood === 'sad' ? (
        <path d="M19 32 q3 -2.4 6 0" stroke="#1e1b4b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M19 30.4 q3 2.6 6 0" stroke="#1e1b4b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      )}
    </svg>
  )
}

/** Where Bit should be right now: pointing at an app, sitting on the front window, or resting by the Dock. */
function targetFor(point: string | null, perch: number, mobile: boolean): { x: number; y: number; sitting: boolean } {
  const W = innerWidth
  const H = innerHeight
  if (point) {
    const el = document.querySelector(`[data-dock-app="${point}"], [data-home-app="${point}"]`)
    const r = el?.getBoundingClientRect()
    if (r && r.width && r.top < H - 4) return { x: r.left + r.width / 2 - SIZE / 2, y: r.top - SIZE - 14, sitting: false }
  }
  if (mobile) {
    const sheet = document.querySelector('.mobile-app')
    return sheet ? { x: W - SIZE - 12, y: H - SIZE - 40, sitting: true } : { x: W - SIZE - 18, y: H - SIZE - 150, sitting: true }
  }
  const ws = useWindows.getState()
  const front = ws.focusedId ? ws.windows[ws.focusedId] : null
  if (front && !front.minimized) {
    const el = document.querySelector(`[data-window-id="${front.id}"]:not([data-closing])`)
    const r = el?.getBoundingClientRect()
    if (r && r.top > 40) return { x: r.left + 90 + perch * Math.max(0, r.width - 180) - SIZE / 2, y: r.top - SIZE + 3, sitting: true }
  }
  const dock = document.querySelector('[data-dock-divider]')?.parentElement?.getBoundingClientRect()
  const top = dock && dock.top < H ? dock.top : H - 70
  return { x: W * (0.62 + perch * 0.25) - SIZE / 2, y: top - SIZE - 2, sitting: true }
}

/** The speech bubble, typing its line out. A click finishes the line, another moves on. */
function Bubble({ text, choices, onNext, below, alignRight }: { text: string; choices: { label: string; run: () => void }[] | null; onNext: () => void; below: boolean; alignRight: boolean }) {
  const reduce = useReduceMotion()
  const [shown, setShown] = useState(reduce ? text.length : 0)
  useEffect(() => {
    if (reduce) return setShown(text.length)
    setShown(0)
    const t = setInterval(() => setShown((n) => (n >= text.length ? (clearInterval(t), n) : n + 1)), 18)
    return () => clearInterval(t)
  }, [text, reduce])
  const done = shown >= text.length
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: below ? -6 : 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.16 }}
      className={`absolute w-[min(290px,calc(100vw-24px))] cursor-pointer rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] px-3.5 py-2.5 text-left text-[13px] leading-snug text-[var(--text)] shadow-[0_10px_30px_rgba(0,0,0,.28)] ${below ? 'top-[calc(100%+8px)]' : 'bottom-[calc(100%+8px)]'} ${alignRight ? 'right-0' : 'left-0'}`}
      style={{ transformOrigin: `${alignRight ? 'right' : 'left'} ${below ? 'top' : 'bottom'}` }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        if (!done) setShown(text.length)
        else if (!choices) onNext()
      }}
      role="dialog"
      aria-label="Bit says"
      aria-live="polite"
    >
      <span>{text.slice(0, shown)}</span>
      <span className="invisible">{text.slice(shown)}</span>
      {done && choices ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {choices.map((c, i) => (
            <button
              key={c.label}
              type="button"
              onClick={(e) => (e.stopPropagation(), c.run())}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold ${i === 0 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-3)] text-[var(--text)]'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : done ? (
        <div className="mt-1 text-right text-[10.5px] text-[var(--text-3)]">click ▸</div>
      ) : null}
    </motion.div>
  )
}

/** Bit on the desktop: flies to wherever the story needs it, sits on windows and talks. */
export function Bit() {
  const q = useQuest()
  const system = useDesktop((s) => s.system)
  const mobile = useIsMobile()
  const reduce = useReduceMotion()
  const box = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: innerWidth * 0.7, y: innerHeight - 140, vx: 0 })
  const perch = useRef(0.5)
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null)
  const [side, setSide] = useState({ below: false, right: false, look: 0 })
  const point = q.point
  const visible = q.started && !q.away && system === 'on'

  // Wander along the perch now and then, like something alive.
  useEffect(() => {
    if (!visible) return
    const t = setInterval(() => {
      if (!drag.current && !useQuest.getState().lines.length) perch.current = Math.min(0.95, Math.max(0.05, perch.current + (Math.random() - 0.5) * 0.5))
    }, 5200)
    return () => clearInterval(t)
  }, [visible])

  // One light loop: ease toward the target, bob while flying, and keep the bubble on screen.
  useEffect(() => {
    if (!visible) return
    let raf = 0
    let frame = 0
    const loop = (now: number) => {
      const el = box.current
      if (el) {
        const p = pos.current
        // Bit stays put while it talks (so its words hold still), then flies where the story needs it.
        const talking = useQuest.getState().lines.length > 0
        const t = drag.current ? null : targetFor(point, perch.current, mobile)
        if (t && !talking) {
          const k = reduce ? 1 : Math.hypot(t.x - p.x, t.y - p.y) > 300 ? 0.07 : 0.12
          const nx = p.x + (t.x - p.x) * k
          p.vx = nx - p.x
          p.x = nx
          p.y += (t.y - p.y) * k
          // Land exactly, so a resting Bit (and its speech bubble) holds perfectly still.
          if (Math.abs(t.x - p.x) < 0.4 && Math.abs(t.y - p.y) < 0.4) {
            p.x = t.x
            p.y = t.y
            p.vx = 0
          }
        }
        const flying = t ? Math.abs(t.y - p.y) > 2 || !t.sitting : true
        // Hover in place while talking, so the words are easy to read and click.
        const bob = reduce || !flying || talking ? 0 : Math.sin(now / 260) * 3
        const tilt = reduce ? 0 : Math.max(-14, Math.min(14, p.vx * 1.6))
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${(p.y + bob).toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg)`
        if (++frame % 20 === 0) {
          const next = { below: p.y < 170, right: p.x > innerWidth - 300, look: Math.max(-1, Math.min(1, p.vx / 3)) }
          setSide((s) => (s.below === next.below && s.right === next.right && Math.abs(s.look - next.look) < 0.2 ? s : next))
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [visible, point, mobile, reduce])

  if (!visible) return null
  const line = q.lines[q.index] ?? q.aside
  const mood = q.lines.length ? (q.lines[q.index]?.mood ?? q.mood) : (q.aside?.mood ?? 'neutral')

  return (
    <div ref={box} className="pointer-events-auto fixed left-0 top-0 z-[60] touch-none select-none" style={{ width: SIZE, height: SIZE, transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)` }} data-bit>
      <button
        type="button"
        aria-label="Bit, your guide. Click to talk."
        className="block cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { dx: e.clientX - pos.current.x, dy: e.clientY - pos.current.y, moved: false }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          if (!d.moved && Math.hypot(e.clientX - d.dx - pos.current.x, e.clientY - d.dy - pos.current.y) < 4) return
          d.moved = true
          pos.current.x = e.clientX - d.dx
          pos.current.y = e.clientY - d.dy
        }}
        onPointerUp={() => {
          const d = drag.current
          drag.current = null
          if (d && !d.moved) useQuest.getState().poke()
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        <BitSprite mood={mood} look={side.look} />
      </button>
      {point && !q.lines.length ? <div className="bit-point pointer-events-none absolute left-1/2 top-full mt-0.5 -translate-x-1/2 text-[15px] text-[var(--accent)] drop-shadow">▼</div> : null}
      {line ? (
        <Bubble
          key={`${q.index}-${line.text}`}
          text={line.text}
          choices={q.lines.length && q.index === q.lines.length - 1 ? q.choices : null}
          onNext={() => (q.lines.length ? q.next() : useQuest.setState({ aside: null }))}
          below={side.below}
          alignRight={side.right}
        />
      ) : null}
    </div>
  )
}
