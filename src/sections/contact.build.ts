import type { CollectionEntry } from 'astro:content';
import type { BuildScript } from '../runtime/types';
import { buildStrings, strings } from '../strings';
import { labelList } from './call-args';
import { openAtEnter, pacedSteps } from './pacing';

type ProfileData = CollectionEntry<'profile'>['data'];

const COMMAND = 'renderContact();';

export function contactBuild(profile: ProfileData): BuildScript {
  if (!profile.location) throw new Error('profile.location is missing');
  const labels = profile.links.map((l) => l.label);
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
        step: {
          call: `contact.links(${labelList(labels)})`,
          target: 'links',
          effect: 'pop',
          count: profile.links.length,
        },
        pitch: 350,
      },
      {
        step: {
          call: `contact.location("${profile.location}")`,
          target: 'location',
          effect: 'type-text',
          text: profile.location,
        },
        pitch: 230,
      },
    ],
    1180,
  );
  return {
    section: 'contact',
    file: 'contact.tsx',
    command: COMMAND,
    log: buildStrings.openingChannels,
    timing: openAtEnter(COMMAND),
    steps,
    settle,
  };
}
