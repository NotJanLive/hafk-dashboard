import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { PanelEditor } from "../panel-editor";

export const metadata: Metadata = { title: "Neues Ticket-Panel" };

export default async function NewTicketPanelPage(props: PageProps<"/servers/[guildId]/tickets/panels/new">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [bot, categories] = await Promise.all([
    botApi.bot().catch(() => null),
    botApi.tickets.categories(guild.id, user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Neues Panel"
        description="Wähle Kanal, Kategorien und Darstellung und gestalte die Nachricht."
      />
      <PanelEditor
        guildId={guild.id}
        channels={guild.channels}
        roles={guild.roles}
        categories={categories}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
        panel={null}
      />
    </>
  );
}
