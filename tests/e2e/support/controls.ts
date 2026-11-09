// Shared helpers for the controls and navigation specs (PRPs/prds/stage-3-runtime.prd.md AC-3 to AC-10, AC-12 to AC-14, AC-17, AC-18).
// Builds on ./runtime, ./layer and ./effects. Under page.clock the fake clock freezes requestAnimationFrame
// between runFor calls, and Playwright's locator.click() waits for animation frames, so clicks on the page
// use element.click() inside page.evaluate (clickIn) and keys use page.keyboard.press.
import type { Page } from '@playwright/test';
import { IDS, sleep } from './runtime';

export const isFinal = (state: string | null): boolean =>
  state === 'done' || state === 'skipped';

export interface Build {
  states: (string | null)[];
  queue: string | null;
  y: number;
}

export const readBuild = (page: Page): Promise<Build> =>
  page.evaluate(
    (ids) => ({
      states: ids.map(
        (id) =>
          document.getElementById(id)?.getAttribute('data-build-state') ?? null,
      ),
      queue: document.documentElement.getAttribute('data-build-queue'),
      y: window.scrollY,
    }),
    IDS,
  );

// Runs the fake clock `count` frames of 20 ms, with a real pause so observers and layout settle.
export async function frames(page: Page, count = 2): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.clock.runFor(20);
    await sleep(3);
  }
}

// Steps the fake clock 20 ms at a time until `test` holds; `t` is the clock time stepped.
export async function untilFrames(
  page: Page,
  test: (b: Build) => boolean,
  label: string,
  maxMs = 90_000,
): Promise<{ b: Build; t: number }> {
  for (let t = 0; t < maxMs; t += 20) {
    await frames(page, 1);
    const b = await readBuild(page);
    if (test(b)) return { b, t: t + 20 };
  }
  throw new Error(`timed out waiting for ${label}`);
}

export const clickIn = (page: Page, selector: string): Promise<void> =>
  page.evaluate((q) => {
    const el = document.querySelector<HTMLElement>(q);
    if (!el) throw new Error(`missing ${q}`);
    el.click();
  }, selector);

export interface DockInfo {
  state: string | null;
  text: string;
  hint: string;
  pulse: boolean;
  shown: string[];
  footer: string | null;
}

export const dockInfo = (page: Page): Promise<DockInfo> =>
  page.evaluate(() => {
    const dock = document.querySelector('.sp-dock');
    const hint = dock?.querySelector('.sp-dock-hint');
    return {
      state: dock?.getAttribute('data-state') ?? null,
      text: dock?.querySelector('.sp-dock-status')?.textContent?.trim() ?? '',
      hint: hint?.textContent ?? '',
      pulse: !!hint?.hasAttribute('data-pulse'),
      shown: [...(dock?.querySelectorAll('[data-dock-action]') ?? [])]
        .filter((b) => !(b as HTMLButtonElement).hidden)
        .map((b) => b.getAttribute('data-dock-action') ?? ''),
      footer:
        document.querySelector('[data-footer-build]')?.textContent?.trim() ??
        null,
    };
  });

export const dockButtonName = (page: Page, action: string): Promise<string> =>
  page.evaluate(
    (a) =>
      document
        .querySelector(`.sp-dock [data-dock-action="${a}"]`)
        ?.getAttribute('aria-label') ?? '',
    action,
  );

// Starts the hero, then skips it with Esc, leaving the dock idle after the hold.
export async function skipHero(page: Page): Promise<void> {
  await untilFrames(page, (b) => b.states[0] === 'building', 'hero building');
  await page.keyboard.press('Escape');
  await frames(page, 2);
}

// Opens `/` with the fake clock (optionally at a hash), then pauses it.
export async function openClocked(page: Page, hash = ''): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.goto(`/${hash}`, { waitUntil: 'domcontentloaded' });
  await page.clock.pauseAt(60000);
}

export interface Watch {
  seen: Set<string>;
  first: Record<number, number>;
  last: Record<number, number>;
}

// Steps the clock until section `untilIndex` is final, recording when each section left pending and
// finished, the queue values shown, and that the page never scrolled away from `y0`.
export async function watchBuild(
  page: Page,
  y0: number,
  untilIndex: number,
  onSample?: (b: Build) => void,
): Promise<{ watch: Watch; scrolled: number[] }> {
  const watch: Watch = { seen: new Set(), first: {}, last: {} };
  const scrolled: number[] = [];
  let now = 0;
  for (let i = 0; i < 6000 && watch.last[untilIndex] === undefined; i++) {
    await frames(page, 1);
    now += 20;
    const b = await readBuild(page);
    if (b.y !== y0) scrolled.push(b.y);
    if (b.queue) watch.seen.add(b.queue);
    onSample?.(b);
    b.states.forEach((v, k) => {
      if (v !== 'pending' && v !== 'queued' && watch.first[k] === undefined) {
        watch.first[k] = now;
      }
      if (isFinal(v) && watch.last[k] === undefined) watch.last[k] = now;
    });
  }
  if (watch.last[untilIndex] === undefined) {
    throw new Error(`section ${untilIndex} never finished`);
  }
  return { watch, scrolled };
}
