import type { AppId } from '@/types'
import { experience, portfolio, projects } from '@/portfolio.config'

export type FileKind = 'folder' | 'app' | 'text' | 'pdf' | 'vcf' | 'project' | 'link'

export interface FsNode {
  id: string
  name: string
  kind: FileKind
  parent: string | null
  children?: string[]
  appId?: AppId
  content?: string
  projectId?: string
  url?: string
  /** Tint for project folders. */
  tint?: string
  modified: string
}

const nodes: Record<string, FsNode> = {}

interface Spec {
  name: string
  kind: FileKind
  id?: string
  appId?: AppId
  content?: string
  projectId?: string
  url?: string
  tint?: string
  modified?: string
  children?: Spec[]
}

function add(spec: Spec, parent: FsNode | null, path: string): FsNode {
  const id = spec.id ?? (path ? `${path}/${spec.name}` : spec.name || '/')
  const node: FsNode = {
    id,
    name: spec.name,
    kind: spec.kind,
    parent: parent?.id ?? null,
    appId: spec.appId,
    content: spec.content,
    projectId: spec.projectId,
    url: spec.url,
    tint: spec.tint,
    modified: spec.modified ?? 'Nov 2026',
  }
  nodes[id] = node
  if (spec.children) node.children = spec.children.map((c) => add(c, node, id === '/' ? '' : id).id)
  return node
}

const welcome = `# Welcome to SurajOS

Hi, I'm **${portfolio.name}**: ${portfolio.title} and ${portfolio.subtitle}, based in ${portfolio.location}.

This portfolio works like a desktop. Some places to start:

| Open | What you'll find |
| --- | --- |
| Projects | What I've built, at work and in open source |
| Experience | Seven years, five companies |
| Resume.pdf | The whole CV, ready to download |
| Terminal | Type \`help\` and look around |

## Handy shortcuts

| Action | Keys |
| --- | --- |
| Spotlight search | \`⌘K\` or \`Ctrl\` \`Space\` |
| Mission Control | \`⌥\` \`↑\` |
| Launchpad | \`⌥\` \`L\` |
| Quick Look the selected file | \`Space\` |
| Zoom a window | Double-click its title bar |

Drag windows by their title bar. Drag one to the left or right edge of the screen to snap it, or to the top to fill the screen.

Thanks for stopping by.
— ${portfolio.firstName}
`

const journey = `# My Journey

${experience
  .slice()
  .reverse()
  .map((e) => `## ${e.position}, ${e.company}\n**${e.start} – ${e.end}** · ${e.location}\n\n${e.points.map((p) => `- ${p}`).join('\n')}`)
  .join('\n\n')}

## Education
**${portfolio.education.degree}**
${portfolio.education.school}, ${portfolio.education.year}
`

const howIWork = `# How I Work

${portfolio.about.join('\n\n')}

${portfolio.principles.map((p) => `## ${p.title}\n${p.body}`).join('\n\n')}
`

const education = `# Education

**${portfolio.education.degree}**
${portfolio.education.school}
Graduated ${portfolio.education.year}

## Languages

${portfolio.languages.map((l) => `- ${l}`).join('\n')}
`

export const shortcutsText = `# Keyboard Shortcuts

> Browsers and operating systems keep some keys for themselves: \`⌘\` \`Space\` opens macOS Spotlight, \`⌘\` \`W\` closes the browser tab and \`Ctrl\` \`↑\` opens macOS Mission Control. SurajOS uses the Option key for those instead.

## Windows and apps

| Action | Keys | Also |
| --- | --- | --- |
| Close window | \`⌥\` \`W\` | |
| Minimize window | \`⌥\` \`M\` | |
| Quit application | \`⌥\` \`Q\` | |
| Application switcher | \`⌥\` \`Tab\` | Keep holding \`⌥\`, press \`Tab\` to cycle |
| System Settings | \`⌥\` \`,\` | |

## Getting around

| Action | Keys | Also |
| --- | --- | --- |
| Spotlight | \`⌘\` \`K\` | \`Ctrl\` \`Space\` |
| Mission Control | \`⌥\` \`↑\` | \`Ctrl\` \`↑\` where your OS allows it |
| App Exposé | \`⌥\` \`↓\` | \`Ctrl\` \`↓\` where your OS allows it |
| Launchpad | \`⌥\` \`L\` | \`⌘\` \`⇧\` \`A\` where your browser allows it |
| Close overlay | \`Esc\` | |

## Files and Safari

| Action | Keys | Also |
| --- | --- | --- |
| Quick Look | \`Space\` | With a file selected |
| Open selected file | \`Return\` | |
| Reload Safari | \`⌘\` \`R\` | With Safari in front |

On Windows and Linux, read \`⌘\` as \`Ctrl\` and \`⌥\` as \`Alt\`.
`

function readme(p: (typeof projects)[number]) {
  return `# ${p.name}

> ${p.tagline}

${p.description}

| | |
| --- | --- |
| Category | ${p.category} |
| Type | ${p.kind === 'work' ? 'Work project' : 'Open source'} |
| Role | ${p.role} |
| Stack | ${p.tech.join(', ')} |
${p.github ? `| Source | ${p.github} |\n` : ''}${p.live ? `| Live | ${p.live} |\n` : ''}${p.highlights.length ? `\n## Highlights\n\n${p.highlights.map((h) => `- ${h}`).join('\n')}\n` : ''}${p.impact?.length ? `\n## Impact\n\n${p.impact.map((h) => `- ${h}`).join('\n')}\n` : ''}`
}

const projectFolders: Spec[] = projects.map((p) => ({
  name: p.name,
  kind: 'folder',
  tint: p.theme.from,
  children: [
    { name: 'README.md', kind: 'text', content: readme(p) },
    { name: `${p.name}.project`, kind: 'project', projectId: p.id },
    ...(p.github ? [{ name: 'Source on GitHub.webloc', kind: 'link' as const, url: p.github }] : []),
    ...(p.live ? [{ name: 'Live Demo.webloc', kind: 'link' as const, url: p.live }] : []),
  ],
}))

const appsFolder: Spec[] = (
  [
    ['About Me', 'about'],
    ['Arcade', 'arcade'],
    ['Contact', 'contact'],
    ['Experience', 'experience'],
    ['Finder', 'finder'],
    ['Projects', 'projects'],
    ['Resume', 'resume'],
    ['Safari', 'safari'],
    ['Skills', 'skills'],
    ['System Settings', 'settings'],
    ['Terminal', 'terminal'],
  ] as const
).map(([name, appId]) => ({ name: `${name}.app`, kind: 'app', appId, id: `/Applications/${name}.app` }))

add(
  {
    name: '',
    kind: 'folder',
    id: '/',
    children: [
      { name: 'Applications', kind: 'folder', id: '/Applications', children: appsFolder },
      {
        name: 'Users',
        kind: 'folder',
        id: '/Users',
        children: [
          {
            name: portfolio.handle,
            kind: 'folder',
            id: HOME(),
            children: [
              {
                name: 'Desktop',
                kind: 'folder',
                id: `${HOME()}/Desktop`,
                children: [
                  { name: 'Welcome.md', kind: 'text', content: welcome },
                  { name: 'About Me.app', kind: 'app', appId: 'about' },
                  { name: 'Resume.pdf', kind: 'pdf' },
                  { name: 'Contact.vcf', kind: 'vcf' },
                  { name: 'Projects', kind: 'folder', id: `${HOME()}/Desktop/Projects`, children: [] },
                ],
              },
              {
                name: 'Documents',
                kind: 'folder',
                id: `${HOME()}/Documents`,
                children: [
                  { name: 'My Journey.md', kind: 'text', content: journey },
                  { name: 'How I Work.md', kind: 'text', content: howIWork },
                  { name: 'Education.md', kind: 'text', content: education },
                  { name: 'Keyboard Shortcuts.md', kind: 'text', content: shortcutsText },
                ],
              },
              {
                name: 'Downloads',
                kind: 'folder',
                id: `${HOME()}/Downloads`,
                children: [
                  { name: portfolio.resumeFileName, kind: 'pdf' },
                  { name: 'Suraj Thapa.vcf', kind: 'vcf' },
                ],
              },
              { name: 'Projects', kind: 'folder', id: `${HOME()}/Projects`, children: projectFolders },
            ],
          },
        ],
      },
    ],
  },
  null,
  '',
)

// The Desktop "Projects" item is an alias of ~/Projects.
nodes[`${HOME()}/Desktop/Projects`].children = nodes[`${HOME()}/Projects`].children

function HOME() {
  return `/Users/${portfolio.handle}`
}

export const HOME_DIR = HOME()
export const DESKTOP_DIR = `${HOME_DIR}/Desktop`

export const fs = {
  get: (id: string): FsNode | undefined => nodes[id],
  children: (id: string): FsNode[] => (nodes[id]?.children ?? []).map((c) => nodes[c]),
  all: (): FsNode[] => Object.values(nodes),
  /** Path of folders from root to this node. */
  ancestry: (id: string): FsNode[] => {
    const out: FsNode[] = []
    let cur: FsNode | undefined = nodes[id]
    while (cur) {
      out.unshift(cur)
      cur = cur.parent ? nodes[cur.parent] : undefined
    }
    return out
  },
  /** Resolve a terminal-style path against a working directory. */
  resolve: (cwd: string, input: string): FsNode | undefined => {
    if (!input || input === '~') return nodes[HOME_DIR]
    let path = input.startsWith('~') ? HOME_DIR + input.slice(1) : input.startsWith('/') ? input : `${cwd === '/' ? '' : cwd}/${input}`
    const parts: string[] = []
    for (const seg of path.split('/')) {
      if (!seg || seg === '.') continue
      if (seg === '..') parts.pop()
      else parts.push(seg)
    }
    path = '/' + parts.join('/')
    if (nodes[path]) return nodes[path]
    // Case-insensitive fallback, so "cd documents" works.
    let cur = nodes['/']
    for (const seg of parts) {
      const next = (cur.children ?? []).map((c) => nodes[c]).find((n) => n.name.toLowerCase() === seg.toLowerCase())
      if (!next) return undefined
      cur = next
    }
    return cur
  },
}

export function kindLabel(n: FsNode): string {
  switch (n.kind) {
    case 'folder':
      return 'Folder'
    case 'app':
      return 'Application'
    case 'text':
      return 'Markdown Document'
    case 'pdf':
      return 'PDF Document'
    case 'vcf':
      return 'vCard'
    case 'project':
      return 'Project'
    case 'link':
      return 'Web Location'
  }
}
