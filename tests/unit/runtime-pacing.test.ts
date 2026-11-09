// PRPs/prds/stage-3-runtime.prd.md AC-20 step placement and commands taken from the content, AC-1 hero timing,
// AC-18 base scripts per section (phase 3 plan: AC-A2, AC-A9)
// The pacing helper turns "pitch between step starts" into gaps and overlaps; the five base scripts, compiled
// against the real content, land on prototype v2's offsets.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileScript } from '../../src/runtime/compiler';
import type { BuildStep } from '../../src/runtime/types';
import { aboutBuild } from '../../src/sections/about.build';
import { contactBuild } from '../../src/sections/contact.build';
import { heroBuild } from '../../src/sections/hero.build';
import { pacedSteps } from '../../src/sections/pacing';
import { projectsBuild } from '../../src/sections/projects.build';
import { stackBuild } from '../../src/sections/stack.build';

const content = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(process.cwd(), 'src/content', file), 'utf8'));
const profile = content('profile.json').profile as Parameters<
  typeof heroBuild
>[0];
const stack = content('stack.json').stack as Parameters<typeof stackBuild>[0];
const projects = ['relay', 'ai-track-record', 'praesto-sum', 'site-pro'].map(
  (id) => ({ id }),
) as unknown as Parameters<typeof projectsBuild>[0];

const q = '"';
const pop = (call: string): BuildStep => ({
  call,
  target: 'links',
  effect: 'pop',
});

describe('pacedSteps', () => {
  it('turns a later start into a gap and an earlier start into an overlap', () => {
    // pop lasts 330 ms: step 1 starts at 500 (170 ms after step 0 ends), step 2 at 600 (230 ms before step 1 ends).
    const { steps } = pacedSteps(
      [
        { step: pop('a') },
        { step: pop('b'), pitch: 500 },
        { step: pop('c'), pitch: 100 },
      ],
      1000,
    );
    expect(steps[0]).toEqual(pop('a'));
    expect(steps[1]?.gap).toBe(170);
    expect(steps[1]?.overlap).toBeUndefined();
    expect(steps[2]?.overlap).toBe(230);
    expect(steps[2]?.gap).toBeUndefined();
  });

  it('places steps so that the compiled starts are the given pitches apart', () => {
    const { steps } = pacedSteps(
      [
        { step: pop('a') },
        { step: pop('b'), pitch: 500 },
        { step: pop('c'), pitch: 100 },
      ],
      1000,
    );
    const t = compileScript({
      section: 'about',
      file: 'about.md',
      command: 'renderAbout();',
      steps,
    });
    expect(t.steps.map((s) => s.start - t.buildStart)).toEqual([0, 500, 600]);
  });

  it('settles so that the section is created at the requested time, never sooner than the minimum', () => {
    // Last step starts at 600 and ends at 930.
    const input = [
      { step: pop('a') },
      { step: pop('b'), pitch: 500 },
      { step: pop('c'), pitch: 100 },
    ];
    expect(pacedSteps(input, 1000).settle).toBe(70);
    expect(pacedSteps(input, 900).settle).toBe(60);
    expect(pacedSteps(input, 900, 25).settle).toBe(25);
    expect(pacedSteps(input, 2000).settle).toBe(1070);
  });

  it('does not change the steps it is given', () => {
    const first = pop('a');
    const second = pop('b');
    pacedSteps([{ step: first }, { step: second, pitch: 500 }], 1000);
    expect(second).toEqual(pop('b'));
  });

  it('names the step whose duration cannot be derived', () => {
    const bad: BuildStep = { call: 'a.b()', target: 't', effect: 'type-text' };
    expect(() => pacedSteps([{ step: bad }], 500)).toThrow(/a\.b\(\)/);
  });
});

describe('base scripts compiled against the content', () => {
  const offsets = (t: { steps: { start: number }[] }): number[] =>
    t.steps.map((s) => s.start - (t.steps[0]?.start ?? 0));

  it('builds the hero in the approved order, effects and offsets within its budget', () => {
    const t = compileScript(heroBuild(profile));
    expect(t.steps.map((s) => s.call)).toEqual([
      `hero.title(${q}Fabio Barreto.${q})`,
      `hero.role(${q}Senior Software Engineer${q})`,
      'hero.photo(…)',
      'hero.intro(…)',
      'hero.links([…])',
    ]);
    expect(t.steps.map((s) => s.effect)).toEqual([
      'type-text',
      'decode',
      'skeleton',
      'resolve-lines',
      'pop',
    ]);
    [1300, 1500, 1600, 1900, 2200].forEach((ms, i) =>
      expect(Math.abs((t.steps[i]?.start ?? 0) - ms)).toBeLessThanOrEqual(50),
    );
    expect(t.steps[0]?.end ?? Infinity).toBeLessThanOrEqual(2000);
    expect(t.commandEnd).toBe(730);
    expect(t.buildStart).toBe(1300);
    expect(t.createdAt).toBeGreaterThanOrEqual(t.steps[4]?.end ?? Infinity);
    expect(t.duration).toBeLessThanOrEqual(3200);
  });

  it('types the headline for 150 ms plus 28 ms per character taken from the content', () => {
    const t = compileScript(
      heroBuild({ ...profile, headline: 'Ada Lovelace.' }),
    );
    const title = t.steps[0];
    expect(title?.call).toBe(`hero.title(${q}Ada Lovelace.${q})`);
    expect((title?.end ?? 0) - (title?.start ?? 0)).toBe(150 + 13 * 28);
  });

  it('builds About with prototype v2 offsets 0, 250 and 850', () => {
    const t = compileScript(aboutBuild(profile));
    expect(t.steps.map((s) => s.call)).toEqual([
      `about.heading(${q}About me${q})`,
      'about.text(…)',
      'about.links([…])',
    ]);
    [0, 250, 850].forEach((ms, i) =>
      expect(Math.abs((offsets(t)[i] ?? 0) - ms)).toBeLessThanOrEqual(60),
    );
    expect(Math.abs(t.createdAt - t.buildStart - 1150)).toBeLessThanOrEqual(
      200,
    );
  });

  it('builds Projects with one card per project, cards 330 ms apart and each 120 ms before the previous ends', () => {
    const t = compileScript(projectsBuild(projects));
    expect(t.steps.map((s) => s.call)).toEqual([
      `projects.heading(${q}Selected work${q})`,
      ...projects.map(({ id }) => `projects.card(${q}${id}${q})`),
    ]);
    expect(t.steps.slice(1).every((s) => s.effect === 'build-card')).toBe(true);
    const cards = t.steps.slice(1);
    expect(Math.abs((offsets(t)[1] ?? 0) - 450)).toBeLessThanOrEqual(60);
    cards.slice(1).forEach((card, i) => {
      expect(card.start).toBe((cards[i]?.end ?? 0) - 120);
      expect(card.start - (cards[i]?.start ?? 0)).toBe(330);
    });
    expect(Math.abs(t.createdAt - t.buildStart - 1990)).toBeLessThanOrEqual(
      200,
    );
  });

  it('adds a card step for a project added to the content', () => {
    const more = [...projects, { id: 'extra' }] as unknown as typeof projects;
    const t = compileScript(projectsBuild(more));
    expect(t.steps.at(-1)?.call).toBe(`projects.card(${q}extra${q})`);
    expect(t.steps.at(-1)?.target).toBe('card-extra');
  });

  it('builds Stack with one staggered group per content group, the first at 400 ms and the rest 150 ms apart', () => {
    const t = compileScript(stackBuild(stack));
    expect(t.steps.map((s) => s.call)).toEqual([
      `stack.heading(${q}What I work with${q})`,
      ...stack.groups.map((g) => `stack.group(${q}${g.name}${q})`),
    ]);
    const groups = t.steps.slice(1);
    expect(groups.every((s) => s.effect === 'stagger')).toBe(true);
    groups.forEach((_, i) =>
      expect(
        Math.abs((offsets(t)[i + 1] ?? 0) - (400 + i * 150)),
      ).toBeLessThanOrEqual(60),
    );
    // A group of n chips staggers for 330 ms plus 90 ms per further chip.
    groups.forEach((s, i) =>
      expect(s.end - s.start).toBe(
        330 + 90 * ((stack.groups[i]?.items.length ?? 1) - 1),
      ),
    );
    expect(Math.abs(t.createdAt - t.buildStart - 1350)).toBeLessThanOrEqual(
      200,
    );
  });

  it('builds Contact with offsets 0, 450 and 650', () => {
    const t = compileScript(contactBuild(profile));
    expect(t.steps.map((s) => s.call)).toEqual([
      `contact.heading(${q}Let's talk.${q})`,
      'contact.links([…])',
      'contact.location(…)',
    ]);
    [0, 450, 650].forEach((ms, i) =>
      expect(Math.abs((offsets(t)[i] ?? 0) - ms)).toBeLessThanOrEqual(60),
    );
    expect(Math.abs(t.createdAt - t.buildStart - 1100)).toBeLessThanOrEqual(
      200,
    );
  });

  it('never creates a section before its last step ends', () => {
    for (const script of [
      heroBuild(profile),
      aboutBuild(profile),
      projectsBuild(projects),
      stackBuild(stack),
      contactBuild(profile),
    ]) {
      const t = compileScript(script);
      expect(t.createdAt).toBeGreaterThanOrEqual(
        t.steps.at(-1)?.end ?? Infinity,
      );
    }
  });
});
