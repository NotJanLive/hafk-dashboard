"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import type {
  BlacklistInput,
  MemberResult,
  TicketCategoryInput,
  TicketPanelInput,
  TicketSettingsInput,
} from "@/lib/bot-api/types";
import { requireGuild } from "@/lib/dal";
import { draftToCategory } from "@/lib/tickets/presets";
import type { ActionResult } from "../embeds/actions";

const snowflake = z.string().regex(/^\d{17,20}$/);
const numericId = z.string().regex(/^\d{1,19}$/);
const optionalSnowflake = snowflake.nullable();
const target = z.object({ type: z.enum(["ROLE", "USER"]), id: snowflake });
const payload = z.object({
  content: z.string().optional(),
  embeds: z.array(z.record(z.string(), z.unknown())).optional(),
});
const text = (max: number) => z.string().max(max).nullable();

const settingsInput = z.object({
  logChannelId: optionalSnowflake,
  closeDelaySeconds: z.number().int().min(0).max(300),
  closeRequestHours: z.number().int().min(1).max(336),
  creatorCanClose: z.boolean(),
  claimLock: z.boolean(),
  transferToAnyone: z.boolean(),
  notesEnabled: z.boolean(),
  ratingsEnabled: z.boolean(),
  dmOnClose: z.boolean(),
  creatorTranscript: z.boolean(),
  retentionDays: z.number().int().min(1).max(3650).nullable(),
  staff: z.array(target).max(50),
  transcriptViewers: z.array(target).max(50),
});

const fieldInput = z.object({
  type: z.enum(["SHORT", "PARAGRAPH", "SELECT", "RADIO", "CHECKBOXES", "CHECKBOX", "USER", "ROLE", "CHANNEL", "FILE"]),
  label: z.string().max(45),
  description: text(100),
  placeholder: text(100),
  required: z.boolean(),
  minLength: z.number().int().min(0).max(4000).nullable(),
  maxLength: z.number().int().min(0).max(4000).nullable(),
  minValues: z.number().int().min(0).max(25).nullable(),
  maxValues: z.number().int().min(0).max(25).nullable(),
  options: z.array(z.object({ label: z.string().max(100), description: text(100), emoji: text(100) })).max(25),
});

const categoryInput = z.object({
  name: z.string().max(80),
  emoji: text(100),
  description: text(100),
  buttonStyle: z.enum(["PRIMARY", "SECONDARY", "SUCCESS", "DANGER"]),
  parentId: optionalSnowflake,
  channelPattern: text(100),
  welcome: payload.nullable(),
  confirmText: text(2000),
  formTitle: text(45),
  maxOpen: z.number().int().min(0).max(10),
  cooldownMinutes: z
    .number()
    .int()
    .min(0)
    .max(60 * 24 * 7),
  pingSupport: z.boolean(),
  includeStaff: z.boolean(),
  application: z.boolean(),
  acceptRoleId: optionalSnowflake,
  acceptMessage: text(1000),
  denyMessage: text(1000),
  closeOnDecision: z.boolean(),
  position: z.number().int().min(0).max(1000),
  supportRoleIds: z.array(snowflake).max(25),
  pingRoleIds: z.array(snowflake).max(25),
  requiredRoleIds: z.array(snowflake).max(25),
  fields: z.array(fieldInput).max(25),
});

const panelInput = z.object({
  name: z.string().max(100),
  channelId: snowflake,
  style: z.enum(["BUTTONS", "SELECT"]),
  placeholder: text(150),
  payload,
  categoryIds: z.array(numericId).max(25),
});

const blacklistInput = z.object({
  type: z.enum(["ROLE", "USER"]),
  id: snowflake,
  reason: text(500),
  days: z.number().int().min(1).max(3650).nullable(),
});

async function run(
  guildId: string,
  action: (userId: string) => Promise<string | undefined | void>,
): Promise<ActionResult> {
  if (!snowflake.safeParse(guildId).success) return { ok: false, message: "Ungültiger Server." };
  const { user } = await requireGuild(guildId);
  try {
    const id = await action(user.id);
    revalidatePath(`/servers/${guildId}/tickets`, "layout");
    return { ok: true, id: id ?? undefined };
  } catch (error) {
    if (error instanceof BotApiError) return { ok: false, message: error.message, errors: error.details };
    throw error;
  }
}

function invalid(error: z.ZodError): ActionResult {
  return {
    ok: false,
    message: "Die Eingaben sind unvollständig.",
    errors: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
  };
}

async function ticketTeamRoles(guildId: string, userId: string, staff: { type: string; id: string }[]) {
  const categories = await botApi.tickets.categories(guildId, userId);
  return [
    ...new Set([
      ...staff.filter((target) => target.type === "ROLE").map((target) => target.id),
      ...categories.flatMap((category) => category.supportRoleIds),
    ]),
  ];
}

export async function saveTicketSettings(
  guildId: string,
  input: TicketSettingsInput,
  privateLogChannel = false,
): Promise<ActionResult> {
  const parsed = settingsInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return run(guildId, async (userId) => {
    if (privateLogChannel && parsed.data.logChannelId) {
      await botApi.setChannelAccess(guildId, userId, parsed.data.logChannelId, {
        visibility: "PRIVATE",
        roleIds: await ticketTeamRoles(guildId, userId, parsed.data.staff),
      });
    }
    await botApi.tickets.updateSettings(guildId, userId, parsed.data);
  });
}

export async function saveCategory(
  guildId: string,
  categoryId: string | null,
  input: TicketCategoryInput,
  privateParent = false,
): Promise<ActionResult> {
  const parsed = categoryInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (categoryId !== null && !numericId.safeParse(categoryId).success)
    return { ok: false, message: "Ungültige Kategorie." };
  const body = parsed.data as TicketCategoryInput;
  return run(guildId, async (userId) => {
    if (privateParent && body.parentId) {
      const settings = await botApi.tickets.settings(guildId, userId);
      const staffRoles = body.includeStaff
        ? settings.staff.filter((target) => target.type === "ROLE").map((target) => target.id)
        : [];
      await botApi.setChannelAccess(guildId, userId, body.parentId, {
        visibility: "PRIVATE",
        roleIds: [...new Set([...body.supportRoleIds, ...staffRoles])],
      });
    }
    return categoryId === null
      ? (await botApi.tickets.createCategory(guildId, userId, body)).id
      : (await botApi.tickets.updateCategory(guildId, userId, categoryId, body)).id;
  });
}

export async function deleteCategory(guildId: string, categoryId: string): Promise<ActionResult> {
  if (!numericId.safeParse(categoryId).success) return { ok: false, message: "Ungültige Kategorie." };
  return run(guildId, (userId) => botApi.tickets.deleteCategory(guildId, userId, categoryId));
}

export async function moveCategory(guildId: string, ordered: string[]): Promise<ActionResult> {
  if (!z.array(numericId).max(25).safeParse(ordered).success) return { ok: false, message: "Ungültige Reihenfolge." };
  return run(guildId, async (userId) => {
    const categories = await botApi.tickets.categories(guildId, userId);
    for (const category of categories) {
      const position = ordered.indexOf(category.id);
      if (position < 0 || position === category.position) continue;
      const rest = Object.fromEntries(Object.entries(category).filter(([key]) => key !== "id")) as TicketCategoryInput;
      await botApi.tickets.updateCategory(guildId, userId, category.id, { ...rest, position });
    }
  });
}

export async function savePanel(
  guildId: string,
  panelId: string | null,
  input: TicketPanelInput,
): Promise<ActionResult> {
  const parsed = panelInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (panelId !== null && !numericId.safeParse(panelId).success) return { ok: false, message: "Ungültiges Panel." };
  const body = parsed.data as TicketPanelInput;
  return run(guildId, async (userId) =>
    panelId === null
      ? (await botApi.tickets.createPanel(guildId, userId, body)).id
      : (await botApi.tickets.updatePanel(guildId, userId, panelId, body)).id,
  );
}

export async function deletePanel(guildId: string, panelId: string, deleteMessage: boolean): Promise<ActionResult> {
  if (!numericId.safeParse(panelId).success) return { ok: false, message: "Ungültiges Panel." };
  return run(guildId, (userId) => botApi.tickets.deletePanel(guildId, userId, panelId, deleteMessage));
}

export async function closeTicket(guildId: string, ticketId: string, reason: string | null): Promise<ActionResult> {
  if (!numericId.safeParse(ticketId).success) return { ok: false, message: "Ungültiges Ticket." };
  const cleaned = reason?.trim() ? reason.trim().slice(0, 1000) : null;
  return run(guildId, (userId) => botApi.tickets.close(guildId, userId, ticketId, cleaned));
}

export async function addBlacklist(guildId: string, input: BlacklistInput): Promise<ActionResult> {
  const parsed = blacklistInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return run(guildId, async (userId) => {
    await botApi.tickets.addBlacklist(guildId, userId, parsed.data);
  });
}

export async function removeBlacklist(guildId: string, type: "ROLE" | "USER", targetId: string): Promise<ActionResult> {
  if (!snowflake.safeParse(targetId).success) return { ok: false, message: "Ungültige ID." };
  return run(guildId, (userId) => botApi.tickets.removeBlacklist(guildId, userId, type, targetId));
}

export async function searchMembers(guildId: string, query: string): Promise<MemberResult[]> {
  if (!snowflake.safeParse(guildId).success) return [];
  const trimmed = query.trim().slice(0, 32);
  if (!trimmed) return [];
  const { user } = await requireGuild(guildId);
  try {
    return await botApi.members(guildId, user.id, trimmed);
  } catch {
    return [];
  }
}

const setupInput = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        emoji: text(100),
        description: text(100),
        buttonStyle: z.enum(["PRIMARY", "SECONDARY", "SUCCESS", "DANGER"]),
        application: z.boolean(),
        maxOpen: z.number().int().min(0).max(10),
        cooldownMinutes: z
          .number()
          .int()
          .min(0)
          .max(60 * 24 * 7),
        fields: z.array(fieldInput).max(25),
        supportRoleIds: z.array(snowflake).max(25),
        includeStaff: z.boolean(),
      }),
    )
    .min(1)
    .max(25),
  staff: z.array(target).max(50),
  parentId: optionalSnowflake,
  panelChannelId: snowflake,
  panelStyle: z.enum(["BUTTONS", "SELECT"]),
  logChannelId: optionalSnowflake,
  ratingsEnabled: z.boolean(),
  notesEnabled: z.boolean(),
  creatorTranscript: z.boolean(),
  claimLock: z.boolean(),
  applyAccess: z.boolean(),
});

export type TicketSetupInput = z.infer<typeof setupInput>;

export async function runTicketSetup(guildId: string, input: TicketSetupInput): Promise<ActionResult> {
  const parsed = setupInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;
  return run(guildId, async (userId) => {
    if (data.applyAccess) {
      const teamRoles = [
        ...new Set([
          ...data.staff.filter((target) => target.type === "ROLE").map((target) => target.id),
          ...data.categories.flatMap((category) => category.supportRoleIds),
        ]),
      ];
      await botApi.setChannelAccess(guildId, userId, data.panelChannelId, { visibility: "READ_ONLY", roleIds: [] });
      if (data.parentId) {
        await botApi.setChannelAccess(guildId, userId, data.parentId, { visibility: "PRIVATE", roleIds: teamRoles });
      }
      if (data.logChannelId) {
        await botApi.setChannelAccess(guildId, userId, data.logChannelId, {
          visibility: "PRIVATE",
          roleIds: teamRoles,
        });
      }
    }
    const settings = await botApi.tickets.settings(guildId, userId);
    await botApi.tickets.updateSettings(guildId, userId, {
      ...settings,
      logChannelId: data.logChannelId,
      ratingsEnabled: data.ratingsEnabled,
      notesEnabled: data.notesEnabled,
      creatorTranscript: data.creatorTranscript,
      claimLock: data.claimLock,
      staff: data.staff,
      transcriptViewers: settings.transcriptViewers.map(({ type, id }) => ({ type, id })),
    });
    const existing = await botApi.tickets.categories(guildId, userId);
    const categoryIds: string[] = [];
    for (const [index, category] of data.categories.entries()) {
      const created = await botApi.tickets.createCategory(
        guildId,
        userId,
        draftToCategory(category, { position: existing.length + index, parentId: data.parentId }),
      );
      categoryIds.push(created.id);
    }
    const panel = await botApi.tickets.createPanel(guildId, userId, {
      name: "Ticket-Panel",
      channelId: data.panelChannelId,
      style: data.panelStyle,
      placeholder: data.panelStyle === "SELECT" ? "Wähle dein Anliegen aus …" : null,
      payload: {
        embeds: [
          {
            title: "🎫 Support & Anfragen",
            description:
              "Du brauchst Hilfe, möchtest etwas melden oder dich bewerben?\n\nWähle unten aus, worum es geht. Danach öffnet sich ein privater Kanal nur für dich und das zuständige Team.",
            color: 0x5b6cff,
          },
        ],
      },
      categoryIds,
    });
    return panel.id;
  });
}
