import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useWindows } from '@/store/windowStore'

export type GameId = 'shipit' | 'blocks' | 'snake' | 'bugs' | 'match' | 'type'

/** The games, for the Arcade and for Spotlight. */
export const gameList: {
  id: GameId
  name: string
  tagline: string
  keywords: string
}[] = [
  { id: 'shipit', name: 'Ship It', tagline: 'Run, jump and deploy.', keywords: 'platformer jump run side-scroller' },
  { id: 'blocks', name: 'Block Drop', tagline: 'Fill the rows before the stack tops out.', keywords: 'falling blocks puzzle lines' },
  {
    id: 'snake',
    name: 'Byte Snake',
    tagline: 'Eat bytes, grow, don’t crash.',
    keywords: 'snake arcade',
  },
  {
    id: 'bugs',
    name: 'Bug Hunt',
    tagline: 'Clear the board without waking a bug.',
    keywords: 'mines puzzle logic',
  },
  {
    id: 'match',
    name: 'Stack Match',
    tagline: 'Pair up the skills from the CV.',
    keywords: 'memory pairs cards',
  },
  {
    id: 'type',
    name: 'Type Sprint',
    tagline: 'How fast can you type the stack?',
    keywords: 'typing speed wpm',
  },
]

interface ScoreStore {
  /** Best result per game (and per level where a game has levels). Stays in this browser. */
  best: Record<string, number>
  /** Records a result and says whether it beat the previous best. */
  record: (key: string, value: number, lowerIsBetter?: boolean) => boolean
  reset: () => void
}

export const useScores = create<ScoreStore>()(
  persist(
    (set, get) => ({
      best: {},
      record: (key, value, lowerIsBetter = false) => {
        const prev = get().best[key]
        const better = prev === undefined || (lowerIsBetter ? value < prev : value > prev)
        if (better) set((s) => ({ best: { ...s.best, [key]: value } }))
        return better
      },
      reset: () => set({ best: {} }),
    }),
    { name: 'surajos-arcade', version: 1 },
  ),
)

/** True while this game's window is the one in front, so its keys never reach other apps. */
export const useWindowActive = (windowId: string) => useWindows((s) => s.focusedId === windowId)

export function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
