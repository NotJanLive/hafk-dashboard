"use client";

import { ArrowUpRight, Ban, Flag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog, Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import type { Poll } from "@/lib/bot-api/types";
import { closePoll, deletePoll } from "./actions";

export function PollActions({
  guildId,
  poll,
  redirectAfterDelete = false,
}: {
  guildId: string;
  poll: Poll;
  redirectAfterDelete?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"close" | "cancel" | "delete" | null>(null);

  const close = (cancel: boolean) =>
    startTransition(async () => {
      const result = await closePoll(guildId, poll.id, cancel);
      setDialog(null);
      if (result.ok)
        toast.success(cancel ? "Umfrage abgebrochen." : "Umfrage beendet. Das Ergebnis steht jetzt in Discord.");
      else toast.error(result.message, { description: result.errors?.join(" ") });
    });

  const remove = (deleteMessage: boolean) =>
    startTransition(async () => {
      const result = await deletePoll(guildId, poll.id, deleteMessage);
      setDialog(null);
      if (!result.ok) {
        toast.error(result.message, { description: result.errors?.join(" ") });
        return;
      }
      toast.success("Umfrage gelöscht.");
      if (redirectAfterDelete) router.push(`/servers/${guildId}/polls`);
    });

  return (
    <div className="flex flex-wrap items-center gap-1">
      {poll.jumpUrl && (
        <a
          href={poll.jumpUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          <ArrowUpRight />
          <span className="hidden sm:inline">Discord</span>
        </a>
      )}
      {!poll.closedAt && (
        <Button size="sm" variant="secondary" onClick={() => setDialog("close")} disabled={pending}>
          <Flag />
          Beenden
        </Button>
      )}
      {!poll.closedAt && (
        <Button size="sm" variant="ghost" onClick={() => setDialog("cancel")} disabled={pending}>
          <Ban />
          <span className="hidden sm:inline">Abbrechen</span>
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setDialog("delete")}
        disabled={pending}
        aria-label="Umfrage löschen"
      >
        <Trash2 />
      </Button>

      <ConfirmDialog
        open={dialog === "close"}
        onClose={() => setDialog(null)}
        title="Umfrage jetzt beenden?"
        description="Danach kann niemand mehr abstimmen und das Ergebnis wird in der Discord-Nachricht für alle sichtbar."
        confirmLabel="Jetzt beenden"
        pending={pending}
        onConfirm={() => close(false)}
      />
      <ConfirmDialog
        open={dialog === "cancel"}
        onClose={() => setDialog(null)}
        title="Umfrage abbrechen?"
        description="Danach kann niemand mehr abstimmen. In Discord wird kein Ergebnis veröffentlicht, hier im Dashboard bleibt es sichtbar."
        confirmLabel="Abbrechen bestätigen"
        danger
        pending={pending}
        onConfirm={() => close(true)}
      />
      <Dialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title="Umfrage löschen?"
        description="Die Umfrage und alle Stimmen werden endgültig gelöscht."
      >
        <DialogBody className="text-sm text-muted">
          Soll die Nachricht in Discord mitgelöscht werden? Wenn du sie behältst, bleibt sie ohne Buttons als Erinnerung
          stehen.
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
            Abbrechen
          </Button>
          {poll.messageId && (
            <Button type="button" variant="secondary" onClick={() => remove(false)} disabled={pending}>
              Behalten
            </Button>
          )}
          <Button type="button" variant="danger" onClick={() => remove(true)} disabled={pending}>
            {poll.messageId ? "Mitlöschen" : "Löschen"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
