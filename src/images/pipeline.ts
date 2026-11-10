import { isAbsolute, resolve } from 'node:path';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { ImageSource } from '../components/page/image-source';
import { asciiFromFile } from './ascii';
import { blurDataUri } from './blur';

// Photo box heights per breakpoint (--photo-h at src/styles/home.css) and the
// 9/16 box at Photo.css: 960 (>= 1024px), 760 (>= 768px), 480 (below).
export const PHOTO_HEIGHTS = [960, 760, 480] as const;
export const PHOTO_SIZES =
  '(min-width: 1024px) 540px, (min-width: 768px) 428px, 270px';

// Cover grid: two columns from 768px, one below (src/styles/home.css).
export const COVER_WIDTHS = [480, 960] as const;
export const COVER_SIZES = '(min-width: 768px) 50vw, 100vw';

// Candidate widths for the photo: height * aspect per breakpoint height.
export function photoWidths(asset: ImageMetadata): number[] {
  return PHOTO_HEIGHTS.map((h) => Math.round((h * asset.width) / asset.height));
}

interface ImageOptions {
  widths: readonly number[];
  sizes: string;
}

const RASTER = new Set(['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'tiff']);

export async function imageSource(
  asset: ImageMetadata,
  { widths, sizes }: ImageOptions,
): Promise<ImageSource> {
  if (!RASTER.has(asset.format)) {
    return { src: asset.src, width: asset.width, height: asset.height };
  }
  const candidates = [
    ...new Set(widths.map((w) => Math.min(w, asset.width))),
  ].sort((a, b) => a - b);
  const sources: { type: string; srcset: string }[] = [];
  for (const format of ['avif', 'webp'] as const) {
    const results = await Promise.all(
      candidates.map((width) => getImage({ src: asset, width, format })),
    );
    sources.push({
      type: `image/${format}`,
      srcset: results
        .map((r, i) => `${r.src} ${r.attributes.width ?? candidates[i]}w`)
        .join(', '),
    });
  }
  const largest = candidates[candidates.length - 1] ?? asset.width;
  const fallback = await getImage({
    src: asset,
    width: largest,
    format: asset.format,
  });
  return {
    src: fallback.src,
    width: Number(fallback.attributes.width ?? largest),
    height: Number(fallback.attributes.height ?? asset.height),
    sources,
    sizes,
  };
}

const files = import.meta.glob<ImageMetadata>(
  '/src/assets/**/*.{svg,png,jpg,jpeg,webp,avif,gif,tiff}',
  { eager: true, import: 'default' },
);

export function sourcePathFor(asset: ImageMetadata): string {
  const fsPath = (asset as { fsPath?: unknown }).fsPath;
  if (typeof fsPath === 'string' && fsPath.length > 0) return fsPath;
  const key = Object.keys(files).find((k) => files[k]?.src === asset.src);
  if (!key) {
    throw new Error(`image source not found under src/assets for ${asset.src}`);
  }
  return key.slice(1);
}

function absolute(path: string): string {
  return isAbsolute(path) ? path : resolve(process.cwd(), path);
}

export function asciiForAsset(asset: ImageMetadata): Promise<string> {
  return asciiFromFile(absolute(sourcePathFor(asset)));
}

export function blurForAsset(asset: ImageMetadata): Promise<string> {
  return blurDataUri(absolute(sourcePathFor(asset)));
}
