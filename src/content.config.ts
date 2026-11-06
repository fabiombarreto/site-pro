import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { profileSchema, projectSchema, stackSchema } from './content-schemas';

const profile = defineCollection({
  loader: file('src/content/profile.json'),
  schema: profileSchema,
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '*.md' }),
  schema: projectSchema,
});

const stack = defineCollection({
  loader: file('src/content/stack.json'),
  schema: stackSchema,
});

export const collections = { profile, projects, stack };
