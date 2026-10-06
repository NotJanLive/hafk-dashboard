const CDN = "https://cdn.discordapp.com";

export function isSnowflake(value: string) {
  return /^\d{17,20}$/.test(value);
}

export function guildIconUrl(guildId: string, icon: string | null, size = 128) {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "webp";
  return `${CDN}/icons/${guildId}/${icon}.${ext}?size=${size}`;
}

export function userAvatarUrl(userId: string, avatar: string | null, size = 128) {
  if (!avatar) {
    const index = Number((BigInt(userId) >> 22n) % 6n);
    return `${CDN}/embed/avatars/${index}.png`;
  }
  const ext = avatar.startsWith("a_") ? "gif" : "webp";
  return `${CDN}/avatars/${userId}/${avatar}.${ext}?size=${size}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function roleColor(color: number) {
  return color === 0 ? null : `#${color.toString(16).padStart(6, "0")}`;
}
