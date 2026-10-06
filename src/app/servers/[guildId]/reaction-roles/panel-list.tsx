"use client";

import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ReactionRolePanel, Role } from "@/lib/bot-api/types";
import { roleColor } from "@/lib/discord/cdn";
import { deletePanel } from "./actions";

const TYPE_LABELS = { BUTTONS: "Buttons", SELECT: "Auswahlmenü", REACTIONS: "Reaktionen" } as const;
const MODE_LABELS = { NORMAL: "Normal", UNIQUE: "Nur eine", VERIFY: "Bestätigen" } as const;

export function PanelList({ guildId, panels, roles }: { guildId: string; panels: ReactionRolePanel[]; roles: Role[] }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (panels.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted">
        Noch keine Reaction-Role-Panels. Erstelle eins, damit sich Mitglieder selbst Rollen geben können.
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
                <h3 className="font-bold">{panel.label}</h3>
                <Badge tone="primary">{TYPE_LABELS[panel.type]}</Badge>
                <Badge>{MODE_LABELS[panel.mode]}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">#{panel.channelName ?? "gelöschter Kanal"}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {panel.options.map((option) => {
                  const role = roles.find((candidate) => candidate.id === option.roleId);
                  return (
                    <span
                      key={option.roleId}
                      className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 text-sm"
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: roleColor(role?.color ?? 0) ?? "var(--faint)" }}
                      />
                      {role?.name ?? "Gelöschte Rolle"}
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
                <a
                  href={panel.jumpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses({ variant: "ghost", size: "sm" })}
                >
                  <ArrowUpRight />
                  <span className="hidden sm:inline">Discord</span>
                </a>
                <Link
                  href={`/servers/${guildId}/reaction-roles/${panel.id}`}
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
