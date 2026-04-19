export interface WordPair {
  hebrew: string | null;
  translit: string | null;
}

const tokenize = (s: string): string[] =>
  s.trim().split(/\s+/).filter(t => t.length > 0);

export function pairWords(hebrew: string, translit: string): WordPair[] {
  const h = tokenize(hebrew);
  const t = tokenize(translit);
  const n = Math.max(h.length, t.length);
  const out: WordPair[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ hebrew: h[i] ?? null, translit: t[i] ?? null });
  }
  return out;
}
