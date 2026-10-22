"use client";

import { ArrowUpRight, LayoutPanelTop, Pencil, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmojiValue } from "@/components/ui/emoji-picker";
import type { TicketCategory, TicketPanel } from "@/lib/bot-api/types";
import { deletePanel } from "../actions";

export function PanelList({
  guildId,
  panels,
  categories,
}: {
  guildId: string;
  panels: TicketPanel[];
  categories: TicketCategory[];
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (panels.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-hover">
          <LayoutPanelTop className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold">Noch kein Panel</h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          Ein Panel ist die Nachricht in Discord, über die Mitglieder ein Ticket öffnen, per Auswahlmenü oder Buttons.
        </p>
      </Card>
    );
  }

  const remove = (panelId: string, deleteMessage: boolean) =>
    startTransition(async () => {
      const result = await deletePanel(guildId, panelId, deleteMessage);
      if (result.ok) toast.success("Panel gelöscht.");
      else toast.error(result.message, { description: result.errors?.join(" ") });
    });

  return (
    <div className="space-y-4">
      {panels.map((panel) => (
        <Card key={panel.id} className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">{panel.name}</h3>
                <Badge tone="primary">{panel.style === "SELECT" ? "Auswahlmenü" : "Buttons"}</Badge>
                {!panel.messageId && (
                  <Badge tone="warning">
                    <TriangleAlert className="size-3" />
                    Nachricht gelöscht, speichern sendet sie neu
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">#{panel.channelName ?? "gelöschter Kanal"}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {panel.categoryIds.map((id) => {
                  const category = categories.find((candidate) => candidate.id === id);
                  if (!category) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 text-sm"
                    >
                      {category.emoji && <EmojiValue value={category.emoji} className="size-4 text-sm" />}
                      {category.name}
                    </span>
                  );
                })}
              </div>
            </div>
            {confirming === panel.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="danger" disabled={pending} onClick={() => remove(panel.id, true)}>
                  Mit Nachricht löschen
                </Button>
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => remove(panel.id, false)}>
                  Nachricht behalten
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                  Abbrechen
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {panel.jumpUrl && (
                  <a
                    href={panel.jumpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClasses({ variant: "ghost", size: "sm" })}
                  >
                    <ArrowUpRight />
                    <span className="hidden sm:inline">Discord</span>
                  </a>
                )}
                <Link
                  href={`/servers/${guildId}/tickets/panels/${panel.id}`}
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                >
                  <Pencil />
                  Bearbeiten
                </Link>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(panel.id)} aria-label="Panel löschen">
                  <Trash2 />
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
