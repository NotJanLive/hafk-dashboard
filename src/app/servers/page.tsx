import { ArrowRight, Plus, ServerOff, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Topbar } from "@/components/shell/topbar";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GuildIcon } from "@/components/ui/guild-icon";
import { botInviteUrl, fetchUserGuilds } from "@/lib/auth/discord";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import type { GuildSummary } from "@/lib/bot-api/types";
import { guildIconUrl } from "@/lib/discord/cdn";
import { canManageGuild } from "@/lib/discord/permissions";
import { requireUser } from "@/lib/dal";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Server auswählen" };

type ServerEntry = {
  id: string;
  name: string;
  iconUrl: string | null;
  subtitle: string;
  state: "ready" | "setup" | "invite";
};

function ServerCard({ server }: { server: ServerEntry }) {
  const action =
    server.state === "invite" ? (
      <a href={botInviteUrl(server.id)} className={buttonClasses({ variant: "secondary" }, "w-full")}>
        <Plus />
        Bot hinzufügen
      </a>
    ) : server.state === "setup" ? (
      <ButtonLink href={`/servers/${server.id}/setup`} className="w-full">
        <Sparkles />
        Einrichten
      </ButtonLink>
    ) : (
      <ButtonLink href={`/servers/${server.id}`} className="w-full">
        Dashboard öffnen
        <ArrowRight />
      </ButtonLink>
    );

  return (
    <Card className="overflow-hidden">
      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-surface-3 to-surface-2">
        {server.iconUrl && (
          <Image
            src={server.iconUrl}
            alt=""
            fill
            sizes="360px"
            className="scale-150 object-cover opacity-40 blur-2xl"
          />
        )}
      </div>
      <div className="-mt-10 flex flex-col items-center px-5 pb-5 text-center">
        <GuildIcon name={server.name} iconUrl={server.iconUrl} size={80} className="relative ring-4 ring-surface" />
        <h2 className="mt-3 w-full truncate text-base font-bold">{server.name}</h2>
        <p className="mt-0.5 mb-5 text-sm text-muted">{server.subtitle}</p>
        {action}
      </div>
    </Card>
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
        : "Der Bot ist gerade nicht erreichbar. Versuche es in einem Moment erneut.";
  }

  // Without the bot's answer we cannot tell where it is already installed, so offer no invites.
  const servers: ServerEntry[] = [];
  if (manageable) {
    const manageableIds = new Set(manageable.map((guild) => guild.id));
    for (const guild of manageable) {
      servers.push({
        id: guild.id,
        name: guild.name,
        iconUrl: guild.iconUrl,
        subtitle: `${formatNumber(guild.memberCount)} Mitglieder`,
        state: guild.setupCompleted ? "ready" : "setup",
      });
    }
    for (const guild of discordGuilds) {
      if (canManageGuild(guild.permissions, guild.owner) && !manageableIds.has(guild.id)) {
        servers.push({
          id: guild.id,
          name: guild.name,
          iconUrl: guildIconUrl(guild.id, guild.icon, 128),
          subtitle: "Bot noch nicht hinzugefügt",
          state: "invite",
        });
      }
    }
  }

  return (
    <div className="min-h-dvh">
      <Topbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Wähle einen Server</h1>
          <p className="mt-3 text-[15px] text-muted">
            Hier siehst du alle Server, auf denen du Admin bist oder eine Dashboard-Rolle hast.
          </p>
        </div>

        {botError ? (
          <Card className="mx-auto flex max-w-xl items-center gap-4 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <ServerOff className="size-5" />
            </span>
            <p className="text-sm text-muted">{botError}</p>
          </Card>
        ) : servers.length === 0 ? (
          <Card className="mx-auto max-w-xl p-6 text-center text-sm text-muted">
            Du bist auf keinem Server Admin. Bitte einen Admin, dir eine Dashboard-Rolle zu geben.
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
