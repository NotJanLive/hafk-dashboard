/**
 * Mirrors the DTOs of the bot API (`de.notjan.bot.api.dto`). Discord IDs are strings.
 */

export type Grant = "OWNER" | "ADMINISTRATOR" | "MANAGE_SERVER" | "DASHBOARD_ROLE";

export type BotInfo = {
  id: string;
  username: string;
  avatarUrl: string;
  guildIds: string[];
};

export type Health = {
  status: string;
  gateway: string;
  guilds: number;
};

export type GuildSummary = {
  id: string;
  name: string;
  iconUrl: string | null;
  memberCount: number;
  setupCompleted: boolean;
  grant: Grant;
};

export type ChannelType = "text" | "news" | "voice" | "stage" | "category" | "forum" | "media" | (string & {});

export type Channel = {
  id: string;
  name: string;
  type: ChannelType;
  parentId: string | null;
  position: number;
};

export type Role = {
  id: string;
  name: string;
  /** RGB integer, 0 means "no color". */
  color: number;
  position: number;
  managed: boolean;
};

export type GuildDetail = {
  id: string;
  name: string;
  iconUrl: string | null;
  memberCount: number;
  grant: Grant;
  bot: { highestRolePosition: number; permissions: string[] };
  channels: Channel[];
  roles: Role[];
};

export type Settings = {
  logChannelId: string | null;
  dashboardRoleIds: string[];
  setupCompleted: boolean;
};

export type AuditEntry = {
  id: string;
  userId: string;
  userName: string | null;
  source: "DISCORD" | "DASHBOARD";
  action: string;
  summary: string;
  createdAt: string;
};
