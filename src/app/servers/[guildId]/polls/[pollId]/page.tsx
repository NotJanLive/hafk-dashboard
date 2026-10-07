import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscordMarkdown } from "@/components/discord/markdown";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { roleColor } from "@/lib/discord/cdn";
import { requireConfiguredGuild } from "@/lib/dal";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { PollActions } from "../poll-actions";
import { PollBadges, pollTiming } from "../poll-list";
import { PollResults, VISIBILITY_LABELS } from "../poll-results";

export const metadata: Metadata = { title: "Umfrage" };

export default async function PollPage(props: PageProps<"/servers/[guildId]/polls/[pollId]">) {
  const { guildId, pollId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  if (!/^\d+$/.test(pollId)) notFound();
  const poll = await botApi.polls.get(guild.id, user.id, pollId).catch((error: unknown) => {
    if (error instanceof BotApiError && error.status === 404) notFound();
    throw error;
  });
  const pingRole = guild.roles.find((role) => role.id === poll.pingRoleId);
  const allowedRoles = guild.roles.filter((role) => poll.allowedRoleIds.includes(role.id));

  const details: [string, string][] = [
    ["Kanal", `#${poll.channelName ?? "gelöschter Kanal"}`],
    ["Erstellt von", poll.createdByName ?? `Unbekannt (${poll.createdBy})`],
    ["Gestartet", formatDateTime(poll.createdAt)],
    [
      poll.cancelled ? "Abgebrochen" : poll.closedAt ? "Beendet" : "Ende",
      poll.closedAt ? formatDateTime(poll.closedAt) : poll.endsAt ? formatDateTime(poll.endsAt) : "Ohne Enddatum",
    ],
    ["Stimmen", poll.anonymous ? "Anonym" : "Öffentlich"],
    ["Ergebnis für Mitglieder", VISIBILITY_LABELS[poll.visibility]],
    ["Zwischenstände fürs Team", poll.hostResults ? "Sichtbar" : "Ausgeblendet"],
    ["Antworten pro Person", poll.maxChoices === 1 ? "Eine" : `Bis zu ${poll.maxChoices}`],
    ["Stimme ändern", poll.allowChange ? "Erlaubt" : "Nicht erlaubt"],
    ["Ping-Rolle", pingRole ? `@${pingRole.name}` : poll.pingRoleId ? "Gelöschte Rolle" : "Keine"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight break-words md:text-3xl">{poll.question}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <PollBadges poll={poll} />
          </div>
        </div>
        <PollActions guildId={guild.id} poll={poll} redirectAfterDelete />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Ergebnis"
            description={`${formatNumber(poll.participants)} ${poll.participants === 1 ? "Teilnahme" : "Teilnahmen"} · ${pollTiming(poll)}`}
          />
          <CardBody className="space-y-5">
            {poll.description && (
              <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
                <DiscordMarkdown text={poll.description} channels={guild.channels} roles={guild.roles} />
              </div>
            )}
            <PollResults poll={poll} showVoters />
            {poll.anonymous && poll.resultsVisible && (
              <p className="text-xs text-faint">Anonyme Umfrage: Es wird nur die Anzahl der Stimmen angezeigt.</p>
            )}
          </CardBody>
        </Card>

        <Card className="self-start">
          <CardHeader title="Einstellungen" />
          <CardBody>
            <dl className="divide-y divide-border text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
              <div className="py-2.5 last:pb-0">
                <dt className="text-muted">Wer darf abstimmen?</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {allowedRoles.length === 0 ? (
                    <span className="font-semibold">Alle im Kanal</span>
                  ) : (
                    allowedRoles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 text-sm"
                      >
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: roleColor(role.color) ?? "var(--faint)" }}
                        />
                        {role.name}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
