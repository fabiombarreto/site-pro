// PRPs/prds/stage-4-sections-effects.prd.md AC-5 Image delivery (phase 1 plan: AC-A5, AC-A6)
// PRPs/prds/stage-4-sections-effects.prd.md AC-2 ASCII generated at build time (phase 1 plan: AC-A3)
// PRPs/prds/stage-4-sections-effects.prd.md AC-3 a project without a cover has no blur data (phase 1 plan: AC-A4)
// The served HTML of `/` and `/projects/relay` is read without executing any script. The committed
// content has the placeholder SVG photo and no project covers, so the raster candidates and the
// cover blur are covered by the component and generator unit specs; here the static HTML proves the
// placeholder is served as it is and that the ASCII is data, never page text.
import { expect, test } from '@playwright/test';
import { asciiFromFile } from '../../src/images/ascii';

const RAMP = ' .:-=+*#%@';

const attr = (tag: string, name: string): string | undefined =>
  new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

test.describe('image delivery in the static HTML of /', () => {
  let html = '';

  test.beforeAll(async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    html = await response.text();
  });

  test('serves the hero photo with intrinsic dimensions and high fetch priority, never lazy', () => {
    const img = html.match(/<img\b[^>]*class="sp-photo-img"[^>]*>/)?.[0] ?? '';
    expect(img, 'hero photo <img>').not.toBe('');
    expect(Number(attr(img, 'width'))).toBeGreaterThan(0);
    expect(Number(attr(img, 'height'))).toBeGreaterThan(0);
    expect(attr(img, 'fetchpriority')).toBe('high');
    expect(img).not.toContain('loading="lazy"');
  });

  test('serves the placeholder SVG photo as it is, without picture sources', () => {
    const photo = html.match(/<div class="sp-photo[^"]*">[\s\S]*?<\/div>/)?.[0];
    expect(photo, 'photo box').toBeDefined();
    expect(photo).not.toContain('<picture');
    expect(photo).not.toContain('<source');
    expect(photo).toMatch(/<img\b[^>]*src="[^"]*\.svg"/);
  });

  test('keeps the photo box ratio of the intrinsic dimensions at 9:16', () => {
    const img = html.match(/<img\b[^>]*class="sp-photo-img"[^>]*>/)?.[0] ?? '';
    const ratio = Number(attr(img, 'width')) / Number(attr(img, 'height'));
    expect(ratio).toBeCloseTo(9 / 16, 3);
  });

  test('puts the photo ASCII on the photo target as data equal to the generator output', async () => {
    const match = /data-build-target="photo"\s+data-build-ascii="([^"]*)"/.exec(
      html,
    );
    expect(match, 'data-build-ascii on the photo target').not.toBeNull();
    const ascii = match?.[1] ?? '';
    expect(ascii).toBe(
      await asciiFromFile('src/assets/photo-placeholder-body.svg'),
    );
    const rows = ascii.split('\n');
    for (const row of rows) expect(row).toHaveLength(48);
    for (const char of ascii.replace(/\n/g, '')) expect(RAMP).toContain(char);
    expect(ascii.trim().length).toBeGreaterThan(0);
  });

  test('has no blur data because no committed project has a cover', () => {
    expect(html).not.toContain('data-build-blur');
    const cells = html.match(/data-build-target="card-[^"]+"/g) ?? [];
    expect(cells.length).toBeGreaterThan(0);
    const projects = html.slice(html.indexOf('id="projects"'));
    expect(projects).toContain('sp-cover-ph');
    expect(projects.slice(0, projects.indexOf('</section>'))).not.toContain(
      '<img',
    );
  });
});

test.describe('the photo ASCII is not page text', () => {
  test.use({ javaScriptEnabled: false });

  test('stays out of the text of main', async ({ page }) => {
    await page.goto('/');
    const main = (await page.locator('main').textContent()) ?? '';
    const ascii = await asciiFromFile('src/assets/photo-placeholder-body.svg');
    const densest = ascii
      .split('\n')
      .reduce((best, row) =>
        row.trim().length > best.trim().length ? row : best,
      );
    expect(densest.trim().length).toBeGreaterThan(0);
    expect(main).not.toContain(densest.trim());
    const attribute = await page
      .locator('[data-build-target="photo"]')
      .getAttribute('data-build-ascii');
    expect(attribute).toBe(ascii);
  });
});

test.describe('image delivery on a project page', () => {
  test('shows the dot-grid placeholder and no cover image or blur data when the project has no cover', async ({
    request,
  }) => {
    const response = await request.get('/projects/relay/');
    expect(response.status()).toBe(200);
    const html = await response.text();
    const cover = html.match(
      /<div class="sp-project-cover">[\s\S]*?<\/div><\/div>/,
    )?.[0];
    expect(cover, 'project cover box').toBeDefined();
    expect(cover).toContain('sp-cover-ph');
    expect(cover).not.toContain('<img');
    expect(html).not.toContain('data-build-blur');
  });
});
