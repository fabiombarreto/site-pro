// PRPs/prds/stage-4-sections-effects.prd.md AC-4 Swapping in the real assets: an image under
// src/assets carrying EXIF, XMP or GPS metadata fails `pnpm check:privacy` naming the file
// (phase 1 plan: AC-A8)
// check-privacy.mjs is exercised as a black box: spawned with --dist pointing at a clean fixture
// build and --assets pointing at a fixture folder, judged on exit code and printed output.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const root = process.cwd();
const GOOD_PAGE =
  '<!doctype html><html lang="en"><body><main><p>Brazil (UTC-3)</p>' +
  '<a href="https://github.com/fabiombarreto">GitHub</a></main></body></html>';

let dist = '';
let assets = '';

const privacy = (): { status: number | null; out: string } => {
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, 'scripts', 'check-privacy.mjs'),
      '--dist',
      dist,
      '--assets',
      assets,
    ],
    { cwd: root, encoding: 'utf8' },
  );
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
};

const blank = (format: 'jpeg' | 'png') =>
  sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })[format]();

beforeEach(() => {
  const base = mkdtempSync(join(tmpdir(), 'site-pro-image-privacy-'));
  dist = join(base, 'dist');
  assets = join(base, 'assets');
  mkdirSync(dist);
  mkdirSync(assets);
  writeFileSync(join(dist, 'index.html'), GOOD_PAGE);
});

afterEach(() => {
  rmSync(resolve(dist, '..'), { recursive: true, force: true });
});

describe('image metadata gate', () => {
  it('passes clean raster and SVG images and says it scanned image metadata', async () => {
    await blank('jpeg').toFile(join(assets, 'clean.jpg'));
    await blank('png').toFile(join(assets, 'clean.png'));
    writeFileSync(
      join(assets, 'clean.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4"/></svg>',
    );
    const result = privacy();
    expect(result.status).toBe(0);
    expect(result.out).toContain('PASS');
    expect(result.out).toContain('image metadata');
  });

  it('fails an image carrying EXIF and names the file', async () => {
    await blank('jpeg')
      .withExif({ IFD0: { ImageDescription: 'probe' } })
      .toFile(join(assets, 'exif-probe.jpg'));
    const result = privacy();
    expect(result.status).toBe(1);
    expect(result.out).toContain('FAIL exif-probe.jpg image-exif');
  });

  it('fails an image carrying GPS coordinates (GPS lives in EXIF) and names the file', async () => {
    await blank('jpeg')
      .withExif({
        IFD3: {
          GPSLatitudeRef: 'S',
          GPSLatitude: '23/1 33/1 0/1',
          GPSLongitudeRef: 'W',
          GPSLongitude: '46/1 38/1 0/1',
        },
      })
      .toFile(join(assets, 'gps-probe.jpg'));
    const result = privacy();
    expect(result.status).toBe(1);
    expect(result.out).toContain('FAIL gps-probe.jpg image-exif');
  });

  it('names a flagged image in a subfolder by its path under the assets folder', async () => {
    mkdirSync(join(assets, 'covers'));
    await blank('jpeg')
      .withExif({ IFD0: { ImageDescription: 'probe' } })
      .toFile(join(assets, 'covers', 'tagged.jpg'));
    const result = privacy();
    expect(result.status).toBe(1);
    expect(result.out).toContain('covers/tagged.jpg image-exif');
  });

  it('fails an SVG carrying XMP metadata and names the file', () => {
    writeFileSync(
      join(assets, 'xmp-probe.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"><metadata><x:xmpmeta xmlns:x="adobe:ns:meta/"/></metadata></svg>',
    );
    const result = privacy();
    expect(result.status).toBe(1);
    expect(result.out).toContain('FAIL xmp-probe.svg image-xmp');
  });

  it('reports every flagged file, not only the first', async () => {
    await blank('jpeg')
      .withExif({ IFD0: { ImageDescription: 'one' } })
      .toFile(join(assets, 'one.jpg'));
    await blank('jpeg')
      .withExif({ IFD0: { ImageDescription: 'two' } })
      .toFile(join(assets, 'two.jpg'));
    const result = privacy();
    expect(result.status).toBe(1);
    expect(result.out).toContain('one.jpg image-exif');
    expect(result.out).toContain('two.jpg image-exif');
  });

  it('treats a missing assets folder as an empty scan, not an error', () => {
    rmSync(assets, { recursive: true, force: true });
    expect(privacy().status).toBe(0);
  });

  it('passes on the committed src/assets', () => {
    const result = spawnSync(
      process.execPath,
      [
        resolve(root, 'scripts', 'check-privacy.mjs'),
        '--dist',
        dist,
        '--assets',
        resolve(root, 'src/assets'),
      ],
      { cwd: root, encoding: 'utf8' },
    );
    expect(`${result.stdout}${result.stderr}`).toContain('PASS');
    expect(result.status).toBe(0);
  });
});
