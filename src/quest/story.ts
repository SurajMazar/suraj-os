import { experience, portfolio, projects } from '@/portfolio.config'
import type { AppId } from '@/types'

/*
 * Lost Bit: an original desktop adventure written for SurajOS.
 *
 * Bit is the little helper program that lives in this computer. A careless
 * update broke its memory into six fragments, and each one turns out to be a
 * chapter of the owner's story. Every fact Bit remembers comes from
 * portfolio.config.ts (the CV); the story around it is fiction.
 */

export type Mood = 'neutral' | 'happy' | 'sad' | 'surprised' | 'glitch' | 'thinking'

export interface Line {
  text: string
  mood?: Mood
}

export interface Chapter {
  id: string
  title: string
  /** What the visitor is asked to do, shown in the journal and on Bit's hint. */
  objective: string
  /** The app Bit flies to and points at. */
  app: AppId
  /** The event that completes the chapter. */
  event: string
  intro: Line[]
  outro: (data?: string) => Line[]
  fragment: { title: string; text: string }
}

const first = [...experience].sort((a, b) => new Date(`1 ${a.start}`).getTime() - new Date(`1 ${b.start}`).getTime())[0]
const name = portfolio.firstName
const delivered = portfolio.stats.find((s) => /project/i.test(s.label))?.value ?? `${projects.length}`
const guardrail = portfolio.principles.find((p) => /overwrite/i.test(p.title))

export const prologue: Line[] = [
  { text: '…h-hello? Is somebody there?', mood: 'glitch' },
  { text: 'Oh! A cursor! You can see me?', mood: 'surprised' },
  { text: 'I’m Bit, the little helper who lives in this computer. I don’t even remember why I look like this.', mood: 'neutral' },
  { text: 'There was an update. Everything went bzzzt, and my memory broke into seven pieces.', mood: 'sad' },
  { text: 'I can feel them hiding in the apps around here. Will you help me find them?', mood: 'thinking' },
]

export const chapters: Chapter[] = [
  {
    id: 'builder',
    title: 'A face I know',
    objective: 'Open About Me',
    app: 'about',
    event: 'open:about',
    intro: [{ text: 'There’s a face in the Dock, the round one. It feels important. Can you open it?', mood: 'thinking' }],
    outro: () => [
      { text: `${portfolio.name}. ${portfolio.title}.`, mood: 'surprised' },
      { text: `${name} built this whole computer, from ${portfolio.location}. And ${name} built me.`, mood: 'happy' },
      { text: 'Hold on… the glasses, the messy hair, the headphones. That’s my face! I’m a mini version of my builder.', mood: 'surprised' },
      { text: 'One piece back. I remember who made me!', mood: 'happy' },
    ],
    fragment: { title: 'The builder', text: portfolio.summary },
  },
  {
    id: 'road',
    title: 'The road here',
    objective: 'Open Experience',
    app: 'experience',
    event: 'open:experience',
    intro: [{ text: 'The next piece feels like… a long road. Lots of stops. The briefcase in the Dock?', mood: 'thinking' }],
    outro: () => [
      { text: `${experience.length} stops. It started at ${first.company}, back in ${first.start}.`, mood: 'surprised' },
      { text: `Now it’s ${portfolio.currentRole.company}, as ${portfolio.currentRole.position}.`, mood: 'neutral' },
      { text: `${portfolio.yearsOfExperience} years of road. No wonder I got lost.`, mood: 'happy' },
    ],
    fragment: {
      title: 'The road',
      text: `From ${first.company} (${first.start}) to ${portfolio.currentRole.company} today: ${experience.length} teams and ${portfolio.yearsOfExperience} years of building for the web.`,
    },
  },
  {
    id: 'work',
    title: 'Things we made',
    objective: 'Open any project in Projects',
    app: 'projects',
    event: 'project',
    intro: [{ text: 'I keep picturing little cards, each one something that got built. Open Projects and pick one?', mood: 'thinking' }],
    outro: (id) => {
      const p = projects.find((x) => x.id === id)
      return [
        p ? { text: `${p.name}: ${p.tagline}. I remember this one!`, mood: 'surprised' } : { text: 'I remember these!', mood: 'surprised' },
        { text: `There are ${projects.length} in this archive, and the CV says ${delivered} projects delivered over the years.`, mood: 'happy' },
        { text: 'Three pieces. I’m starting to feel like myself.', mood: 'happy' },
      ]
    },
    fragment: { title: 'The work', text: `${projects.length} projects in the archive and ${delivered} delivered in all, from AI review tools to open-source CLIs.` },
  },
  {
    id: 'voice',
    title: 'A voice in the dark',
    objective: 'In Terminal, type whoami',
    app: 'terminal',
    event: 'cmd:whoami',
    intro: [
      { text: 'I remember a black window where people talk to the computer in short words.', mood: 'thinking' },
      { text: 'Someone kept asking it one question: whoami. Can you ask it for me?', mood: 'neutral' },
    ],
    outro: () => [
      { text: 'It answered! So even computers ask who they are sometimes.', mood: 'surprised' },
      { text: 'That makes me feel a lot less silly.', mood: 'happy' },
    ],
    fragment: { title: 'The voice', text: `${portfolio.title}, ${portfolio.subtitle}. ${portfolio.about[1] ?? ''}`.trim() },
  },
  {
    id: 'accident',
    title: 'Thrown away',
    objective: 'Find memory.frag in the Trash',
    app: 'trash',
    event: 'trash:fragment',
    intro: [{ text: 'My scanner says the next piece is somewhere… cold. And full of node_modules.', mood: 'thinking' }],
    outro: () => [
      { text: 'memory.frag! That’s mine!', mood: 'surprised' },
      { text: 'Now I remember. The update was a big clean-up, and I got marked as unused code… and dragged to the Trash.', mood: 'sad' },
      { text: guardrail ? `Which is why ${name} believes in this: “${guardrail.body}”` : 'Lesson learned: always look before you delete.', mood: 'neutral' },
    ],
    fragment: {
      title: 'The accident',
      text: `In the clean-up, Bit was mistaken for dead code and thrown away. ${guardrail ? `${guardrail.title}: ${guardrail.body}` : 'Always look before you delete.'}`,
    },
  },
  {
    id: 'record',
    title: 'Everything on paper',
    objective: 'Open the Resume',
    app: 'resume',
    event: 'open:resume',
    intro: [{ text: 'The last piece of the past is written down somewhere. On paper. The red document in the Dock!', mood: 'thinking' }],
    outro: () => [
      { text: 'It’s all here, every piece written down in one place.', mood: 'happy' },
      { text: `${portfolio.education.degree}, ${portfolio.education.school}, ${portfolio.education.year}.`, mood: 'neutral' },
      { text: `Speaks ${portfolio.languages.map((l) => l.split(' (')[0]).join(' and ')}. I only speak binary. And a little emoji.`, mood: 'happy' },
    ],
    fragment: { title: 'The record', text: `${portfolio.education.degree} from ${portfolio.education.school} (${portfolio.education.year}). Languages: ${portfolio.languages.join(', ')}.` },
  },
  {
    id: 'purpose',
    title: 'Why I run',
    objective: 'Open Contact',
    app: 'contact',
    event: 'open:contact',
    intro: [
      { text: 'I remember everything now. Except… why I was made.', mood: 'thinking' },
      { text: 'Every helper has a job. I think mine is in the last app, the one with the envelope.', mood: 'neutral' },
    ],
    outro: () => [
      { text: `Of course. I was made to introduce ${name} to people. People like you!`, mood: 'happy' },
      { text: `${name} is ${portfolio.availability.toLowerCase()}. If you liked this place, say hello.`, mood: 'happy' },
      { text: 'Thank you for finding me. I’ll hang around the desktop. Click me any time.', mood: 'happy' },
    ],
    fragment: { title: 'The purpose', text: `To introduce ${portfolio.name} to people worth meeting. ${portfolio.availability}: ${portfolio.email}.` },
  },
]

/** Things Bit says when clicked after the story is over, all drawn from the CV. */
export const companionLines: Line[] = [
  ...portfolio.currentlyWorkingOn.map((w) => ({ text: `${name} is working on ${w.charAt(0).toLowerCase()}${w.slice(1)}.`, mood: 'neutral' as Mood })),
  ...portfolio.stats.map((s) => ({ text: `Fun fact: ${s.value} ${s.label}.`, mood: 'happy' as Mood })),
  ...portfolio.principles.map((p) => ({ text: `${name}’s rule: ${p.title.toLowerCase()}. ${p.body}`, mood: 'thinking' as Mood })),
  { text: 'Psst. There are Easter eggs everywhere. Try typing `eggs` in Terminal.', mood: 'happy' },
]

/** One-off remarks when the visitor opens an app the story isn’t asking for. */
export const asides: Partial<Record<AppId, Line>> = {
  arcade: { text: 'Games! Ship It is my favourite. Don’t tell the others.', mood: 'happy' },
  settings: { text: 'Careful in there. That’s where my wallpaper lives.', mood: 'surprised' },
  safari: { text: 'The internet! Don’t let me wander off in there.', mood: 'surprised' },
  skills: { text: `So many skills. I can do one: being round.`, mood: 'happy' },
  finder: { text: 'Files and folders. I used to know where everything was.', mood: 'thinking' },
  calendar: { text: 'Is it my birthday? I don’t remember my birthday.', mood: 'thinking' },
  player: { text: 'Oh no. Not this video.', mood: 'surprised' },
}
