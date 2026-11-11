// PRPs/prds/stage-2-foundation.prd.md AC-14 Project pages and 404, project pages (phase 6 plan: AC-A1, AC-A2)
// PRPs/prds/stage-2-foundation.prd.md AC-2 every project card link loads with HTTP 200 (phase 6 plan: AC-A5)
import { expect, test } from '@playwright/test';
import { PROJECTS, textOf } from './support/home';

const REPOS: Record<string, string> = {
  relay: 'https://github.com/fabiombarreto/PRPs-agentic-eng',
  'ai-track-record': 'https://github.com/fabiombarreto/ai-track-record',
  'praesto-sum': 'https://github.com/fabiombarreto/praesto-sum',
  'site-pro': 'https://github.com/fabiombarreto/site-pro',
};

const FORK_NOTE =
  'The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.';

// Approved docs/09 "Project pages" text: the section headings and one sentence per page.
const BODY: Record<string, { headings: string[]; sentence: string }> = {
  relay: {
    headings: ['The problem', 'How it works', 'What I learned'],
    sentence: 'I audited 270 review runs.',
  },
  'ai-track-record': {
    headings: ['The question', 'The method', 'Status'],
    sentence: 'The first public results are due in December 2026.',
  },
  'praesto-sum': {
    headings: [
      'What it is',
      'Why one user',
      'Why Cloudflare Workers',
      'Installing it',
    ],
    sentence: 'Praesto Sum is a personal assistant for one user.',
  },
  'site-pro': {
    headings: ['The idea', 'How it works', 'How I built it'],
    sentence: 'This site builds itself while you watch.',
  },
};

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('every project card link resolves (AC-2)', () => {
  test('the home page links four distinct /projects/<slug> pages that load with 200', async ({
    request,
  }) => {
    const home = await request.get('/');
    expect(home.status()).toBe(200);
    const homeHtml = await home.text();
    const links = homeHtml.matchAll(/href="(\/projects\/[a-z0-9-]+)"/g);
    const hrefs = [...new Set([...links].map((m) => m[1] ?? ''))];
    expect(hrefs.sort()).toEqual(
      PROJECTS.map((p) => `/projects/${p.slug}`).sort(),
    );
    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
    }
  });
});

for (const project of PROJECTS) {
  test.describe(`/projects/${project.slug} (AC-14)`, () => {
    let html = '';

    test.beforeAll(async ({ request }) => {
      const response = await request.get(`/projects/${project.slug}`);
      expect(response.status()).toBe(200);
      html = await response.text();
    });

    test('has one h1 reading the project title and one main skip target', () => {
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
      expect(h1s).toHaveLength(1);
      expect(textOf(h1s[0]?.[1] ?? '')).toBe(project.title);
      expect(html.match(/<main[\s>]/g) ?? []).toHaveLength(1);
      expect(html).toMatch(
        /<main\b(?=[^>]*\bid="main")(?=[^>]*\btabindex="-1")/,
      );
    });

    test('has a per-page title and a description equal to the summary', () => {
      expect(html).toContain(`<title>${project.title} - Fabio Barreto</title>`);
      expect(html).toContain(`name="description" content="${project.summary}"`);
    });

    test('shows the back link, summary, year, status, tags, Repo link and cover label', async ({
      page,
    }) => {
      await page.goto(`/projects/${project.slug}`);
      const main = page.getByRole('main');

      const back = main.getByRole('link', { name: 'All projects' });
      await expect(back).toHaveAttribute('href', '/#projects');

      await expect(main.locator('.sp-project-summary')).toHaveText(
        project.summary,
      );
      await expect(main.locator('.sp-card-year')).toHaveText(project.year);
      await expect(main.locator('.sp-status')).toHaveText(project.status);
      await expect(main.locator('.sp-project-facts .sp-tag')).toHaveText(
        project.tags,
      );

      const repo = main.getByRole('link', { name: 'Repo' });
      await expect(repo).toHaveCount(1);
      await expect(repo).toHaveAttribute('href', REPOS[project.slug] ?? '');
      await expect(repo).toHaveAttribute('target', '_blank');
      await expect(repo).toHaveAttribute('rel', 'noopener noreferrer');

      await expect(main.locator('.sp-cover-ph')).toHaveCount(1);
      await expect(main.locator('.sp-cover-ph span')).toHaveText(project.slug);
    });

    // PRPs/prds/stage-4-sections-effects.prd.md AC-13 Project pages (phase 4 plan: AC-A1, AC-A2, AC-A4)
    test('renders the approved body in one prose block beneath the h1', async ({
      page,
    }) => {
      await page.goto(`/projects/${project.slug}`);
      const prose = page.locator('main .sp-prose');
      await expect(prose).toHaveCount(1);
      await expect(prose.locator('h2')).toHaveText(
        BODY[project.slug]?.headings ?? [],
      );
      await expect(prose.locator('h1')).toHaveCount(0);
      await expect(prose).toContainText(BODY[project.slug]?.sentence ?? '');
    });

    if (project.slug === 'relay') {
      test('states the fork of Wirasm/prp inside the prose body', async ({
        page,
      }) => {
        await page.goto('/projects/relay');
        await expect(page.locator('main .sp-prose')).toContainText(FORK_NOTE);
      });
    } else {
      test('does not carry the relay fork note', () => {
        expect(textOf(html)).not.toContain('fork of Wirasm/prp');
      });
    }
  });
}

test.describe('project pages stay in the page register with no profile leaks', () => {
  for (const project of PROJECTS) {
    test(`/projects/${project.slug} has the footer, no build layer, no form, mailto or tel`, async ({
      request,
    }) => {
      const response = await request.get(`/projects/${project.slug}`);
      const html = await response.text();
      expect(html).toMatch(/<footer\b/);
      expect(html).not.toMatch(
        /\bsp-(boot|dock|dock-fab|window|select|skel)\b/,
      );
      expect(html).not.toContain('data-build');
      expect(html).not.toMatch(/<form\b|mailto:|tel:/i);
      expect(html).not.toMatch(/(Previous|Next) project/i);
    });
  }
});
