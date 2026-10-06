import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { emptyPayload } from "@/lib/embeds/payload";
import { EmbedWorkspace } from "../../embed-workspace";

export const metadata: Metadata = { title: "Vorlage" };

export default async function TemplatePage(props: PageProps<"/servers/[guildId]/embeds/templates/[templateId]">) {
  const { guildId, templateId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const isNew = templateId === "new";
  if (!isNew && !/^\d+$/.test(templateId)) notFound();
  const [bot, template] = await Promise.all([
    botApi.bot().catch(() => null),
    isNew
      ? null
      : botApi.embeds.getTemplate(guild.id, user.id, templateId).catch((error: unknown) => {
          if (error instanceof BotApiError && error.status === 404) notFound();
          throw error;
        }),
  ]);

  return (
    <>
      <PageHeader
        title={isNew ? "Neue Vorlage" : `Vorlage „${template!.name}“`}
        description="Vorlagen kannst du jederzeit im Dashboard oder mit /embed template in Discord senden."
      />
      <EmbedWorkspace
        key={template?.updatedAt ?? "new"}
        guildId={guild.id}
        mode={{ kind: "template", templateId: template?.id ?? null }}
        channels={guild.channels}
        roles={guild.roles}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
        initialPayload={template?.payload ?? emptyPayload()}
        initialName={template?.name ?? ""}
      />
    </>
  );
}
