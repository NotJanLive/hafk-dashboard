import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { PanelEditor } from "../panel-editor";

export const metadata: Metadata = { title: "Neues Reaction-Role-Panel" };

export default async function NewPanelPage(props: PageProps<"/servers/[guildId]/reaction-roles/new">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [bot, emojis] = await Promise.all([
    botApi.bot().catch(() => null),
    botApi.emojis(guild.id, user.id).catch(() => []),
  ]);

  return (
    <>
      <PageHeader title="Neues Panel" description="Wähle Rollen, Art und Modus und gestalte die Nachricht." />
      <PanelEditor
        guildId={guild.id}
        channels={guild.channels}
        roles={guild.roles}
        emojis={emojis}
        guildInfo={{ name: guild.name, iconUrl: guild.iconUrl }}
        botHighestRolePosition={guild.bot.highestRolePosition}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
        panel={null}
      />
    </>
  );
}
