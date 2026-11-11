// PRPs/prds/stage-3-runtime.prd.md AC-1 hero commands, order and offsets, AC-20 commands from content and card overlap,
// AC-18 nothing pops in unannounced (every piece of content sits inside a build target) (phase 3 plan: AC-A1, AC-A2, AC-A9)
// The compiled timelines are read from the served page with JavaScript disabled.
import { expect, test } from '@playwright/test';
import { PROJECTS, STACK_GROUPS } from './support/home';
import { IDS, type TimelineJson } from './support/runtime';

test.use({
  viewport: { width: 1280, height: 800 },
  javaScriptEnabled: false,
});

interface SectionData {
  tl: TimelineJson;
  missing: string[];
  uncovered: string[];
}

const q = '"';
const offsets = (tl: TimelineJson): number[] =>
  tl.steps.map((s) => s.start - (tl.steps[0]?.start ?? 0));

let data: Record<string, SectionData> = {};

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  data = await page.evaluate((ids) => {
    const out: Record<string, SectionData> = {};
    for (const id of ids) {
      const section = document.getElementById(id) as HTMLElement;
      const tl = JSON.parse(section.getAttribute('data-build') ?? '{}');
      const targets = new Set(
        [...section.querySelectorAll('[data-build-target]')].map(
          (e) => e.getAttribute('data-build-target') ?? '',
        ),
      );
      out[id] = {
        tl,
        missing: (tl.steps as { target: string }[])
          .filter((st) => !targets.has(st.target))
          .map((st) => st.target),
        uncovered: [
          ...section.querySelectorAll('h1, h2, h3, p, a, button, img, li'),
        ]
          .filter((e) => !e.closest('[data-build-target]'))
          .map(
            (e) =>
              `${e.tagName.toLowerCase()}: ${(e.textContent ?? '').trim().slice(0, 30)}`,
          ),
      };
    }
    return out;
  }, IDS);
});

const of = (id: string): TimelineJson => (data[id] as SectionData).tl;
const near = (actual: number, want: number, tolerance: number, label: string) =>
  expect(
    Math.abs(actual - want),
    `${label} (got ${actual}, want ${want})`,
  ).toBeLessThanOrEqual(tolerance);

test('names every target of every step inside its section and leaves no content outside a target', () => {
  for (const id of IDS) {
    const d = data[id] as SectionData;
    expect(d.missing, `${id}: step targets missing from the section`).toEqual(
      [],
    );
    expect(d.uncovered, `${id}: content outside any data-build-target`).toEqual(
      [],
    );
    expect(
      d.tl.steps.every((s) => s.end <= d.tl.createdAt),
      `${id}: created before a step ends`,
    ).toBe(true);
  }
});

test('builds the hero in the approved order and effects at the tuned offsets', () => {
  const hero = of('top');
  const calls = hero.steps.map((s) => s.call);
  // The photo command carries the source file name, never Astro's hashed output name.
  expect(calls[2]).toBe(`hero.photo(${q}photo-placeholder-body.svg${q})`);
  expect(calls.filter((_, i) => i !== 2)).toEqual([
    `hero.title(${q}Fabio Barreto.${q})`,
    `hero.role(${q}Senior Software Engineer${q})`,
    `hero.intro(${q}12+ years shipping…${q})`,
    `hero.links([${q}GitHub${q}, ${q}LinkedIn${q}])`,
  ]);
  expect(hero.steps.map((s) => s.effect)).toEqual([
    'type-text',
    'decode',
    'image-resolve',
    'resolve-lines',
    'pop',
  ]);
  [1300, 1500, 1600, 1850, 2080].forEach((ms, i) =>
    near(hero.steps[i]?.start ?? 0, ms, 50, `hero step ${i} start`),
  );
  // The photo step is 1000 ms long and ends at the hero's created mark.
  near(
    (hero.steps[2]?.end ?? 0) - (hero.steps[2]?.start ?? 0),
    1000,
    0,
    'photo step length',
  );
  near(hero.createdAt, 2650, 50, 'hero created mark');
  expect(hero.steps[0]?.end ?? Infinity).toBeLessThanOrEqual(2000);
  expect(hero.createdAt).toBeLessThanOrEqual(2700);
  expect(hero.duration).toBeLessThanOrEqual(3200);
  // The three hero buttons pop one after another, 90 ms apart (330 + 90 x 2).
  const links = hero.steps[4];
  expect((links?.end ?? 0) - (links?.start ?? 0)).toBe(510);
});

test('builds About, Stack and Contact with the commands and offsets of the tuned scripts', () => {
  const about = of('about');
  expect(about.steps.map((s) => s.call)).toEqual([
    `about.heading(${q}About me${q})`,
    `about.text(${q}I'm a full-stack software…${q})`,
    `about.links([${q}GitHub${q}, ${q}LinkedIn${q}])`,
  ]);
  [0, 250, 750].forEach((ms, i) =>
    near(offsets(about)[i] ?? 0, ms, 60, `about offset ${i}`),
  );
  near(about.createdAt - about.buildStart, 1230, 200, 'about created time');

  const stack = of('stack');
  expect(stack.steps.map((s) => s.call)).toEqual([
    `stack.heading(${q}What I work with${q})`,
    ...STACK_GROUPS.map((g) => `stack.group(${q}${g.name}${q})`),
  ]);
  stack.steps
    .slice(1)
    .forEach((_, i) =>
      near(offsets(stack)[i + 1] ?? 0, 320 + i * 100, 60, `stack group ${i}`),
    );
  near(stack.createdAt - stack.buildStart, 1270, 200, 'stack created time');

  const contact = of('contact');
  expect(contact.steps.map((s) => s.call)).toEqual([
    `contact.heading(${q}Let's talk.${q})`,
    `contact.links([${q}GitHub${q}, ${q}LinkedIn${q}])`,
    `contact.location(${q}Brazil (UTC-3)${q})`,
  ]);
  [0, 350, 580].forEach((ms, i) =>
    near(offsets(contact)[i] ?? 0, ms, 60, `contact offset ${i}`),
  );
  near(
    contact.createdAt - contact.buildStart,
    1180,
    200,
    'contact created time',
  );
});

test('builds Projects with one card per project, each starting 120 ms before the previous card ends', () => {
  const projects = of('projects');
  expect(projects.steps.map((s) => s.call)).toEqual([
    `projects.heading(${q}Selected work${q})`,
    ...PROJECTS.map((p) => `projects.card(${q}${p.slug}${q})`),
  ]);
  const cards = projects.steps.slice(1);
  cards
    .slice(1)
    .forEach((card, i) => expect(card.start).toBe((cards[i]?.end ?? 0) - 120));
  near(offsets(projects)[1] ?? 0, 280, 60, 'first card offset');
  near(
    projects.createdAt - projects.buildStart,
    1180,
    200,
    'projects created time',
  );
});

test('lasts 300 ms per card, never builds more than two cards at once and staggers the buttons and chips', () => {
  const projects = of('projects');
  const cards = projects.steps.slice(1);
  cards.forEach((c) => expect(c.end - c.start).toBe(300));
  cards.slice(2).forEach((c, i) => {
    expect(c.start, `card ${i + 2} start`).toBeGreaterThanOrEqual(
      cards[i]?.end ?? Infinity,
    );
  });
  for (const id of ['about', 'contact']) {
    const links = of(id).steps.find((s) => s.target === 'links');
    const length = (links?.end ?? 0) - (links?.start ?? 0);
    expect(length, `${id} buttons`).toBe(420);
  }
  const groups = of('stack').steps.slice(1);
  groups.forEach((s, i) => {
    const chips = STACK_GROUPS[i]?.items.length ?? 1;
    expect(s.end - s.start, `stack group ${i}`).toBe(330 + 90 * (chips - 1));
  });
});

test('creates every section within its budget with the effects in the documented order', () => {
  // AC-6: the hero headline readable early and done within 3.2 s; every other section created within 2.5 s.
  expect(of('top').steps[0]?.end ?? Infinity).toBeLessThanOrEqual(2000);
  expect(of('top').duration).toBeLessThanOrEqual(3200);
  for (const id of ['about', 'projects', 'stack', 'contact']) {
    const tl = of(id);
    const lastEnd = Math.max(...tl.steps.map((s) => s.end));
    expect(tl.createdAt, `${id} created`).toBeLessThanOrEqual(2500);
    expect(tl.createdAt, `${id} after its steps`).toBeGreaterThanOrEqual(
      lastEnd,
    );
  }
  expect(of('about').steps.map((s) => s.effect)).toEqual([
    'type-text',
    'resolve-lines',
    'pop',
  ]);
  expect(of('contact').steps.map((s) => s.effect)).toEqual([
    'type-text',
    'pop',
    'type-text',
  ]);
  expect(of('projects').steps.map((s) => s.effect)).toEqual([
    'type-text',
    ...PROJECTS.map(() => 'build-card'),
  ]);
  expect(of('stack').steps.map((s) => s.effect)).toEqual([
    'type-text',
    ...STACK_GROUPS.map(() => 'stagger'),
  ]);
});

test('carries the dock logs of the content and opens non-hero windows at Enter', () => {
  expect(of('top').log).toBeUndefined();
  expect(of('about').log).toBe('Reading about.md...');
  expect(of('projects').log).toBe(
    `Fetching projects... ${PROJECTS.length} found`,
  );
  expect(of('stack').log).toBe('Resolving dependencies...');
  expect(of('contact').log).toBe('Opening channels...');
  for (const id of ['about', 'projects', 'stack', 'contact']) {
    const tl = of(id);
    expect(tl.windowEnd, `${id} window opens at Enter`).toBe(tl.commandEnd);
    expect(tl.buildStart - tl.windowEnd, `${id} window opening`).toBe(280);
  }
});
