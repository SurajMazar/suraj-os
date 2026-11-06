import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BatteryCharging, BatteryMedium, Bluetooth, Search, Volume1, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react'
import { apps } from '@/apps/registry'
import { useActiveAppId, useWindows } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { useSettings } from '@/store/settingsStore'
import { useClock, useMedia } from '@/hooks/system'
import { appMenus, systemMenu } from '@/lib/menus'
import { ControlCenterGlyph, SystemMark } from '@/components/shared/BrandIcons'
import { MenuList } from './MenuList'
import { Slider, Toggle } from '@/components/shared/ui'
import type { MenuItem } from '@/types'

type OpenMenu = { key: string; items: MenuItem[]; left: number } | null

function useBattery() {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null)
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean; addEventListener: (t: string, f: () => void) => void }> }
    if (!nav.getBattery) return
    let alive = true
    nav.getBattery().then((b) => {
      const update = () => alive && setBattery({ level: b.level, charging: b.charging })
      update()
      b.addEventListener('levelchange', update)
      b.addEventListener('chargingchange', update)
    }, () => undefined)
    return () => {
      alive = false
    }
  }, [])
  return battery
}

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

function StatusButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={active}
      onClick={onClick}
      className={`flex h-[22px] items-center gap-1 rounded-[5px] px-[7px] ${active ? 'bg-white/25' : 'hover:bg-white/15'}`}
    >
      {children}
    </button>
  )
}

function Dropdown({ children, right = 8, width = 280 }: { children: React.ReactNode; right?: number; width?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.14 }}
      className="menu-surface absolute top-[30px] z-[60] p-3 text-[13px] text-[var(--text)]"
      style={{ right, width, borderRadius: 14 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  )
}

export function MenuBar() {
  const activeApp = useActiveAppId()
  const focusedId = useWindows((s) => s.focusedId)
  const [open, setOpen] = useState<OpenMenu>(null)
  const panel = useDesktop((s) => s.panel)
  const togglePanel = useDesktop((s) => s.togglePanel)
  const now = useClock('minute')
  const battery = useBattery()
  const online = useOnline()
  const wifi = useSettings((s) => s.wifi)
  const bluetooth = useSettings((s) => s.bluetooth)
  const volume = useSettings((s) => s.volume)
  const sound = useSettings((s) => s.sound)
  const set = useSettings((s) => s.set)
  const barRef = useRef<HTMLDivElement>(null)
  const narrow = useMedia('(max-width: 1000px)')

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  // Menus are rebuilt when opened so checkmarks and window lists are current.
  const menusFor = () => appMenus(activeApp)

  const toggle = (key: string, items: MenuItem[], el: HTMLElement) => {
    useDesktop.getState().setPanel(null)
    setOpen(open?.key === key ? null : { key, items, left: el.getBoundingClientRect().left })
  }
  const hoverSwitch = (key: string, items: () => MenuItem[], el: HTMLElement) => {
    if (open && open.key !== key) setOpen({ key, items: items(), left: el.getBoundingClientRect().left })
  }

  const VolumeIcon = !sound || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timeLabel = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <header
      ref={barRef}
      className="absolute inset-x-0 top-0 z-[6] isolate flex h-[28px] items-center justify-between px-2 text-[13px] text-[var(--menubar-text)]"
      style={{ paddingLeft: 'max(8px, env(safe-area-inset-left))', paddingRight: 'max(8px, env(safe-area-inset-right))' }}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(null)}
    >
      {/* The blur lives on its own layer: an element with backdrop-filter stops its
          descendants' backdrop-filter from seeing the page, which would leave menus unblurred. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'var(--menubar-bg)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', boxShadow: 'inset 0 -0.5px 0 rgba(0,0,0,.12)' }}
      />
      <nav aria-label="Menu bar" className="flex min-w-0 items-center">
        <button
          type="button"
          aria-label="System menu"
          aria-haspopup="menu"
          aria-expanded={open?.key === 'system'}
          className={`flex h-[22px] items-center rounded-[5px] px-[10px] ${open?.key === 'system' ? 'bg-white/25' : 'hover:bg-white/15'}`}
          onClick={(e) => toggle('system', systemMenu(), e.currentTarget)}
          onPointerEnter={(e) => hoverSwitch('system', systemMenu, e.currentTarget)}
        >
          <SystemMark size={16} />
        </button>
        <button
          type="button"
          aria-haspopup="menu"
          className={`flex h-[22px] items-center rounded-[5px] px-[9px] font-bold ${open?.key === 'app' ? 'bg-white/25' : 'hover:bg-white/15'}`}
          onClick={(e) =>
            toggle(
              'app',
              [
                { label: `About ${apps[activeApp].name}`, action: () => useDesktop.getState().pushNotification({ id: 'about-app', app: activeApp, title: apps[activeApp].name, body: apps[activeApp].description }) },
                { label: '', separator: true },
                { label: 'Hide Window', disabled: !focusedId, action: () => focusedId && useWindows.getState().minimize(focusedId) },
                { label: `Quit ${apps[activeApp].name}`, shortcut: '⌥Q', disabled: !focusedId, action: () => useWindows.getState().quitApp(activeApp) },
              ],
              e.currentTarget,
            )
          }
        >
          {apps[activeApp].name}
        </button>
        {!narrow &&
          menusFor().map((m) => (
            <button
              key={m.title}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open?.key === m.title}
              className={`flex h-[22px] items-center rounded-[5px] px-[9px] ${open?.key === m.title ? 'bg-white/25' : 'hover:bg-white/15'}`}
              onClick={(e) => toggle(m.title, menusFor().find((x) => x.title === m.title)!.items, e.currentTarget)}
              onPointerEnter={(e) => hoverSwitch(m.title, () => menusFor().find((x) => x.title === m.title)!.items, e.currentTarget)}
            >
              {m.title}
            </button>
          ))}
      </nav>

      <div className="flex items-center gap-[2px]">
        <StatusButton label="Battery" active={panel === 'battery'} onClick={() => togglePanel('battery')}>
          {battery ? <span className="text-[12px] font-medium tabular-nums">{Math.round(battery.level * 100)}%</span> : null}
          {battery?.charging ? <BatteryCharging size={20} strokeWidth={1.6} /> : <BatteryMedium size={20} strokeWidth={1.6} />}
        </StatusButton>
        <StatusButton label="Wi-Fi" active={panel === 'wifi'} onClick={() => togglePanel('wifi')}>
          {wifi && online ? <Wifi size={16} strokeWidth={2} /> : <WifiOff size={16} strokeWidth={2} />}
        </StatusButton>
        <StatusButton label="Bluetooth" active={panel === 'bluetooth'} onClick={() => togglePanel('bluetooth')}>
          <Bluetooth size={15} strokeWidth={2} className={bluetooth ? '' : 'opacity-40'} />
        </StatusButton>
        <StatusButton label="Sound" active={panel === 'sound'} onClick={() => togglePanel('sound')}>
          <VolumeIcon size={16} strokeWidth={2} />
        </StatusButton>
        <StatusButton label="Spotlight" onClick={() => useDesktop.getState().toggleOverlay('spotlight')}>
          <Search size={15} strokeWidth={2.2} />
        </StatusButton>
        <StatusButton label="Control Center" active={panel === 'control'} onClick={() => togglePanel('control')}>
          <ControlCenterGlyph size={17} />
        </StatusButton>
        <button
          type="button"
          aria-label="Notification Center"
          aria-expanded={panel === 'notifications'}
          onClick={() => togglePanel('notifications')}
          className={`flex h-[22px] items-center gap-[7px] whitespace-nowrap rounded-[5px] px-[8px] font-medium tabular-nums ${panel === 'notifications' ? 'bg-white/25' : 'hover:bg-white/15'}`}
        >
          <span>{dateLabel}</span>
          <span>{timeLabel}</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.08 }}
            className="absolute top-[27px] z-[60]"
            style={{ left: Math.min(open.left, window.innerWidth - 240) }}
          >
            <MenuList items={open.items} onDone={() => setOpen(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'wifi' && (
          <Dropdown key="wifi" right={170}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Wi-Fi</span>
              <Toggle label="Wi-Fi" checked={wifi} onChange={(v) => set('wifi', v)} />
            </div>
            <div className="mt-3 rounded-[8px] bg-[var(--surface-3)] p-2.5 text-[12px] text-[var(--text-2)]">
              {wifi ? (
                <>
                  <div className="flex items-center gap-2 font-medium text-[var(--text)]">
                    <span className={`grid h-6 w-6 place-items-center rounded-full ${online ? 'bg-[var(--accent)] text-white' : 'bg-[var(--border-strong)]'}`}>
                      <Wifi size={13} />
                    </span>
                    {online ? 'Your connection is online' : 'Your browser is offline'}
                  </div>
                  <p className="mt-2 leading-relaxed">The toggle is a simulation. The online status above is real, read from your browser.</p>
                </>
              ) : (
                'Wi-Fi is off in SurajOS. Your real connection is untouched.'
              )}
            </div>
          </Dropdown>
        )}
        {panel === 'bluetooth' && (
          <Dropdown key="bluetooth" right={130} width={260}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Bluetooth</span>
              <Toggle label="Bluetooth" checked={bluetooth} onChange={(v) => set('bluetooth', v)} />
            </div>
            <p className="mt-2 text-[12px] text-[var(--text-2)]">{bluetooth ? 'On, and simulated: no devices are paired with SurajOS.' : 'Off in SurajOS. Your real Bluetooth is untouched.'}</p>
          </Dropdown>
        )}
        {panel === 'battery' && (
          <Dropdown key="battery" right={210} width={250}>
            <div className="font-semibold">Battery</div>
            <div className="mt-2 text-[12px] text-[var(--text-2)]">
              {battery
                ? `${Math.round(battery.level * 100)}% · ${battery.charging ? 'Charging' : 'On battery'} (from your device)`
                : 'Your browser does not share battery details, so SurajOS stays plugged in.'}
            </div>
          </Dropdown>
        )}
        {panel === 'sound' && (
          <Dropdown key="sound" right={110}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Sound</span>
              <Toggle label="Sound effects" checked={sound} onChange={(v) => set('sound', v)} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <VolumeX size={14} className="text-[var(--text-3)]" />
              <Slider label="Volume" value={volume} onChange={(v) => set('volume', v)} />
              <Volume2 size={14} className="text-[var(--text-3)]" />
            </div>
            <p className="mt-2 text-[12px] text-[var(--text-3)]">System sounds play when you open, close and minimize windows.</p>
          </Dropdown>
        )}
      </AnimatePresence>
    </header>
  )
}
