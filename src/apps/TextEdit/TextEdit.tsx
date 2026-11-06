import { useState } from 'react'
import { Lock, Minus, Plus } from 'lucide-react'
import type { AppProps } from '@/types'
import { fs } from '@/data/fs'
import { IconButton } from '@/components/shared/ui'
import { Markdown } from '@/components/shared/Markdown'

/** Reads the portfolio's documents as formatted pages. */
export default function TextEdit({ props }: AppProps) {
  const node = fs.get(props.fileId as string)
  const [size, setSize] = useState(14)
  if (!node) return <div className="p-6 text-[13px]">This document could not be found.</div>
  const words = (node.content ?? '').split(/\s+/).filter((w) => /\w/.test(w)).length
  return (
    <div className="flex h-full flex-col bg-[var(--surface-solid)]">
      <div className="flex h-[34px] shrink-0 items-center gap-1 border-b border-[var(--border)] bg-[var(--surface-2)] px-2.5 text-[12px] text-[var(--text-2)]">
        <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-3)] px-2 py-[2px] text-[11px]">
          <Lock size={10} /> Read only
        </span>
        <span className="ml-2 text-[11px] text-[var(--text-3)]">{words} words</span>
        <span className="ml-auto" />
        <IconButton label="Smaller text" onClick={() => setSize((s) => Math.max(11, s - 1))}>
          <Minus size={13} />
        </IconButton>
        <span className="w-9 text-center text-[11px] tabular-nums">{Math.round((size / 14) * 100)}%</span>
        <IconButton label="Larger text" onClick={() => setSize((s) => Math.min(22, s + 1))}>
          <Plus size={13} />
        </IconButton>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto max-w-[680px] px-8 pb-12 pt-8 text-[var(--text)]" style={{ fontSize: size }}>
          <Markdown source={node.content ?? ''} />
        </article>
      </div>
    </div>
  )
}
