"use client";

import { ArrowUpRight, BookmarkPlus, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DiscordPreview } from "@/components/embeds/discord-preview";
import { JsonDialog } from "@/components/embeds/json-dialog";
import { MessageEditor } from "@/components/embeds/message-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChannelSelect } from "@/components/ui/channel-select";
import { PromptDialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import type { Channel, MessagePayload, Role } from "@/lib/bot-api/types";
import { cleanPayload } from "@/lib/embeds/payload";
import { type ActionResult, editEmbed, saveTemplate, sendEmbed } from "./actions";

export type WorkspaceMode =
  | { kind: "send" }
  | { kind: "edit"; messageId: string; channelName: string | null; jumpUrl: string }
  | { kind: "template"; templateId: string | null };

export function EmbedWorkspace({
  guildId,
  mode,
  channels,
  roles,
  bot,
  initialPayload,
  initialName = "",
}: {
  guildId: string;
  mode: WorkspaceMode;
  channels: Channel[];
  roles: Role[];
  bot: { name: string; avatarUrl: string | null };
  initialPayload: MessagePayload;
  initialName?: string;
}) {
  const router = useRouter();
  const [payload, setPayload] = useState<MessagePayload>(initialPayload);
  const [name, setName] = useState(initialName);
  const [channelId, setChannelId] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const base = `/servers/${guildId}/embeds`;

  const report = (result: ActionResult, success: string) => {
    if (result.ok) {
      toast.success(success);
      return true;
    }
    toast.error(result.message, { description: result.errors?.join(" ") });
    return false;
  };

  const primary = () =>
    startTransition(async () => {
      const clean = cleanPayload(payload);
      if (mode.kind === "send") {
        if (report(await sendEmbed(guildId, { channelId, label: name, payload: clean }), "Embed gesendet."))
          router.push(base);
      } else if (mode.kind === "edit") {
        if (report(await editEmbed(guildId, mode.messageId, { label: name, payload: clean }), "Änderungen übernommen."))
          router.refresh();
      } else {
        const result = await saveTemplate(guildId, mode.templateId, { name, payload: clean });
        if (report(result, "Vorlage gespeichert.") && !mode.templateId) router.push(`${base}?tab=templates`);
      }
    });

  const saveAsTemplate = (templateName: string) =>
    startTransition(async () => {
      const saved = report(
        await saveTemplate(guildId, null, { name: templateName, payload: cleanPayload(payload) }),
        "Als Vorlage gespeichert.",
      );
      if (saved) setTemplateDialogOpen(false);
    });

  const primaryLabel =
    mode.kind === "send" ? "Senden" : mode.kind === "edit" ? "Änderungen übernehmen" : "Vorlage speichern";
  const PrimaryIcon = mode.kind === "send" ? Send : Save;

  return (
    <div className="space-y-6">
      <PromptDialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        title="Als Vorlage speichern"
        description="Die Vorlage kannst du später im Dashboard oder mit /embed template in Discord senden."
        label="Name der Vorlage"
        initialValue={name}
        placeholder="z. B. Regeln"
        maxLength={100}
        confirmLabel="Vorlage speichern"
        pending={pending}
        onSubmit={saveAsTemplate}
      />
      <Card className="flex flex-wrap items-end gap-4 p-5">
        {mode.kind === "send" && (
          <div className="min-w-56 flex-1">
            <Field label="Kanal" custom>
              <ChannelSelect channels={channels} value={channelId} onChange={setChannelId} />
            </Field>
          </div>
        )}
        {mode.kind === "edit" && (
          <div className="min-w-56 flex-1 text-sm">
            <p className="font-semibold text-muted">Gesendet in</p>
            <a
              href={mode.jumpUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-semibold hover:text-primary-hover"
            >
              #{mode.channelName ?? "unbekannter Kanal"}
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        )}
        <div className="min-w-56 flex-1">
          <Field label={mode.kind === "template" ? "Name der Vorlage" : "Bezeichnung (nur im Dashboard sichtbar)"}>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder={mode.kind === "template" ? "z. B. Regeln" : "Optional, sonst der Titel"}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <JsonDialog payload={payload} onImport={setPayload} />
          {mode.kind !== "template" && (
            <Button type="button" variant="secondary" onClick={() => setTemplateDialogOpen(true)} disabled={pending}>
              <BookmarkPlus />
              Als Vorlage
            </Button>
          )}
          <Button type="button" onClick={primary} disabled={pending}>
            <PrimaryIcon />
            {pending ? "Bitte warten…" : primaryLabel}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <MessageEditor value={payload} onChange={setPayload} />
        </Card>
        <div className="xl:sticky xl:top-24 xl:self-start">
          <p className="mb-2 text-xs font-bold tracking-wide text-faint uppercase">Vorschau</p>
          <DiscordPreview
            payload={cleanPayload(payload)}
            botName={bot.name}
            botAvatarUrl={bot.avatarUrl}
            channels={channels}
            roles={roles}
          />
        </div>
      </div>
    </div>
  );
}
