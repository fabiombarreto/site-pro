// Shared helpers for the runtime specs (PRPs/prds/stage-3-runtime.prd.md AC-1, AC-2, AC-4, AC-15, AC-16, AC-20).
// The runtime reads time through performance.now and requestAnimationFrame, which Playwright's
// page.clock fakes: install before goto, then pauseAt / runFor.
import type { Page } from '@playwright/test';
import { decodeEntities } from './home';

export const IDS = ['top', 'about', 'projects', 'stack', 'contact'];
export const ACTIVE_STATES = ['command', 'window', 'building', 'closing'];
export const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

export interface Snapshot {
  mode: string | null;
  status: string | null;
  speed: string | null;
  progress: number;
  states: (string | null)[];
  opacity: string[];
  scrollY: number;
}

export interface TimelineJson {
  v: number;
  section: string;
  file: string;
  command: string;
  log?: string;
  commandEnd: number;
  windowEnd: number;
  buildStart: number;
  steps: {
    call: string;
    target: string;
    effect: string;
    start: number;
    end: number;
  }[];
  createdAt: number;
  duration: number;
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const snapshot = (page: Page): Promise<Snapshot> =>
  page.evaluate((ids) => {
    const html = document.documentElement;
    return {
      mode: html.getAttribute('data-build-mode'),
      status: html.getAttribute('data-build-status'),
      speed: html.getAttribute('data-build-speed'),
      progress: Number(html.getAttribute('data-build-progress') || 0),
      states: ids.map(
        (id) =>
          document.getElementById(id)?.getAttribute('data-build-state') ?? null,
      ),
      opacity: ids.map(
        (id) =>
          getComputedStyle(document.getElementById(id) as Element).opacity,
      ),
      scrollY: window.scrollY,
    };
  }, IDS);

// Advances the fake clock in 100 ms slices, with a real pause between slices so the
// IntersectionObserver and layout can settle, until `done` holds.
export async function runUntil(
  page: Page,
  done: (s: Snapshot) => boolean,
  maxMs: number,
  label: string,
): Promise<Snapshot> {
  for (let elapsed = 0; elapsed < maxMs; elapsed += 100) {
    await page.clock.runFor(100);
    await sleep(5);
    const s = await snapshot(page);
    if (done(s)) return s;
  }
  throw new Error(`timed out waiting for ${label}`);
}

export async function startClocked(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
}

// Saves an infinity speed before any page script runs, so `/` renders its final page at once.
export async function useInstantBuild(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('sp-speed', 'inf');
    } catch {
      // Storage may be blocked; the page then runs its normal build.
    }
  });
}

export function timelinesOf(html: string): TimelineJson[] {
  return [...html.matchAll(/<section\b[^>]*?\sdata-build="([^"]*)"/g)].map(
    (m) => JSON.parse(decodeEntities(m[1] ?? '')) as TimelineJson,
  );
}
