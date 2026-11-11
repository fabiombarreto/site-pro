// PRPs/prds/stage-4-sections-effects.prd.md AC-3 Covers resolve from blur (phase 1 plan: AC-A4)
// The blurred cover is a tiny WebP data URI generated from the source file itself, inlined with
// no extra request, deterministic, free of source metadata, and a missing file fails naming it.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BLUR_WIDTH, blurDataUri } from '../../src/images/blur';

const PREFIX = 'data:image/webp;base64,';
let dir = '';
let cover = '';

const decode = (uri: string): Buffer =>
  Buffer.from(uri.slice(PREFIX.length), 'base64');

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'site-pro-blur-'));
  cover = join(dir, 'cover.png');
  await sharp({
    create: {
      width: 1280,
      height: 720,
      channels: 3,
      background: { r: 30, g: 80, b: 200 },
    },
  })
    .png()
    .toFile(cover);
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('blurred cover derivative', () => {
  it('is an inlinable WebP data URI', async () => {
    const uri = await blurDataUri(cover);
    expect(uri.startsWith(PREFIX)).toBe(true);
    expect((await sharp(decode(uri)).metadata()).format).toBe('webp');
  });

  it('is 32 px wide with the height following the 16:9 aspect', async () => {
    const meta = await sharp(decode(await blurDataUri(cover))).metadata();
    expect(BLUR_WIDTH).toBe(32);
    expect(meta.width).toBe(32);
    expect(meta.height).toBe(18);
  });

  it('is tiny enough to inline without an extra request', async () => {
    expect((await blurDataUri(cover)).length).toBeLessThan(2000);
  });

  it('keeps the colors of the source so it can stand in for the cover', async () => {
    const { data, info } = await sharp(decode(await blurDataUri(cover)))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const [r = 0, g = 0, b = 0] = data.subarray(0, info.channels);
    expect(b).toBeGreaterThan(r + 60);
    expect(b).toBeGreaterThan(g + 60);
  });

  it('yields the same string for the same image every time', async () => {
    expect(await blurDataUri(cover)).toBe(await blurDataUri(cover));
  });

  it('drops the EXIF metadata of the source', async () => {
    const tagged = join(dir, 'tagged.jpg');
    await sharp({
      create: {
        width: 64,
        height: 36,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .withExif({ IFD0: { ImageDescription: 'probe' } })
      .toFile(tagged);
    expect((await sharp(tagged).metadata()).exif).toBeDefined();
    const meta = await sharp(decode(await blurDataUri(tagged))).metadata();
    expect(meta.exif).toBeUndefined();
  });

  it('fails with a message naming the file when it is missing', async () => {
    await expect(blurDataUri(join(dir, 'missing-cover.png'))).rejects.toThrow(
      /missing-cover\.png/,
    );
  });
});
