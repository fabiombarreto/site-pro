// PRPs/prds/stage-4-sections-effects.prd.md AC-2 ASCII generated at build time (phase 1 plan: AC-A1, AC-A2)
// The generator is exercised on fixtures built by construction: a fully transparent image gives
// all spaces, an opaque white image all @, a two-tone image the expected split; the output has 48
// columns, uses only the ramp, is deterministic, and a missing file fails with a message naming it.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ASCII_COLUMNS,
  ASCII_RAMP,
  asciiFromFile,
  asciiFromPixels,
} from '../../src/images/ascii';

const SIDE = 96;
let dir = '';

// Writes a SIDE x SIDE RGBA PNG whose pixel at column x is given by `pixel(x)`.
async function fixture(
  name: string,
  pixel: (x: number) => [number, number, number, number],
  width = SIDE,
  height = SIDE,
): Promise<string> {
  const buffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      buffer.set(pixel(x), (y * width + x) * 4);
    }
  }
  const file = join(dir, name);
  await sharp(buffer, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
  return file;
}

const body = (ascii: string): string => ascii.replace(/\n/g, '');

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'site-pro-ascii-'));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('ASCII generator', () => {
  it('renders a fully transparent image as spaces only', async () => {
    const ascii = await asciiFromFile(
      await fixture('clear.png', () => [0, 0, 0, 0]),
    );
    expect(body(ascii)).toMatch(/^ +$/);
  });

  it('renders an opaque white image as @ only', async () => {
    const ascii = await asciiFromFile(
      await fixture('white.png', () => [255, 255, 255, 255]),
    );
    expect(body(ascii)).toMatch(/^@+$/);
  });

  it('renders a half white, half transparent image as @ on the left and spaces on the right', async () => {
    const ascii = await asciiFromFile(
      await fixture('two.png', (x) =>
        x < SIDE / 2 ? [255, 255, 255, 255] : [0, 0, 0, 0],
      ),
    );
    const rows = ascii.split('\n');
    expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) {
      expect(row).toBe(`${'@'.repeat(24)}${' '.repeat(24)}`);
    }
  });

  it('uses 48 columns on every row and no trailing newline', async () => {
    const ascii = await asciiFromFile(
      await fixture('cols.png', () => [255, 255, 255, 255]),
    );
    expect(ASCII_COLUMNS).toBe(48);
    expect(ascii.endsWith('\n')).toBe(false);
    for (const row of ascii.split('\n')) expect(row).toHaveLength(48);
  });

  it('draws only characters of the ramp, whatever the pixels are', async () => {
    const ascii = await asciiFromFile(
      await fixture('gradient.png', (x) => {
        const v = Math.round((x / (SIDE - 1)) * 255);
        return [v, v, v, 255 - (x % 7) * 20];
      }),
    );
    for (const char of body(ascii)) expect(ASCII_RAMP).toContain(char);
  });

  it('draws brighter pixels with denser characters', async () => {
    const dark = body(
      await asciiFromFile(await fixture('dark.png', () => [64, 64, 64, 255])),
    );
    const light = body(
      await asciiFromFile(
        await fixture('light.png', () => [192, 192, 192, 255]),
      ),
    );
    const rank = (text: string): number => ASCII_RAMP.indexOf(text[0] ?? ' ');
    expect(new Set(dark).size).toBe(1);
    expect(new Set(light).size).toBe(1);
    expect(rank(light)).toBeGreaterThan(rank(dark));
    expect(rank(dark)).toBeGreaterThan(0);
  });

  it('makes a half transparent pixel less dense than the same pixel opaque', async () => {
    const opaque = body(
      await asciiFromFile(
        await fixture('opaque.png', () => [255, 255, 255, 255]),
      ),
    );
    const faded = body(
      await asciiFromFile(
        await fixture('faded.png', () => [255, 255, 255, 128]),
      ),
    );
    expect(ASCII_RAMP.indexOf(faded[0] ?? ' ')).toBeLessThan(
      ASCII_RAMP.indexOf(opaque[0] ?? ' '),
    );
  });

  it('matches the rows to the image aspect: a 9:16 image gets about 51 rows, a square one about 29', async () => {
    const tall = await asciiFromFile(
      await fixture('tall.png', () => [255, 255, 255, 255], 90, 160),
    );
    const square = await asciiFromFile(
      await fixture('square.png', () => [255, 255, 255, 255]),
    );
    expect(tall.split('\n')).toHaveLength(51);
    expect(square.split('\n')).toHaveLength(29);
  });

  it('yields the same string for the same image every time', async () => {
    const file = await fixture('same.png', (x) => [x * 2, 255 - x, 40, 255]);
    const first = await asciiFromFile(file);
    const second = await asciiFromFile(file);
    expect(second).toBe(first);
  });

  it('fails with a message naming the file when it is missing', async () => {
    const missing = join(dir, 'missing-photo.png');
    await expect(asciiFromFile(missing)).rejects.toThrow(/missing-photo\.png/);
  });

  it('fails with a message naming the file when it is not an image', async () => {
    const broken = join(dir, 'broken-photo.png');
    writeFileSync(broken, 'this is not an image');
    await expect(asciiFromFile(broken)).rejects.toThrow(/broken-photo\.png/);
  });
});

describe('ASCII from raw pixels', () => {
  it('treats pixels without an alpha channel as opaque', () => {
    const rgb = new Uint8Array(4 * 4 * 3).fill(255);
    const ascii = asciiFromPixels(rgb, 4, 4, 3, 4);
    expect(body(ascii)).toMatch(/^@+$/);
  });

  it('honours a custom column count', () => {
    const rgba = new Uint8Array(8 * 8 * 4).fill(255);
    const ascii = asciiFromPixels(rgba, 8, 8, 4, 8);
    for (const row of ascii.split('\n')) expect(row).toHaveLength(8);
  });
});
