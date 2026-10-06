"use client";

import { ArrowUpRight, Pencil, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import type { EmbedTemplate, SentMessage } from "@/lib/bot-api/types";
import { colorToHex } from "@/lib/embeds/payload";
import { formatRelative } from "@/lib/utils";
import { type ActionResult, deleteSentEmbed, deleteTemplate } from "./actions";

function Empty({ children }: { children: React.ReactNode }) {
  return <Card className="p-10 text-center text-sm text-muted">{children}</Card>;
}

function ColorDot({ color }: { color: number | undefined }) {
  return <span className="size-3 shrink-0 rounded-full" style={{ background: colorToHex(color) }} />;
}

function useAction() {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult>, success: string, onSuccess?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        onSuccess?.();
      } else {
        toast.error(result.message, { description: result.errors?.join(" ") });
      }
    });
  return { pending, run };
}

export function SentList({ guildId, messages }: { guildId: string; messages: SentMessage[] }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const { pending, run } = useAction();
  if (messages.length === 0) {
    return (
      <Empty>Noch keine Embeds gesendet. Erstelle dein erstes über „Neues Embed“ oder mit /embed in Discord.</Empty>
    );
  }
  return (
    <Card>
      <ul className="divide-y divide-border">
        {messages.map((message) => (
          <li key={message.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <ColorDot color={message.payload.embeds?.[0]?.color} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{message.label}</p>
              <p className="mt-0.5 text-sm text-muted">
                #{message.channelName ?? "gelöschter Kanal"} · {formatRelative(message.updatedAt)} geändert
              </p>
            </div>
            {confirming === message.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted">Löschen?</span>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={pending}
                  onClick={() => run(() => deleteSentEmbed(guildId, message.id, true), "Nachricht gelöscht.")}
                >
                  Auch in Discord
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => run(() => deleteSentEmbed(guildId, message.id, false), "Aus der Liste entfernt.")}
                >
                  Nur aus Liste
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                  Abbrechen
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <a
                  href={message.jumpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses({ variant: "ghost", size: "sm" })}
                >
                  <ArrowUpRight />
                  <span className="hidden sm:inline">Discord</span>
                </a>
                <Link
                  href={`/servers/${guildId}/embeds/messages/${message.id}`}
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                >
                  <Pencil />
                  Bearbeiten
                </Link>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(message.id)} aria-label="Löschen">
                  <Trash2 />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function TemplateList({ guildId, templates }: { guildId: string; templates: EmbedTemplate[] }) {
  const { pending, run } = useAction();
  const [deleting, setDeleting] = useState<EmbedTemplate | null>(null);
  if (templates.length === 0) {
    return <Empty>Noch keine Vorlagen. Speichere ein Embed als Vorlage, um es später schnell wieder zu senden.</Empty>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Vorlage löschen?"
        description={deleting ? `Die Vorlage „${deleting.name}“ wird endgültig gelöscht.` : undefined}
        confirmLabel="Löschen"
        danger
        pending={pending}
        onConfirm={() => {
          if (deleting)
            run(
              () => deleteTemplate(guildId, deleting.id),
              "Vorlage gelöscht.",
              () => setDeleting(null),
            );
        }}
      />
      {templates.map((template) => (
        <Card key={template.id} className="flex flex-col p-5">
          <div className="flex items-center gap-3">
            <ColorDot color={template.payload.embeds?.[0]?.color} />
            <h3 className="truncate font-bold">{template.name}</h3>
          </div>
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">
            {template.payload.embeds?.[0]?.description || template.payload.content || "Ohne Beschreibung"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/servers/${guildId}/embeds/new?template=${template.id}`}
              className={buttonClasses({ size: "sm" })}
            >
              <Send />
              Senden
            </Link>
            <Link
              href={`/servers/${guildId}/embeds/templates/${template.id}`}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              <Pencil />
              Bearbeiten
            </Link>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setDeleting(template)}
              aria-label="Vorlage löschen"
            >
              <Trash2 />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
