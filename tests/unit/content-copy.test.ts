// PRPs/prds/stage-2-foundation.prd.md AC-1 / AC-14 approved copy, AC-4 toggle names,
// AC-8 privacy, AC-9 tokens only (phase 3 plan: AC-A3 to AC-A8)
// The approved copy from docs/09-content-draft.md at the content level.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { strings } from '../../src/strings';

const root = process.cwd();
const read = (rel: string): string => readFileSync(resolve(root, rel), 'utf8');
const readNormalized = (rel: string): string =>
  read(rel).replace(/\r\n/g, '\n');

const projectIds = ['relay', 'ai-track-record', 'praesto-sum', 'site-pro'];
const contentFiles = [
  'src/content/profile.json',
  'src/content/stack.json',
  ...projectIds.map((id) => `src/content/projects/${id}.md`),
];
const newTsFiles = [
  'src/strings.ts',
  'src/content-schemas.ts',
  'src/content.config.ts',
];

const profile = () => JSON.parse(read('src/content/profile.json')).profile;
const stack = () => JSON.parse(read('src/content/stack.json')).stack;

function sourceFiles(dir: string): string[] {
  const names = readdirSync(resolve(root, dir), {
    recursive: true,
    encoding: 'utf8',
  });
  return names
    .filter((name) => /\.(ts|tsx|astro)$/.test(name))
    .map((name) => join(dir, name));
}

describe('approved profile copy', () => {
  it('carries the approved identity, role, intro and location', () => {
    const p = profile();
    expect(p.name).toBe('Fabio Martins Barreto');
    expect(p.headline).toBe('Fabio Barreto.');
    expect(p.role).toBe('Senior Software Engineer');
    expect(p.subtitle).toBe(
      '12+ years shipping full-stack apps with React, Python and Java. Now building AI-assisted dev workflows.',
    );
    expect(p.location).toBe('Brazil (UTC-3)');
  });

  it('carries the approved About text in three paragraphs', () => {
    expect(profile().bio.split('\n\n')).toEqual([
      "I'm a full-stack software engineer, and I've been studying programming and software development since 2008.",
      "Right now I'm building my own projects and exploring what AI can do in real applications, while I work on a postgraduate program in Software Engineering with AI.",
      'Take a look at my projects below, or find me on GitHub and LinkedIn.',
    ]);
  });

  it('links only GitHub and LinkedIn', () => {
    expect(profile().links).toEqual([
      {
        label: 'GitHub',
        url: 'https://github.com/fabiombarreto',
        icon: 'github',
      },
      {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/fabio-martins-barreto',
        icon: 'linkedin',
      },
    ]);
  });
});

describe('approved stack copy', () => {
  it('lists the six groups and their items in display order', () => {
    expect(stack().groups).toEqual([
      { name: 'languages', items: ['java', 'python', 'typescript', 'sql'] },
      { name: 'frontend', items: ['react', 'angular'] },
      {
        name: 'backend',
        items: ['spring-boot', 'django', 'graphql', 'node', 'fastapi'],
      },
      { name: 'data', items: ['postgresql', 'redis', 'rabbitmq'] },
      { name: 'cloud', items: ['aws', 'ci-cd'] },
      { name: 'ai', items: ['claude-code'] },
    ]);
  });
});

describe('approved project copy', () => {
  const approved = [
    {
      id: 'relay',
      title: 'relay',
      summary:
        'A Claude Code plugin that takes a feature from PRD to pull request, with a writer and a reviewer agent at every stage.',
      tags: ['claude-code', 'ai-agents', 'node'],
      status: 'active',
      order: '1',
      repo: 'https://github.com/fabiombarreto/PRPs-agentic-eng',
    },
    {
      id: 'ai-track-record',
      title: 'AI Track Record',
      summary:
        'A local-first benchmark for AI coding agents: same task, different models and prompts, graded by tests the agent never sees.',
      tags: ['python', 'ai-agents', 'benchmarks'],
      status: 'planning',
      order: '2',
      repo: 'https://github.com/fabiombarreto/ai-track-record',
    },
    {
      id: 'praesto-sum',
      title: 'Praesto Sum',
      summary:
        'A personal assistant for one user: tasks and Google Calendar in one installable app, on Cloudflare Workers and React 19.',
      tags: ['typescript', 'react', 'cloudflare-workers'],
      status: 'in development',
      order: '3',
      repo: 'https://github.com/fabiombarreto/praesto-sum',
    },
    {
      id: 'site-pro',
      title: 'site-pro',
      summary:
        'This site: a portfolio that builds itself live, one typed command at a time.',
      tags: ['astro', 'react', 'typescript'],
      status: 'in development',
      order: '4',
      repo: 'https://github.com/fabiombarreto/site-pro',
    },
  ];

  it.each(approved)(
    '$id carries its approved frontmatter',
    ({ id, title, summary, tags, status, order, repo }) => {
      const text = readNormalized(`src/content/projects/${id}.md`);
      const lines = text.split('\n');
      expect(lines).toContain(`title: ${title}`);
      expect(lines).toContain(`summary: '${summary}'`);
      expect(lines).toContain(`status: ${status}`);
      expect(lines).toContain(`order: ${order}`);
      expect(lines).toContain(`  repo: ${repo}`);
      expect(lines).toContain("year: '2026'");
      expect(lines).toContain('featured: true');
      const tagLines = lines.slice(
        lines.indexOf('tags:') + 1,
        lines.indexOf('links:'),
      );
      expect(tagLines).toEqual(tags.map((tag) => `  - ${tag}`));
    },
  );

  it('gives relay the fork note as its body', () => {
    const body = readNormalized('src/content/projects/relay.md')
      .split('\n---\n')
      .slice(1)
      .join('\n---\n');
    expect(body.trim()).toBe(
      'The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.',
    );
  });

  it.each(['ai-track-record', 'praesto-sum', 'site-pro'])(
    'leaves the %s body empty',
    (id) => {
      const text = readNormalized(`src/content/projects/${id}.md`);
      const afterFrontmatter = text.split('\n---\n').slice(1).join('\n---\n');
      expect(afterFrontmatter.trim()).toBe('');
    },
  );
});

describe('interface strings', () => {
  it('carries the approved section headings and leads', () => {
    expect(strings.sections).toEqual({
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
    });
  });

  it('carries the nav, skip link and button labels', () => {
    expect(strings.skipLink).toBe('Skip to content');
    expect(strings.nav.brand).toBe('fabiombarreto');
    expect(strings.nav.openMenu).toBe('Open the menu');
    expect(strings.nav.closeMenu).toBe('Close the menu');
    expect(strings.nav.links).toEqual([
      { id: 'about', index: '01', label: 'About' },
      { id: 'projects', index: '02', label: 'Projects' },
      { id: 'stack', index: '03', label: 'Stack' },
      { id: 'contact', index: '04', label: 'Contact' },
    ]);
    expect(strings.hero.seeMyWork).toBe('See my work');
    expect(strings.buttons).toEqual({
      github: 'GitHub',
      linkedin: 'LinkedIn',
    });
  });

  it('carries the 404 copy, the back link and the footer source label', () => {
    expect(strings.notFound).toEqual({
      title: 'Page not found.',
      homeLink: 'Go home',
    });
    expect(strings.projects.backToProjects).toBe('All projects');
    expect(strings.footer.source).toBe('Source');
  });

  it('carries the two theme toggle names', () => {
    expect(strings.theme).toEqual({
      switchToDaylight: 'Switch to the Daylight theme',
      switchToMidnight: 'Switch to the Midnight theme',
    });
  });

  it('is the only place the theme toggle names are written', () => {
    const offenders = sourceFiles('src')
      .filter((file) => file.replace(/\\/g, '/') !== 'src/strings.ts')
      .filter((file) => read(file).includes('Switch to the'));
    expect(offenders).toEqual([]);
  });
});

describe('privacy and voice of the content layer', () => {
  const copyFiles = [...contentFiles, ...newTsFiles];

  it('contains no email address, mailto or tel link, or form', () => {
    const pattern =
      /mailto:|\btel:|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|<form/;
    for (const file of copyFiles) {
      expect(read(file), file).not.toMatch(pattern);
    }
  });

  it('uses no em dash in content or strings', () => {
    for (const file of [...contentFiles, 'src/strings.ts']) {
      expect(read(file), file).not.toContain('—');
    }
  });

  it('links only to the approved profiles and project repositories', () => {
    const approved = [
      'https://github.com/fabiombarreto',
      'https://www.linkedin.com/in/fabio-martins-barreto',
      'https://github.com/fabiombarreto/PRPs-agentic-eng',
      'https://github.com/fabiombarreto/ai-track-record',
      'https://github.com/fabiombarreto/praesto-sum',
      'https://github.com/fabiombarreto/site-pro',
    ];
    const found = contentFiles.flatMap(
      (file) => read(file).match(/https?:\/\/[^\s"')>]+/g) ?? [],
    );
    expect(found.length).toBeGreaterThan(0);
    for (const url of found) expect(approved).toContain(url);
  });

  it('uses no color or box-shadow literal in the new .ts files', () => {
    const pattern = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|box-shadow/;
    for (const file of newTsFiles) {
      expect(read(file), file).not.toMatch(pattern);
    }
  });
});
