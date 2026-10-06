export type Grant = "OWNER" | "ADMINISTRATOR" | "MANAGE_SERVER" | "DASHBOARD_ROLE";

export type BotInfo = {
  id: string;
  username: string;
  avatarUrl: string;
  guildIds: string[];
  publicBot: boolean;
  inviterIds: string[];
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

export type GuildEmoji = {
  id: string;
  name: string;
  animated: boolean;
};

export type Role = {
  id: string;
  name: string;
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

export type EmbedAuthor = { name?: string; url?: string; icon_url?: string };
export type EmbedFooter = { text?: string; icon_url?: string };
export type EmbedField = { name: string; value: string; inline?: boolean };
export type EmbedMedia = { url?: string };

export type Embed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  author?: EmbedAuthor;
  footer?: EmbedFooter;
  thumbnail?: EmbedMedia;
  image?: EmbedMedia;
  fields?: EmbedField[];
};

export type MessagePayload = { content?: string; embeds?: Embed[] };

export type SentMessage = {
  id: string;
  channelId: string;
  channelName: string | null;
  messageId: string;
  label: string;
  payload: MessagePayload;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  jumpUrl: string;
};

export type EmbedTemplate = { id: string; name: string; payload: MessagePayload; updatedAt: string };

export type ReactionRoleType = "BUTTONS" | "SELECT" | "REACTIONS";
export type ReactionRoleMode = "NORMAL" | "UNIQUE" | "VERIFY";
export type ButtonStyle = "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER";

export type ReactionRoleOption = {
  roleId: string;
  label: string | null;
  emoji: string | null;
  description: string | null;
  style: ButtonStyle | null;
};

export type ReactionRolePanel = {
  id: string;
  channelId: string;
  channelName: string | null;
  messageId: string;
  jumpUrl: string;
  label: string;
  type: ReactionRoleType;
  mode: ReactionRoleMode;
  payload: MessagePayload;
  options: ReactionRoleOption[];
  updatedAt: string;
};

export type ReactionRolePanelInput = {
  channelId: string | null;
  label: string | null;
  type: ReactionRoleType;
  mode: ReactionRoleMode;
  payload: MessagePayload;
  options: ReactionRoleOption[];
};

export type ResetPreview = {
  categories: { id: string; label: string; description: string; count: number; required: boolean }[];
  channels: { id: string; channelId: string; name: string; module: string; label: string; exists: boolean }[];
  messages: {
    id: string;
    channelId: string;
    channelName: string;
    messageId: string;
    module: string;
    label: string;
    jumpUrl: string;
  }[];
};

export type ResetRequest = { categories: string[]; deleteChannels: string[]; deleteMessages: string[] };

export type ResetResult = {
  clearedCategories: string[];
  deletedChannels: number;
  deletedMessages: number;
  problems: string[];
};
