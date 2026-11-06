import { useEffect, useRef, useState } from 'react'
import { Bug, Flag, Pickaxe, RotateCcw } from 'lucide-react'
import { sounds } from '@/lib/sound'
import { discover } from '@/lib/easterEggs'
import { useIsTouch } from '@/hooks/system'
import { IconButton, Segmented } from '@/components/shared/ui'
import { GameOverlay, Stat, StatBar } from '../GameUI'
import { formatTime, useScores, useWindowActive } from '../scores'

type Level = 'easy' | 'medium'
const LEVELS: Record<Level, { cols: number; rows: number; bugs: number; label: string }> = {
  easy: { cols: 9, rows: 9, bugs: 10, label: 'Easy' },
  medium: { cols: 12, rows: 12, bugs: 22, label: 'Medium' },
}

interface Cell {
  bug: boolean
  near: number
  open: boolean
  flag: boolean
}

type Status = 'ready' | 'playing' | 'won' | 'lost'

const blank = (n: number): Cell[] =>
  Array.from({ length: n }, () => ({
    bug: false,
    near: 0,
    open: false,
    flag: false,
  }))

function neighbours(i: number, cols: number, rows: number) {
  const x = i % cols
  const y = Math.floor(i / cols)
  const out: number[] = []
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) out.push(ny * cols + nx)
    }
  return out
}

/** Bugs are placed after the first click, away from it, so the first move is always safe. */
function plant(cells: Cell[], safe: number, cols: number, rows: number, bugs: number) {
  const keepClear = new Set([safe, ...neighbours(safe, cols, rows)])
  const spots = cells.map((_, i) => i).filter((i) => !keepClear.has(i))
  for (let k = spots.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[spots[k], spots[j]] = [spots[j], spots[k]]
  }
  const next = blank(cells.length)
  spots.slice(0, bugs).forEach((i) => (next[i].bug = true))
  next.forEach((c, i) => (c.near = neighbours(i, cols, rows).filter((n) => next[n].bug).length))
  return next
}

/** Opening a cell with no bugs around it opens its neighbours too. */
function reveal(cells: Cell[], start: number, cols: number, rows: number) {
  const next = cells.map((c) => ({ ...c }))
  const stack = [start]
  while (stack.length) {
    const i = stack.pop()!
    const c = next[i]
    if (c.open || c.flag) continue
    c.open = true
    if (!c.bug && c.near === 0) stack.push(...neighbours(i, cols, rows))
  }
  return next
}

const NUMBER_COLORS = ['', '#0a84ff', '#30a14e', '#ff453a', '#7d4cdb', '#c2410c', '#0e7490', 'var(--text)', 'var(--text-2)']

export default function BugHunt({ windowId }: { windowId: string }) {
  const [level, setLevel] = useState<Level>('easy')
  const { cols, rows, bugs } = LEVELS[level]
  const [cells, setCells] = useState<Cell[]>(() => blank(cols * rows))
  const [status, setStatus] = useState<Status>('ready')
  const [mode, setMode] = useState<'dig' | 'flag'>('dig')
  const [started, setStarted] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [newBest, setNewBest] = useState(false)
  const best = useScores((s) => s.best[`bugs-${level}`])
  const active = useWindowActive(windowId)
  const touch = useIsTouch()
  const press = useRef<{
    timer: ReturnType<typeof setTimeout>
    fired: boolean
  } | null>(null)

  const restart = (lv = level) => {
    setCells(blank(LEVELS[lv].cols * LEVELS[lv].rows))
    setStatus('ready')
    setStarted(null)
    setElapsed(0)
    setNewBest(false)
  }

  useEffect(() => {
    if (status !== 'playing' || started === null) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250)
    return () => clearInterval(t)
  }, [status, started])

  // R starts over while the window is in front.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey && !e.altKey) restart()
      if (e.code === 'KeyF' && !e.metaKey && !e.ctrlKey && !e.altKey) setMode((m) => (m === 'dig' ? 'flag' : 'dig'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const finish = (next: Cell[], won: boolean) => {
    const time = Math.max(1, Math.floor((Date.now() - (started ?? Date.now())) / 1000))
    setElapsed(time)
    if (won) {
      setCells(next.map((c) => (c.bug ? { ...c, flag: true } : c)))
      setNewBest(useScores.getState().record(`bugs-${level}`, time, true))
      setStatus('won')
      discover('exterminator')
      sounds.sent()
    } else {
      setCells(next.map((c) => (c.bug ? { ...c, open: true } : c)))
      setStatus('lost')
      sounds.error()
    }
  }

  const dig = (i: number) => {
    if (status === 'won' || status === 'lost') return
    let board = cells
    if (status === 'ready') {
      board = plant(cells, i, cols, rows, bugs)
      setStarted(Date.now())
      setStatus('playing')
    }
    const c = board[i]
    if (c.flag) return
    // Clicking an opened number whose bugs are all flagged opens the rest around it.
    let targets = [i]
    if (c.open) {
      const around = neighbours(i, cols, rows)
      if (c.near === 0 || around.filter((n) => board[n].flag).length !== c.near) return
      targets = around.filter((n) => !board[n].open && !board[n].flag)
    }
    let next = board
    for (const t of targets) next = reveal(next, t, cols, rows)
    if (targets.some((t) => next[t].bug)) return finish(next, false)
    sounds.click()
    if (next.every((x) => x.bug || x.open)) return finish(next, true)
    setCells(next)
  }

  const flag = (i: number) => {
    if (status !== 'playing' || cells[i].open) return
    sounds.pop()
    setCells(cells.map((c, k) => (k === i ? { ...c, flag: !c.flag } : c)))
  }

  const flags = cells.filter((c) => c.flag).length

  return (
    <div className="flex h-full flex-col">
      <StatBar
        right={
          <>
            <Segmented
              label="Difficulty"
              value={level}
              onChange={(lv) => {
                setLevel(lv)
                restart(lv)
              }}
              options={(Object.keys(LEVELS) as Level[]).map((lv) => ({
                value: lv,
                label: LEVELS[lv].label,
                title: `${LEVELS[lv].label}: ${LEVELS[lv].cols}×${LEVELS[lv].rows}, ${LEVELS[lv].bugs} bugs`,
              }))}
            />
            <IconButton label="New board (R)" onClick={() => restart()}>
              <RotateCcw size={15} />
            </IconButton>
          </>
        }
      >
        <Stat label="Bugs left" value={bugs - flags} />
        <Stat label="Time" value={formatTime(elapsed)} />
        <Stat label="Best" value={best === undefined ? '–' : formatTime(best)} />
      </StatBar>

      <div className="relative mx-4 mb-3 flex min-h-0 flex-1 items-center justify-center" style={{ containerType: 'size' }}>
        <div
          className="grid touch-manipulation gap-[3px] rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] p-[5px]"
          // As big as the space allows, never taller or wider than it, and square.
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            width: 'min(100cqw, 100cqh, 560px)',
            aspectRatio: `${cols} / ${rows}`,
            fontSize: `calc(min(100cqw, 100cqh, 560px) / ${cols} * 0.46)`,
          }}
          role="grid"
          aria-label="Bug Hunt board"
          onContextMenu={(e) => e.preventDefault()}
        >
          {cells.map((c, i) => {
            const shown = c.open
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                aria-label={shown ? (c.bug ? 'Bug' : c.near ? `${c.near} bugs nearby` : 'Clear') : c.flag ? 'Flagged' : 'Hidden'}
                onClick={() => {
                  if (press.current?.fired) return
                  if (mode === 'flag' && !c.open) flag(i)
                  else dig(i)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  flag(i)
                }}
                onPointerDown={(e) => {
                  if (e.pointerType !== 'touch') return
                  const p = {
                    fired: false,
                    timer: setTimeout(() => {
                      p.fired = true
                      flag(i)
                    }, 380),
                  }
                  press.current = p
                }}
                onPointerUp={() => press.current && clearTimeout(press.current.timer)}
                onPointerLeave={() => press.current && clearTimeout(press.current.timer)}
                className={`grid aspect-square min-w-0 place-items-center rounded-[4px] font-bold transition-colors ${
                  shown
                    ? c.bug
                      ? 'bg-[color-mix(in_srgb,var(--sys-red)_22%,transparent)] text-[var(--sys-red)]'
                      : 'bg-transparent'
                    : 'bg-[color-mix(in_srgb,var(--accent)_20%,var(--surface-solid))] shadow-[inset_0_-2px_0_rgba(0,0,0,.1),inset_0_0_0_.5px_color-mix(in_srgb,var(--accent)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_30%,var(--surface-solid))]'
                }`}
                style={shown && !c.bug ? { color: NUMBER_COLORS[c.near] } : undefined}
              >
                {shown ? c.bug ? <Bug size="58%" /> : c.near || '' : c.flag ? <Flag size="52%" className="text-[var(--sys-orange)]" fill="currentColor" /> : ''}
              </button>
            )
          })}
        </div>
        {status === 'won' && (
          <GameOverlay title={newBest ? 'New best time!' : 'All bugs found'} body={`Cleared in ${formatTime(elapsed)}.${!newBest && best !== undefined ? ` Best: ${formatTime(best)}.` : ''}`} action="New board" onAction={() => restart()} />
        )}
        {status === 'lost' && <GameOverlay title="A bug got out" body="That tile was hiding a bug. Numbers count the bugs in the 8 tiles around them." action="Try again" onAction={() => restart()} />}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3 px-4 pb-3.5 [.mobile-app_&]:pb-[max(34px,env(safe-area-inset-bottom))] text-[12px] text-[var(--text-3)]">
        {touch ? (
          <Segmented
            label="Tap action"
            value={mode}
            onChange={setMode}
            options={[
              {
                value: 'dig',
                label: (
                  <span className="flex items-center gap-1 px-1">
                    <Pickaxe size={13} /> Dig
                  </span>
                ),
                title: 'Dig',
              },
              {
                value: 'flag',
                label: (
                  <span className="flex items-center gap-1 px-1">
                    <Flag size={13} /> Flag
                  </span>
                ),
                title: 'Flag',
              },
            ]}
          />
        ) : null}
        <span>{touch ? 'Long-press to flag.' : 'Click to dig, right-click to flag. Click a number to clear around it.'}</span>
      </div>
    </div>
  )
}
