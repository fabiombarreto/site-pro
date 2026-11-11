import type { CollectionEntry } from 'astro:content';
import { estimateLines } from '../runtime/effect-timing';
import type { BuildScript } from '../runtime/types';
import { excerpt, labelList } from './call-args';
import { pacedSteps } from './pacing';

type ProfileData = CollectionEntry<'profile'>['data'];

// The photo's source file name, for the typed command; stubs without a path
// fall back to an ellipsis so the script never throws.
function photoFileName(photo: unknown): string {
  const meta = photo as { fsPath?: unknown; src?: unknown } | null;
  const raw =
    typeof meta?.fsPath === 'string'
      ? meta.fsPath
      : typeof meta?.src === 'string'
        ? meta.src
        : '';
  const name = raw.split(/[?#]/)[0].split(/[\\/]/).pop() ?? '';
  return name.length > 0 ? name : '…';
}

export function heroBuild(
  profile: ProfileData,
  photoName?: string,
): BuildScript {
  const typedPhotoName =
    photoName !== undefined && photoName.length > 0
      ? photoName
      : photoFileName(profile.photo);
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
        step: {
          call: `hero.photo("${typedPhotoName}")`,
          target: 'photo',
          effect: 'image-resolve',
        },
        pitch: 100,
      },
      {
        step: {
          call: `hero.intro("${excerpt(profile.subtitle)}")`,
          target: 'intro',
          effect: 'resolve-lines',
          count: estimateLines(profile.subtitle, 48),
        },
        pitch: 250,
      },
      {
        // The hero renders one "See my work" button plus one button per
        // profile link (Hero.astro), so the buttons pop one after another.
        step: {
          call: `hero.links(${labelList(profile.links.map((l) => l.label))})`,
          target: 'links',
          effect: 'pop',
          count: profile.links.length + 1,
        },
        pitch: 230,
      },
    ],
    1350,
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
