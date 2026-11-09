// PRPs/prds/stage-3-runtime.prd.md AC-20 content-derived effect durations, AC-1 typing rhythm and window command cut,
// AC-4 effect phases as pure functions of the clock (phase 3 plan: AC-A2, AC-A7)
// The pure timing contract every element effect and the dock typing follow.
import { describe, expect, it } from 'vitest';
import { EFFECT_DURATION_MS as RE_EXPORTED } from '../../src/runtime/compiler';
import {
  EFFECT_DURATION_MS as D,
  SCRAMBLE_GLYPHS,
  cardPhases,
  createRng,
  decodeGlyphs,
  decodeSettled,
  estimateLines,
  hashSeed,
  popInset,
  popProgress,
  resolveLinesAt,
  staggerChildProgress,
  truncateCall,
  typeCharsAt,
  typedChars,
} from '../../src/runtime/effect-timing';
import type { BuildStep } from '../../src/runtime/types';

const step = (extra: Partial<BuildStep>): BuildStep => ({
  call: 'x.y()',
  target: 't',
  effect: 'pop',
  ...extra,
});

describe('effect durations', () => {
  it('selects for 150 ms and builds a skeleton for 300 ms more', () => {
    expect(D.select(step({}))).toBe(150);
    expect(D.skeleton(step({}))).toBe(450);
  });

  it('types a headline of n characters in 150 ms plus n x 28 ms', () => {
    expect(D['type-text'](step({ text: 'Fabio Barreto.' }))).toBe(542);
    expect(D['type-text'](step({ text: 'abc' }))).toBe(150 + 3 * 28);
  });

  it('decodes in 150 + 350 ms whatever the text length', () => {
    expect(D.decode(step({ text: 'x' }))).toBe(500);
    expect(D.decode(step({ text: 'x'.repeat(40) }))).toBe(500);
  });

  it('resolves n lines in 150 + 200 + n x 40 ms', () => {
    expect(D['resolve-lines'](step({ count: 3 }))).toBe(470);
    expect(D['resolve-lines'](step({ count: 10 }))).toBe(750);
  });

  it('pops in 150 + 180 ms and staggers 90 ms per further child', () => {
    expect(D.pop(step({}))).toBe(330);
    expect(D.stagger(step({ count: 1 }))).toBe(330);
    expect(D.stagger(step({ count: 4 }))).toBe(600);
    expect(D.stagger(step({ count: 0 }))).toBe(330);
  });

  it('builds a project card in 450 ms', () => {
    expect(D['build-card'](step({}))).toBe(450);
  });

  it('names what is missing instead of guessing a duration', () => {
    expect(D['type-text'](step({}))).toBe('needs text');
    expect(D.decode(step({}))).toBe('needs text');
    expect(D['resolve-lines'](step({}))).toBe('needs count');
    expect(D.stagger(step({}))).toBe('needs count');
  });

  it('is still importable from the compiler module', () => {
    expect(RE_EXPORTED).toBe(D);
  });
});

describe('seeded randomness', () => {
  it('hashes text to a stable unsigned 32-bit seed (FNV-1a)', () => {
    expect(hashSeed('')).toBe(0x811c9dc5);
    expect(hashSeed('a')).toBe(0xe40c292c);
    expect(hashSeed('hero:hero.role("x")')).toBe(
      hashSeed('hero:hero.role("x")'),
    );
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });

  it('replays the same sequence of floats in [0, 1) for a seed', () => {
    const a = createRng(5);
    const b = createRng(5);
    const first = Array.from({ length: 50 }, () => a());
    expect(Array.from({ length: 50 }, () => b())).toEqual(first);
    for (const v of first) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    const other = createRng(6);
    expect(Array.from({ length: 50 }, () => other())).not.toEqual(first);
  });
});

describe('line estimate', () => {
  it('counts the wrapped lines of every paragraph, at least one each', () => {
    expect(estimateLines('a'.repeat(100), 48)).toBe(3);
    expect(estimateLines('a'.repeat(48), 48)).toBe(1);
    expect(estimateLines('a'.repeat(49), 48)).toBe(2);
    expect(estimateLines('a\n\nb', 48)).toBe(2);
    expect(estimateLines('', 48)).toBe(1);
    expect(estimateLines(`${'a'.repeat(100)}\n\n${'b'.repeat(10)}`, 48)).toBe(
      4,
    );
  });
});

describe('dock and boot typing with seeded jitter', () => {
  const command = 'startSite();';

  it('types nothing at 250 ms and the whole command at exactly 250 + 40 x length', () => {
    expect(typedChars(0, command)).toBe(0);
    expect(typedChars(250, command)).toBe(0);
    expect(typedChars(729, command)).toBeLessThan(command.length);
    expect(typedChars(730, command)).toBe(command.length);
    expect(typedChars(5000, command)).toBe(command.length);
  });

  it('never goes backwards and is not the flat 40 ms rhythm', () => {
    let previous = 0;
    let different = 0;
    for (let t = 0; t <= 800; t++) {
      const chars = typedChars(t, command);
      expect(chars).toBeGreaterThanOrEqual(previous);
      previous = chars;
      const flat = Math.min(Math.max(Math.floor((t - 250) / 40), 0), 12);
      if (chars !== flat) different++;
    }
    expect(different).toBeGreaterThan(0);
  });

  it('replays identically for the same command and ends every command at 250 + 40 x length', () => {
    for (let t = 0; t <= 800; t += 7) {
      expect(typedChars(t, command)).toBe(typedChars(t, command));
    }
    for (const other of [
      'renderAbout();',
      'renderProjects();',
      'renderStack();',
    ]) {
      expect(typedChars(250 + 40 * other.length - 1, other)).toBeLessThan(
        other.length,
      );
      expect(typedChars(250 + 40 * other.length, other)).toBe(other.length);
    }
  });

  it('pauses noticeably after an opening parenthesis', () => {
    const call = 'hero.title("Fabio Barreto.")';
    const appearsAt = (k: number): number => {
      let t = 0;
      while (typedChars(t, call) < k) t++;
      return t;
    };
    const gaps = Array.from(
      { length: call.length - 1 },
      (_, i) => appearsAt(i + 2) - appearsAt(i + 1),
    );
    const afterParen = call.indexOf('(') + 1;
    const pause = gaps[afterParen - 1] ?? 0;
    const others = gaps.filter((_, i) => i !== afterParen - 1);
    expect(pause).toBeGreaterThan(Math.max(...others));
  });
});

describe('window command cut', () => {
  const q = '"';

  it('cuts a long quoted argument to 29 characters with a single ellipsis before the tail', () => {
    const call = `projects.card(${q}ai-track-record${q})`;
    expect(truncateCall(call)).toBe(`projects.card(${q}ai-track-re…${q})`);
    expect(truncateCall(call)).toHaveLength(29);
  });

  it('leaves a call of at most 29 characters alone', () => {
    const title = `hero.title(${q}Fabio Barreto.${q})`;
    expect(truncateCall(title)).toBe(title);
    expect(truncateCall('hero.links([…])')).toBe('hero.links([…])');
    const exact = `a.b(${q}${'x'.repeat(22)}${q})`;
    expect(exact).toHaveLength(29);
    expect(truncateCall(exact)).toBe(exact);
  });

  it('cuts any longer call to exactly 29 characters', () => {
    for (let n = 1; n < 80; n++) {
      const call = `hero.role(${q}${'y'.repeat(n)}${q})`;
      const shown = truncateCall(call);
      if (call.length <= 29) expect(shown).toBe(call);
      else {
        expect(shown).toHaveLength(29);
        expect(shown.endsWith(`…${q})`)).toBe(true);
        expect(shown.startsWith(`hero.role(${q}`)).toBe(true);
      }
    }
  });

  it('shortens a call with no quoted argument to 28 characters plus an ellipsis', () => {
    const call = 'projects.card(abcdefghijklmnopqrstuvwxyz)';
    expect(truncateCall(call)).toBe(`${call.slice(0, 28)}…`);
    expect(truncateCall('a'.repeat(40))).toBe(`${'a'.repeat(28)}…`);
  });

  it('honors another maximum', () => {
    expect(truncateCall('abcdefghij', 6)).toBe('abcde…');
  });
});

describe('type-text and decode phases', () => {
  it('types after the 150 ms selection, one character per 28 ms, never past the length', () => {
    expect(typeCharsAt(0, 14)).toBe(0);
    expect(typeCharsAt(150, 14)).toBe(0);
    expect(typeCharsAt(178, 14)).toBe(1);
    expect(typeCharsAt(150 + 28 * 5, 14)).toBe(5);
    expect(typeCharsAt(9999, 14)).toBe(14);
  });

  it('settles characters over 350 ms after the selection', () => {
    expect(decodeSettled(100, 24)).toBe(0);
    expect(decodeSettled(150, 24)).toBe(0);
    expect(decodeSettled(325, 24)).toBe(12);
    expect(decodeSettled(500, 24)).toBe(24);
    expect(decodeSettled(900, 24)).toBe(24);
  });

  it('keeps the original text once settled, spaces as spaces, the rest as scramble glyphs', () => {
    expect(decodeGlyphs('Hello world', 500, 7)).toBe('Hello world');
    const frame = decodeGlyphs('Hello world', 150, 7);
    expect(frame).toHaveLength(11);
    expect(frame[5]).toBe(' ');
    for (const ch of frame) {
      expect(ch === ' ' || SCRAMBLE_GLYPHS.includes(ch)).toBe(true);
    }
    const half = decodeGlyphs('Hello world', 325, 7);
    expect(half.slice(0, decodeSettled(325, 11))).toBe(
      'Hello world'.slice(0, decodeSettled(325, 11)),
    );
  });

  it('reproduces a frame for the same seed and time and changes frames over time', () => {
    expect(decodeGlyphs('Hello world', 150, 7)).toBe(
      decodeGlyphs('Hello world', 150, 7),
    );
    const frames = new Set(
      [150, 190, 230, 270].map((ms) =>
        decodeGlyphs('Senior Software Engineer', ms, 99),
      ),
    );
    expect(frames.size).toBeGreaterThan(1);
  });

  it('uses the documented scramble glyphs', () => {
    expect(SCRAMBLE_GLYPHS).toBe('!<>-_\\/[]{}=+*^?#');
  });
});

describe('resolve-lines, pop, stagger and card phases', () => {
  it('resolves one line per 40 ms after the 150 ms selection and 200 ms of skeleton bars', () => {
    expect(resolveLinesAt(300, 3)).toBe(0);
    expect(resolveLinesAt(390, 3)).toBe(1);
    expect(resolveLinesAt(430, 3)).toBe(2);
    expect(resolveLinesAt(470, 3)).toBe(3);
    expect(resolveLinesAt(9999, 3)).toBe(3);
  });

  it('pops from 150 ms to 330 ms', () => {
    expect(popProgress(100)).toBe(0);
    expect(popProgress(240)).toBe(0.5);
    expect(popProgress(330)).toBe(1);
  });

  it('opens the clip from a 10 percent inset, overshoots to -4 at 70 percent, and settles at 0', () => {
    expect(popInset(0)).toBe(10);
    expect(popInset(1)).toBeCloseTo(0, 9);
    expect(Math.round(popInset(0.7) * 100)).toBe(-400);
    expect(popInset(0.35)).toBeLessThan(popInset(0));
    expect(popInset(0.85)).toBeGreaterThan(popInset(0.7));
    expect(popInset(0.85)).toBeLessThan(0);
  });

  it('starts each stagger child 90 ms after the previous one', () => {
    expect(staggerChildProgress(150, 0)).toBe(0);
    expect(staggerChildProgress(330, 0)).toBe(1);
    expect(staggerChildProgress(330, 1)).toBeLessThan(1);
    expect(staggerChildProgress(330 + 90, 1)).toBe(1);
    expect(staggerChildProgress(150 + 90, 1)).toBe(0);
  });

  it('plays a card as select, skeleton, cover, then title, summary and tags', () => {
    expect(cardPhases(0).select).toBe(0);
    expect(cardPhases(150).select).toBe(1);
    expect(cardPhases(100).skeleton).toBe(false);
    expect(cardPhases(200).skeleton).toBe(true);
    expect(cardPhases(250).skeleton).toBe(false);
    expect(cardPhases(200).cover).toBe(false);
    expect(cardPhases(250).cover).toBe(true);
    expect(cardPhases(250).title).toBe(0);
    expect(cardPhases(400).title).toBe(1);
    expect(cardPhases(300).summary).toBe(0);
    expect(cardPhases(420).summary).toBe(1);
    expect(cardPhases(360).tags).toBe(0);
    expect(cardPhases(449).tags).toBeLessThan(1);
    expect(cardPhases(450).tags).toBe(1);
  });
});
