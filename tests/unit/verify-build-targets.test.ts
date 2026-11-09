// PRPs/prds/stage-3-runtime.prd.md AC-20 A target that does not exist in the page fails the build
// naming the section and the step (phase 1 plan: AC-A3)
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type Verify = (html: string) => string[];

const load = async (): Promise<Verify> => {
  const file = pathToFileURL(
    resolve(process.cwd(), 'scripts', 'verify-build-targets.mjs'),
  ).href;
  const mod = (await import(/* @vite-ignore */ file)) as {
    verifyBuildTargets: Verify;
  };
  return mod.verifyBuildTargets;
};

const encode = (value: unknown): string =>
  JSON.stringify(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const timeline = (section: string, targets: string[]) => ({
  v: 1,
  section,
  file: `${section}.tsx`,
  command: 'run();',
  commandEnd: 1,
  windowEnd: 2,
  buildStart: 3,
  steps: targets.map((target, i) => ({
    call: `${section}.step${i}("it's")`,
    target,
    effect: 'pop',
    start: 10 + i,
    end: 20 + i,
  })),
  createdAt: 100,
  duration: 200,
});

const page = (section: string, targets: string[], present: string[]): string =>
  `<main><section id="${section}" data-build="${encode(timeline(section, targets))}">` +
  present.map((t) => `<p data-build-target="${t}">x</p>`).join('') +
  '</section></main>';

describe('verifyBuildTargets', () => {
  it('reports nothing when every step target is present', async () => {
    const verify = await load();
    expect(verify(page('about', ['text', 'links'], ['text', 'links']))).toEqual(
      [],
    );
  });

  it('names the section, step index, call and target of a missing target', async () => {
    const verify = await load();
    const problems = verify(page('about', ['text', 'links'], ['text']));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('build script "about" step 1');
    expect(problems[0]).toContain('about.step1');
    expect(problems[0]).toContain('target "links" not found in the page');
  });

  it('reports a section whose data-build is not valid JSON', async () => {
    const verify = await load();
    const problems = verify(
      '<section id="stack" data-build="{not json"></section>',
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('stack');
  });

  it('has nothing to report for a page without build scripts', async () => {
    const verify = await load();
    expect(verify('<main><section id="x"></section></main>')).toEqual([]);
  });
});
