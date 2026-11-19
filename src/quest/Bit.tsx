import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useWindows } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { useIsMobile, useReduceMotion } from '@/hooks/system'
import { useQuest } from './questStore'
import type { Mood } from './story'

/** The mascot's size on screen: 44 wide, a little taller than wide. */
const W = 44
const H = Math.round((W * 56) / 48)

/** Mini Suraj: a chibi of the builder, drawn from the profile photo: tousled black hair swept up, thin metal glasses, headphones round the neck and a teal sweater. */
export function BitSprite({ mood = 'neutral', look = 0, size = W }: { mood?: Mood; look?: number; size?: number }) {
  const px = Math.max(-1, Math.min(1, look)) * 0.9
  const ink = '#2a1d16'
  const eye = (cx: number) => {
    if (mood === 'happy') return <path d={`M${cx - 2.4} 24.4 q2.4 -3 4.8 0`} stroke={ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    const rx = mood === 'surprised' ? 3.2 : 2.85
    const ry = mood === 'surprised' ? 3.9 : mood === 'sad' ? 3 : 3.5
    const cy = mood === 'thinking' ? 22.6 : mood === 'sad' ? 24.4 : 23.6
    return (
      <g className="bit-blink" style={{ transformOrigin: `${cx}px 23.6px` }}>
        <ellipse cx={cx + px} cy={cy} rx={rx} ry={ry} fill={ink} />
        <ellipse cx={cx + px} cy={cy + 1.3} rx={rx * 0.72} ry={ry * 0.46} fill="#6b4430" />
        <circle cx={cx + px + 0.9} cy={cy - 1.2} r="1.15" fill="#fff" />
        <circle cx={cx + px - 0.9} cy={cy + 1.6} r=".5" fill="#fff" opacity=".85" />
      </g>
    )
  }
  const brow = (cx: number, side: 1 | -1) => {
    const lift = mood === 'surprised' ? -1.4 : mood === 'thinking' ? -0.6 : 0
    const tilt = mood === 'sad' ? side * 1.1 : mood === 'glitch' ? -side * 0.8 : 0
    return <path d={`M${cx - 2.4} ${18.6 + lift + tilt} L${cx + 2.4} ${18.6 + lift - tilt}`} stroke="#1b1720" strokeWidth="1.1" strokeLinecap="round" />
  }
  const mouth =
    mood === 'surprised' ? (
      <ellipse cx="24" cy="30.4" rx="1.4" ry="1.7" fill="#7a3b2e" />
    ) : mood === 'sad' ? (
      <path d="M22.2 31 q1.8 -1.3 3.6 0" stroke="#7a3b2e" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    ) : mood === 'happy' ? (
      <path d="M21.6 29.2 q2.4 2.6 4.8 0 z" fill="#7a3b2e" />
    ) : (
      <path d="M22.3 29.6 q1.7 1.3 3.4 0" stroke="#7a3b2e" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    )
  return (
    <svg width={size} height={(size * 56) / 48} viewBox="0 0 48 56" className={mood === 'glitch' ? 'bit-glitch' : undefined} aria-hidden>
      {/* shoes */}
      <ellipse cx="19" cy="54" rx="4" ry="1.9" fill="#26232e" />
      <ellipse cx="29" cy="54" rx="4" ry="1.9" fill="#26232e" />
      {/* arms and hands */}
      <rect x="9.4" y="39.5" width="5.6" height="10" rx="2.8" fill="#1d6f86" />
      <rect x="33" y="39.5" width="5.6" height="10" rx="2.8" fill="#1d6f86" />
      <circle cx="12.2" cy="49.6" r="2.1" fill="#eabf98" />
      <circle cx="35.8" cy="49.6" r="2.1" fill="#eabf98" />
      {/* teal sweater */}
      <path d="M14 41 Q14 36.4 19 36 L29 36 Q34 36.4 34 41 L34 50 Q34 53 31 53 L17 53 Q14 53 14 50 Z" fill="#23809a" />
      <path d="M14 47 L34 47 L34 50 Q34 53 31 53 L17 53 Q14 53 14 50 Z" fill="#1b6c83" />
      <path d="M20.4 36.2 Q24 39.4 27.6 36.2" stroke="#186277" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* neck */}
      <rect x="21.6" y="32.6" width="4.8" height="4" rx="1.6" fill="#e2b48c" />
      {/* headphones round the neck */}
      <path d="M15.6 36.4 Q24 42.2 32.4 36.4" stroke="#15151b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <rect x="12.4" y="33" width="5" height="6.6" rx="2.2" fill="#1b1b22" />
      <rect x="30.6" y="33" width="5" height="6.6" rx="2.2" fill="#1b1b22" />
      <rect x="13.4" y="34" width="1.4" height="4.4" rx=".7" fill="#4a4a58" />
      <rect x="33.2" y="34" width="1.4" height="4.4" rx=".7" fill="#4a4a58" />
      {/* ears and face */}
      <ellipse cx="11.6" cy="23.6" rx="1.9" ry="2.6" fill="#e6b791" />
      <ellipse cx="36.4" cy="23.6" rx="1.9" ry="2.6" fill="#e6b791" />
      <path d="M11.4 21 Q11.6 33.4 24 33.6 Q36.4 33.4 36.6 21 Q36 9.6 24 9.4 Q12 9.6 11.4 21 Z" fill="#f0c7a2" />
      {/* black hair swept up and tousled to one side, forehead clear, a wave at the temple */}
      <path
        d="M11.2 22 C10.4 16 11.6 11 15 8.2 L14.2 4.6 L18.4 6.4 L19.6 1.8 L23.2 5.2 L26 0.8 L28 5 L32.8 2.2 L32.4 6.6 L37.2 6 L35.6 10.2 C37.6 13 38 17.5 36.8 22 C36 18 34.6 16 32.2 14.8 C29 13.4 26.4 13.6 24 14.2 C21.2 13.4 18 13.8 15.8 15 C13.6 16.4 12 18.6 11.2 22 Z"
        fill="#16141c"
      />
      <path d="M32.6 14.6 q2.6 1.2 3.6 4.4 q-1.8 -1.8 -4.2 -2.6 Z" fill="#16141c" />
      <path d="M18.6 6 L20 8.6 M25.6 3 L25.8 6.2 M31 4.6 L30.2 7.4" stroke="#3a3646" strokeWidth=".8" strokeLinecap="round" />
      {brow(18.6, 1)}
      {brow(29.4, -1)}
      {eye(18.6)}
      {eye(29.4)}
      {/* thin, light metal glasses, slightly squarish */}
      <g stroke="#a39789" strokeWidth=".95" fill="rgba(255,255,255,.12)">
        <rect x="14.1" y="19.5" width="9" height="8.3" rx="3.6" />
        <rect x="24.9" y="19.5" width="9" height="8.3" rx="3.6" />
      </g>
      <path d="M23.1 22.2 Q24 21.4 24.9 22.2 M14.1 22.4 L11.8 21.8 M33.9 22.4 L36.2 21.8" stroke="#a39789" strokeWidth=".85" fill="none" strokeLinecap="round" />
      <path d="M15.6 21.4 Q16.4 20.4 17.8 20.2 M26.4 21.4 Q27.2 20.4 28.6 20.2" stroke="#fff" strokeWidth=".7" opacity=".7" fill="none" strokeLinecap="round" />
      {/* blush and mouth */}
      <ellipse cx="14.8" cy="28.4" rx="2" ry="1.1" fill="#f08a8a" opacity=".38" />
      <ellipse cx="33.2" cy="28.4" rx="2" ry="1.1" fill="#f08a8a" opacity=".38" />
      <path d="M21.8 28.3 q2.2 -0.8 4.4 0" stroke="#8a6248" strokeWidth=".7" opacity=".35" fill="none" strokeLinecap="round" />
      {mouth}
    </svg>
  )
}

/** Where Bit should be right now: pointing at an app, sitting on the front window, or resting by the Dock. */
function targetFor(point: string | null, perch: number, mobile: boolean): { x: number; y: number; sitting: boolean } {
  const VW = innerWidth
  const VH = innerHeight
  if (point) {
    const el = document.querySelector(`[data-dock-app="${point}"], [data-home-app="${point}"]`)
    const r = el?.getBoundingClientRect()
    if (r && r.width && r.top < VH - 4) return { x: r.left + r.width / 2 - W / 2, y: r.top - H - 14, sitting: false }
  }
  if (mobile) {
    const sheet = document.querySelector('.mobile-app')
    return sheet ? { x: VW - W - 12, y: VH - H - 40, sitting: true } : { x: VW - W - 18, y: VH - H - 150, sitting: true }
  }
  const ws = useWindows.getState()
  const front = ws.focusedId ? ws.windows[ws.focusedId] : null
  if (front && !front.minimized) {
    const el = document.querySelector(`[data-window-id="${front.id}"]:not([data-closing])`)
    const r = el?.getBoundingClientRect()
    if (r && r.top > 40) return { x: r.left + 90 + perch * Math.max(0, r.width - 180) - W / 2, y: r.top - H + 3, sitting: true }
  }
  const dock = document.querySelector('[data-dock-divider]')?.parentElement?.getBoundingClientRect()
  const top = dock && dock.top < VH ? dock.top : VH - 70
  return { x: VW * (0.62 + perch * 0.25) - W / 2, y: top - H - 2, sitting: true }
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
    <div ref={box} className="pointer-events-auto fixed left-0 top-0 z-[60] touch-none select-none" style={{ width: W, height: H, transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)` }} data-bit>
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
