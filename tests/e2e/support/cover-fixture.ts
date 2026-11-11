// Test-side fixture for the Stage 4 image effects (PRPs/prds/stage-4-sections-effects.prd.md AC-3, AC-4, AC-9, AC-10).
// The committed content has the placeholder photo and no project covers, so the cover resolve and the
// asset swap are exercised by rewriting the served HTML of `/` through Playwright route interception:
// the first project card gets a 16:9 cover image plus the inlined blurred copy (`data-build-blur`) the
// build pipeline would emit, and the real runtime then runs on that page. Nothing is added to src/content.
import type { Browser, BrowserContext, Page } from '@playwright/test';

export const FIXTURE_SLUG = 'relay';

const svg = (width: number, height: number, fill: string): string =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="${width}" height="${height}" fill="${fill}"/>` +
      `<circle cx="${width / 2}" cy="${height / 2}" r="${height / 4}" fill="#ffffff"/></svg>`,
  ).toString('base64')}`;

export const SHARP_COVER = svg(640, 360, '#3b6ea5');
export const BLURRED_COVER = svg(32, 18, '#2a4a6b');

export interface FixtureOptions {
  // Adds a 16:9 cover and its blurred copy to the first project card.
  cover?: boolean;
  // Replaces the hero photo by another 9:16 image of a different intrinsic size.
  photo?: boolean;
  // The intrinsic size of the swapped-in cover (16:9) and photo (9:16).
  coverSize?: [number, number];
  photoSize?: [number, number];
}

export function withFixture(html: string, options: FixtureOptions): string {
  let out = html;
  if (options.cover) {
    const [w, h] = options.coverSize ?? [640, 360];
    const cell = `data-build-target="card-${FIXTURE_SLUG}"`;
    const at = out.indexOf(cell);
    if (at < 0) throw new Error(`fixture: ${cell} not found in the page`);
    const tail = out
      .slice(at + cell.length)
      .replace(
        /<div class="sp-cover-ph"[^>]*><span[^>]*>[^<]*<\/span><\/div>/,
        `<img src="${options.coverSize ? svg(w, h, '#3b6ea5') : SHARP_COVER}" width="${w}" height="${h}" alt="" loading="lazy" decoding="async">`,
      );
    if (!tail.includes('<img src="data:image/svg+xml;base64,')) {
      throw new Error('fixture: the cover placeholder was not found');
    }
    out = `${out.slice(0, at)}${cell} data-build-blur="${BLURRED_COVER}"${tail}`;
  }
  if (options.photo) {
    const [w, h] = options.photoSize ?? [1080, 1920];
    const tag = /<img\b[^>]*class="sp-photo-img"[^>]*>/.exec(out)?.[0];
    if (!tag) throw new Error('fixture: the hero photo <img> was not found');
    const swapped = tag
      .replace(/\ssrc="[^"]*"/, ` src="${svg(w, h, '#6b4a8a')}"`)
      .replace(/\swidth="\d+"/, ` width="${w}"`)
      .replace(/\sheight="\d+"/, ` height="${h}"`);
    out = out.replace(tag, swapped);
  }
  return out;
}

// Serves `/` rewritten by `withFixture`. Install it before the first navigation.
export async function useFixture(
  target: Page | BrowserContext,
  options: FixtureOptions,
): Promise<void> {
  await target.route(
    (url) => url.pathname === '/',
    async (route) => {
      const response = await route.fetch();
      const headers = { ...response.headers() };
      delete headers['content-length'];
      await route.fulfill({
        response,
        headers,
        body: withFixture(await response.text(), options),
      });
    },
  );
}

export const useCoverFixture = (target: Page | BrowserContext): Promise<void> =>
  useFixture(target, { cover: true });

// The no-JS page for the same fixture: the reference every box, the document height and the accessibility
// tree of <main> must keep during the build.
export async function noScriptReference(
  browser: Browser,
  viewport: { width: number; height: number },
  options: FixtureOptions,
): Promise<Page> {
  const ctx = await browser.newContext({ viewport, javaScriptEnabled: false });
  await useFixture(ctx, options);
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  return page;
}
