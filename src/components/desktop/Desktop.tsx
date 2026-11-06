import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useDesktop } from '@/store/desktopStore'
import { getSettings, useSettings } from '@/store/settingsStore'
import { openApp, useWindows } from '@/store/windowStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useLayout } from '@/store/layoutStore'
import { useReduceMotion } from '@/hooks/system'
import { Wallpaper } from './Wallpaper'
import { MenuBar } from './MenuBar'
import { Dock } from './Dock'
import { WindowManager } from './WindowManager'
import { DesktopIcons } from './DesktopIcons'
import { Widgets } from './Widgets'
import { Spotlight } from './Spotlight'
import { Launchpad } from './Launchpad'
import { MissionBackdrop, MissionLabels } from './MissionControl'
import { Banner, ControlCenter, NotificationCenter } from './Panels'
import { ContextMenu } from './ContextMenu'
import { QuickLook } from './QuickLook'
import { AppSwitcher } from './AppSwitcher'
import { BootScreen, LockScreen, OffScreen, SleepScreen } from './SystemScreens'

function desktopMenu() {
  const s = getSettings()
  const set = useSettings.getState().set
  const d = useDesktop.getState()
  return [
    { label: 'New Finder Window', action: () => openApp('finder') },
    { label: 'Open Terminal', action: () => openApp('terminal') },
    { label: '', separator: true },
    { label: 'Clean Up', action: () => useLayout.getState().cleanUp() },
    { label: '', separator: true },
    { label: 'Change Wallpaper…', action: () => openApp('settings', { section: 'wallpaper' }) },
    { label: s.appearance === 'dark' ? 'Use Light Appearance' : 'Use Dark Appearance', action: () => set('appearance', s.appearance === 'dark' ? 'light' : 'dark') },
    { label: s.showDesktopIcons ? 'Hide Desktop Icons' : 'Show Desktop Icons', action: () => set('showDesktopIcons', !s.showDesktopIcons) },
    { label: s.showWidgets ? 'Hide Widgets' : 'Show Widgets', action: () => set('showWidgets', !s.showWidgets) },
    { label: '', separator: true },
    { label: 'Mission Control', action: () => d.setOverlay('mission') },
    { label: 'About This Mac', action: () => openApp('aboutmac') },
  ]
}

export function Desktop() {
  useKeyboardShortcuts()
  const overlay = useDesktop((s) => s.overlay)
  const panel = useDesktop((s) => s.panel)
  const system = useDesktop((s) => s.system)
  const brightness = useSettings((s) => s.brightness)
  const reduce = useReduceMotion()

  // Keep windows reachable when the browser window changes size.
  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => useWindows.getState().fitToViewport())
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Close panels when clicking anywhere outside them or the menu bar.
  useEffect(() => {
    if (!panel) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-panel], header')) return
      useDesktop.getState().setPanel(null)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [panel])

  return (
    <motion.main
      className={`relative h-full w-full overflow-hidden ${reduce ? 'reduce-motion' : ''}`}
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="absolute inset-0"
        onPointerDown={() => useDesktop.getState().selectFile(null)}
        onContextMenu={(e) => {
          e.preventDefault()
          useDesktop.getState().openContextMenu(e, desktopMenu())
        }}
      >
        <Wallpaper />
      </div>
      <Widgets />
      <DesktopIcons />
      <AnimatePresence>{(overlay === 'mission' || overlay === 'expose') && <MissionBackdrop key="mc" />}</AnimatePresence>
      <WindowManager />
      <AnimatePresence>{(overlay === 'mission' || overlay === 'expose') && <MissionLabels key="ml" />}</AnimatePresence>
      <Dock />
      <MenuBar />
      <AnimatePresence>
        {panel === 'control' && <ControlCenter key="cc" />}
        {panel === 'notifications' && <NotificationCenter key="nc" />}
      </AnimatePresence>
      <Banner />
      <AnimatePresence>
        {overlay === 'spotlight' && <Spotlight key="sp" />}
        {overlay === 'launchpad' && <Launchpad key="lp" />}
        {overlay === 'switcher' && <AppSwitcher key="sw" />}
      </AnimatePresence>
      <AnimatePresence>
        <QuickLook />
      </AnimatePresence>
      <ContextMenu />
      {brightness < 1 && <div className="pointer-events-none absolute inset-0 z-[90] bg-black" style={{ opacity: (1 - brightness) * 0.85 }} />}
      <AnimatePresence>
        {system === 'locked' && <LockScreen key="lock" />}
        {system === 'sleep' && <SleepScreen key="sleep" />}
        {system === 'off' && <OffScreen key="off" />}
        {system === 'booting' && <BootScreen key="boot" />}
      </AnimatePresence>
    </motion.main>
  )
}
