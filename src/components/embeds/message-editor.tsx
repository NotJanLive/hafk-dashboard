"use client";

import { ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { MarkdownHelp } from "@/components/embeds/markdown-help";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { Embed, EmbedField, MessagePayload } from "@/lib/bot-api/types";
import { colorToHex, emptyEmbed, LIMITS, totalLength } from "@/lib/embeds/payload";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-xs font-bold tracking-wide text-faint uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

function EmbedEditor({
  embed,
  index,
  total,
  onChange,
  onRemove,
  onDuplicate,
}: {
  embed: Embed;
  index: number;
  total: number;
  onChange: (embed: Embed) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const [open, setOpen] = useState(true);
  const fields = embed.fields ?? [];
  const set = (patch: Partial<Embed>) => onChange({ ...embed, ...patch });
  const setField = (fieldIndex: number, patch: Partial<EmbedField>) =>
    set({ fields: fields.map((field, i) => (i === fieldIndex ? { ...field, ...patch } : field)) });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-2/40">
      <div
        className="flex items-center gap-3 border-l-4 px-4 py-3"
        style={{ borderLeftColor: colorToHex(embed.color) }}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown className={cn("size-4 shrink-0 text-faint transition-transform", !open && "-rotate-90")} />
          <span className="truncate text-sm font-bold">{embed.title?.trim() || `Embed ${index + 1}`}</span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDuplicate}
          disabled={total >= LIMITS.embeds}
          aria-label="Duplizieren"
        >
          <Copy />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label="Embed entfernen">
          <Trash2 />
        </Button>
      </div>

      {open && (
        <div className="space-y-5 p-4">
          <Section title="Allgemein">
            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <Field label="Farbe" custom>
                <ColorPicker value={embed.color} onChange={(color) => set({ color })} />
              </Field>
              <Field label="Titel" count={embed.title?.length} max={LIMITS.title}>
                <Input value={embed.title ?? ""} onChange={(event) => set({ title: event.target.value })} />
              </Field>
            </div>
            <Field label="Titel-Link" hint="Optional: Der Titel wird zum Link.">
              <Input
                value={embed.url ?? ""}
                onChange={(event) => set({ url: event.target.value })}
                placeholder="https://"
              />
            </Field>
            <Field
              label="Beschreibung"
              count={embed.description?.length}
              max={LIMITS.description}
              action={<MarkdownHelp />}
            >
              <Textarea
                value={embed.description ?? ""}
                onChange={(event) => set({ description: event.target.value })}
                className="min-h-32"
              />
            </Field>
          </Section>

          <Section title="Autor">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" count={embed.author?.name?.length} max={LIMITS.author}>
                <Input
                  value={embed.author?.name ?? ""}
                  onChange={(event) => set({ author: { ...embed.author, name: event.target.value } })}
                />
              </Field>
              <Field label="Bild-URL">
                <Input
                  value={embed.author?.icon_url ?? ""}
                  onChange={(event) => set({ author: { ...embed.author, icon_url: event.target.value } })}
                  placeholder="https://"
                />
              </Field>
            </div>
          </Section>

          <Section title={`Felder (${fields.length}/${LIMITS.fields})`}>
            {fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2 rounded-lg border border-border p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={field.name}
                    onChange={(event) => setField(fieldIndex, { name: event.target.value })}
                    placeholder="Name"
                    aria-label={`Feld ${fieldIndex + 1} Name`}
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        checked={field.inline ?? false}
                        onChange={(event) => setField(fieldIndex, { inline: event.target.checked })}
                        className="size-4 accent-[var(--primary)]"
                      />
                      Nebeneinander
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => set({ fields: fields.filter((_, i) => i !== fieldIndex) })}
                      aria-label="Feld entfernen"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={field.value}
                  onChange={(event) => setField(fieldIndex, { value: event.target.value })}
                  placeholder="Wert"
                  className="min-h-16"
                  aria-label={`Feld ${fieldIndex + 1} Wert`}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={fields.length >= LIMITS.fields}
              onClick={() => set({ fields: [...fields, { name: "", value: "", inline: false }] })}
            >
              <Plus />
              Feld hinzufügen
            </Button>
          </Section>

          <Section title="Bilder">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Großes Bild">
                <Input
                  value={embed.image?.url ?? ""}
                  onChange={(event) => set({ image: { url: event.target.value } })}
                  placeholder="https://"
                />
              </Field>
              <Field label="Thumbnail (rechts oben)">
                <Input
                  value={embed.thumbnail?.url ?? ""}
                  onChange={(event) => set({ thumbnail: { url: event.target.value } })}
                  placeholder="https://"
                />
              </Field>
            </div>
          </Section>

          <Section title="Footer">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Text" count={embed.footer?.text?.length} max={LIMITS.footer}>
                <Input
                  value={embed.footer?.text ?? ""}
                  onChange={(event) => set({ footer: { ...embed.footer, text: event.target.value } })}
                />
              </Field>
              <Field label="Bild-URL">
                <Input
                  value={embed.footer?.icon_url ?? ""}
                  onChange={(event) => set({ footer: { ...embed.footer, icon_url: event.target.value } })}
                  placeholder="https://"
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={Boolean(embed.timestamp)}
                onChange={(event) => set({ timestamp: event.target.checked ? new Date().toISOString() : undefined })}
                className="size-4 accent-[var(--primary)]"
              />
              Zeitstempel anzeigen (Zeitpunkt des Speicherns)
            </label>
          </Section>
        </div>
      )}
    </div>
  );
}

export function MessageEditor({
  value,
  onChange,
}: {
  value: MessagePayload;
  onChange: (payload: MessagePayload) => void;
}) {
  const embeds = value.embeds ?? [];
  const setEmbeds = (next: Embed[]) => onChange({ ...value, embeds: next });
  const total = totalLength(value);

  return (
    <div className="space-y-4">
      <Field
        label="Nachrichtentext"
        count={value.content?.length}
        max={LIMITS.content}
        hint="Optional, erscheint über den Embeds."
        action={<MarkdownHelp />}
      >
        <Textarea
          value={value.content ?? ""}
          onChange={(event) => onChange({ ...value, content: event.target.value })}
        />
      </Field>

      {embeds.map((embed, index) => (
        <EmbedEditor
          key={index}
          embed={embed}
          index={index}
          total={embeds.length}
          onChange={(next) => setEmbeds(embeds.map((current, i) => (i === index ? next : current)))}
          onRemove={() => setEmbeds(embeds.filter((_, i) => i !== index))}
          onDuplicate={() =>
            setEmbeds([...embeds.slice(0, index + 1), structuredClone(embed), ...embeds.slice(index + 1)])
          }
        />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={embeds.length >= LIMITS.embeds}
          onClick={() => setEmbeds([...embeds, emptyEmbed()])}
        >
          <Plus />
          Embed hinzufügen
        </Button>
        <span className={cn("text-xs tabular-nums", total > LIMITS.total ? "font-semibold text-danger" : "text-faint")}>
          {total}/{LIMITS.total} Zeichen in Embeds
        </span>
      </div>
    </div>
  );
}
