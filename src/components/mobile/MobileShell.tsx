import { Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BatteryMedium, ChevronLeft, Search, Signal, Wifi } from 'lucide-react'
import { apps } from '@/apps/registry'
import { openApp, useWindows } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { useClock } from '@/hooks/system'
import { portfolio } from '@/portfolio.config'
import { AppIcon } from '@/components/shared/AppIcon'
import { Spinner } from '@/components/shared/ui'
import { Wallpaper } from '@/components/desktop/Wallpaper'
import { Spotlight } from '@/components/desktop/Spotlight'
import { QuickLook } from '@/components/desktop/QuickLook'
import { NotificationCenter } from '@/components/desktop/Panels'
import { LockScreen } from '@/components/desktop/SystemScreens'
import { AppCrashed, ErrorBoundary } from '@/components/shared/ErrorBoundary'
import type { AppId } from '@/types'

/** Where the last tapped icon sits, so the app can zoom out of it like on iPhone. */
let launchRect: DOMRect | null = null

const grid: AppId[] = ['finder', 'experience', 'skills', 'terminal', 'safari', 'github', 'settings', 'trash']
const dock: AppId[] = ['projects', 'about', 'resume', 'contact']

function StatusBar({ light }: { light: boolean }) {
  const now = useClock('minute')
  return (
    <div className={`flex h-[44px] shrink-0 items-center justify-between px-7 pt-[env(safe-area-inset-top)] text-[15px] font-semibold ${light ? 'text-white' : 'text-[var(--text)]'}`}>
      <span className="tabular-nums">{now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '')}</span>
      <span className="flex items-center gap-1.5">
        <Signal size={15} />
        <Wifi size={15} />
        <BatteryMedium size={22} strokeWidth={1.6} />
      </span>
    </div>
  )
}

function Icon({ id, label = true }: { id: AppId; label?: boolean }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={(e) => {
        launchRect = e.currentTarget.querySelector('.app-icon')?.getBoundingClientRect() ?? null
        openApp(id)
      }}
      className="flex flex-col items-center gap-1.5"
      aria-label={apps[id].name}
    >
      <AppIcon appId={id} size={60} />
      {label && <span className="max-w-[72px] truncate text-[11.5px] font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,.7), 0 0 8px rgba(0,0,0,.35)' }}>{apps[id].name}</span>}
    </motion.button>
  )
}

/** Phones get a launcher with full-screen apps instead of a shrunken desktop. */
export default function MobileShell() {
  const focusedId = useWindows((s) => s.focusedId)
  const win = useWindows((s) => (s.focusedId ? s.windows[s.focusedId] : null))
  const overlay = useDesktop((s) => s.overlay)
  const panel = useDesktop((s) => s.panel)
  const system = useDesktop((s) => s.system)
  const appOpen = !!(win && !win.minimized)
  const pushed = useRef(false)

  const goHome = () => {
    const ws = useWindows.getState()
    Object.keys(ws.windows).forEach((id) => ws.minimize(id))
  }
  // The browser Back button returns to the Home Screen, like closing an app.
  const home = () => {
    if (pushed.current) {
      pushed.current = false
      history.back()
    }
    goHome()
  }
  useEffect(() => {
    if (appOpen && !pushed.current) {
      history.pushState({ surajosApp: true }, '')
      pushed.current = true
    }
  }, [appOpen])
  useEffect(() => {
    const onPop = () => {
      if (pushed.current) {
        pushed.current = false
        goHome()
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Home Screen gestures: pull down from the top edge for notifications, swipe down elsewhere for Search.
  const gesture = useRef<{ y: number; x: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    gesture.current = { y: e.clientY, x: e.clientX }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current
    gesture.current = null
    if (!g || appOpen) return
    const dy = e.clientY - g.y
    if (dy < 70 || Math.abs(e.clientX - g.x) > dy) return
    if (g.y < 56) useDesktop.getState().setPanel('notifications')
    else useDesktop.getState().setOverlay('spotlight')
  }

  // Desktop-only overlays have no place on a phone.
  useEffect(() => {
    if (overlay && overlay !== 'spotlight') useDesktop.getState().setOverlay(null)
  }, [overlay])

  const Content = win ? apps[win.appId].component : null

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <Wallpaper />
      <div className="relative flex h-full touch-none flex-col" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (gesture.current = null)} style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <StatusBar light />
        <div className="px-5 pt-2">
          <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => openApp('about')} className="glass flex w-full items-center gap-3 rounded-[22px] p-3.5 text-left text-[var(--text)] shadow-lg">
            <img src={portfolio.profileImage} alt="" className="h-14 w-14 rounded-full object-cover" />
            <span className="min-w-0">
              <span className="block text-[17px] font-bold">{portfolio.name}</span>
              <span className="block text-[13px] text-[var(--text-2)]">{portfolio.title}</span>
              <span className="block text-[12px] text-[var(--text-3)]">{portfolio.location} · {portfolio.availability}</span>
            </span>
          </motion.button>
        </div>
        <div className="grid grid-cols-4 gap-y-6 px-5 pt-7">
          {grid.map((id) => (
            <Icon key={id} id={id} />
          ))}
        </div>
        <div className="mt-auto flex flex-col items-center gap-1 pb-3">
          <span className="text-[11px] text-white/70" style={{ textShadow: '0 1px 2px rgba(0,0,0,.4)' }}>Swipe down to search</span>
          <button type="button" onClick={() => useDesktop.getState().setOverlay('spotlight')} className="glass flex h-8 items-center gap-1.5 rounded-full px-4 text-[13px] text-[var(--text)]">
            <Search size={13} /> Search
          </button>
        </div>
        <div className="glass mx-3 mb-[max(12px,env(safe-area-inset-bottom))] flex justify-around rounded-[30px] px-3 py-3">
          {dock.map((id) => (
            <Icon key={id} id={id} label={false} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {win && Content && !win.minimized && (
          <AppSheet key={focusedId} title={win.title} onHome={home}>
            <Suspense fallback={<div className="grid h-full place-items-center"><Spinner /></div>}>
              <ErrorBoundary fallback={(_, reset) => <AppCrashed name={apps[win.appId].name} onReopen={reset} />}>
                <Content windowId={win.id} props={win.props} />
              </ErrorBoundary>
            </Suspense>
          </AppSheet>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'notifications' && (
          <motion.div key="nc" className="absolute inset-0 z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => useDesktop.getState().setPanel(null)} />
            <NotificationCenter />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{overlay === 'spotlight' && <Spotlight key="sp" />}</AnimatePresence>
      <AnimatePresence>{system !== 'on' && <LockScreen key="lock" />}</AnimatePresence>
      <AnimatePresence>
        <QuickLook />
      </AnimatePresence>
    </div>
  )
}

function zoomFrom() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const r = launchRect
  if (!r) return { scale: 0.9, opacity: 0, x: 0, y: 0, borderRadius: 40 }
  return {
    scale: r.width / vw,
    x: r.left + r.width / 2 - vw / 2,
    y: r.top + r.height / 2 - vh / 2,
    opacity: 0,
    borderRadius: 14 * (vw / r.width),
  }
}

/** A full-screen app with an iOS navigation bar and a home indicator you can swipe up. */
function AppSheet({ title, onHome, children }: { title: string; onHome: () => void; children: React.ReactNode }) {
  const [from] = useState(zoomFrom)
  return (
    <motion.div
      initial={from}
      animate={{ scale: 1, x: 0, y: 0, opacity: 1, borderRadius: 0 }}
      exit={{ ...zoomFrom(), transition: { type: 'spring', stiffness: 380, damping: 36 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="mobile-app absolute inset-0 z-10 flex origin-center flex-col overflow-hidden bg-[var(--surface-solid)]"
      role="dialog"
      aria-label={title}
    >
      <div className="glass-strong flex shrink-0 flex-col border-b border-[var(--border)]">
        <StatusBar light={false} />
        <div className="relative flex h-[44px] items-center px-2">
          <button type="button" onClick={onHome} className="relative z-10 flex items-center text-[17px] text-[var(--accent)]">
            <ChevronLeft size={26} strokeWidth={2.2} className="-mr-0.5" /> Home
          </button>
          <span className="pointer-events-none absolute inset-x-24 truncate text-center text-[17px] font-semibold">{title}</span>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
      <motion.button
        type="button"
        aria-label="Go to Home Screen"
        onClick={onHome}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.6, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -40 || info.velocity.y < -300) onHome()
        }}
        className="absolute inset-x-0 bottom-0 z-20 flex h-[26px] touch-none items-end justify-center pb-[max(8px,env(safe-area-inset-bottom))]"
      >
        <span className="h-[5px] w-[134px] rounded-full bg-[var(--text)] opacity-80" />
      </motion.button>
    </motion.div>
  )
}
