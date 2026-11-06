// PRPs/prds/stage-2-foundation.prd.md AC-4 Themes without a flash (phase 2 plan: AC-A1, AC-A2)
// AC-13 (phase 2 plan: AC-A8) Backdrop is decorative
// Theme parsing, accessible names and the statically rendered components.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Backdrop, DEFAULT_GLOWS } from '../../src/components/page/Backdrop';
import { ThemeToggle } from '../../src/components/page/ThemeToggle';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  colorSchemeFor,
  otherTheme,
  parseTheme,
  themeToggleLabel,
} from '../../src/scripts/theme';

describe('theme preference', () => {
  it('stores the choice under sp-theme and defaults to midnight', () => {
    expect(THEME_STORAGE_KEY).toBe('sp-theme');
    expect(DEFAULT_THEME).toBe('midnight');
  });

  it('accepts only the exact stored value "daylight" as Daylight', () => {
    expect(parseTheme('daylight')).toBe('daylight');
    expect(parseTheme('midnight')).toBe('midnight');
    for (const bad of ['Daylight', 'light', '', null, undefined, 1, {}]) {
      expect(parseTheme(bad)).toBe('midnight');
    }
  });

  it('flips between the two themes', () => {
    expect(otherTheme('midnight')).toBe('daylight');
    expect(otherTheme('daylight')).toBe('midnight');
  });

  it('maps each theme to its native color scheme', () => {
    expect(colorSchemeFor('midnight')).toBe('dark');
    expect(colorSchemeFor('daylight')).toBe('light');
  });
});

describe('theme toggle accessible name', () => {
  it('offers Daylight while in Midnight and Midnight while in Daylight', () => {
    expect(themeToggleLabel('midnight')).toBe('Switch to the Daylight theme');
    expect(themeToggleLabel('daylight')).toBe('Switch to the Midnight theme');
  });

  it('renders statically as a button named for the Midnight default', () => {
    const html = renderToStaticMarkup(createElement(ThemeToggle));
    expect(html).toMatch(/^<button[^>]*\btype="button"/);
    expect(html).toContain('aria-label="Switch to the Daylight theme"');
    expect(html).toContain('title="Switch to the Daylight theme"');
    expect(html).toContain('data-theme-toggle');
  });

  it('keeps decorative icons out of the accessibility tree', () => {
    const html = renderToStaticMarkup(createElement(ThemeToggle));
    const icons = html.match(/<svg[^>]*>/g) ?? [];
    expect(icons).toHaveLength(2);
    for (const icon of icons) expect(icon).toContain('aria-hidden="true"');
  });
});

describe('Backdrop', () => {
  it('is aria-hidden and renders one glow per entry', () => {
    const html = renderToStaticMarkup(
      createElement(Backdrop, { glows: DEFAULT_GLOWS }),
    );
    expect(html).toMatch(/^<div[^>]*\baria-hidden="true"/);
    expect(html.match(/class="sp-glow/g)).toHaveLength(DEFAULT_GLOWS.length);
  });

  it('renders no glow without a list and honors grain=false', () => {
    const html = renderToStaticMarkup(
      createElement(Backdrop, { grain: false }),
    );
    expect(html).not.toContain('sp-glow');
    expect(html).not.toContain('has-grain');
  });

  it('uses both glow tones and sizes that scale from CSS only', () => {
    const html = renderToStaticMarkup(
      createElement(Backdrop, { glows: DEFAULT_GLOWS }),
    );
    expect(html).toContain('sp-glow is-2');
    expect(html).toContain('--glow-size:900');
    expect(html).not.toMatch(/(?:^|[\s;"])(?:width|height):/);
  });
});
