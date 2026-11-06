// PRPs/prds/stage-2-foundation.prd.md AC-3 Keyboard and focus (phase 5 plan: AC-A3)
// The first Tab stop is a visible skip link that moves focus to <main>; every link and button
// then takes focus in DOM order with a 2px solid accent ring offset by 2px.
import { expect, test } from '@playwright/test';
import { ACCENT_RGB } from './support/home';

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('skip link', () => {
  test('is the first Tab stop, is visible, and moves focus to main', async ({
    page,
  }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();

    const box = await skip.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
    expect(box?.width ?? 0).toBeGreaterThan(0);
    expect(box?.height ?? 0).toBeGreaterThan(0);

    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('is out of view until it takes focus', async ({ page }) => {
    await page.goto('/');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    const box = await skip.boundingBox();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(0);
  });
});

test.describe('focus order and ring', () => {
  test('every link and button takes focus in DOM order with a 2px accent ring offset 2px', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      (window as unknown as { __focusables: Element[] }).__focusables = [
        ...document.querySelectorAll('a[href], button'),
      ].filter(
        (el) =>
          el.getClientRects().length > 0 &&
          getComputedStyle(el).visibility !== 'hidden',
      );
    });
    const total = await page.evaluate(
      () =>
        (window as unknown as { __focusables: Element[] }).__focusables.length,
    );
    // Skip link, brand, four section links, theme toggle, GitHub, then the page content.
    expect(total).toBeGreaterThan(15);

    for (let step = 0; step < total; step++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const list = (window as unknown as { __focusables: Element[] })
          .__focusables;
        const el = document.activeElement as Element;
        const style = getComputedStyle(el);
        return {
          index: list.indexOf(el),
          style: style.outlineStyle,
          width: style.outlineWidth,
          offset: style.outlineOffset,
          color: style.outlineColor,
        };
      });
      expect(focused, `Tab stop ${step}`).toEqual({
        index: step,
        style: 'solid',
        width: '2px',
        offset: '2px',
        color: ACCENT_RGB,
      });
    }
  });

  test('rings the first stop after the skip link, the brand, in the accent color', async ({
    page,
  }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const brand = page.getByRole('link', { name: 'fabiombarreto' });
    await expect(brand).toBeFocused();
    await expect(brand).toHaveCSS('outline-color', ACCENT_RGB);
  });
});
