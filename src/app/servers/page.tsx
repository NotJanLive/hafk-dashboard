import { ArrowUpRight, ServerOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Topbar } from "@/components/shell/topbar";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { GuildIcon } from "@/components/ui/guild-icon";
import { Led } from "@/components/ui/led";
import { PageHeader, Panel } from "@/components/ui/panel";
import { botInviteUrl, fetchUserGuilds } from "@/lib/auth/discord";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import type { Grant, GuildSummary } from "@/lib/bot-api/types";
import { guildIconUrl } from "@/lib/discord/cdn";
import { canManageGuild } from "@/lib/discord/permissions";
import { requireUser } from "@/lib/dal";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Server" };

const GRANT_LABELS: Record<Grant, string> = {
  OWNER: "Owner",
  ADMINISTRATOR: "Admin",
  MANAGE_SERVER: "Verwalter",
  DASHBOARD_ROLE: "Dashboard-Rolle",
};

function GuildTile({ guild }: { guild: GuildSummary }) {
  return (
    <Link
      href={`/servers/${guild.id}`}
      className="group flex h-[132px] flex-col justify-between rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      <div className="flex items-start gap-3">
        <GuildIcon name={guild.name} iconUrl={guild.iconUrl} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{guild.name}</p>
          <p className="mt-0.5 font-mono text-[11.5px] text-faint">{formatNumber(guild.memberCount)} Mitglieder</p>
        </div>
        <ArrowUpRight className="size-4 text-faint transition-colors group-hover:text-accent" />
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3">
        <span className="flex items-center gap-2 text-[12.5px] text-muted">
          <Led state={guild.setupCompleted ? "on" : "warn"} pulse={false} />
          {guild.setupCompleted ? "Eingerichtet" : "Setup offen"}
        </span>
        <Badge>{GRANT_LABELS[guild.grant]}</Badge>
      </div>
    </Link>
  );
}

export default async function ServersPage() {
  const user = await requireUser();
  const discordGuilds = await fetchUserGuilds(user.id, user.accessToken);
  let manageable: GuildSummary[] | null = null;
  let botError: string | null = null;
  try {
    manageable = await botApi.userGuilds(
      user.id,
      discordGuilds.map((guild) => guild.id),
    );
  } catch (error) {
    botError =
      error instanceof BotApiError && error.status === 401
        ? "Das Dashboard darf nicht mit dem Bot sprechen: BOT_API_TOKEN (Dashboard) und API_TOKEN (Bot) stimmen nicht überein."
        : "Der Bot ist gerade nicht erreichbar, daher kann die Serverliste nicht geladen werden.";
  }

  // Without the bot's answer we cannot tell where it is already installed, so offer no invites.
  const manageableIds = new Set(manageable?.map((guild) => guild.id));
  const invitable =
    manageable === null
      ? []
      : discordGuilds.filter((guild) => canManageGuild(guild.permissions, guild.owner) && !manageableIds.has(guild.id));

  return (
    <div className="min-h-dvh">
      <Topbar user={user}>
        <Logo />
      </Topbar>

      <main className="canvas min-h-[calc(100dvh-3.5rem)] px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-5xl">
          <PageHeader label="Server" title="Wähle einen Server" />

          {manageable === null ? (
            <Panel>
              <div className="flex items-center gap-3 text-sm text-muted">
                <ServerOff className="size-5 text-danger" />
                {botError}
              </div>
            </Panel>
          ) : manageable.length === 0 ? (
            <Panel>
              <p className="text-sm text-muted">
                Auf keinem deiner Server hast du Zugriff auf den Bot. Du brauchst Admin-Rechte, „Server verwalten“ oder
                eine Dashboard-Rolle.
              </p>
            </Panel>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {manageable.map((guild) => (
                <GuildTile key={guild.id} guild={guild} />
              ))}
            </div>
          )}

          {invitable.length > 0 && (
            <Panel title="Bot hinzufügen" className="mt-10" bodyClassName="p-0">
              <ul className="divide-y divide-line">
                {invitable.map((guild) => (
                  <li key={guild.id} className="flex items-center gap-3 px-5 py-3">
                    <GuildIcon name={guild.name} iconUrl={guildIconUrl(guild.id, guild.icon, 64)} size={32} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{guild.name}</span>
                    <a
                      href={botInviteUrl(guild.id)}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses({ variant: "secondary", size: "sm" })}
                    >
                      Einladen
                      <ArrowUpRight />
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </main>
    </div>
  );
}
