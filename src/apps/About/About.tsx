import { useState } from 'react'
import { motion } from 'motion/react'
import { Briefcase, Download, GraduationCap, Languages, Mail, MapPin } from 'lucide-react'
import type { AppProps } from '@/types'
import { experience, portfolio } from '@/portfolio.config'
import { openApp } from '@/store/windowStore'
import { Button } from '@/components/shared/ui'
import { GitHubMark, LinkedInMark } from '@/components/shared/BrandIcons'
import { downloadResume } from '@/lib/menus'

const fade = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 * i, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const } })

export default function About(_: AppProps) {
  const [active, setActive] = useState(experience[0].id)
  const current = experience.find((e) => e.id === active)!

  return (
    <div className="scroll-thin @container h-full overflow-y-auto bg-[var(--surface-solid)]">
      <header className="relative overflow-hidden px-8 pb-8 pt-10">
        <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 80% at 15% 0%, rgba(99,102,241,.35), transparent), radial-gradient(50% 70% at 90% 10%, rgba(236,72,153,.25), transparent)' }} />
        <div className="relative flex flex-col gap-6 @[560px]:flex-row @[560px]:items-center">
          <motion.img {...fade(0)} src={portfolio.profileImage} alt={portfolio.name} className="h-32 w-32 shrink-0 rounded-[28px] object-cover shadow-[0_12px_40px_rgba(0,0,0,.3)] ring-1 ring-black/10" />
          <div className="min-w-0">
            <motion.div {...fade(1)} className="text-[12px] font-semibold uppercase tracking-[.18em] text-[var(--accent)]">
              {portfolio.subtitle}
            </motion.div>
            <motion.h1 {...fade(2)} className="mt-1 text-[34px] font-extrabold leading-[1.05] tracking-tight">
              {portfolio.name}
            </motion.h1>
            <motion.p {...fade(3)} className="mt-1 text-[17px] text-[var(--text-2)]">
              {portfolio.title} at {portfolio.currentRole.company}
            </motion.p>
            <motion.div {...fade(4)} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--text-2)]">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> {portfolio.location} ({portfolio.timezoneLabel})
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase size={13} /> {portfolio.yearsOfExperience} years of experience
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> {portfolio.availability}
              </span>
            </motion.div>
            <motion.div {...fade(5)} className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => openApp('contact')}>
                <Mail size={14} /> Get in touch
              </Button>
              <Button onClick={() => downloadResume()}>
                <Download size={14} /> Resume
              </Button>
              <Button onClick={() => openApp('safari', { url: portfolio.github })}>
                <GitHubMark size={13} /> GitHub
              </Button>
              <Button onClick={() => window.open(portfolio.linkedin, '_blank', 'noopener')}>
                <LinkedInMark size={13} /> LinkedIn
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="space-y-10 px-8 pb-10">
        <section className="grid gap-6 @[640px]:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3 text-[15px] leading-[1.65]">
            <p className="text-[17px] font-medium leading-snug">{portfolio.summary}</p>
            {portfolio.about.map((p) => (
              <p key={p} className="text-[var(--text-2)]">
                {p}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 self-start">
            {portfolio.stats.map((s, i) => (
              <motion.div key={s.label} {...fade(i + 2)} className="rounded-[14px] bg-[var(--surface-3)] p-3.5">
                <div className="text-[28px] font-extrabold tracking-tight">{s.value}</div>
                <div className="text-[12px] leading-snug text-[var(--text-2)]">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[.16em] text-[var(--text-3)]">How I work</h2>
          <div className="grid gap-3 @[560px]:grid-cols-2">
            {portfolio.principles.map((p, i) => (
              <motion.div key={p.title} {...fade(i)} className="rounded-[14px] border border-[var(--border)] p-4">
                <div className="text-[13px] font-semibold">{p.title}</div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-2)]">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[.16em] text-[var(--text-3)]">Career timeline</h2>
          <div className="relative">
            <div className="absolute left-0 right-0 top-[9px] h-[2px] bg-[var(--border)]" />
            <div className="relative flex justify-between gap-2">
              {[...experience].reverse().map((e) => (
                <button key={e.id} type="button" onClick={() => setActive(e.id)} className="group flex min-w-0 flex-1 flex-col items-center gap-2 text-center" aria-pressed={active === e.id}>
                  <span className="h-5 w-5 rounded-full border-[3px] border-[var(--surface-solid)] transition group-hover:scale-125" style={{ background: e.color, boxShadow: active === e.id ? `0 0 0 4px ${e.color}55` : 'none' }} />
                  <span className={`truncate text-[11px] font-semibold ${active === e.id ? '' : 'text-[var(--text-2)]'}`}>{e.company}</span>
                  <span className="text-[11px] text-[var(--text-3)]">{e.start.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>
          <motion.div key={current.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-[16px] border border-[var(--border)] p-5" style={{ borderLeft: `4px solid ${current.color}` }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="text-[15px] font-bold">{current.position}</div>
                <div className="text-[13px] text-[var(--text-2)]">
                  {current.company} · {current.location}
                </div>
              </div>
              <div className="text-[12px] tabular-nums text-[var(--text-3)]">
                {current.start} – {current.end}
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-2)]">{current.points[0]}</p>
            <Button size="sm" className="mt-3" onClick={() => openApp('experience', { focus: current.id })}>
              Open in Experience
            </Button>
          </motion.div>
        </section>

        <section className="grid gap-3 @[560px]:grid-cols-2">
          <div className="flex gap-3 rounded-[14px] bg-[var(--surface-3)] p-4">
            <GraduationCap size={20} className="mt-0.5 shrink-0 text-[var(--accent)]" />
            <div>
              <div className="text-[13px] font-semibold">{portfolio.education.degree}</div>
              <div className="mt-0.5 text-[12px] text-[var(--text-2)]">
                {portfolio.education.school}, {portfolio.education.year}
              </div>
            </div>
          </div>
          <div className="flex gap-3 rounded-[14px] bg-[var(--surface-3)] p-4">
            <Languages size={20} className="mt-0.5 shrink-0 text-[var(--accent)]" />
            <div>
              <div className="text-[13px] font-semibold">Languages</div>
              {portfolio.languages.map((l) => (
                <div key={l} className="mt-0.5 text-[12px] text-[var(--text-2)]">
                  {l}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
