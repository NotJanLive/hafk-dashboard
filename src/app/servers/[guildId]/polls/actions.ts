"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import type { PollInput } from "@/lib/bot-api/types";
import { requireGuild } from "@/lib/dal";
import type { ActionResult } from "../embeds/actions";

const snowflake = z.string().regex(/^\d{17,20}$/);
const numericId = z.string().regex(/^\d{1,19}$/);

const input = z.object({
  channelId: snowflake,
  question: z.string().trim().min(1).max(256),
  description: z.string().max(1000).nullable(),
  anonymous: z.boolean(),
  visibility: z.enum(["LIVE", "AFTER_VOTE", "CLOSED"]),
  hostResults: z.boolean(),
  maxChoices: z.number().int().min(1).max(20),
  allowChange: z.boolean(),
  pingRoleId: snowflake.nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(0)
    .max(60 * 24 * 30),
  options: z
    .array(z.object({ label: z.string().trim().min(1).max(80), emoji: z.string().max(100).nullable() }))
    .min(2)
    .max(20),
  allowedRoleIds: z.array(snowflake).max(25),
});

async function run(
  guildId: string,
  action: (userId: string) => Promise<string | undefined | void>,
): Promise<ActionResult> {
  if (!snowflake.safeParse(guildId).success) return { ok: false, message: "Ungültiger Server." };
  const { user } = await requireGuild(guildId);
  try {
    const id = await action(user.id);
    revalidatePath(`/servers/${guildId}/polls`, "layout");
    return { ok: true, id: id ?? undefined };
  } catch (error) {
    if (error instanceof BotApiError) return { ok: false, message: error.message, errors: error.details };
    throw error;
  }
}

export async function createPoll(guildId: string, poll: PollInput): Promise<ActionResult> {
  const parsed = input.safeParse(poll);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Die Eingaben sind unvollständig.",
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }
  return run(guildId, async (userId) => (await botApi.polls.create(guildId, userId, parsed.data)).id);
}

export async function closePoll(guildId: string, pollId: string, cancel: boolean): Promise<ActionResult> {
  if (!numericId.safeParse(pollId).success) return { ok: false, message: "Ungültige Umfrage." };
  return run(guildId, async (userId) => {
    await botApi.polls.close(guildId, userId, pollId, cancel);
  });
}

export async function deletePoll(guildId: string, pollId: string, deleteMessage: boolean): Promise<ActionResult> {
  if (!numericId.safeParse(pollId).success) return { ok: false, message: "Ungültige Umfrage." };
  return run(guildId, (userId) => botApi.polls.remove(guildId, userId, pollId, deleteMessage));
}

export async function savePollSettings(guildId: string, creatorRoleIds: string[]): Promise<ActionResult> {
  const parsed = z.array(snowflake).max(25).safeParse(creatorRoleIds);
  if (!parsed.success) return { ok: false, message: "Ungültige Rollen." };
  return run(guildId, async (userId) => {
    await botApi.polls.updateSettings(guildId, userId, { creatorRoleIds: parsed.data });
  });
}
