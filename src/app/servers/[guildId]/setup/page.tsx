import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { botInviteUrl } from "@/lib/auth/discord";
import { missingBotPermissions } from "@/lib/discord/permissions";
import { getSettings, requireGuild } from "@/lib/dal";
import { SetupWizard } from "./setup-wizard";

export const metadata: Metadata = { title: "Einrichtung" };

export default async function SetupPage(props: PageProps<"/servers/[guildId]/setup">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireGuild(guildId);
  const settings = await getSettings(guild.id, user.id);
  if (settings.setupCompleted) redirect(`/servers/${guild.id}`);

  return (
    <SetupWizard
      guild={{ id: guild.id, name: guild.name, iconUrl: guild.iconUrl }}
      missingPermissions={missingBotPermissions(guild.bot.permissions)}
      reinviteUrl={botInviteUrl(guild.id)}
      roles={guild.roles}
      dashboardRoleIds={settings.dashboardRoleIds}
    />
  );
}
