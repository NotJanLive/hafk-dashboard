export type UnicodeEmoji = { emoji: string; label: string; group: number; search: string };

export const EMOJI_GROUPS = [
  { id: 0, label: "Smileys & Emotionen" },
  { id: 1, label: "Personen" },
  { id: 3, label: "Tiere & Natur" },
  { id: 4, label: "Essen & Trinken" },
  { id: 5, label: "Reisen & Orte" },
  { id: 6, label: "Aktivitäten" },
  { id: 7, label: "Objekte" },
  { id: 8, label: "Symbole" },
  { id: 9, label: "Flaggen" },
] as const;

const MAX_VERSION = 15;

type RawEmoji = {
  emoji: string;
  label: string;
  hexcode: string;
  group?: number;
  order?: number;
  version: number;
  tags?: string[];
};

let cache: Promise<UnicodeEmoji[]> | null = null;

export function loadUnicodeEmojis() {
  cache ??= Promise.all([import("emojibase-data/de/data.json"), import("emojibase-data/en/shortcodes/github.json")])
    .then(([data, shortcodes]) => {
      const codes = shortcodes.default as Record<string, string | string[]>;
      return (data.default as RawEmoji[])
        .filter((entry) => entry.group !== undefined && entry.group !== 2 && entry.version <= MAX_VERSION)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((entry) => ({
          emoji: entry.emoji,
          label: entry.label,
          group: entry.group!,
          search: [entry.label, ...(entry.tags ?? []), ...[codes[entry.hexcode] ?? []].flat()].join(" ").toLowerCase(),
        }));
    })
    .catch((error: unknown) => {
      cache = null;
      throw error;
    });
  return cache;
}
