import type { ButtonStyle, FormField, TicketCategoryInput } from "@/lib/bot-api/types";

export type PresetKey = "support" | "report" | "application" | "partner";

export type TicketPreset = {
  key: PresetKey;
  name: string;
  emoji: string;
  description: string;
  summary: string;
  buttonStyle: ButtonStyle;
  application: boolean;
  maxOpen: number;
  cooldownMinutes: number;
  fields: FormField[];
};

function field(type: FormField["type"], label: string, patch: Partial<FormField> = {}): FormField {
  return {
    type,
    label,
    description: null,
    placeholder: null,
    required: true,
    minLength: null,
    maxLength: type === "SHORT" ? 100 : type === "PARAGRAPH" ? 1000 : null,
    minValues: null,
    maxValues: ["USER", "ROLE", "CHANNEL", "FILE", "SELECT", "CHECKBOXES"].includes(type) ? 1 : null,
    options: [],
    ...patch,
  };
}

export const TICKET_PRESETS: TicketPreset[] = [
  {
    key: "support",
    name: "Support",
    emoji: "💬",
    description: "Fragen und Probleme rund um den Server",
    summary: "Allgemeine Hilfe mit einer kurzen Frage zum Anliegen",
    buttonStyle: "PRIMARY",
    application: false,
    maxOpen: 1,
    cooldownMinutes: 0,
    fields: [
      field("PARAGRAPH", "Wobei können wir dir helfen?", {
        placeholder: "Beschreibe dein Anliegen so genau wie möglich",
        minLength: 10,
      }),
    ],
  },
  {
    key: "report",
    name: "Report",
    emoji: "🚨",
    description: "Regelverstoß oder Person melden",
    summary: "Fragt nach der Person, dem Vorfall und optionalen Beweis-Screenshots",
    buttonStyle: "DANGER",
    application: false,
    maxOpen: 3,
    cooldownMinutes: 0,
    fields: [
      field("USER", "Wen möchtest du melden?", { placeholder: "Person auswählen" }),
      field("PARAGRAPH", "Was ist passiert?", { placeholder: "Wann, wo und was genau?", minLength: 10 }),
      field("FILE", "Beweise", {
        description: "Screenshots oder Videos, falls vorhanden",
        required: false,
        minValues: 0,
        maxValues: 5,
      }),
    ],
  },
  {
    key: "application",
    name: "Bewerbung",
    emoji: "📝",
    description: "Bewirb dich für unser Team",
    summary: "Bewerbungsformular mit Annehmen/Ablehnen-Buttons für das Team",
    buttonStyle: "SUCCESS",
    application: true,
    maxOpen: 1,
    cooldownMinutes: 60 * 24 * 7,
    fields: [
      field("SHORT", "Wie alt bist du?", { maxLength: 3 }),
      field("RADIO", "Wie aktiv bist du?", {
        options: [
          { label: "Täglich", description: null, emoji: null },
          { label: "Mehrmals pro Woche", description: null, emoji: null },
          { label: "Am Wochenende", description: null, emoji: null },
        ],
      }),
      field("PARAGRAPH", "Warum möchtest du ins Team?", { minLength: 30 }),
      field("PARAGRAPH", "Hast du schon Erfahrung?", { required: false }),
      field("CHECKBOX", "Ich habe die Regeln gelesen"),
    ],
  },
  {
    key: "partner",
    name: "Partnerschaft",
    emoji: "🤝",
    description: "Anfragen für Kooperationen und Partner",
    summary: "Fragt nach Community, Größe und Idee der Zusammenarbeit",
    buttonStyle: "SECONDARY",
    application: false,
    maxOpen: 1,
    cooldownMinutes: 60 * 24,
    fields: [
      field("SHORT", "Wie heißt eure Community?"),
      field("SHORT", "Wie viele Mitglieder habt ihr?", { maxLength: 20, required: false }),
      field("PARAGRAPH", "Was stellt ihr euch vor?", { minLength: 20 }),
    ],
  },
];

export type CategoryDraft = {
  uid: string;
  name: string;
  emoji: string | null;
  description: string | null;
  buttonStyle: ButtonStyle;
  application: boolean;
  maxOpen: number;
  cooldownMinutes: number;
  fields: FormField[];
  supportRoleIds: string[];
  onlyTeam: boolean;
};

let counter = 0;

function uid() {
  counter += 1;
  return `draft-${Date.now().toString(36)}-${counter}`;
}

export function draftFromPreset(preset: TicketPreset): CategoryDraft {
  return {
    uid: uid(),
    name: preset.name,
    emoji: preset.emoji,
    description: preset.description,
    buttonStyle: preset.buttonStyle,
    application: preset.application,
    maxOpen: preset.maxOpen,
    cooldownMinutes: preset.cooldownMinutes,
    fields: structuredClone(preset.fields),
    supportRoleIds: [],
    onlyTeam: preset.application,
  };
}

export function blankDraft(): CategoryDraft {
  return {
    uid: uid(),
    name: "",
    emoji: null,
    description: null,
    buttonStyle: "PRIMARY",
    application: false,
    maxOpen: 1,
    cooldownMinutes: 0,
    fields: [],
    supportRoleIds: [],
    onlyTeam: false,
  };
}

export function draftToCategory(
  draft: Omit<CategoryDraft, "uid" | "onlyTeam"> & { includeStaff: boolean },
  options: { position: number; parentId: string | null },
): TicketCategoryInput {
  return {
    name: draft.name,
    emoji: draft.emoji,
    description: draft.description,
    buttonStyle: draft.buttonStyle,
    parentId: options.parentId,
    channelPattern: draft.application ? "bewerbung-{username}" : "{category}-{number}",
    welcome: null,
    confirmText: null,
    formTitle: null,
    maxOpen: draft.maxOpen,
    cooldownMinutes: draft.cooldownMinutes,
    pingSupport: true,
    includeStaff: draft.includeStaff,
    application: draft.application,
    acceptRoleId: null,
    acceptMessage: null,
    denyMessage: null,
    closeOnDecision: false,
    position: options.position,
    supportRoleIds: draft.supportRoleIds,
    pingRoleIds: [],
    requiredRoleIds: [],
    fields: draft.fields,
  };
}
