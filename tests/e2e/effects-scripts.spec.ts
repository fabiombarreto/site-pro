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

test('builds the hero in the approved order and effects at prototype v2 offsets', () => {
  const hero = of('top');
  expect(hero.steps.map((s) => s.call)).toEqual([
    `hero.title(${q}Fabio Barreto.${q})`,
    `hero.role(${q}Senior Software Engineer${q})`,
    'hero.photo(…)',
    'hero.intro(…)',
    'hero.links([…])',
  ]);
  expect(hero.steps.map((s) => s.effect)).toEqual([
    'type-text',
    'decode',
    'skeleton',
    'resolve-lines',
    'pop',
  ]);
  [1300, 1500, 1600, 1900, 2200].forEach((ms, i) =>
    near(hero.steps[i]?.start ?? 0, ms, 50, `hero step ${i} start`),
  );
  expect(hero.steps[0]?.end ?? Infinity).toBeLessThanOrEqual(2000);
  expect(hero.createdAt).toBeLessThanOrEqual(2700);
  expect(hero.duration).toBeLessThanOrEqual(3200);
});

test('builds About, Stack and Contact with the commands and offsets of prototype v2', () => {
  const about = of('about');
  expect(about.steps.map((s) => s.call)).toEqual([
    `about.heading(${q}About me${q})`,
    'about.text(…)',
    'about.links([…])',
  ]);
  [0, 250, 850].forEach((ms, i) =>
    near(offsets(about)[i] ?? 0, ms, 60, `about offset ${i}`),
  );
  near(about.createdAt - about.buildStart, 1150, 200, 'about created time');

  const stack = of('stack');
  expect(stack.steps.map((s) => s.call)).toEqual([
    `stack.heading(${q}What I work with${q})`,
    ...STACK_GROUPS.map((g) => `stack.group(${q}${g.name}${q})`),
  ]);
  stack.steps
    .slice(1)
    .forEach((_, i) =>
      near(offsets(stack)[i + 1] ?? 0, 400 + i * 150, 60, `stack group ${i}`),
    );
  near(stack.createdAt - stack.buildStart, 1350, 200, 'stack created time');

  const contact = of('contact');
  expect(contact.steps.map((s) => s.call)).toEqual([
    `contact.heading(${q}Let's talk.${q})`,
    'contact.links([…])',
    'contact.location(…)',
  ]);
  [0, 450, 650].forEach((ms, i) =>
    near(offsets(contact)[i] ?? 0, ms, 60, `contact offset ${i}`),
  );
  near(
    contact.createdAt - contact.buildStart,
    1100,
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
  near(offsets(projects)[1] ?? 0, 450, 60, 'first card offset');
  near(
    projects.createdAt - projects.buildStart,
    1990,
    200,
    'projects created time',
  );
});
