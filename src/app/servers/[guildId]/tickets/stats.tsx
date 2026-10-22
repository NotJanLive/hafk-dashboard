import { Clock3, Inbox, MessageSquareReply, Star, TicketCheck, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { TicketStats } from "@/lib/bot-api/types";
import { formatNumber } from "@/lib/utils";

export function formatMinutes(minutes: number | null) {
  if (minutes === null) return "–";
  if (minutes < 1) return "< 1 Min.";
  if (minutes < 60) return `${Math.round(minutes)} Min.`;
  if (minutes < 60 * 24) return `${(minutes / 60).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Std.`;
  return `${(minutes / 60 / 24).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Tage`;
}

function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className="text-faint">–</span>;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star className="size-3.5 fill-warning text-warning" />
      {value.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Inbox;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-muted">
        <Icon className="size-4 text-primary-hover" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </Card>
  );
}

export function TicketStatsView({ stats }: { stats: TicketStats }) {
  const max = Math.max(1, ...stats.days.map((day) => Math.max(day.opened, day.closed)));
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Inbox} label="Offene Tickets" value={formatNumber(stats.open)} />
        <StatCard
          icon={TicketCheck}
          label="Geschlossen"
          value={formatNumber(stats.closed)}
          hint={`${formatNumber(stats.openedLast7Days)} neue in 7 Tagen`}
        />
        <StatCard icon={TrendingUp} label="Neu in 30 Tagen" value={formatNumber(stats.openedLast30Days)} />
        <StatCard
          icon={MessageSquareReply}
          label="Ø erste Antwort"
          value={formatMinutes(stats.averageFirstResponseMinutes)}
          hint="Zeit bis jemand außer dem Ersteller schreibt"
        />
        <StatCard icon={Clock3} label="Ø Bearbeitungszeit" value={formatMinutes(stats.averageResolutionMinutes)} />
        <StatCard
          icon={Star}
          label="Ø Bewertung"
          value={<Stars value={stats.ratingAverage} />}
          hint={`${formatNumber(stats.ratings)} Bewertungen`}
        />
      </div>

      <Card>
        <CardHeader title="Letzte 30 Tage" description="Geöffnete und geschlossene Tickets pro Tag" />
        <CardBody>
          {stats.days.every((day) => day.opened === 0 && day.closed === 0) ? (
            <p className="flex h-36 items-center justify-center rounded-xl border border-dashed border-border-strong text-sm text-faint">
              In den letzten 30 Tagen gab es noch keine Tickets.
            </p>
          ) : (
            <div className="flex h-36 items-end gap-1" role="img" aria-label="Tickets pro Tag">
              {stats.days.map((day) => (
                <div key={day.day} className="group relative flex h-full flex-1 items-end gap-px">
                  <div
                    className="flex-1 rounded-t-sm bg-primary/80"
                    style={{ height: `${(day.opened / max) * 100}%`, minHeight: day.opened ? 3 : 0 }}
                  />
                  <div
                    className="flex-1 rounded-t-sm bg-success/70"
                    style={{ height: `${(day.closed / max) * 100}%`, minHeight: day.closed ? 3 : 0 }}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-surface-3 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg group-hover:block">
                    {new Date(day.day).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} · {day.opened}{" "}
                    neu · {day.closed} geschlossen
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-primary/80" /> Geöffnet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-success/70" /> Geschlossen
            </span>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader title="Team" description="Übernommene und geschlossene Tickets, Nachrichten und Bewertungen" />
          <CardBody className="px-0 pb-2">
            {stats.supporters.length === 0 ? (
              <p className="px-6 pb-4 text-sm text-faint">Noch keine Daten.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-faint">
                      <th className="px-6 py-2 font-semibold">Person</th>
                      <th className="px-3 py-2 text-right font-semibold">Übernommen</th>
                      <th className="px-3 py-2 text-right font-semibold">Geschlossen</th>
                      <th className="px-3 py-2 text-right font-semibold">Nachrichten</th>
                      <th className="px-6 py-2 text-right font-semibold">Bewertung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.supporters.map((supporter) => (
                      <tr key={supporter.user.id} className="border-t border-border">
                        <td className="px-6 py-2.5">
                          <span className="flex items-center gap-2.5">
                            {supporter.user.avatarUrl ? (
                              <img src={supporter.user.avatarUrl} alt="" className="size-7 rounded-full" />
                            ) : (
                              <span className="size-7 rounded-full bg-surface-3" />
                            )}
                            <span className="truncate font-semibold">{supporter.user.name ?? supporter.user.id}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{supporter.claimed}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{supporter.closed}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{supporter.messages}</td>
                        <td className="px-6 py-2.5 text-right">
                          <Stars value={supporter.ratingAverage} />
                          {supporter.ratings > 0 && (
                            <span className="ml-1 text-xs text-faint">({supporter.ratings})</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Kategorien" description="Tickets pro Kategorie" />
          <CardBody className="space-y-3">
            {stats.categories.length === 0 && <p className="text-sm text-faint">Noch keine Tickets.</p>}
            {stats.categories.map((category) => {
              const total = Math.max(1, stats.open + stats.closed);
              return (
                <div key={`${category.categoryId}-${category.name}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-semibold">{category.name}</span>
                    <span className="text-xs text-muted tabular-nums">
                      {category.total} · {category.open} offen
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(category.total / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
