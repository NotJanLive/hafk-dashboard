import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { emptyPayload } from "@/lib/embeds/payload";
import { EmbedWorkspace } from "../embed-workspace";

export const metadata: Metadata = { title: "Neues Embed" };

export default async function NewEmbedPage(props: PageProps<"/servers/[guildId]/embeds/new">) {
  const { guildId } = await props.params;
  const { template: templateId } = await props.searchParams;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [bot, template] = await Promise.all([
    botApi.bot().catch(() => null),
    typeof templateId === "string" && /^\d+$/.test(templateId)
      ? botApi.embeds.getTemplate(guild.id, user.id, templateId).catch(() => null)
      : null,
  ]);

  return (
    <>
      <PageHeader
        title="Neues Embed"
        description={
          template
            ? `Basierend auf der Vorlage „${template.name}“.`
            : "Gestalte die Nachricht und sende sie in einen Kanal."
        }
      />
      <EmbedWorkspace
        guildId={guild.id}
        mode={{ kind: "send" }}
        channels={guild.channels}
        roles={guild.roles}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
        initialPayload={template?.payload ?? emptyPayload()}
        initialName={template?.name ?? ""}
      />
    </>
  );
}
