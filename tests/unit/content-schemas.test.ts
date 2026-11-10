// PRPs/prds/stage-2-foundation.prd.md AC-7 Content validated at build time (phase 3 plan: AC-A1, AC-A2)
// The schemas reject the docs/05 limit violations naming the field, and the
// approved content (profile, stack, four projects) satisfies them.
// Invalid fixtures live here under tests/, never in src/content/.
// Stage 4 Phase 1 (PRD AC-4): `photo` and `cover` are image() fields, so the profile and project
// schemas are factories that Astro calls with a context. The tests give them the same seam Astro
// does: an image() that validates the metadata object Astro resolves (src, width, height, format).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import {
  BIO_WORD_LIMIT,
  PROJECT_STATUSES,
  SUMMARY_MAX_LENGTH,
  TAGS_MAX,
  TAGS_MIN,
  profileSchema as profileSchemaFactory,
  projectSchema as projectSchemaFactory,
  stackSchema,
} from '../../src/content-schemas';

const imageMetadata = z.object({
  src: z.string(),
  width: z.number(),
  height: z.number(),
  format: z.string(),
});
const schemaContext = {
  image: () => imageMetadata,
} as unknown as Parameters<typeof profileSchemaFactory>[0];
const profileSchema = profileSchemaFactory(schemaContext);
const projectSchema = projectSchemaFactory(schemaContext);

const photoMetadata = {
  src: '/@fs/src/assets/sample.svg',
  width: 900,
  height: 1600,
  format: 'svg',
};
const coverMetadata = {
  src: '/@fs/src/assets/sample-cover.png',
  width: 1280,
  height: 720,
  format: 'png',
};

const contentDir = resolve(process.cwd(), 'src/content');
const projectsDir = resolve(contentDir, 'projects');

const readJson = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(contentDir, file), 'utf8'));

// Fields named by the first segment of every issue path.
function failedFields(schema: z.ZodType, value: unknown): string[] {
  const result = schema.safeParse(value);
  if (result.success) return [];
  return result.error.issues.map((issue) => String(issue.path[0]));
}

const words = (count: number): string => 'word '.repeat(count).trim();

const validProject = {
  title: 'Sample',
  summary: 'x'.repeat(SUMMARY_MAX_LENGTH),
  tags: ['alpha', 'beta'],
  links: {},
  year: '2026',
  featured: true,
  order: 1,
  status: 'active',
};

const validProfile = {
  name: 'Sample Person',
  headline: 'Sample.',
  role: 'Engineer',
  subtitle: 'Builds things.',
  photo: photoMetadata,
  bio: words(BIO_WORD_LIMIT - 1),
  links: [
    { label: 'GitHub', url: 'https://github.com/sample', icon: 'github' },
  ],
};

// Minimal reader for the frontmatter shape the project entries use.
function readProject(id: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const text = readFileSync(resolve(projectsDir, `${id}.md`), 'utf8').replace(
    /\r\n/g,
    '\n',
  );
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${id}: no frontmatter block`);
  const scalar = (raw: string): unknown => {
    const quoted = /^'(.*)'$/.exec(raw);
    if (quoted) return quoted[1];
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    if (/^\d+$/.test(raw)) return Number(raw);
    return raw;
  };
  const data: Record<string, unknown> = {};
  let current = '';
  for (const line of match[1].split('\n')) {
    const top = /^(\w+):\s*(.*)$/.exec(line);
    const item = /^ {2}- (.+)$/.exec(line);
    const nested = /^ {2}(\w+): (.+)$/.exec(line);
    if (top) {
      current = top[1];
      if (top[2] === '') data[current] = current === 'tags' ? [] : {};
      else data[current] = scalar(top[2]);
    } else if (item) {
      (data[current] as unknown[]).push(scalar(item[1]));
    } else if (nested) {
      (data[current] as Record<string, unknown>)[nested[1]] = scalar(nested[2]);
    }
  }
  return { data, body: match[2] };
}

describe('project schema limits', () => {
  it('accepts a project at every limit boundary', () => {
    expect(failedFields(projectSchema, validProject)).toEqual([]);
    expect(
      failedFields(projectSchema, {
        ...validProject,
        tags: Array.from({ length: TAGS_MAX }, (_, i) => `tag-${i}`),
      }),
    ).toEqual([]);
  });

  it('rejects a summary one character over the limit and names summary', () => {
    const summary = 'x'.repeat(SUMMARY_MAX_LENGTH + 1);
    expect(failedFields(projectSchema, { ...validProject, summary })).toEqual([
      'summary',
    ]);
  });

  it('rejects fewer tags than the minimum and names tags', () => {
    const tags = Array.from({ length: TAGS_MIN - 1 }, (_, i) => `tag-${i}`);
    expect(failedFields(projectSchema, { ...validProject, tags })).toEqual([
      'tags',
    ]);
  });

  it('rejects more tags than the maximum and names tags', () => {
    const tags = Array.from({ length: TAGS_MAX + 1 }, (_, i) => `tag-${i}`);
    expect(failedFields(projectSchema, { ...validProject, tags })).toEqual([
      'tags',
    ]);
  });

  it('accepts every documented status', () => {
    for (const status of PROJECT_STATUSES) {
      expect(failedFields(projectSchema, { ...validProject, status })).toEqual(
        [],
      );
    }
  });

  it('lists exactly the five documented statuses', () => {
    expect([...PROJECT_STATUSES]).toEqual([
      'active',
      'in development',
      'planning',
      'maintained',
      'archived',
    ]);
  });

  it('rejects a status outside the enum and names status', () => {
    expect(
      failedFields(projectSchema, { ...validProject, status: 'paused' }),
    ).toEqual(['status']);
  });

  it('rejects a numeric year because year is a string', () => {
    expect(
      failedFields(projectSchema, { ...validProject, year: 2026 }),
    ).toEqual(['year']);
  });

  it('rejects a link that is not https', () => {
    const links = { repo: 'http://github.com/sample/repo' };
    expect(failedFields(projectSchema, { ...validProject, links })).toEqual([
      'links',
    ]);
  });

  it('rejects an unknown field instead of silently dropping it', () => {
    const result = projectSchema.safeParse({ ...validProject, slug: 'sample' });
    expect(result.success).toBe(false);
  });

  it('keeps the cover optional and passes a given cover image through', () => {
    expect(failedFields(projectSchema, validProject)).toEqual([]);
    const result = projectSchema.safeParse({
      ...validProject,
      cover: coverMetadata,
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.cover).toEqual(coverMetadata);
  });
});

describe('profile schema limits', () => {
  it('accepts a bio one word under the limit', () => {
    expect(failedFields(profileSchema, validProfile)).toEqual([]);
  });

  it('rejects a bio at the word limit and names bio', () => {
    const bio = words(BIO_WORD_LIMIT);
    expect(failedFields(profileSchema, { ...validProfile, bio })).toEqual([
      'bio',
    ]);
  });

  it('counts words across paragraph breaks', () => {
    const half = words(BIO_WORD_LIMIT / 2);
    const bio = `${half}\n\n${half}`;
    expect(failedFields(profileSchema, { ...validProfile, bio })).toEqual([
      'bio',
    ]);
  });

  it('rejects a mailto link and names links', () => {
    const links = [
      { label: 'Mail', url: 'mailto:someone@example.com', icon: 'github' },
    ];
    expect(failedFields(profileSchema, { ...validProfile, links })).toEqual([
      'links',
    ]);
  });

  it('rejects an empty links list and names links', () => {
    expect(failedFields(profileSchema, { ...validProfile, links: [] })).toEqual(
      ['links'],
    );
  });

  it('requires a photo and passes the resolved image through', () => {
    const withoutPhoto: Partial<typeof validProfile> = { ...validProfile };
    delete withoutPhoto.photo;
    expect(failedFields(profileSchema, withoutPhoto)).toEqual(['photo']);
    const result = profileSchema.safeParse(validProfile);
    expect(result.success && result.data.photo).toEqual(photoMetadata);
  });
});

describe('stack schema', () => {
  it('rejects a group without items and names groups', () => {
    const groups = [{ name: 'languages', items: [] }];
    expect(failedFields(stackSchema, { groups })).toEqual(['groups']);
  });

  it('rejects an empty group list and names groups', () => {
    expect(failedFields(stackSchema, { groups: [] })).toEqual(['groups']);
  });
});

describe('approved content validates', () => {
  it('validates the profile entry', () => {
    // The committed `photo` is a path that Astro's image() resolves to metadata; the stand-in
    // image() receives that metadata here, and the path itself is checked on its own below.
    const profile = readJson('profile.json').profile as Record<string, unknown>;
    expect(
      failedFields(profileSchema, { ...profile, photo: photoMetadata }),
    ).toEqual([]);
  });

  it('references a profile photo that exists in src/assets, relative to profile.json', () => {
    const profile = readJson('profile.json').profile as { photo: string };
    expect(profile.photo).toMatch(/^\.\.\/assets\//);
    expect(existsSync(resolve(contentDir, profile.photo))).toBe(true);
  });

  it('validates the stack entry', () => {
    const stack = readJson('stack.json').stack;
    expect(failedFields(stackSchema, stack)).toEqual([]);
  });

  it('holds exactly the four approved projects, one Markdown file each', () => {
    expect(readdirSync(projectsDir).sort()).toEqual([
      'ai-track-record.md',
      'praesto-sum.md',
      'relay.md',
      'site-pro.md',
    ]);
  });

  it.each(['relay', 'ai-track-record', 'praesto-sum', 'site-pro'])(
    'validates the %s project',
    (id) => {
      expect(failedFields(projectSchema, readProject(id).data)).toEqual([]);
    },
  );

  it('keeps invalid fixtures out of src/content/', () => {
    expect(readdirSync(contentDir).sort()).toEqual([
      'profile.json',
      'projects',
      'stack.json',
    ]);
  });
});
