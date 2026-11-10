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
import type { ImageSource } from '../../src/components/page/image-source';

// Stage 4 Phase 1 (PRD AC-5): the components take pipeline image objects, not URLs.
const svgPhoto: ImageSource = { src: '/p.svg', width: 900, height: 1600 };
const rasterPhoto: ImageSource = {
  src: '/_astro/photo.abc123.png',
  width: 540,
  height: 960,
  sizes: '(min-width: 1024px) 540px, (min-width: 768px) 428px, 270px',
  sources: [
    {
      type: 'image/avif',
      srcset: '/_astro/photo-270.avif 270w, /_astro/photo-540.avif 540w',
    },
    {
      type: 'image/webp',
      srcset: '/_astro/photo-270.webp 270w, /_astro/photo-540.webp 540w',
    },
  ],
};
// A cover without responsive sources (an SVG passes through as it is).
const plainCover: ImageSource = {
  src: '/_astro/relay.svg',
  width: 960,
  height: 540,
};
const rasterCover: ImageSource = {
  src: '/_astro/relay.abc123.png',
  width: 960,
  height: 540,
  sizes: '(min-width: 768px) 50vw, 100vw',
  sources: [
    {
      type: 'image/avif',
      srcset: '/_astro/relay-480.avif 480w, /_astro/relay-960.avif 960w',
    },
    {
      type: 'image/webp',
      srcset: '/_astro/relay-480.webp 480w, /_astro/relay-960.webp 960w',
    },
  ],
};

const imgTag = (html: string): string => {
  const tag = html.match(/<img\b[^>]*>/);
  expect(tag, 'an <img> is rendered').not.toBeNull();
  return tag![0];
};

// An attribute value of one tag; the name is matched case-insensitively
// because React writes `srcSet` in camel case.
const attr = (tag: string, name: string): string | undefined =>
  new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag)?.[1];

// The <source> elements of a picture, in document order.
const sourceTags = (html: string): string[] =>
  html.match(/<source\b[^>]*>/g) ?? [];

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

const card = (extra: { repo?: string; cover?: ImageSource } = {}): string =>
  renderToStaticMarkup(createElement(ProjectCard, { ...project, ...extra }));
const header = (
  extra: { repo?: string; cover?: ImageSource; backHref?: string } = {},
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

describe('Photo', () => {
  it('renders the cutout built state with the intrinsic dimensions of the image', () => {
    const html = renderToStaticMarkup(
      createElement(Photo, { image: svgPhoto }),
    );
    expect(html).toMatch(/<div class="sp-photo is-cutout is-built">/);
    const img = imgTag(html);
    expect(img).toContain('class="sp-photo-img"');
    expect(img).toContain('src="/p.svg"');
    expect(img).toContain('alt=""');
    expect(img).toContain('width="900"');
    expect(img).toContain('height="1600"');
    expect(html).not.toContain('style=');
  });

  it('takes the intrinsic dimensions from the image, not from a constant', () => {
    const img = imgTag(
      renderToStaticMarkup(createElement(Photo, { image: rasterPhoto })),
    );
    expect(img).toContain('width="540"');
    expect(img).toContain('height="960"');
    expect(img).not.toContain('width="900"');
  });

  it('passes the requested height only as the --photo-h custom property', () => {
    const html = renderToStaticMarkup(
      createElement(Photo, { image: svgPhoto, height: 480 }),
    );
    expect(html).toContain('style="--photo-h:480px"');
    expect(html).not.toMatch(/(?:^|[\s;"])(?:width|height):/);
  });

  it('adds the glow class and a described alt text when asked', () => {
    const html = renderToStaticMarkup(
      createElement(Photo, { image: svgPhoto, alt: 'Portrait', glow: true }),
    );
    expect(html).toContain('class="sp-photo is-cutout is-built has-glow"');
    expect(html).toContain('alt="Portrait"');
  });

  it('serves the hero photo eager with high fetch priority, never lazy, when it has priority', () => {
    const img = imgTag(
      renderToStaticMarkup(
        createElement(Photo, { image: rasterPhoto, priority: true }),
      ),
    );
    expect(img).toContain('loading="eager"');
    expect(img).toContain('fetchpriority="high"');
    expect(img).not.toContain('loading="lazy"');
  });

  it('loads a photo without priority lazily and without a fetch priority', () => {
    const img = imgTag(
      renderToStaticMarkup(createElement(Photo, { image: rasterPhoto })),
    );
    expect(img).toContain('loading="lazy"');
    expect(img).not.toContain('fetchpriority');
  });

  it('offers AVIF then WebP candidates in a picture for a raster source', () => {
    const html = renderToStaticMarkup(
      createElement(Photo, { image: rasterPhoto, priority: true }),
    );
    expect(html).toMatch(/<div class="sp-photo[^"]*"><picture>/);
    const sources = sourceTags(html);
    expect(sources).toHaveLength(2);
    expect(attr(sources[0] ?? '', 'type')).toBe('image/avif');
    expect(attr(sources[0] ?? '', 'srcset')).toBe(
      '/_astro/photo-270.avif 270w, /_astro/photo-540.avif 540w',
    );
    expect(attr(sources[1] ?? '', 'type')).toBe('image/webp');
    expect(attr(sources[1] ?? '', 'srcset')).toBe(
      '/_astro/photo-270.webp 270w, /_astro/photo-540.webp 540w',
    );
    for (const source of sources) {
      expect(attr(source, 'sizes')).toBe(rasterPhoto.sizes);
    }
    expect(html.indexOf('<img')).toBeGreaterThan(html.lastIndexOf('<source'));
  });

  it('serves an SVG photo as it is, without a picture or sources', () => {
    const html = renderToStaticMarkup(
      createElement(Photo, { image: svgPhoto, priority: true }),
    );
    expect(html).not.toContain('<picture');
    expect(html).not.toContain('<source');
    expect(imgTag(html)).toContain('src="/p.svg"');
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

  it('shows the given cover as a decorative lazy image with intrinsic dimensions instead', () => {
    const html = card({ cover: plainCover });
    const img = imgTag(html);
    expect(attr(img, 'src')).toBe('/_astro/relay.svg');
    expect(attr(img, 'alt')).toBe('');
    expect(attr(img, 'width')).toBe('960');
    expect(attr(img, 'height')).toBe('540');
    expect(attr(img, 'loading')).toBe('lazy');
    expect(html).not.toContain('sp-cover-ph');
    expect(html).not.toContain('<picture');
  });

  it('offers AVIF then WebP candidates for a raster cover', () => {
    const html = card({ cover: rasterCover });
    expect(html).toMatch(/<div class="sp-card-cover"><picture>/);
    const sources = sourceTags(html);
    expect(sources.map((s) => attr(s, 'type'))).toEqual([
      'image/avif',
      'image/webp',
    ]);
    expect(attr(sources[0] ?? '', 'srcset')).toBe(
      '/_astro/relay-480.avif 480w, /_astro/relay-960.avif 960w',
    );
    for (const source of sources) {
      expect(attr(source, 'sizes')).toBe('(min-width: 768px) 50vw, 100vw');
    }
    expect(attr(imgTag(html), 'loading')).toBe('lazy');
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
    const withCover = header({ cover: plainCover });
    const img = imgTag(withCover);
    expect(attr(img, 'src')).toBe('/_astro/relay.svg');
    expect(attr(img, 'alt')).toBe('');
    expect(attr(img, 'width')).toBe('960');
    expect(attr(img, 'height')).toBe('540');
    expect(attr(img, 'loading')).toBe('lazy');
    expect(withCover).not.toContain('sp-cover-ph');
  });

  it('offers AVIF then WebP candidates for a raster cover', () => {
    const html = header({ cover: rasterCover });
    expect(html).toMatch(/<div class="sp-project-cover"><picture>/);
    expect(sourceTags(html).map((s) => attr(s, 'type'))).toEqual([
      'image/avif',
      'image/webp',
    ]);
    expect(attr(imgTag(html), 'loading')).toBe('lazy');
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
