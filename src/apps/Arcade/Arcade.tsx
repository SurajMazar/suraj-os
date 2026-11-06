import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Bug, ChevronLeft, Flag } from 'lucide-react'
import type { AppProps } from '@/types'
import { Spinner } from '@/components/shared/ui'
import { useIsMobile } from '@/hooks/system'
import { formatTime, gameList, useScores, type GameId } from './scores'

const ShipIt = lazy(() => import('./games/ShipIt'))
const BlockDrop = lazy(() => import('./games/BlockDrop'))
const ByteSnake = lazy(() => import('./games/ByteSnake'))
const BugHunt = lazy(() => import('./games/BugHunt'))
const StackMatch = lazy(() => import('./games/StackMatch'))
const TypeSprint = lazy(() => import('./games/TypeSprint'))

interface GameInfo {
  id: GameId
  how: string
  from: string
  to: string
  art: ReactNode
  best: (b: Record<string, number>) => string | null
}

/** Small scenes drawn in CSS, one per game. */
const ShipItArt = (
  <div className="relative h-full w-full overflow-hidden">
    <div className="absolute inset-x-0 bottom-0 h-[26%] bg-slate-600">
      <div className="h-[5px] bg-teal-400" />
    </div>
    <div className="absolute bottom-[44%] left-[38%] flex gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-5 w-5 rounded-[4px] bg-indigo-500 shadow-[inset_0_-2px_0_rgba(0,0,0,.2)]" />
      ))}
    </div>
    {[30, 42, 54].map((l) => (
      <div key={l} className="absolute bottom-[64%] h-3 w-3 rounded-full border-[3px] border-green-500 bg-white" style={{ left: `${l + 12}%` }} />
    ))}
    {/* The hero mid-jump */}
    <div className="absolute bottom-[38%] left-[18%] flex flex-col items-center">
      <div className="h-4 w-4 rounded-full bg-[#f2c6a0] shadow-[inset_0_5px_0_#1f2937]" />
      <div className="-mt-0.5 h-4 w-5 rounded-[5px] bg-teal-500" />
    </div>
    <div className="absolute bottom-[26%] left-[62%] h-3 w-6 rounded-t-full bg-purple-500" />
    <div className="absolute bottom-[26%] right-[8%] h-14 w-5 rounded-t-full bg-white shadow-[inset_0_-10px_0_#f97316]" />
  </div>
)
const BlocksArt = (
  <div className="grid h-full w-full place-items-center">
    <div className="grid grid-cols-6 gap-[2px]">
      {'..aa....a..b..cccbbddd'
        .padStart(36, '.')
        .split('')
        .map((ch, i) => (
          <div key={i} className="h-[15px] w-[15px] rounded-[3px]" style={{ background: { a: '#ff9f0a', b: '#30d158', c: '#ff6482', d: '#64d2ff', '.': 'rgba(255,255,255,.07)' }[ch] }} />
        ))}
    </div>
  </div>
)
const SnakeArt = (
  <div className="grid h-full w-full grid-cols-8 grid-rows-5 gap-[3px] p-3">
    {Array.from({ length: 40 }, (_, i) => {
      const body = [17, 18, 19, 20, 12, 4].indexOf(i)
      return (
        <div
          key={i}
          className="rounded-[3px]"
          style={{
            background: i === 22 ? '#4ade80' : body >= 0 ? `rgba(255,255,255,${1 - body * 0.13})` : 'rgba(255,255,255,.08)',
          }}
        />
      )
    })}
  </div>
)
const BugsArt = (
  <div className="grid h-full w-full grid-cols-6 grid-rows-4 gap-[3px] p-3 text-[11px] font-bold">
    {['', '', '1', 'b', '1', '', '', '1', '2', '2', '1', '', '1', 'f', '1', '', '', '', '1', '1', '1', '', '', ''].map((c, i) => (
      <div key={i} className={`grid place-items-center rounded-[3px] ${c === '' || c === 'b' || c === 'f' ? 'bg-white/25' : 'bg-white/[.06] text-white'}`}>
        {c === 'b' ? <Bug size={12} className="text-white" /> : c === 'f' ? <Flag size={11} className="text-amber-200" fill="currentColor" /> : c}
      </div>
    ))}
  </div>
)
const MatchArt = (
  <div className="relative h-full w-full">
    {[
      ['-14deg', '-34%', 'React'],
      ['10deg', '-66%', 'React'],
    ].map(([rot, x, label], i) => (
      <div
        key={i}
        className="absolute left-1/2 top-1/2 flex h-[62%] w-[34%] flex-col items-center justify-center gap-1 rounded-[8px] bg-white text-[11px] font-semibold text-zinc-800 shadow-lg"
        style={{ transform: `translate(${x}, -50%) rotate(${rot})` }}
      >
        <span className="h-1 w-5 rounded-full bg-sky-500" />
        {label}
      </div>
    ))}
  </div>
)
const TypeArt = (
  <div className="flex h-full w-full flex-col justify-center gap-1 px-4 font-mono text-[12px] leading-tight">
    <div className="text-white/45">
      <span className="text-emerald-200">deploy laravel</span> redis
    </div>
    <div className="text-white">
      <span className="rounded-[3px] bg-white/20 px-0.5">
        <span className="text-white">type</span>
        <span className="text-white/50">script</span>
      </span>
      <span className="caret-blink">▍</span>
    </div>
    <div className="text-white/45">docker kafka merge</div>
  </div>
)

const ART: GameInfo[] = [
  {
    id: 'shipit',
    how: 'Platformer',
    from: '#38bdf8',
    to: '#f59e0b',
    art: ShipItArt,
    best: (b) => (b.shipit ? `${b.shipit} points` : null),
  },
  {
    id: 'blocks',
    how: 'Falling-block puzzle',
    from: '#6366f1',
    to: '#0f172a',
    art: BlocksArt,
    best: (b) => (b.blocks ? `${b.blocks} points` : null),
  },
  {
    id: 'snake',
    how: 'Arrow keys or swipes',
    from: '#22c55e',
    to: '#0f766e',
    art: SnakeArt,
    best: (b) => (b.snake ? `${b.snake} point${b.snake === 1 ? '' : 's'}` : null),
  },
  {
    id: 'bugs',
    how: 'Logic puzzle',
    from: '#f97316',
    to: '#be123c',
    art: BugsArt,
    best: (b) => (b['bugs-easy'] ? `${formatTime(b['bugs-easy'])} on Easy` : b['bugs-medium'] ? `${formatTime(b['bugs-medium'])} on Medium` : null),
  },
  {
    id: 'match',
    how: 'Memory',
    from: '#38bdf8',
    to: '#4f46e5',
    art: MatchArt,
    best: (b) => (b.match ? `${b.match} moves` : null),
  },
  {
    id: 'type',
    how: 'Typing speed',
    from: '#a855f7',
    to: '#db2777',
    art: TypeArt,
    best: (b) => {
      const top = Math.max(b['type-15'] ?? 0, b['type-30'] ?? 0, b['type-60'] ?? 0)
      return top ? `${top} wpm` : null
    },
  },
]

const GAMES = ART.map((a) => ({
  ...a,
  ...gameList.find((g) => g.id === a.id)!,
}))

const isGame = (v: unknown): v is GameId => GAMES.some((g) => g.id === v)

export default function Arcade({ windowId, props }: AppProps) {
  const [game, setGame] = useState<GameId | null>(isGame(props.game) ? props.game : null)
  const best = useScores((s) => s.best)
  const mobile = useIsMobile()

  // Opening the app again with a game named (from Spotlight or Terminal) switches to it.
  useEffect(() => {
    if (isGame(props.game)) setGame(props.game)
  }, [props.game, props.nonce])

  const info = GAMES.find((g) => g.id === game)

  return (
    <div className="flex h-full flex-col bg-[var(--surface-solid)]">
      {/* On a phone the app sheet already shows the title; the bar is only needed to go back. */}
      {(info || !mobile) && (
        <div data-drag-region className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[var(--border)] pl-[86px] pr-3">
          {info ? (
            <>
              <button type="button" onClick={() => setGame(null)} className="-ml-1 flex h-7 items-center rounded-[6px] pr-2 text-[13px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]" aria-label="Back to Arcade">
                <ChevronLeft size={18} /> Arcade
              </button>
              <div className="min-w-0 truncate text-[15px] font-semibold">{info.name}</div>
            </>
          ) : (
            <div className="min-w-0 truncate text-[15px] font-semibold">Arcade</div>
          )}
        </div>
      )}

      {info ? (
        <div className="min-h-0 flex-1">
          <Suspense
            fallback={
              <div className="grid h-full place-items-center">
                <Spinner />
              </div>
            }
          >
            {game === 'shipit' && <ShipIt windowId={windowId} />}
            {game === 'blocks' && <BlockDrop windowId={windowId} />}
            {game === 'snake' && <ByteSnake windowId={windowId} />}
            {game === 'bugs' && <BugHunt windowId={windowId} />}
            {game === 'match' && <StackMatch windowId={windowId} />}
            {game === 'type' && <TypeSprint />}
          </Suspense>
        </div>
      ) : (
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-5 @container">
          <div className="mb-4">
            <h1 className="text-[22px] font-bold leading-tight">Take a break</h1>
            <p className="mt-0.5 text-[13px] text-[var(--text-2)]">Six small games, built from scratch for SurajOS. Best scores stay in this browser.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 @[480px]:grid-cols-2">
            {GAMES.map((g) => {
              const b = g.best(best)
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGame(g.id)}
                  className="group overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] text-left shadow-[0_1px_2px_rgba(0,0,0,.06)] transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,.12)]"
                >
                  <div
                    className="relative h-[132px] overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                    }}
                  >
                    <div className="h-full transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.04]">{g.art}</div>
                  </div>
                  <div className="flex items-end gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold">{g.name}</div>
                      <div className="text-[12.5px] leading-snug text-[var(--text-2)]">{g.tagline}</div>
                      <div className="mt-1 text-[11.5px] text-[var(--text-3)]">{b ? `Best: ${b}` : g.how}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] font-semibold text-white">Play</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
