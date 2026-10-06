import { CircleAlert, PartyPopper } from "lucide-react";
import Link from "next/link";
import { AuditList } from "@/components/audit/audit-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { GuildIcon } from "@/components/ui/guild-icon";
import { botApi } from "@/lib/bot-api/client";
import { missingBotPermissions } from "@/lib/discord/permissions";
import { requireConfiguredGuild } from "@/lib/dal";
import { MODULES } from "@/lib/modules";
import { formatNumber } from "@/lib/utils";

export default async function OverviewPage(props: PageProps<"/servers/[guildId]">) {
  const { guildId } = await props.params;
  const { welcome } = await props.searchParams;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const audit = await botApi.auditLog(guild.id, user.id, 5);

  const missing = missingBotPermissions(guild.bot.permissions);
  const channelCount = guild.channels.filter((channel) => channel.type !== "category").length;

  return (
    <div className="space-y-8">
      {welcome && (
        <div className="flex items-center gap-3 rounded-2xl bg-primary-soft px-5 py-4 text-sm font-semibold">
          <PartyPopper className="size-5 text-primary-hover" />
          Einrichtung abgeschlossen! Als Nächstes kannst du die Module für deinen Server aktivieren.
        </div>
      )}

      <Card className="flex flex-wrap items-center gap-5 p-6">
        <GuildIcon name={guild.name} iconUrl={guild.iconUrl} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">{guild.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {formatNumber(guild.memberCount)} Mitglieder · {formatNumber(channelCount)} Kanäle ·{" "}
            {formatNumber(guild.roles.length)} Rollen
          </p>
        </div>
      </Card>

      {missing.length > 0 && (
        <div className="flex gap-4 rounded-2xl border border-warning/30 bg-warning-soft p-5">
          <CircleAlert className="size-5 shrink-0 text-warning" />
          <div className="text-sm">
            <p className="font-semibold text-warning">Dem Bot fehlen Rechte</p>
            <p className="mt-1 text-muted">
              {missing.map((permission) => permission.label).join(", ")}. Gib der Bot-Rolle diese Rechte in den
              Servereinstellungen, sonst funktionieren einzelne Module nicht.
            </p>
          </div>
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Module</h2>
          <p className="mt-1 text-sm text-muted">Aktiviere die Funktionen, die du auf deinem Server nutzen willst.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((module) => (
            <Card
              key={module.id}
              className="relative flex flex-col p-5 transition-colors has-[a]:hover:border-border-strong"
            >
              <div className="flex items-start justify-between">
                <span className={`flex size-11 items-center justify-center rounded-xl ${module.tint}`}>
                  <module.icon className="size-5" />
                </span>
                {module.available && <Badge tone="success">Aktiv</Badge>}
              </div>
              <h3 className="mt-4 font-bold">{module.name}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{module.description}</p>
              {module.available ? (
                <Link
                  href={`/servers/${guild.id}/${module.id}`}
                  className="mt-4 text-sm font-semibold text-primary-hover after:absolute after:inset-0 hover:underline"
                >
                  Öffnen →
                </Link>
              ) : (
                <div className="mt-4">
                  <Badge>Bald verfügbar</Badge>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader
          title="Letzte Änderungen"
          actions={
            <Link
              href={`/servers/${guild.id}/audit-log`}
              className="text-sm font-semibold text-primary-hover hover:underline"
            >
              Alle anzeigen
            </Link>
          }
        />
        <CardBody>
          <AuditList entries={audit} channels={guild.channels} roles={guild.roles} />
        </CardBody>
      </Card>
    </div>
  );
}
