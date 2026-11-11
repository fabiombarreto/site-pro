# Feature: Image pipeline and derivatives (Phase 1 of stage-4-sections-effects)

```
**Decision Gate**
- Active context: none
- Activated criteria: architectural decisions (an image pipeline on astro:assets + sharp; build-time ASCII and blurred derivatives serialized as build-layer data); cross-cutting patterns (content schemas, static HTML with intrinsic dimensions, budgets, privacy check); creation or change of components (Photo, ProjectCard, ProjectHeader, Hero, Projects, project page); business rules for content (C7, C10 to C16 image and metadata rules) and build (the data-build contract, B22); impact on shared UI (hero photo, project cards, project headers) with no visible change
- Decisions found:
  - 2026-11-10 Stage 4 PRD approved: placeholder photo and no covers, image pipeline on `astro:assets` + `sharp`, responsive AVIF/WebP, photo eager with `fetchpriority="high"`, covers lazy, ASCII (about 48 columns) and tiny blurred cover generated at build time and kept only as build-layer data, committed images carry no EXIF, XMP or GPS metadata
  - 2026-11-10 `src/runtime/` boundary: scheduler, clock, triggers, focus-rule, resize, keys, controls-timing, main and api stay frozen (this phase touches nothing under `src/runtime/`)
  - D12 Hero photo ASCII -> real photo (ASCII generated at build time from the photo itself); D16 personal content all rights reserved; D2 Astro + React + TypeScript strict; Only personal projects and the privacy list (a photo's GPS would reveal the city)
  - 2026-11-06 Stage 2 approved: the static page is the base; the final layout never moves
- Applicable anti-patterns:
  - Publishing private data (image metadata such as GPS must never reach the repository or the site)
  - Raw values instead of tokens (any CSS added here uses existing tokens only)
  - Mixing the two registers (ASCII and blurred data are build-layer data, never page text)
  - Layout-shifting build animations (intrinsic width/height on every image; no layout change)
  - Weakening tests to get a green run (existing unit tests that assert the old markup are updated by the test pair, never skipped)
- Applicable architectural rules:
  - SSG with complete final HTML: the real photo and cover images are in the static HTML from the start; the ASCII and blurred versions are data attributes, not text
  - Budgets: critical JS <= 20 KB gzip, runtime + effects <= 18 KB gzip, total JS <= 90 KB gzip, CSS <= 25 KB gzip, Lighthouse >= 95, LCP <= 2.5 s, CLS about 0
  - No new browser dependency; `sharp` is build-time only
  - docs/ is the source of truth; relay artifacts live in PRPs/
- Result: PROCEED
```

## Source

- `PRPs/prds/stage-4-sections-effects.prd.md` — Implementation Phases row 1: "Image pipeline and derivatives" — Goal: Every image goes through one build-time pipeline that also produces the data the effects need, with no visible change to the final page. — Success signal: AC-2, AC-4 and AC-5 pass; the no-JS boxes at 1280×800 and 375×812 are unchanged; budgets and Lighthouse stay green.

## Summary

Adds `sharp` and switches `profile.photo` and `project.cover` to Astro `image()` fields. A small build-time module set under `src/images/` produces: an ASCII rendering of the hero photo (48 columns, ramp ` .:-=+*#%@`, transparent pixels as spaces, deterministic), a tiny inlined blurred WebP data URI for each cover, and responsive AVIF/WebP `srcset` data through `getImage()` for raster sources (SVG passes through). Hero.astro, Projects.astro and the project page pass the resulting image objects to `Photo`, `ProjectCard` and `ProjectHeader`, which keep their markup and classes and gain intrinsic dimensions, `<picture>` sources, eager + `fetchpriority="high"` for the hero photo and `loading="lazy"` for covers. The ASCII is serialized as `data-build-ascii` on the photo target and the blur as `data-build-blur` on a card's grid cell (data only, for Phase 2's effect). `check:privacy` gains an image-metadata rule over `src/assets`. The final page is unchanged on the placeholder SVG.

## User Story

As the site owner
I want every image to go through one build-time pipeline that also generates the ASCII and blurred data the effects need
So that the real photo and covers become a content-only swap and Phase 2 can build `image-resolve` on data that already exists

## Problem Statement

There is no image pipeline: `profile.photo` and `project.cover` are plain strings resolved to raw URLs (`src/content-schemas.ts:27,59`; `src/components/page/resolve-asset.ts`); `astro:assets` and `sharp` are unused (`package.json`); `Photo.tsx` hard-codes 900 × 1600; no photo to ASCII script exists although docs/06-architecture.md plans one; and nothing stops an image with GPS metadata from reaching the public repository. Real assets would cost megabytes and break LCP, and Stage 4's `image-resolve` has no data to draw.

## Solution Statement

Move every image through `astro:assets` + `sharp` (responsive AVIF/WebP for raster sources, intrinsic dimensions, eager hero photo with `fetchpriority="high"`, lazy covers) and generate the effect data at build time in the same pass: ASCII for the photo, a tiny blurred cover inlined as a data URI. Keep the page markup and classes, add no browser JavaScript, extend `check:privacy` to fail on EXIF, XMP or GPS in `src/assets`, and leave the final page visually identical.

## Metadata

| Key | Value |
|-----|-------|
| Type | Feature (build-time pipeline) |
| Complexity | MEDIUM |
| Systems Affected | content schemas and collections, Hero/Projects sections, project page, Photo/ProjectCard/ProjectHeader components and CSS, `scripts/check-privacy.mjs`, `package.json` |
| Dependencies | `sharp` (new, build-time only); Astro 6.4 `astro:assets` |
| Estimated Tasks | 9 |
| Source PRD line ref | `PRPs/prds/stage-4-sections-effects.prd.md` lines 184 (row 1) and 192-195 (Phase Details) |
| phase_type | feature |

## Mandatory Reading

| Priority | Path | Lines | Why |
|----------|------|-------|-----|
| P0 | `PRPs/prds/stage-4-sections-effects.prd.md` | 70-74, 159-164, 192-195 | AC-2 to AC-5, the image pipeline, ASCII and cover notes, Phase 1 details |
| P0 | `src/content-schemas.ts` | 20-27, 56-59, 87-89 | `photo` and `cover` are `nonEmpty` strings; exported types |
| P0 | `src/content.config.ts` | 1-20 | Schemas are passed straight to `defineCollection` |
| P0 | `src/components/page/resolve-asset.ts` | 1-11 | Current URL-only resolution that the pipeline replaces |
| P0 | `src/components/page/Photo.tsx` | 12-41 | Hard-coded 900 × 1600 `<img>` |
| P0 | `src/components/page/ProjectCard.tsx` | 22-37 | `cover?: string` and the bare `<img>` |
| P0 | `src/components/page/ProjectHeader.tsx` | 23-58 | Same cover pattern on the project page |
| P0 | `src/sections/Hero.astro` | 15-37 | Where the photo is resolved and the `data-build-target="photo"` element lives |
| P0 | `src/sections/Projects.astro` | 14-47 | Card cells (`data-build-target="card-<id>"`) and cover resolution |
| P0 | `src/pages/projects/[slug].astro` | 25-56 | Project page cover resolution |
| P0 | `scripts/check-privacy.mjs` | 34-36, 78-90 | Violation shape, CLI flags, exit behavior |
| P0 | `src/styles/home.css` | 127-148, 150-256 | Photo heights 960/760/480 per breakpoint and the cover grid (2 columns, 1 under 768 px) that ground `sizes` |
| P1 | `src/components/page/Photo.css` | 1-29 | `.sp-photo` 9/16 box; `.sp-photo > *` positioning; `.sp-photo-img` |
| P1 | `src/components/page/ProjectCard.css` | 21-38, 115-129 | Child-combinator `> img` and `> *` selectors a `<picture>` wrapper would break |
| P1 | `src/components/page/ProjectHeader.css` | 44-56 | `.sp-project-cover > img` child combinator |
| P1 | `src/content/profile.json` | 7 | The `photo` path to move to an `image()`-relative path |
| P1 | `pnpm-workspace.yaml` | 1-3 | `sharp: true` already allowed to run its build step |
| P1 | `src/sections/profile-links.ts` | 1-19 | Style of a small typed helper that throws a message naming its input |
| P2 | `docs/decisions.md` | 243-248 | The recorded Stage 4 decision for this phase |

## Patterns to Mirror

```ts
# SOURCE: src/content-schemas.ts:20-27
const nonEmpty = z.string().min(1);

export const profileSchema = z.strictObject({
  name: nonEmpty,
  headline: nonEmpty,
  role: z.string(),
  subtitle: z.string(),
  photo: nonEmpty,
```
Copied by Task 6 (schemas keep `strictObject` and field order; `photo` and `cover` become `image()` fields inside a `({ image }) =>` factory).

```ts
# SOURCE: src/content.config.ts:5-13
const profile = defineCollection({
  loader: file('src/content/profile.json'),
  schema: profileSchema,
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '*.md' }),
  schema: projectSchema,
});
```
Copied by Task 6 (the factory is passed as `schema` unchanged in shape).

```ts
# SOURCE: src/sections/profile-links.ts:5-9
function urlFor(profile: ProfileData, icon: 'github' | 'linkedin'): string {
  const link = profile.links.find((l) => l.icon === icon);
  if (!link) throw new Error(`profile.json has no link with icon "${icon}"`);
  return link.url;
}
```
Copied by Tasks 2, 3 and 4 (small typed exported functions that throw an error whose message names the offending input).

```tsx
# SOURCE: src/components/page/Photo.tsx:30-40
  return (
    <div className={classes} style={style}>
      <img
        className="sp-photo-img"
        src={src}
        alt={alt}
        width={900}
        height={1600}
      />
    </div>
  );
```
Copied by Task 5 (the `<img>` keeps `sp-photo-img` and the wrapper; `src/width/height` come from the image object).

```tsx
# SOURCE: src/components/page/ProjectCard.tsx:35-37
      <div className="sp-card-cover">
        {cover ? <img src={cover} alt="" /> : <CoverPlaceholder label={slug} />}
      </div>
```
Copied by Task 5 (cards without a cover keep `CoverPlaceholder` unchanged).

```css
# SOURCE: src/components/page/ProjectCard.css:28-38
.sp-card-cover > img,
.sp-card-cover > .sp-cover-ph {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.sp-card.is-link:hover .sp-card-cover > * {
  transform: scale(1.03);
}
```
Copied by Task 5 (selectors are widened so an `img` inside a `<picture>` keeps the same box, fit and hover behavior).

```astro
# SOURCE: src/sections/Hero.astro:35-36
    <div class="sp-hero-photo" data-build-target="photo">
      <Photo src={photoUrl} alt={profile.name} />
```
Copied by Task 7 (the `data-build-ascii` attribute is added on this same element).

```astro
# SOURCE: src/sections/Projects.astro:34-45
      {projects.map(({ id, data }) => (
        <div class="sp-projects-cell" data-build-target={`card-${id}`}>
          <ProjectCard
            title={data.title}
            slug={id}
            ...
            cover={resolveAssetUrl(data.cover)}
          />
```
Copied by Task 8 (the `data-build-blur` attribute is added on this same cell; `cover` receives the pipeline image object).

```js
# SOURCE: scripts/check-privacy.mjs:34-36,78-90
export function findPrivacyViolations(distDir) {
  const violations = [];
  const add = (file, rule, match) => violations.push({ file, rule, match });
...
function main() {
  const flag = process.argv.indexOf('--dist');
  const distDir = resolve(flag === -1 ? 'dist' : process.argv[flag + 1]);
  const violations = findPrivacyViolations(distDir);
  for (const v of violations) {
    console.error(`FAIL ${v.file} ${v.rule} ${v.match}`);
  }
  if (violations.length > 0) process.exit(1);
```
Copied by Task 9 (same violation object shape, same `FAIL <file> <rule> <match>` line, same `--flag <dir>` parsing, same exit-1 behavior).

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `package.json`, `pnpm-lock.yaml` | UPDATE | Add `sharp` as a dependency (AC-2, AC-5) |
| `src/images/ascii.ts` | CREATE | Deterministic build-time photo to ASCII generator (AC-2) |
| `src/images/blur.ts` | CREATE | Tiny blurred cover as an inlinable data URI (AC-3 data) |
| `src/images/pipeline.ts` | CREATE | `getImage()`-based `ImageSource` builder, source-file lookup, ASCII and blur helpers for the Astro files (AC-2, AC-5) |
| `src/components/page/image-source.ts` | CREATE | Shared `ImageSource` type used by the page components |
| `src/components/page/Photo.tsx` | UPDATE | Intrinsic dimensions, `<picture>` sources, eager + `fetchpriority="high"` (AC-5) |
| `src/components/page/ProjectCard.tsx` | UPDATE | Cover as an image object: dimensions, lazy, sources (AC-5) |
| `src/components/page/ProjectHeader.tsx` | UPDATE | Same cover handling on the project page (AC-5) |
| `src/components/page/Photo.css` | UPDATE | Keep the `<picture>` wrapper from changing the photo box |
| `src/components/page/ProjectCard.css` | UPDATE | Selectors that survive a `<picture>` wrapper |
| `src/components/page/ProjectHeader.css` | UPDATE | Same for the project cover |
| `src/content-schemas.ts` | UPDATE | `photo` and `cover` become `image()` fields (AC-4) |
| `src/content.config.ts` | UPDATE | Pass the schema factories to `defineCollection` |
| `src/content/profile.json` | UPDATE | `photo` path relative to the content file so `image()` resolves it |
| `src/sections/Hero.astro` | UPDATE | Pipeline photo, `data-build-ascii` on the photo target, build failure naming the file (AC-2, AC-5) |
| `src/sections/Projects.astro` | UPDATE | Pipeline covers, `data-build-blur` on a card cell (AC-3, AC-5) |
| `src/pages/projects/[slug].astro` | UPDATE | Pipeline cover on the project page (AC-5) |
| `scripts/check-privacy.mjs` | UPDATE | Fail on EXIF, XMP or GPS metadata in `src/assets` (AC-4) |

## NOT Building (Scope Limits)

- `image-resolve`, the overlay ASCII piece, the Bayer dissolve and the card cover phase: Phase 2. Nothing reads `data-build-ascii` or `data-build-blur` yet.
- Any change to `src/runtime/` (frozen files and the effects files): this phase touches nothing under it.
- The final section scripts, commands, dock logs and timing tuning: Phase 3. The hero's `hero.photo(…)` step is not changed.
- Project page body text: Phase 4.
- Authoring tests, the E2E suite, the Lighthouse LCP assertion, docs/development.md swap procedure and docs/context/testing.md mapping: Phase 5 and the test pair (`tdd: false`, test-after).
- Delivering the real photo and covers, and new cover placeholder art: projects without a cover keep the CSS dot-grid placeholder; the photo stays the placeholder SVG.
- OG images, analytics, the Command Palette and every other Stage 5 and Stage 6 item.
- Removing `resolve-asset.ts` and its unit tests: the file is left in place (unused by pages) so the test pair retires its tests in the lifecycle ledger.

## Step-by-Step Tasks

### Task 1: UPDATE package.json (add sharp)

- **ACTION**: Run `pnpm add sharp` so `sharp` appears in `dependencies` and `pnpm-lock.yaml` is updated (`pnpm-workspace.yaml` already sets `sharp: true` under `allowBuilds`). Infrastructure task: it delivers no acceptance criterion by itself but every `AC-A` below depends on it. Do not add any other dependency.
- **MIRROR**: `package.json:24-30` dependency list shape (no dedicated snippet; the command edits the list in place).
- **VALIDATE**: `node -e "const s=require('sharp'); s({create:{width:2,height:2,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer().then(b=>{if(!b.length)process.exit(1)})"`

### Task 2: CREATE src/images/ascii.ts

- **ACTION**: Create a self-contained module (imports only `sharp` and Node built-ins, no relative imports, no `astro:` modules, no enums, so Node can run it with `--experimental-strip-types`). Export `ASCII_COLUMNS = 48`, `ASCII_RAMP = ' .:-=+*#%@'` (index 0 is the lightest, `@` the densest), `CELL_ASPECT = 0.6`, a pure `asciiFromPixels(data, width, height, channels, columns = ASCII_COLUMNS)` and `asciiFromFile(path, columns = ASCII_COLUMNS)`. `asciiFromFile` reads the image with `sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })`; rows = `Math.max(1, Math.round(columns * (height / width) * CELL_ASPECT))`; each cell's density is the average over its pixels of `luma * alpha` (luma = 0.2126 R + 0.7152 G + 0.0722 B scaled to 0..1, alpha 0..1); character index = `Math.round(density * (ASCII_RAMP.length - 1))`. A fully transparent cell is therefore a space, an opaque white cell is `@`, and brighter cells are denser. Rows are joined by `\n` with no trailing newline. The function is deterministic (no randomness, no time). Any failure reading the file throws `new Error(\`ASCII generation failed for ${path}: ${reason}\`)` so the message names the file (delivers AC-A1 and AC-A2).
- **MIRROR**: `src/sections/profile-links.ts:5-9` (small exported typed function; the error message names the offending input).
- **VALIDATE**: `node --experimental-strip-types --input-type=module -e "import sharp from 'sharp'; import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path'; import { asciiFromFile } from './src/images/ascii.ts'; const dir = mkdtempSync(join(tmpdir(), 'ascii-')); const W = 96; const make = async (name, pixel) => { const buf = Buffer.alloc(W * W * 4); for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) buf.set(pixel(x), (y * W + x) * 4); const file = join(dir, name); await sharp(buf, { raw: { width: W, height: W, channels: 4 } }).png().toFile(file); return file; }; const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); }; const body = (s) => s.replace(/\n/g, ''); const clear = await asciiFromFile(await make('clear.png', () => [0, 0, 0, 0])); const white = await asciiFromFile(await make('white.png', () => [255, 255, 255, 255])); const two = await asciiFromFile(await make('two.png', (x) => (x < W / 2 ? [255, 255, 255, 255] : [0, 0, 0, 0]))); const again = await asciiFromFile(join(dir, 'white.png')); if (!/^ +$/.test(body(clear))) fail('transparent image is not all spaces'); if (!/^@+$/.test(body(white))) fail('opaque white image is not all @'); if (white !== again) fail('output is not deterministic'); const rows = two.split('\n'); if (!rows.every((r) => /^@+ +$/.test(r))) fail('two-tone split is wrong'); if (rows[0].length !== 48) fail('column count is not 48'); let named = false; try { await asciiFromFile(join(dir, 'missing.png')); } catch (e) { named = String(e.message).includes('missing.png'); } if (!named) fail('missing file error does not name the file'); console.log('PASS: ascii generator');"`

### Task 3: CREATE src/images/blur.ts

- **ACTION**: Create a self-contained module (imports only `sharp`) exporting `BLUR_WIDTH = 32` and `blurDataUri(path)`. It resizes the source to `BLUR_WIDTH` pixels wide (height from the aspect), encodes WebP at quality 40 with `sharp(path).resize({ width: BLUR_WIDTH }).webp({ quality: 40 }).toBuffer()` (sharp strips metadata by default), and returns `data:image/webp;base64,<base64>`. No blur filter is applied here: the upscaled 32 px image is the blur, and the static CSS blur belongs to Phase 2's overlay piece. Failures throw `new Error(\`Blurred cover generation failed for ${path}: ${reason}\`)` (delivers the data of AC-A4).
- **MIRROR**: `src/sections/profile-links.ts:5-9` (small exported typed function; the error message names the offending input).
- **VALIDATE**: `node --experimental-strip-types --input-type=module -e "import sharp from 'sharp'; import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path'; import { blurDataUri } from './src/images/blur.ts'; const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); }; const file = join(mkdtempSync(join(tmpdir(), 'blur-')), 'cover.png'); await sharp({ create: { width: 1280, height: 720, channels: 3, background: { r: 30, g: 80, b: 200 } } }).png().toFile(file); const uri = await blurDataUri(file); const prefix = 'data:image/webp;base64,'; if (!uri.startsWith(prefix)) fail('not a webp data URI'); const meta = await sharp(Buffer.from(uri.slice(prefix.length), 'base64')).metadata(); if (meta.width !== 32 || meta.height !== 18) fail('unexpected size ' + meta.width + 'x' + meta.height); if (uri.length > 2000) fail('data URI is not tiny: ' + uri.length); if (uri !== (await blurDataUri(file))) fail('not deterministic'); let named = false; try { await blurDataUri(join(tmpdir(), 'missing-cover.png')); } catch (e) { named = String(e.message).includes('missing-cover.png'); } if (!named) fail('missing file error does not name the file'); console.log('PASS: blur derivative');"`

### Task 4: CREATE src/images/pipeline.ts and src/components/page/image-source.ts

- **ACTION**: First create `src/components/page/image-source.ts` exporting `interface ImageSource { src: string; width: number; height: number; sources?: readonly { type: string; srcset: string }[]; sizes?: string }`. Then create `src/images/pipeline.ts` (Astro build-time module; it may import `astro:assets`, `sharp`-free helpers `./ascii` and `./blur`). It exports:
  - `PHOTO_HEIGHTS = [960, 760, 480]` and `PHOTO_SIZES`: candidate widths are `round(height * metadata.width / metadata.height)` per height (270, 428 and 540 px for the 9:16 photo), each capped at the source width and de-duplicated; `sizes` is `(min-width: 1024px) 540px, (min-width: 768px) 428px, 270px`, derived from the `--photo-h` values 960, 760 and 480 at `src/styles/home.css:165,194,228` and the 9/16 box at `src/components/page/Photo.css:4`.
  - `COVER_WIDTHS = [480, 960]` (capped at the source width) with `sizes` `(min-width: 768px) 50vw, 100vw`, derived from the grid columns at `src/styles/home.css:131,246`.
  - `imageSource(asset: ImageMetadata, { widths, sizes }): Promise<ImageSource>`: for `asset.format === 'svg'` (or any non-raster) return `{ src: asset.src, width: asset.width, height: asset.height }` with no `sources` (SVG passes through as is); for a raster source call `getImage({ src: asset, width, format })` for `avif` and `webp` at every candidate width and return one `sources` entry per format in the order avif, webp (`type: 'image/avif'`, `type: 'image/webp'`, `srcset` as `<url> <w>w` joined by `, `), plus the fallback `<img>` `src` from `getImage` in the source's own format at the largest candidate width, with `width` and `height` taken from that result's `attributes`.
  - `sourcePathFor(asset: ImageMetadata): string`: finds the on-disk file by matching `asset.src` against an eager `import.meta.glob('/src/assets/**/*.{svg,png,jpg,jpeg,webp,avif,gif,tiff}', { eager: true, import: 'default' })` of image metadata and returns the repo-relative path of the matching key; if no key matches, throw `new Error(\`image source not found under src/assets for ${asset.src}\`)`. Before relying on the src-equality match, probe once with an `astro build` that the content-layer metadata `src` equals the glob metadata `src`; if Astro exposes a `fsPath` on `ImageMetadata`, use it instead and drop the glob.
  - `asciiForAsset(asset)` and `blurForAsset(asset)`: resolve `sourcePathFor(asset)` against `process.cwd()` and call `asciiFromFile` / `blurDataUri`.
  Delivers AC-A5 and AC-A6 (sources, dimensions) and the data access for AC-A3 and AC-A4. Nothing consumes the module yet, so the project still builds.
- **MIRROR**: `src/components/page/resolve-asset.ts:1-11` (the existing eager `import.meta.glob` over `/src/assets/**/*` that this module replaces for pages) and `src/sections/profile-links.ts:5-9` (error message naming the input).
- **VALIDATE**: `pnpm check`

### Task 5: UPDATE Photo.tsx, ProjectCard.tsx, ProjectHeader.tsx and their CSS

- **ACTION**: Change the page components to take `ImageSource` objects, keeping every class name and wrapper. `Photo`: replace `src: string` with `image: ImageSource` and add `priority?: boolean` (default false); render `<img className="sp-photo-img" src={image.src} alt={alt} width={image.width} height={image.height} />` wrapped in `<picture>` with one `<source type srcset sizes>` per `image.sources` entry only when `sources` is non-empty; when `priority` is true add `loading="eager"` and `fetchPriority="high"` (React emits `fetchpriority="high"`), otherwise `loading="lazy"`. `ProjectCard` and `ProjectHeader`: replace `cover?: string` with `cover?: ImageSource`; render `<img src width height alt="" loading="lazy" decoding="async" />` (inside `<picture>` with `<source>` elements when `sources` is non-empty); without a cover keep `<CoverPlaceholder label={slug} />` exactly as it is. CSS: `Photo.css`, `ProjectCard.css` and `ProjectHeader.css` get `picture { display: contents; }` scoped to `.sp-photo`, `.sp-card-cover` and `.sp-project-cover`; `.sp-photo > picture > .sp-photo-img` gets the same `position: relative; z-index: 1` that `.sp-photo > *` gave the direct child; in `ProjectCard.css` and `ProjectHeader.css` the `> img` child combinators become descendant selectors (`.sp-card-cover img`, `.sp-project-cover img`) and the hover and reduced-motion rules that use `.sp-card-cover > *` target `img` and `.sp-cover-ph` explicitly so the box, object-fit and hover scale are identical to today. Use existing tokens and values only; no new raw values. Delivers AC-A5, AC-A6 and the no-visible-change part of AC-A7. The Astro callers still pass the old values until Tasks 7 and 8, so `pnpm check` is deliberately deferred to Task 8; this task validates its own files.
- **MIRROR**: `src/components/page/Photo.tsx:30-40`, `src/components/page/ProjectCard.tsx:35-37` and `src/components/page/ProjectCard.css:28-38` (the Patterns to Mirror anchors).
- **VALIDATE**: `pnpm exec eslint src/components/page/Photo.tsx src/components/page/ProjectCard.tsx src/components/page/ProjectHeader.tsx src/components/page/image-source.ts && pnpm exec prettier --check src/components/page/Photo.tsx src/components/page/ProjectCard.tsx src/components/page/ProjectHeader.tsx src/components/page/Photo.css src/components/page/ProjectCard.css src/components/page/ProjectHeader.css src/images`

### Task 6: UPDATE content-schemas.ts, content.config.ts and profile.json

- **ACTION**: In `src/content-schemas.ts` turn `profileSchema` and `projectSchema` into factories `({ image }: SchemaContext) => z.strictObject({ ... })` (`import type { SchemaContext } from 'astro:content'`, type-only so Vitest can still import the file), replacing `photo: nonEmpty` with `photo: image()` and `cover: nonEmpty.optional()` with `cover: image().optional()`; every other field and `stackSchema` stay byte-identical. Update `Profile` and `Project` to `z.infer<ReturnType<typeof profileSchema>>` and `z.infer<ReturnType<typeof projectSchema>>`. In `src/content.config.ts` the collections keep passing `profileSchema` and `projectSchema` as `schema` (Astro calls them with the context). In `src/content/profile.json` change the `photo` value from `src/assets/photo-placeholder-body.svg` to the path relative to `src/content/profile.json`: `../assets/photo-placeholder-body.svg`. Do not add a `cover` to any project (no project has one in this phase). Delivers AC-A7 (a swap needs only a file in `src/assets` and a content reference). The existing schema unit tests import these as objects and will need the test pair's update; do not edit them.
- **MIRROR**: `src/content-schemas.ts:20-27` and `src/content.config.ts:5-13`.
- **VALIDATE**: `pnpm exec eslint src/content-schemas.ts src/content.config.ts && pnpm exec prettier --check src/content-schemas.ts src/content.config.ts src/content/profile.json`

### Task 7: UPDATE src/sections/Hero.astro

- **ACTION**: Replace the `resolveAssetUrl(profile.photo)` lines (`Hero.astro:17-18`) with the pipeline: `const photo = await imageSource(profile.photo, { widths: PHOTO_WIDTHS(...), sizes: PHOTO_SIZES })` and `const ascii = await asciiForAsset(profile.photo)` (imports from `../images/pipeline`; the hero's `profile.photo` is now an `ImageMetadata`). Render `<Photo image={photo} alt={profile.name} priority />` and add the ASCII as data on the photo target in exactly this attribute order: `<div class="sp-hero-photo" data-build-target="photo" data-build-ascii={ascii}>`. If ASCII generation or the source lookup throws, let the error fail `pnpm build` (the message already names the file); remove the unused `resolveAssetUrl` import. The placeholder SVG must render the same box as before (same `width`/`height`, no `<picture>` because SVG has no `sources`). Delivers AC-A2, AC-A3 and AC-A5 for the hero photo. `pnpm check` is deferred to Task 8.
- **MIRROR**: `src/sections/Hero.astro:35-36`.
- **VALIDATE**: `pnpm exec eslint src/sections/Hero.astro && pnpm exec prettier --check src/sections/Hero.astro`

### Task 8: UPDATE src/sections/Projects.astro and src/pages/projects/[slug].astro

- **ACTION**: In `Projects.astro` build, for every project with a cover, `cover = await imageSource(data.cover, { widths: COVER_WIDTHS, sizes: COVER_SIZES })` and `blur = await blurForAsset(data.cover)` (resolve them with `Promise.all` before the template); pass `cover={cover}` to `ProjectCard`, and render the cell as `<div class="sp-projects-cell" data-build-target={\`card-${id}\`} data-build-blur={blur}>`; for a project without a cover `blur` and `cover` are `undefined`, so Astro omits the attribute and the card keeps the dot-grid placeholder with no blur data. In `[slug].astro` do the same for `ProjectHeader`'s `cover` (no blur attribute there). Remove the unused `resolveAssetUrl` imports. The text content and accessibility tree of `<main>` must not change. Delivers AC-A4, AC-A6 and AC-A7. This is the first task after which the whole project type-checks and builds, so it runs the full static and build gate.
- **MIRROR**: `src/sections/Projects.astro:34-45` and `src/pages/projects/[slug].astro:42-51`.
- **VALIDATE**: `set -euo pipefail; pnpm check; pnpm build`

### Task 9: UPDATE scripts/check-privacy.mjs

- **ACTION**: Add an exported async `findImageMetadataViolations(assetsDir)` that walks `assetsDir` with the existing `walk()` helper and returns violations in the existing `{ file, rule, match }` shape: for raster files (`png|jpe?g|webp|avif|gif|tiff?`) read `sharp(path).metadata()` and add `image-exif` when `exif` is present and `image-xmp` when `xmp` is present (GPS lives in EXIF, so it is covered by `image-exif`; `match` carries a short human-readable description); for `.svg` files read the text and add `image-xmp` when it matches `/<x:xmpmeta|<rdf:RDF|\bexif:/i`. `file` is the path relative to `assetsDir`. In `main()` parse a new `--assets <dir>` flag with the same pattern as `--dist` (default `src/assets`), run both checks, print every violation as `FAIL <file> <rule> <match>`, exit 1 on any violation, and keep the existing `PASS` line (extend it to mention the assets scan). A missing assets directory is an empty scan, not an error. `findPrivacyViolations` stays synchronous and unchanged so the existing unit tests keep importing it. Delivers AC-A8.
- **MIRROR**: `scripts/check-privacy.mjs:34-36,78-90`.
- **VALIDATE**: `set -euo pipefail; pnpm build; tmp=$(mktemp -d); node --input-type=module -e "import sharp from 'sharp'; await sharp({ create: { width: 8, height: 8, channels: 3, background: '#ffffff' } }).jpeg().withExif({ IFD0: { ImageDescription: 'probe' } }).toFile(process.argv[1] + '/exif-probe.jpg');" "$tmp"; if node scripts/check-privacy.mjs --dist dist --assets "$tmp" 2>"$tmp/err.txt"; then echo "FAIL: an image with EXIF passed the privacy check"; exit 1; fi; grep -q 'exif-probe.jpg' "$tmp/err.txt"; node scripts/check-privacy.mjs --dist dist --assets src/assets`

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
set -euo pipefail
pnpm check
pnpm lint
pnpm format:check
pnpm check:tokens
```

### Level 2: CONTENT_INVARIANTS

Builds the site and inspects the built hero and cards against the generator's own output; also proves the frozen runtime files were not touched.

```bash
set -euo pipefail
pnpm build
if ! git diff --quiet HEAD -- src/runtime; then
  echo "FAIL: src/runtime was modified in Phase 1"; exit 1
fi
node --experimental-strip-types --input-type=module -e "
import { readFileSync } from 'node:fs';
import { asciiFromFile } from './src/images/ascii.ts';
const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); };
const html = readFileSync('dist/index.html', 'utf8');
const m = /data-build-target=\"photo\" data-build-ascii=\"([^\"]*)\"/.exec(html);
if (!m) fail('data-build-ascii is missing on the photo target');
const expected = await asciiFromFile('src/assets/photo-placeholder-body.svg');
if (m[1] !== expected) fail('ASCII attribute differs from the generator output');
if (!/^[ .:\-=+*#%@\n]+\$/.test(m[1])) fail('ASCII holds characters outside the ramp');
const img = /<img[^>]*class=\"sp-photo-img\"[^>]*>/.exec(html);
if (!img) fail('hero photo img not found');
const tag = img[0];
if (!/ width=\"\d+\"/.test(tag) || !/ height=\"\d+\"/.test(tag)) fail('hero photo has no intrinsic dimensions');
if (!tag.includes('fetchpriority=\"high\"')) fail('hero photo is not fetchpriority=high');
if (tag.includes('loading=\"lazy\"')) fail('hero photo is lazy');
if (html.includes('data-build-blur')) fail('a card has blur data but no project has a cover');
console.log('PASS: hero image delivery and ASCII data');
"
```

### Level 3: INTEGRATION

Block A swaps a fixture cover in through the same pipeline (no code change) and restores the content afterwards; block B runs the project gates.

```bash
# Block A: cover swap probe
set -euo pipefail
trap 'git checkout -- src/content/projects/relay.md; rm -f src/assets/probe-cover.png' EXIT
node -e "
const sharp = require('sharp');
sharp({ create: { width: 1280, height: 720, channels: 3, background: { r: 30, g: 80, b: 200 } } }).png().toFile('src/assets/probe-cover.png');
"
node -e "
const fs = require('node:fs');
const f = 'src/content/projects/relay.md';
const s = fs.readFileSync(f, 'utf8');
if (!/^tags:/m.test(s)) { console.error('FAIL: no tags key in relay.md frontmatter'); process.exit(1); }
fs.writeFileSync(f, s.replace(/^tags:/m, 'cover: ../../assets/probe-cover.png\ntags:'));
"
pnpm build
node -e "
const fs = require('node:fs');
const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); };
const html = fs.readFileSync('dist/index.html', 'utf8');
const start = html.indexOf('data-build-target=\"card-relay\"');
if (start < 0) fail('relay card cell not found');
const next = html.indexOf('data-build-target=\"card-', start + 10);
const cell = html.slice(start, next < 0 ? undefined : next);
if (!/data-build-blur=\"data:image\/webp;base64,[A-Za-z0-9+\/=]+\"/.test(cell)) fail('blurred cover data is missing');
if (!cell.includes('type=\"image/avif\"') || !cell.includes('type=\"image/webp\"')) fail('AVIF/WebP candidates missing');
const img = /<img[^>]*>/.exec(cell.slice(cell.indexOf('sp-card-cover')));
if (!img || !img[0].includes('loading=\"lazy\"') || !/ width=\"\d+\"/.test(img[0]) || !/ height=\"\d+\"/.test(img[0])) fail('cover img is not lazy with intrinsic dimensions');
console.log('PASS: cover pipeline swap probe');
"
```

```bash
# Block B: project gates (run after block A has restored the content)
set -euo pipefail
pnpm build
pnpm check:privacy
pnpm check:budgets
pnpm test:e2e
pnpm lighthouse
```

## Acceptance Criteria

- **AC-A1 (PRD AC-2):** The ASCII generator returns, for the committed fixtures-by-construction (fully transparent, opaque white, two-tone), all spaces, all `@` and the expected split; uses 48 columns and only characters from ` .:-=+*#%@`; and the same image always yields the same string.
- **AC-A2 (PRD AC-2):** When `profile.photo` points at a missing or unreadable file, `pnpm build` fails with a message naming the file.
- **AC-A3 (PRD AC-2):** The ASCII of the image named by `profile.photo` is generated at build time and serialized as `data-build-ascii` on the photo target (an attribute, never text), so `<main>`'s text and accessibility tree are unchanged.
- **AC-A4 (PRD AC-3):** For a project with a cover, a tiny blurred WebP data URI is generated at build time and inlined as `data-build-blur` on its card cell (no extra request); a project without a cover has no blur data and keeps the dot-grid placeholder.
- **AC-A5 (PRD AC-5):** The built `/` serves the hero photo from the static HTML with intrinsic `width` and `height`, `fetchpriority="high"`, no `loading="lazy"`, and, for a raster source, AVIF and WebP candidates sized for the 960, 760 and 480 px photo heights; the placeholder SVG is served as it is.
- **AC-A6 (PRD AC-5):** Every cover image is served with intrinsic dimensions, `loading="lazy"` and, for a raster source, AVIF and WebP candidates.
- **AC-A7 (PRD AC-4):** Adding a new photo or cover file under `src/assets` and referencing it from `src/content/profile.json` or a project's `cover` field regenerates the responsive versions, the ASCII and the blurred cover with no code change, and the final page's boxes at 1280×800 and 375×812 are unchanged on the current content.
- **AC-A8 (PRD AC-4):** Given an image under `src/assets` carrying EXIF, XMP or GPS metadata, `pnpm check:privacy` fails naming the file.
- **AC-A9 (PRD AC-12):** The runtime and effects stay at or under 18 KB gzip, critical JS under 20 KB, total JS under 90 KB, CSS under 25 KB, and Lighthouse stays at or above 0.95 with LCP at or under 2.5 s on `/` and `/projects/relay`.

R8b (PRD AC-N token check) applies here because this is PRD mode; every item above carries its PRD `AC-N`.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `sharp` fails to install or run in Cloudflare Workers Builds | L | H | `sharp` is already allowed in `pnpm-workspace.yaml` and Astro's own image service depends on it; verify on the Phase 1 preview build and record the fallback in `## Notes` if it fails |
| Content-layer `ImageMetadata.src` does not equal the glob-imported metadata `src`, so `sourcePathFor` finds nothing | M | M | Task 4 requires a one-time probe and the `fsPath` fallback; the lookup throws an error naming the asset instead of silently skipping |
| A `<picture>` wrapper or the new `<img>` attributes change a box (CLS, no-JS boxes) | M | H | `display: contents` on `picture`, widened CSS selectors in Task 5, intrinsic dimensions everywhere, SVG placeholder gets no `<picture>`; the Level 3 block B E2E run and Lighthouse catch regressions |
| The ASCII of a dark silhouette on a transparent background is sparse (density = luma × alpha) and looks different with the real photo | M | L | Columns, ramp and cell aspect live in one module as exported constants; tuned in Phase 2 on the preview (PRD open question) |
| `compressHTML` or attribute escaping alters whitespace in `data-build-ascii` | L | M | Level 2 compares the attribute to the generator output byte for byte; if it fails, change the serialization (still data, not text) |
| `profile.photo` relative path convention for `image()` differs from the assumption | L | M | Task 6 and `pnpm build` in Task 8 fail loudly; adjust the path in `profile.json` only |
| The cover pipeline has no committed input (no project has a cover) | M | M | Level 3 block A exercises it with a temporary fixture and restores the content; Phase 5 adds the permanent fixture |
| LCP and Lighthouse drop once the real photo is the largest element | M | M | Hero photo eager with `fetchpriority="high"` and AVIF/WebP now; measured here by `pnpm lighthouse` and again in Phase 2; numbers go to the owner instead of relaxing a threshold |
| A source image with GPS metadata reaches the public repository | L | H | Task 9 makes `pnpm check:privacy` fail naming the file; sharp output strips metadata by default |

## Notes

- **TDD routing (this plan, against the relay repo):** Current value of `tdd` in `docs/context/methodology.md`: **false**. Test-after ordering — when a test framework is declared, the test pair (test-writer/test-reviewer) authors and maintains the suite from the Acceptance Criteria above, after the Implementer + Code Review; with no framework declared, no tests are authored.
- **Test-file routing:** this phase's test-file creation and updates are routed through the `test-writer`/`test-reviewer` pair's lifecycle ledger (`/relay-write-test` → `/relay-test-write-review`), not authored by the Implementer — R-X is a blanket straight-fail on any test glob in the Implementer's diff. No task below and no `## Files to Change` row targets a test file, so this plan's `**VALIDATE**` commands exercise the change directly rather than invoking the test framework.
- Existing unit tests that assert the old behavior and will need the test pair's update after this phase (do not edit them in the Implementer): `tests/unit/page-content-components.test.ts` (Photo markup at the hard-coded 900 × 1600 `<img>`, `resolveAssetUrl`, card and header `cover`), `tests/unit/content-schemas.test.ts` (schemas become factories), and `tests/unit/page-styles.test.ts` (lists Photo and card CSS). The new AC-A1 to AC-A4 and AC-A8 fixtures (ASCII, blur, privacy) belong to the test pair, not to this plan. For this reason `pnpm test` is not in the Implementer's validation levels above; run it after the test pair has finished.
- `resolve-asset.ts` is intentionally left in place and unused by pages so its tests can be retired through the lifecycle ledger.
- The generator modules `src/images/ascii.ts` and `src/images/blur.ts` are deliberately self-contained (only `sharp` and Node built-ins) so they run under Node's type stripping and in Vitest without Astro virtual modules.
- Owner decision candidates: (1) `data-build-blur` sits on the card's grid cell, not the cover element, to keep `ProjectCard` markup unchanged; (2) cover `sizes` use `50vw` above 768 px, a deliberate over-estimate of the container; (3) `check:privacy` now scans `src/assets` by default. `sharp` on Workers Builds is verified on the Phase 1 preview.

*Generated: 2026-11-10*
*Approved: 2026-11-10*
*Implemented: 2026-11-10*
*Status: IMPLEMENTED*
