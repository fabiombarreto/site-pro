// PRPs/prds/stage-4-sections-effects.prd.md AC-1 Hero photo from ASCII (ordered dither over 700 ms, photo opacity above 0
// then 1, ASCII fits the photo box), AC-3 Covers resolve from blur (cover progress), AC-11 Mobile (ASCII fits the box)
// (phase 2 plan: AC-A1, AC-A3, AC-A5)
// The pure timing of image-resolve: duration, Bayer dissolve, photo opacity ramp, ASCII geometry, cover progress.
import { describe, expect, it } from 'vitest';
import { compileScript } from '../../src/runtime/compiler';
import {
  BAYER_4X4,
  EFFECT_DURATION_MS as D,
  RESOLVE_REVEAL_MS,
  asciiGeometry,
  cardPhases,
  ditherAscii,
  dissolveProgress,
  dissolveStep,
  photoOpacity,
} from '../../src/runtime/effect-timing';
import { EFFECTS, type BuildStep } from '../../src/runtime/types';

const step = (extra: Partial<BuildStep> = {}): BuildStep => ({
  call: 'hero.photo("x")',
  target: 'photo',
  effect: 'image-resolve',
  ...extra,
});

// The standard 4x4 dispersed-dot (Bayer) threshold map, written out independently of the source.
const STANDARD_BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const block = (rows: number, cols: number, ch = '@'): string =>
  Array.from({ length: rows }, () => ch.repeat(cols)).join('\n');

const spaces = (text: string): number =>
  [...text].filter((c) => c === ' ').length;

describe('image-resolve in the effects registry', () => {
  it('is a known effect', () => {
    expect(EFFECTS).toContain('image-resolve');
  });

  it('lasts 1000 ms: 150 ms selection, 150 ms skeleton, then the 700 ms dissolve', () => {
    expect(D['image-resolve'](step())).toBe(1000);
    expect(RESOLVE_REVEAL_MS).toBe(300);
  });

  it('compiles into a step exactly 1000 ms long', () => {
    const t = compileScript({
      section: 'top',
      file: 'hero.tsx',
      command: 'startSite();',
      steps: [step()],
    });
    expect((t.steps[0]?.end ?? 0) - (t.steps[0]?.start ?? 0)).toBe(1000);
    expect(t.steps[0]?.effect).toBe('image-resolve');
  });
});

describe('the Bayer order', () => {
  it('is the standard 0-15 dispersed-dot matrix', () => {
    expect(BAYER_4X4.map((row) => [...row])).toEqual(STANDARD_BAYER);
  });

  it('uses every value from 0 to 15 exactly once', () => {
    expect([...BAYER_4X4.flat()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i),
    );
  });
});

describe('dissolve progress and step', () => {
  it('has not started before 300 ms and is complete at 1000 ms of the step', () => {
    expect(dissolveProgress(0)).toBe(0);
    expect(dissolveProgress(300)).toBe(0);
    expect(dissolveProgress(650)).toBeCloseTo(0.5, 9);
    expect(dissolveProgress(1000)).toBe(1);
    expect(dissolveProgress(5000)).toBe(1);
  });

  it('moves through 16 discrete steps over the 700 ms, reaching 16 only at the end', () => {
    expect(dissolveStep(0)).toBe(0);
    expect(dissolveStep(300)).toBe(0);
    expect(dissolveStep(343)).toBe(0);
    expect(dissolveStep(344)).toBe(1);
    expect(dissolveStep(650)).toBe(8);
    expect(dissolveStep(999)).toBe(15);
    expect(dissolveStep(1000)).toBe(16);
    expect(dissolveStep(5000)).toBe(16);
  });

  it('never goes backwards', () => {
    let previous = 0;
    for (let ms = 0; ms <= 1100; ms++) {
      const s = dissolveStep(ms);
      expect(s).toBeGreaterThanOrEqual(previous);
      previous = s;
    }
  });
});

describe('photo opacity', () => {
  it('starts above 0 and below 1 when the ASCII appears, and ends at exactly 1', () => {
    expect(photoOpacity(300)).toBeGreaterThan(0);
    expect(photoOpacity(300)).toBeLessThan(1);
    expect(photoOpacity(1000)).toBe(1);
    expect(photoOpacity(5000)).toBe(1);
  });

  it('rises monotonically and stays inside (0, 1] for the whole dissolve', () => {
    let previous = 0;
    for (let ms = 300; ms <= 1000; ms += 5) {
      const o = photoOpacity(ms);
      expect(o).toBeGreaterThan(0);
      expect(o).toBeLessThanOrEqual(1);
      expect(o).toBeGreaterThanOrEqual(previous);
      previous = o;
    }
  });

  it('is rounded to two decimals', () => {
    for (let ms = 300; ms <= 1000; ms += 7) {
      const o = photoOpacity(ms);
      expect(Math.abs(o * 100 - Math.round(o * 100))).toBeLessThan(1e-9);
    }
  });

  it('is halfway between its start and 1 halfway through the dissolve', () => {
    const start = photoOpacity(300);
    expect(photoOpacity(650)).toBeCloseTo((start + 1) / 2, 2);
  });
});

describe('ditherAscii', () => {
  const art = ' .:-=+*#%@\n@@@@@@@@@@\n .:-=+*#%@\n@ @ @ @ @ ';

  it('returns the input untouched at step 0', () => {
    expect(ditherAscii(art, 0)).toBe(art);
  });

  it('leaves only spaces and newlines at step 16, with every newline where it was', () => {
    const out = ditherAscii(art, 16);
    expect(out).toHaveLength(art.length);
    expect(out.replace(/[ \n]/g, '')).toBe('');
    expect(out.split('\n').map((l) => l.length)).toEqual(
      art.split('\n').map((l) => l.length),
    );
  });

  it('is deterministic', () => {
    for (let s = 0; s <= 16; s++) {
      expect(ditherAscii(art, s)).toBe(ditherAscii(art, s));
    }
  });

  it('only ever replaces a character with a space', () => {
    for (let s = 0; s <= 16; s++) {
      const out = ditherAscii(art, s);
      expect(out).toHaveLength(art.length);
      [...art].forEach((c, i) => {
        expect(out[i] === c || out[i] === ' ', `step ${s} index ${i}`).toBe(
          true,
        );
      });
    }
  });

  it('removes exactly k of every 16 cells of a solid area at step k', () => {
    const solid = block(8, 8);
    for (let k = 0; k <= 16; k++) {
      expect(spaces(ditherAscii(solid, k)), `step ${k}`).toBe(4 * k);
    }
  });

  it('removes cells in the order of the matrix, lowest value first, repeating every 4 columns and rows', () => {
    const solid = block(8, 8);
    for (let k = 1; k <= 16; k++) {
      const rows = ditherAscii(solid, k).split('\n');
      rows.forEach((row, y) => {
        [...row].forEach((c, x) => {
          const expected = (STANDARD_BAYER[y % 4]?.[x % 4] ?? 99) < k;
          expect(c === ' ', `step ${k} cell ${x},${y}`).toBe(expected);
        });
      });
    }
  });

  it('never brings a removed cell back as the step grows', () => {
    const solid = block(4, 4);
    for (let k = 1; k <= 16; k++) {
      const before = ditherAscii(solid, k - 1);
      const after = ditherAscii(solid, k);
      [...before].forEach((c, i) => {
        if (c === ' ') expect(after[i]).toBe(' ');
      });
    }
  });

  it('keeps cells that were already spaces', () => {
    expect(ditherAscii('   \n   ', 7)).toBe('   \n   ');
  });
});

describe('asciiGeometry', () => {
  it('derives the font size from the box width and the longest row, and the line height from the rows', () => {
    const g = asciiGeometry('ab\nabcd\nxy', { width: 240, height: 90 });
    expect(g.cols).toBe(4);
    expect(g.rows).toBe(3);
    expect(g.lineHeight).toBeCloseTo(30, 9);
    // The monospace advance is 0.6 em, so the columns fill the box width.
    expect(g.cols * g.fontSize * 0.6).toBeCloseTo(240, 6);
    expect(g.fontSize).toBeCloseTo(100, 6);
  });

  it('fills the box height with its rows', () => {
    const g = asciiGeometry(block(10, 48), { width: 480, height: 480 });
    expect(g.rows * g.lineHeight).toBeCloseTo(480, 6);
  });

  it('scales with the box so a phone-sized box gets a smaller font', () => {
    const wide = asciiGeometry(block(10, 48), { width: 480, height: 480 });
    const narrow = asciiGeometry(block(10, 48), { width: 270, height: 480 });
    expect(narrow.fontSize).toBeLessThan(wide.fontSize);
    expect(narrow.cols * narrow.fontSize * 0.6).toBeCloseTo(270, 6);
  });

  it('returns zeros for an empty string instead of dividing by zero', () => {
    expect(asciiGeometry('', { width: 100, height: 100 })).toEqual({
      cols: 0,
      rows: 0,
      fontSize: 0,
      lineHeight: 0,
    });
  });
});

describe('card cover progress', () => {
  it('is 0 until 190 ms, rises to 1 at 270 ms and stays there', () => {
    expect(cardPhases(0).cover).toBe(0);
    expect(cardPhases(189).cover).toBe(0);
    expect(cardPhases(190).cover).toBe(0);
    expect(cardPhases(230).cover).toBeCloseTo(0.5, 9);
    expect(cardPhases(270).cover).toBe(1);
    expect(cardPhases(300).cover).toBe(1);
  });

  it('never goes backwards and stays inside [0, 1]', () => {
    let previous = 0;
    for (let ms = 0; ms <= 300; ms++) {
      const c = cardPhases(ms).cover;
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
      expect(c).toBeGreaterThanOrEqual(previous);
      previous = c;
    }
  });

  it('starts the cover phase exactly when the skeleton phase ends', () => {
    for (let ms = 0; ms <= 300; ms++) {
      const p = cardPhases(ms);
      if (ms >= 150) expect(p.skeleton).toBe(!p.coverStarted);
    }
    expect(cardPhases(189).coverStarted).toBe(false);
    expect(cardPhases(190).coverStarted).toBe(true);
  });

  it('finishes the other card phases inside the 300 ms card', () => {
    expect(cardPhases(150).select).toBe(1);
    expect(cardPhases(270).title).toBe(1);
    expect(cardPhases(285).summary).toBe(1);
    expect(cardPhases(300).tags).toBe(1);
  });
});
