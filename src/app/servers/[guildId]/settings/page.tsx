import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { requireConfiguredGuild } from "@/lib/dal";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage(props: PageProps<"/servers/[guildId]/settings">) {
  const { guildId } = await props.params;
  const { guild, settings } = await requireConfiguredGuild(guildId);

  return (
    <>
      <PageHeader title="Einstellungen" description="Allgemeine Einstellungen für diesen Server." />
      <SettingsForm guildId={guild.id} settings={settings} roles={guild.roles} />
    </>
  );
}
