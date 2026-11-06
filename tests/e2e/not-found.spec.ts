// PRPs/prds/stage-2-foundation.prd.md AC-14 Project pages and 404, unknown paths (phase 6 plan: AC-A3)
// An unknown path is answered with HTTP 404 and the plain page-register not-found page.
import { expect, test } from '@playwright/test';
import { textOf } from './support/home';

const UNKNOWN_PATHS = ['/nope', '/projects/does-not-exist'];

test.use({ viewport: { width: 1280, height: 800 } });

for (const path of UNKNOWN_PATHS) {
  test.describe(`unknown path ${path}`, () => {
    test('answers with status 404 and the not-found heading', async ({
      request,
    }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      const html = await response.text();
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
      expect(h1s).toHaveLength(1);
      expect(textOf(h1s[0]?.[1] ?? '')).toBe('Page not found.');
    });

    test('shows a Go home link to / inside main, with the nav and footer around it', async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Page not found.',
      );
      const home = page
        .getByRole('main')
        .getByRole('link', { name: 'Go home' });
      await expect(home).toHaveAttribute('href', '/');
      await expect(page.locator('header.sp-nav')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  });
}

test.describe('the 404 document', () => {
  let html = '';

  test.beforeAll(async ({ request }) => {
    html = await (await request.get('/nope')).text();
  });

  test('has a per-page title and the profile subtitle as description', () => {
    expect(html).toContain('<title>Page not found - Fabio Barreto</title>');
    expect(html).toContain(
      'content="12+ years shipping full-stack apps with React, Python and Java. Now building AI-assisted dev workflows."',
    );
  });

  test('is a plain page with one skip target, no build layer, form, mailto or tel', () => {
    expect(html).toMatch(/<main\b(?=[^>]*\bid="main")(?=[^>]*\btabindex="-1")/);
    expect(html).not.toMatch(/\bsp-(boot|dock|dock-fab|window|select|skel)\b/);
    expect(html).not.toContain('data-build');
    expect(html).not.toMatch(/<form\b|mailto:|tel:/i);
  });

  test('points every nav link at the home sections, not at same-page hashes', () => {
    for (const id of ['top', 'about', 'projects', 'stack', 'contact']) {
      expect(html).toContain(`href="/#${id}"`);
    }
    const hashes = [...html.matchAll(/href="(#[^"]*)"/g)].map((m) => m[1]);
    expect(hashes).toEqual(['#main']);
  });
});
