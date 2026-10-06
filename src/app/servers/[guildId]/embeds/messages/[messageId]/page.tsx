import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { EmbedWorkspace } from "../../embed-workspace";

export const metadata: Metadata = { title: "Embed bearbeiten" };

export default async function EditEmbedPage(props: PageProps<"/servers/[guildId]/embeds/messages/[messageId]">) {
  const { guildId, messageId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  if (!/^\d+$/.test(messageId)) notFound();
  const [bot, message] = await Promise.all([
    botApi.bot().catch(() => null),
    botApi.embeds.getSent(guild.id, user.id, messageId).catch((error: unknown) => {
      if (error instanceof BotApiError && error.status === 404) notFound();
      throw error;
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Embed bearbeiten"
        description="Änderungen werden direkt in der Discord-Nachricht übernommen."
      />
      <EmbedWorkspace
        key={message.updatedAt}
        guildId={guild.id}
        mode={{ kind: "edit", messageId: message.id, channelName: message.channelName, jumpUrl: message.jumpUrl }}
        channels={guild.channels}
        roles={guild.roles}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
        initialPayload={message.payload}
        initialName={message.label}
      />
    </>
  );
}
