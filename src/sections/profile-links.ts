import type { CollectionEntry } from 'astro:content';

type ProfileData = CollectionEntry<'profile'>['data'];

function urlFor(profile: ProfileData, icon: 'github' | 'linkedin'): string {
  const link = profile.links.find((l) => l.icon === icon);
  if (!link) throw new Error(`profile.json has no link with icon "${icon}"`);
  return link.url;
}

export function profileLinks(profile: ProfileData): {
  github: string;
  linkedin: string;
} {
  return {
    github: urlFor(profile, 'github'),
    linkedin: urlFor(profile, 'linkedin'),
  };
}
