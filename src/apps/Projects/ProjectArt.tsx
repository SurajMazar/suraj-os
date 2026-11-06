import { motion } from 'motion/react'
import type { Project } from '@/portfolio.config'

/** Small, abstract mock-ups of each product, drawn in CSS so nothing is a screenshot. */
function Mock({ p }: { p: Project }) {
  const a = p.theme.accent
  const line = (w: string, o = 0.5, h = 4) => <div className="rounded-full bg-white" style={{ width: w, height: h, opacity: o }} />
  switch (p.preview) {
    case 'sheet':
      return (
        <div className="grid h-full grid-cols-5 grid-rows-6 gap-px overflow-hidden rounded-[6px] bg-white/30">
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="bg-white/80" style={{ background: i < 5 ? a : i % 7 === 3 ? '#bbf7d0' : 'rgba(255,255,255,.85)' }} />
          ))}
        </div>
      )
    case 'terminal':
      return (
        <div className="h-full rounded-[6px] bg-black/70 p-2 font-mono text-[9px] leading-[1.5] text-white/80">
          <div>
            <span style={{ color: a }}>$</span> trove pr list
          </div>
          <div className="text-white/50">#42 feat: releases · github</div>
          <div className="text-white/50">!17 fix: pipeline · gitlab</div>
          <div>
            <span style={{ color: a }}>$</span> trove release create<span className="caret-blink">▍</span>
          </div>
        </div>
      )
    case 'code':
      return (
        <div className="h-full space-y-1.5 rounded-[6px] bg-black/55 p-2.5">
          <div className="flex gap-1">{line('20%', 0.9)}{line('35%', 0.4)}</div>
          <div className="flex gap-1 pl-3">{line('30%', 0.6)}{line('25%', 0.9)}</div>
          <div className="flex gap-1 pl-3">{line('45%', 0.4)}</div>
          <div className="flex gap-1 pl-6">{line('25%', 0.9)}{line('20%', 0.5)}</div>
          <div className="flex gap-1">{line('15%', 0.9)}</div>
        </div>
      )
    case 'video':
      return (
        <div className="relative h-full overflow-hidden rounded-[6px] bg-black/40">
          <div className="absolute inset-3 rounded-[4px] bg-white/15" />
          <div className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90">
            <div className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent" style={{ borderLeftColor: p.theme.to }} />
          </div>
          <div className="absolute inset-x-3 bottom-2 h-1 rounded-full bg-white/30">
            <motion.div className="h-full origin-left rounded-full bg-white" animate={{ scaleX: [0.1, 0.9] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
          </div>
        </div>
      )
    case 'calendar':
      return (
        <div className="grid h-full grid-cols-7 gap-[3px] rounded-[6px] bg-white/85 p-2">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="rounded-[2px]" style={{ background: i === 17 ? p.theme.from : i % 7 === 6 ? '#fecaca' : '#f1f5f9' }} />
          ))}
        </div>
      )
    case 'search':
      return (
        <div className="h-full space-y-2 rounded-[6px] bg-white/85 p-2.5">
          <div className="flex h-5 items-center rounded-full bg-zinc-200 px-2">
            <div className="h-1.5 w-1/3 rounded-full" style={{ background: p.theme.from }} />
          </div>
          {[70, 55, 62].map((w) => (
            <div key={w} className="space-y-1">
              <div className="h-1.5 rounded-full" style={{ width: `${w}%`, background: p.theme.to }} />
              <div className="h-1 w-[85%] rounded-full bg-zinc-300" />
            </div>
          ))}
        </div>
      )
    case 'player':
      return (
        <div className="grid h-full grid-cols-[30%_1fr] gap-1.5 rounded-[6px] bg-white/85 p-1.5">
          <div className="space-y-1 rounded-[4px] bg-zinc-100 p-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-2 rounded-[2px]" style={{ background: i === 1 ? p.theme.to : '#d4d4d8' }} />
            ))}
          </div>
          <div className="relative rounded-[4px]" style={{ background: p.theme.from }}>
            <div className="absolute inset-x-2 bottom-2 h-1 rounded-full bg-white/40">
              <div className="h-full w-2/5 rounded-full bg-white" />
            </div>
          </div>
        </div>
      )
    case 'review':
      return (
        <div className="grid h-full grid-cols-2 gap-1.5 rounded-[6px] bg-white/85 p-1.5">
          <div className="space-y-1 rounded-[4px] bg-zinc-100 p-1.5">
            {[90, 70, 80, 50, 75].map((w, i) => (
              <div key={i} className="h-1 rounded-full" style={{ width: `${w}%`, background: i === 2 ? p.theme.from : '#d4d4d8' }} />
            ))}
          </div>
          <div className="space-y-1.5 p-0.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-3 flex-1 rounded-[3px] border border-zinc-300 bg-white" style={i === 1 ? { borderColor: p.theme.from } : undefined} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: i === 2 ? '#f59e0b' : '#22c55e' }} />
              </div>
            ))}
            <div className="mt-1 h-3 rounded-[3px]" style={{ background: p.theme.from }} />
          </div>
        </div>
      )
    case 'diff':
      return (
        <div className="h-full space-y-[3px] rounded-[6px] bg-black/50 p-2 font-mono text-[8px]">
          {['- old_logic()', '+ custom_logic()', '  keep()', '+ edited_manually'].map((l, i) => (
            <div key={i} className="rounded-[2px] px-1" style={{ background: l.startsWith('-') ? 'rgba(239,68,68,.35)' : l.startsWith('+') ? 'rgba(52,211,153,.3)' : 'transparent', color: '#e5e7eb' }}>
              {l}
            </div>
          ))}
          <div className="mt-1 inline-block rounded-full px-1.5 py-[1px] text-[7px] font-bold text-black" style={{ background: a }}>
            Edited manually
          </div>
        </div>
      )
    case 'map':
      return (
        <svg viewBox="0 0 120 70" className="h-full w-full rounded-[6px] bg-white/20">
          <path d="M5 50 Q20 20 40 35 T75 25 T115 40 L115 65 L5 65Z" fill="rgba(255,255,255,.35)" />
          <path d="M10 60 Q35 40 60 52 T112 50" fill="none" stroke={a} strokeWidth="1.5" strokeDasharray="3 2" />
          {[
            [30, 38, '#ef4444'],
            [62, 30, '#f59e0b'],
            [90, 42, '#fde047'],
          ].map(([x, y, c], i) => (
            <circle key={i} cx={x as number} cy={y as number} r="6" fill={c as string} opacity=".7">
              <animate attributeName="r" values="4;8;4" dur="3s" begin={`${i}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      )
    case 'ballot':
      return (
        <div className="h-full space-y-1.5 rounded-[6px] bg-white/90 p-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ background: p.theme.to }} />
            <div className="h-1.5 w-1/2 rounded-full" style={{ background: p.theme.from }} />
            <div className="ml-auto text-[7px] font-bold text-zinc-500">EN | नेपाली</div>
          </div>
          {[80, 62, 45].map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-2 rounded-[2px]" style={{ width: `${w}%`, background: i === 0 ? p.theme.from : '#cbd5e1' }} />
            </div>
          ))}
        </div>
      )
    case 'shop':
      return (
        <div className="grid h-full grid-cols-3 gap-1.5 rounded-[6px] bg-white/85 p-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-0.5 rounded-[3px] bg-zinc-100 p-1">
              <div className="flex-1 rounded-[2px]" style={{ background: i % 2 ? p.theme.accent : p.theme.to, opacity: 0.8 }} />
              <div className="h-1 w-3/4 rounded-full bg-zinc-300" />
            </div>
          ))}
        </div>
      )
  }
}

export function ProjectArt({ p, className = '' }: { p: Project; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${p.theme.from}, ${p.theme.to})` }}>
      {/* A soft highlight drawn with a gradient, not a blur filter, so twelve cards stay cheap to paint. */}
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.16), rgba(255,255,255,0) 70%)' }} />
      <div className="absolute inset-x-[12%] bottom-0 top-[18%] rounded-t-[10px] bg-white/15 p-[4%] shadow-[0_-4px_24px_rgba(0,0,0,.16)] transition-transform duration-300 ease-out will-change-transform group-hover:-translate-y-1.5">
        <Mock p={p} />
      </div>
    </div>
  )
}
