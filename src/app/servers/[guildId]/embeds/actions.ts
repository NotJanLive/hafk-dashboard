"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import type { MessagePayload } from "@/lib/bot-api/types";
import { requireGuild } from "@/lib/dal";

export type ActionResult = { ok: true; id?: string } | { ok: false; message: string; errors?: string[] };

const snowflake = z.string().regex(/^\d{17,20}$/);
const numericId = z.string().regex(/^\d{1,19}$/);
const payload = z.object({
  content: z.string().optional(),
  embeds: z.array(z.record(z.string(), z.unknown())).optional(),
});

async function run(
  guildId: string,
  action: (userId: string) => Promise<string | undefined | void>,
): Promise<ActionResult> {
  if (!snowflake.safeParse(guildId).success) return { ok: false, message: "Ungültiger Server." };
  const { user } = await requireGuild(guildId);
  try {
    const id = await action(user.id);
    revalidatePath(`/servers/${guildId}/embeds`, "layout");
    return { ok: true, id: id ?? undefined };
  } catch (error) {
    if (error instanceof BotApiError) return { ok: false, message: error.message, errors: error.details };
    throw error;
  }
}

function parsePayload(value: MessagePayload): MessagePayload {
  return payload.parse(value) as MessagePayload;
}

export async function sendEmbed(
  guildId: string,
  input: { channelId: string; label: string; payload: MessagePayload },
): Promise<ActionResult> {
  if (!snowflake.safeParse(input.channelId).success) return { ok: false, message: "Bitte wähle einen Kanal." };
  return run(guildId, async (userId) => {
    const sent = await botApi.embeds.send(guildId, userId, {
      channelId: input.channelId,
      label: input.label.trim() || null,
      payload: parsePayload(input.payload),
    });
    return sent.id;
  });
}

export async function editEmbed(
  guildId: string,
  messageId: string,
  input: { label: string; payload: MessagePayload },
): Promise<ActionResult> {
  if (!numericId.safeParse(messageId).success) return { ok: false, message: "Ungültige Nachricht." };
  return run(guildId, async (userId) => {
    await botApi.embeds.edit(guildId, userId, messageId, {
      label: input.label.trim() || null,
      payload: parsePayload(input.payload),
    });
  });
}

export async function deleteSentEmbed(
  guildId: string,
  messageId: string,
  deleteMessage: boolean,
): Promise<ActionResult> {
  if (!numericId.safeParse(messageId).success) return { ok: false, message: "Ungültige Nachricht." };
  return run(guildId, (userId) => botApi.embeds.deleteSent(guildId, userId, messageId, deleteMessage));
}

export async function saveTemplate(
  guildId: string,
  templateId: string | null,
  input: { name: string; payload: MessagePayload },
): Promise<ActionResult> {
  if (templateId !== null && !numericId.safeParse(templateId).success)
    return { ok: false, message: "Ungültige Vorlage." };
  return run(guildId, async (userId) => {
    const body = { name: input.name, payload: parsePayload(input.payload) };
    const saved = templateId
      ? await botApi.embeds.updateTemplate(guildId, userId, templateId, body)
      : await botApi.embeds.createTemplate(guildId, userId, body);
    return saved.id;
  });
}

export async function deleteTemplate(guildId: string, templateId: string): Promise<ActionResult> {
  if (!numericId.safeParse(templateId).success) return { ok: false, message: "Ungültige Vorlage." };
  return run(guildId, (userId) => botApi.embeds.deleteTemplate(guildId, userId, templateId));
}
