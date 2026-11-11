import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';

export const SUMMARY_MAX_LENGTH = 140;
export const TAGS_MIN = 2;
export const TAGS_MAX = 4;
export const BIO_WORD_LIMIT = 100;

export const PROJECT_STATUSES = [
  'active',
  'in development',
  'planning',
  'maintained',
  'archived',
] as const;

const httpsUrl = z.url().refine((value) => value.startsWith('https://'), {
  error: 'URL must start with https://',
});

const nonEmpty = z.string().min(1);

export const profileSchema = ({ image }: SchemaContext) =>
  z.strictObject({
    name: nonEmpty,
    headline: nonEmpty,
    role: z.string(),
    subtitle: z.string(),
    photo: image(),
    location: z.string().optional(),
    bio: z
      .string()
      .refine(
        (value) => value.split(/\s+/).filter(Boolean).length < BIO_WORD_LIMIT,
        {
          error: `Bio must have fewer than ${BIO_WORD_LIMIT} words`,
        },
      ),
    links: z
      .array(
        z.strictObject({
          label: z.string(),
          url: httpsUrl,
          icon: z.enum([
            'github',
            'linkedin',
            'x',
            'bluesky',
            'devto',
            'youtube',
          ]),
        }),
      )
      .min(1),
    cv: z.string().optional(),
  });

export const projectSchema = ({ image }: SchemaContext) =>
  z.strictObject({
    title: z.string(),
    summary: z.string().max(SUMMARY_MAX_LENGTH),
    cover: image().optional(),
    tags: z.array(nonEmpty).min(TAGS_MIN).max(TAGS_MAX),
    links: z.strictObject({
      repo: httpsUrl.optional(),
      demo: httpsUrl.optional(),
      article: httpsUrl.optional(),
    }),
    year: z.string().regex(/^\d{4}(?:[\u2013-]\d{4})?$/),
    featured: z.boolean(),
    order: z.number().int(),
    status: z.enum(PROJECT_STATUSES),
    githubRepo: z
      .string()
      .regex(/^[\w.-]+\/[\w.-]+$/)
      .optional(),
  });

export const stackSchema = z.strictObject({
  groups: z
    .array(
      z.strictObject({
        name: nonEmpty,
        items: z.array(nonEmpty).min(1),
      }),
    )
    .min(1),
});

export type Profile = z.infer<ReturnType<typeof profileSchema>>;
export type Project = z.infer<ReturnType<typeof projectSchema>>;
export type Stack = z.infer<typeof stackSchema>;
