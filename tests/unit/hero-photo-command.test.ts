// PRPs/prds/stage-4-sections-effects.prd.md AC-1 Hero photo from ASCII (the window types hero.photo("<photo file name>"),
// cut to 29 characters with an ellipsis), AC-6 Section budgets (hero headline step by 2000 ms, duration at most 3200 ms,
// the hero created mark unchanged) (phase 2 plan: AC-A1, AC-A6)
// The hero script, compiled, names the photo step with its image-resolve effect and the file name from the content.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileScript } from '../../src/runtime/compiler';
import { truncateCall } from '../../src/runtime/effect-timing';
import { heroBuild } from '../../src/sections/hero.build';

type Profile = Parameters<typeof heroBuild>[0];

const profile = (
  JSON.parse(
    readFileSync(resolve(process.cwd(), 'src/content/profile.json'), 'utf8'),
  ) as { profile: Record<string, unknown> }
).profile as unknown as Profile;

const withPhoto = (photo: unknown): Profile =>
  ({ ...profile, photo }) as unknown as Profile;

const photoStep = (p: Profile) => {
  const t = compileScript(heroBuild(p));
  const s = t.steps.find((x) => x.target === 'photo');
  if (!s) throw new Error('no photo step');
  return { t, s };
};

describe('the hero photo step', () => {
  it('uses the image-resolve effect on the photo target, 1000 ms long', () => {
    const { s } = photoStep(profile);
    expect(s.effect).toBe('image-resolve');
    expect(s.end - s.start).toBe(1000);
  });

  it('types hero.photo with the source file name taken from the image metadata', () => {
    const { s } = photoStep(
      withPhoto({
        fsPath: 'C:\\site\\src\\assets\\me.jpg',
        src: '/_astro/me.AbC123.jpg',
      }),
    );
    expect(s.call).toBe('hero.photo("me.jpg")');
  });

  it('falls back to the served file name without its query or fragment', () => {
    const { s } = photoStep(withPhoto({ src: '/_astro/me.AbC123.jpg?v=1#x' }));
    expect(s.call).toBe('hero.photo("me.AbC123.jpg")');
  });

  it('never throws on a photo without a usable path and types an ellipsis instead', () => {
    for (const photo of ['../assets/me.svg', undefined, null, 42, {}]) {
      expect(() => heroBuild(withPhoto(photo))).not.toThrow();
      expect(photoStep(withPhoto(photo)).s.call).toBe('hero.photo("…")');
    }
  });

  it('shows a long file name cut to 29 characters with an ellipsis before the closing quote', () => {
    const { s } = photoStep(
      withPhoto({ fsPath: '/a/portrait-of-the-developer-cutout.png' }),
    );
    expect(s.call).toBe('hero.photo("portrait-of-the-developer-cutout.png")');
    const shown = truncateCall(s.call);
    expect(shown).toHaveLength(29);
    expect(shown.startsWith('hero.photo("')).toBe(true);
    expect(shown.endsWith('…")')).toBe(true);
  });

  it('places every hero step start and the created mark as tuned in Phase 3', () => {
    const { t } = photoStep(profile);
    expect(t.steps.map((x) => x.start)).toEqual([1300, 1500, 1600, 1850, 2080]);
    expect(t.steps[2]?.end).toBe(2600);
    expect(t.createdAt).toBe(2650);
    expect(t.commandEnd).toBe(730);
    expect(t.buildStart).toBe(1300);
    expect(t.steps[0]?.end ?? Infinity).toBeLessThanOrEqual(2000);
    expect(t.duration).toBeLessThanOrEqual(3200);
  });

  it('types the source file name it is given instead of the one in the content', () => {
    const t = compileScript(heroBuild(profile, 'photo-placeholder-body.svg'));
    const s = t.steps.find((x) => x.target === 'photo');
    expect(s?.call).toBe('hero.photo("photo-placeholder-body.svg")');
    expect(truncateCall(s?.call ?? '')).toHaveLength(29);
  });

  it('falls back to the content file name when the given name is empty', () => {
    const t = compileScript(heroBuild(profile, ''));
    expect(t.steps.find((x) => x.target === 'photo')?.call).toBe(
      'hero.photo("…")',
    );
  });

  it('keeps the photo step as long whatever the file name', () => {
    const a = photoStep(withPhoto({ fsPath: '/a/x.png' }));
    const b = photoStep(withPhoto({ fsPath: `/a/${'y'.repeat(80)}.png` }));
    expect(a.s.end - a.s.start).toBe(b.s.end - b.s.start);
    expect(a.t.createdAt).toBe(b.t.createdAt);
  });
});
