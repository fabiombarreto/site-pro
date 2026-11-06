// PRPs/prds/stage-2-foundation.prd.md AC-9 tokens only (phase 4 plan: AC-A1),
// AC-3 focus ring kept (AC-A4), AC-12 micro-interactions and reduced motion
// (AC-A5), AC-6 menu breakpoint (AC-A3), AC-13 photo box (AC-A6), AC-8 privacy
// (AC-A8)
// Source-level contracts of the phase 4 stylesheets and component modules.
// Color and box-shadow literals are already scanned across all of src/ by
// design-tokens.test.ts.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (rel: string): string => readFileSync(resolve(root, rel), 'utf8');
const pageDir = 'src/components/page';

const phase4Css = [
  'Actions.css',
  'Footer.css',
  'Labels.css',
  'NavBar.css',
  'Photo.css',
  'ProjectCard.css',
  'ProjectHeader.css',
  'Prose.css',
  'SectionHeading.css',
];
const css = (name: string): string => read(`${pageDir}/${name}`);

const phase4Sources = readdirSync(resolve(root, pageDir)).filter(
  (name) => /\.(ts|tsx)$/.test(name) && name !== 'Backdrop.tsx',
);

const tokenFiles = ['tokens', 'base', 'fonts']
  .map((name) => read(`src/styles/${name}.css`))
  .join('\n');
const definedTokens = new Set(
  [...tokenFiles.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
);

const reducedMotionBlock = (name: string): string => {
  const match = css(name).match(
    /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/,
  );
  expect(match, `${name} has a reduced motion block`).not.toBeNull();
  return match![1];
};

describe.each(phase4Css)('%s', (name) => {
  const text = css(name);

  it('reads only tokens that exist in the token, base or font files', () => {
    const own = new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    const used = [...text.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
    for (const token of used) {
      const known =
        definedTokens.has(token) || own.has(token) || token === '--photo-h';
      expect(known, `${name} uses ${token}`).toBe(true);
    }
  });

  it('never removes the global focus ring', () => {
    expect(text).not.toMatch(/outline\s*:\s*(?:none|0)\b/);
    expect(text).not.toMatch(/outline-style\s*:\s*none/);
  });

  it('only transitions transform, opacity or colors in 150 to 300 ms', () => {
    const allowed = [
      'transform',
      'opacity',
      'color',
      'background-color',
      'border-color',
    ];
    const declarations = [...text.matchAll(/transition\s*:\s*([^;]+);/g)]
      .map((m) => m[1].trim())
      .filter((value) => value !== 'none');
    for (const declaration of declarations) {
      const entries = [...declaration.matchAll(/([a-z-]+)\s+(\d+)ms/g)];
      expect(entries.length, declaration).toBeGreaterThan(0);
      for (const [, property, duration] of entries) {
        expect(allowed, declaration).toContain(property);
        expect(Number(duration), declaration).toBeGreaterThanOrEqual(150);
        expect(Number(duration), declaration).toBeLessThanOrEqual(300);
      }
    }
  });
});

describe('reduced motion', () => {
  it('stops the button transition', () => {
    expect(reducedMotionBlock('Actions.css')).toMatch(
      /\.sp-btn\s*\{[^}]*transition:\s*none;/,
    );
  });

  it('stops the card lift and the cover zoom', () => {
    const block = reducedMotionBlock('ProjectCard.css');
    expect(block).toMatch(
      /\.sp-card,\s*\.sp-card-cover > \*\s*\{[^}]*transition:\s*none;/,
    );
    expect(block).toMatch(
      /\.sp-card\.is-link:hover,\s*\.sp-card\.is-link:focus-within\s*\{[^}]*transform:\s*none;/,
    );
    expect(block).toMatch(
      /\.sp-card\.is-link:hover \.sp-card-cover > \*\s*\{[^}]*transform:\s*none;/,
    );
  });

  it('lifts the card by 3px and zooms the cover by 1.03 outside reduced motion', () => {
    const text = css('ProjectCard.css');
    expect(text).toMatch(
      /\.sp-card\.is-link:hover,\s*\.sp-card\.is-link:focus-within\s*\{[^}]*transform:\s*translateY\(-3px\);[^}]*border-color:\s*var\(--accent\);/,
    );
    expect(text).toMatch(
      /\.sp-card-cover > \*\s*\{[^}]*transform:\s*scale\(1\.03\);/,
    );
  });
});

describe('layout contracts', () => {
  it('shows the section links from 768px and the menu button below it', () => {
    const text = css('NavBar.css');
    const below = text.match(/@media \(max-width: 767px\)\s*\{([\s\S]*?)\n\}/);
    const above = text.match(/@media \(min-width: 768px\)\s*\{([\s\S]*?)\n\}/);
    expect(below).not.toBeNull();
    expect(above).not.toBeNull();
    expect(below![1]).toMatch(/\.sp-nav-links\s*\{[^}]*display:\s*none;/);
    expect(above![1]).toMatch(
      /\.sp-menu-toggle,\s*\.sp-menu\s*\{[^}]*display:\s*none;/,
    );
  });

  it('places the menu popover under the nav bar', () => {
    expect(css('NavBar.css')).toMatch(
      /\.sp-menu\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*var\(--nav-height\) 0 auto 0;[^}]*margin:\s*0;/,
    );
  });

  it('keeps the photo box 9:16 and the cover box 16:9 from aspect-ratio', () => {
    expect(css('Photo.css')).toMatch(
      /\.sp-photo\s*\{[^}]*aspect-ratio:\s*9 \/ 16;/,
    );
    expect(css('ProjectCard.css')).toMatch(
      /\.sp-card-cover\s*\{[^}]*aspect-ratio:\s*16 \/ 9;/,
    );
  });
});

describe('component modules', () => {
  it('lists the phase 4 component files', () => {
    for (const file of [
      'Button.tsx',
      'Footer.tsx',
      'IconLink.tsx',
      'MobileMenu.tsx',
      'NavBar.tsx',
      'Photo.tsx',
      'ProjectCard.tsx',
      'ProjectHeader.tsx',
      'Prose.tsx',
      'SectionHeading.tsx',
      'StackChip.tsx',
      'StackGroup.tsx',
      'StatusBadge.tsx',
      'Tag.tsx',
      'TextLink.tsx',
    ]) {
      expect(phase4Sources, file).toContain(file);
    }
  });

  it('has no email, phone link, form, handler or palette button', () => {
    for (const file of phase4Sources) {
      expect(read(`${pageDir}/${file}`), file).not.toMatch(
        /mailto:|\btel:|<form|onClick|onChange|onSubmit|⌘K/,
      );
    }
  });

  it('uses no client directive and no any type', () => {
    for (const file of phase4Sources) {
      const text = read(`${pageDir}/${file}`);
      expect(text, file).not.toMatch(/client:(?:load|idle|visible|only)/);
      expect(text, file).not.toMatch(/:\s*any\b|\bas any\b|<any>/);
    }
  });
});
