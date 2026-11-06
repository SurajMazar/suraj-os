import type { AppId } from '@/types'
import { apps, launchpadApps } from '@/apps/registry'
import { gameList } from '@/apps/Arcade/scores'
import { experience, portfolio, projects, skillGroups, skillNotes } from '@/portfolio.config'
import { fs } from '@/data/fs'
import { openApp } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { getSettings, useSettings } from '@/store/settingsStore'
import { openFile } from './openFile'
import { downloadResume } from './menus'

export type ResultGroup = 'Applications' | 'Projects' | 'Experience' | 'Skills' | 'Documents' | 'Commands'

export interface SearchItem {
  id: string
  title: string
  subtitle: string
  group: ResultGroup
  appId?: AppId
  fileId?: string
  color?: string
  keywords: string
  run: () => void
  /** Text for the preview pane. */
  preview?: string
}

let index: SearchItem[] | null = null

function build(): SearchItem[] {
  const out: SearchItem[] = []
  for (const id of [...launchpadApps, 'trash' as AppId]) {
    const a = apps[id]
    out.push({ id: `app:${id}`, title: a.name, subtitle: a.description, group: 'Applications', appId: id, keywords: [a.name, ...(a.keywords ?? [])].join(' '), run: () => openApp(id), preview: a.description })
  }
  for (const g of gameList) {
    out.push({ id: `game:${g.id}`, title: g.name, subtitle: 'Game in Arcade', group: 'Applications', appId: 'arcade', keywords: `${g.name} ${g.keywords} game play arcade`, run: () => openApp('arcade', { game: g.id }), preview: g.tagline })
  }
  for (const p of projects) {
    out.push({
      id: `project:${p.id}`,
      title: p.name,
      subtitle: `${p.category} · ${p.tech.slice(0, 3).join(', ')}`,
      group: 'Projects',
      appId: 'projects',
      color: p.theme.from,
      keywords: [p.name, p.tagline, p.description, p.category, ...p.tech].join(' '),
      run: () => openApp('projects', { projectId: p.id }),
      preview: `${p.tagline}\n\n${p.description}`,
    })
  }
  for (const e of experience) {
    out.push({
      id: `exp:${e.id}`,
      title: `${e.position} · ${e.company}`,
      subtitle: `${e.start} – ${e.end} · ${e.location}`,
      group: 'Experience',
      appId: 'experience',
      color: e.color,
      keywords: [e.company, e.position, ...e.points, ...e.tech].join(' '),
      run: () => openApp('experience', { focus: e.id }),
      preview: e.points.slice(0, 3).join('\n\n'),
    })
  }
  for (const g of skillGroups) {
    for (const s of g.skills) {
      out.push({ id: `skill:${s}`, title: s, subtitle: g.name, group: 'Skills', appId: 'skills', keywords: `${s} ${g.name}`, run: () => openApp('skills', { focus: s, group: g.id }), preview: skillNotes[s] })
    }
  }
  for (const n of fs.all()) {
    if (n.kind === 'text' || n.kind === 'pdf' || n.kind === 'vcf') {
      out.push({ id: `file:${n.id}`, title: n.name, subtitle: n.id.replace(`/Users/${portfolio.handle}`, '~'), group: 'Documents', fileId: n.id, keywords: `${n.name} ${n.content ?? ''}`, run: () => openFile(n), preview: n.content?.slice(0, 600) })
    }
  }
  const set = useSettings.getState().set
  const d = () => useDesktop.getState()
  const commands: [string, string, () => void, string?][] = [
    ['Toggle Dark Mode', 'Switch between light and dark appearance', () => set('appearance', getSettings().appearance === 'dark' ? 'light' : 'dark'), 'theme appearance night'],
    ['Change Wallpaper', 'Open wallpaper settings', () => openApp('settings', { section: 'wallpaper' }), 'background'],
    ['Download Resume', `Save ${portfolio.resumeFileName}`, () => downloadResume(), 'cv pdf'],
    ['Send an Email', portfolio.email, () => window.open(`mailto:${portfolio.email}`), 'contact mail hire'],
    ['Mission Control', 'See every open window', () => d().setOverlay('mission'), 'windows overview'],
    ['Launchpad', 'All applications', () => d().setOverlay('launchpad'), 'apps'],
    ['Lock Screen', 'Lock SurajOS', () => d().setSystem('locked'), 'lock'],
    ['Restart', 'Play the startup sequence', () => d().setSystem('booting', 'restart'), 'reboot boot'],
    ['Show Notification Center', 'Notifications and updates', () => d().setPanel('notifications'), 'notifications'],
  ]
  for (const [title, subtitle, run, kw] of commands) out.push({ id: `cmd:${title}`, title, subtitle, group: 'Commands', keywords: `${title} ${kw ?? ''}`, run })
  return out
}

/** Prefix and word matches rank above substring matches; titles above keywords. */
export function search(query: string, limit = 40): SearchItem[] {
  index ??= build()
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/)
  const scored: { item: SearchItem; score: number }[] = []
  for (const item of index) {
    const title = item.title.toLowerCase()
    const kw = item.keywords.toLowerCase()
    let score = 0
    let ok = true
    for (const t of terms) {
      if (title.startsWith(t)) score += 100
      else if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(title)) score += 60
      else if (title.includes(t)) score += 40
      else if (kw.includes(t)) score += 10
      else {
        ok = false
        break
      }
    }
    if (!ok) continue
    if (item.group === 'Applications') score += 15
    scored.push({ item, score })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.item)
}
