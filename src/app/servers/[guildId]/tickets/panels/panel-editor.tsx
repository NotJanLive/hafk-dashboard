"use client";

import { ArrowDown, ArrowUp, List, MousePointerClick, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DiscordPreview } from "@/components/embeds/discord-preview";
import { JsonDialog } from "@/components/embeds/json-dialog";
import { MessageEditor } from "@/components/embeds/message-editor";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChannelSelect } from "@/components/ui/channel-select";
import { type Choice, ChoiceGrid } from "@/components/ui/choice-grid";
import { EmojiValue } from "@/components/ui/emoji-picker";
import { Field, Input } from "@/components/ui/field";
import type { Channel, MessagePayload, Role, TicketCategory, TicketPanel, TicketPanelStyle } from "@/lib/bot-api/types";
import { cleanPayload } from "@/lib/embeds/payload";
import { cn } from "@/lib/utils";
import { savePanel } from "../actions";

const STYLES: Choice<TicketPanelStyle>[] = [
  {
    value: "SELECT",
    label: "Auswahlmenü",
    description: "Empfohlen ab 3 Kategorien: übersichtlich, mit Emoji und Beschreibung",
    icon: List,
  },
  {
    value: "BUTTONS",
    label: "Buttons",
    description: "Ein Klick pro Kategorie, ideal für 1 bis 3 Kategorien",
    icon: MousePointerClick,
  },
];

function defaultPayload(): MessagePayload {
  return {
    embeds: [
      {
        title: "🎫 Support",
        description:
          "Du brauchst Hilfe oder möchtest etwas melden?\n\nWähle unten aus, worum es geht. Danach öffnet sich ein privater Kanal nur für dich und das Team.",
        color: 0x5b6cff,
      },
    ],
  };
}

export function PanelEditor({
  guildId,
  channels,
  roles,
  categories,
  bot,
  panel,
}: {
  guildId: string;
  channels: Channel[];
  roles: Role[];
  categories: TicketCategory[];
  bot: { name: string; avatarUrl: string | null };
  panel: TicketPanel | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(panel?.name ?? "");
  const [channelId, setChannelId] = useState(panel?.channelId ?? "");
  const [style, setStyle] = useState<TicketPanelStyle>(panel?.style ?? (categories.length > 2 ? "SELECT" : "BUTTONS"));
  const [placeholder, setPlaceholder] = useState(panel?.placeholder ?? "");
  const [payload, setPayload] = useState<MessagePayload>(panel?.payload ?? defaultPayload());
  const [selected, setSelected] = useState<string[]>(panel?.categoryIds ?? categories.map((category) => category.id));
  const byId = new Map(categories.map((category) => [category.id, category]));
  const chosen = selected.map((id) => byId.get(id)).filter((category): category is TicketCategory => Boolean(category));

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  const move = (index: number, direction: -1 | 1) =>
    setSelected((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const save = () =>
    startTransition(async () => {
      const result = await savePanel(guildId, panel?.id ?? null, {
        name: name.trim(),
        channelId,
        style,
        placeholder: style === "SELECT" && placeholder.trim() ? placeholder.trim() : null,
        payload: cleanPayload(payload),
        categoryIds: chosen.map((category) => category.id),
      });
      if (result.ok) {
        toast.success(panel ? "Panel aktualisiert." : "Panel gesendet.");
        router.push(`/servers/${guildId}/tickets/panels`);
        router.refresh();
      } else {
        toast.error(result.message, { description: result.errors?.join("\n") });
      }
    });

  if (categories.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-bold">Lege zuerst eine Kategorie an.</p>
        <p className="mt-1 text-sm text-muted">Ein Panel zeigt Kategorien zur Auswahl an.</p>
        <Link
          href={`/servers/${guildId}/tickets/categories/new`}
          className="mt-4 inline-block font-semibold text-primary-hover"
        >
          Kategorie erstellen →
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Grundlagen" />
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kanal" hint={panel ? "Beim Wechsel wird die alte Nachricht gelöscht." : undefined} custom>
                <ChannelSelect
                  channels={channels}
                  value={channelId}
                  onChange={setChannelId}
                  roles={roles}
                  createDefaults={{
                    visibility: "READ_ONLY",
                    hint: "Für das Ticket-Panel: Alle sehen es, schreiben kann nur der Bot.",
                  }}
                />
              </Field>
              <Field label="Name (nur im Dashboard)">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  placeholder="z. B. Support-Panel"
                />
              </Field>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted">Darstellung</p>
              <ChoiceGrid options={STYLES} value={style} onChange={setStyle} columns={2} />
            </div>
            {style === "SELECT" && (
              <Field label="Platzhalter im Menü" count={placeholder.length} max={150}>
                <Input
                  value={placeholder}
                  onChange={(event) => setPlaceholder(event.target.value)}
                  maxLength={150}
                  placeholder="Wähle dein Anliegen aus …"
                />
              </Field>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Kategorien" description="Auswahl und Reihenfolge im Panel." />
          <CardBody className="space-y-2">
            {chosen.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary-soft px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() => toggle(category.id)}
                  className="size-4 accent-[var(--primary)]"
                  aria-label={`${category.name} entfernen`}
                />
                {category.emoji && <EmojiValue value={category.emoji} className="size-5 text-base" />}
                <span className="flex-1 truncate text-sm font-semibold">{category.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Nach oben"
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => move(index, 1)}
                  disabled={index === chosen.length - 1}
                  aria-label="Nach unten"
                >
                  <ArrowDown />
                </Button>
              </div>
            ))}
            {categories
              .filter((category) => !selected.includes(category.id))
              .map((category) => (
                <label
                  key={category.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggle(category.id)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {category.emoji && <EmojiValue value={category.emoji} className="size-5 text-base" />}
                  <span className="flex-1 truncate text-sm text-muted">{category.name}</span>
                </label>
              ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Nachricht" actions={<JsonDialog payload={payload} onImport={setPayload} />} />
          <CardBody>
            <MessageEditor value={payload} onChange={setPayload} />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push(`/servers/${guildId}/tickets/panels`)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={save} disabled={pending || !channelId || !name.trim() || chosen.length === 0}>
            <Send />
            {pending ? "Wird gesendet…" : panel ? "Speichern & aktualisieren" : "Panel senden"}
          </Button>
        </div>
      </div>

      <div className="xl:sticky xl:top-24 xl:self-start">
        <p className={cn("mb-2 text-[13px] font-semibold text-muted")}>Vorschau</p>
        <DiscordPreview
          payload={cleanPayload(payload)}
          botName={bot.name}
          botAvatarUrl={bot.avatarUrl}
          channels={channels}
          roles={roles}
          components={
            style === "SELECT"
              ? { type: "SELECT", placeholder: placeholder.trim() || "Wähle dein Anliegen aus …" }
              : {
                  type: "BUTTONS",
                  buttons: chosen.map((category) => ({
                    label: category.name,
                    emoji: category.emoji,
                    style: category.buttonStyle,
                  })),
                }
          }
        />
        {style === "SELECT" && chosen.length > 0 && (
          <div className="mt-3 rounded-xl border border-border bg-[#2b2d31] p-1.5 text-sm text-[#dbdee1]">
            {chosen.map((category) => (
              <div key={category.id} className="flex items-center gap-3 rounded-md px-3 py-2">
                {category.emoji && <EmojiValue value={category.emoji} className="size-5 text-base" />}
                <div className="min-w-0">
                  <p className="truncate font-medium">{category.name}</p>
                  {category.description && <p className="truncate text-xs text-[#949ba4]">{category.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
