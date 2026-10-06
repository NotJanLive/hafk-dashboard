import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { isSnowflake } from "@/lib/discord/cdn";

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session.user || !session.accessToken || (session.accessTokenExpiresAt ?? 0) < Date.now()) {
    return null;
  }
  return { ...session.user, accessToken: session.accessToken };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export const requireUser = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
});

export const requireGuild = cache(async (guildId: string) => {
  if (!isSnowflake(guildId)) notFound();
  const user = await requireUser();
  try {
    const guild = await botApi.guild(guildId, user.id);
    return { user, guild };
  } catch (error) {
    if (error instanceof BotApiError && (error.status === 403 || error.status === 404)) notFound();
    throw error;
  }
});

export const getSettings = cache((guildId: string, userId: string) => botApi.settings(guildId, userId));

export const requireConfiguredGuild = cache(async (guildId: string) => {
  const { user, guild } = await requireGuild(guildId);
  const settings = await getSettings(guild.id, user.id);
  if (!settings.setupCompleted) redirect(`/servers/${guild.id}/setup`);
  return { user, guild, settings };
});
