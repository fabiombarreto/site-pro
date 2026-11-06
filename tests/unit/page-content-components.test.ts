// PRPs/prds/stage-2-foundation.prd.md AC-13 photo placeholder (phase 4 plan:
// AC-A6), AC-14 project card and header (AC-A7), AC-8 footer and privacy (AC-A8)
// Static-render contracts of Photo, ProjectCard, ProjectHeader and Footer, plus
// the placeholder SVG and the asset resolver.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Footer } from '../../src/components/page/Footer';
import { Photo } from '../../src/components/page/Photo';
import { ProjectCard } from '../../src/components/page/ProjectCard';
import { ProjectHeader } from '../../src/components/page/ProjectHeader';
import { resolveAssetUrl } from '../../src/components/page/resolve-asset';

const repo = 'https://github.com/fabiombarreto/PRPs-agentic-eng';
const project = {
  title: 'relay',
  slug: 'relay',
  year: '2026',
  summary:
    'A Claude Code plugin that takes a feature from PRD to pull request.',
  tags: ['claude-code', 'ai-agents', 'node'],
  status: 'active',
} as const;

const card = (extra: { repo?: string; cover?: string } = {}): string =>
  renderToStaticMarkup(createElement(ProjectCard, { ...project, ...extra }));
const header = (
  extra: { repo?: string; cover?: string; backHref?: string } = {},
): string =>
  renderToStaticMarkup(createElement(ProjectHeader, { ...project, ...extra }));

describe('placeholder photo asset', () => {
  const svg = readFileSync(
    resolve(process.cwd(), 'src/assets/photo-placeholder-body.svg'),
    'utf8',
  );

  it('is a 900 x 1600 canvas, which is 9:16', () => {
    expect(svg).toMatch(/<svg\b[^>]*\swidth="900"/);
    expect(svg).toMatch(/<svg\b[^>]*\sheight="1600"/);
    expect(svg).toMatch(/<svg\b[^>]*\sviewBox="0 0 900 1600"/);
    expect(900 / 1600).toBe(9 / 16);
  });

  it('is transparent: no rect paints the whole canvas', () => {
    const rects = svg.match(/<rect\b[^>]*>/g) ?? [];
    for (const rect of rects) {
      expect(rect).not.toMatch(/width="(?:100%|900)"/);
    }
  });

  it('paints the silhouette with a gradient rather than a flat color', () => {
    expect(svg).toContain('<linearGradient');
    expect(svg).toContain('fill="url(#body)"');
  });
});

describe('resolveAssetUrl', () => {
  it('resolves the profile photo path as stored, without a leading slash', () => {
    const url = resolveAssetUrl('src/assets/photo-placeholder-body.svg');
    expect(url).toMatch(/photo-placeholder-body[\w.-]*\.svg|^data:image\/svg/);
  });

  it('resolves the same asset with or without the leading slash', () => {
    expect(resolveAssetUrl('/src/assets/photo-placeholder-body.svg')).toBe(
      resolveAssetUrl('src/assets/photo-placeholder-body.svg'),
    );
  });

  it('returns undefined for a missing path or no path', () => {
    expect(resolveAssetUrl('src/assets/does-not-exist.svg')).toBeUndefined();
    expect(resolveAssetUrl(undefined)).toBeUndefined();
    expect(resolveAssetUrl('')).toBeUndefined();
  });
});

describe('Photo', () => {
  it('renders the cutout built state with explicit 900 x 1600 attributes', () => {
    const html = renderToStaticMarkup(createElement(Photo, { src: '/p.svg' }));
    expect(html).toMatch(/<div class="sp-photo is-cutout is-built">/);
    expect(html).toMatch(
      /<img class="sp-photo-img" src="\/p\.svg" alt="" width="900" height="1600"\s*\/?>/,
    );
    expect(html).not.toContain('style=');
  });

  it('passes the requested height only as the --photo-h custom property', () => {
    const html = renderToStaticMarkup(
      createElement(Photo, { src: '/p.svg', height: 480 }),
    );
    expect(html).toContain('style="--photo-h:480px"');
    expect(html).not.toMatch(/(?:^|[\s;"])(?:width|height):/);
  });

  it('adds the glow class and a described alt text when asked', () => {
    const html = renderToStaticMarkup(
      createElement(Photo, { src: '/p.svg', alt: 'Portrait', glow: true }),
    );
    expect(html).toContain('class="sp-photo is-cutout is-built has-glow"');
    expect(html).toContain('alt="Portrait"');
  });
});

describe('ProjectCard', () => {
  it('links the title to the project page and shows the card facts', () => {
    const html = card({ repo });
    expect(html).toMatch(/^<article class="sp-card is-link">/);
    expect(html).toContain(
      '<h3 class="sp-card-title text-xl"><a class="sp-card-link" href="/projects/relay">relay</a></h3>',
    );
    expect(html).toContain('<span class="sp-card-year mono-xs">2026</span>');
    expect(html).toContain(
      `<p class="sp-card-summary text-md">${project.summary}</p>`,
    );
    for (const tag of project.tags) {
      expect(html).toContain(`<span class="sp-tag mono-xs">${tag}</span>`);
    }
    expect(html.match(/class="sp-tag /g)).toHaveLength(3);
    expect(html).toContain('<span class="sp-status sp-status-active mono-xs">');
  });

  it('adds an external repo link next to the status', () => {
    const html = card({ repo });
    const link = html.match(/<a class="sp-link sp-card-repo text-sm"[^>]*>/);
    expect(link).not.toBeNull();
    expect(link![0]).toContain(`href="${repo}"`);
    expect(link![0]).toContain('target="_blank"');
    expect(link![0]).toContain('rel="noopener noreferrer"');
    expect(html).toMatch(/>repo<svg[^>]*aria-hidden="true"/);
  });

  it('leaves out the repo link when there is no repo', () => {
    expect(card()).not.toContain('sp-card-repo');
  });

  it('shows a decorative CSS cover labelled with the slug when no cover is set', () => {
    const html = card();
    expect(html).toContain(
      '<div class="sp-card-cover"><div class="sp-cover-ph" aria-hidden="true"><span class="mono-sm">relay</span></div></div>',
    );
    expect(html).not.toContain('<img');
  });

  it('shows the given cover as a decorative image instead', () => {
    const html = card({ cover: '/_astro/relay.png' });
    expect(html).toMatch(/<img src="\/_astro\/relay\.png" alt=""\s*\/?>/);
    expect(html).not.toContain('sp-cover-ph');
  });

  it('contains one link to the project and no email, form or handler', () => {
    const html = card({ repo });
    expect(html.match(/href="\/projects\/relay"/g)).toHaveLength(1);
    expect(html).not.toMatch(/mailto:|\btel:|<form|\bon[a-z]+=/);
  });
});

describe('ProjectHeader', () => {
  it('links back to the projects section by default', () => {
    const html = header();
    const back = html.match(/<a class="sp-link sp-back text-sm"[^>]*>/);
    expect(back).not.toBeNull();
    expect(back![0]).toContain('href="/#projects"');
    expect(html).toMatch(/All projects<\/a>/);
  });

  it('honors a custom back link', () => {
    expect(header({ backHref: '/' })).toContain(
      '<a class="sp-link sp-back text-sm" href="/">',
    );
  });

  it('renders the title as the single h1, then summary, year, status and tags', () => {
    const html = header();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('<h1 class="sp-project-title text-3xl">relay</h1>');
    expect(html).toContain(
      `<p class="sp-project-summary text-lg">${project.summary}</p>`,
    );
    expect(html).toContain('<span class="sp-card-year mono-xs">2026</span>');
    expect(html).toContain('sp-status-active');
    expect(html.match(/class="sp-tag /g)).toHaveLength(3);
  });

  it('adds an external secondary Repo button only when there is a repo', () => {
    const withRepo = header({ repo });
    const button = withRepo.match(/<a class="sp-btn sp-btn-secondary[^>]*>/);
    expect(button).not.toBeNull();
    expect(button![0]).toContain(`href="${repo}"`);
    expect(button![0]).toContain('target="_blank"');
    expect(withRepo).toContain('<span>Repo</span>');
    expect(header()).not.toContain('sp-btn');
  });

  it('shows the slug-labelled CSS cover, or the given cover image', () => {
    expect(header()).toContain(
      '<div class="sp-project-cover"><div class="sp-cover-ph" aria-hidden="true"><span class="mono-sm">relay</span></div></div>',
    );
    const withCover = header({ cover: '/_astro/relay.png' });
    expect(withCover).toMatch(/<img src="\/_astro\/relay\.png" alt=""\s*\/?>/);
    expect(withCover).not.toContain('sp-cover-ph');
  });
});

describe('Footer', () => {
  const html = renderToStaticMarkup(
    createElement(Footer, {
      sourceHref: 'https://github.com/fabiombarreto/site-pro',
      owner: 'Fabio Barreto',
    }),
  );

  it('shows only the external Source link and the copyright line', () => {
    expect(html).toMatch(/^<footer class="sp-footer text-sm">/);
    const anchors = html.match(/<a [^>]*>/g) ?? [];
    expect(anchors).toHaveLength(1);
    expect(anchors[0]).toContain(
      'href="https://github.com/fabiombarreto/site-pro"',
    );
    expect(anchors[0]).toContain('target="_blank"');
    expect(anchors[0]).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Source<svg');
    expect(html).toContain('<span>© 2026 Fabio Barreto</span>');
  });

  it('has no build summary, Replay control or button', () => {
    expect(html).not.toMatch(/replay|built live/i);
    expect(html).not.toContain('<button');
    expect(html).not.toMatch(/mailto:|\btel:|<form/);
  });
});
