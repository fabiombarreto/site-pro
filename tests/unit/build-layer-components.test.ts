// PRPs/prds/stage-3-runtime.prd.md AC-1 Boot and dock text, tokens and copy; AC-17 reserved footer slot
// (phase 2 plan: AC-A1, AC-A2, AC-A7)
// Tokenizer, build-layer copy and the Footer's opt-in reserved slot, through their public exports.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Footer } from '../../src/components/page/Footer';
import { tokenize } from '../../src/components/build/tokenize';
import { buildStrings as b } from '../../src/strings';

const q = '"';
const kinds = (s: string): string =>
  tokenize(s)
    .map((t) => `${t.kind}:${t.text}`)
    .join('|');

describe('command tokenizer', () => {
  it('marks the boot command name as a function followed by punctuation', () => {
    expect(kinds('startSite();')).toBe(
      'function:startSite|punct:(|punct:)|punct:;',
    );
  });

  it('separates the object, the method, the string argument and the punctuation', () => {
    const title = `hero.title(${q}Fabio Barreto.${q})`;
    expect(kinds(title)).toBe(
      `object:hero|punct:.|function:title|punct:(|string:${q}Fabio Barreto.${q}|punct:)`,
    );
  });

  it('marks numbers and the ellipsis placeholder', () => {
    expect(kinds('a.b(12)')).toBe(
      'object:a|punct:.|function:b|punct:(|number:12|punct:)',
    );
    expect(kinds('hero.links([…])')).toBe(
      'object:hero|punct:.|function:links|punct:(|punct:[|comment:…|punct:]|punct:)',
    );
  });

  it('keeps an unterminated string as one string token', () => {
    expect(tokenize(`x.y(${q}abc`).at(-1)).toEqual({
      kind: 'string',
      text: `${q}abc`,
    });
  });

  it.each(['startSite();', `hero.title(${q}A b${q})`, `x.y(${q}abc`, 'p(…)'])(
    'loses no character of %s',
    (command) => {
      expect(
        tokenize(command)
          .map((t) => t.text)
          .join(''),
      ).toBe(command);
    },
  );
});

describe('build-layer copy', () => {
  it('words the logs, the created line and the idle count as the build script shows them', () => {
    expect(b.initializing).toBe('Initializing application...');
    expect(b.openingFile('hero.tsx')).toBe('Opening hero.tsx...');
    expect(b.readingFile('about.md')).toBe('Reading about.md...');
    expect(b.building('projects')).toBe('Building projects…');
    expect(b.created('Hero', '2.31')).toBe('✔ Hero Section created. (2.31s)');
    expect(b.idleCount(1, 5)).toBe('✓ 1/5 sections');
    expect(b.complete(5, '12.3')).toBe('✔ Build complete: 5 sections in 12.3s');
    expect(b.scrollHint).toBe('scroll ↓');
    expect(b.reducedReady).toBe('✔ Ready · motion reduced');
    expect(b.prompt).toBe('❯');
  });

  it('labels every section with its human name', () => {
    expect(b.sectionLabels).toEqual({
      top: 'Hero',
      about: 'About',
      projects: 'Projects',
      stack: 'Stack',
      contact: 'Contact',
    });
  });

  it('contains no em dash', () => {
    const text = JSON.stringify([
      b.initializing,
      b.scrollHint,
      b.reducedReady,
      b.sectionLabels,
    ]);
    expect(text).not.toContain('—');
  });
});

describe('footer reserved build slot', () => {
  const render = (buildSlot?: boolean): string =>
    renderToStaticMarkup(
      createElement(Footer, {
        sourceHref: 'https://example.com/repo',
        owner: 'Owner',
        ...(buildSlot === undefined ? {} : { buildSlot }),
      }),
    );

  it('renders one empty slot when asked', () => {
    const html = render(true);
    expect(html.match(/data-footer-build/g)).toHaveLength(1);
    expect(html).toMatch(/<p[^>]*data-footer-build=""[^>]*><\/p>/);
  });

  it('renders exactly the same markup without the prop as with it set to false', () => {
    expect(render()).toBe(render(false));
    expect(render()).not.toContain('data-footer-build');
  });
});
