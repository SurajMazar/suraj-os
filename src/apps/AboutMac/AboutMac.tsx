import { useState } from 'react'
import { motion } from 'motion/react'
import type { AppProps } from '@/types'
import { portfolio } from '@/portfolio.config'
import { Button } from '@/components/shared/ui'
import { openApp } from '@/store/windowStore'

const specs: [string, string][] = [
  ['Chip', 'TypeScript, compiled by Vite'],
  ['Memory', 'Zustand stores, one per concern'],
  ['Graphics', 'Motion springs and CSS'],
  ['Startup Disk', 'portfolio.config.ts'],
  ['Serial Number', `${portfolio.yearsOfExperience}Y-50PRJ-NPL`],
]

const setup: [string, string][] = [
  ['Daily driver', 'Claude Code and Codex, with MCP servers'],
  ['Frontend', 'React, Next.js and TypeScript'],
  ['Backend', 'Python, Node.js and PHP'],
  ['State', 'Redux Toolkit, Reselect, Zustand'],
  ['Testing', 'Playwright and unit tests'],
]

export default function AboutMac(_: AppProps) {
  const [tab, setTab] = useState<'overview' | 'setup'>('overview')
  const rows = tab === 'overview' ? specs : setup
  return (
    <div className="scroll-thin flex h-full flex-col items-center overflow-y-auto bg-[var(--surface-solid)] px-8 pb-5 pt-10 text-center" data-drag-region>
      <motion.img src="./favicon.svg" alt="" width={72} height={72} draggable={false} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="shrink-0 drop-shadow-[0_6px_16px_rgba(0,0,0,.3)]" />
      <div className="mt-2 text-[22px] font-bold">SurajOS</div>
      <div className="text-[12px] text-[var(--text-3)]">Version 1.0 · {portfolio.name}</div>
      <div className="mt-3 inline-flex rounded-[7px] bg-[var(--surface-3)] p-[2px] text-[12px]" data-no-drag>
        {(['overview', 'setup'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-[5px] px-3 py-0.5 ${tab === t ? 'bg-[var(--surface-solid)] font-medium shadow' : 'text-[var(--text-2)]'}`}>
            {t === 'overview' ? 'Overview' : 'Engineering setup'}
          </button>
        ))}
      </div>
      {/* Both columns size to their content, so the block centers as a whole. */}
      <dl className="mx-auto mt-4 grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-left text-[12px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-right font-semibold">{k}</dt>
            <dd className="text-[var(--text-2)]">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex shrink-0 gap-2 pt-5" data-no-drag>
        <Button size="sm" onClick={() => openApp('about')}>
          About Suraj
        </Button>
        <Button size="sm" onClick={() => openApp('safari', { url: portfolio.github })}>
          Source on GitHub
        </Button>
      </div>
    </div>
  )
}
