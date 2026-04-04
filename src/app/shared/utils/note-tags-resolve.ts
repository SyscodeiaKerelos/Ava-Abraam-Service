import type { NoteTag } from '../models/note-tag.model';

function norm(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ar');
}

/** Split ملاحظات cell on common Arabic/Latin delimiters. */
export function splitNoteFragments(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,،;؛|]+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function resolveNoteTagIds(
  notesRaw: string,
  tags: NoteTag[],
): { ids: string[]; unmatched: string[] } {
  const fragments = splitNoteFragments(notesRaw);
  if (fragments.length === 0) {
    return { ids: [], unmatched: [] };
  }

  const tagByNorm = new Map<string, NoteTag>();
  for (const t of tags) {
    tagByNorm.set(norm(t.labelAr), t);
    tagByNorm.set(norm(t.labelEn), t);
  }

  const ids: string[] = [];
  const unmatched: string[] = [];
  const seen = new Set<string>();

  for (const frag of fragments) {
    const hit = tagByNorm.get(norm(frag));
    if (hit) {
      if (!seen.has(hit.id)) {
        seen.add(hit.id);
        ids.push(hit.id);
      }
    } else {
      unmatched.push(frag);
    }
  }

  return { ids, unmatched };
}
