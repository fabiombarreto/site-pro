import sharp from 'sharp';

export const ASCII_COLUMNS = 48;
// Index 0 is the lightest cell (a space), the last character the densest.
export const ASCII_RAMP = ' .:-=+*#%@';
// A character cell is taller than it is wide; this keeps the proportions.
export const CELL_ASPECT = 0.6;

export function asciiFromPixels(
  data: Uint8Array,
  width: number,
  height: number,
  channels: number,
  columns: number = ASCII_COLUMNS,
): string {
  const rows = Math.max(
    1,
    Math.round(columns * (height / width) * CELL_ASPECT),
  );
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    const y0 = Math.floor((row * height) / rows);
    const y1 = Math.max(y0 + 1, Math.floor(((row + 1) * height) / rows));
    let line = '';
    for (let col = 0; col < columns; col++) {
      const x0 = Math.floor((col * width) / columns);
      const x1 = Math.max(x0 + 1, Math.floor(((col + 1) * width) / columns));
      let sum = 0;
      let count = 0;
      for (let y = y0; y < y1 && y < height; y++) {
        for (let x = x0; x < x1 && x < width; x++) {
          const i = (y * width + x) * channels;
          const r = data[i] ?? 0;
          const g = data[i + 1] ?? 0;
          const b = data[i + 2] ?? 0;
          const alpha = channels >= 4 ? (data[i + 3] ?? 255) / 255 : 1;
          const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          sum += luma * alpha;
          count++;
        }
      }
      const density = count === 0 ? 0 : sum / count;
      const index = Math.round(density * (ASCII_RAMP.length - 1));
      line += ASCII_RAMP.charAt(
        Math.min(ASCII_RAMP.length - 1, Math.max(0, index)),
      );
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export async function asciiFromFile(
  path: string,
  columns: number = ASCII_COLUMNS,
): Promise<string> {
  try {
    const { data, info } = await sharp(path)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return asciiFromPixels(
      data,
      info.width,
      info.height,
      info.channels,
      columns,
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`ASCII generation failed for ${path}: ${reason}`);
  }
}
