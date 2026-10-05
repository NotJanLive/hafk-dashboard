import { LayoutDashboard, MessageSquare } from "lucide-react";
import { MentionText } from "@/components/discord/mention-text";
import type { AuditEntry, Channel, Role } from "@/lib/bot-api/types";
import { formatDateTime, formatRelative } from "@/lib/utils";

export function AuditList({
  entries,
  channels,
  roles,
  compact = false,
}: {
  entries: AuditEntry[];
  channels: Channel[];
  roles: Role[];
  compact?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-faint">Noch keine Änderungen protokolliert.</p>;
  }

  return (
    <ol className="divide-y divide-line">
      {entries.map((entry) => {
        const SourceIcon = entry.source === "DASHBOARD" ? LayoutDashboard : MessageSquare;
        return (
          <li key={entry.id} className={compact ? "py-3 first:pt-0 last:pb-0" : "py-4 first:pt-0 last:pb-0"}>
            <div className="flex items-center gap-2 text-[12px] text-faint">
              <SourceIcon className="size-3.5" aria-label={entry.source === "DASHBOARD" ? "Dashboard" : "Discord"} />
              <span className="truncate font-mono">{entry.userName ?? entry.userId}</span>
              <span aria-hidden>·</span>
              <time dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)} className="shrink-0">
                {formatRelative(entry.createdAt)}
              </time>
            </div>
            <ul className="mt-1.5 space-y-1 text-[13.5px] leading-relaxed">
              {entry.summary.split("\n").map((line, index) => (
                <li key={index}>
                  <MentionText text={line} channels={channels} roles={roles} />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
