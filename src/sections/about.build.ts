import type { CollectionEntry } from 'astro:content';
import { estimateLines } from '../runtime/effect-timing';
import type { BuildScript } from '../runtime/types';
import { buildStrings, strings } from '../strings';
import { excerpt, labelList } from './call-args';
import { openAtEnter, pacedSteps } from './pacing';

type ProfileData = CollectionEntry<'profile'>['data'];

const COMMAND = 'renderAbout();';

export function aboutBuild(profile: ProfileData): BuildScript {
  const labels = profile.links.map((l) => l.label);
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
          call: `about.text("${excerpt(profile.bio)}")`,
          target: 'text',
          effect: 'resolve-lines',
          count: estimateLines(profile.bio, 80),
        },
        pitch: 250,
      },
      {
        step: {
          call: `about.links(${labelList(labels)})`,
          target: 'links',
          effect: 'pop',
          count: profile.links.length,
        },
        pitch: 500,
      },
    ],
    1230,
  );
  return {
    section: 'about',
    file: 'about.md',
    command: COMMAND,
    log: buildStrings.readingFile('about.md'),
    timing: openAtEnter(COMMAND),
    steps,
    settle,
  };
}
