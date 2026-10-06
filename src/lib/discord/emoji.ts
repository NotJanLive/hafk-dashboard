export type CustomEmojiRef = { id: string; name: string; animated: boolean };

export function parseCustomEmoji(value: string): CustomEmojiRef | null {
  const match = /^<(a?):(\w+):(\d+)>$/.exec(value.trim());
  return match ? { animated: match[1] === "a", name: match[2]!, id: match[3]! } : null;
}

export function formatCustomEmoji(emoji: CustomEmojiRef) {
  return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

export function customEmojiUrl(emoji: { id: string; animated: boolean }, size = 48) {
  return `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "webp"}?size=${size}`;
}
