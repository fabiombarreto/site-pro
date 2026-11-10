import type { CollectionEntry } from 'astro:content';
import type { BuildScript } from '../runtime/types';
import { buildStrings, strings } from '../strings';
import { openAtEnter, pacedSteps } from './pacing';

const COMMAND = 'renderProjects();';

export function projectsBuild(
  projects: CollectionEntry<'projects'>[],
): BuildScript {
  const { steps, settle } = pacedSteps(
    [
      {
        step: {
          call: `projects.heading("${strings.sections.projects.title}")`,
          target: 'heading',
          effect: 'type-text',
          text: strings.sections.projects.title,
        },
      },
      ...projects.map(({ id }, index) => ({
        step: {
          call: `projects.card("${id}")`,
          target: `card-${id}`,
          effect: 'build-card' as const,
        },
        pitch: index === 0 ? 280 : 180,
      })),
    ],
    1180,
  );
  return {
    section: 'projects',
    file: 'projects.tsx',
    command: COMMAND,
    log: buildStrings.fetchingProjects(projects.length),
    timing: openAtEnter(COMMAND),
    steps,
    settle,
  };
}
