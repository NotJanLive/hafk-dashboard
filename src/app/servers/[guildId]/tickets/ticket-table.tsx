"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Lock, ScrollText, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PromptDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { SelectMenu } from "@/components/ui/select-menu";
import type { TicketPage, TicketSummary } from "@/lib/bot-api/types";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";
import { closeTicket } from "./actions";

const FILTERS = [
  { value: "OPEN", label: "Offen" },
  { value: "CLOSED", label: "Geschlossen" },
  { value: "ALL", label: "Alle" },
] as const;

function Avatar({ url }: { url: string | null }) {
  return url ? (
    <img src={url} alt="" className="size-6 shrink-0 rounded-full" />
  ) : (
    <span className="size-6 shrink-0 rounded-full bg-surface-3" />
  );
}

function StatusBadge({ ticket }: { ticket: TicketSummary }) {
  if (ticket.status === "OPEN") {
    return ticket.claimedBy ? (
      <Badge tone="primary" dot>
        In Bearbeitung
      </Badge>
    ) : (
      <Badge tone="warning" dot>
        Wartet
      </Badge>
    );
  }
  return <Badge tone="neutral">Geschlossen</Badge>;
}

export function TicketTable({
  guildId,
  page,
  status,
  search,
  categoryId,
  categories,
}: {
  guildId: string;
  page: TicketPage;
  status: "OPEN" | "CLOSED" | "ALL";
  search: string;
  categoryId: string;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(search);
  const [closing, setClosing] = useState<TicketSummary | null>(null);
  const [pending, startTransition] = useTransition();
  const pages = Math.max(1, Math.ceil(page.total / page.pageSize));

  const navigate = (patch: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const next = { status, search, category: categoryId, page: 0, ...patch };
    for (const [key, value] of Object.entries(next)) {
      if (
        value !== undefined &&
        value !== "" &&
        !(key === "page" && value === 0) &&
        !(key === "status" && value === "OPEN")
      ) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate({ search: query.trim() });
  };

  const close = (reason: string) => {
    if (!closing) return;
    const ticket = closing;
    startTransition(async () => {
      const result = await closeTicket(guildId, ticket.id, reason);
      if (result.ok) {
        toast.success(`Ticket #${ticket.number} wird geschlossen.`);
        setClosing(null);
        router.refresh();
      } else {
        toast.error(result.message, { description: result.errors?.join(" ") });
      }
    });
  };

  return (
    <Card>
      <CardHeader
        title="Tickets"
        description="Transkripte öffnen sich als eigene Seite und sind nur nach Anmeldung mit Berechtigung sichtbar."
      />
      <div className="flex flex-wrap items-center gap-3 px-6 pt-4 pb-4">
        <div className="flex rounded-lg bg-surface-2 p-1" role="tablist">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={status === filter.value}
              onClick={() => navigate({ status: filter.value })}
              className={cn(
                "h-8 rounded-md px-3 text-sm font-semibold text-muted transition-colors",
                status === filter.value && "bg-surface-3 text-text",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="w-52">
          <SelectMenu
            value={categoryId}
            onChange={(value) => navigate({ category: value })}
            ariaLabel="Kategorie"
            options={[
              { value: "", label: "Alle Kategorien" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
        <form onSubmit={submit} className="relative ml-auto min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-3 left-3 size-4 text-faint" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nummer, Name, Kanal oder Grund"
            className="pl-9"
          />
        </form>
      </div>

      <div className={cn("overflow-x-auto border-t border-border transition-opacity", pending && "opacity-60")}>
        {page.tickets.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-faint">Keine Tickets gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-faint">
                <th className="px-6 py-2.5 font-semibold">Ticket</th>
                <th className="px-3 py-2.5 font-semibold">Erstellt von</th>
                <th className="px-3 py-2.5 font-semibold">Bearbeitet von</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Zeit</th>
                <th className="px-6 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {page.tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-border align-middle hover:bg-surface-2/50">
                  <td className="px-6 py-3">
                    <p className="font-bold">
                      #{ticket.number} <span className="font-semibold text-muted">· {ticket.category}</span>
                    </p>
                    <p className="text-xs text-faint">
                      #{ticket.channelName}
                      {ticket.applicationState === "ACCEPTED" && " · ✅ angenommen"}
                      {ticket.applicationState === "DENIED" && " · ❌ abgelehnt"}
                      {ticket.applicationState === "PENDING" && " · Bewerbung offen"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar url={ticket.creator.avatarUrl} />
                      <span className="max-w-36 truncate">{ticket.creator.name ?? ticket.creator.id}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {ticket.claimedBy ? (
                      <span className="flex items-center gap-2">
                        <Avatar url={ticket.claimedBy.avatarUrl} />
                        <span className="max-w-36 truncate">{ticket.claimedBy.name ?? ticket.claimedBy.id}</span>
                      </span>
                    ) : (
                      <span className="text-faint">–</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge ticket={ticket} />
                  </td>
                  <td className="px-3 py-3 text-muted" title={formatDateTime(ticket.closedAt ?? ticket.createdAt)}>
                    {ticket.closedAt
                      ? `Geschlossen ${formatRelative(ticket.closedAt)}`
                      : `Geöffnet ${formatRelative(ticket.createdAt)}`}
                    {ticket.closeReason && (
                      <p className="max-w-56 truncate text-xs text-faint" title={ticket.closeReason}>
                        {ticket.closeReason}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1.5">
                      {ticket.status === "OPEN" && ticket.channelId && (
                        <a
                          href={`https://discord.com/channels/${guildId}/${ticket.channelId}`}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonClasses({ variant: "ghost", size: "sm" })}
                          title="In Discord öffnen"
                        >
                          <ExternalLink />
                        </a>
                      )}
                      <a
                        href={`/transcripts/${ticket.uuid}`}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonClasses({ variant: "secondary", size: "sm" })}
                      >
                        <ScrollText />
                        Transkript
                      </a>
                      {ticket.status === "OPEN" && (
                        <Button type="button" variant="danger" size="sm" onClick={() => setClosing(ticket)}>
                          <Lock />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-3 text-sm text-muted">
          <span>
            Seite {page.page + 1} von {pages} · {page.total} Tickets
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page.page === 0}
              onClick={() => navigate({ page: page.page - 1 })}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page.page + 1 >= pages}
              onClick={() => navigate({ page: page.page + 1 })}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      <PromptDialog
        open={closing !== null}
        onClose={() => setClosing(null)}
        title={closing ? `Ticket #${closing.number} schließen` : "Ticket schließen"}
        description="Der Kanal wird nach der eingestellten Verzögerung gelöscht. Das Transkript bleibt erhalten."
        label="Grund"
        placeholder="z. B. Erledigt"
        maxLength={1000}
        confirmLabel="Schließen"
        pending={pending}
        onSubmit={close}
      />
    </Card>
  );
}
