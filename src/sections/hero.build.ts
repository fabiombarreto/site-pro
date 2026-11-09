import type { CollectionEntry } from 'astro:content';
import { estimateLines } from '../runtime/effect-timing';
import type { BuildScript } from '../runtime/types';
import { pacedSteps } from './pacing';

type ProfileData = CollectionEntry<'profile'>['data'];

export function heroBuild(profile: ProfileData): BuildScript {
  const { steps, settle } = pacedSteps(
    [
      {
        step: {
          call: `hero.title("${profile.headline}")`,
          target: 'title',
          effect: 'type-text',
          text: profile.headline,
        },
      },
      {
        step: {
          call: `hero.role("${profile.role}")`,
          target: 'role',
          effect: 'decode',
          text: profile.role,
        },
        pitch: 200,
      },
      {
        step: { call: 'hero.photo(…)', target: 'photo', effect: 'skeleton' },
        pitch: 100,
      },
      {
        step: {
          call: 'hero.intro(…)',
          target: 'intro',
          effect: 'resolve-lines',
          count: estimateLines(profile.subtitle, 48),
        },
        pitch: 300,
      },
      {
        step: { call: 'hero.links([…])', target: 'links', effect: 'pop' },
        pitch: 300,
      },
    ],
    1300,
  );
  return {
    section: 'top',
    file: 'hero.tsx',
    command: 'startSite();',
    timing: { commandEnd: 730, windowEnd: 1000, buildStart: 1300 },
    steps,
    settle,
  };
}
