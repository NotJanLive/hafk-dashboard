import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { isSnowflake } from "@/lib/discord/cdn";

/**
 * Data access layer: every page and server action authenticates and authorizes here, close to
 * the data. The proxy only performs an optimistic cookie check.
 */

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

/** Resolves the guild and verifies through the bot that the user may manage it. */
export const requireGuild = cache(async (guildId: string) => {
  if (!isSnowflake(guildId)) notFound();
  const user = await requireUser();
  try {
    const guild = await botApi.guild(guildId, user.id);
    return { user, guild };
  } catch (error) {
    // Do not reveal whether the guild exists when the user has no access.
    if (error instanceof BotApiError && (error.status === 403 || error.status === 404)) notFound();
    throw error;
  }
});
