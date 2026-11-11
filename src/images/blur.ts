import sharp from 'sharp';

export const BLUR_WIDTH = 32;

// The upscaled 32 px image is the blur; sharp strips metadata by default.
export async function blurDataUri(path: string): Promise<string> {
  try {
    const buffer = await sharp(path)
      .resize({ width: BLUR_WIDTH })
      .webp({ quality: 40 })
      .toBuffer();
    return `data:image/webp;base64,${buffer.toString('base64')}`;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Blurred cover generation failed for ${path}: ${reason}`);
  }
}
