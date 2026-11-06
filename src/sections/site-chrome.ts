import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { profileLinks } from './profile-links';

type ProfileData = CollectionEntry<'profile'>['data'];

export async function loadSiteChrome(): Promise<{
  profile: ProfileData;
  links: { github: string; linkedin: string };
  sourceHref: string;
}> {
  const profileEntry = await getEntry('profile', 'profile');
  if (!profileEntry) throw new Error('The profile entry is missing');
  const projects = await getCollection('projects');
  const sourceHref = projects.find((p) => p.id === 'site-pro')?.data.links.repo;
  if (!sourceHref) throw new Error('The site-pro project has no repo link');
  return {
    profile: profileEntry.data,
    links: profileLinks(profileEntry.data),
    sourceHref,
  };
}

export function pageTitle(
  label: string,
  profile: { headline: string },
): string {
  return `${label.replace(/\.$/, '')} - ${profile.headline.replace(/\.$/, '')}`;
}
