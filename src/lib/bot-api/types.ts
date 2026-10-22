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

export type PollVisibility = "LIVE" | "AFTER_VOTE" | "CLOSED";

export type PollVoter = { id: string; name: string | null; avatarUrl: string | null };

export type PollOption = {
  id: string;
  label: string;
  emoji: string | null;
  votes: number | null;
  percent: number | null;
  voters: PollVoter[] | null;
};

export type Poll = {
  id: string;
  channelId: string;
  channelName: string | null;
  messageId: string | null;
  jumpUrl: string | null;
  question: string;
  description: string | null;
  anonymous: boolean;
  visibility: PollVisibility;
  hostResults: boolean;
  maxChoices: number;
  allowChange: boolean;
  pingRoleId: string | null;
  endsAt: string | null;
  closedAt: string | null;
  cancelled: boolean;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  allowedRoleIds: string[];
  participants: number;
  resultsVisible: boolean;
  options: PollOption[];
};

export type PollInput = {
  channelId: string;
  question: string;
  description: string | null;
  anonymous: boolean;
  visibility: PollVisibility;
  hostResults: boolean;
  maxChoices: number;
  allowChange: boolean;
  pingRoleId: string | null;
  durationMinutes: number;
  options: { label: string; emoji: string | null }[];
  allowedRoleIds: string[];
};

export type PollSettings = { creatorRoleIds: string[] };

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

export type MemberResult = { id: string; name: string; username: string; avatarUrl: string; bot: boolean };

export type TargetType = "ROLE" | "USER";
export type AccessTarget = { type: TargetType; id: string; name: string | null; avatarUrl: string | null };
export type AccessTargetInput = { type: TargetType; id: string };

export type TicketSettings = {
  logChannelId: string | null;
  closeDelaySeconds: number;
  closeRequestHours: number;
  creatorCanClose: boolean;
  claimLock: boolean;
  transferToAnyone: boolean;
  notesEnabled: boolean;
  ratingsEnabled: boolean;
  dmOnClose: boolean;
  creatorTranscript: boolean;
  retentionDays: number | null;
  staff: AccessTarget[];
  transcriptViewers: AccessTarget[];
};

export type TicketSettingsInput = Omit<TicketSettings, "staff" | "transcriptViewers"> & {
  staff: AccessTargetInput[];
  transcriptViewers: AccessTargetInput[];
};

export type FieldType =
  "SHORT" | "PARAGRAPH" | "SELECT" | "RADIO" | "CHECKBOXES" | "CHECKBOX" | "USER" | "ROLE" | "CHANNEL" | "FILE";

export type FieldOption = { label: string; description: string | null; emoji: string | null };

export type FormField = {
  type: FieldType;
  label: string;
  description: string | null;
  placeholder: string | null;
  required: boolean;
  minLength: number | null;
  maxLength: number | null;
  minValues: number | null;
  maxValues: number | null;
  options: FieldOption[];
};

export type TicketCategoryInput = {
  name: string;
  emoji: string | null;
  description: string | null;
  buttonStyle: ButtonStyle;
  parentId: string | null;
  channelPattern: string | null;
  welcome: MessagePayload | null;
  confirmText: string | null;
  formTitle: string | null;
  maxOpen: number;
  cooldownMinutes: number;
  pingSupport: boolean;
  includeStaff: boolean;
  application: boolean;
  acceptRoleId: string | null;
  acceptMessage: string | null;
  denyMessage: string | null;
  closeOnDecision: boolean;
  position: number;
  supportRoleIds: string[];
  pingRoleIds: string[];
  requiredRoleIds: string[];
  fields: FormField[];
};

export type TicketCategory = TicketCategoryInput & { id: string };

export type TicketPanelStyle = "BUTTONS" | "SELECT";

export type TicketPanelInput = {
  name: string;
  channelId: string;
  style: TicketPanelStyle;
  placeholder: string | null;
  payload: MessagePayload;
  categoryIds: string[];
};

export type TicketPanel = TicketPanelInput & {
  id: string;
  channelName: string | null;
  messageId: string | null;
  jumpUrl: string | null;
  updatedAt: string;
};

export type TicketUser = { id: string; name: string | null; avatarUrl: string | null };

export type TicketAnswer = { question: string; answer: string | null };

export type TicketStatus = "OPEN" | "CLOSED";

export type TicketSummary = {
  id: string;
  uuid: string;
  number: number;
  categoryId: string | null;
  category: string;
  channelId: string | null;
  channelName: string;
  status: TicketStatus;
  creator: TicketUser;
  openedBy: TicketUser | null;
  claimedBy: TicketUser | null;
  closedBy: TicketUser | null;
  createdAt: string;
  firstResponseAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  applicationState: "PENDING" | "ACCEPTED" | "DENIED" | null;
  answers: TicketAnswer[];
};

export type TicketPage = { tickets: TicketSummary[]; total: number; page: number; pageSize: number };

export type TicketStats = {
  open: number;
  closed: number;
  openedLast7Days: number;
  openedLast30Days: number;
  averageFirstResponseMinutes: number | null;
  averageResolutionMinutes: number | null;
  ratingAverage: number | null;
  ratings: number;
  categories: { categoryId: string | null; name: string; total: number; open: number }[];
  supporters: {
    user: TicketUser;
    claimed: number;
    closed: number;
    messages: number;
    ratingAverage: number | null;
    ratings: number;
  }[];
  days: { day: string; opened: number; closed: number }[];
};

export type BlacklistEntry = {
  target: AccessTarget;
  reason: string | null;
  expiresAt: string | null;
  createdBy: TicketUser | null;
  createdAt: string;
};

export type BlacklistInput = { type: TargetType; id: string; reason: string | null; days: number | null };

export type TranscriptAuthor = {
  id: string;
  name: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatar: number | null;
  bot: boolean;
  color?: number;
};

export type TranscriptAttachment = {
  asset: number | null;
  name: string;
  size: number;
  contentType: string | null;
  width?: number;
  height?: number;
  spoiler: boolean;
  description: string | null;
};

export type TranscriptReaction = {
  emoji?: string;
  emojiId?: string;
  emojiName?: string;
  animated?: boolean;
  asset?: number | null;
  count: number;
};

export type TranscriptRawEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  author?: { name?: string; url?: string; icon_url?: string; proxy_icon_url?: string };
  footer?: { text?: string; icon_url?: string; proxy_icon_url?: string };
  thumbnail?: { url?: string; proxy_url?: string };
  image?: { url?: string; proxy_url?: string };
  fields?: { name: string; value: string; inline?: boolean }[];
};

export type TranscriptMessage = {
  id: string;
  type: string;
  system: boolean;
  author: TranscriptAuthor;
  content: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  pinned: boolean;
  internal: boolean;
  reference?: string;
  embeds: TranscriptRawEmbed[];
  attachments: TranscriptAttachment[];
  stickers: { name: string; format: string; asset?: number | null }[];
  reactions: TranscriptReaction[];
  emojis: Record<string, number | null>;
  components: { label: string | null; style: string; url: string | null; disabled: boolean; emoji?: string }[];
  mentions: {
    users: Record<string, string>;
    roles: Record<string, { name: string; color?: number }>;
    channels: Record<string, string>;
  };
  edits: { content: string; editedAt: string | null }[];
};

export type TranscriptEvent = {
  type: string;
  actorId: string;
  targetId: string | null;
  detail: string | null;
  createdAt: string;
};

export type Transcript = {
  guild: { id: string; name: string; iconUrl: string | null };
  ticket: {
    id: string;
    uuid: string;
    number: number;
    category: string;
    channelName: string;
    status: TicketStatus;
    creatorId: string;
    openedBy: string;
    claimedBy: string | null;
    closedBy: string | null;
    createdAt: string;
    firstResponseAt: string | null;
    closedAt: string | null;
    closeReason: string | null;
    applicationState: "PENDING" | "ACCEPTED" | "DENIED" | null;
    answers: TicketAnswer[];
    rating: { stars: number; comment: string | null; supporterId: string | null; createdAt: string } | null;
  };
  users: Record<
    string,
    { id: string; name: string | null; avatarUrl: string | null; color: number | null; bot: boolean }
  >;
  roles: Record<string, { name: string; color: number | null }>;
  channels: Record<string, string>;
  events: TranscriptEvent[];
  messages: TranscriptMessage[];
  viewer: "MANAGER" | "STAFF" | "CREATOR";
  hiddenInternal: number;
};
