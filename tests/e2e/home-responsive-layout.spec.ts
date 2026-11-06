// PRPs/prds/stage-2-foundation.prd.md AC-13 Responsive layout per the screens (phase 5 plan: AC-A6)
import { expect, test, type Page } from '@playwright/test';
import { DESKTOP, PHONE, TABLET } from './support/home';

const LAYOUTS = [
  {
    name: 'desktop 1440',
    viewport: DESKTOP,
    photoHeight: 960,
    projectColumns: 2,
    stagger: 96,
    stackColumns: 3,
  },
  {
    name: 'tablet 800',
    viewport: TABLET,
    photoHeight: 760,
    projectColumns: 2,
    stagger: 96,
    stackColumns: 2,
  },
  {
    name: 'phone 375',
    viewport: PHONE,
    photoHeight: 480,
    projectColumns: 1,
    stagger: 0,
    stackColumns: 1,
  },
];

const columnCount = (page: Page, selector: string): Promise<number> =>
  page
    .locator(selector)
    .evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
    );

for (const layout of LAYOUTS) {
  test.describe(layout.name, () => {
    test.use({ viewport: layout.viewport });

    test('sizes the hero photo placeholder at 9:16', async ({ page }) => {
      await page.goto('/');
      const box = await page.locator('.sp-hero-photo .sp-photo').boundingBox();
      expect(box?.height).toBeCloseTo(layout.photoHeight, 0);
      expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(9 / 16, 2);
    });

    test('renders the banner name on two lines', async ({ page }) => {
      await page.goto('/');
      const [firstTop, lastTop] = await page.locator('h1').evaluate((h1) => {
        const top = (node: Node | null): number => {
          const range = document.createRange();
          if (node) range.selectNodeContents(node);
          return range.getBoundingClientRect().top;
        };
        return [top(h1.firstChild), top(h1.lastChild)];
      });
      expect((lastTop ?? 0) - (firstTop ?? 0)).toBeGreaterThan(20);
      await expect(page.locator('h1')).toHaveText('Fabio Barreto.');
    });

    test('lays out the project grid and stack grid in the right columns', async ({
      page,
    }) => {
      await page.goto('/');
      expect(await columnCount(page, '.sp-projects-grid')).toBe(
        layout.projectColumns,
      );
      expect(await columnCount(page, '.sp-stack-grid')).toBe(
        layout.stackColumns,
      );
    });

    test(`offsets the right project column by ${layout.stagger}px`, async ({
      page,
    }) => {
      await page.goto('/');
      const cells = page.locator('.sp-projects-grid > *');
      await expect(cells).toHaveCount(4);
      const first = await cells.nth(0).boundingBox();
      const second = await cells.nth(1).boundingBox();
      if (layout.projectColumns === 2) {
        expect((second?.y ?? 0) - (first?.y ?? 0)).toBeCloseTo(
          layout.stagger,
          0,
        );
        expect(second?.x ?? 0).toBeGreaterThan(first?.x ?? 0);
        const third = await cells.nth(2).boundingBox();
        expect((third?.y ?? 0) - (first?.y ?? 0)).toBeGreaterThan(200);
        const fourth = await cells.nth(3).boundingBox();
        expect((fourth?.y ?? 0) - (third?.y ?? 0)).toBeCloseTo(
          layout.stagger,
          0,
        );
      } else {
        expect(second?.x ?? -1).toBeCloseTo(first?.x ?? 0, 0);
        expect(second?.y ?? 0).toBeGreaterThan(
          (first?.y ?? 0) + (first?.height ?? 0) - 1,
        );
      }
    });

    test('never scrolls horizontally and shifts layout by at most 0.01', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const store = window as unknown as { __cls: number };
        store.__cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            };
            if (!shift.hadRecentInput) store.__cls += shift.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto('/', { waitUntil: 'load' });
      await page.waitForTimeout(1000);
      const { overflow, cls } = await page.evaluate(() => ({
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        cls: (window as unknown as { __cls: number }).__cls,
      }));
      expect(overflow).toBeLessThanOrEqual(0);
      expect(cls).toBeLessThanOrEqual(0.01);
    });
  });
}

test.describe('hero stacking', () => {
  test.use({ viewport: DESKTOP });

  test('puts the photo in front of the name and lets it run into About', async ({
    page,
  }) => {
    await page.goto('/');
    const zIndex = (selector: string): Promise<number> =>
      page
        .locator(selector)
        .evaluate((el) => Number(getComputedStyle(el).zIndex));
    expect(await zIndex('.sp-hero-photo')).toBeGreaterThan(await zIndex('h1'));
    const photo = await page.locator('.sp-hero-photo .sp-photo').boundingBox();
    const hero = await page.locator('#top').boundingBox();
    expect((photo?.y ?? 0) + (photo?.height ?? 0)).toBeGreaterThan(
      (hero?.y ?? 0) + (hero?.height ?? 0),
    );
  });
});
