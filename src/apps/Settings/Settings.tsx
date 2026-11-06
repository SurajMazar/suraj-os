import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Dock, Image, Info, Monitor, Palette, Volume2 } from 'lucide-react'
import type { AppProps } from '@/types'
import { useSettings, type Appearance } from '@/store/settingsStore'
import { WallpaperArt, wallpapers } from '@/components/desktop/Wallpaper'
import { Button, SearchInput, Slider, Toggle } from '@/components/shared/ui'
import { useIsDark, useIsMobile } from '@/hooks/system'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { openApp } from '@/store/windowStore'
import { soundCatalog, sounds } from '@/lib/sound'
import { useUserWallpaper } from '@/lib/userWallpaper'
import { useLayout } from '@/store/layoutStore'

type Section = 'appearance' | 'wallpaper' | 'dock' | 'display' | 'sound' | 'notifications' | 'about'

const keywords: Record<Section, string> = {
  appearance: 'dark light auto theme mode motion reduce animation startup boot',
  wallpaper: 'background desktop picture gradient himalaya aurora sunset ocean graphite',
  dock: 'dock size magnification hide icons widgets desktop',
  display: 'brightness resolution screen',
  sound: 'volume mute effects audio preview chime',
  notifications: 'banners focus alerts',
  about: 'system info version this mac',
}

const sections: { id: Section; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'appearance', label: 'Appearance', icon: <Palette size={13} />, color: '#3a3a3c' },
  { id: 'wallpaper', label: 'Wallpaper', icon: <Image size={13} />, color: '#32ade6' },
  { id: 'dock', label: 'Desktop & Dock', icon: <Dock size={13} />, color: '#3a3a3c' },
  { id: 'display', label: 'Displays', icon: <Monitor size={13} />, color: '#007aff' },
  { id: 'sound', label: 'Sound', icon: <Volume2 size={13} />, color: '#ff2d55' },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={13} />, color: '#ff3b30' },
  { id: 'about', label: 'About', icon: <Info size={13} />, color: '#8e8e93' },
]

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="text-[13px]">{label}</div>
        {hint && <div className="mt-0.5 text-[11px] leading-snug text-[var(--text-2)]">{hint}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

function Group({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mb-5">
      {title && <div className="mb-1.5 px-1 text-[12px] font-semibold text-[var(--text-2)]">{title}</div>}
      <div className="divide-y divide-[var(--border)] rounded-[10px] bg-[var(--surface-3)] shadow-[inset_0_0_0_.5px_var(--border)]">{children}</div>
    </div>
  )
}

function AppearancePicker() {
  const appearance = useSettings((s) => s.appearance)
  const set = useSettings((s) => s.set)
  const opts: { v: Appearance; label: string; bg: string }[] = [
    { v: 'auto', label: 'Auto', bg: 'linear-gradient(90deg,#f5f5f7 50%,#1c1c1e 50%)' },
    { v: 'light', label: 'Light', bg: '#f5f5f7' },
    { v: 'dark', label: 'Dark', bg: '#1c1c1e' },
  ]
  return (
    <div className="flex gap-4 px-3.5 py-3">
      {opts.map((o) => (
        <button key={o.v} type="button" aria-pressed={appearance === o.v} onClick={() => set('appearance', o.v)} className="flex flex-col items-center gap-1.5">
          <span className={`relative h-[52px] w-[76px] overflow-hidden rounded-[8px] shadow-[inset_0_0_0_.5px_rgba(0,0,0,.2)] ${appearance === o.v ? 'ring-[3px] ring-[var(--accent)]' : ''}`} style={{ background: o.bg }}>
            <span className="absolute left-2 top-2 h-[28px] w-[44px] rounded-[4px] bg-white/70 shadow" />
            <span className="absolute left-2 top-2 h-[6px] w-[44px] rounded-t-[4px] bg-[var(--accent)]/70" />
          </span>
          <span className={`text-[12px] ${appearance === o.v ? 'font-semibold' : 'text-[var(--text-2)]'}`}>{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function Settings({ props }: AppProps) {
  const [section, setSection] = useState<Section>((props.section as Section) ?? 'appearance')
  const s = useSettings()
  const dark = useIsDark()
  const [confirmReset, setConfirmReset] = useState(false)
  const mobile = useIsMobile()
  const userUrl = useUserWallpaper((u) => u.url)
  const moved = useLayout((l) => Object.keys(l.offsets).length > 0)
  const [mobileList, setMobileList] = useState(!props.section)
  const [q, setQ] = useState('')
  const visible = sections.filter((x) => !q.trim() || `${x.label} ${keywords[x.id]}`.toLowerCase().includes(q.trim().toLowerCase()))

  useEffect(() => {
    if (props.section) {
      setSection(props.section as Section)
      setMobileList(false)
    }
  }, [props.section, props.nonce])

  const current = sections.find((x) => x.id === section)!

  // iPhone: a grouped list that drills into each section.
  if (mobile && mobileList)
    return (
      <div className="scroll-thin h-full overflow-y-auto bg-[var(--surface-2)] px-4 pb-10 pt-3">
        <h1 className="mb-3 px-1 text-[28px] font-bold tracking-tight">Settings</h1>
        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[12px] bg-[var(--surface-solid)]">
          {sections.filter((x) => x.id !== 'dock').map((x) => (
            <button key={x.id} type="button" onClick={() => { setSection(x.id); setMobileList(false) }} className="flex h-[46px] w-full items-center gap-3 px-3.5 text-left text-[15px] active:bg-[var(--hover)]">
              <span className="grid h-[29px] w-[29px] place-items-center rounded-[7px] text-white" style={{ background: x.color }}>
                {x.icon}
              </span>
              <span className="flex-1">{x.label}</span>
              <ChevronRight size={18} className="text-[var(--text-3)]" />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => { s.reset(); useLayout.getState().cleanUp() }} className="mt-6 h-[46px] w-full rounded-[12px] bg-[var(--surface-solid)] text-[15px] text-[var(--sys-red)] active:bg-[var(--hover)]">
          Reset Preferences
        </button>
      </div>
    )

  return (
    <div className="flex h-full">
      {!mobile && <aside className="glass flex w-[200px] shrink-0 flex-col border-r border-[var(--border)] pt-[52px]" data-drag-region>
        <div className="px-2.5 pb-2">
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} placeholder="Search" aria-label="Search settings" />
        </div>
        <nav aria-label="Settings sections" className="space-y-[1px] px-2.5">
          {!visible.length && <div className="px-2 py-1 text-[12px] text-[var(--text-3)]">No settings match.</div>}
          {visible.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-current={section === x.id}
              onClick={() => setSection(x.id)}
              className={`flex h-[28px] w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px] ${section === x.id ? 'bg-[var(--selection)] text-white' : 'hover:bg-[var(--surface-3)]'}`}
            >
              <span className="grid h-[20px] w-[20px] place-items-center rounded-[5px] text-white" style={{ background: x.color }}>
                {x.icon}
              </span>
              {x.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-3">
          {confirmReset ? (
            <div className="space-y-1.5 text-[11px] text-[var(--text-2)]">
              <div>Reset every preference?</div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="danger" onClick={() => { s.reset(); useLayout.getState().cleanUp(); setConfirmReset(false) }}>
                  Reset
                </Button>
                <Button size="sm" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="w-full" onClick={() => setConfirmReset(true)}>
              Reset Preferences…
            </Button>
          )}
        </div>
      </aside>}
      <section className="flex min-w-0 flex-1 flex-col bg-[var(--surface-solid)]">
        <div data-drag-region className="flex h-[52px] shrink-0 items-center gap-1 border-b border-[var(--border)] px-5 text-[15px] font-bold">
          {mobile && (
            <button type="button" onClick={() => setMobileList(true)} className="-ml-2 flex items-center text-[15px] font-normal text-[var(--accent)]">
              <ChevronLeft size={22} /> Settings
            </button>
          )}
          <span className={mobile ? 'ml-auto mr-auto pr-16' : ''}>{current.label}</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={section} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {section === 'appearance' && (
              <>
                <Group title="Appearance">
                  <AppearancePicker />
                </Group>
                <Group title="Motion">
                  <Row label="Reduce motion" hint="Fades instead of zooms and springs. Your system setting is respected too.">
                    <Toggle label="Reduce motion" checked={s.reduceMotion} onChange={(v) => s.set('reduceMotion', v)} />
                  </Row>
                  <Row label="Play startup sequence on load" hint="Off by default, so the desktop is ready at once.">
                    <Toggle label="Startup sequence" checked={s.startupOnLoad} onChange={(v) => s.set('startupOnLoad', v)} />
                  </Row>
                </Group>
              </>
            )}
            {section === 'wallpaper' && (
              <>
                <div className="mb-5 overflow-hidden rounded-[12px] shadow-[0_6px_24px_rgba(0,0,0,.2)]">
                  <div className="relative aspect-[16/7]">
                    <WallpaperArt id={s.wallpaper} dark={dark} custom={s.customGradient} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {wallpapers.filter((w) => w.id !== 'picture' || userUrl).map((w) => (
                    <button key={w.id} type="button" aria-pressed={s.wallpaper === w.id} onClick={() => s.set('wallpaper', w.id)} className="flex flex-col items-center gap-1.5">
                      <span className={`relative block aspect-[16/10] w-full overflow-hidden rounded-[8px] ${s.wallpaper === w.id ? 'ring-[3px] ring-[var(--accent)]' : 'ring-1 ring-[var(--border)]'}`}>
                        <WallpaperArt id={w.id} dark={dark} custom={s.customGradient} />
                      </span>
                      <span className="text-[12px] text-[var(--text-2)]">{w.name}</span>
                    </button>
                  ))}
                </div>
                {s.wallpaper === 'custom' && (
                  <Group title="Custom gradient">
                    <Row label="Colors">
                      {[0, 1].map((i) => (
                        <input
                          key={i}
                          type="color"
                          aria-label={`Gradient color ${i + 1}`}
                          value={s.customGradient[i]}
                          onChange={(e) => {
                            const next = [...s.customGradient] as [string, string]
                            next[i] = e.target.value
                            s.set('customGradient', next)
                          }}
                          className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent"
                        />
                      ))}
                    </Row>
                  </Group>
                )}
                <Group title="Your own picture">
                  <Row label={userUrl ? 'Picture chosen' : 'Choose a picture from your computer'} hint="It stays in this browser and is never uploaded.">
                    <label className="inline-flex h-[24px] cursor-default items-center rounded-[7px] bg-[var(--surface-3)] px-2.5 text-[12px] font-medium shadow-[inset_0_0_0_.5px_var(--border-strong)] hover:bg-[var(--hover)]">
                      Choose a Picture…
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          await useUserWallpaper.getState().choose(f)
                          s.set('wallpaper', 'picture')
                          e.target.value = ''
                        }}
                      />
                    </label>
                    {userUrl && (
                      <Button size="sm" variant="ghost" onClick={() => { void useUserWallpaper.getState().clear(); if (s.wallpaper === 'picture') s.set('wallpaper', 'kathmandu') }}>
                        Remove
                      </Button>
                    )}
                  </Row>
                </Group>
                <p className="mt-4 text-[11px] text-[var(--text-2)]">Chameleon Reserve is artwork by Craizuss. The drawn wallpapers have light and dark versions that follow Appearance.</p>
              </>
            )}
            {section === 'dock' && (
              <>
                <Group title="Dock">
                  <Row label="Size">
                    <div className="w-[180px]">
                      <Slider label="Dock size" min={36} max={72} step={1} value={s.dockSize} onChange={(v) => s.set('dockSize', v)} />
                    </div>
                  </Row>
                  <Row label="Magnification">
                    <Toggle label="Magnification" checked={s.dockMagnify} onChange={(v) => s.set('dockMagnify', v)} />
                  </Row>
                  {s.dockMagnify && (
                    <Row label="Magnification amount">
                      <div className="w-[180px]">
                        <Slider label="Magnification amount" min={1.2} max={2.2} step={0.05} value={s.dockMagnification} onChange={(v) => s.set('dockMagnification', v)} />
                      </div>
                    </Row>
                  )}
                  <Row label="Automatically hide and show the Dock" hint="Move the pointer to the bottom edge to reveal it.">
                    <Toggle label="Auto-hide Dock" checked={s.dockAutoHide} onChange={(v) => s.set('dockAutoHide', v)} />
                  </Row>
                </Group>
                <Group title="Desktop">
                  <Row label="Show desktop icons">
                    <Toggle label="Show desktop icons" checked={s.showDesktopIcons} onChange={(v) => s.set('showDesktopIcons', v)} />
                  </Row>
                  <Row label="Show widgets" hint="Clock, calendar, profile and GitHub widgets on wide screens.">
                    <Toggle label="Show widgets" checked={s.showWidgets} onChange={(v) => s.set('showWidgets', v)} />
                  </Row>
                  <Row label="Icon and widget positions" hint={moved ? 'You have moved things around. Put them back where they started.' : 'Everything is in its original place.'}>
                    <Button size="sm" disabled={!moved} onClick={() => useLayout.getState().cleanUp()}>
                      Reset Positions
                    </Button>
                  </Row>
                </Group>
              </>
            )}
            {section === 'display' && (
              <Group title="Display">
                <Row label="Brightness" hint="Dims SurajOS only, not your screen.">
                  <div className="w-[200px]">
                    <Slider label="Brightness" min={0.4} max={1} value={s.brightness} onChange={(v) => s.set('brightness', v)} />
                  </div>
                </Row>
                <Row label="Resolution" hint="Your browser window">
                  <span className="text-[13px] tabular-nums text-[var(--text-2)]">
                    {window.innerWidth} × {window.innerHeight} @ {window.devicePixelRatio}x
                  </span>
                </Row>
              </Group>
            )}
            {section === 'sound' && (
              <Group title="Sound effects">
                <Row label="Play sound effects" hint="Short sounds when windows open, close and minimize.">
                  <Toggle label="Sound effects" checked={s.sound} onChange={(v) => s.set('sound', v)} />
                </Row>
                <Row label="Volume">
                  <div className="w-[200px]">
                    <Slider label="Volume" value={s.volume} onChange={(v) => s.set('volume', v)} />
                  </div>
                </Row>
              </Group>
            )}
            {section === 'sound' && (
              <Group title="Preview">
                <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3">
                  {soundCatalog.map((x) => (
                    <button key={x.name} type="button" onClick={() => sounds[x.name]()} className="flex h-[30px] items-center justify-between gap-2 rounded-[7px] px-2.5 text-left text-[12px] hover:bg-[var(--hover)] active:scale-[.98]">
                      {x.label}
                      <Volume2 size={12} className="text-[var(--text-3)]" />
                    </button>
                  ))}
                </div>
                <div className="px-3.5 pb-2.5 text-[11px] text-[var(--text-3)]">Original sounds, synthesized in your browser. Nothing plays until you interact with the page.</div>
              </Group>
            )}
            {section === 'notifications' && (
              <Group title="Notifications">
                <Row label="Show banners" hint="New notifications slide in at the top right.">
                  <Toggle label="Show banners" checked={s.notificationBanners} onChange={(v) => s.set('notificationBanners', v)} />
                </Row>
                <Row label="Focus" hint="Hides banners; notifications still collect in Notification Center.">
                  <Toggle label="Focus" checked={s.focus} onChange={(v) => s.set('focus', v)} />
                </Row>
              </Group>
            )}
            {section === 'about' && (
              <Group>
                <Row label="About This Mac" hint="The engineering setup behind SurajOS">
                  <Button size="sm" onClick={() => openApp('aboutmac')}>
                    Open
                  </Button>
                </Row>
                <Row label="Preferences" hint="Saved in this browser’s local storage">
                  <span className="text-[12px] text-[var(--text-3)]">Local only</span>
                </Row>
              </Group>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  )
}
