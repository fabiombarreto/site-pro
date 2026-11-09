import type { CollectionEntry } from 'astro:content';
import type { BuildScript } from '../runtime/types';
import { strings } from '../strings';
import { pacedSteps } from './pacing';

type ProfileData = CollectionEntry<'profile'>['data'];

export function contactBuild(profile: ProfileData): BuildScript {
  if (!profile.location) throw new Error('profile.location is missing');
  const { steps, settle } = pacedSteps(
    [
      {
        step: {
          call: `contact.heading("${strings.sections.contact.title}")`,
          target: 'heading',
          effect: 'type-text',
          text: strings.sections.contact.title,
        },
      },
      {
        step: { call: 'contact.links([…])', target: 'links', effect: 'pop' },
        pitch: 450,
      },
      {
        step: {
          call: 'contact.location(…)',
          target: 'location',
          effect: 'type-text',
          text: profile.location,
        },
        pitch: 200,
      },
    ],
    1100,
  );
  return {
    section: 'contact',
    file: 'contact.tsx',
    command: 'renderContact();',
    steps,
    settle,
  };
}
