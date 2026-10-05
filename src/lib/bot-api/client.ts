import "server-only";
import { env } from "@/lib/env";
import type { AuditEntry, BotInfo, GuildDetail, GuildSummary, Health, Settings } from "@/lib/bot-api/types";

export class BotApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = "BotApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "PUT" | "POST" | "DELETE";
  /** Discord user the request is made for. The bot re-checks their access on every guild route. */
  actingUser?: string;
  body?: unknown;
};

async function request<T>(path: string, { method = "GET", actingUser, body }: RequestOptions = {}): Promise<T> {
  const { BOT_API_URL, BOT_API_TOKEN } = env();
  const headers: Record<string, string> = { Authorization: `Bearer ${BOT_API_TOKEN}` };
  if (actingUser) headers["X-Acting-User"] = actingUser;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${BOT_API_URL}/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new BotApiError(503, "bot_unreachable", "Der Bot ist gerade nicht erreichbar.");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string; details?: string[] };
    } | null;
    throw new BotApiError(
      response.status,
      payload?.error?.code ?? `http_${response.status}`,
      payload?.error?.message ?? "Unbekannter Fehler im Bot.",
      payload?.error?.details ?? [],
    );
  }
  return (await response.json()) as T;
}

const id = encodeURIComponent;

export const botApi = {
  health: () => request<Health>("/health"),
  bot: () => request<BotInfo>("/bot"),

  userGuilds: (userId: string, candidates: string[]) =>
    request<GuildSummary[]>(`/users/${id(userId)}/guilds?candidates=${candidates.map(id).join(",")}`),

  guild: (guildId: string, userId: string) => request<GuildDetail>(`/guilds/${id(guildId)}`, { actingUser: userId }),

  settings: (guildId: string, userId: string) =>
    request<Settings>(`/guilds/${id(guildId)}/settings`, { actingUser: userId }),

  updateSettings: (guildId: string, userId: string, settings: Settings) =>
    request<Settings>(`/guilds/${id(guildId)}/settings`, { method: "PUT", actingUser: userId, body: settings }),

  auditLog: (guildId: string, userId: string, limit = 50) =>
    request<AuditEntry[]>(`/guilds/${id(guildId)}/audit-log?limit=${limit}`, { actingUser: userId }),
};
