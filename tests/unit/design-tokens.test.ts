// PRPs/prds/stage-2-foundation.prd.md AC-9 Tokens only (phase 2 plan: AC-A3)
// AC-5 contrast risk mitigation (phase 2 plan: AC-A6), AC-3 focus ring (AC-A4),
// AC-12 reduced motion (AC-A5), AC-10 self-hosted fonts (AC-A7)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (rel: string): string => readFileSync(resolve(root, rel), 'utf8');

type Rgba = [number, number, number, number];

const declarations = (block: string): Map<string, string> =>
  new Map(
    [...block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [
      m[1],
      m[2].trim(),
    ]),
  );

const tokensCss = read('src/styles/tokens.css');
const themeBlock = (re: RegExp): Map<string, string> => {
  const match = tokensCss.match(re);
  expect(match, `block ${re}`).not.toBeNull();
  return declarations(match![1]);
};
const themes = {
  midnight: themeBlock(/:root,\s*\[data-theme='midnight'\]\s*\{([^}]*)\}/),
  daylight: themeBlock(/\[data-theme='daylight'\]\s*\{([^}]*)\}/),
};

const parseHex = (hex: string): Rgba => {
  expect(hex, 'token is a hex color').toMatch(
    /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i,
  );
  const part = (i: number): number => parseInt(hex.slice(i, i + 2), 16);
  const h = hex.slice(1);
  return [
    part(1),
    part(3),
    part(5),
    h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  ];
};

const over = (below: Rgba, above: Rgba): Rgba => {
  const a = above[3];
  return [
    above[0] * a + below[0] * (1 - a),
    above[1] * a + below[1] * (1 - a),
    above[2] * a + below[2] * (1 - a),
    1,
  ];
};

const luminance = ([r, g, b]: Rgba): number => {
  const lin = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const contrast = (a: Rgba, b: Rgba): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each(['midnight', 'daylight'] as const)('%s theme', (name) => {
  const tokens = themes[name];
  const color = (token: string): Rgba => {
    const value = tokens.get(token);
    expect(value, `${name} defines ${token}`).toBeDefined();
    return parseHex(value!);
  };

  it.each([
    ['--fg', '--bg'],
    ['--fg', '--bg-raised'],
    ['--fg-muted', '--bg'],
    ['--fg-muted', '--bg-raised'],
    ['--accent-fg', '--bg'],
    ['--on-accent', '--accent'],
  ])('keeps %s over %s at 4.5:1 or better', (fg, bg) => {
    expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['--glow-1', '--glow-2'])(
    'keeps --fg-muted at 4.5:1 over the page background under %s at its peak',
    (glow) => {
      const blended = over(color('--bg'), color(glow));
      const ratio = contrast(color('--fg-muted'), blended);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe('token set', () => {
  it('defines the same token names in both themes', () => {
    const midnight = [...themes.midnight.keys()].sort();
    const daylight = [...themes.daylight.keys()].sort();
    expect(midnight.length).toBeGreaterThan(0);
    expect(daylight).toEqual(midnight);
  });

  it('declares the dark and light native color schemes', () => {
    expect(tokensCss).toMatch(/color-scheme:\s*dark;/);
    expect(tokensCss).toMatch(/color-scheme:\s*light;/);
  });

  it('uses the approved accent in both themes', () => {
    expect(themes.midnight.get('--accent')).toBe('#2563eb');
    expect(themes.daylight.get('--accent')).toBe('#2563eb');
  });
});

describe('tokens only outside tokens.css (AC-9)', () => {
  const sourceFiles = (): string[] =>
    readdirSync(resolve(root, 'src'), { recursive: true })
      .map((entry) => String(entry).replace(/\\/g, '/'))
      .filter((rel) => /\.(css|astro|ts|tsx)$/.test(rel))
      .filter((rel) => !statSync(resolve(root, 'src', rel)).isDirectory())
      .filter((rel) => rel !== 'styles/tokens.css')
      .filter((rel) => !rel.startsWith('assets/'));

  it('scans a non-trivial set of source files', () => {
    expect(sourceFiles().length).toBeGreaterThan(5);
  });

  it('has no color literal in any other source file', () => {
    for (const rel of sourceFiles()) {
      const text = read(`src/${rel}`);
      expect(text, rel).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    }
  });

  it('has no box-shadow literal in any other source file', () => {
    for (const rel of sourceFiles()) {
      const offending = read(`src/${rel}`)
        .split(/\r?\n/)
        .filter((line) => line.includes('box-shadow'))
        .filter((line) => !line.includes('var(--'));
      expect(offending, rel).toEqual([]);
    }
  });
});

describe('base styles', () => {
  const base = read('src/styles/base.css');

  it('draws a 2px solid accent focus ring offset by 2px on :focus-visible', () => {
    expect(base).toMatch(
      /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\);[^}]*outline-offset:\s*2px;/,
    );
  });

  it('disables transitions and animations under reduced motion', () => {
    const rule = base.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/,
    );
    expect(rule).not.toBeNull();
    expect(rule![1]).toMatch(/transition:\s*none\s*!important;/);
    expect(rule![1]).toMatch(/animation:\s*none\s*!important;/);
  });

  it('clips the page wrapper horizontally without breaking sticky children', () => {
    expect(base).toMatch(/\.sp-page\s*\{[^}]*overflow-x:\s*clip;/);
    expect(base).not.toMatch(/overflow-x:\s*hidden/);
  });
});

describe('self-hosted fonts (AC-10)', () => {
  const fonts = read('src/styles/fonts.css');
  const layout = read('src/layouts/Base.astro');

  it.each([
    ['Geist', 'geist-latin-wght-normal.woff2'],
    ['JetBrains Mono', 'jetbrains-mono-latin-wght-normal.woff2'],
  ])('serves %s from the site own /fonts/ path', (family, file) => {
    expect(fonts).toContain(`font-family: '${family}'`);
    expect(fonts).toContain(`url('/fonts/${file}')`);
    const size = statSync(resolve(root, 'public/fonts', file)).size;
    expect(size).toBeGreaterThan(10000);
    const escaped = file.replace('.', '\\.');
    expect(layout).toMatch(
      new RegExp(`<link[^>]*rel="preload"[^>]*href="/fonts/${escaped}"`),
    );
  });

  it('swaps in both faces and references no remote font host', () => {
    expect(fonts.match(/font-display:\s*swap;/g)).toHaveLength(2);
    expect(fonts).not.toMatch(/https?:\/\//);
    expect(layout).not.toMatch(/fonts\.(googleapis|gstatic)/);
  });

  it('ships the license text next to each font file', () => {
    expect(existsSync(resolve(root, 'public/fonts/geist-OFL.txt'))).toBe(true);
    expect(
      existsSync(resolve(root, 'public/fonts/jetbrains-mono-OFL.txt')),
    ).toBe(true);
  });
});
