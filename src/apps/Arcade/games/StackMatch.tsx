import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { sounds } from '@/lib/sound'
import { discover } from '@/lib/easterEggs'
import { portfolio, skillGroups, skillNotes } from '@/portfolio.config'
import { IconButton } from '@/components/shared/ui'
import { GameOverlay, Stat, StatBar } from '../GameUI'
import { formatTime, useScores, useWindowActive } from '../scores'

/** Each group of the CV's skills gets its own colour, so pairs are easier to remember. */
const GROUP_COLOR: Record<string, string> = {
  ai: '#ff375f',
  agentic: '#5e5ce6',
  frontend: '#0a84ff',
  backend: '#30a14e',
  data: '#ff9f0a',
  devops: '#bf5af2',
  practices: '#64748b',
}

interface Card {
  key: number
  skill: string
  group: string
  color: string
}

const PAIRS = 8

function deal(): Card[] {
  // Short skill names only, so every card reads at a glance.
  const pool = skillGroups.flatMap((g) =>
    g.skills
      .filter((s) => s.length <= 13)
      .map((s) => ({
        skill: s,
        group: g.name,
        color: GROUP_COLOR[g.id] ?? '#64748b',
      })),
  )
  const shuffle = <T,>(a: T[]) => {
    const b = [...a]
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[b[i], b[j]] = [b[j], b[i]]
    }
    return b
  }
  const picked = shuffle(pool).slice(0, PAIRS)
  return shuffle([...picked, ...picked]).map((c, key) => ({ ...c, key }))
}

export default function StackMatch({ windowId }: { windowId: string }) {
  const [cards, setCards] = useState(deal)
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [moves, setMoves] = useState(0)
  const [started, setStarted] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [last, setLast] = useState<Card | null>(null)
  const [newBest, setNewBest] = useState(false)
  const best = useScores((s) => s.best.match)
  const active = useWindowActive(windowId)
  const won = matched.size === PAIRS

  const restart = () => {
    setCards(deal())
    setOpen([])
    setMatched(new Set())
    setMoves(0)
    setStarted(null)
    setElapsed(0)
    setLast(null)
    setNewBest(false)
  }

  useEffect(() => {
    if (started === null || won) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250)
    return () => clearInterval(t)
  }, [started, won])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey && !e.altKey) restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  // Two cards up: keep them if they match, otherwise turn them back after a moment.
  useEffect(() => {
    if (open.length !== 2) return
    const [a, b] = open.map((i) => cards[i])
    if (a.skill === b.skill) {
      const next = new Set(matched).add(a.skill)
      setMatched(next)
      setOpen([])
      setLast(a)
      if (next.size === PAIRS) {
        setElapsed(Math.floor((Date.now() - (started ?? Date.now())) / 1000))
        setNewBest(useScores.getState().record('match', moves, true))
        if (moves <= 12) discover('memory')
        sounds.sent()
      } else sounds.pop()
      return
    }
    const t = setTimeout(() => setOpen([]), 750)
    return () => clearTimeout(t)
    // Runs once per pair turned; the other values are read at that moment.
  }, [open])

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.has(cards[i].skill) || won) return
    if (started === null) setStarted(Date.now())
    if (open.length === 1) setMoves((m) => m + 1)
    sounds.click()
    setOpen([...open, i])
  }

  return (
    <div className="flex h-full flex-col">
      <StatBar
        right={
          <IconButton label="Deal again (R)" onClick={restart}>
            <RotateCcw size={15} />
          </IconButton>
        }
      >
        <Stat label="Moves" value={moves} />
        <Stat label="Pairs" value={`${matched.size}/${PAIRS}`} />
        <Stat label="Time" value={formatTime(elapsed)} />
        <Stat label="Best" value={best === undefined ? '–' : `${best} moves`} />
      </StatBar>

      <div className="relative mx-4 flex min-h-0 flex-1 items-center justify-center" style={{ containerType: 'size' }}>
        <div className="grid grid-cols-4 gap-2" style={{ width: 'min(100cqw, (100cqh - 24px) * 1.33, 620px)' }}>
          {cards.map((c, i) => {
            const up = open.includes(i) || matched.has(c.skill)
            const done = matched.has(c.skill)
            return (
              <button key={c.key} type="button" onClick={() => flip(i)} aria-label={up ? c.skill : `Card ${i + 1}, face down`} aria-pressed={up} className="relative aspect-[4/3] rounded-[10px] [perspective:600px]">
                <span className="absolute inset-0 transition-transform duration-300 ease-out [transform-style:preserve-3d]" style={{ transform: up ? 'rotateY(180deg)' : undefined }}>
                  {/* Back */}
                  <span
                    className="absolute inset-0 grid place-items-center rounded-[10px] text-white/90 shadow-[0_1px_3px_rgba(0,0,0,.18)] [backface-visibility:hidden]"
                    style={{
                      background: 'linear-gradient(140deg, #8b5cf6, #ec4899 60%, #fb923c)',
                    }}
                  >
                    <span className="font-mono text-[clamp(13px,3.2cqw,22px)] font-bold">&lt;/&gt;</span>
                  </span>
                  {/* Face */}
                  <span
                    className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[10px] border bg-[var(--surface-solid)] px-1.5 text-center shadow-[0_1px_3px_rgba(0,0,0,.12)] transition-opacity [backface-visibility:hidden] [transform:rotateY(180deg)] ${done ? 'opacity-60' : ''}`}
                    style={{ borderColor: c.color }}
                  >
                    <span className="h-1.5 w-6 rounded-full" style={{ background: c.color }} />
                    <span className="line-clamp-2 text-[clamp(11px,2.3cqw,15px)] font-semibold leading-tight">{c.skill}</span>
                    <span className="truncate text-[clamp(9px,1.6cqw,11px)] text-[var(--text-3)]">{c.group}</span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        {won && (
          <GameOverlay
            title={newBest ? 'New best!' : 'Stack complete'}
            body={`${PAIRS} pairs in ${moves} moves and ${formatTime(elapsed)}.${!newBest && best !== undefined ? ` Best: ${best} moves.` : ''}`}
            action="Deal again"
            onAction={restart}
          />
        )}
      </div>

      {/* Each match says what the skill is, so the game doubles as a tour of the stack. */}
      <div className="min-h-[44px] shrink-0 px-4 pb-3.5 [.mobile-app_&]:pb-[max(34px,env(safe-area-inset-bottom))] pt-2 text-center text-[12.5px] text-[var(--text-2)]" aria-live="polite">
        {last ? (
          <>
            <span className="font-semibold text-[var(--text)]">{last.skill}</span>
            {skillNotes[last.skill] ? <> · {skillNotes[last.skill]}</> : null}
          </>
        ) : (
          <span className="text-[var(--text-3)]">Find the pairs. Every card is a skill from {portfolio.firstName}’s stack.</span>
        )}
      </div>
    </div>
  )
}
