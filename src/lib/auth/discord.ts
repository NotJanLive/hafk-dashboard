import "server-only";
import { Discord } from "arctic";
import { env } from "@/lib/env";
import type { SessionUser } from "@/lib/auth/session";

const DISCORD_API = "https://discord.com/api/v10";

/** Least privilege: identity plus the guild list, nothing else. */
export const DISCORD_SCOPES = ["identify", "guilds"];

export function discordOAuth() {
  const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, APP_URL } = env();
  return new Discord(DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, `${APP_URL}/api/auth/callback/discord`);
}

export type DiscordPartialGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  /** Permission bitfield as decimal string. */
  permissions: string;
};

async function discordGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`Discord API ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchDiscordUser(accessToken: string): Promise<SessionUser> {
  const user = await discordGet<{ id: string; username: string; global_name: string | null; avatar: string | null }>(
    "/users/@me",
    accessToken,
  );
  return { id: user.id, username: user.username, globalName: user.global_name, avatar: user.avatar };
}

const GUILD_CACHE_TTL_MS = 60_000;
const guildCache = new Map<string, { expiresAt: number; guilds: DiscordPartialGuild[] }>();

/**
 * The user's guilds from Discord. Cached briefly per user because Discord rate limits this
 * endpoint aggressively and every page render of the server picker needs it.
 */
export async function fetchUserGuilds(userId: string, accessToken: string): Promise<DiscordPartialGuild[]> {
  const cached = guildCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.guilds;

  const guilds = await discordGet<DiscordPartialGuild[]>("/users/@me/guilds", accessToken);
  guildCache.set(userId, { expiresAt: Date.now() + GUILD_CACHE_TTL_MS, guilds });
  return guilds;
}

/**
 * Invite link for the bot. After authorizing, Discord sends the admin back to the dashboard
 * (`/api/invite/callback`), which opens the setup of the new server. Any server admin can use it
 * as long as "Public Bot" is enabled in the Developer Portal.
 */
export function botInviteUrl(guildId?: string) {
  const { DISCORD_CLIENT_ID, BOT_INVITE_PERMISSIONS, APP_URL } = env();
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", DISCORD_CLIENT_ID);
  url.searchParams.set("scope", "bot applications.commands");
  url.searchParams.set("permissions", BOT_INVITE_PERMISSIONS);
  url.searchParams.set("integration_type", "0");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", `${APP_URL}/api/invite/callback`);
  if (guildId) {
    url.searchParams.set("guild_id", guildId);
    url.searchParams.set("disable_guild_select", "true");
  }
  return url.toString();
}
