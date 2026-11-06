/**
 * Every piece of personal content in SurajOS lives in this file.
 * All of it comes from Suraj Thapa's CV (public/Suraj_Thapa_CV.pdf).
 * Edit this file to update the portfolio; no component holds personal data.
 */

export type ProjectCategory =
  | 'AI & Machine Learning'
  | 'Document Automation'
  | 'Full Stack Applications'
  | 'Developer Tools'
  | 'Experiments'

export interface Project {
  id: string
  name: string
  tagline: string
  description: string
  category: ProjectCategory
  /** Work projects are client or employer products; open source ones are on GitHub. */
  kind: 'work' | 'open-source'
  tech: string[]
  role: string
  /** Only what the CV states. Left empty when the CV says nothing. */
  highlights: string[]
  impact?: string[]
  github?: string
  live?: string
  /** Visual theme for the generated thumbnail. */
  theme: { from: string; to: string; accent: string }
  /** Which mock preview the thumbnail draws. */
  preview: 'sheet' | 'terminal' | 'code' | 'video' | 'calendar' | 'search' | 'player' | 'review' | 'diff' | 'map' | 'ballot' | 'shop'
}

export interface Experience {
  id: string
  company: string
  position: string
  start: string
  end: string
  location: string
  companyBlurb?: string
  points: string[]
  tech: string[]
  projects?: string[]
  color: string
}

export interface SkillGroup {
  id: string
  name: string
  skills: string[]
}

export const portfolio = {
  name: 'Suraj Thapa',
  firstName: 'Suraj',
  handle: 'suraj',
  title: 'Senior Full Stack Engineer',
  subtitle: 'AI & LLM Product Engineer',
  location: 'Kathmandu, Nepal',
  timezone: 'Asia/Kathmandu',
  timezoneLabel: 'UTC+5:45',
  availability: 'Open to remote',
  email: 'suraz.mazar@gmail.com',
  github: 'https://github.com/SurajMazar',
  githubUser: 'SurajMazar',
  linkedin: 'https://www.linkedin.com/in/suraj-thapa-586163190',
  resumeUrl: './Suraj_Thapa_CV.pdf',
  resumeFileName: 'Suraj_Thapa_CV.pdf',
  profileImage: './profile.jpg',
  yearsOfExperience: 7,
  currentRole: { position: 'Senior Software Engineer', company: 'Docsumo' },
  currentlyWorkingOn: [
    'LLM-powered features on Docsumo’s intelligent document processing platform',
    'Guardrails for LLM-generated code in the no-code workflow builder',
    'Spreadsheet review tooling and the cell-mapping widget',
  ],
  summary:
    'Senior Full Stack Engineer with 7 years of experience building production web applications with React, TypeScript, Next.js, Node.js and Python, currently shipping LLM-powered features on Docsumo’s AI intelligent document processing (IDP) platform.',
  about: [
    'I build human-in-the-loop interfaces that let people review, correct and trust AI output, plus the guardrails around LLM-generated code.',
    'I work agent-first every day, using Claude Code, Codex, MCP servers and custom agent skills to plan, write, test and review code.',
    'I have led teams of up to 10 engineers and delivered 50+ full stack projects, including the Election Commission Nepal platform. I’m at home working asynchronously on distributed teams.',
  ],
  /** Drawn from what the CV says about how Suraj works. */
  principles: [
    { title: 'Humans stay in the loop', body: 'AI output should be easy to review, correct and approve, so people can trust it.' },
    { title: 'Never silently overwrite', body: 'Regenerated code must not erase a customer’s own logic: track manual edits, show the diff, ask first.' },
    { title: 'Shared components, faster delivery', body: 'A reusable design system keeps products consistent and makes every new feature cheaper.' },
    { title: 'Agent-first engineering', body: 'Coding agents, MCP servers and custom skills are part of planning, writing, testing and review.' },
  ],
  stats: [
    { value: '7', label: 'years building production web apps' },
    { value: '50+', label: 'full stack projects delivered' },
    { value: '10', label: 'engineers led, at most, on one team' },
    { value: '~80%', label: 'less manual data entry for Docsumo clients' },
  ],
  languages: ['English (professional working proficiency)', 'Nepali (native)'],
  education: {
    degree: 'Bachelor of Science in Computer Science and Information Technology (BSc CSIT)',
    school: 'Nepalaya College, Kathmandu, Nepal',
    year: '2021',
  },
}

export const experience: Experience[] = [
  {
    id: 'docsumo',
    company: 'Docsumo',
    position: 'Senior Software Engineer',
    start: 'Jan 2025',
    end: 'Present',
    location: 'Kathmandu, Nepal',
    companyBlurb: 'AI intelligent document processing SaaS',
    color: '#6366f1',
    points: [
      'Lead frontend development of Docsumo’s AI-powered intelligent document processing platform, which enterprise clients use to extract data from invoices, bank statements and other financial documents with ML and LLM models.',
      'Develop Python backend services and REST APIs for the review and workflow features, including document-handling logic for Excel and spreadsheet files, shipping features end to end across frontend and backend.',
      'Built the document review and validation workflows around ML/LLM extraction so users can verify, correct and approve AI output, reducing manual data entry for clients by about 80%.',
      'Shipped LLM product features, including context-aware field extraction and smart auto-suggestions in the review screen.',
      'Designed and built guardrails for LLM-generated code in the no-code workflow builder: manual-edit tracking, diff and merge review, “Edited manually” badges and confirmation dialogs, so regenerating code never silently overwrites a customer’s custom logic.',
      'Built a reusable design system of 50+ React and TypeScript components, cutting feature delivery time by about 40% and keeping the UI consistent across products.',
      'Made the heaviest document views about 60% faster with list virtualization (TanStack Virtual), lazy loading and memoized Redux/Reselect and Zustand selectors.',
      'Built spreadsheet (Excel) review tooling, including a cell-mapping widget that links extracted fields to their source cells.',
      'Use Claude Code and Codex with MCP server integrations daily for agentic code generation, refactoring, debugging and code review; mentor junior engineers on code quality, testing and modular architecture.',
    ],
    tech: ['React', 'TypeScript', 'Python', 'Redux Toolkit', 'Reselect', 'Zustand', 'TanStack Virtual', 'REST APIs', 'Claude Code', 'OpenAI Codex', 'Model Context Protocol (MCP)'],
    projects: ['docsumo-review', 'llm-code-guardrails'],
  },
  {
    id: 'younginnovations',
    company: 'YoungInnovations',
    position: 'Senior Software Engineer I',
    start: 'Aug 2021',
    end: 'Jan 2025',
    location: 'Lalitpur, Nepal',
    companyBlurb: 'Software development company',
    color: '#10b981',
    points: [
      'Promoted from Software Engineer to Senior Software Engineer I; led delivery of 8+ full stack projects with teams of up to 10 developers, from requirements to release.',
      'Owned system architecture for each project: flow and block diagrams, database schemas and API design.',
      'Built the Election Commission Nepal platform (Laravel, React, TypeScript), a multilingual site with a custom CMS that served citizens nationwide during elections.',
      'Architected the Climate Change Toy Model, a geospatial hazard simulation platform (Next.js, AdonisJS, PostgreSQL/PostGIS, Mapbox), including a custom Mapbox GL wrapper for React and raster-to-vector data optimization.',
      'Planned roadmaps and milestones, delegated work, kept stakeholders aligned and led R&D on new product ideas.',
    ],
    tech: ['Laravel', 'React', 'TypeScript', 'Next.js', 'AdonisJS', 'PostgreSQL', 'PostGIS', 'Mapbox'],
    projects: ['election-commission-nepal', 'climate-toy-model'],
  },
  {
    id: 'hyteno',
    company: 'Hyteno',
    position: 'Senior Software Engineer (Part-Time)',
    start: 'Jan 2023',
    end: 'May 2023',
    location: 'Lalitpur, Nepal',
    companyBlurb: 'E-commerce platform',
    color: '#f59e0b',
    points: [
      'Replaced the client’s limited Plentymarkets CMS with a scalable custom e-commerce platform built from scratch.',
      'Built multilingual catalog sync and search/filtering APIs, improving search accuracy by about 35% and lifting engagement and sales.',
      'Delivered an admin dashboard for real-time monitoring and content management (product rankings, blogs, FAQs).',
    ],
    tech: ['REST APIs'],
    projects: ['hyteno-commerce'],
  },
  {
    id: 'ktmlabs',
    company: 'KTM Labs',
    position: 'Software Engineer',
    start: 'Dec 2020',
    end: 'Aug 2021',
    location: 'Kathmandu, Nepal',
    color: '#ec4899',
    points: [
      'Built React single-page applications and shared component codebases; migrated state management to Redux Toolkit for better performance.',
      'Built Laravel REST APIs and the frontend API layer.',
    ],
    tech: ['React', 'Redux Toolkit', 'Laravel', 'REST APIs'],
  },
  {
    id: 'proxy',
    company: 'Proxy Infotech Solutions',
    position: 'Junior Software Engineer (Intern to Junior)',
    start: 'May 2019',
    end: 'Dec 2020',
    location: 'Kathmandu, Nepal',
    color: '#0ea5e9',
    points: ['Developed full stack web applications with Vue.js, Laravel and MySQL, plus custom WordPress themes.'],
    tech: ['Vue.js', 'Laravel', 'MySQL', 'PHP'],
  },
]

export const projects: Project[] = [
  {
    id: 'docsumo-review',
    name: 'Docsumo Review & Validation',
    tagline: 'Human-in-the-loop review for AI document extraction',
    description:
      'Document review and validation workflows around ML/LLM extraction on Docsumo’s intelligent document processing platform, where enterprise clients extract data from invoices, bank statements and other financial documents.',
    category: 'Document Automation',
    kind: 'work',
    tech: ['React', 'TypeScript', 'Python', 'TanStack Virtual', 'Redux Toolkit', 'Reselect', 'Zustand'],
    role: 'Senior Software Engineer, frontend lead',
    highlights: [
      'Review flows that let users verify, correct and approve AI output.',
      'LLM features: context-aware field extraction and smart auto-suggestions in the review screen.',
      'Spreadsheet (Excel) review tooling, including a cell-mapping widget that links extracted fields to their source cells.',
      'List virtualization, lazy loading and memoized selectors for the heaviest document views.',
    ],
    impact: ['About 80% less manual data entry for clients.', 'Heaviest document views about 60% faster.'],
    theme: { from: '#4f46e5', to: '#7c3aed', accent: '#a5b4fc' },
    preview: 'review',
  },
  {
    id: 'llm-code-guardrails',
    name: 'Guardrails for LLM-generated code',
    tagline: 'Regenerating code never silently overwrites custom logic',
    description:
      'Guardrails for LLM-generated code in Docsumo’s no-code workflow builder, so a customer’s hand-written changes survive when code is regenerated.',
    category: 'AI & Machine Learning',
    kind: 'work',
    tech: ['React', 'TypeScript', 'LLM integration'],
    role: 'Designer and builder',
    highlights: [
      'Manual-edit tracking on generated code.',
      'Diff and merge review before changes land.',
      '“Edited manually” badges and confirmation dialogs.',
    ],
    theme: { from: '#0f172a', to: '#334155', accent: '#34d399' },
    preview: 'diff',
  },
  {
    id: 'react-spreadsheet-viewer',
    name: 'React Spreadsheet Viewer',
    tagline: 'Google Sheets-style Excel/CSV viewer for React',
    description:
      'An npm component for viewing and editing Excel/CSV files in a Google Sheets-style UI, with virtualized rendering for 100k+ rows, chart extraction, pivot tables and a formula engine.',
    category: 'Developer Tools',
    kind: 'open-source',
    tech: ['React', 'TypeScript', 'TanStack Virtual', 'Chart.js'],
    role: 'Author',
    highlights: ['Virtualized rendering for 100k+ rows.', 'Chart extraction, pivot tables and a formula engine.'],
    github: 'https://github.com/SurajMazar/react-spreadsheet-viewer',
    live: 'https://react-spreadsheet-viewer.vercel.app',
    theme: { from: '#059669', to: '#10b981', accent: '#d1fae5' },
    preview: 'sheet',
  },
  {
    id: 'trove-cli',
    name: 'Trove CLI',
    tagline: 'One CLI for GitHub, GitLab and Bitbucket',
    description:
      'One CLI for repos, PRs/MRs, issues, pipelines and releases across GitHub, GitLab and Bitbucket, with multi-account support and secure credential storage; shipped via Homebrew.',
    category: 'Developer Tools',
    kind: 'open-source',
    tech: ['Go', 'Cobra'],
    role: 'Author',
    highlights: ['Multi-account support and secure credential storage.', 'Shipped via Homebrew.'],
    github: 'https://github.com/SurajMazar/trove-cli',
    live: 'https://trove-website-six.vercel.app',
    theme: { from: '#111827', to: '#1f2937', accent: '#f59e0b' },
    preview: 'terminal',
  },
  {
    id: 'srz',
    name: 'srz (_assist)',
    tagline: 'Scaffold components and pages from the terminal',
    description:
      'Generates React, Vue, Next.js and Laravel components and pages, with optional TypeScript output; published on npm as srz.',
    category: 'Developer Tools',
    kind: 'open-source',
    tech: ['Node.js', 'npm'],
    role: 'Author',
    highlights: ['Supports React, Vue, Next.js and Laravel.', 'Optional TypeScript output.'],
    github: 'https://github.com/SurajMazar/_assist',
    live: 'https://www.npmjs.com/package/srz',
    theme: { from: '#b91c1c', to: '#ef4444', accent: '#fecaca' },
    preview: 'code',
  },
  {
    id: 'visual-resume',
    name: 'Visual Resume',
    tagline: 'Turn a form into a video resume',
    description: 'Generates a video resume from a form on the fly using programmatic video rendering.',
    category: 'Experiments',
    kind: 'open-source',
    tech: ['Next.js', 'TypeScript', 'Remotion'],
    role: 'Author',
    highlights: ['Programmatic video rendering with Remotion.'],
    github: 'https://github.com/SurajMazar/video-resume',
    live: 'https://visual-resume.vercel.app',
    theme: { from: '#db2777', to: '#9333ea', accent: '#fbcfe8' },
    preview: 'video',
  },
  {
    id: 'nepali-calendar',
    name: 'Nepali Calendar',
    tagline: 'The Bikram Sambat calendar on the web',
    description: 'Web app for the Nepali (Bikram Sambat) calendar.',
    category: 'Experiments',
    kind: 'open-source',
    tech: ['Next.js', 'TypeScript'],
    role: 'Author',
    highlights: [],
    github: 'https://github.com/SurajMazar/nepali-calendar',
    live: 'https://nepali-calendar.vercel.app',
    theme: { from: '#dc2626', to: '#1d4ed8', accent: '#fee2e2' },
    preview: 'calendar',
  },
  {
    id: 'apache-solr-php-sdk',
    name: 'Apache Solr PHP SDK',
    tagline: 'Solr commands, schema, config and models for PHP',
    description: 'Reusable SDK for Solr commands, schema, config and models, extracted from production search work.',
    category: 'Developer Tools',
    kind: 'open-source',
    tech: ['PHP', 'Apache Solr'],
    role: 'Author',
    highlights: ['Extracted from production search work.'],
    github: 'https://github.com/SurajMazar/apache-solr-php-sdk',
    theme: { from: '#c2410c', to: '#f97316', accent: '#ffedd5' },
    preview: 'search',
  },
  {
    id: 'scorm',
    name: 'SCORM Implementation',
    tagline: 'A reference SCORM player in React',
    description: 'Reference implementation of the SCORM e-learning standard with a React SCORM player.',
    category: 'Full Stack Applications',
    kind: 'open-source',
    tech: ['PHP', 'React'],
    role: 'Author',
    highlights: [],
    github: 'https://github.com/SurajMazar/scorm-implementation',
    theme: { from: '#0369a1', to: '#0ea5e9', accent: '#e0f2fe' },
    preview: 'player',
  },
  {
    id: 'election-commission-nepal',
    name: 'Election Commission Nepal',
    tagline: 'Multilingual platform that served citizens nationwide',
    description:
      'A multilingual site with a custom CMS for the Election Commission Nepal that served citizens nationwide during elections. Built at YoungInnovations.',
    category: 'Full Stack Applications',
    kind: 'work',
    tech: ['Laravel', 'React', 'TypeScript'],
    role: 'Built at YoungInnovations',
    highlights: ['Multilingual site with a custom CMS.', 'Served citizens nationwide during elections.'],
    theme: { from: '#1e3a8a', to: '#b91c1c', accent: '#bfdbfe' },
    preview: 'ballot',
  },
  {
    id: 'climate-toy-model',
    name: 'Climate Change Toy Model',
    tagline: 'Geospatial hazard simulation platform',
    description:
      'A geospatial hazard simulation platform, including a custom Mapbox GL wrapper for React and raster-to-vector data optimization. Built at YoungInnovations.',
    category: 'Full Stack Applications',
    kind: 'work',
    tech: ['Next.js', 'AdonisJS', 'PostgreSQL', 'PostGIS', 'Mapbox'],
    role: 'Architect',
    highlights: ['Custom Mapbox GL wrapper for React.', 'Raster-to-vector data optimization.'],
    theme: { from: '#065f46', to: '#0e7490', accent: '#a7f3d0' },
    preview: 'map',
  },
  {
    id: 'hyteno-commerce',
    name: 'Hyteno E-commerce Platform',
    tagline: 'A custom platform that replaced Plentymarkets',
    description:
      'A scalable custom e-commerce platform built from scratch to replace the client’s limited Plentymarkets CMS, with an admin dashboard for real-time monitoring and content management.',
    category: 'Full Stack Applications',
    kind: 'work',
    tech: ['REST APIs'],
    role: 'Senior Software Engineer (part-time)',
    highlights: [
      'Multilingual catalog sync and search/filtering APIs.',
      'Admin dashboard for product rankings, blogs and FAQs.',
    ],
    impact: ['About 35% better search accuracy, lifting engagement and sales.'],
    theme: { from: '#92400e', to: '#d97706', accent: '#fef3c7' },
    preview: 'shop',
  },
]

export const skillGroups: SkillGroup[] = [
  {
    id: 'ai',
    name: 'AI & LLM',
    skills: ['LLM integration', 'Prompt engineering', 'Structured output validation', 'Human-in-the-loop review', 'LLM code generation', 'Intelligent document processing (IDP)', 'OCR'],
  },
  {
    id: 'agentic',
    name: 'Agentic Development',
    skills: ['Claude Code', 'OpenAI Codex', 'AI coding agents', 'Model Context Protocol (MCP)', 'Custom agent skills', 'Agent-assisted code review and testing'],
  },
  {
    id: 'frontend',
    name: 'Frontend',
    skills: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Redux Toolkit', 'Reselect', 'Zustand', 'Vue.js', 'Nuxt.js', 'React Native', 'TanStack Virtual', 'Design systems'],
  },
  {
    id: 'backend',
    name: 'Backend',
    skills: ['Python', 'Django', 'Node.js', 'NestJS', 'Express', 'AdonisJS', 'PHP', 'Laravel', 'REST APIs', 'GraphQL', 'Socket.IO', 'Kafka'],
  },
  {
    id: 'data',
    name: 'Data & Cloud',
    skills: ['PostgreSQL', 'PostGIS', 'MySQL', 'Redis', 'Elasticsearch', 'Apache Solr', 'AWS', 'Microsoft Azure'],
  },
  {
    id: 'devops',
    name: 'DevOps & Tools',
    skills: ['Git', 'GitHub', 'GitLab', 'CI/CD', 'Docker', 'Linux', 'Jira', 'Vercel'],
  },
  {
    id: 'practices',
    name: 'Practices',
    skills: ['System architecture', 'Database design', 'Playwright (E2E)', 'Unit testing', 'Code review', 'Technical leadership', 'Mentoring'],
  },
]

/** One neutral line per skill: what the thing is. Shown when a card is hovered. */
export const skillNotes: Record<string, string> = {
  'LLM integration': 'Wiring large language models into product features and APIs.',
  'Prompt engineering': 'Designing prompts and context so models return useful, consistent output.',
  'Structured output validation': 'Checking model output against a schema before the product trusts it.',
  'Human-in-the-loop review': 'Interfaces where people verify, correct and approve AI output.',
  'LLM code generation': 'Models that write code, and the review tooling around them.',
  'Intelligent document processing (IDP)': 'Extracting structured data from invoices, statements and other documents.',
  OCR: 'Turning scanned or photographed text into machine-readable text.',
  'Claude Code': 'Anthropic’s agentic coding tool, used daily for planning, coding and review.',
  'OpenAI Codex': 'OpenAI’s coding agent, used for generation, refactoring and review.',
  'AI coding agents': 'Agents that plan, write, test and review code alongside engineers.',
  'Model Context Protocol (MCP)': 'An open protocol that connects AI agents to tools and data.',
  'Custom agent skills': 'Reusable instructions and scripts that teach agents team workflows.',
  'Agent-assisted code review and testing': 'Using agents to review diffs and drive tests.',
  React: 'Component-based UI library for the web.',
  'Next.js': 'React framework with routing, server rendering and builds.',
  TypeScript: 'JavaScript with static types.',
  JavaScript: 'The language of the web.',
  'Redux Toolkit': 'The standard toolset for Redux state management.',
  Reselect: 'Memoized selectors for derived Redux state.',
  Zustand: 'Small, fast state store for React.',
  'Vue.js': 'Progressive framework for building web UIs.',
  'Nuxt.js': 'Vue framework with routing and server rendering.',
  'React Native': 'React for native mobile apps.',
  'TanStack Virtual': 'Headless list and grid virtualization.',
  'Design systems': 'Shared components and rules that keep products consistent.',
  Python: 'General-purpose language for services, data and ML.',
  Django: 'Batteries-included Python web framework.',
  'Node.js': 'JavaScript runtime for servers and tooling.',
  NestJS: 'Structured Node.js framework for server apps.',
  Express: 'Minimal Node.js web framework.',
  AdonisJS: 'Full-featured Node.js MVC framework.',
  PHP: 'Server-side scripting language behind much of the web.',
  Laravel: 'Expressive PHP web framework.',
  'REST APIs': 'Resource-oriented HTTP APIs.',
  GraphQL: 'Query language and runtime for APIs.',
  'Socket.IO': 'Real-time, bidirectional event communication.',
  Kafka: 'Distributed event streaming platform.',
  PostgreSQL: 'Advanced open-source relational database.',
  PostGIS: 'Geospatial extension for PostgreSQL.',
  MySQL: 'Popular open-source relational database.',
  Redis: 'In-memory data store for caching and queues.',
  Elasticsearch: 'Distributed search and analytics engine.',
  'Apache Solr': 'Open-source enterprise search platform.',
  AWS: 'Amazon Web Services cloud platform.',
  'Microsoft Azure': 'Microsoft’s cloud platform.',
  Git: 'Distributed version control.',
  GitHub: 'Code hosting, review and CI.',
  GitLab: 'DevOps platform for code, CI/CD and review.',
  'CI/CD': 'Automated build, test and release pipelines.',
  Docker: 'Containers for consistent builds and deploys.',
  Linux: 'The operating system most servers run.',
  Jira: 'Issue and project tracking.',
  Vercel: 'Hosting and deployment platform for frontends.',
  'System architecture': 'Flow and block diagrams, service boundaries, data flow.',
  'Database design': 'Schemas, relations and indexes that fit the product.',
  'Playwright (E2E)': 'Browser automation for end-to-end tests.',
  'Unit testing': 'Small, fast tests for individual pieces of code.',
  'Code review': 'Reading changes for correctness, clarity and design.',
  'Technical leadership': 'Roadmaps, milestones, delegation and stakeholder alignment.',
  Mentoring: 'Coaching engineers on code quality, testing and architecture.',
}

export const notificationsSeed = [
  { id: 'welcome', app: 'finder', title: 'Welcome to SurajOS', body: 'Double-click anything on the desktop, or open an app from the Dock. Press ⌘K to search.' },
  { id: 'available', app: 'contact', title: 'Open to remote work', body: 'Suraj is open to remote roles. Open Contact to get in touch.' },
  { id: 'project', app: 'projects', title: 'Project: React Spreadsheet Viewer', body: 'Virtualized Excel/CSV viewing for 100k+ rows, as an npm component.' },
  { id: 'update', app: 'experience', title: 'Now at Docsumo', body: 'Senior Software Engineer since Jan 2025, shipping LLM features for document processing.' },
]

/**
 * Optional recorded system sounds. Leave empty to use the built-in synthesized
 * set. Only add files you have the right to publish (for example CC0 packs),
 * placed in public/sounds, e.g. { pop: './sounds/pop.mp3' }.
 */
export const soundFiles: Partial<Record<'click' | 'open' | 'close' | 'minimize' | 'restore' | 'error' | 'pop' | 'notify' | 'trash' | 'toggleOn' | 'toggleOff' | 'lock' | 'unlock' | 'sent' | 'startup', string>> = {}
