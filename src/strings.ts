import type { Speed } from './scripts/build-mode';

export const strings = {
  skipLink: 'Skip to content',
  hero: {
    ariaLabel: 'Introduction',
    seeMyWork: 'See my work',
  },
  nav: {
    ariaLabel: 'Main',
    brand: 'fabiombarreto',
    links: [
      { id: 'about', index: '01', label: 'About' },
      { id: 'projects', index: '02', label: 'Projects' },
      { id: 'stack', index: '03', label: 'Stack' },
      { id: 'contact', index: '04', label: 'Contact' },
    ],
    openMenu: 'Open the menu',
    closeMenu: 'Close the menu',
    menuAriaLabel: 'Sections',
  },
  theme: {
    switchToDaylight: 'Switch to the Daylight theme',
    switchToMidnight: 'Switch to the Midnight theme',
  },
  sections: {
    about: {
      eyebrow: { index: '01', name: 'about' },
      title: 'About me',
    },
    projects: {
      eyebrow: { index: '02', name: 'projects' },
      title: 'Selected work',
      lead: 'Things I built and what I learned.',
    },
    stack: {
      eyebrow: { index: '03', name: 'stack' },
      title: 'What I work with',
    },
    contact: {
      eyebrow: { index: '04', name: 'contact' },
      title: "Let's talk.",
      lead: 'Questions, ideas or a project in mind? Find me here.',
    },
  },
  buttons: {
    github: 'GitHub',
    linkedin: 'LinkedIn',
  },
  projects: {
    backToProjects: 'All projects',
    repo: 'Repo',
    repoShortcut: 'repo',
  },
  notFound: {
    title: 'Page not found.',
    homeLink: 'Go home',
  },
  footer: {
    source: 'Source',
    year: '2026',
  },
} as const;

export const buildStrings = {
  skip: '» Skip',
  skipLabel: "Skip this section's build",
  replay: '↻ Replay',
  replayLabel: 'Replay the build',
  play: '▶ Play build',
  playLabel: 'Play the build animation',
  expandLabel: 'Show build status',
  groupLabel: 'Site build',
  queued: (position: number, total: number) => `queued ${position}/${total}`,
  footerBuilt: (seconds: string) => `Built live in ${seconds}s · `,
  speedGlyph: (speed: Speed) =>
    speed === 'inf' ? '∞' : speed === '2' ? '2×' : '1×',
  speedLabel: (speed: Speed) =>
    speed === 'inf'
      ? 'Build speed: ∞ (instant). Switch to 1×'
      : speed === '2'
        ? 'Build speed: 2×. Switch to instant'
        : 'Build speed: 1×. Switch to 2×',
  initializing: 'Initializing application...',
  openingFile: (file: string) => `Opening ${file}...`,
  readingFile: (file: string) => `Reading ${file}...`,
  building: (name: string) => `Building ${name}…`,
  created: (label: string, seconds: string) =>
    `✔ ${label} Section created. (${seconds}s)`,
  idleCount: (done: number, total: number) => `✓ ${done}/${total} sections`,
  scrollHint: 'scroll ↓',
  complete: (total: number, seconds: string) =>
    `✔ Build complete: ${total} sections in ${seconds}s`,
  reducedReady: '✔ Ready · motion reduced',
  prompt: '❯',
  collapsedGlyph: '❯_',
  sectionLabels: {
    top: 'Hero',
    about: 'About',
    projects: 'Projects',
    stack: 'Stack',
    contact: 'Contact',
  },
} as const;
