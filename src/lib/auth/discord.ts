import "server-only";
import { Discord } from "arctic";
import { env } from "@/lib/env";
import type { SessionUser } from "@/lib/auth/session";

const DISCORD_API = "https://discord.com/api/v10";

export const DISCORD_SCOPES = ["identify", "guilds"];

export function discordOAuth() {
  const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DASHBOARD_URL } = env();
  return new Discord(DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, `${DASHBOARD_URL}/api/auth/callback/discord`);
}

export type DiscordPartialGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

export class DiscordApiError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterMs: number | null,
    message: string,
  ) {
    super(message);
    this.name = "DiscordApiError";
  }

  get rateLimited() {
    return this.status === 429;
  }
}

async function discordGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    let retryAfterMs: number | null = null;
    if (response.status === 429) {
      const body = (await response.json().catch(() => null)) as { retry_after?: number } | null;
      const seconds = body?.retry_after ?? Number(response.headers.get("retry-after"));
      retryAfterMs = Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
    }
    throw new DiscordApiError(response.status, retryAfterMs, `Discord API ${path} failed with ${response.status}`);
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

const GUILD_CACHE_TTL_MS = 2 * 60_000;
const MAX_RATE_LIMIT_WAIT_MS = 3_000;

type GuildCacheEntry = {
  fetchedAt: number;
  guilds?: DiscordPartialGuild[];
  pending?: Promise<DiscordPartialGuild[]>;
};

const globalStore = globalThis as typeof globalThis & { __hafkGuildCache?: Map<string, GuildCacheEntry> };
const guildCache = (globalStore.__hafkGuildCache ??= new Map());

async function loadGuilds(accessToken: string): Promise<DiscordPartialGuild[]> {
  try {
    return await discordGet<DiscordPartialGuild[]>("/users/@me/guilds", accessToken);
  } catch (error) {
    if (
      error instanceof DiscordApiError &&
      error.rateLimited &&
      (error.retryAfterMs ?? Infinity) <= MAX_RATE_LIMIT_WAIT_MS
    ) {
      await new Promise((resolve) => setTimeout(resolve, error.retryAfterMs!));
      return discordGet<DiscordPartialGuild[]>("/users/@me/guilds", accessToken);
    }
    throw error;
  }
}

export async function fetchUserGuilds(userId: string, accessToken: string): Promise<DiscordPartialGuild[]> {
  const entry = guildCache.get(userId);
  if (entry?.guilds && Date.now() - entry.fetchedAt < GUILD_CACHE_TTL_MS) return entry.guilds;
  if (entry?.pending) return entry.pending;

  const previous = { fetchedAt: entry?.fetchedAt ?? 0, guilds: entry?.guilds };
  const pending = loadGuilds(accessToken)
    .then((guilds) => {
      guildCache.set(userId, { fetchedAt: Date.now(), guilds });
      return guilds;
    })
    .catch((error: unknown) => {
      guildCache.set(userId, previous);
      if (previous.guilds && error instanceof DiscordApiError && error.rateLimited) return previous.guilds;
      throw error;
    });
  guildCache.set(userId, { ...previous, pending });
  return pending;
}

export function botInviteUrl(guildId?: string) {
  const { DISCORD_CLIENT_ID, BOT_INVITE_PERMISSIONS, DASHBOARD_URL } = env();
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", DISCORD_CLIENT_ID);
  url.searchParams.set("scope", "bot applications.commands");
  url.searchParams.set("permissions", BOT_INVITE_PERMISSIONS);
  url.searchParams.set("integration_type", "0");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", `${DASHBOARD_URL}/api/invite/callback`);
  if (guildId) {
    url.searchParams.set("guild_id", guildId);
    url.searchParams.set("disable_guild_select", "true");
  }
  return url.toString();
}
