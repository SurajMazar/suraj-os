import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppId } from '@/types'
import { useWindows } from '@/store/windowStore'
import { sounds } from '@/lib/sound'
import { discover, playEffect } from '@/lib/easterEggs'
import { asides, chapters, companionLines, prologue, type Line, type Mood } from './story'

/** Saved in the browser: how far the visitor got. */
interface Progress {
  started: boolean
  /** 0 is the prologue, 1–7 the chapters, 8 the end. */
  chapter: number
  found: string[]
  /** Bit has been put away and is not on the desktop. */
  away: boolean
  /** Asides already said, so each is said once. */
  said: string[]
}

interface Talk {
  lines: Line[]
  index: number
  choices: { label: string; run: () => void }[] | null
  /** Runs when the last line is dismissed. */
  then: (() => void) | null
  mood: Mood
  /** The app Bit is pointing at, if any. */
  point: AppId | null
  /** Short remarks that close themselves. */
  aside: Line | null
}

interface QuestStore extends Progress, Talk {
  start: () => void
  putAway: () => void
  wake: () => void
  restart: () => void
  next: () => void
  poke: () => void
  handle: (event: string, data?: string) => void
}

const DONE = chapters.length + 1

const blankTalk: Talk = { lines: [], index: 0, choices: null, then: null, mood: 'neutral', point: null, aside: null }

/** Whether a chapter’s goal is already met when it begins (its app is open), so the visitor isn’t asked twice. */
function alreadyMet(event: string) {
  if (!event.startsWith('open:')) return false
  const id = event.slice(5)
  return Object.values(useWindows.getState().windows).some((w) => w.appId === id && !w.minimized)
}

export const useQuest = create<QuestStore>()(
  persist(
    (set, get) => {
      const say = (lines: Line[], opts: { choices?: Talk['choices']; then?: Talk['then']; point?: AppId | null } = {}) =>
        set({ lines, index: 0, choices: opts.choices ?? null, then: opts.then ?? null, mood: lines[0]?.mood ?? 'neutral', point: opts.point ?? get().point, aside: null })

      const begin = (n: number) => {
        const ch = chapters[n - 1]
        set({ chapter: n, point: ch.app })
        say(ch.intro, {
          point: ch.app,
          then: () => {
            if (alreadyMet(ch.event)) get().handle(ch.event)
          },
        })
      }

      const finish = () => {
        set({ chapter: DONE, point: null })
        discover('lostbit')
        playEffect('confetti')
        sounds.startup()
      }

      return {
        started: false,
        chapter: 0,
        found: [],
        away: false,
        said: [],
        ...blankTalk,

        start: () => {
          const s = get()
          if (s.started && s.chapter > 0) return get().wake()
          set({ started: true, away: false, chapter: 0 })
          say(prologue, {
            choices: [
              { label: 'Let’s find them', run: () => begin(1) },
              {
                label: 'Maybe later',
                run: () => {
                  say([{ text: 'Okay. I’ll curl up in the Lost Bit app. Open it when you’re ready.', mood: 'sad' }], { then: () => set({ away: true }) })
                },
              },
            ],
          })
        },

        putAway: () => set({ away: true, ...blankTalk }),

        wake: () => {
          const s = get()
          set({ away: false })
          if (!s.started) return get().start()
          if (s.chapter === 0) return get().start()
          if (s.chapter >= DONE) return say([{ text: 'Hi again! Click me any time for a fun fact.', mood: 'happy' }], { point: null })
          begin(s.chapter)
        },

        restart: () => {
          set({ started: false, chapter: 0, found: [], away: false, said: [], ...blankTalk })
          get().start()
        },

        next: () => {
          const s = get()
          if (s.choices && s.index >= s.lines.length - 1) return
          if (s.index < s.lines.length - 1) {
            const index = s.index + 1
            sounds.click()
            return set({ index, mood: s.lines[index].mood ?? 'neutral' })
          }
          const then = s.then
          set({ lines: [], index: 0, then: null, choices: null })
          then?.()
        },

        /** Clicking Bit: repeat the current goal, or share a fact once the story is done. */
        poke: () => {
          const s = get()
          if (s.lines.length) return get().next()
          if (!s.started || s.chapter === 0) return get().start()
          if (s.chapter >= DONE) return say([companionLines[Math.floor(Math.random() * companionLines.length)]])
          const ch = chapters[s.chapter - 1]
          say([{ text: `Next piece: ${ch.objective.charAt(0).toLowerCase()}${ch.objective.slice(1)}. I’ll point the way!`, mood: 'thinking' }], { point: ch.app })
        },

        handle: (event, data) => {
          const s = get()
          if (!s.started || s.away) return
          const ch = s.chapter >= 1 && s.chapter < DONE ? chapters[s.chapter - 1] : null
          if (ch && event === ch.event) {
            if (s.found.includes(ch.id)) return
            set({ found: [...s.found, ch.id], point: null })
            sounds.notify()
            const last = s.chapter === chapters.length
            say([...ch.outro(data), ...(last ? [] : [{ text: `Memory ${s.found.length + 1} of ${chapters.length} restored.`, mood: 'happy' as Mood }])], { point: null, then: () => (last ? finish() : begin(s.chapter + 1)) })
            return
          }
          // A remark about other apps, once each, without interrupting the story.
          if (event.startsWith('open:') && !s.lines.length) {
            const id = event.slice(5) as AppId
            const line = asides[id]
            if (line && !s.said.includes(id)) {
              set({ said: [...s.said, id], aside: line, mood: line.mood ?? 'neutral' })
              setTimeout(() => {
                if (get().aside === line) set({ aside: null })
              }, 3800)
            }
          }
        },
      }
    },
    {
      name: 'surajos-lostbit',
      version: 1,
      partialize: (s) => ({ started: s.started, chapter: s.chapter, found: s.found, away: s.away, said: s.said }),
    },
  ),
)

export const questDone = (chapter: number) => chapter >= DONE
export const emitQuest = (event: string, data?: string) => useQuest.getState().handle(event, data)

/** Watches windows so opening (or restoring) an app tells the story about it. */
export function startQuestWatchers() {
  const seen = new Map<string, boolean>()
  return useWindows.subscribe((s) => {
    for (const w of Object.values(s.windows)) {
      const was = seen.get(w.id)
      if (!w.minimized && (was === undefined || was === true)) emitQuest(`open:${w.appId}`)
      seen.set(w.id, w.minimized)
    }
    for (const id of [...seen.keys()]) if (!s.windows[id]) seen.delete(id)
  })
}
