import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { PanelList } from "./panel-list";

export const metadata: Metadata = { title: "Ticket-Panels" };

export default async function PanelsPage(props: PageProps<"/servers/[guildId]/tickets/panels">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [panels, categories] = await Promise.all([
    botApi.tickets.panels(guild.id, user.id),
    botApi.tickets.categories(guild.id, user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Panels"
        description="Die Nachricht, über die Mitglieder ein Ticket öffnen. Änderungen an Kategorien aktualisieren Panels automatisch."
        actions={
          <ButtonLink href={`/servers/${guild.id}/tickets/panels/new`}>
            <Plus />
            Neues Panel
          </ButtonLink>
        }
      />
      <PanelList guildId={guild.id} panels={panels} categories={categories} />
    </>
  );
}
