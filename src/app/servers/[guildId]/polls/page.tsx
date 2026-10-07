import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { CreatorSettings } from "./creator-settings";
import { PollList } from "./poll-list";

export const metadata: Metadata = { title: "Umfragen" };

export default async function PollsPage(props: PageProps<"/servers/[guildId]/polls">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [polls, settings] = await Promise.all([
    botApi.polls.list(guild.id, user.id),
    botApi.polls.settings(guild.id, user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Umfragen"
        description="Abstimmungen mit Buttons, wahlweise anonym. Du entscheidest, wann das Ergebnis sichtbar wird."
        actions={
          <ButtonLink href={`/servers/${guild.id}/polls/new`}>
            <Plus />
            Neue Umfrage
          </ButtonLink>
        }
      />
      <div className="space-y-10">
        <PollList guildId={guild.id} polls={polls} />
        <CreatorSettings guildId={guild.id} roles={guild.roles} creatorRoleIds={settings.creatorRoleIds} />
      </div>
    </>
  );
}
