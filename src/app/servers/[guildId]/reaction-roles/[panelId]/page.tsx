import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { PanelEditor } from "../panel-editor";

export const metadata: Metadata = { title: "Panel bearbeiten" };

export default async function EditPanelPage(props: PageProps<"/servers/[guildId]/reaction-roles/[panelId]">) {
  const { guildId, panelId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  if (!/^\d+$/.test(panelId)) notFound();
  const [bot, emojis, panel] = await Promise.all([
    botApi.bot().catch(() => null),
    botApi.emojis(guild.id, user.id).catch(() => []),
    botApi.reactionRoles.get(guild.id, user.id, panelId).catch((error: unknown) => {
      if (error instanceof BotApiError && error.status === 404) notFound();
      throw error;
    }),
  ]);

  return (
    <>
      <PageHeader
        title={`Panel „${panel.label}“`}
        description="Änderungen werden direkt in der Discord-Nachricht übernommen."
      />
      <PanelEditor
        key={panel.updatedAt}
        guildId={guild.id}
        channels={guild.channels}
        roles={guild.roles}
        emojis={emojis}
        guildInfo={{ name: guild.name, iconUrl: guild.iconUrl }}
        botHighestRolePosition={guild.bot.highestRolePosition}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
        panel={panel}
      />
    </>
  );
}
