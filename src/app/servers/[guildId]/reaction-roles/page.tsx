import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { PanelList } from "./panel-list";

export const metadata: Metadata = { title: "Reaction Roles" };

export default async function ReactionRolesPage(props: PageProps<"/servers/[guildId]/reaction-roles">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const panels = await botApi.reactionRoles.list(guild.id, user.id);

  return (
    <>
      <PageHeader
        title="Reaction Roles"
        description="Panels, über die sich Mitglieder per Button, Auswahlmenü oder Reaktion selbst Rollen geben."
        actions={
          <ButtonLink href={`/servers/${guild.id}/reaction-roles/new`}>
            <Plus />
            Neues Panel
          </ButtonLink>
        }
      />
      <PanelList guildId={guild.id} panels={panels} roles={guild.roles} />
    </>
  );
}
