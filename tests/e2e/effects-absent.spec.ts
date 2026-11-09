// PRPs/prds/stage-3-runtime.prd.md AC-14 reduced motion, AC-15 no JavaScript or failure, AC-13 saved infinity:
// no effect attribute, overlay or inline style exists. AC-4 / AC-18: while building, page elements only receive
// opacity, clip-path and pointer-events, only transform, opacity and clip-path animate, and every effect overlay sits in
// the aria-hidden layer outside <main> (phase 3 plan: AC-A4, AC-A6, AC-A8)
import { expect, test } from '@playwright/test';
import { DESKTOP_VIEWPORT, sleep, startClocked } from './support/runtime';
import { effectArtifacts } from './support/effects';

test.use({ viewport: DESKTOP_VIEWPORT });

test.describe('no effect artifact exists', () => {
  test('under reduced motion', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('html')).toHaveAttribute(
      'data-build-status',
      'done',
    );
    expect(await effectArtifacts(page)).toBe(0);
    await ctx.close();
  });

  test('with a saved infinity speed', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    await ctx.addInitScript(() => localStorage.setItem('sp-speed', 'inf'));
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('html')).toHaveAttribute(
      'data-build-status',
      'done',
    );
    expect(await effectArtifacts(page)).toBe(0);
    await ctx.close();
  });

  test('without JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      javaScriptEnabled: false,
    });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    expect(await effectArtifacts(page)).toBe(0);
    await ctx.close();
  });

  test('when the runtime is blocked, and the headline stays visible', async ({
    page,
  }) => {
    await page.route(/\/_astro\/.*\.js/, (route) => route.abort());
    await startClocked(page);
    await page.clock.pauseAt(60000);
    expect(await effectArtifacts(page)).toBe(0);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.querySelector('h1') as Element).opacity,
      ),
    ).toBe('1');
  });

  test('when the runtime script throws on load, and the headline stays visible', async ({
    page,
  }) => {
    await page.route(/\/_astro\/.*\.js/, (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: 'throw new Error("runtime failed to start");',
      }),
    );
    await startClocked(page);
    await page.clock.pauseAt(60000);
    expect(await effectArtifacts(page)).toBe(0);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.querySelector('h1') as Element).opacity,
      ),
    ).toBe('1');
  });

  for (const path of ['/projects/relay/', '/no-such-page']) {
    test(`on ${path}, outside the home page`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' });
      expect(await effectArtifacts(page)).toBe(0);
    });
  }
});

test('writes only opacity, clip-path and pointer-events on page elements and animates only transform, opacity and clip-path, with every overlay in the aria-hidden layer', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  // Page elements may keep whatever inline style the static page already has.
  const bareContext = await browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    javaScriptEnabled: false,
  });
  const bare = await bareContext.newPage();
  await bare.goto('/', { waitUntil: 'load' });
  const staticNames = await bare.evaluate(() => {
    const names = new Set<string>();
    for (const e of document.querySelectorAll(
      'main [data-build-target], main [data-build-target] *',
    )) {
      const style = (e as HTMLElement).style;
      for (let k = 0; k < style.length; k++) names.add(style.item(k));
    }
    return [...names];
  });
  await bareContext.close();
  const allowed = ['opacity', 'clip-path', 'pointer-events', ...staticNames];

  await startClocked(page);
  await page.clock.pauseAt(60000);
  const sampled = { moments: 0, overlays: 0 };
  for (let i = 0; i < 600; i++) {
    await page.clock.runFor(20);
    await sleep(3);
    const r = await page.evaluate((ok) => {
      const bad: string[] = [];
      for (const e of document.querySelectorAll(
        'main [data-build-target], main [data-build-target] *',
      )) {
        const style = (e as HTMLElement).style;
        for (let k = 0; k < style.length; k++) {
          const name = style.item(k);
          if (!ok.includes(name)) bad.push(name);
        }
      }
      const props = new Set<string>();
      for (const a of document.getAnimations()) {
        const effect = a.effect as KeyframeEffect | null;
        for (const kf of effect?.getKeyframes() ?? []) {
          for (const key of Object.keys(kf)) props.add(key);
        }
      }
      const overlays = [
        ...document.querySelectorAll(
          '.sp-select, .sp-skel, .sp-caret, .sp-scramble',
        ),
      ];
      const outside = overlays.filter(
        (e) =>
          (document.querySelector('main') as Element).contains(e) ||
          // Phase 4: the layer root is no longer aria-hidden as a whole (the dock group holds real
          // buttons), so each overlay must sit inside an aria-hidden element inside the layer.
          !e.closest('[data-build-layer] [aria-hidden="true"]'),
      ).length;
      return {
        state: document.getElementById('top')?.getAttribute('data-build-state'),
        bad,
        props: [...props],
        outside,
        overlays: overlays.length,
      };
    }, allowed);
    expect(r.bad, 'inline properties on page elements').toEqual([]);
    const animated = new Set([
      'opacity',
      'transform',
      'clip-path',
      'offset',
      'easing',
      'composite',
      'computedOffset',
    ]);
    expect(
      r.props.filter((name) => !animated.has(name)),
      'animated properties',
    ).toEqual([]);
    expect(r.outside, 'overlays outside the aria-hidden layer').toBe(0);
    sampled.moments++;
    sampled.overlays += r.overlays;
    if (r.state === 'done') break;
  }
  // The check above is not vacuous: effect overlays were seen while the hero built.
  expect(sampled.moments).toBeGreaterThan(50);
  expect(sampled.overlays).toBeGreaterThan(0);
});

test('serves no effect markup on the home page, the 404 or the project pages', async ({
  request,
}) => {
  for (const path of ['/', '/projects/relay/', '/no-such-page']) {
    const html = await (await request.get(path)).text();
    const markup = html.replace(/<style\b[\s\S]*?<\/style>/g, '');
    expect(markup, path).not.toMatch(
      /\b(sp-build-fx|sp-select|sp-skel|sp-caret|sp-scramble|data-build-fx)\b/,
    );
  }
  // The project pages load none of the build CSS either, so the whole document (styles included) is clean.
  const project = await (await request.get('/projects/relay/')).text();
  expect(project).not.toMatch(
    /\b(sp-build-fx|sp-select|sp-skel|sp-caret|sp-scramble|data-build-fx)\b/,
  );
});
