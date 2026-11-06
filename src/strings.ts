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
