import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { AppProps } from '@/types'
import { HOME_DIR } from '@/data/fs'
import { useAppCommand } from '@/lib/appEvents'
import { useWindows } from '@/store/windowStore'
import { portfolio } from '@/portfolio.config'
import { commandNames, commands, complete, shortPath, tokenize, type Ctx } from './commands'

interface Entry {
  id: number
  cwd: string
  input: string | null
  output: ReactNode
}

let nextId = 1

function Prompt({ cwd }: { cwd: string }) {
  return (
    <span className="shrink-0">
      <span className="text-[#4ade80]">{portfolio.handle}@SurajOS</span> <span className="font-bold text-[#60a5fa]">{shortPath(cwd)}</span> <span className="text-white/80">%</span>{' '}
    </span>
  )
}

/** Colours the command name as you type: green if it exists, red if not. */
function Highlighted({ text }: { text: string }) {
  const m = text.match(/^(\s*)(\S*)([\s\S]*)$/)
  if (!m) return <>{text}</>
  const [, lead, cmd, rest] = m
  const known = commandNames.includes(cmd)
  return (
    <>
      {lead}
      <span className={cmd ? (known ? 'text-[#4ade80]' : 'text-[#f87171]') : ''}>{cmd}</span>
      <span className="text-[#e5e7eb]">{rest.replace(/(['"][^'"]*['"]?)/g, '$1')}</span>
    </>
  )
}

export default function Terminal({ windowId }: AppProps) {
  const [cwd, setCwd] = useState(HOME_DIR)
  const [entries, setEntries] = useState<Entry[]>(() => [
    {
      id: nextId++,
      cwd: HOME_DIR,
      input: null,
      output: (
        <div>
          <div className="text-white/50">Last login: {new Date().toLocaleString()} on ttys000</div>
          <div>
            Welcome to <span className="font-bold text-white">SurajOS</span>. Type <span className="text-[#4ade80]">help</span> to see what you can do, or try <span className="text-[#4ade80]">neofetch</span>.
          </div>
        </div>
      ),
    },
  ])
  const [input, setInput] = useState('')
  const [cursor, setCursor] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [hIndex, setHIndex] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [entries])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    useWindows.getState().setTitle(windowId, `${portfolio.handle} — zsh — ${shortPath(cwd)}`)
  }, [cwd, windowId])

  const exec = (line: string) => {
    const trimmed = line.trim()
    const entry: Entry = { id: nextId++, cwd, input: line, output: null }
    if (trimmed) setHistory((h) => [...h, trimmed])
    setHIndex(null)
    if (!trimmed) {
      setEntries((e) => [...e, entry])
      return
    }
    const [name, ...args] = tokenize(trimmed)
    const cmd = commands[name]
    let cleared = false
    const ctx: Ctx = {
      cwd,
      setCwd,
      clear: () => {
        cleared = true
      },
      exit: () => setTimeout(() => useWindows.getState().close(windowId), 120),
      history: [...history, trimmed],
    }
    if (!cmd) entry.output = <span className="text-[#f87171]">zsh: command not found: {name}. Type `help` for the list.</span>
    else {
      try {
        entry.output = cmd.run(args, ctx)
      } catch {
        entry.output = <span className="text-[#f87171]">{name}: something went wrong</span>
      }
    }
    if (cleared) setEntries([])
    else setEntries((e) => [...e, entry])
  }

  useAppCommand(windowId, (c, payload) => {
    if (c === 'clear') setEntries([])
    if (c === 'run' && typeof payload === 'string') exec(payload)
  })

  const syncCursor = () => setCursor(inputRef.current?.selectionStart ?? input.length)

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      exec(input)
      setInput('')
      setCursor(0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const i = hIndex === null ? history.length - 1 : Math.max(0, hIndex - 1)
      setHIndex(i)
      setInput(history[i])
      setCursor(history[i].length)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (hIndex === null) return
      const i = hIndex + 1
      if (i >= history.length) {
        setHIndex(null)
        setInput('')
        setCursor(0)
      } else {
        setHIndex(i)
        setInput(history[i])
        setCursor(history[i].length)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const next = complete(input, cwd)
      if (next) {
        setInput(next)
        setCursor(next.length)
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      setEntries([])
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault()
      setEntries((x) => [...x, { id: nextId++, cwd, input: input + '^C', output: null }])
      setInput('')
      setCursor(0)
    } else requestAnimationFrame(syncCursor)
  }

  // Caret position into the coloured mirror.
  const before = input.slice(0, cursor)
  const at = input[cursor] ?? ' '
  const after = input.slice(cursor + 1)

  return (
    <div
      data-terminal
      className="h-full cursor-text bg-[#1b1b1f] font-[family-name:var(--font-mono)] text-[12px] leading-[1.55] text-[#e5e7eb] backdrop-blur-xl"
      onMouseUp={() => {
        if (!window.getSelection()?.toString()) inputRef.current?.focus()
      }}
    >
      <div ref={scroller} className="scroll-thin selectable h-full overflow-y-auto px-3 py-2.5">
        {entries.map((en) => (
          <motion.div key={en.id} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} className="mb-1">
            {en.input !== null && (
              <div className="flex flex-wrap whitespace-pre-wrap break-all">
                <Prompt cwd={en.cwd} />
                <Highlighted text={en.input} />
              </div>
            )}
            {en.output !== null && en.output !== undefined && <div className="whitespace-pre-wrap break-words">{en.output}</div>}
          </motion.div>
        ))}
        <div className="relative flex flex-wrap whitespace-pre-wrap break-all">
          <Prompt cwd={cwd} />
          <span aria-hidden>
            <Highlighted text={before} />
            <span className={`${focused ? 'caret-blink bg-[#e5e7eb] text-[#1b1b1f]' : 'outline outline-1 outline-white/60'}`}>{at}</span>
            <span className="text-[#e5e7eb]">{after}</span>
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setCursor(e.target.selectionStart ?? e.target.value.length)
            }}
            onKeyDown={onKeyDown}
            onKeyUp={syncCursor}
            onClick={syncCursor}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="Terminal input"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="absolute inset-0 h-full w-full opacity-0"
          />
        </div>
      </div>
    </div>
  )
}
