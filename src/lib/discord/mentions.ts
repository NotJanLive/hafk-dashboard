export type MentionToken =
  | { type: "text"; value: string }
  | { type: "channel"; id: string }
  | { type: "role"; id: string }
  | { type: "user"; id: string };

const MENTION = /<(#|@&|@!?)(\d{17,20})>/g;

export function parseMentions(text: string): MentionToken[] {
  const tokens: MentionToken[] = [];
  let last = 0;
  for (const match of text.matchAll(MENTION)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ type: "text", value: text.slice(last, index) });
    const [, kind, id] = match;
    tokens.push({ type: kind === "#" ? "channel" : kind === "@&" ? "role" : "user", id: id! });
    last = index + match[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return tokens;
}
