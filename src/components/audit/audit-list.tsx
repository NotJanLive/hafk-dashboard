import { LayoutDashboard, MessageSquare } from "lucide-react";
import { MentionText } from "@/components/discord/mention-text";
import type { AuditEntry, Channel, Role } from "@/lib/bot-api/types";
import { formatDateTime, formatRelative } from "@/lib/utils";

export function AuditList({ entries, channels, roles }: { entries: AuditEntry[]; channels: Channel[]; roles: Role[] }) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-faint">Noch keine Änderungen.</p>;
  }

  return (
    <ol className="divide-y divide-border">
      {entries.map((entry) => {
        const fromDashboard = entry.source === "DASHBOARD";
        const SourceIcon = fromDashboard ? LayoutDashboard : MessageSquare;
        return (
          <li key={entry.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted"
              title={fromDashboard ? "Über das Dashboard" : "Über Discord"}
            >
              <SourceIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">{entry.userName ?? "Unbekannt"}</span>
                <span className="text-faint"> · </span>
                <time dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)} className="text-faint">
                  {formatRelative(entry.createdAt)}
                </time>
              </p>
              <ul className="mt-1 space-y-0.5 text-sm text-muted">
                {entry.summary.split("\n").map((line, index) => (
                  <li key={index}>
                    <MentionText text={line} channels={channels} roles={roles} />
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
