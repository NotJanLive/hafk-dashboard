import {
  Gamepad2,
  type LucideIcon,
  MessageSquareText,
  Mic,
  Music,
  Radio,
  SmilePlus,
  Ticket,
  Trophy,
  Vote,
} from "lucide-react";

export type ModuleInfo = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tint: string;
  available: boolean;
};

export const MODULES: ModuleInfo[] = [
  {
    id: "embeds",
    name: "Embeds",
    description: "Schöne eingebettete Nachrichten gestalten und senden",
    icon: MessageSquareText,
    tint: "bg-sky-500/15 text-sky-400",
    available: true,
  },
  {
    id: "reaction-roles",
    name: "Reaction Roles",
    description: "Mitglieder vergeben sich Rollen per Button, Menü oder Reaktion",
    icon: SmilePlus,
    tint: "bg-amber-500/15 text-amber-400",
    available: true,
  },
  {
    id: "tickets",
    name: "Tickets",
    description: "Support-Tickets mit Kategorien und Verläufen",
    icon: Ticket,
    tint: "bg-rose-500/15 text-rose-400",
    available: false,
  },
  {
    id: "polls",
    name: "Umfragen",
    description: "Abstimmungen, anonym oder öffentlich, mit Live-Ergebnis oder Überraschung am Ende",
    icon: Vote,
    tint: "bg-violet-500/15 text-violet-400",
    available: true,
  },
  {
    id: "temp-voice",
    name: "Temp Voice",
    description: "Eigene Sprachkanäle, die beim Beitreten entstehen",
    icon: Mic,
    tint: "bg-emerald-500/15 text-emerald-400",
    available: false,
  },
  {
    id: "levels",
    name: "Level",
    description: "XP und Errungenschaften für Aktivität im Chat",
    icon: Trophy,
    tint: "bg-yellow-500/15 text-yellow-400",
    available: false,
  },
  {
    id: "live-ticker",
    name: "Live-Ticker",
    description: "Benachrichtigungen, wenn jemand auf Twitch oder YouTube live geht",
    icon: Radio,
    tint: "bg-red-500/15 text-red-400",
    available: false,
  },
  {
    id: "server-status",
    name: "Server-Status",
    description: "Minecraft, LS und ETS/ATS-Server im Blick",
    icon: Gamepad2,
    tint: "bg-indigo-500/15 text-indigo-400",
    available: false,
  },
  {
    id: "music",
    name: "Musik",
    description: "Musik in Sprachkanälen abspielen",
    icon: Music,
    tint: "bg-pink-500/15 text-pink-400",
    available: false,
  },
];
