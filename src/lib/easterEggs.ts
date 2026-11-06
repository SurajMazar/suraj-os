import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useDesktop } from '@/store/desktopStore'
import { portfolio } from '@/portfolio.config'

/**
 * Every secret in SurajOS. Each has a title shown when it is found and a hint
 * the Terminal's `eggs` command shows until then. Where each one is triggered
 * is noted beside it.
 */
export const eggs = [
  // Around the desktop
  { id: 'spicy', title: 'Spicy', hint: 'Somebody threw away a video. Check the bin.' },
  { id: 'konami', title: 'Cheat code', hint: 'An old console cheat, typed on the desktop: ↑ ↑ ↓ ↓ ← → ← → B A.' },
  { id: 'developer', title: 'Developer mode', hint: 'Click the logo in About This Mac. Then keep clicking.' },
  { id: 'secret', title: 'Shh', hint: 'Type the word “secret” on the desktop. Not in a text box, just type.' },
  { id: 'name', title: 'Say my name', hint: 'Type the owner’s first name on the desktop.' },
  { id: 'cleanslate', title: 'Clean slate', hint: 'Take out the trash.' },
  { id: 'restart', title: 'Off and on again', hint: 'The oldest fix in IT, from the menu.' },
  { id: 'loud', title: 'Turn it up', hint: 'Every volume knob goes to 100 at some point.' },
  { id: 'explorer', title: 'Explorer', hint: 'Open every app in the Dock at least once.' },
  { id: 'multitasker', title: 'Multitasker', hint: 'Have eight windows open at the same time.' },
  { id: 'decorator', title: 'Interior designer', hint: 'Change the wallpaper five times.' },
  { id: 'nightowl', title: 'Night owl', hint: 'Visit between midnight and 5 a.m.' },
  { id: 'weekend', title: 'Weekend warrior', hint: 'Visit on a Saturday or Sunday.' },
  // Spotlight
  { id: 'barrel', title: 'Barrel roll', hint: 'Ask Spotlight to do a barrel roll.' },
  { id: 'askew', title: 'Askew', hint: 'Search Spotlight for a word that means slightly crooked.' },
  { id: 'recursion', title: 'Recursion', hint: 'Search Spotlight for recursion.' },
  { id: 'best', title: 'Humble brag', hint: 'Ask Spotlight who the best developer is.' },
  // The Trash
  { id: 'node_modules', title: 'Heaviest object in the universe', hint: 'Open node_modules in the Trash.' },
  { id: 'psd', title: 'Final final', hint: 'Open the design file in the Trash that was definitely final.' },
  { id: 'todo', title: 'Procrastinator', hint: 'Open the to-do list in the Trash.' },
  { id: 'myMachine', title: 'Works on my machine', hint: 'Run the shell script in the Trash.' },
  { id: 'consolelog', title: 'Debugger', hint: 'Open the classic debugging file in the Trash.' },
  { id: 'untitled', title: 'Folder (7)', hint: 'Open the untitled folder in the Trash.' },
  // Arcade
  { id: 'shipped', title: 'Shipped to production', hint: 'Reach the launch pad in Ship It.' },
  { id: 'tetra', title: 'Four at once', hint: 'Clear four rows with one piece in Block Drop.' },
  { id: 'longsnake', title: 'Long boi', hint: 'Score 30 in Byte Snake.' },
  { id: 'exterminator', title: 'Exterminator', hint: 'Clear a Bug Hunt board.' },
  { id: 'memory', title: 'Photographic memory', hint: 'Finish Stack Match in 12 moves or fewer.' },
  { id: 'fingers', title: 'Fast fingers', hint: 'Type 60 words a minute in Type Sprint.' },
  // Terminal
  { id: 'hire', title: 'Root access', hint: 'Ask Terminal for superuser rights to hire.' },
  { id: 'momo', title: 'Momo', hint: 'Kathmandu’s favourite dumpling, typed in Terminal.' },
  { id: 'coffee', title: 'Fuel', hint: 'Every engineer’s first command of the day.' },
  { id: 'tea', title: 'Chiya break', hint: 'Coffee’s rival, in Terminal.' },
  { id: 'matrix', title: 'Green rain', hint: 'There’s a Terminal command for green falling code.' },
  { id: 'panic', title: 'Living dangerously', hint: 'The most dangerous command there is. Go on, Terminal can take it.' },
  { id: 'ping', title: 'Pong', hint: 'Check if the network is up.' },
  { id: 'fortune', title: 'Fortune teller', hint: 'Ask Terminal for your fortune.' },
  { id: 'flip', title: 'Heads or tails', hint: 'Flip a coin in Terminal.' },
  { id: 'roll', title: 'Dice roller', hint: 'Roll a die in Terminal.' },
  { id: 'eightball', title: 'The oracle', hint: 'Ask the magic 8ball a question.' },
  { id: 'weather', title: 'Forecast', hint: 'Check the weather from Terminal.' },
  { id: 'uptime', title: 'Uptime', hint: 'How long has this engineer been running?' },
  { id: 'blame', title: 'It was you', hint: 'Ask git who broke it.' },
  { id: 'force', title: 'Force push', hint: 'Push to git, with force.' },
  { id: 'sandwich', title: 'Sandwich', hint: 'Ask Terminal to make you a sandwich. Then ask with authority.' },
  { id: 'vim', title: 'Escaped vim', hint: 'Quit vim the way vim wants you to.' },
  { id: 'helloworld', title: 'First program', hint: 'Every programmer’s first two words.' },
  { id: 'npm', title: 'Dependency hell', hint: 'Install the packages.' },
  { id: 'docker', title: 'Containerised', hint: 'Run something in Docker.' },
  { id: 'python', title: 'Hiss', hint: 'Start a Python shell.' },
  { id: 'namaste', title: 'Namaste', hint: 'Greet Terminal the Nepali way.' },
  { id: 'dalbhat', title: 'Dal bhat power', hint: 'Nepal’s everyday meal, typed in Terminal.' },
  { id: 'everest', title: 'Top of the world', hint: 'The tallest mountain, typed in Terminal.' },
  { id: 'hack', title: 'Hacker', hint: 'Every film’s favourite Terminal command.' },
  { id: 'train', title: 'All aboard', hint: 'A typo of `ls` that some terminals turn into a train.' },
  { id: 'xyzzy', title: 'Magic word', hint: 'A magic word from the first text adventure.' },
  { id: 'please', title: 'Manners', hint: 'Say the magic word to Terminal.' },
  { id: 'selfdestruct', title: 'Self-destruct', hint: 'Every spaceship has a self-destruct command.' },
  { id: 'party', title: 'Party time', hint: 'Throw a party from Terminal.' },
  { id: 'snow', title: 'Let it snow', hint: 'Make it snow from Terminal.' },
  { id: 'disco', title: 'Disco', hint: 'Turn on the disco lights.' },
  { id: 'upsidedown', title: 'Upside down', hint: 'Turn the whole screen upside down from Terminal.' },
] as const

export type EggId = (typeof eggs)[number]['id']

interface EggStore {
  found: EggId[]
  discover: (id: EggId) => void
  reset: () => void
}

export const useEggs = create<EggStore>()(
  persist(
    (set, get) => ({
      found: [],
      discover: (id) => {
        if (get().found.includes(id)) return
        const found = [...get().found, id]
        set({ found })
        const egg = eggs.find((e) => e.id === id)!
        const all = found.length === eggs.length
        useDesktop.getState().pushNotification({
          id: `egg-${id}`,
          app: 'terminal',
          title: all ? 'Every Easter egg found!' : `Easter egg found: ${egg.title}`,
          body: all ? `All ${eggs.length} secrets. ${portfolio.firstName} would love to hear from you.` : `${found.length} of ${eggs.length}. Type \`eggs\` in Terminal for hints to the rest.`,
        })
        if (all) setTimeout(() => playEffect('confetti'), 400)
      },
      reset: () => set({ found: [] }),
    }),
    { name: 'surajos-eggs', version: 1 },
  ),
)

export const discover = (id: EggId) => useEggs.getState().discover(id)

/** Full-screen effects some eggs set off. */
export type Effect = 'confetti' | 'matrix' | 'panic' | 'snow' | null

interface EffectStore {
  effect: Effect
  key: number
  play: (e: Exclude<Effect, null>) => void
  stop: () => void
}

export const useEffects = create<EffectStore>((set) => ({
  effect: null,
  key: 0,
  play: (effect) => set((s) => ({ effect, key: s.key + 1 })),
  stop: () => set({ effect: null }),
}))

export const playEffect = (e: Exclude<Effect, null>) => useEffects.getState().play(e)

/** Moves the whole screen with a Web Animation. Skipped when the visitor asks for less motion. */
function animateRoot(frames: Keyframe[], options: KeyframeAnimationOptions) {
  const root = document.getElementById('root')
  if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  root.animate(frames, options)
}

export const barrelRoll = () => animateRoot([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1400, easing: 'cubic-bezier(.45,0,.2,1)' })
export const askew = () => animateRoot([{ transform: 'rotate(0deg)' }, { transform: 'rotate(1.5deg)', offset: 0.1 }, { transform: 'rotate(1.5deg)', offset: 0.9 }, { transform: 'rotate(0deg)' }], { duration: 6000, easing: 'ease-in-out' })
export const upsideDown = () =>
  animateRoot([{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)', offset: 0.15 }, { transform: 'rotate(180deg)', offset: 0.85 }, { transform: 'rotate(0deg)' }], { duration: 5000, easing: 'ease-in-out' })
export const shake = () =>
  animateRoot(
    [0, -12, 10, -8, 6, -3, 0].map((x) => ({ transform: `translateX(${x}px)` })),
    { duration: 500 },
  )
export const disco = () => animateRoot([{ filter: 'hue-rotate(0deg) saturate(1)' }, { filter: 'hue-rotate(360deg) saturate(2)' }], { duration: 900, iterations: 6 })

/** A hello for anyone who opens the browser's developer tools. */
export function consoleGreeting() {
  console.log(
    `%cHi there 👋%c\nYou opened the console, so you are my kind of person.\nThere are ${eggs.length} Easter eggs hidden in SurajOS; type \`eggs\` in Terminal for hints.\nSay hello: ${portfolio.email}`,
    'font: 700 18px system-ui; color: #a78bfa',
    'font: 13px system-ui; color: inherit',
  )
}
