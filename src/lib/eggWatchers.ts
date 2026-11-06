import { useDesktop } from '@/store/desktopStore'
import { useSettings } from '@/store/settingsStore'
import { useWindows } from '@/store/windowStore'
import { apps, dockOrder } from '@/apps/registry'
import { portfolio } from '@/portfolio.config'
import type { AppId } from '@/types'
import { discover, playEffect, shake } from './easterEggs'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']

/** Words that do something when typed on the desktop, outside any text field. */
const WORDS: Record<string, () => void> = {
  secret: () => {
    discover('secret')
    shake()
  },
  [portfolio.firstName.toLowerCase()]: () => {
    discover('name')
    playEffect('confetti')
  },
}

/**
 * Watches for the Easter eggs that come from how the OS is used rather than
 * from one place: key sequences, restarts, the volume, open windows,
 * wallpaper changes and the time of a visit. Returns a function that stops watching.
 */
export function startEggWatchers() {
  // Key sequences typed outside text fields.
  let konami = 0
  let typed = ''
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement
    if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return
    konami = e.code === KONAMI[konami] ? konami + 1 : e.code === KONAMI[0] ? 1 : 0
    if (konami === KONAMI.length) {
      konami = 0
      playEffect('confetti')
      discover('konami')
    }
    if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
      typed = (typed + e.key.toLowerCase()).slice(-24)
      for (const word of Object.keys(WORDS))
        if (typed.endsWith(word)) {
          typed = ''
          WORDS[word]()
        }
    }
  }
  window.addEventListener('keydown', onKey)

  // The time of a visit, checked when the screen unlocks.
  const checkTime = () => {
    const now = new Date()
    if (now.getHours() < 5) discover('nightowl')
    if (now.getDay() === 0 || now.getDay() === 6) discover('weekend')
  }
  if (useDesktop.getState().system === 'on') checkTime()
  const unDesktop = useDesktop.subscribe((s, prev) => {
    if (s.system === 'on' && prev.system !== 'on') checkTime()
    if (s.system === 'booting' && prev.system !== 'booting' && s.bootReason === 'restart') discover('restart')
  })

  // Settings: the volume at full, and the wallpaper changed five times.
  let wallpaperChanges = 0
  const unSettings = useSettings.subscribe((s, prev) => {
    if (s.volume >= 0.99 && prev.volume < 0.99 && s.sound) discover('loud')
    if (s.wallpaper !== prev.wallpaper && ++wallpaperChanges >= 5) discover('decorator')
  })

  // Windows: every Dock app opened at least once, and eight open at a time.
  const opened = new Set<AppId>()
  const needed = dockOrder.filter((id) => apps[id].component)
  const unWindows = useWindows.subscribe((s) => {
    const list = Object.values(s.windows)
    list.forEach((w) => opened.add(w.appId))
    if (list.length >= 8) discover('multitasker')
    if (needed.every((id) => opened.has(id))) discover('explorer')
  })

  return () => {
    window.removeEventListener('keydown', onKey)
    unDesktop()
    unSettings()
    unWindows()
  }
}
