// PRPs/prds/stage-2-foundation.prd.md AC-1 Complete static HTML (phase 5 plan: AC-A1)
// PRPs/prds/stage-2-foundation.prd.md AC-2 Navigation without JavaScript (phase 5 plan: AC-A2)
// The served HTML is read without executing any script; the no-JS half then drives a real page.
import { expect, test } from '@playwright/test';
import {
  H2_TITLES,
  NAV_LINKS,
  PROFILE,
  PROJECTS,
  SECTION_IDS,
  STACK_GROUPS,
  textOf,
} from './support/home';

const sectionHtml = (html: string, id: string): string => {
  const match = html.match(
    new RegExp(`<section\\b[^>]*\\bid="${id}"[\\s\\S]*?</section>`),
  );
  if (!match) throw new Error(`section #${id} is missing from the HTML`);
  return match[0];
};

test.describe('static HTML of / (AC-1)', () => {
  let html = '';

  test.beforeAll(async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    html = await response.text();
  });

  test('has one main holding the five sections in order', () => {
    expect(html.match(/<main[\s>]/g) ?? []).toHaveLength(1);
    const main = html.slice(
      html.indexOf('<main'),
      html.indexOf('</main>') + '</main>'.length,
    );
    const ids = [...main.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(ids).toEqual(SECTION_IDS);
  });

  test('has exactly one h1 reading "Fabio Barreto."', () => {
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    expect(h1s).toHaveLength(1);
    expect(textOf(h1s[0]?.[1] ?? '')).toBe('Fabio Barreto.');
  });

  test('has one h2 per later section and labels each section by it', () => {
    const h2s = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
      textOf(m[1] ?? ''),
    );
    expect(h2s).toEqual(H2_TITLES);
    for (const id of SECTION_IDS.slice(1)) {
      expect(html).toMatch(
        new RegExp(`<section\\b[^>]*aria-labelledby="${id}-title"`),
      );
      expect(html).toMatch(new RegExp(`<h2\\b[^>]*\\bid="${id}-title"`));
    }
    expect(html).toMatch(
      /<section\b(?=[^>]*\bid="top")(?=[^>]*aria-label="Introduction")/,
    );
  });

  test('has a per-page title and description from the profile', () => {
    expect(html).toContain(
      '<title>Fabio Barreto - Senior Software Engineer</title>',
    );
    expect(html).toContain(`content="${PROFILE.subtitle}"`);
    expect(html).toMatch(/<meta\b[^>]*name="description"/);
  });

  test('shows the approved hero copy', () => {
    const hero = textOf(sectionHtml(html, 'top'));
    expect(hero).toContain('Fabio Barreto.');
    expect(hero).toContain(PROFILE.role);
    expect(hero).toContain(PROFILE.subtitle);
    expect(hero).toContain('See my work');
    expect(hero).toContain('GitHub');
    expect(hero).toContain('LinkedIn');
  });

  test('shows the approved About text and profile buttons', () => {
    const about = sectionHtml(html, 'about');
    const text = textOf(about);
    for (const paragraph of PROFILE.bio) expect(text).toContain(paragraph);
    expect(about).toContain(`href="${PROFILE.github}"`);
    expect(about).toContain(`href="${PROFILE.linkedin}"`);
  });

  test('shows four project cards with title, summary, tags, year and status', () => {
    const projects = sectionHtml(html, 'projects');
    expect(textOf(projects)).toContain('Things I built and what I learned.');
    const cards = projects.split(/<article\b/).slice(1);
    expect(cards).toHaveLength(PROJECTS.length);
    PROJECTS.forEach((project, i) => {
      const card = cards[i] ?? '';
      const text = textOf(card);
      expect(text, project.slug).toContain(project.title);
      expect(text, project.slug).toContain(project.summary);
      expect(text, project.slug).toContain(project.year);
      expect(text, project.slug).toContain(project.status);
      for (const tag of project.tags) expect(text, tag).toContain(tag);
      expect(card, project.slug).toContain(`href="/projects/${project.slug}"`);
    });
  });

  test('shows the six stack groups with their items in display order', () => {
    const text = textOf(sectionHtml(html, 'stack'));
    let cursor = 0;
    for (const group of STACK_GROUPS) {
      const at = text.indexOf(group.name, cursor);
      expect(at, `group ${group.name}`).toBeGreaterThanOrEqual(0);
      cursor = at + group.name.length;
      for (const item of group.items) {
        const itemAt = text.indexOf(item, cursor);
        expect(itemAt, `${group.name}: ${item}`).toBeGreaterThanOrEqual(0);
        cursor = itemAt + item.length;
      }
    }
  });

  test('shows the Contact lead and the only location text', () => {
    const text = textOf(sectionHtml(html, 'contact'));
    expect(text).toContain(PROFILE.contactLead);
    expect(text).toContain(PROFILE.location);
  });
});

test.describe('navigation without JavaScript (AC-2)', () => {
  test.use({
    javaScriptEnabled: false,
    viewport: { width: 1280, height: 800 },
  });

  for (const link of NAV_LINKS) {
    test(`the ${link.label} nav link sets #${link.id} and shows its h2`, async ({
      page,
    }) => {
      await page.goto('/');
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name: link.label, exact: true })
        .click();
      await expect.poll(() => new URL(page.url()).hash).toBe(`#${link.id}`);
      const heading = page.locator(`#${link.id}-title`);
      await expect
        .poll(() =>
          heading.evaluate((el) => {
            const box = el.getBoundingClientRect();
            return box.top >= 0 && box.bottom <= window.innerHeight;
          }),
        )
        .toBe(true);
    });
  }

  test('shows every section text', async ({ page }) => {
    await page.goto('/');
    const main = page.getByRole('main');
    await expect(main.getByText(PROFILE.role, { exact: true })).toBeVisible();
    await expect(
      main.getByText(PROFILE.subtitle, { exact: true }),
    ).toBeVisible();
    for (const paragraph of PROFILE.bio) {
      await expect(main.getByText(paragraph, { exact: true })).toBeVisible();
    }
    for (const title of H2_TITLES) {
      await expect(
        main.getByRole('heading', { level: 2, name: title }),
      ).toBeVisible();
    }
    for (const project of PROJECTS) {
      await expect(
        main.getByText(project.summary, { exact: true }),
      ).toBeVisible();
    }
    for (const group of STACK_GROUPS) {
      await expect(
        main.getByRole('heading', { level: 3, name: group.name, exact: true }),
      ).toBeVisible();
    }
    await expect(main.getByText(PROFILE.contactLead)).toBeVisible();
    await expect(
      main.getByText(PROFILE.location, { exact: true }),
    ).toBeVisible();
  });

  test('points each project card title at /projects/<slug>', async ({
    page,
  }) => {
    await page.goto('/');
    for (const project of PROJECTS) {
      const link = page.locator(`a[href="/projects/${project.slug}"]`);
      await expect(link, project.slug).toHaveCount(1);
      await expect(link, project.slug).toHaveText(project.title);
    }
  });
});
