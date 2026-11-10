// PRPs/prds/stage-3-runtime.prd.md AC-20 Build scripts are plain data compiled into the page
// (phase 1 plan: AC-A3)
// The served HTML of `/` carries each section's compiled timeline in data-build, with the
// data-build-target hooks the steps name. Read without executing any script.
import { expect, test } from '@playwright/test';
import { PROJECTS, SECTION_IDS } from './support/home';
import { timelinesOf, type TimelineJson } from './support/runtime';

// The h1 reads "Fabio Barreto." (docs/09-content-draft.md); the build script types it.
const HEADLINE = 'Fabio Barreto.';

test.describe('compiled build scripts in the served HTML', () => {
  let html = '';
  let timelines: TimelineJson[] = [];

  test.beforeAll(async ({ request }) => {
    html = await (await request.get('/')).text();
    timelines = timelinesOf(html);
  });

  test('carries one timeline per section, in document order', () => {
    expect(timelines.map((t) => t.section)).toEqual(SECTION_IDS);
    for (const t of timelines) expect(t.steps.length).toBeGreaterThan(0);
  });

  test('names the headline in hero.title and times it at 150 + n x 28 ms', () => {
    const hero = timelines.find((t) => t.section === 'top');
    const title = hero?.steps.find((s) => s.call.startsWith('hero.title('));
    expect(title?.call).toBe(`hero.title("${HEADLINE}")`);
    expect((title?.end ?? 0) - (title?.start ?? 0)).toBe(
      150 + HEADLINE.length * 28,
    );
  });

  test('has one projects.card per project, each starting 120 ms before the previous ends', () => {
    const projects = timelines.find((t) => t.section === 'projects');
    const cards = (projects?.steps ?? []).filter((s) =>
      s.call.startsWith('projects.card('),
    );
    expect(cards.map((c) => c.call)).toEqual(
      PROJECTS.map((p) => `projects.card("${p.slug}")`),
    );
    expect(cards.map((c) => c.target)).toEqual(
      PROJECTS.map((p) => `card-${p.slug}`),
    );
    cards.slice(1).forEach((card, i) => {
      expect(card.start).toBe((cards[i]?.end ?? 0) - 120);
    });
  });

  test('orders each timeline: steps have a duration and the phases follow the last step', () => {
    for (const t of timelines) {
      for (const step of t.steps) {
        expect(step.end, `${t.section} ${step.call}`).toBeGreaterThan(
          step.start,
        );
      }
      // Sections after the hero open their window at Enter (windowEnd equals commandEnd).
      expect(t.commandEnd).toBeLessThanOrEqual(t.windowEnd);
      expect(t.windowEnd).toBeLessThan(t.buildStart);
      if (t.section === 'top') {
        expect(t.commandEnd).toBeLessThan(t.windowEnd);
      } else {
        expect(t.windowEnd).toBe(t.commandEnd);
        expect(t.buildStart - t.windowEnd).toBe(280);
      }
      expect(t.createdAt).toBeGreaterThanOrEqual(
        t.steps[t.steps.length - 1]?.end ?? Infinity,
      );
      expect(t.duration).toBeGreaterThan(t.createdAt);
    }
  });

  test('finds every step target in the page', () => {
    for (const t of timelines) {
      for (const step of t.steps) {
        expect(html, `${t.section} ${step.call}`).toContain(
          `data-build-target="${step.target}"`,
        );
      }
    }
  });
});

test.describe('pages without a build', () => {
  for (const path of ['/projects/relay/', '/no-such-page']) {
    test(`${path} carries no build script and no runtime hook`, async ({
      request,
    }) => {
      const response = await request.get(path);
      const html = await response.text();
      expect(html).not.toContain('sp-speed');
      expect(html).not.toMatch(/\sdata-build=/);
    });
  }
});
