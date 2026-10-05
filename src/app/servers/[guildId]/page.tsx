import { ArrowRight, Check, Circle } from "lucide-react";
import Link from "next/link";
import { AuditList } from "@/components/audit/audit-list";
import { ButtonLink } from "@/components/ui/button";
import { Led } from "@/components/ui/led";
import { PageHeader, Panel } from "@/components/ui/panel";
import { botApi } from "@/lib/bot-api/client";
import { missingBotPermissions } from "@/lib/discord/permissions";
import { requireGuild } from "@/lib/dal";
import { MODULES } from "@/lib/modules";
import { formatNumber } from "@/lib/utils";

export default async function OverviewPage(props: PageProps<"/servers/[guildId]">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireGuild(guildId);
  const [settings, audit] = await Promise.all([
    botApi.settings(guild.id, user.id),
    botApi.auditLog(guild.id, user.id, 5),
  ]);

  const missing = missingBotPermissions(guild.bot.permissions);
  const textChannels = guild.channels.filter((channel) => channel.type === "text").length;
  const voiceChannels = guild.channels.filter((channel) => channel.type === "voice" || channel.type === "stage").length;
  const base = `/servers/${guild.id}`;

  const readouts = [
    { label: "Mitglieder", value: formatNumber(guild.memberCount) },
    { label: "Textkanäle", value: formatNumber(textChannels) },
    { label: "Sprachkanäle", value: formatNumber(voiceChannels) },
    { label: "Rollen", value: formatNumber(guild.roles.length) },
  ];

  const steps = [
    { done: settings.logChannelId !== null, label: "Log-Kanal festlegen" },
    { done: settings.dashboardRoleIds.length > 0, label: "Dashboard-Rollen wählen (optional)" },
    { done: settings.setupCompleted, label: "Setup abschließen" },
  ];

  return (
    <>
      <PageHeader
        label="Übersicht"
        title={guild.name}
        meta={<span className="font-mono text-[12px] text-faint">ID {guild.id}</span>}
      />

      {!settings.setupCompleted && (
        <section className="mb-6 flex flex-col gap-4 rounded-xl border border-warn/30 bg-warn-soft p-5 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Led state="warn" />
              Setup noch nicht abgeschlossen
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
              {steps.map((step) => (
                <li key={step.label} className="flex items-center gap-1.5">
                  {step.done ? <Check className="size-3.5 text-accent" /> : <Circle className="size-3.5 text-faint" />}
                  <span className={step.done ? "text-faint line-through" : undefined}>{step.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <ButtonLink href={`${base}/settings`}>
            Setup fortsetzen
            <ArrowRight />
          </ButtonLink>
        </section>
      )}

      <dl className="mb-6 grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface md:grid-cols-4">
        {readouts.map((readout, index) => (
          <div
            key={readout.label}
            className={`px-5 py-4 ${index % 2 === 1 ? "border-l border-line" : ""} ${index >= 2 ? "border-t border-line md:border-t-0" : ""} md:border-l md:first:border-l-0`}
          >
            <dt className="label">{readout.label}</dt>
            <dd className="mt-1.5 font-mono text-2xl font-semibold tabular-nums">{readout.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Module" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            <li>
              <Link
                href={`${base}/settings`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2"
              >
                <Led state={settings.setupCompleted ? "on" : "warn"} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Server-Setup</span>
                  <span className="block truncate text-[12.5px] text-muted">Log-Kanal und Dashboard-Zugriff</span>
                </span>
                <span className="font-mono text-[11px] text-muted uppercase">
                  {settings.setupCompleted ? "aktiv" : "offen"}
                </span>
              </Link>
            </li>
            {MODULES.map((module) => (
              <li key={module.id} className="flex items-center gap-4 px-5 py-3.5">
                <Led state="off" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-muted">{module.name}</span>
                  <span className="block truncate text-[12.5px] text-faint">{module.description}</span>
                </span>
                <span className="font-mono text-[11px] text-faint uppercase">geplant</span>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Bot-Berechtigungen">
            {missing.length === 0 ? (
              <p className="flex items-center gap-2.5 text-sm text-muted">
                <Led state="on" pulse={false} />
                Alle benötigten Rechte vorhanden
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {missing.map((permission) => (
                    <li key={permission.key} className="flex items-center gap-2.5 text-sm">
                      <Led state="error" pulse={false} />
                      {permission.label}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
                  Gib der Bot-Rolle diese Rechte oder lade den Bot über die Serverauswahl neu ein.
                </p>
              </>
            )}
          </Panel>

          <Panel
            title="Letzte Änderungen"
            actions={
              <Link href={`${base}/audit-log`} className="text-[12px] text-muted hover:text-accent">
                Alle anzeigen
              </Link>
            }
          >
            <AuditList entries={audit} channels={guild.channels} roles={guild.roles} compact />
          </Panel>
        </div>
      </div>
    </>
  );
}
