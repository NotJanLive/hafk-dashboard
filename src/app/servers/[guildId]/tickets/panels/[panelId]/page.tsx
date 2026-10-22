import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { PanelEditor } from "../panel-editor";

export const metadata: Metadata = { title: "Ticket-Panel bearbeiten" };

export default async function EditTicketPanelPage(props: PageProps<"/servers/[guildId]/tickets/panels/[panelId]">) {
  const { guildId, panelId } = await props.params;
  if (!/^\d{1,19}$/.test(panelId)) notFound();
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [bot, categories, panel] = await Promise.all([
    botApi.bot().catch(() => null),
    botApi.tickets.categories(guild.id, user.id),
    botApi.tickets.panel(guild.id, user.id, panelId).catch((error) => {
      if (error instanceof BotApiError && error.status === 404) notFound();
      throw error;
    }),
  ]);

  return (
    <>
      <PageHeader title={panel.name} description="Beim Speichern wird die Nachricht in Discord aktualisiert." />
      <PanelEditor
        guildId={guild.id}
        channels={guild.channels}
        roles={guild.roles}
        categories={categories}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
        panel={panel}
      />
    </>
  );
}
