import type { ReactNode } from 'react'
import { experience, portfolio, projects, skillGroups } from '@/portfolio.config'
import { HOME_DIR, fs, type FsNode } from '@/data/fs'
import { openFile } from '@/lib/openFile'
import { openApp } from '@/store/windowStore'
import { useSettings, type WallpaperId } from '@/store/settingsStore'
import { useDesktop } from '@/store/desktopStore'
import { apps } from '@/apps/registry'
import type { AppId } from '@/types'
import { disco, discover, eggs, playEffect, shake, upsideDown, useEggs } from '@/lib/easterEggs'

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

const fortunes = [
  'Today’s forecast: a 90% chance of a merge conflict before lunch.',
  'The bug you are hunting is in the file you are sure it isn’t in.',
  'Your next deploy will go smoothly. The one after that, we don’t talk about.',
  'A TODO left today is a legacy system tomorrow.',
  'You will write a clever regex. Future you will not understand it.',
  'Good things come to those who read the whole error message.',
  'Lucky number: 200. Unlucky number: 500.',
  'The test you skipped today is the incident you write up on Friday.',
]

const eightBall = ['Ship it.', 'Needs more tests.', 'Ask again after stand-up.', 'It works on my machine, so yes.', 'The logs say no.', 'Signs point to a hotfix.', 'Definitely. Next sprint.', 'Unclear. Clear the cache and ask again.']

const trainArt = String.raw`
      ____
  ___|[]__|____     ___________   ___________
 |  _   _   _  |___|  _  _  _  |_|  _  _  _  |
 |_(o)_(o)_(o)_|   |_(o)__(o)__|_|_(o)__(o)__|`

const everestArt = String.raw`
            /\
           /**\
          /    \    /\
     /\  /      \  /  \
    /  \/   /\   \/    \
   /    \  /  \   \     \
`

/** Years, months and days since the first role on the CV. */
function careerUptime() {
  const start = Math.min(...experience.map((e) => new Date(`1 ${e.start}`).getTime()).filter((t) => !Number.isNaN(t)))
  const days = Math.floor((Date.now() - start) / 86400000)
  return `up ${Math.floor(days / 365)} years, ${Math.floor((days % 365) / 30)} months, ${days % 30} days, load average: coffee, tea, momo`
}

const coffeeArt = String.raw`
      ( (
       ) )
    ........
    |      |]
    \      /
     '----'`

export interface Ctx {
  cwd: string
  setCwd: (p: string) => void
  clear: () => void
  exit: () => void
  history: string[]
}

type Run = (args: string[], ctx: Ctx) => ReactNode

const C = {
  green: 'text-[#4ade80]',
  blue: 'text-[#60a5fa]',
  cyan: 'text-[#22d3ee]',
  yellow: 'text-[#facc15]',
  magenta: 'text-[#e879f9]',
  red: 'text-[#f87171]',
  dim: 'text-white/45',
  bold: 'font-bold text-white',
}

export const shortPath = (p: string) => (p.startsWith(HOME_DIR) ? '~' + p.slice(HOME_DIR.length) : p)

function Link({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${C.cyan} underline decoration-dotted underline-offset-2 hover:decoration-solid`}>
      {children}
    </a>
  )
}

function nameOf(n: FsNode) {
  const cls = n.kind === 'folder' ? C.blue + ' font-bold' : n.kind === 'app' ? C.green : n.kind === 'link' ? C.cyan : n.kind === 'project' ? C.magenta : ''
  return <span className={cls}>{n.name.includes(' ') ? `'${n.name}'` : n.name}{n.kind === 'folder' ? '/' : ''}</span>
}

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(1, n - s.length))

function resolve(ctx: Ctx, arg: string) {
  return fs.resolve(ctx.cwd, arg.replace(/^['"]|['"]$/g, ''))
}

const neofetchArt = String.raw`
         /\
        /  \      /\
       / /\ \    /  \
      / /  \ \  / /\ \
     / /    \ \/ /  \ \
    /_/      \__/    \_\
   ~~~~~~~~~~~~~~~~~~~~~~`

const momoArt = String.raw`
        .-""""-.
      .'  ~~~~  '.
     /  (  ~~  )  \
    |   '-.__.-'   |
     \   ~~~~~~   /
      '-.______.-'`

export const commands: Record<string, { desc: string; run: Run; hidden?: boolean }> = {
  help: {
    desc: 'List the commands',
    run: () => (
      <div>
        <div className={C.dim}>Explore the portfolio from here. Tab completes, ↑ and ↓ walk history.</div>
        <div className="mt-1 grid grid-cols-[110px_1fr] gap-x-3">
          {Object.entries(commands)
            .filter(([, c]) => !c.hidden)
            .map(([k, c]) => (
              <div key={k} className="contents">
                <span className={C.green}>{k}</span>
                <span className="text-white/75">{c.desc}</span>
              </div>
            ))}
        </div>
        <div className={`${C.dim} mt-1`}>There is at least one command that is not on this list.</div>
      </div>
    ),
  },
  about: {
    desc: 'Who Suraj is',
    run: () => (
      <div className="space-y-1">
        <div>
          <span className={C.bold}>{portfolio.name}</span> · {portfolio.title} · {portfolio.subtitle}
        </div>
        <div className="text-white/80">{portfolio.summary}</div>
        {portfolio.about.map((a) => (
          <div key={a} className="text-white/70">
            {a}
          </div>
        ))}
      </div>
    ),
  },
  whoami: {
    desc: 'Print the current user',
    run: () => (
      <span>
        {portfolio.handle} <span className={C.dim}>({portfolio.name}, {portfolio.title}, {portfolio.location})</span>
      </span>
    ),
  },
  ls: {
    desc: 'List a folder: ls [path]',
    run: (args, ctx) => {
      const long = args.includes('-l') || args.includes('-la')
      const target = args.filter((a) => !a.startsWith('-'))[0]
      const node = target ? resolve(ctx, target) : fs.get(ctx.cwd)
      if (!node) return <span className={C.red}>ls: {target}: No such file or directory</span>
      const kids = node.kind === 'folder' ? fs.children(node.id) : [node]
      if (!kids.length) return <span className={C.dim}>(empty)</span>
      if (long)
        return (
          <div>
            {kids.map((k) => (
              <div key={k.id}>
                <span className={C.dim}>{k.kind === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--'}  {portfolio.handle}  {pad(k.modified, 10)}</span>
                {nameOf(k)}
              </div>
            ))}
          </div>
        )
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-0.5">
          {kids.map((k) => (
            <span key={k.id}>{nameOf(k)}</span>
          ))}
        </div>
      )
    },
  },
  cd: {
    desc: 'Change folder: cd <path>',
    run: (args, ctx) => {
      const node = args[0] ? resolve(ctx, args.join(' ')) : fs.get(HOME_DIR)
      if (!node) return <span className={C.red}>cd: no such file or directory: {args.join(' ')}</span>
      if (node.kind !== 'folder') return <span className={C.red}>cd: not a directory: {args.join(' ')}</span>
      ctx.setCwd(node.id)
      return null
    },
  },
  pwd: { desc: 'Print the working folder', run: (_, ctx) => ctx.cwd },
  cat: {
    desc: 'Print a file: cat <file>',
    run: (args, ctx) => {
      if (!args.length) return <span className={C.red}>usage: cat &lt;file&gt;</span>
      const node = resolve(ctx, args.join(' '))
      if (!node) return <span className={C.red}>cat: {args.join(' ')}: No such file or directory</span>
      if (node.kind === 'folder') return <span className={C.red}>cat: {node.name}: Is a directory</span>
      if (node.kind === 'text') return <div className="whitespace-pre-wrap text-white/85">{node.content}</div>
      if (node.kind === 'link') return <Link href={node.url!}>{node.url}</Link>
      if (node.kind === 'project') {
        const p = projects.find((x) => x.id === node.projectId)!
        return commands.projects.run([p.id], ctx)
      }
      if (node.kind === 'vcf')
        return (
          <div className="whitespace-pre text-white/85">
            {`BEGIN:VCARD\nVERSION:3.0\nFN:${portfolio.name}\nTITLE:${portfolio.title}\nEMAIL:${portfolio.email}\nADR:;;${portfolio.location}\nURL:${portfolio.github}\nEND:VCARD`}
          </div>
        )
      return <span className={C.yellow}>{node.name} is a binary file. Try: open {node.name.includes(' ') ? `'${node.name}'` : node.name}</span>
    },
  },
  open: {
    desc: 'Open a file or app: open <file|app>',
    run: (args, ctx) => {
      const arg = args.join(' ')
      if (!arg) return <span className={C.red}>usage: open &lt;file | app&gt;</span>
      const node = resolve(ctx, arg)
      if (node) {
        openFile(node)
        return <span className={C.dim}>Opening {node.name}…</span>
      }
      const app = (Object.keys(apps) as AppId[]).find((id) => apps[id].name.toLowerCase() === arg.toLowerCase().replace(/\.app$/, '') || id === arg.toLowerCase())
      if (app) {
        openApp(app)
        return <span className={C.dim}>Opening {apps[app].name}…</span>
      }
      return <span className={C.red}>The file {arg} does not exist.</span>
    },
  },
  projects: {
    desc: 'List projects, or show one: projects [id]',
    run: (args) => {
      if (args[0]) {
        const p = projects.find((x) => x.id === args[0] || x.name.toLowerCase() === args.join(' ').toLowerCase())
        if (!p) return <span className={C.red}>projects: no project “{args.join(' ')}”. Run `projects` for the list.</span>
        return (
          <div className="space-y-1">
            <div>
              <span className={C.bold}>{p.name}</span> <span className={C.dim}>· {p.category}</span>
            </div>
            <div className="text-white/80">{p.description}</div>
            {p.highlights.map((h) => (
              <div key={h} className="text-white/70">
                <span className={C.green}>✓</span> {h}
              </div>
            ))}
            <div>
              <span className={C.yellow}>stack</span> {p.tech.join(', ')}
            </div>
            {p.github && (
              <div>
                <span className={C.yellow}>source</span> <Link href={p.github}>{p.github.replace('https://', '')}</Link>
              </div>
            )}
            {p.live && (
              <div>
                <span className={C.yellow}>live</span> <Link href={p.live}>{p.live.replace('https://', '')}</Link>
              </div>
            )}
          </div>
        )
      }
      return (
        <div>
          {projects.map((p) => (
            <div key={p.id}>
              <span className={C.magenta}>{pad(p.id, 28)}</span>
              <span className="text-white/80">{p.tagline}</span>
            </div>
          ))}
          <div className={`${C.dim} mt-1`}>Run `projects &lt;id&gt;` for details, or `open Projects`.</div>
        </div>
      )
    },
  },
  experience: {
    desc: 'Career history',
    run: () => (
      <div className="space-y-1.5">
        {experience.map((e) => (
          <div key={e.id}>
            <span className={C.yellow}>{pad(`${e.start} – ${e.end}`, 22)}</span>
            <span className={C.bold}>{e.position}</span> <span className={C.dim}>@</span> <span className={C.cyan}>{e.company}</span>
            <div className="pl-[22ch] text-white/65">{e.points[0]}</div>
          </div>
        ))}
      </div>
    ),
  },
  skills: {
    desc: 'Skills by area',
    run: () => (
      <div className="space-y-1">
        {skillGroups.map((g) => (
          <div key={g.id}>
            <span className={C.green}>{pad(g.name, 22)}</span>
            <span className="text-white/80">{g.skills.join(', ')}</span>
          </div>
        ))}
      </div>
    ),
  },
  contact: {
    desc: 'How to reach Suraj',
    run: () => (
      <div>
        <div>
          <span className={C.yellow}>{pad('email', 10)}</span>
          <Link href={`mailto:${portfolio.email}`}>{portfolio.email}</Link>
        </div>
        <div>
          <span className={C.yellow}>{pad('linkedin', 10)}</span>
          <Link href={portfolio.linkedin}>{portfolio.linkedin.replace('https://www.', '')}</Link>
        </div>
        <div>
          <span className={C.yellow}>{pad('github', 10)}</span>
          <Link href={portfolio.github}>{portfolio.github.replace('https://', '')}</Link>
        </div>
        <div>
          <span className={C.yellow}>{pad('location', 10)}</span>
          {portfolio.location} ({portfolio.timezoneLabel}) · {portfolio.availability}
        </div>
      </div>
    ),
  },
  github: {
    desc: 'Open the GitHub profile',
    run: () => {
      openApp('safari', { url: portfolio.github })
      return (
        <span>
          Opening <Link href={portfolio.github}>{portfolio.github.replace('https://', '')}</Link> in Safari…
        </span>
      )
    },
  },
  resume: {
    desc: 'Open the resume',
    run: () => {
      openApp('resume')
      return <span className={C.dim}>Opening {portfolio.resumeFileName}…</span>
    },
  },
  neofetch: {
    desc: 'System information',
    run: () => {
      const rows: [string, string][] = [
        ['OS', 'SurajOS 1.0 (React 19 + Vite)'],
        ['Host', `${portfolio.name}`],
        ['Role', `${portfolio.currentRole.position} @ ${portfolio.currentRole.company}`],
        ['Uptime', `${portfolio.yearsOfExperience} years in production`],
        ['Shell', 'zsh-ish (TypeScript)'],
        ['Location', `${portfolio.location} (${portfolio.timezoneLabel})`],
        ['Languages', 'TypeScript, Python, PHP, Go'],
        ['Frontend', 'React, Next.js, Vue.js'],
        ['AI', 'LLMs, IDP, Claude Code, Codex, MCP'],
        ['Projects', `${projects.length} in this portfolio`],
        ['Status', portfolio.availability],
      ]
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <pre className={`${C.cyan} leading-[1.25]`}>{neofetchArt}</pre>
          <div>
            <div>
              <span className={C.green + ' font-bold'}>{portfolio.handle}</span>@<span className={C.green + ' font-bold'}>SurajOS</span>
            </div>
            <div className={C.dim}>{'-'.repeat(portfolio.handle.length + 8)}</div>
            {rows.map(([k, v]) => (
              <div key={k}>
                <span className={C.yellow + ' font-bold'}>{k}</span>: {v}
              </div>
            ))}
            <div className="mt-1.5 flex">
              {['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#e5e7eb'].map((c) => (
                <span key={c} className="h-3.5 w-6" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      )
    },
  },
  date: { desc: 'Print the date', run: () => new Date().toString() },
  echo: { desc: 'Print text', run: (args) => args.join(' ') },
  history: {
    desc: 'Show command history',
    run: (_, ctx) => (
      <div>
        {ctx.history.map((h, i) => (
          <div key={i}>
            <span className={C.dim}>{String(i + 1).padStart(4)}</span> {h}
          </div>
        ))}
      </div>
    ),
  },
  theme: {
    desc: 'Switch appearance: theme light|dark|auto',
    run: (args) => {
      const v = args[0]
      if (v !== 'light' && v !== 'dark' && v !== 'auto') return <span className={C.red}>usage: theme light|dark|auto</span>
      useSettings.getState().set('appearance', v)
      return <span className={C.dim}>Appearance set to {v}.</span>
    },
  },
  wallpaper: {
    desc: 'Change wallpaper: wallpaper <name>',
    run: (args) => {
      const names: WallpaperId[] = ['desk', 'chameleon', 'kathmandu', 'kathmandu-paint', 'liquid', 'aurora', 'himalaya', 'sunset', 'ocean', 'graphite']
      const v = args[0] as WallpaperId
      if (!names.includes(v)) return <span className={C.red}>usage: wallpaper {names.join('|')}</span>
      useSettings.getState().set('wallpaper', v)
      return <span className={C.dim}>Wallpaper set to {v}.</span>
    },
  },
  clear: { desc: 'Clear the screen', run: (_, ctx) => (ctx.clear(), null) },
  exit: { desc: 'Close Terminal', run: (_, ctx) => (ctx.exit(), null) },

  // Easter eggs.
  sudo: {
    desc: 'Run as superuser',
    hidden: true,
    run: (args) => {
      const line = args.join(' ')
      if (line === 'make sandwich' || line === 'make me a sandwich') {
        discover('sandwich')
        return <span className={C.green}>[sudo] Fine. One sandwich, coming up 🥪</span>
      }
      if (args[0] === 'rm') return commands.rm.run(args.slice(1), { cwd: '', setCwd: () => {}, clear: () => {}, exit: () => {}, history: [] })
      if (line === 'hire-me' || line === 'hire suraj' || line === `hire ${portfolio.firstName.toLowerCase()}`) {
        openApp('contact')
        discover('hire')
        useDesktop.getState().pushNotification({ id: 'sudo', app: 'contact', title: 'Permission granted', body: 'Opening Contact. Suraj is open to remote roles.' })
        return <span className={C.green}>[sudo] access granted. Opening Contact…</span>
      }
      return (
        <span>
          <span className={C.red}>{portfolio.handle} is not in the sudoers file.</span> <span className={C.dim}>This incident will be reported. (Hint: try `sudo hire-me`.)</span>
        </span>
      )
    },
  },
  momo: {
    desc: 'Secret',
    hidden: true,
    run: () => (
      discover('momo'),
      <div>
        <pre className={`${C.yellow} leading-[1.2]`}>{momoArt}</pre>
        <div className="text-white/80">You found the secret command. Kathmandu runs on momo: steamed, fried or jhol, with achar on the side.</div>
        <div className={C.dim}>Ask Suraj where the best ones are.</div>
      </div>
    ),
  },
  hello: {
    desc: 'Say hi',
    hidden: true,
    run: (args) => {
      if (args[0]?.toLowerCase().replace(/[^a-z]/g, '') === 'world') {
        discover('helloworld')
        return (
          <div>
            <div className={C.green}>Hello, World!</div>
            <div className={C.dim}>Every programmer’s first program. Everything since has been a longer version of it.</div>
          </div>
        )
      }
      return `Hello! Namaste 🙏 Type \`help\` to look around.`
    },
  },
  hi: { desc: 'Say hi', hidden: true, run: () => `Hi there! Namaste 🙏 Type \`help\` to look around.` },
  rm: {
    desc: 'Remove files',
    hidden: true,
    run: (args) => {
      // Everyone tries it eventually.
      if (args.some((a) => /^-[a-z]*r[a-z]*f|^-[a-z]*f[a-z]*r/i.test(a)) && args.some((a) => a === '/' || a === '/*' || a === '~')) {
        setTimeout(() => {
          playEffect('panic')
          discover('panic')
        }, 600)
        return <span className={C.red}>Deleting everything…</span>
      }
      return <span className={C.yellow}>rm: this portfolio is read-only. Nothing was harmed.</span>
    },
  },
  matrix: {
    desc: 'Green rain',
    hidden: true,
    run: () => {
      playEffect('matrix')
      discover('matrix')
      return <span className={C.green}>Entering the code rain… click or press Escape to come back.</span>
    },
  },
  coffee: {
    desc: 'Brew coffee',
    hidden: true,
    run: () => (
      discover('coffee'),
      <div>
        <pre className={`${C.yellow} leading-[1.2]`}>{coffeeArt}</pre>
        <div className="text-white/80">Brewing… done. Productivity +20%, patience +5%.</div>
        <div className={C.dim}>Refills are free. Type `coffee` again whenever you need one.</div>
      </div>
    ),
  },
  eggs: {
    desc: 'Easter egg hints',
    run: () => {
      const found = useEggs.getState().found as string[]
      return (
        <div>
          <div className={C.bold}>
            Easter eggs: {found.length} of {eggs.length} found
          </div>
          {eggs.map((e) => (
            <div key={e.id}>
              {found.includes(e.id) ? <span className={C.green}>✓ {e.title}</span> : <span className={C.dim}>? {e.hint}</span>}
            </div>
          ))}
        </div>
      )
    },
  },
  vim: { desc: 'Editor', hidden: true, run: () => <span className={C.dim}>You are now in vim. Many enter; few leave. (Hint: there is a way out.)</span> },
  ':q': { desc: 'Quit vim', hidden: true, run: () => (discover('vim'), <span className={C.green}>You escaped vim. Few can say the same.</span>) },
  ':wq': { desc: 'Quit vim', hidden: true, run: () => (discover('vim'), <span className={C.green}>Saved and escaped vim. Textbook.</span>) },
  ':q!': { desc: 'Quit vim', hidden: true, run: () => (discover('vim'), <span className={C.green}>Escaped vim without saving. Bold.</span>) },
  tea: { desc: 'Make tea', hidden: true, run: () => (discover('tea'), <span>☕ Chiya’s ready: milk, sugar, a little ginger, served in a small glass. <span className={C.dim}>The other national drink of software.</span></span>) },
  chiya: { desc: 'Make tea', hidden: true, run: () => (discover('tea'), <span>☕ Chiya’s ready: milk, sugar, a little ginger, served in a small glass.</span>) },
  ping: { desc: 'Ping', hidden: true, run: () => (discover('ping'), <div><div>PING surajos.local: 64 bytes, time=0.042 ms</div><div className={C.green}>pong 🏓</div></div>) },
  fortune: { desc: 'Fortune', hidden: true, run: () => (discover('fortune'), <span className={C.magenta}>{pick(fortunes)}</span>) },
  flip: { desc: 'Flip a coin', hidden: true, run: () => (discover('flip'), <span>🪙 {Math.random() < 0.5 ? 'Heads' : 'Tails'}.</span>) },
  roll: { desc: 'Roll a die', hidden: true, run: () => { discover('roll'); const n = Math.floor(Math.random() * 6); return <span><span className="text-[22px] leading-none">{'⚀⚁⚂⚃⚄⚅'[n]}</span> You rolled a {n + 1}.</span> } },
  '8ball': {
    desc: 'Magic 8ball',
    hidden: true,
    run: (args) => {
      if (!args.length) return <span className={C.dim}>Ask it something: 8ball will this deploy work?</span>
      discover('eightball')
      return <span>🎱 <span className={C.cyan}>{pick(eightBall)}</span></span>
    },
  },
  weather: { desc: 'Weather', hidden: true, run: () => (discover('weather'), <span>⛅ {portfolio.location.split(',')[0]}: clear skies over the code, 100% chance of shipping.</span>) },
  uptime: { desc: 'Uptime', hidden: true, run: () => (discover('uptime'), careerUptime()) },
  git: {
    desc: 'Git',
    hidden: true,
    run: (args) => {
      const line = args.join(' ')
      if (args[0] === 'blame') {
        discover('blame')
        return <span>git blame: every line was written by… <span className={C.yellow}>you</span>. It’s always you.</span>
      }
      if (args[0] === 'push' && args.some((a) => a === '-f' || a === '--force')) {
        discover('force')
        shake()
        return <span className={C.red}>Whoa. Not on main. Try --force-with-lease, and tell the team first.</span>
      }
      if (args[0] === 'status') return <span className={C.dim}>On branch main. Nothing to commit, working tree clean. Unlike most days.</span>
      return <span className={C.dim}>git {line}: this repo lives on GitHub. Try `github`, or `git blame`.</span>
    },
  },
  make: {
    desc: 'Make',
    hidden: true,
    run: (args) => (args.join(' ').includes('sandwich') ? <span className={C.red}>make: *** No rule to make target 'sandwich'. Make it yourself. (Unless you are root.)</span> : <span className={C.dim}>make: nothing to be done.</span>),
  },
  npm: {
    desc: 'npm',
    hidden: true,
    run: (args) => {
      if (args[0] !== 'install' && args[0] !== 'i') return <span className={C.dim}>npm: try `npm install`. If you dare.</span>
      discover('npm')
      return (
        <div>
          <div className={C.dim}>⠋ resolving dependencies… fetching the internet…</div>
          <div>added 1,384 packages in 42s</div>
          <div className={C.yellow}>312 packages are looking for funding. 3 of them are actually used.</div>
        </div>
      )
    },
  },
  docker: { desc: 'Docker', hidden: true, run: () => (discover('docker'), <span>🐳 It works in my container, so it works everywhere. Probably.</span>) },
  python: { desc: 'Python', hidden: true, run: () => (discover('python'), <div><div className={C.dim}>Python 3 on SurajOS</div><div>&gt;&gt;&gt; print("hiss")</div><div>hiss 🐍</div></div>) },
  python3: { desc: 'Python', hidden: true, run: () => (discover('python'), <div><div>&gt;&gt;&gt; print("hiss")</div><div>hiss 🐍</div></div>) },
  namaste: { desc: 'Namaste', hidden: true, run: () => (discover('namaste'), <span>🙏 Namaste! Tapailai kasto chha? <span className={C.dim}>(How are you?)</span></span>) },
  dalbhat: { desc: 'Dal bhat', hidden: true, run: () => (discover('dalbhat'), <span>🍛 Dal bhat power, 24 hour. <span className={C.dim}>Lentils, rice, curry and pickle, twice a day, refills included.</span></span>) },
  everest: {
    desc: 'Everest',
    hidden: true,
    run: () => (
      discover('everest'),
      <div>
        <pre className="leading-[1.2] text-white">{everestArt}</pre>
        <div>Sagarmatha · 8,849 m above sea level. <span className={C.dim}>Base camp is a long walk from here.</span></div>
      </div>
    ),
  },
  hack: {
    desc: 'Hack',
    hidden: true,
    run: () => (
      discover('hack'),
      <div className={C.green}>
        <div>Bypassing the firewall… done</div>
        <div>Decrypting the mainframe… done</div>
        <div>Downloading more RAM… done</div>
        <div className="text-white">Access granted. You are looking at a portfolio. That’s all there is. 😄</div>
      </div>
    ),
  },
  sl: { desc: 'Train', hidden: true, run: () => (discover('train'), <div><pre className={`${C.cyan} leading-[1.15]`}>{trainArt}</pre><div className={C.dim}>Choo choo. You meant `ls`.</div></div>) },
  xyzzy: { desc: 'Magic word', hidden: true, run: () => (discover('xyzzy'), <span>Nothing happens. <span className={C.dim}>(A magic word from Colossal Cave Adventure, 1976.)</span></span>) },
  please: {
    desc: 'Manners',
    hidden: true,
    run: () => {
      discover('please')
      const left = eggs.filter((e) => !(useEggs.getState().found as string[]).includes(e.id))
      return left.length ? <span>Since you asked nicely, a hint: <span className={C.cyan}>{pick(left).hint}</span></span> : <span className={C.green}>You have found everything. Thank you for being so polite.</span>
    },
  },
  selfdestruct: {
    desc: 'Self-destruct',
    hidden: true,
    run: () => {
      discover('selfdestruct')
      setTimeout(() => {
        shake()
        playEffect('confetti')
      }, 2500)
      return <span className={C.red}>Self-destruct in 3… 2… 1…</span>
    },
  },
  party: { desc: 'Party', hidden: true, run: () => (discover('party'), playEffect('confetti'), <span>🎉 Party!</span>) },
  snow: { desc: 'Snow', hidden: true, run: () => (discover('snow'), playEffect('snow'), <span>❄️ Let it snow. Click or press Escape to stop.</span>) },
  disco: { desc: 'Disco', hidden: true, run: () => (discover('disco'), disco(), <span className={C.magenta}>🪩 Disco mode on.</span>) },
  'upside-down': { desc: 'Flip the screen', hidden: true, run: () => (discover('upsidedown'), upsideDown(), <span>🙃 Hold on to something.</span>) },
}

export const commandNames = Object.keys(commands)

/** Split respecting quotes: open 'Resume.pdf' → ['open', 'Resume.pdf']. */
export function tokenize(line: string): string[] {
  const out: string[] = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3])
  return out
}

/** Tab completion for the command name or a path argument. */
export function complete(line: string, cwd: string): string | null {
  const endsWithSpace = /\s$/.test(line)
  const tokens = tokenize(line)
  if (tokens.length <= 1 && !endsWithSpace) {
    const prefix = tokens[0] ?? ''
    const hits = commandNames.filter((c) => c.startsWith(prefix) && !commands[c].hidden)
    return hits.length === 1 ? hits[0] + ' ' : null
  }
  const last = endsWithSpace ? '' : tokens[tokens.length - 1]
  const slash = last.lastIndexOf('/')
  const dirPart = slash >= 0 ? last.slice(0, slash + 1) : ''
  const namePart = slash >= 0 ? last.slice(slash + 1) : last
  const dir = dirPart ? fs.resolve(cwd, dirPart) : fs.get(cwd)
  if (!dir || dir.kind !== 'folder') return null
  const hits = fs.children(dir.id).filter((c) => c.name.toLowerCase().startsWith(namePart.toLowerCase()))
  if (hits.length !== 1) return null
  const n = hits[0]
  const completed = dirPart + n.name + (n.kind === 'folder' ? '/' : '')
  const quoted = completed.includes(' ') ? `'${completed}'` : completed
  const base = endsWithSpace ? line : line.slice(0, line.length - (line.length - line.lastIndexOf(last)))
  return base + quoted + (n.kind === 'folder' ? '' : ' ')
}
