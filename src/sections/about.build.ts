import type { CollectionEntry } from 'astro:content';
import { estimateLines } from '../runtime/effect-timing';
import type { BuildScript } from '../runtime/types';
import { strings } from '../strings';
import { pacedSteps } from './pacing';

type ProfileData = CollectionEntry<'profile'>['data'];

export function aboutBuild(profile: ProfileData): BuildScript {
  const { steps, settle } = pacedSteps(
    [
      {
        step: {
          call: `about.heading("${strings.sections.about.title}")`,
          target: 'heading',
          effect: 'type-text',
          text: strings.sections.about.title,
        },
      },
      {
        step: {
          call: 'about.text(…)',
          target: 'text',
          effect: 'resolve-lines',
          count: estimateLines(profile.bio, 80),
        },
        pitch: 250,
      },
      {
        step: { call: 'about.links([…])', target: 'links', effect: 'pop' },
        pitch: 600,
      },
    ],
    1150,
  );
  return {
    section: 'about',
    file: 'about.md',
    command: 'renderAbout();',
    steps,
    settle,
  };
}
