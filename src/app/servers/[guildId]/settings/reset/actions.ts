"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import type { ResetResult } from "@/lib/bot-api/types";
import { requireGuild } from "@/lib/dal";

const ids = z.array(z.string().regex(/^[\w.-]{1,64}$/)).max(1000);
const request = z.object({ categories: ids, deleteChannels: ids, deleteMessages: ids, confirmation: z.string() });

export type ResetActionResult = { ok: true; result: ResetResult } | { ok: false; message: string };

export async function resetBot(guildId: string, input: z.infer<typeof request>): Promise<ResetActionResult> {
  const parsed = request.safeParse(input);
  if (!/^\d{17,20}$/.test(guildId) || !parsed.success) return { ok: false, message: "Ungültige Auswahl." };
  const { user, guild } = await requireGuild(guildId);
  if (guild.grant === "DASHBOARD_ROLE") {
    return { ok: false, message: "Nur Admins und Mitglieder mit „Server verwalten“ dürfen den Bot zurücksetzen." };
  }
  if (parsed.data.confirmation.trim() !== guild.name) {
    return { ok: false, message: "Der eingegebene Servername stimmt nicht überein." };
  }
  try {
    const { categories, deleteChannels, deleteMessages } = parsed.data;
    const result = await botApi.reset.execute(guildId, user.id, { categories, deleteChannels, deleteMessages });
    revalidatePath(`/servers/${guildId}`, "layout");
    return { ok: true, result };
  } catch (error) {
    if (error instanceof BotApiError) return { ok: false, message: error.message };
    throw error;
  }
}
