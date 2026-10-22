"use client";

import { ArrowDown, ArrowUp, ClipboardList, FolderKanban, Pencil, Sparkles, Trash2, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmojiValue } from "@/components/ui/emoji-picker";
import type { TicketCategory } from "@/lib/bot-api/types";
import { deleteCategory, moveCategory } from "../actions";

export function CategoryList({ guildId, categories }: { guildId: string; categories: TicketCategory[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<TicketCategory | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (index: number, direction: -1 | 1) => {
    const ordered = categories.map((category) => category.id);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    startTransition(async () => {
      const result = await moveCategory(guildId, ordered);
      if (result.ok) router.refresh();
      else toast.error(result.message);
    });
  };

  const remove = () => {
    if (!deleting) return;
    const category = deleting;
    startTransition(async () => {
      const result = await deleteCategory(guildId, category.id);
      if (result.ok) {
        toast.success(`„${category.name}“ wurde gelöscht.`);
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.message, { description: result.errors?.join(" ") });
      }
    });
  };

  if (categories.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-hover">
          <FolderKanban className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold">Noch keine Kategorien</h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          Lege z. B. „Support“, „Report“ oder „Bewerbung“ an. Danach stellst du sie in einem Panel zur Auswahl.
        </p>
        <Link href={`/servers/${guildId}/tickets/setup`} className={buttonClasses({}, "mt-5")}>
          <Sparkles />
          Mit dem Assistenten starten
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category, index) => (
        <Card key={category.id} className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0 || pending}
              className="rounded p-0.5 text-faint hover:text-text disabled:opacity-30"
              aria-label="Nach oben"
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === categories.length - 1 || pending}
              className="rounded p-0.5 text-faint hover:text-text disabled:opacity-30"
              aria-label="Nach unten"
            >
              <ArrowDown className="size-4" />
            </button>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2">
            {category.emoji ? <EmojiValue value={category.emoji} /> : <FolderKanban className="size-5 text-faint" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{category.name}</p>
            <p className="truncate text-sm text-muted">{category.description ?? "Keine Beschreibung"}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {category.fields.length > 0 && (
                <Badge tone="primary">
                  <ClipboardList className="size-3" />
                  {category.fields.length} {category.fields.length === 1 ? "Frage" : "Fragen"}
                </Badge>
              )}
              {category.application && (
                <Badge tone="success">
                  <UserCheck className="size-3" />
                  Bewerbung
                </Badge>
              )}
              {category.supportRoleIds.length > 0 && (
                <Badge>
                  {category.supportRoleIds.length} Support-{category.supportRoleIds.length === 1 ? "Rolle" : "Rollen"}
                </Badge>
              )}
              {category.confirmText && <Badge>Hinweis vor dem Öffnen</Badge>}
              <Badge>{category.maxOpen === 0 ? "unbegrenzt offen" : `max. ${category.maxOpen} offen`}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/servers/${guildId}/tickets/categories/${category.id}`}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              <Pencil />
              Bearbeiten
            </Link>
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleting(category)} aria-label="Löschen">
              <Trash2 />
            </Button>
          </div>
        </Card>
      ))}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`„${deleting?.name ?? ""}“ löschen?`}
        description="Die Kategorie verschwindet aus allen Panels. Offene und geschlossene Tickets bleiben samt Transkript erhalten."
        confirmLabel="Löschen"
        danger
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}
