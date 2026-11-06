import { motion } from 'motion/react'
import { GitFork, MapPin, Star } from 'lucide-react'
import { portfolio, projects } from '@/portfolio.config'
import { useClock } from '@/hooks/system'
import { useSettings } from '@/store/settingsStore'
import { openApp, MENU_BAR_HEIGHT } from '@/store/windowStore'
import { languageColors, timeAgo, useGitHub } from '@/lib/github'
import { GitHubMark } from '@/components/shared/BrandIcons'
import { useDesktopDrag } from '@/hooks/useDesktopDrag'

function Card({ children, className = '', onClick, label, delay = 0, wide = false }: { children: React.ReactNode; className?: string; onClick?: () => void; label: string; delay?: number; wide?: boolean }) {
  // Widgets can be dragged anywhere on the desktop; a drag never counts as a click.
  const drag = useDesktopDrag(`widget:${label}`)
  return (
    <div style={drag.style} onPointerDown={drag.onPointerDown} className={`${wide ? 'col-span-2' : ''} ${drag.dragging ? 'cursor-grabbing' : ''}`}>
      <motion.section
        aria-label={label}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0, scale: drag.dragging ? 1.02 : 1 }}
        transition={{ delay: drag.dragging ? 0 : 0.2 + delay, type: 'spring', stiffness: 260, damping: 26 }}
        onClick={() => {
          if (!drag.wasDragged()) onClick?.()
        }}
        className={`liquid glass relative h-full rounded-[20px] p-3.5 text-[var(--text)] shadow-[0_8px_30px_rgba(0,0,0,.18),inset_0_0_0_.5px_rgba(255,255,255,.25)] ${onClick ? 'cursor-default transition hover:brightness-110' : ''} ${className}`}
      >
        {children}
      </motion.section>
    </div>
  )
}

function AnalogClock({ date, size = 74 }: { date: Date; size?: number }) {
  const h = date.getHours() % 12
  const m = date.getMinutes()
  const s = date.getSeconds()
  const hand = (deg: number, len: number, w: number, color: string) => (
    <line x1="50" y1="50" x2={50 + len * Math.sin((deg * Math.PI) / 180)} y2={50 - len * Math.cos((deg * Math.PI) / 180)} stroke={color} strokeWidth={w} strokeLinecap="round" />
  )
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="48" fill="var(--surface-solid)" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="50" y1="7" x2="50" y2={i % 3 === 0 ? 14 : 11} stroke="var(--text-3)" strokeWidth={i % 3 === 0 ? 2.4 : 1.4} transform={`rotate(${i * 30} 50 50)`} />
      ))}
      {hand(h * 30 + m * 0.5, 24, 4.5, 'var(--text)')}
      {hand(m * 6 + s * 0.1, 35, 3, 'var(--text)')}
      {hand(s * 6, 38, 1.4, '#ff9f0a')}
      <circle cx="50" cy="50" r="3" fill="#ff9f0a" />
    </svg>
  )
}

function ClockWidget() {
  const now = useClock('second')
  const ktm = new Date(now.toLocaleString('en-US', { timeZone: portfolio.timezone }))
  // Compare wall-clock time, not zone names ("Asia/Katmandu" and "Asia/Kathmandu" are the same place).
  const fmt = (tz?: string) => now.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', day: 'numeric' })
  const same = fmt() === fmt(portfolio.timezone)
  return (
    <Card label="Clocks" className="flex min-w-0 items-center justify-center gap-2 overflow-hidden">
      {same ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <AnalogClock date={now} size={76} />
          <span className="text-[11px] font-medium text-[var(--text-2)]">Kathmandu</span>
          <span className="text-[11px] leading-tight text-[var(--text-3)]">Same time as Suraj</span>
        </div>
      ) : (
        <>
          <div className="flex w-[58px] flex-col items-center gap-1">
            <AnalogClock date={now} size={58} />
            <span className="w-full truncate text-center text-[11px] font-medium text-[var(--text-2)]">You</span>
          </div>
          <div className="flex w-[58px] flex-col items-center gap-1">
            <AnalogClock date={ktm} size={58} />
            <span className="w-full truncate text-center text-[11px] font-medium text-[var(--text-2)]">Kathmandu</span>
          </div>
        </>
      )}
    </Card>
  )
}

function CalendarWidget() {
  const now = useClock('minute')
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: first + days }, (_, i) => (i < first ? null : i - first + 1))
  return (
    <Card label="Calendar" delay={0.05} onClick={() => openApp('calendar')}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-bold uppercase tracking-wide text-[var(--sys-red)]">{now.toLocaleDateString(undefined, { month: 'long' })}</span>
        <span className="text-[11px] text-[var(--text-3)]">{year}</span>
      </div>
      <div className="grid grid-cols-7 gap-y-[3px] text-center text-[11px] tabular-nums">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="font-semibold text-[var(--text-3)]">
            {d}
          </span>
        ))}
        {cells.map((d, i) => (
          <span key={i} className={`mx-auto grid h-[18px] w-[18px] place-items-center rounded-full ${d === now.getDate() ? 'bg-[var(--sys-red)] font-bold text-white' : 'text-[var(--text)]'}`}>
            {d ?? ''}
          </span>
        ))}
      </div>
    </Card>
  )
}

function ProfileWidget() {
  return (
    <Card label="Profile" delay={0.1} onClick={() => openApp('about')} wide>
      <div className="flex items-center gap-3">
        <img src={portfolio.profileImage} alt={portfolio.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-white/50" draggable={false} />
        <div className="min-w-0">
          <div className="text-[15px] font-bold">{portfolio.name}</div>
          <div className="text-[12px] text-[var(--text-2)]">{portfolio.title}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-3)]">
            <MapPin size={11} /> {portfolio.location} · {portfolio.availability}
          </div>
        </div>
      </div>
    </Card>
  )
}

function NowWidget() {
  return (
    <Card label="Currently working on" delay={0.15} wide onClick={() => openApp('experience')}>
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Currently at {portfolio.currentRole.company}
      </div>
      <ul className="space-y-1.5 text-[12px] leading-snug">
        {portfolio.currentlyWorkingOn.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[var(--text-3)]" />
            {t}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function GitHubWidget() {
  const gh = useGitHub()
  return (
    <Card label="GitHub" delay={0.2} wide onClick={() => openApp('safari', { url: portfolio.github })}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <GitHubMark size={15} /> {portfolio.githubUser}
        </div>
        {gh.status === 'ready' && <span className="text-[11px] text-[var(--text-3)]">{gh.data.user.public_repos} repos · {gh.data.user.followers} followers</span>}
      </div>
      {gh.status === 'loading' && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="relative h-7 overflow-hidden rounded-[8px] bg-[var(--surface-3)]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer 1.4s infinite' }} />
            </div>
          ))}
        </div>
      )}
      {gh.status === 'error' && (
        // GitHub allows 60 anonymous API calls an hour; when that runs out, show the CV's open-source work instead.
        <ul className="space-y-1">
          {projects
            .filter((p) => p.github)
            .slice(0, 3)
            .map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-[8px] bg-[var(--surface-3)] px-2 py-1.5 text-[12px]">
                <span className="truncate font-medium">{p.github!.split('/').pop()}</span>
                <span className="shrink-0 text-[11px] text-[var(--text-3)]">{p.tech[0]}</span>
              </li>
            ))}
        </ul>
      )}
      {gh.status === 'ready' && (
        <ul className="space-y-1">
          {gh.data.repos.slice(0, 3).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-[8px] bg-[var(--surface-3)] px-2 py-1.5 text-[12px]">
              <span className="truncate font-medium">{r.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] text-[var(--text-3)]">
                {r.language && (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: languageColors[r.language] ?? '#888' }} />
                    {r.language}
                  </span>
                )}
                {r.stargazers_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star size={10} /> {r.stargazers_count}
                  </span>
                )}
                {r.forks_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <GitFork size={10} /> {r.forks_count}
                  </span>
                )}
              </span>
            </li>
          ))}
          <li className="pt-0.5 text-[11px] text-[var(--text-3)]">Last push {timeAgo(gh.data.repos[0]?.pushed_at ?? new Date().toISOString())}</li>
        </ul>
      )}
    </Card>
  )
}

export function Widgets() {
  const show = useSettings((s) => s.showWidgets)
  if (!show) return null
  return (
    <div className="absolute left-4 z-[1] hidden w-[330px] grid-cols-2 gap-3 lg:grid" style={{ top: MENU_BAR_HEIGHT + 16 }}>
      <ClockWidget />
      <CalendarWidget />
      <ProfileWidget />
      <NowWidget />
      <GitHubWidget />
    </div>
  )
}
