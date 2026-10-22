"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import type { Channel } from "@/lib/bot-api/types";
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

export type CreateChannelResult = { ok: true; channel: Channel } | { ok: false; message: string };

const channelInput = z.object({
  guildId: z.string().regex(/^\d{17,20}$/),
  name: z.string().trim().min(1).max(100),
  type: z.enum(["text", "category"]),
  visibility: z.enum(["PUBLIC", "READ_ONLY", "PRIVATE"]),
  roleIds: z.array(z.string().regex(/^\d{17,20}$/)).max(25),
  parentId: z
    .string()
    .regex(/^\d{17,20}$/)
    .nullable(),
});

export async function createDiscordChannel(
  guildId: string,
  name: string,
  type: "text" | "category",
  parentId: string | null,
  visibility: "PUBLIC" | "READ_ONLY" | "PRIVATE" = "PUBLIC",
  roleIds: string[] = [],
): Promise<CreateChannelResult> {
  const parsed = channelInput.safeParse({ guildId, name, type, parentId, visibility, roleIds });
  if (!parsed.success) return { ok: false, message: "Der Name muss 1 bis 100 Zeichen haben." };
  const { user } = await requireGuild(parsed.data.guildId);
  try {
    const channel = await botApi.createChannel(parsed.data.guildId, user.id, {
      name: parsed.data.name,
      type: parsed.data.type,
      parentId: parsed.data.type === "text" ? parsed.data.parentId : null,
      visibility: parsed.data.visibility,
      roleIds: parsed.data.visibility === "PRIVATE" ? parsed.data.roleIds : [],
    });
    revalidatePath(`/servers/${parsed.data.guildId}`, "layout");
    return { ok: true, channel };
  } catch (error) {
    if (error instanceof BotApiError) return { ok: false, message: [error.message, ...error.details].join(" ") };
    throw error;
  }
}
