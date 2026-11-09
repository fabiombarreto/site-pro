import type { CollectionEntry } from 'astro:content';
import type { BuildScript } from '../runtime/types';
import { strings } from '../strings';
import { pacedSteps } from './pacing';

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
        pitch: index === 0 ? 450 : 330,
      })),
    ],
    1990,
  );
  return {
    section: 'projects',
    file: 'projects.tsx',
    command: 'renderProjects();',
    steps,
    settle,
  };
}
