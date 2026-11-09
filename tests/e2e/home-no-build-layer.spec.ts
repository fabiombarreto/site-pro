// PRPs/prds/stage-2-foundation.prd.md AC-12 No build layer and no build animation (phase 5 plan: AC-A5)
import { expect, test, type Page } from '@playwright/test';
import { normalize } from './support/home';
import { runUntil, startClocked } from './support/runtime';

// Stage 3 phase 4 (PRD AC-13, AC-14, AC-17): instant mode keeps a ready dock, so the dock is not a
// build-layer leftover; the boot, windows, selection boxes, skeletons and outlines still are.
const BUILD_LAYER = '.sp-boot, .sp-window, .sp-select, .sp-skel, .sp-outline';

const mainText = (page: Page): Promise<string> =>
  page.locator('main').evaluate((el) => el.textContent ?? '');

test.describe('after the page has loaded and idled for 2 s', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('has no boot terminal, dock, window, outline, selection box or skeleton in instant mode', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await context.addInitScript(() =>
      window.localStorage.setItem('sp-speed', 'inf'),
    );
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(2000);
    await expect(page.locator(BUILD_LAYER)).toHaveCount(0);
    // The only build-layer piece left is the ready dock (PRD AC-13: "✓ 5/5 sections").
    await expect(page.locator('.sp-dock')).toHaveCount(1);
    await context.close();
  });

  test('keeps only the dock once the hero is built: no boot terminal, window, selection box or skeleton, and no visible expand button', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await startClocked(page);
    await page.clock.pauseAt(60000);
    await runUntil(page, (s) => s.states[0] === 'done', 30000, 'hero done');
    await expect(page.locator('.sp-dock')).toHaveCount(1);
    await expect(
      page.locator('.sp-boot, .sp-window, .sp-select, .sp-skel'),
    ).toHaveCount(0);
    // The collapsed-dock button now exists as a persistent node, hidden until the dock collapses.
    await expect(page.locator('.sp-dock-fab:visible')).toHaveCount(0);
  });

  test('renders the same main text as the no-JS page', async ({
    page,
    browser,
  }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const withScript = normalize(await mainText(page));

    const bare = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1280, height: 800 },
    });
    const barePage = await bare.newPage();
    await barePage.goto('/');
    const withoutScript = normalize(await mainText(barePage));
    await bare.close();

    expect(withScript.length).toBeGreaterThan(500);
    expect(withScript).toBe(withoutScript);
  });

  test('only transitions for 150 to 300 ms', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const outside = await page.evaluate(() => {
      const found: string[] = [];
      for (const el of document.querySelectorAll('*')) {
        const style = getComputedStyle(el);
        for (const raw of style.transitionDuration.split(',')) {
          const value = raw.trim();
          const ms = parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
          if (ms !== 0 && (ms < 150 || ms > 300)) {
            found.push(`${el.tagName.toLowerCase()}.${el.className}: ${value}`);
          }
        }
      }
      return found;
    });
    expect(outside).toEqual([]);
  });

  test('has at least one transition, so the check above is not vacuous', async ({
    page,
  }) => {
    await page.goto('/');
    const withTransition = await page.evaluate(
      () =>
        [...document.querySelectorAll('*')].filter((el) =>
          getComputedStyle(el)
            .transitionDuration.split(',')
            .some((d) => parseFloat(d) > 0),
        ).length,
    );
    expect(withTransition).toBeGreaterThan(0);
  });

  test('runs no transition or animation under reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const running = await page.evaluate(
      () =>
        [...document.querySelectorAll('*')].filter((el) => {
          const style = getComputedStyle(el);
          const transitions = style.transitionDuration
            .split(',')
            .some((d) => parseFloat(d) !== 0);
          const animations =
            style.animationName !== 'none' &&
            style.animationDuration.split(',').some((d) => parseFloat(d) !== 0);
          return transitions || animations;
        }).length,
    );
    expect(running).toBe(0);
  });
});

test.describe('the served HTML', () => {
  test('carries no build-layer markup and no pending runtime state', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text();
    // Stage 3 phase 2: the layer's stylesheet names these classes and may be inlined,
    // so the markup check ignores <style> blocks.
    const markup = html.replace(/<style\b[\s\S]*?<\/style>/g, '');
    expect(markup).not.toMatch(
      /\bsp-(boot|dock|dock-fab|window|select|skel)\b/,
    );
    expect(markup).not.toContain('data-build-layer');
    // Stage 3: the compiled build scripts are serialized into the sections on
    // purpose, but the pending state exists only once the head script runs.
    expect(html).toMatch(/<section\b[^>]*\sdata-build="/);
    expect(html).not.toMatch(
      /<html\b[^>]*\sdata-build-(mode|speed|status|started)\b/,
    );
    expect(html).not.toMatch(/<[a-z][^>]*\sdata-build-state=/);
  });
});
