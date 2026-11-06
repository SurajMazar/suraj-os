import type { CSSProperties, ReactNode } from 'react'
import {
  BriefcaseBusiness,
  Clapperboard,
  Compass,
  FileText,
  FolderOpen,
  Gamepad2,
  LayoutGrid,
  Mail,
  Monitor,
  NotebookPen,
  Rocket,
  Settings,
  Sparkles,
  Trash,
} from 'lucide-react'
import type { AppId } from '@/types'
import { portfolio } from '@/portfolio.config'
import { GitHubMark } from './BrandIcons'

interface IconSpec {
  bg: string
  glyph: ReactNode
  fg?: string
}

const g = (a: string, b: string) => `linear-gradient(160deg, ${a} 0%, ${b} 100%)`

function specFor(appId: AppId, size: number): IconSpec {
  const s = Math.round(size * 0.52)
  const stroke = 1.9
  switch (appId) {
    case 'finder':
      return { bg: g('#7dd3fc', '#2563eb'), glyph: <FolderOpen size={s} strokeWidth={stroke} /> }
    case 'about':
      return {
        bg: g('#c7d2fe', '#6366f1'),
        glyph: <img src={portfolio.profileImage} alt="" className="h-full w-full object-cover" draggable={false} />,
      }
    case 'projects':
      return { bg: g('#a78bfa', '#6d28d9'), glyph: <LayoutGrid size={s} strokeWidth={stroke} /> }
    case 'experience':
      return { bg: g('#6ee7b7', '#047857'), glyph: <BriefcaseBusiness size={s} strokeWidth={stroke} /> }
    case 'skills':
      return { bg: g('#fde68a', '#f59e0b'), glyph: <Sparkles size={s} strokeWidth={stroke} />, fg: '#78350f' }
    case 'resume':
      return {
        bg: g('#ffffff', '#e5e7eb'),
        glyph: <FileText size={s} strokeWidth={stroke} />,
        fg: '#dc2626',
      }
    case 'terminal':
      return {
        bg: g('#3f3f46', '#09090b'),
        glyph: (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.3, fontWeight: 700, letterSpacing: -1 }} className="text-emerald-400">
            &gt;_
          </span>
        ),
      }
    case 'safari':
      return { bg: g('#e0f2fe', '#38bdf8'), glyph: <Compass size={s} strokeWidth={stroke} />, fg: '#1d4ed8' }
    case 'github':
      return { bg: g('#4b5563', '#111827'), glyph: <GitHubMark size={s} /> }
    case 'contact':
      return { bg: g('#5eead4', '#0e7490'), glyph: <Mail size={s} strokeWidth={stroke} /> }
    case 'settings':
      return { bg: g('#d4d4d8', '#71717a'), glyph: <Settings size={s} strokeWidth={stroke} />, fg: '#27272a' }
    case 'trash':
      return { bg: 'linear-gradient(160deg, rgba(255,255,255,.55), rgba(255,255,255,.18))', glyph: <Trash size={s} strokeWidth={1.6} />, fg: '#3f3f46' }
    case 'textedit':
      return { bg: g('#fef9c3', '#fde047'), glyph: <NotebookPen size={s} strokeWidth={stroke} />, fg: '#713f12' }
    case 'launchpad':
      return { bg: g('#fda4af', '#7c3aed'), glyph: <Rocket size={s} strokeWidth={stroke} /> }
    case 'calendar': {
      const now = new Date()
      return {
        bg: '#ffffff',
        fg: '#1d1d1f',
        glyph: (
          <span className="flex h-full w-full flex-col items-center justify-start" style={{ paddingTop: size * 0.12 }}>
            <span style={{ fontSize: size * 0.17, fontWeight: 700, color: '#ff3b30', lineHeight: 1 }}>{now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
            <span style={{ fontSize: size * 0.48, fontWeight: 400, lineHeight: 1.05, letterSpacing: -1 }}>{now.getDate()}</span>
          </span>
        ),
      }
    }
    case 'arcade':
      return { bg: g('#fb7185', '#7c3aed'), glyph: <Gamepad2 size={s} strokeWidth={stroke} /> }
    case 'player':
      return { bg: g('#3f3f46', '#09090b'), glyph: <Clapperboard size={s} strokeWidth={stroke} /> }
    case 'aboutmac':
      return { bg: g('#93c5fd', '#1e3a8a'), glyph: <Monitor size={s} strokeWidth={stroke} /> }
  }
}

/** Every app icon shares one squircle, highlight and shadow, so the set reads as a family. */
export function AppIcon({ appId, size = 48, className = '', style }: { appId: AppId; size?: number; className?: string; style?: CSSProperties }) {
  const spec = specFor(appId, size)
  const isPhoto = appId === 'about'
  return (
    <div
      className={`app-icon relative grid shrink-0 place-items-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.235,
        background: spec.bg,
        color: spec.fg ?? '#fff',
        ...style,
      }}
      aria-hidden
    >
      {isPhoto ? <div className="absolute inset-[6%] overflow-hidden" style={{ borderRadius: size * 0.2 }}>{spec.glyph}</div> : spec.glyph}
      <div className="pointer-events-none absolute inset-0" style={{ borderRadius: 'inherit', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(0,0,0,.12)' }} />
    </div>
  )
}
