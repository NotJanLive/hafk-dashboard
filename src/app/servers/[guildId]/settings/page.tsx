import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/panel";
import { botApi } from "@/lib/bot-api/client";
import { requireGuild } from "@/lib/dal";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage(props: PageProps<"/servers/[guildId]/settings">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireGuild(guildId);
  const settings = await botApi.settings(guild.id, user.id);

  return (
    <>
      <PageHeader label="Einstellungen" title="Server-Setup" />
      <SettingsForm guildId={guild.id} settings={settings} channels={guild.channels} roles={guild.roles} />
    </>
  );
}
