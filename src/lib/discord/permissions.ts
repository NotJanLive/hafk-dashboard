const ADMINISTRATOR = 1n << 3n;
const MANAGE_GUILD = 1n << 5n;

export function canManageGuild(permissions: string, owner: boolean) {
  if (owner) return true;
  const bits = BigInt(permissions);
  return (bits & ADMINISTRATOR) !== 0n || (bits & MANAGE_GUILD) !== 0n;
}

export const REQUIRED_BOT_PERMISSIONS: Record<string, string> = {
  VIEW_CHANNEL: "Kanäle ansehen",
  MESSAGE_SEND: "Nachrichten senden",
  MESSAGE_EMBED_LINKS: "Links einbetten",
  MESSAGE_ATTACH_FILES: "Dateien anhängen",
  MESSAGE_HISTORY: "Nachrichtenverlauf lesen",
  MESSAGE_ADD_REACTION: "Reaktionen hinzufügen",
  MESSAGE_EXT_EMOJI: "Externe Emojis verwenden",
  MANAGE_ROLES: "Rollen verwalten",
  MANAGE_CHANNEL: "Kanäle verwalten",
  MESSAGE_MANAGE: "Nachrichten verwalten",
};

export function missingBotPermissions(granted: string[]) {
  const set = new Set(granted);
  return Object.entries(REQUIRED_BOT_PERMISSIONS)
    .filter(([key]) => !set.has(key))
    .map(([key, label]) => ({ key, label }));
}
