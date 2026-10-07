import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Poll } from "@/lib/bot-api/types";
import { formatNumber, formatRelative } from "@/lib/utils";
import { PollActions } from "./poll-actions";
import { PollResults, VISIBILITY_LABELS } from "./poll-results";

export function pollTiming(poll: Poll) {
  if (poll.cancelled && poll.closedAt) return `abgebrochen ${formatRelative(poll.closedAt)}`;
  if (poll.closedAt) return `beendet ${formatRelative(poll.closedAt)}`;
  if (poll.endsAt) return `endet ${formatRelative(poll.endsAt)}`;
  return "ohne Enddatum";
}

export function PollBadges({ poll }: { poll: Poll }) {
  return (
    <>
      {poll.cancelled ? (
        <Badge tone="danger">Abgebrochen</Badge>
      ) : poll.closedAt ? (
        <Badge>Beendet</Badge>
      ) : (
        <Badge tone="success" dot>
          Läuft
        </Badge>
      )}
      <Badge tone="primary">{poll.anonymous ? "Anonym" : "Öffentlich"}</Badge>
      {!poll.closedAt && <Badge>{VISIBILITY_LABELS[poll.visibility]}</Badge>}
    </>
  );
}

export function PollList({ guildId, polls }: { guildId: string; polls: Poll[] }) {
  if (polls.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted">
        Noch keine Umfragen. Starte eine hier im Dashboard oder in Discord mit <code>/poll create</code>.
      </Card>
    );
  }
  const open = polls.filter((poll) => !poll.closedAt);
  const closed = polls.filter((poll) => poll.closedAt);
  return (
    <div className="space-y-8">
      {[
        { title: "Laufend", items: open },
        { title: "Beendet", items: closed },
      ]
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-xs font-bold tracking-wide text-faint uppercase">
              {group.title} ({group.items.length})
            </h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {group.items.map((poll) => (
                <Card key={poll.id} className="flex flex-col p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/servers/${guildId}/polls/${poll.id}`}
                        className="font-bold break-words hover:text-primary-hover hover:underline"
                      >
                        {poll.question}
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <PollBadges poll={poll} />
                      </div>
                    </div>
                    <PollActions guildId={guildId} poll={poll} />
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    #{poll.channelName ?? "gelöschter Kanal"} · {formatNumber(poll.participants)}{" "}
                    {poll.participants === 1 ? "Teilnahme" : "Teilnahmen"} · {pollTiming(poll)}
                  </p>
                  <div className="mt-4 flex-1">
                    <PollResults poll={poll} showVoters />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
