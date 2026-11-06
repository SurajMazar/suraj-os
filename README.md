# SurajOS

The portfolio of **Suraj Thapa**, Senior Full Stack Engineer and AI & LLM Product Engineer, built as a desktop you can explore in the browser.

Open apps from the Dock, drag and snap windows, minimize them into the Dock, search everything with Spotlight, see every window in Mission Control, and poke around in Terminal. On a phone it becomes a home screen with full-screen apps.

## What's inside

- **Window manager**: drag, resize from every edge, snap to halves or full screen, minimize into the Dock, zoom, stacking and focus, all in one Zustand store.
- **Apps**: Finder, About Me, Projects, Experience, Skills, Resume (a PDF viewer built on pdf.js), Terminal, Safari, Contact, System Settings, Trash.
- **Arcade**: six original games with best scores kept in the browser: Ship It (a platformer where a developer runs to the launch pad, collecting commits and stomping bugs), Block Drop (falling blocks), Byte Snake, Bug Hunt (a logic puzzle), Stack Match (memory pairs of the CV's skills) and Type Sprint (typing speed with words from the stack). Keyboard and touch controls; a game pauses when its window loses focus.
- **System**: menu bar with working menus, Spotlight, Launchpad, Mission Control and App Exposé, Control Center, Notification Center, Quick Look, an app switcher, context menus, lock, sleep, restart and shut down.
- **Easter eggs**: 62 hidden secrets across Terminal, Spotlight, the Trash, the Arcade, the desktop and the menus, with a found counter. Type `eggs` in Terminal for hints, or `please` for a free one.
- **Three layouts**: desktop, tablet (windows open nearly full width, the Dock shrinks to fit) and iPhone (home screen, apps that zoom out of their icon, a swipe-up home bar, drill-down lists, Back returns home).
- **Sound**: original system sounds synthesized with the Web Audio API, previewable in Settings.
- **Live data**: the GitHub widget and the Safari GitHub page read the public GitHub API.

## Keyboard shortcuts

Browsers and operating systems reserve several macOS shortcuts, so SurajOS adds Option (Alt) versions.

| Action | Shortcut |
| --- | --- |
| Spotlight | ⌘K or Ctrl+Space |
| App switcher | ⌥Tab or Alt+\` |
| Close / minimize window | ⌥W / ⌥M |
| Quit app | ⌥Q |
| System Settings | ⌥, |
| Mission Control / App Exposé | ⌥↑ / ⌥↓ (Ctrl+↑ / Ctrl+↓ where allowed) |
| Launchpad | ⌥L |
| Quick Look | Space |

## Run it

```bash
npm install
npm run dev
```

```bash
npm run build
npm run test:e2e
```

The Playwright suite opens and closes every app, drags windows, checks Spotlight, Mission Control, Terminal, the contact form and every Arcade game, walks the iPhone flows, and checks for sideways overflow at 11 viewport sizes from 320px to 2560px.

## Make it yours

All personal content lives in [`src/portfolio.config.ts`](src/portfolio.config.ts): profile, experience, projects, skills and notifications. The profile photo and resume are in `public/`.

**Contact form.** Set `VITE_CONTACT_ENDPOINT` to a form endpoint that accepts a JSON POST (for example a Formspree form URL). Without it, the form opens the visitor's email app with the message filled in; it never claims to have sent anything. For GitHub Pages, add it as a repository variable.

**Sounds.** The built-in sounds are synthesized. To use recorded sounds you have the rights to publish, put them in `public/sounds/` and map them in `soundFiles` in the config.

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`). Turn on Pages with **Settings → Pages → Source: GitHub Actions**.

## Credits

- **Desk** wallpaper (day and night versions): anime redraws of Suraj's own desk, made with ChatGPT image generation.
- **Chameleon Reserve** wallpaper: artwork by **Craizuss**. All rights belong to the artist.
- **Kathmandu** wallpapers: generated with ChatGPT image generation for this site.
- System sounds are original, synthesized in the browser.

Built with React 19, TypeScript, Vite, Tailwind CSS 4, Motion, Zustand and pdf.js. Inspired by macOS; not affiliated with Apple.
