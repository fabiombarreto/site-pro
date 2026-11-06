// PRPs/prds/stage-2-foundation.prd.md AC-1 and AC-8 (phase 1 plan: AC-A1, AC-A6)
// Static HTML contract of the placeholder page, read without executing any script,
// plus a first axe smoke check.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const count = (haystack: string, re: RegExp): number =>
  (haystack.match(re) ?? []).length;

test.describe('static HTML of /', () => {
  test('is a complete document with one main and one h1, before any script runs', async ({
    request,
  }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html).toMatch(/<html[^>]*\blang="en"/);
    expect(html).toContain(
      '<title>Fabio Barreto - Senior Software Engineer</title>',
    );
    expect(html).toMatch(/<meta[^>]*name="description"/);
    expect(html).toContain(
      'content="12+ years shipping full-stack apps with React, Python and Java. Now building AI-assisted dev workflows."',
    );
    expect(count(html, /<main[\s>]/g)).toBe(1);
    expect(count(html, /<h1[\s>]/g)).toBe(1);
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '';
    expect(
      h1
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    ).toBe('Fabio Barreto.');
  });

  test('shows the heading with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1 }),
    ).toHaveText('Fabio Barreto.');
    await context.close();
  });

  test('has no axe violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('built dist/ privacy (AC-A6)', () => {
  const htmlFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) return htmlFiles(full);
      return full.endsWith('.html') ? [full] : [];
    });

  test('no HTML page contains mailto:, tel: or a form', () => {
    const files = htmlFiles(resolve(process.cwd(), 'dist'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const html = readFileSync(file, 'utf8');
      expect(html, file).not.toMatch(/mailto:|tel:|<form/i);
    }
  });
});
