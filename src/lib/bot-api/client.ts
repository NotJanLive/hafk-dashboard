import "server-only";
import { env } from "@/lib/env";
import type {
  AuditEntry,
  BotInfo,
  EmbedTemplate,
  GuildDetail,
  GuildEmoji,
  GuildSummary,
  Health,
  MessagePayload,
  ReactionRolePanel,
  ReactionRolePanelInput,
  ResetPreview,
  ResetRequest,
  ResetResult,
  SentMessage,
  Settings,
} from "@/lib/bot-api/types";

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
  actingUser?: string;
  body?: unknown;
};

async function request<T>(path: string, { method = "GET", actingUser, body }: RequestOptions = {}): Promise<T> {
  const { BOT_API_URL, SHARED_SECRET } = env();
  const headers: Record<string, string> = { Authorization: `Bearer ${SHARED_SECRET}` };
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
  if (response.status === 204) return undefined as T;
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

  emojis: (guildId: string, userId: string) =>
    request<GuildEmoji[]>(`/guilds/${id(guildId)}/emojis`, { actingUser: userId }),

  auditLog: (guildId: string, userId: string, limit = 50) =>
    request<AuditEntry[]>(`/guilds/${id(guildId)}/audit-log?limit=${limit}`, { actingUser: userId }),

  embeds: {
    sent: (guildId: string, userId: string) =>
      request<SentMessage[]>(`/guilds/${id(guildId)}/embeds/messages`, { actingUser: userId }),
    getSent: (guildId: string, userId: string, messageId: string) =>
      request<SentMessage>(`/guilds/${id(guildId)}/embeds/messages/${id(messageId)}`, { actingUser: userId }),
    send: (
      guildId: string,
      userId: string,
      body: { channelId: string; label: string | null; payload: MessagePayload },
    ) => request<SentMessage>(`/guilds/${id(guildId)}/embeds/messages`, { method: "POST", actingUser: userId, body }),
    edit: (
      guildId: string,
      userId: string,
      messageId: string,
      body: { label: string | null; payload: MessagePayload },
    ) =>
      request<SentMessage>(`/guilds/${id(guildId)}/embeds/messages/${id(messageId)}`, {
        method: "PUT",
        actingUser: userId,
        body,
      }),
    deleteSent: (guildId: string, userId: string, messageId: string, deleteMessage: boolean) =>
      request<void>(`/guilds/${id(guildId)}/embeds/messages/${id(messageId)}?deleteMessage=${deleteMessage}`, {
        method: "DELETE",
        actingUser: userId,
      }),
    templates: (guildId: string, userId: string) =>
      request<EmbedTemplate[]>(`/guilds/${id(guildId)}/embeds/templates`, { actingUser: userId }),
    getTemplate: (guildId: string, userId: string, templateId: string) =>
      request<EmbedTemplate>(`/guilds/${id(guildId)}/embeds/templates/${id(templateId)}`, { actingUser: userId }),
    createTemplate: (guildId: string, userId: string, body: { name: string; payload: MessagePayload }) =>
      request<EmbedTemplate>(`/guilds/${id(guildId)}/embeds/templates`, { method: "POST", actingUser: userId, body }),
    updateTemplate: (
      guildId: string,
      userId: string,
      templateId: string,
      body: { name: string; payload: MessagePayload },
    ) =>
      request<EmbedTemplate>(`/guilds/${id(guildId)}/embeds/templates/${id(templateId)}`, {
        method: "PUT",
        actingUser: userId,
        body,
      }),
    deleteTemplate: (guildId: string, userId: string, templateId: string) =>
      request<void>(`/guilds/${id(guildId)}/embeds/templates/${id(templateId)}`, {
        method: "DELETE",
        actingUser: userId,
      }),
  },

  reactionRoles: {
    list: (guildId: string, userId: string) =>
      request<ReactionRolePanel[]>(`/guilds/${id(guildId)}/reaction-roles`, { actingUser: userId }),
    get: (guildId: string, userId: string, panelId: string) =>
      request<ReactionRolePanel>(`/guilds/${id(guildId)}/reaction-roles/${id(panelId)}`, { actingUser: userId }),
    create: (guildId: string, userId: string, body: ReactionRolePanelInput) =>
      request<ReactionRolePanel>(`/guilds/${id(guildId)}/reaction-roles`, { method: "POST", actingUser: userId, body }),
    update: (guildId: string, userId: string, panelId: string, body: ReactionRolePanelInput) =>
      request<ReactionRolePanel>(`/guilds/${id(guildId)}/reaction-roles/${id(panelId)}`, {
        method: "PUT",
        actingUser: userId,
        body,
      }),
    remove: (guildId: string, userId: string, panelId: string, deleteMessage: boolean) =>
      request<void>(`/guilds/${id(guildId)}/reaction-roles/${id(panelId)}?deleteMessage=${deleteMessage}`, {
        method: "DELETE",
        actingUser: userId,
      }),
  },

  reset: {
    preview: (guildId: string, userId: string) =>
      request<ResetPreview>(`/guilds/${id(guildId)}/reset`, { actingUser: userId }),
    execute: (guildId: string, userId: string, body: ResetRequest) =>
      request<ResetResult>(`/guilds/${id(guildId)}/reset`, { method: "POST", actingUser: userId, body }),
  },
};
