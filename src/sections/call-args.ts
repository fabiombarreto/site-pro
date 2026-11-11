export const ARG_EXCERPT_CHARS = 25;

// The first words of a text, for a window command argument: whole words that
// fit in `max` characters, then an ellipsis. Quotes and angle brackets are
// dropped so the command stays one plain string.
export function excerpt(text: string, max = ARG_EXCERPT_CHARS): string {
  const clean = text.replace(/["<>]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const words = clean.split(' ');
  let out = '';
  for (const word of words) {
    const next = out === '' ? word : `${out} ${word}`;
    if (next.length > max) break;
    out = next;
  }
  if (out === '') out = (words[0] ?? '').slice(0, max);
  return `${out}…`;
}

// A JSON-like list of labels: ["GitHub", "LinkedIn"].
export function labelList(labels: readonly string[]): string {
  return `[${labels.map((label) => `"${label}"`).join(', ')}]`;
}
