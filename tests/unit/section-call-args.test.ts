// PRPs/prds/stage-4-sections-effects.prd.md AC-8 Commands and logs from the content (excerpt and label list),
// AC-6/AC-7 the window of a section after the hero opens at Enter (phase 3 plan: AC-A2, AC-A8)
// The pure helpers that turn content into window command arguments, and the "open at Enter" timing.
import { describe, expect, it } from 'vitest';
import { compileScript } from '../../src/runtime/compiler';
import { excerpt, labelList } from '../../src/sections/call-args';
import { openAtEnter } from '../../src/sections/pacing';
import { buildStrings } from '../../src/strings';

describe('excerpt', () => {
  it('keeps the first whole words that fit in 25 characters and adds an ellipsis', () => {
    expect(
      excerpt(
        "I'm a full-stack software engineer, and I've been studying programming.",
      ),
    ).toBe("I'm a full-stack software…");
    expect(excerpt('12+ years shipping full-stack apps with React.')).toBe(
      '12+ years shipping…',
    );
  });

  it('returns a short text unchanged, without an ellipsis', () => {
    expect(excerpt('short')).toBe('short');
    expect(excerpt('x'.repeat(25))).toBe('x'.repeat(25));
  });

  it('cuts a first word longer than the limit at the limit', () => {
    expect(excerpt('x'.repeat(40))).toBe(`${'x'.repeat(25)}…`);
  });

  it('honors another limit', () => {
    expect(excerpt('alpha beta gamma delta', 12)).toBe('alpha beta…');
  });

  it('collapses whitespace and drops quotes and angle brackets', () => {
    expect(excerpt('a  "b"\n<c>   d')).toBe('a b c d');
    const out = excerpt('say "hello"   to <the> whole wide world of people');
    expect(out).not.toMatch(/["<>]/);
    expect(out).not.toMatch(/\s{2,}/);
  });
});

describe('labelList', () => {
  it('writes the labels as a quoted, comma-separated list in brackets', () => {
    expect(labelList(['GitHub', 'LinkedIn'])).toBe('["GitHub", "LinkedIn"]');
    expect(labelList(['One'])).toBe('["One"]');
    expect(labelList([])).toBe('[]');
  });
});

describe('openAtEnter', () => {
  it('opens the window at Enter and builds 280 ms later', () => {
    const t = openAtEnter('renderAbout();');
    // 250 ms start + 40 ms x 14 characters + 80 ms Enter.
    expect(t.commandEnd).toBe(890);
    expect(t.windowEnd).toBe(t.commandEnd);
    expect(t.buildStart).toBe(t.commandEnd + 280);
  });

  it('follows the length of the command', () => {
    expect(openAtEnter('renderProjects();').commandEnd).toBe(1010);
    expect(openAtEnter('renderContact();').commandEnd).toBe(970);
  });

  it('compiles into a timeline whose window opens at Enter', () => {
    const command = 'renderStack();';
    const t = compileScript({
      section: 'stack',
      file: 'stack.tsx',
      command,
      timing: openAtEnter(command),
      steps: [
        { call: 'stack.group("x")', target: 'g', effect: 'stagger', count: 2 },
      ],
    });
    expect(t.windowEnd).toBe(t.commandEnd);
    expect(t.buildStart).toBe(t.windowEnd + 280);
    expect(t.steps[0]?.start).toBe(t.buildStart);
  });
});

describe('dock log strings', () => {
  it('words the per-section logs as the content microcopy table does', () => {
    expect(buildStrings.readingFile('about.md')).toBe('Reading about.md...');
    expect(buildStrings.fetchingProjects(4)).toBe(
      'Fetching projects... 4 found',
    );
    expect(buildStrings.fetchingProjects(5)).toBe(
      'Fetching projects... 5 found',
    );
    expect(buildStrings.resolvingDependencies).toBe(
      'Resolving dependencies...',
    );
    expect(buildStrings.openingChannels).toBe('Opening channels...');
  });
});
