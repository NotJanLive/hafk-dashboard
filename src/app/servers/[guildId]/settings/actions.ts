"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { requireGuild } from "@/lib/dal";

export type SettingsFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: string[];
};

const snowflake = z.string().regex(/^\d{17,20}$/);

const schema = z.object({
  guildId: snowflake,
  logChannelId: z.union([z.literal(""), snowflake]),
  dashboardRoleIds: z.array(snowflake).max(25),
  setupCompleted: z.boolean(),
});

export async function updateSettings(_previous: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const parsed = schema.safeParse({
    guildId: formData.get("guildId"),
    logChannelId: formData.get("logChannelId") ?? "",
    dashboardRoleIds: formData.getAll("dashboardRoleIds"),
    setupCompleted: formData.get("setupCompleted") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: "Die Eingaben sind ungültig." };
  }

  const { guildId, logChannelId, dashboardRoleIds, setupCompleted } = parsed.data;
  // Server actions are public endpoints: authenticate and authorize on every call.
  const { user } = await requireGuild(guildId);

  try {
    await botApi.updateSettings(guildId, user.id, {
      logChannelId: logChannelId || null,
      dashboardRoleIds,
      setupCompleted,
    });
  } catch (error) {
    if (error instanceof BotApiError) {
      return { status: "error", message: error.message, errors: error.details };
    }
    throw error;
  }

  revalidatePath(`/servers/${guildId}`, "layout");
  return { status: "success", message: "Einstellungen gespeichert." };
}
