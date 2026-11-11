// PRPs/prds/stage-4-sections-effects.prd.md AC-1 and AC-9 (the ASCII and blurred pieces are aria-hidden overlay pieces,
// no animated mask or filter, only opacity, clip-path and transform), AC-3 (no animated filter for the blur),
// AC-12 (the runtime never pulls in the sharp-based image generators) (phase 2 plan: AC-A2, AC-A3, AC-A5)
// Structural contracts of the new overlay pieces, read from the shipped sources: the node test environment has no DOM,
// so the live behavior (overlay placement, cleanup, instant paths) is proven by tests/e2e/image-resolve-hero.spec.ts.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string): string =>
  readFileSync(resolve(process.cwd(), rel), 'utf8');

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const FORBIDDEN =
  /mask-image|filter\s*:|backdrop-filter|transition\s*:|animation\s*:/;

const FILES = [
  'src/components/build/AsciiOverlay.ts',
  'src/components/build/BlurCover.ts',
  'src/runtime/effects.ts',
  'src/runtime/effect-timing.ts',
];

const rule = (css: string, selector: string): string => {
  const escaped = selector.replace(/[.>\s]/g, (c) => `\\${c}`);
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return match?.[1] ?? '';
};

describe('the ASCII and blurred cover overlay pieces', () => {
  it('are created aria-hidden', () => {
    for (const file of [
      'src/components/build/AsciiOverlay.ts',
      'src/components/build/BlurCover.ts',
    ]) {
      expect(read(file), file).toMatch(/'aria-hidden':\s*'true'/);
    }
  });

  it('give the blurred cover image an empty alt text and aria-hidden', () => {
    const source = read('src/components/build/BlurCover.ts');
    expect(source).toMatch(/alt:\s*''/);
    const hidden = source.match(/'aria-hidden':\s*'true'/g) ?? [];
    expect(hidden.length).toBeGreaterThanOrEqual(2);
  });

  it('use no animated mask or filter and no CSS transition or animation', () => {
    for (const file of FILES) {
      expect(stripComments(read(file)), file).not.toMatch(FORBIDDEN);
    }
  });

  it('keep the runtime free of the sharp-based image generators', () => {
    for (const file of FILES) {
      expect(read(file), file).not.toMatch(/images\/(ascii|blur|pipeline)/);
    }
  });
});

describe('the build layer styles of the new pieces', () => {
  const css = read('src/styles/build-layer.css');

  it('declare both overlay classes as absolute, pointer-transparent pieces', () => {
    for (const selector of ['.sp-ascii', '.sp-blur-cover']) {
      const body = rule(css, selector);
      expect(body, selector).not.toBe('');
      expect(body, selector).toMatch(/position:\s*absolute/);
      expect(body, selector).toMatch(/pointer-events:\s*none/);
    }
  });

  it('set the ASCII in the monospace token font and keep its rows from wrapping', () => {
    const body = rule(css, '.sp-ascii');
    expect(body).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(body).toMatch(/white-space:\s*pre/);
  });

  it('size the blurred cover image to its piece', () => {
    const body = rule(css, '.sp-blur-cover > img');
    expect(body).toMatch(/width:\s*100%/);
    expect(body).toMatch(/height:\s*100%/);
  });

  it('use tokens only, with no animation, transition, mask or filter on the new classes', () => {
    for (const selector of [
      '.sp-ascii',
      '.sp-blur-cover',
      '.sp-blur-cover > img',
    ]) {
      const body = rule(css, selector);
      expect(body, selector).not.toMatch(FORBIDDEN);
      expect(body, selector).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(body, selector).not.toMatch(/box-shadow|rgba?\(|hsla?\(/);
    }
  });
});
