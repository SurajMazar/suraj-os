import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bluetooth, Contrast, LayoutGrid, LayoutPanelLeft, Lock, Moon, Music, Play, Radio, SkipBack, SkipForward, Sun, SunDim, Volume, Volume2, VolumeX, Wifi, X } from 'lucide-react'
import { useDesktop, type Notification } from '@/store/desktopStore'
import { useSettings } from '@/store/settingsStore'
import { openApp } from '@/store/windowStore'
import { AppIcon } from '@/components/shared/AppIcon'
import { useClock, useIsDark } from '@/hooks/system'
import { soundCatalog, sounds } from '@/lib/sound'
import { portfolio } from '@/portfolio.config'

/* Control Center, in the Liquid Glass style: floating capsules instead of one panel. */

function Capsule({ children, className = '', round = false }: { children: React.ReactNode; className?: string; round?: boolean }) {
  return <div className={`cc-glass liquid relative ${round ? 'rounded-full' : 'rounded-[30px]'} ${className}`}>{children}</div>
}

/** A pill toggle: a disc that turns white with a blue glyph when on. */
function PillToggle({ on, label, sub, icon, onClick }: { on: boolean; label: string; sub: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <Capsule round className="h-[62px]">
      <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} className="flex h-full w-full min-w-0 items-center gap-2.5 rounded-full pl-[9px] pr-3 text-left active:scale-[.98]">
        <span className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full transition-colors ${on ? 'bg-white text-[#0a84ff]' : 'bg-[var(--cc-disc)] text-[var(--cc-text)]'}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold leading-tight text-[var(--cc-text)]">{label}</span>
          <span className="block truncate text-[12px] leading-tight text-[var(--cc-sub)]">{sub}</span>
        </span>
      </button>
    </Capsule>
  )
}

/** A round button: solid white when active. */
function RoundButton({ on = false, label, icon, onClick }: { on?: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={on}
      onClick={onClick}
      className={`liquid grid h-[62px] w-[62px] place-items-center rounded-full transition-colors active:scale-95 ${on ? 'bg-white text-black shadow-[0_6px_20px_rgba(0,0,0,.25)]' : 'cc-glass text-[var(--cc-text)]'}`}
    >
      {icon}
    </button>
  )
}

function CCSlider({ label, value, min = 0, max = 1, onChange, left, right, trailing }: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void; left: React.ReactNode; right: React.ReactNode; trailing?: React.ReactNode }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <Capsule className="px-4 pb-3.5 pt-3">
      <div className="mb-2 text-[13px] font-semibold text-[var(--cc-text)]">{label}</div>
      <div className="flex items-center gap-2.5 text-[var(--cc-text)]">
        {left}
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={0.01}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="cc-slider h-[6px] min-w-0 flex-1 cursor-pointer appearance-none rounded-full"
          style={{ background: `linear-gradient(to right, var(--cc-fill) ${pct}%, var(--cc-track) ${pct}%)` }}
        />
        {right}
        {trailing}
      </div>
    </Capsule>
  )
}

function NowPlaying() {
  const [i, setI] = useState(0)
  const item = soundCatalog[i]
  const step = (d: number) => setI((x) => (x + d + soundCatalog.length) % soundCatalog.length)
  return (
    <Capsule className="flex h-[134px] flex-col justify-between p-3.5">
      <div className="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-[var(--cc-disc)] text-[var(--cc-text)]">
        <Music size={18} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-[var(--cc-text)]">{item.label}</div>
        <div className="text-[11px] text-[var(--cc-sub)]">System sounds</div>
      </div>
      <div className="flex items-center justify-between text-[var(--cc-text)]">
        <button type="button" aria-label="Previous sound" onClick={() => step(-1)} className="opacity-70 hover:opacity-100">
          <SkipBack size={18} fill="currentColor" />
        </button>
        <button type="button" aria-label={`Play ${item.label}`} onClick={() => sounds[item.name]()} className="hover:scale-110">
          <Play size={22} fill="currentColor" />
        </button>
        <button type="button" aria-label="Next sound" onClick={() => step(1)} className="opacity-70 hover:opacity-100">
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>
    </Capsule>
  )
}

export function ControlCenter() {
  const s = useSettings()
  const dark = useIsDark()
  const d = useDesktop.getState()
  return (
    <motion.div
      data-panel
      role="dialog"
      aria-label="Control Center"
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
      className="absolute right-2 top-[34px] z-[30] w-[316px] origin-top-right"
    >
      <div className="grid grid-cols-[1fr_134px] gap-2.5">
        <div className="grid gap-2.5">
          <PillToggle on={s.wifi} label="Wi-Fi" sub={s.wifi ? 'SurajOS' : 'Off'} icon={<Wifi size={20} strokeWidth={2.4} />} onClick={() => s.set('wifi', !s.wifi)} />
          <PillToggle on={s.bluetooth} label="Bluetooth" sub={s.bluetooth ? 'On' : 'Off'} icon={<Bluetooth size={20} strokeWidth={2.4} />} onClick={() => s.set('bluetooth', !s.bluetooth)} />
        </div>
        <NowPlaying />
        <PillToggle on={s.airdrop} label="AirDrop" sub={s.airdrop ? 'Everyone' : 'Off'} icon={<Radio size={20} strokeWidth={2.4} />} onClick={() => s.set('airdrop', !s.airdrop)} />
        <div className="flex justify-between">
          <RoundButton label="Mission Control" icon={<LayoutPanelLeft size={22} />} onClick={() => d.setOverlay('mission')} />
          <RoundButton label="Launchpad" icon={<LayoutGrid size={22} />} onClick={() => d.setOverlay('launchpad')} />
        </div>
        <div className="flex justify-between">
          <RoundButton on={dark} label={dark ? 'Dark Mode on' : 'Dark Mode off'} icon={<Contrast size={24} />} onClick={() => s.set('appearance', dark ? 'light' : 'dark')} />
          <RoundButton label="Lock Screen" icon={<Lock size={20} />} onClick={() => d.setSystem('locked')} />
        </div>
        <Capsule round className="h-[62px]">
          <button type="button" role="switch" aria-checked={s.focus} aria-label="Focus" onClick={() => s.set('focus', !s.focus)} className="flex h-full w-full items-center gap-2 rounded-full pl-[9px] pr-3 active:scale-[.98]">
            <span className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full ${s.focus ? 'bg-[#5e5ce6] text-white' : 'bg-[var(--cc-disc)] text-[var(--cc-text)]'}`}>
              <Moon size={19} fill={s.focus ? 'currentColor' : 'none'} />
            </span>
            <span className="text-[13px] font-semibold text-[var(--cc-text)]">Focus</span>
          </button>
        </Capsule>
      </div>
      <div className="mt-2.5 grid gap-2.5">
        <CCSlider label="Display" min={0.4} max={1} value={s.brightness} onChange={(v) => s.set('brightness', v)} left={<SunDim size={16} />} right={<Sun size={18} />} />
        <CCSlider
          label="Sound"
          value={s.volume}
          onChange={(v) => s.set('volume', v)}
          left={<Volume size={16} />}
          right={<Volume2 size={18} />}
          trailing={
            <button type="button" aria-label={s.sound ? 'Turn sound effects off' : 'Turn sound effects on'} aria-pressed={s.sound} onClick={() => s.set('sound', !s.sound)} className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full ${s.sound ? 'bg-[var(--cc-disc)]' : 'bg-white text-black'}`}>
              {s.sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          }
        />
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => { d.setPanel(null); openApp('settings') }} className="cc-glass liquid rounded-full px-4 py-1.5 text-[13px] font-medium text-[var(--cc-text)] active:scale-95">
          Edit Controls
        </button>
      </div>
    </motion.div>
  )
}

/** macOS-style short times: "now", "14m ago", "3h ago", then the date. */
function shortAgo(t: number) {
  const m = Math.floor((Date.now() - t) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function NotificationCard({ n, onOpen, onDismiss }: { n: Notification; onOpen: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.18 } }}
      className="cc-glass liquid group relative rounded-[24px]"
    >
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
        <AppIcon appId={n.app} size={38} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-[var(--cc-text)]">{n.title}</span>
            <span className="shrink-0 text-[12px] text-[var(--cc-sub)]">{shortAgo(n.time)}</span>
          </span>
          <span className="mt-0.5 line-clamp-4 block text-[13px] leading-snug text-[var(--cc-text)] opacity-90">{n.body}</span>
        </span>
      </button>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="cc-glass absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full text-[var(--cc-text)] opacity-0 transition group-hover:opacity-100 focus:opacity-100"
      >
        <X size={12} strokeWidth={3} />
      </button>
    </motion.div>
  )
}

export function NotificationCenter() {
  const notifications = useDesktop((s) => s.notifications)
  const now = useClock('minute')
  const ktm = now.toLocaleTimeString(undefined, { timeZone: portfolio.timezone, hour: 'numeric', minute: '2-digit' })
  const d = useDesktop.getState()
  return (
    <motion.aside
      data-panel
      aria-label="Notification Center"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="scroll-thin absolute bottom-2 right-2 top-[34px] z-[30] w-[360px] max-w-[calc(100vw-16px)] space-y-2.5 overflow-y-auto p-1"
    >
      <div className="flex items-center justify-between px-1 pb-0.5 pt-1">
        <span className="text-[22px] font-bold text-white" style={{ textShadow: '0 1px 8px rgba(0,0,0,.45)' }}>
          Notification Center
        </span>
        {notifications.length > 0 && (
          <button type="button" aria-label="Clear all notifications" title="Clear All" onClick={() => d.clearNotifications()} className="cc-glass grid h-7 w-7 place-items-center rounded-full text-[var(--cc-text)] hover:brightness-110">
            <X size={14} strokeWidth={2.6} />
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {notifications.map((n) => (
          <NotificationCard
            key={n.id}
            n={n}
            onOpen={() => {
              d.setPanel(null)
              openApp(n.app)
            }}
            onDismiss={() => d.dismissNotification(n.id)}
          />
        ))}
      </AnimatePresence>
      {notifications.length === 0 && <div className="cc-glass rounded-[24px] p-4 text-center text-[13px] text-[var(--cc-sub)]">No Notifications</div>}
      <div className="cc-glass liquid rounded-[24px] p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--cc-sub)]">Kathmandu</div>
        <div className="mt-1 text-[28px] font-semibold tabular-nums text-[var(--cc-text)]">{ktm}</div>
        <div className="text-[12px] text-[var(--cc-sub)]">
          {portfolio.timezoneLabel} · {portfolio.availability}
        </div>
      </div>
    </motion.aside>
  )
}

/** A notification banner that slides in, then files itself into Notification Center. */
export function Banner() {
  const banner = useDesktop((s) => s.banner)
  const panel = useDesktop((s) => s.panel)
  const focus = useSettings((s) => s.focus)
  const enabled = useSettings((s) => s.notificationBanners)
  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => useDesktop.getState().setBanner(null), 5200)
    return () => clearTimeout(t)
  }, [banner])
  const show = banner && !focus && enabled && !panel
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={banner.id + banner.time}
          role="status"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute right-3 top-[38px] z-[35] w-[350px] max-w-[calc(100vw-24px)]"
        >
          <button
            type="button"
            onClick={() => {
              useDesktop.getState().setBanner(null)
              openApp(banner.app)
            }}
            className="cc-glass liquid flex w-full items-center gap-3 rounded-[24px] px-3.5 py-3 text-left"
          >
            <AppIcon appId={banner.app} size={38} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2 text-[13px] font-semibold text-[var(--cc-text)]">
                <span className="truncate">{banner.title}</span>
                <span className="shrink-0 text-[12px] font-normal text-[var(--cc-sub)]">now</span>
              </span>
              <span className="mt-0.5 line-clamp-3 block text-[13px] leading-snug text-[var(--cc-text)] opacity-90">{banner.body}</span>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
