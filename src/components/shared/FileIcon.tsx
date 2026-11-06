import { Globe, Contact as ContactIcon } from 'lucide-react'
import type { FsNode } from '@/data/fs'
import { AppIcon } from './AppIcon'
import { projects } from '@/portfolio.config'

function Folder({ size, tint }: { size: number; tint?: string }) {
  const c1 = tint ?? '#5ac8fa'
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 64 52" aria-hidden>
      <defs>
        <linearGradient id={`fb-${c1}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c1} stopOpacity=".95" />
          <stop offset="1" stopColor={c1} />
        </linearGradient>
      </defs>
      <path d="M4 6a4 4 0 0 1 4-4h14l5 5h29a4 4 0 0 1 4 4v3H4z" fill={c1} opacity=".75" />
      <rect x="2" y="11" width="60" height="39" rx="5" fill={`url(#fb-${c1})`} />
      <rect x="2" y="11" width="60" height="39" rx="5" fill="#fff" opacity=".12" />
      <path d="M2 16h60" stroke="#fff" strokeOpacity=".35" />
    </svg>
  )
}

function Page({ size, children, corner = '#e5e7eb' }: { size: number; children?: React.ReactNode; corner?: string }) {
  return (
    <div className="relative" style={{ width: size * 0.78, height: size }}>
      <div className="absolute inset-0 overflow-hidden rounded-[3px] bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)]" style={{ clipPath: 'polygon(0 0, 72% 0, 100% 22%, 100% 100%, 0 100%)' }}>
        {children}
      </div>
      <div className="absolute right-0 top-0 h-[22%] w-[28%] rounded-bl-[3px]" style={{ background: corner }} />
    </div>
  )
}

export function FileIcon({ node, size = 56 }: { node: FsNode; size?: number }) {
  switch (node.kind) {
    case 'folder':
      return <Folder size={size} tint={node.tint} />
    case 'app':
      return node.appId ? <AppIcon appId={node.appId} size={size * 0.9} /> : null
    case 'text':
      return (
        <Page size={size}>
          <div className="space-y-[9%] px-[14%] pt-[26%]">
            {[90, 70, 85, 60, 80, 50].map((w, i) => (
              <div key={i} className="h-[2px] rounded bg-zinc-300" style={{ width: `${w}%` }} />
            ))}
          </div>
        </Page>
      )
    case 'pdf':
      return (
        <Page size={size} corner="#fecaca">
          <div className="space-y-[9%] px-[14%] pt-[26%]">
            {[80, 60, 75].map((w, i) => (
              <div key={i} className="h-[2px] rounded bg-zinc-300" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-[12%] mx-auto w-[64%] rounded-[2px] bg-[#e5322d] text-center font-bold text-white" style={{ fontSize: size * 0.16 }}>
            PDF
          </div>
        </Page>
      )
    case 'vcf':
      return (
        <div className="grid place-items-center rounded-[8px] bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-600 shadow-[0_1px_3px_rgba(0,0,0,.3)]" style={{ width: size * 0.9, height: size * 0.7 }}>
          <ContactIcon size={size * 0.4} />
        </div>
      )
    case 'project': {
      const p = projects.find((x) => x.id === node.projectId)
      return (
        <div className="grid place-items-center rounded-[10px] text-white shadow-[0_1px_3px_rgba(0,0,0,.3)]" style={{ width: size * 0.82, height: size * 0.82, background: p ? `linear-gradient(140deg, ${p.theme.from}, ${p.theme.to})` : '#6366f1' }}>
          <span className="font-bold" style={{ fontSize: size * 0.3 }}>
            {p?.name.slice(0, 1) ?? 'P'}
          </span>
        </div>
      )
    }
    case 'link':
      return (
        <div className="grid place-items-center rounded-full bg-gradient-to-b from-sky-300 to-blue-600 text-white shadow-[0_1px_3px_rgba(0,0,0,.3)]" style={{ width: size * 0.74, height: size * 0.74 }}>
          <Globe size={size * 0.44} />
        </div>
      )
  }
}
