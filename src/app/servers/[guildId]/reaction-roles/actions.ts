"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import type { ReactionRolePanelInput } from "@/lib/bot-api/types";
import { requireGuild } from "@/lib/dal";
import type { ActionResult } from "../embeds/actions";

const snowflake = z.string().regex(/^\d{17,20}$/);
const numericId = z.string().regex(/^\d{1,19}$/);

const input = z.object({
  channelId: snowflake.nullable(),
  label: z.string().max(100).nullable(),
  type: z.enum(["BUTTONS", "SELECT", "REACTIONS"]),
  mode: z.enum(["NORMAL", "UNIQUE", "VERIFY"]),
  payload: z.object({ content: z.string().optional(), embeds: z.array(z.record(z.string(), z.unknown())).optional() }),
  options: z
    .array(
      z.object({
        roleId: snowflake,
        label: z.string().max(80).nullable(),
        emoji: z.string().max(100).nullable(),
        description: z.string().max(100).nullable(),
        style: z.enum(["PRIMARY", "SECONDARY", "SUCCESS", "DANGER"]).nullable(),
      }),
    )
    .max(25),
});

async function run(
  guildId: string,
  action: (userId: string) => Promise<string | undefined | void>,
): Promise<ActionResult> {
  if (!snowflake.safeParse(guildId).success) return { ok: false, message: "Ungültiger Server." };
  const { user } = await requireGuild(guildId);
  try {
    const id = await action(user.id);
    revalidatePath(`/servers/${guildId}/reaction-roles`, "layout");
    return { ok: true, id: id ?? undefined };
  } catch (error) {
    if (error instanceof BotApiError) return { ok: false, message: error.message, errors: error.details };
    throw error;
  }
}

export async function savePanel(
  guildId: string,
  panelId: string | null,
  panel: ReactionRolePanelInput,
): Promise<ActionResult> {
  const parsed = input.safeParse(panel);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Die Eingaben sind unvollständig.",
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }
  if (panelId === null && !parsed.data.channelId) return { ok: false, message: "Bitte wähle einen Kanal." };
  if (panelId !== null && !numericId.safeParse(panelId).success) return { ok: false, message: "Ungültiges Panel." };
  const body = parsed.data as ReactionRolePanelInput;
  return run(guildId, async (userId) => {
    const saved = panelId
      ? await botApi.reactionRoles.update(guildId, userId, panelId, body)
      : await botApi.reactionRoles.create(guildId, userId, body);
    return saved.id;
  });
}

export async function deletePanel(guildId: string, panelId: string, deleteMessage: boolean): Promise<ActionResult> {
  if (!numericId.safeParse(panelId).success) return { ok: false, message: "Ungültiges Panel." };
  return run(guildId, (userId) => botApi.reactionRoles.remove(guildId, userId, panelId, deleteMessage));
}
