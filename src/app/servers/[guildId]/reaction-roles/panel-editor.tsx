"use client";

import {
  CheckCircle2,
  List,
  MousePointerClick,
  Plus,
  Repeat,
  Save,
  Send,
  ShieldCheck,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DiscordPreview, type PreviewComponents } from "@/components/embeds/discord-preview";
import { JsonDialog } from "@/components/embeds/json-dialog";
import { MessageEditor } from "@/components/embeds/message-editor";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChannelSelect } from "@/components/ui/channel-select";
import { type Choice, ChoiceGrid } from "@/components/ui/choice-grid";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Field, Input } from "@/components/ui/field";
import { SelectMenu } from "@/components/ui/select-menu";
import { roleColor } from "@/lib/discord/cdn";
import type {
  ButtonStyle,
  Channel,
  GuildEmoji,
  MessagePayload,
  ReactionRoleMode,
  ReactionRoleOption,
  ReactionRolePanel,
  ReactionRoleType,
  Role,
} from "@/lib/bot-api/types";
import { cleanPayload, emptyEmbed } from "@/lib/embeds/payload";
import { cn } from "@/lib/utils";
import { savePanel } from "./actions";

const TYPES: Choice<ReactionRoleType>[] = [
  { value: "BUTTONS", label: "Buttons", description: "Ein Button pro Rolle", icon: MousePointerClick },
  { value: "SELECT", label: "Auswahlmenü", description: "Platzsparend, mit Beschreibungen", icon: List },
  { value: "REACTIONS", label: "Reaktionen", description: "Klassisch per Emoji", icon: SmilePlus },
];

const MODES: Choice<ReactionRoleMode>[] = [
  { value: "NORMAL", label: "Normal", description: "Rollen beliebig nehmen und abgeben", icon: Repeat },
  { value: "UNIQUE", label: "Nur eine", description: "Höchstens eine Rolle aus diesem Panel", icon: CheckCircle2 },
  { value: "VERIFY", label: "Bestätigen", description: "Rollen können nur hinzugefügt werden", icon: ShieldCheck },
];

const STYLES: { value: ButtonStyle; label: string; swatch: string }[] = [
  { value: "PRIMARY", label: "Blau", swatch: "bg-[#5865f2]" },
  { value: "SECONDARY", label: "Grau", swatch: "bg-[#4e5058]" },
  { value: "SUCCESS", label: "Grün", swatch: "bg-[#248046]" },
  { value: "DANGER", label: "Rot", swatch: "bg-[#da373c]" },
];

export function PanelEditor({
  guildId,
  channels,
  roles,
  emojis,
  guildInfo,
  botHighestRolePosition,
  bot,
  panel,
}: {
  guildId: string;
  channels: Channel[];
  roles: Role[];
  emojis: GuildEmoji[];
  guildInfo: { name: string; iconUrl: string | null };
  botHighestRolePosition: number;
  bot: { name: string; avatarUrl: string | null };
  panel: ReactionRolePanel | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [channelId, setChannelId] = useState(panel?.channelId ?? "");
  const [label, setLabel] = useState(panel?.label ?? "");
  const [type, setType] = useState<ReactionRoleType>(panel?.type ?? "BUTTONS");
  const [mode, setMode] = useState<ReactionRoleMode>(panel?.mode ?? "NORMAL");
  const [options, setOptions] = useState<ReactionRoleOption[]>(panel?.options ?? []);
  const [payload, setPayload] = useState<MessagePayload>(
    panel?.payload ?? {
      embeds: [{ ...emptyEmbed(), title: "Wähle deine Rollen", description: "Klicke unten, um dir Rollen zu geben." }],
    },
  );

  const assignable = roles.filter((role) => !role.managed);
  const maxOptions = type === "REACTIONS" ? 20 : 25;
  const setOption = (index: number, patch: Partial<ReactionRoleOption>) =>
    setOptions(options.map((option, i) => (i === index ? { ...option, ...patch } : option)));
  const addOption = () => {
    const next = assignable.find(
      (role) => role.position < botHighestRolePosition && !options.some((option) => option.roleId === role.id),
    );
    if (!next) {
      toast.error("Es gibt keine weitere Rolle, die der Bot vergeben kann.");
      return;
    }
    setOptions([...options, { roleId: next.id, label: next.name, emoji: null, description: null, style: "SECONDARY" }]);
  };

  const preview: PreviewComponents =
    type === "BUTTONS"
      ? {
          type,
          buttons: options.map((option) => ({
            label: option.label,
            emoji: option.emoji,
            style: option.style ?? "SECONDARY",
          })),
        }
      : type === "SELECT"
        ? { type, placeholder: mode === "UNIQUE" ? "Wähle eine Rolle" : "Wähle deine Rollen" }
        : { type, emojis: options.map((option) => option.emoji).filter((emoji): emoji is string => Boolean(emoji)) };

  const save = () =>
    startTransition(async () => {
      const result = await savePanel(guildId, panel?.id ?? null, {
        channelId: panel ? null : channelId || null,
        label: label.trim() || null,
        type,
        mode,
        payload: cleanPayload(payload),
        options: options.map((option) => ({
          roleId: option.roleId,
          label: option.label?.trim() || null,
          emoji: option.emoji?.trim() || null,
          description: type === "SELECT" ? option.description?.trim() || null : null,
          style: type === "BUTTONS" ? (option.style ?? "SECONDARY") : null,
        })),
      });
      if (result.ok) {
        toast.success(panel ? "Panel aktualisiert." : "Panel gesendet.");
        router.push(`/servers/${guildId}/reaction-roles`);
      } else {
        toast.error(result.message, { description: result.errors?.join(" ") });
      }
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Grundlagen" />
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {panel ? (
                <div className="text-sm">
                  <p className="font-semibold text-muted">Kanal</p>
                  <p className="mt-2 font-semibold">#{panel.channelName ?? "unbekannt"}</p>
                </div>
              ) : (
                <Field label="Kanal" custom>
                  <ChannelSelect channels={channels} value={channelId} onChange={setChannelId} />
                </Field>
              )}
              <Field label="Name (nur im Dashboard)">
                <Input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  maxLength={100}
                  placeholder="z. B. Spiele-Rollen"
                />
              </Field>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted">Art</p>
              <ChoiceGrid options={TYPES} value={type} onChange={setType} />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted">Modus</p>
              <ChoiceGrid options={MODES} value={mode} onChange={setMode} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={`Rollen (${options.length}/${maxOptions})`}
            description="Die Rolle des Bots muss in den Servereinstellungen über diesen Rollen stehen."
          />
          <CardBody className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2">
                <Field label="Rolle" custom>
                  <SelectMenu
                    value={option.roleId}
                    onChange={(roleId) => setOption(index, { roleId })}
                    ariaLabel={`Rolle ${index + 1}`}
                    searchPlaceholder="Rollen durchsuchen …"
                    options={assignable.map((role) => ({
                      value: role.id,
                      label: role.name,
                      color: roleColor(role.color),
                      disabled: role.position >= botHighestRolePosition,
                      hint: role.position >= botHighestRolePosition ? "über der Bot-Rolle" : undefined,
                    }))}
                  />
                </Field>
                <Field label="Emoji" custom>
                  <EmojiPicker
                    value={option.emoji}
                    onChange={(emoji) => setOption(index, { emoji })}
                    serverEmojis={emojis}
                    guild={guildInfo}
                    align="right"
                  />
                </Field>
                {type !== "REACTIONS" && (
                  <Field label="Beschriftung">
                    <Input
                      value={option.label ?? ""}
                      onChange={(event) => setOption(index, { label: event.target.value })}
                      maxLength={80}
                    />
                  </Field>
                )}
                {type === "SELECT" && (
                  <Field label="Beschreibung (optional)">
                    <Input
                      value={option.description ?? ""}
                      onChange={(event) => setOption(index, { description: event.target.value })}
                      maxLength={100}
                    />
                  </Field>
                )}
                {type === "BUTTONS" && (
                  <div>
                    <p className="mb-1.5 text-[13px] font-semibold text-muted">Farbe</p>
                    <div className="flex gap-2">
                      {STYLES.map((style) => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => setOption(index, { style: style.value })}
                          title={style.label}
                          aria-label={style.label}
                          className={cn(
                            "size-8 rounded-lg ring-offset-2 ring-offset-surface",
                            style.swatch,
                            (option.style ?? "SECONDARY") === style.value && "ring-2 ring-primary",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-end justify-end sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOptions(options.filter((_, i) => i !== index))}
                  >
                    <Trash2 />
                    Entfernen
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addOption} disabled={options.length >= maxOptions}>
              <Plus />
              Rolle hinzufügen
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Nachricht" description="Text und Embeds über den Buttons, dem Menü oder den Reaktionen." />
          <CardBody>
            <MessageEditor value={payload} onChange={setPayload} />
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold tracking-wide text-faint uppercase">Vorschau</p>
          <div className="flex gap-2">
            <JsonDialog payload={payload} onImport={setPayload} />
            <Button type="button" onClick={save} disabled={pending}>
              {panel ? <Save /> : <Send />}
              {pending ? "Bitte warten…" : panel ? "Änderungen übernehmen" : "Panel senden"}
            </Button>
          </div>
        </div>
        <DiscordPreview
          payload={cleanPayload(payload)}
          botName={bot.name}
          botAvatarUrl={bot.avatarUrl}
          channels={channels}
          roles={roles}
          components={preview}
        />
      </div>
    </div>
  );
}
