// PRPs/prds/stage-3-runtime.prd.md AC-20 Build scripts are plain data, compiled and checked at build time
// (phase 1 plan: AC-A3)
// A build script is a sequence of steps; the compiler turns it into an absolute 1x timeline in ms.
import { describe, expect, it } from 'vitest';
import { compileScript, serializeTimeline } from '../../src/runtime/compiler';
import type { BuildScript, BuildStep } from '../../src/runtime/types';

const script = (
  steps: BuildStep[],
  extra: Partial<BuildScript> = {},
): BuildScript => ({
  section: 'about',
  file: 'about.md',
  command: 'renderAbout();',
  steps,
  ...extra,
});

const pop = (call: string, extra: Partial<BuildStep> = {}): BuildStep => ({
  call,
  target: 'links',
  effect: 'pop',
  ...extra,
});

describe('phase timing', () => {
  it('types the command at 40 ms per character after a 250 ms start and an 80 ms settle', () => {
    const command = 'renderAbout();';
    const t = compileScript(script([pop('a')], { command }));
    expect(t.commandEnd).toBe(250 + command.length * 40 + 80);
    expect(t.windowEnd).toBe(t.commandEnd + 100);
    expect(t.buildStart).toBe(t.windowEnd + 280);
  });

  it('honors explicit timing overrides', () => {
    const t = compileScript(
      script([pop('a')], {
        timing: { commandEnd: 730, windowEnd: 1000, buildStart: 1300 },
      }),
    );
    expect([t.commandEnd, t.windowEnd, t.buildStart]).toEqual([
      730, 1000, 1300,
    ]);
  });

  it('closes 300 ms after the last step and lasts 500 ms more', () => {
    const t = compileScript(script([pop('a'), pop('b')]));
    const last = t.steps[t.steps.length - 1];
    expect(t.createdAt).toBe((last?.end ?? 0) + 300);
    expect(t.duration).toBe(t.createdAt + 500);
  });

  it('accepts a custom settle time', () => {
    const t = compileScript(script([pop('a')], { settle: 1000 }));
    expect(t.createdAt).toBe((t.steps[0]?.end ?? 0) + 1000);
  });

  // PRPs/prds/stage-4-sections-effects.prd.md AC-8 per-section dock logs carried by the build script
  // (phase 3 plan: AC-A2)
  it('carries a declared dock log into the timeline and serializes it', () => {
    const t = compileScript(script([pop('a')], { log: 'Reading about.md...' }));
    expect(t.log).toBe('Reading about.md...');
    expect(JSON.parse(serializeTimeline(t)).log).toBe('Reading about.md...');
  });

  it('leaves the timeline without a log when the script declares none', () => {
    const t = compileScript(script([pop('a')]));
    expect(t.log).toBeUndefined();
    expect(JSON.parse(serializeTimeline(t))).not.toHaveProperty('log');
  });

  it.each(['<', '>'])('rejects a log containing %s', (ch) => {
    expect(() =>
      compileScript(script([pop('a')], { log: `Reading${ch}...` })),
    ).toThrow('log must not contain < or >');
  });

  it('staggers a pop group of n buttons for 330 ms plus 90 ms per further button', () => {
    const t = compileScript(script([pop('a', { count: 3 })]));
    const step = t.steps[0];
    expect((step?.end ?? 0) - (step?.start ?? 0)).toBe(510);
  });

  it('carries the section, file and command into the timeline', () => {
    const t = compileScript(script([pop('a')]));
    expect(t).toMatchObject({
      v: 1,
      section: 'about',
      file: 'about.md',
      command: 'renderAbout();',
    });
  });
});

describe('step placement', () => {
  it('starts the first step at buildStart plus its gap', () => {
    const t = compileScript(script([pop('a', { gap: 60 })]));
    expect(t.steps[0]?.start).toBe(t.buildStart + 60);
  });

  it('starts each later step at the previous end plus its gap', () => {
    const t = compileScript(script([pop('a'), pop('b', { gap: 40 })]));
    expect(t.steps[1]?.start).toBe((t.steps[0]?.end ?? 0) + 40);
  });

  it('starts a step earlier by its overlap', () => {
    const t = compileScript(script([pop('a'), pop('b', { overlap: 120 })]));
    expect(t.steps[1]?.start).toBe((t.steps[0]?.end ?? 0) - 120);
  });

  it('lasts 150 + n x 28 ms for a headline of n characters', () => {
    const text = 'Fabio Barreto.';
    const t = compileScript(
      script([{ call: 'a', target: 'title', effect: 'type-text', text }]),
    );
    const step = t.steps[0];
    expect((step?.end ?? 0) - (step?.start ?? 0)).toBe(150 + text.length * 28);
  });

  it('gives every effect a positive duration', () => {
    const t = compileScript(
      script([
        { call: 'a', target: 't', effect: 'select' },
        { call: 'b', target: 't', effect: 'skeleton' },
        { call: 'c', target: 't', effect: 'type-text', text: 'x' },
        { call: 'd', target: 't', effect: 'decode', text: 'x' },
        { call: 'e', target: 't', effect: 'resolve-lines', count: 3 },
        { call: 'f', target: 't', effect: 'pop' },
        { call: 'g', target: 't', effect: 'stagger', count: 3 },
        { call: 'h', target: 't', effect: 'build-card' },
      ]),
    );
    for (const step of t.steps) expect(step.end).toBeGreaterThan(step.start);
  });

  it('keeps the call, target and effect of each step', () => {
    const t = compileScript(script([pop('about.links(x)')]));
    expect(t.steps[0]).toMatchObject({
      call: 'about.links(x)',
      target: 'links',
      effect: 'pop',
    });
  });
});

describe('validation', () => {
  it('names the section and step for an unknown effect', () => {
    const bad = {
      call: 'about.text',
      target: 'text',
      effect: 'bogus-effect',
    } as unknown as BuildStep;
    expect(() => compileScript(script([pop('ok'), bad]))).toThrow(
      'build script "about" step 1 (about.text): unknown effect "bogus-effect"',
    );
  });

  it('names the section and step for an empty target', () => {
    expect(() => compileScript(script([pop('a', { target: '' })]))).toThrow(
      'build script "about" step 0 (a): empty target',
    );
  });

  it('requires text for type-text', () => {
    expect(() =>
      compileScript(script([{ call: 'a', target: 't', effect: 'type-text' }])),
    ).toThrow('build script "about" step 0 (a): needs text');
  });

  it('requires count for stagger', () => {
    expect(() =>
      compileScript(script([{ call: 'a', target: 't', effect: 'stagger' }])),
    ).toThrow('build script "about" step 0 (a): needs count');
  });

  it('rejects a script with no steps', () => {
    expect(() => compileScript(script([]))).toThrow();
  });

  it.each(['<', '>'])('rejects a call containing %s', (ch) => {
    expect(() => compileScript(script([pop(`a${ch}b`)]))).toThrow();
  });

  it.each(['<', '>'])('rejects a command containing %s', (ch) => {
    expect(() =>
      compileScript(script([pop('a')], { command: `run${ch}();` })),
    ).toThrow();
  });
});

describe('serialization', () => {
  it('round-trips the timeline through JSON', () => {
    const t = compileScript(script([pop('a'), pop('b', { overlap: 50 })]));
    expect(JSON.parse(serializeTimeline(t))).toEqual(t);
  });
});
