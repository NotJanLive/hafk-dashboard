"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { requireGuild } from "@/lib/dal";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: string[];
};

const schema = z.object({
  guildId: z.string().regex(/^\d{17,20}$/),
  dashboardRoleIds: z.array(z.string().regex(/^\d{17,20}$/)).max(25),
});

function parse(formData: FormData) {
  return schema.safeParse({
    guildId: formData.get("guildId"),
    dashboardRoleIds: formData.getAll("dashboardRoleIds"),
  });
}

async function save(guildId: string, dashboardRoleIds: string[], setupCompleted: boolean): Promise<FormState | null> {
  const { user } = await requireGuild(guildId);
  try {
    await botApi.updateSettings(guildId, user.id, { dashboardRoleIds, setupCompleted });
    return null;
  } catch (error) {
    if (error instanceof BotApiError) {
      return { status: "error", message: error.message, errors: error.details };
    }
    throw error;
  }
}

export async function updateSettings(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { status: "error", message: "Die Eingaben sind ungültig." };

  const { guildId, dashboardRoleIds } = parsed.data;
  const failure = await save(guildId, dashboardRoleIds, true);
  if (failure) return failure;

  revalidatePath(`/servers/${guildId}`, "layout");
  return { status: "success", message: "Änderungen gespeichert." };
}

export async function completeSetup(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { status: "error", message: "Die Eingaben sind ungültig." };

  const { guildId, dashboardRoleIds } = parsed.data;
  const failure = await save(guildId, dashboardRoleIds, true);
  if (failure) return failure;

  revalidatePath(`/servers/${guildId}`, "layout");
  redirect(`/servers/${guildId}?welcome=1`);
}
