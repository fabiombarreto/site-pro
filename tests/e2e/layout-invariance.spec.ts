// PRPs/prds/stage-3-runtime.prd.md AC-4 the final layout never moves: every section, heading, paragraph, button,
// project card and stack group box and the document height equal the no-JavaScript page (±0.5 px) at the boot,
// mid-hero, mid-projects (two cards overlapping) and after the build, at 1280x800 and 375x812, with a summed
// layout shift of at most 0.01 (phase 5 plan: Notes, the layout-invariance spec named in docs/context/testing.md)
// The reference is the page with JavaScript disabled, not the reduced-motion page the earlier specs use.
// Sampling error: ~16 ms early / ~52 ms late with 20 ms slices (1 % progress = 31 ms of the 3100 ms hero).
import { expect, test, type Browser, type Page } from '@playwright/test';
import { runUntil, sleep } from './support/runtime';
import { layerState, startPaused } from './support/layer';
import {
  advanceTo,
  layoutShift,
  layoutShiftInit,
  scrollSectionIntoBuild,
  timelinesOnPage,
} from './support/effects';
import { frames, readBuild } from './support/controls';

interface Layout {
  height: number;
  text: string;
  boxes: { name: string; box: number[] }[];
}

// Section, headings, paragraphs, buttons and links, project cards, stack groups and their chips, tags and
// the footer, in document order. The nav is left out on purpose: it slides in during the boot.
const LAYOUT_SELECTOR = [
  'main > section',
  'main h1',
  'main h2',
  'main h3',
  'main p',
  'main a',
  'main article',
  'main .sp-stack',
  'main li',
  'main .sp-tag',
  'footer',
  'footer p',
].join(', ');

const layoutOf = (page: Page): Promise<Layout> =>
  page.evaluate(async (selector) => {
    await document.fonts.ready;
    return {
      height: document.documentElement.scrollHeight,
      text: (document.querySelector('main')?.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim(),
      boxes: [...document.querySelectorAll(selector)].map((e, i) => {
        const r = e.getBoundingClientRect();
        const name = `${i}:${e.tagName.toLowerCase()}${e.className ? `.${String(e.className).split(' ')[0]}` : ''}`;
        return { name, box: [r.x + scrollX, r.y + scrollY, r.width, r.height] };
      }),
    };
  }, LAYOUT_SELECTOR);

async function noJavaScriptLayout(
  browser: Browser,
  viewport: { width: number; height: number },
): Promise<Layout> {
  const ctx = await browser.newContext({ viewport, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  const layout = await layoutOf(page);
  await ctx.close();
  return layout;
}

// Every difference larger than 0.5 px, named, so one assertion reports them all.
function differences(actual: Layout, reference: Layout): string[] {
  const out: string[] = [];
  if (Math.abs(actual.height - reference.height) > 0.5) {
    out.push(`document height ${actual.height} vs ${reference.height}`);
  }
  if (actual.text !== reference.text) out.push('main text differs');
  if (actual.boxes.length !== reference.boxes.length) {
    out.push(`box count ${actual.boxes.length} vs ${reference.boxes.length}`);
    return out;
  }
  actual.boxes.forEach((entry, i) => {
    const ref = reference.boxes[i];
    entry.box.forEach((v, j) => {
      if (Math.abs(v - (ref?.box[j] ?? Infinity)) > 0.5) {
        out.push(
          `${entry.name} coordinate ${j}: ${v} vs ${ref?.box[j] ?? 'none'}`,
        );
      }
    });
  });
  return out;
}

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
]) {
  test(`keeps every box and the document height of the no-JavaScript page at the boot, mid-hero, mid-projects and after the build at ${viewport.width}x${viewport.height}, with a layout shift of at most 0.01`, async ({
    browser,
  }) => {
    test.setTimeout(300_000);
    const reference = await noJavaScriptLayout(browser, viewport);
    expect(reference.boxes.length).toBeGreaterThan(30);

    const ctx = await browser.newContext({ viewport });
    await ctx.addInitScript(layoutShiftInit);
    const page = await ctx.newPage();
    const duration = await startPaused(page);
    const tls = await timelinesOnPage(page);

    // The boot terminal is on screen while the hero types its command.
    await runUntil(
      page,
      (s) => s.states[0] === 'command',
      3000,
      'hero command',
    );
    expect((await layerState(page)).boot).toBe(1);
    expect(differences(await layoutOf(page), reference), 'boot').toEqual([]);

    await advanceTo(page, 'top', duration, 1700);
    expect((await layerState(page)).windows).toBe(1);
    expect(differences(await layoutOf(page), reference), 'mid-hero').toEqual(
      [],
    );
    await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');

    // Two cards overlap: the first is still finishing while the second is being created.
    await scrollSectionIntoBuild(page, 'projects');
    const cards = (tls.projects?.steps ?? []).filter((s) =>
      s.call.startsWith('projects.card('),
    );
    const [first, second] = cards;
    const overlap = ((second?.start ?? 0) + (first?.end ?? 0)) / 2;
    await advanceTo(page, 'projects', tls.projects?.duration ?? 0, overlap);
    expect((await layerState(page)).windows, 'a Projects window is open').toBe(
      1,
    );
    expect(
      differences(await layoutOf(page), reference),
      'mid-projects',
    ).toEqual([]);

    // Run all: every remaining section reaches its final state and the dock shows the complete build.
    await page.keyboard.press('Shift+Escape');
    await frames(page, 3);
    expect((await readBuild(page)).states).toEqual(
      expect.not.arrayContaining(['pending', 'queued', 'building']),
    );
    expect((await layerState(page)).dockState).toBe('done');
    expect(differences(await layoutOf(page), reference), 'done').toEqual([]);

    await sleep(50);
    expect(await layoutShift(page)).toBeLessThanOrEqual(0.01);
    await ctx.close();
  });
}
