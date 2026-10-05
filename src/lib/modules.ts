/**
 * Catalog of bot modules shown in the navigation and the overview "patch panel".
 * A module becomes `available` once its bot and dashboard parts are merged.
 */
export type ModuleId =
  | "embeds"
  | "reaction-roles"
  | "tickets"
  | "polls"
  | "temp-voice"
  | "levels"
  | "live-ticker"
  | "server-status"
  | "music";

export type ModuleInfo = {
  id: ModuleId;
  name: string;
  description: string;
  available: boolean;
};

export const MODULES: ModuleInfo[] = [
  { id: "embeds", name: "Embeds", description: "Eingebettete Nachrichten gestalten und senden", available: false },
  {
    id: "reaction-roles",
    name: "Reaction Roles",
    description: "Rollen per Button, Menü oder Reaktion",
    available: false,
  },
  { id: "tickets", name: "Tickets", description: "Support-Tickets mit Kategorien und Transcripts", available: false },
  {
    id: "polls",
    name: "Umfragen",
    description: "Anonyme Abstimmungen ohne sichtbare Zwischenstände",
    available: false,
  },
  { id: "temp-voice", name: "Temp Voice", description: "Sprachkanäle, die beim Beitreten entstehen", available: false },
  { id: "levels", name: "Level", description: "XP und Errungenschaften für Aktivität", available: false },
  {
    id: "live-ticker",
    name: "Live-Ticker",
    description: "Benachrichtigungen für Twitch und YouTube",
    available: false,
  },
  { id: "server-status", name: "Server-Status", description: "Minecraft, LS und ETS/ATS im Blick", available: false },
  { id: "music", name: "Musik", description: "Musik in Sprachkanälen", available: false },
];
