import { motion } from 'motion/react'
import { ExternalLink, X } from 'lucide-react'
import { useDesktop } from '@/store/desktopStore'
import { fs, kindLabel } from '@/data/fs'
import { openFile } from '@/lib/openFile'
import { FileIcon } from '@/components/shared/FileIcon'
import { Button } from '@/components/shared/ui'
import { portfolio, projects } from '@/portfolio.config'
import { apps } from '@/apps/registry'
import { Markdown } from '@/components/shared/Markdown'

function Body({ id }: { id: string }) {
  const n = fs.get(id)!
  if (n.kind === 'text')
    return (
      <div className="scroll-thin h-full overflow-auto px-7 py-6 text-[13px]">
        <Markdown source={n.content ?? ''} />
      </div>
    )
  if (n.kind === 'pdf') return <iframe title="Resume preview" src={`${portfolio.resumeUrl}#toolbar=0&view=FitH`} className="h-full w-full bg-white" />
  if (n.kind === 'project') {
    const p = projects.find((x) => x.id === n.projectId)!
    return (
      <div className="h-full overflow-auto">
        <div className="flex h-36 items-end p-5 text-white" style={{ background: `linear-gradient(135deg, ${p.theme.from}, ${p.theme.to})` }}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{p.category}</div>
            <div className="text-[22px] font-bold">{p.name}</div>
          </div>
        </div>
        <div className="space-y-3 p-5 text-[13px] leading-relaxed">
          <p>{p.description}</p>
          <p className="text-[var(--text-2)]">{p.tech.join(' · ')}</p>
        </div>
      </div>
    )
  }
  if (n.kind === 'vcf')
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <img src={portfolio.profileImage} alt="" className="h-20 w-20 rounded-full object-cover" />
        <div className="text-[17px] font-semibold">{portfolio.name}</div>
        <div className="text-[13px] text-[var(--text-2)]">{portfolio.title}</div>
        <div className="selectable text-[13px]">{portfolio.email}</div>
        <div className="text-[12px] text-[var(--text-3)]">{portfolio.location}</div>
      </div>
    )
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <FileIcon node={n} size={96} />
      <div className="text-[15px] font-semibold">{n.name}</div>
      <div className="text-[12px] text-[var(--text-3)]">
        {kindLabel(n)}
        {n.kind === 'folder' ? ` · ${n.children?.length ?? 0} items` : ''}
        {n.kind === 'app' && n.appId ? ` · ${apps[n.appId].description}` : ''}
        {n.kind === 'link' ? ` · ${n.url}` : ''}
      </div>
    </div>
  )
}

export function QuickLook() {
  const id = useDesktop((s) => s.quickLook)
  const n = id ? fs.get(id) : null
  if (!n) return null
  const close = () => useDesktop.getState().setQuickLook(null)
  const big = n.kind === 'text' || n.kind === 'pdf'
  return (
    <motion.div className="absolute inset-0 z-[45] grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPointerDown={close}>
      <motion.div
        role="dialog"
        aria-label={`Quick Look: ${n.name}`}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex flex-col overflow-hidden rounded-[14px] bg-[var(--surface-solid)] shadow-[var(--window-shadow)]"
        style={{ width: big ? 'min(720px, 92vw)' : 'min(440px, 92vw)', height: big ? 'min(78vh, 760px)' : 'min(380px, 80vh)' }}
      >
        <div className="glass-strong flex h-[40px] shrink-0 items-center gap-2 border-b border-[var(--border)] px-3">
          <button type="button" aria-label="Close Quick Look" onClick={close} className="grid h-6 w-6 place-items-center rounded-[6px] text-[var(--text-2)] hover:bg-[var(--hover)]">
            <X size={15} />
          </button>
          <div className="flex-1 truncate text-center text-[13px] font-semibold">{n.name}</div>
          <Button
            size="sm"
            onClick={() => {
              close()
              openFile(n)
            }}
          >
            <ExternalLink size={12} /> Open
          </Button>
        </div>
        <div className="min-h-0 flex-1">
          <Body id={n.id} />
        </div>
      </motion.div>
    </motion.div>
  )
}
