// Shared fixtures for the home page specs (PRPs/prds/stage-2-foundation.prd.md AC-1, AC-2, AC-3, AC-5, AC-6, AC-12, AC-13).
// The values are the approved copy of docs/09-content-draft.md, written out literally so a content
// regression fails a test instead of silently moving the expectation with it.
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const AXE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
];

export const ACCENT_RGB = 'rgb(37, 99, 235)';

export const normalize = (text: string): string =>
  text.replace(/\s+/g, ' ').trim();

export const decodeEntities = (html: string): string =>
  html
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

export const textOf = (html: string): string =>
  normalize(decodeEntities(html.replace(/<[^>]*>/g, '')));

export const PROFILE = {
  role: 'Senior Software Engineer',
  subtitle:
    '12+ years shipping full-stack apps with React, Python and Java. Now building AI-assisted dev workflows.',
  bio: [
    "I'm a full-stack software engineer, and I've been studying programming and software development since 2008.",
    "Right now I'm building my own projects and exploring what AI can do in real applications, while I work on a postgraduate program in Software Engineering with AI.",
    'Take a look at my projects below, or find me on GitHub and LinkedIn.',
  ],
  location: 'Brazil (UTC-3)',
  contactLead: 'Questions, ideas or a project in mind? Find me here.',
  github: 'https://github.com/fabiombarreto',
  linkedin: 'https://www.linkedin.com/in/fabio-martins-barreto',
};

export const SECTION_IDS = ['top', 'about', 'projects', 'stack', 'contact'];

export const H2_TITLES = [
  'About me',
  'Selected work',
  'What I work with',
  "Let's talk.",
];

export const NAV_LINKS = [
  { id: 'about', index: '01', label: 'About' },
  { id: 'projects', index: '02', label: 'Projects' },
  { id: 'stack', index: '03', label: 'Stack' },
  { id: 'contact', index: '04', label: 'Contact' },
];

export const PROJECTS = [
  {
    slug: 'relay',
    title: 'relay',
    summary:
      'A Claude Code plugin that takes a feature from PRD to pull request, with a writer and a reviewer agent at every stage.',
    tags: ['claude-code', 'ai-agents', 'node'],
    year: '2026',
    status: 'active',
  },
  {
    slug: 'ai-track-record',
    title: 'AI Track Record',
    summary:
      'A local-first benchmark for AI coding agents: same task, different models and prompts, graded by tests the agent never sees.',
    tags: ['python', 'ai-agents', 'benchmarks'],
    year: '2026',
    status: 'planning',
  },
  {
    slug: 'praesto-sum',
    title: 'Praesto Sum',
    summary:
      'A personal assistant for one user: tasks and Google Calendar in one installable app, on Cloudflare Workers and React 19.',
    tags: ['typescript', 'react', 'cloudflare-workers'],
    year: '2026',
    status: 'in development',
  },
  {
    slug: 'site-pro',
    title: 'site-pro',
    summary:
      'This site: a portfolio that builds itself live, one typed command at a time.',
    tags: ['astro', 'react', 'typescript'],
    year: '2026',
    status: 'in development',
  },
];

export const STACK_GROUPS = [
  { name: 'languages', items: ['java', 'python', 'typescript', 'sql'] },
  { name: 'frontend', items: ['react', 'angular'] },
  {
    name: 'backend',
    items: ['spring-boot', 'django', 'graphql', 'node', 'fastapi'],
  },
  { name: 'data', items: ['postgresql', 'redis', 'rabbitmq'] },
  { name: 'cloud', items: ['aws', 'ci-cd'] },
  { name: 'ai', items: ['claude-code'] },
];

export const DESKTOP = { width: 1440, height: 900 };
export const TABLET = { width: 800, height: 1024 };
export const PHONE = { width: 375, height: 812 };

export const MAIN_NAV_NAME = 'Main';

export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
  ).toEqual([]);
}

export const popoverOpen = (page: Page): Promise<boolean> =>
  page
    .locator('#mobile-menu')
    .evaluate((menu) => menu.matches(':popover-open'));
