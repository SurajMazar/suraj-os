import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { sounds } from '@/lib/sound'
import { discover } from '@/lib/easterEggs'
import { skillGroups } from '@/portfolio.config'
import { IconButton, Segmented } from '@/components/shared/ui'
import { GameOverlay, Kbd, Stat, StatBar } from '../GameUI'
import { useScores } from '../scores'

/** One-word skills from the CV, plus everyday engineering words to fill the line. */
const WORDS = [
  ...new Set([
    ...skillGroups
      .flatMap((g) => g.skills)
      .filter((s) => /^[A-Za-z][A-Za-z.]*$/.test(s) && s.length <= 12)
      .map((s) => s.toLowerCase()),
    ...'deploy commit merge branch refactor async await promise schema query render state hook cache queue token prompt agent review test build ship fix release patch debug index route model stream parse fetch type lint pipeline worker cluster table field invoice extract validate'.split(
      ' ',
    ),
  ]),
]

type Length = 15 | 30 | 60
type Status = 'ready' | 'running' | 'done'

function sample(n: number) {
  return Array.from({ length: n }, () => WORDS[Math.floor(Math.random() * WORDS.length)])
}

export default function TypeSprint() {
  const [length, setLength] = useState<Length>(30)
  const [words, setWords] = useState(() => sample(150))
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [results, setResults] = useState<boolean[]>([])
  const [status, setStatus] = useState<Status>('ready')
  const [endsAt, setEndsAt] = useState(0)
  const [left, setLeft] = useState<number>(length)
  const [now, setNow] = useState(0)
  const [newBest, setNewBest] = useState(false)
  const best = useScores((s) => s.best[`type-${length}`])
  const input = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const current = useRef<HTMLSpanElement>(null)

  // Characters of correctly typed words, with the spaces after them, as typing tests count them.
  const correctChars = useMemo(() => results.reduce((n, ok, i) => (ok ? n + words[i].length + 1 : n), 0), [results, words])
  // Live speed from the exact time typed so far; the first two seconds are too short to mean anything.
  const elapsed = status === 'ready' ? 0 : length - Math.max(0, (endsAt - now) / 1000)
  const wpm = elapsed >= 2 ? Math.round(correctChars / 5 / (elapsed / 60)) : 0
  const accuracy = results.length ? Math.round((results.filter(Boolean).length / results.length) * 100) : 100

  const restart = (len: Length = length) => {
    setWords(sample(150))
    setIndex(0)
    setTyped('')
    setResults([])
    setStatus('ready')
    setLeft(len)
    setNewBest(false)
    requestAnimationFrame(() => input.current?.focus())
  }

  useEffect(() => {
    if (status !== 'running') return
    const t = setInterval(() => {
      const t = Date.now()
      setNow(t)
      const remaining = Math.max(0, Math.ceil((endsAt - t) / 1000))
      setLeft(remaining)
      if (remaining === 0) setStatus('done')
    }, 100)
    return () => clearInterval(t)
  }, [status, endsAt])

  useEffect(() => {
    if (status !== 'done') return
    const finalWpm = Math.round(correctChars / 5 / (length / 60))
    if (finalWpm >= 60) discover('fingers')
    setNewBest(finalWpm > 0 && useScores.getState().record(`type-${length}`, finalWpm))
    sounds.sent()
    input.current?.blur()
    // Scores once, when time runs out.
  }, [status])

  // Keep the line being typed at the top of the three visible lines.
  useLayoutEffect(() => {
    const b = box.current
    const c = current.current
    if (b && c) b.scrollTop = Math.max(0, c.offsetTop - b.offsetTop - 4)
  }, [index])

  const onChange = (value: string) => {
    if (status === 'done') return
    if (status === 'ready') {
      setStatus('running')
      setNow(Date.now())
      setEndsAt(Date.now() + length * 1000)
    }
    if (value.endsWith(' ')) {
      const word = value.trim()
      if (!word) return
      const ok = word === words[index]
      if (!ok) sounds.error()
      setResults((r) => [...r, ok])
      setIndex((i) => i + 1)
      setTyped('')
      if (index > words.length - 40) setWords((w) => [...w, ...sample(100)])
      return
    }
    setTyped(value)
  }

  const target = words[index] ?? ''
  const wrongSoFar = !target.startsWith(typed)

  return (
    <div className="flex h-full flex-col">
      <StatBar
        right={
          <>
            <Segmented
              label="Length"
              value={String(length) as `${Length}`}
              onChange={(v) => {
                const len = Number(v) as Length
                setLength(len)
                restart(len)
              }}
              options={[15, 30, 60].map((n) => ({
                value: String(n) as `${Length}`,
                label: `${n}s`,
                title: `${n} seconds`,
              }))}
            />
            <IconButton label="Restart" onClick={() => restart()}>
              <RotateCcw size={15} />
            </IconButton>
          </>
        }
      >
        <Stat label="Time" value={`${left}s`} />
        <Stat label="WPM" value={wpm} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Best" value={best === undefined ? '–' : `${best} wpm`} />
      </StatBar>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 pb-4" onClick={() => input.current?.focus()}>
        <div className="h-[3px] w-full max-w-[640px] overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full origin-left rounded-full bg-[var(--accent)] transition-transform duration-100 ease-linear"
            style={{
              transform: `scaleX(${status === 'ready' ? 1 : left / length})`,
            }}
          />
        </div>
        <div ref={box} className="relative h-[calc(3*1.9em)] w-full max-w-[640px] overflow-hidden font-mono text-[clamp(16px,2.6vw,21px)] leading-[1.9]" aria-label="Words to type">
          <div className="flex flex-wrap gap-x-[0.62em]">
            {words.map((w, i) => {
              const done = i < index
              const isCurrent = i === index
              return (
                <span
                  key={i}
                  ref={isCurrent ? current : undefined}
                  className={`rounded-[4px] ${done ? (results[i] ? 'text-[var(--sys-green)]' : 'text-[var(--sys-red)] line-through decoration-1') : isCurrent ? 'bg-[var(--accent-soft)] px-[2px] text-[var(--text)]' : 'text-[var(--text-3)]'}`}
                >
                  {isCurrent
                    ? w.split('').map((ch, k) => (
                        <span key={k} className={k < typed.length ? (typed[k] === ch ? 'text-[var(--accent)]' : 'text-[var(--sys-red)]') : undefined}>
                          {ch}
                        </span>
                      ))
                    : w}
                </span>
              )
            })}
          </div>
        </div>
        <input
          ref={input}
          value={typed}
          onChange={(e) => onChange(e.target.value)}
          disabled={status === 'done'}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="Type the highlighted word"
          placeholder={status === 'ready' ? 'Start typing…' : ''}
          className={`h-[40px] w-full max-w-[320px] rounded-[9px] border bg-[var(--surface-2)] px-3 text-center font-mono text-[16px] outline-none transition-colors focus:border-[var(--accent)] ${wrongSoFar ? 'border-[var(--sys-red)]' : 'border-[var(--border-strong)]'}`}
        />
        <div className="text-[12px] text-[var(--text-3)]">
          Type each word and press <Kbd>Space</Kbd>. The clock starts on your first key.
        </div>
        {status === 'done' && (
          <GameOverlay
            title={newBest ? 'New best!' : 'Time!'}
            body={`${Math.round(correctChars / 5 / (length / 60))} words per minute at ${accuracy}% accuracy.${!newBest && best !== undefined ? ` Best: ${best} wpm.` : ''}`}
            action="Go again"
            onAction={() => restart()}
          />
        )}
      </div>
    </div>
  )
}
