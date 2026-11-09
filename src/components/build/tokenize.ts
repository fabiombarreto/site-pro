export type TokenKind =
  'object' | 'function' | 'string' | 'number' | 'comment' | 'punct';

export function tokenize(command: string): { kind: TokenKind; text: string }[] {
  const tokens: { kind: TokenKind; text: string }[] = [];
  let i = 0;
  while (i < command.length) {
    const ch = command[i];
    if (ch === '"') {
      const close = command.indexOf('"', i + 1);
      const end = close === -1 ? command.length : close + 1;
      tokens.push({ kind: 'string', text: command.slice(i, end) });
      i = end;
    } else if (/[0-9]/.test(ch)) {
      let end = i;
      while (end < command.length && /[0-9]/.test(command[end])) end++;
      tokens.push({ kind: 'number', text: command.slice(i, end) });
      i = end;
    } else if (ch === '…') {
      tokens.push({ kind: 'comment', text: ch });
      i++;
    } else if (/[A-Za-z_$]/.test(ch)) {
      let end = i + 1;
      while (end < command.length && /[\w$]/.test(command[end])) end++;
      const kind: TokenKind = command[end] === '(' ? 'function' : 'object';
      tokens.push({ kind, text: command.slice(i, end) });
      i = end;
    } else {
      tokens.push({ kind: 'punct', text: ch });
      i++;
    }
  }
  return tokens;
}
