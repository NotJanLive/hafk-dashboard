"use client";

import { Eye, EyeOff, Lock, Plus, Radio, Send, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DiscordPreview, type PreviewComponents } from "@/components/embeds/discord-preview";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChannelSelect } from "@/components/ui/channel-select";
import { type Choice, ChoiceGrid } from "@/components/ui/choice-grid";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Field, Input, Textarea } from "@/components/ui/field";
import { RolePicker } from "@/components/ui/role-picker";
import { SelectMenu } from "@/components/ui/select-menu";
import { Switch } from "@/components/ui/switch";
import type { Channel, GuildEmoji, MessagePayload, PollVisibility, Role } from "@/lib/bot-api/types";
import { roleColor } from "@/lib/discord/cdn";
import { createPoll } from "./actions";
import { optionEmoji } from "./poll-results";

const MAX_OPTIONS = 20;

const PRIVACY: Choice<"public" | "anonymous">[] = [
  {
    value: "public",
    label: "Öffentlich",
    description: "Wer wofür stimmt, ist im Dashboard und bei den Ergebnissen sichtbar",
    icon: Users,
  },
  {
    value: "anonymous",
    label: "Anonym",
    description: "Niemand sieht, wer wofür gestimmt hat, auch nicht im Dashboard",
    icon: Lock,
  },
];

const VISIBILITIES: Choice<PollVisibility>[] = [
  { value: "LIVE", label: "Live", description: "Alle sehen den Zwischenstand direkt in der Nachricht", icon: Radio },
  {
    value: "AFTER_VOTE",
    label: "Nach der Stimme",
    description: "Erst wer abgestimmt hat, sieht das Ergebnis",
    icon: Eye,
  },
  { value: "CLOSED", label: "Am Ende", description: "Das Ergebnis bleibt bis zum Ende verborgen", icon: EyeOff },
];

const DURATIONS = [
  { value: "60", label: "1 Stunde" },
  { value: "360", label: "6 Stunden" },
  { value: "720", label: "12 Stunden" },
  { value: "1440", label: "1 Tag" },
  { value: "4320", label: "3 Tage" },
  { value: "10080", label: "1 Woche" },
  { value: "20160", label: "2 Wochen" },
  { value: "43200", label: "30 Tage" },
  { value: "0", label: "Ohne Ende" },
];

type OptionDraft = { label: string; emoji: string | null };

export function PollEditor({
  guildId,
  channels,
  roles,
  emojis,
  guildInfo,
  bot,
}: {
  guildId: string;
  channels: Channel[];
  roles: Role[];
  emojis: GuildEmoji[];
  guildInfo: { name: string; iconUrl: string | null };
  bot: { name: string; avatarUrl: string | null };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [channelId, setChannelId] = useState("");
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([
    { label: "", emoji: null },
    { label: "", emoji: null },
  ]);
  const [privacy, setPrivacy] = useState<"public" | "anonymous">("public");
  const [visibility, setVisibility] = useState<PollVisibility>("LIVE");
  const [hostResults, setHostResults] = useState(true);
  const [maxChoices, setMaxChoices] = useState(1);
  const [allowChange, setAllowChange] = useState(true);
  const [duration, setDuration] = useState("1440");
  const [allowedRoleIds, setAllowedRoleIds] = useState<string[]>([]);
  const [pingRoleId, setPingRoleId] = useState("");

  const anonymous = privacy === "anonymous";
  const choices = Math.min(maxChoices, Math.max(1, options.length));
  const effectiveHostResults = visibility === "LIVE" || hostResults;
  const [now] = useState(() => Math.floor(Date.now() / 1000));
  const endsAt = now + Number(duration) * 60;
  const pingable = roles.filter((role) => !role.managed && role.id !== guildId);

  const setOption = (index: number, patch: Partial<OptionDraft>) =>
    setOptions(options.map((option, i) => (i === index ? { ...option, ...patch } : option)));

  const meta = [
    choices === 1 ? "Eine Antwort" : `Bis zu ${choices} Antworten`,
    ...(duration === "0" ? ["Ohne Enddatum"] : []),
    ...(visibility === "AFTER_VOTE" ? ["Ergebnis nach deiner Stimme"] : []),
    ...(visibility === "CLOSED" ? ["Ergebnis nach dem Ende"] : []),
    ...(allowChange ? [] : ["Stimme ist endgültig"]),
    ...(allowedRoleIds.length > 0 ? [`Nur für ${allowedRoleIds.map((id) => `<@&${id}>`).join(", ")}`] : []),
  ];
  const optionLines = options.map((option, index) => {
    const line = `${optionEmoji(option.emoji, index)} **${option.label.trim() || `Antwort ${index + 1}`}**`;
    return visibility === "LIVE" ? `${line}\n${"▱".repeat(12)} **0 %** · 0 Stimmen` : line;
  });
  const previewPayload: MessagePayload = {
    content: pingRoleId ? `<@&${pingRoleId}>` : undefined,
    embeds: [
      {
        author: { name: anonymous ? "🔒 Anonyme Umfrage" : "📊 Umfrage" },
        title: question.trim() || "Deine Frage",
        description: [
          duration === "0" ? "" : `⏳ Endet <t:${endsAt}:R> · <t:${endsAt}:f>`,
          description.trim(),
          optionLines.join("\n\n"),
          `-# ${meta.join(" · ")}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        color: 0x5b6cff,
        footer: {
          text: `0 Teilnahmen · ${anonymous ? "Diese Umfrage ist anonym" : "Diese Umfrage ist öffentlich"}`,
        },
      },
    ],
  };
  const previewComponents: PreviewComponents = {
    type: "BUTTONS",
    buttons: [
      ...options.map((option, index) => ({
        label: option.label.trim() || `Antwort ${index + 1}`,
        emoji: option.emoji,
        style: "SECONDARY" as const,
      })),
      { label: "Meine Stimme", emoji: "🗳️", style: "PRIMARY" },
    ],
  };

  const submit = () =>
    startTransition(async () => {
      const result = await createPoll(guildId, {
        channelId,
        question: question.trim(),
        description: description.trim() || null,
        anonymous,
        visibility,
        hostResults: effectiveHostResults,
        maxChoices: choices,
        allowChange,
        pingRoleId: pingRoleId || null,
        durationMinutes: Number(duration),
        options: options.map((option) => ({ label: option.label.trim(), emoji: option.emoji })),
        allowedRoleIds,
      });
      if (result.ok) {
        toast.success("Umfrage gestartet.");
        router.push(result.id ? `/servers/${guildId}/polls/${result.id}` : `/servers/${guildId}/polls`);
      } else {
        toast.error(result.message, { description: result.errors?.join(" ") });
      }
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Frage" />
          <CardBody className="space-y-5">
            <Field label="Kanal" custom>
              <ChannelSelect channels={channels} value={channelId} onChange={setChannelId} />
            </Field>
            <Field label="Frage" count={question.length} max={256}>
              <Input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={256}
                placeholder="z. B. Was spielen wir am Freitag?"
              />
            </Field>
            <Field label="Beschreibung (optional)" count={description.length} max={1000}>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                placeholder="Zusätzliche Infos, Markdown wird unterstützt"
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={`Antworten (${options.length}/${MAX_OPTIONS})`}
            description="Ohne eigenes Emoji bekommt jede Antwort einen Buchstaben."
          />
          <CardBody className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <EmojiPicker
                  value={option.emoji}
                  onChange={(emoji) => setOption(index, { emoji })}
                  serverEmojis={emojis}
                  guild={guildInfo}
                  compact
                />
                <Input
                  value={option.label}
                  onChange={(event) => setOption(index, { label: event.target.value })}
                  maxLength={80}
                  placeholder={`Antwort ${index + 1}`}
                  aria-label={`Antwort ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOptions(options.filter((_, i) => i !== index))}
                  disabled={options.length <= 2}
                  aria-label={`Antwort ${index + 1} entfernen`}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOptions([...options, { label: "", emoji: null }])}
              disabled={options.length >= MAX_OPTIONS}
            >
              <Plus />
              Antwort hinzufügen
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Abstimmung" />
          <CardBody className="space-y-6">
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted">Sichtbarkeit der Stimmen</p>
              <ChoiceGrid options={PRIVACY} value={privacy} onChange={setPrivacy} columns={2} />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted">Ergebnis für Mitglieder</p>
              <ChoiceGrid options={VISIBILITIES} value={visibility} onChange={setVisibility} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Laufzeit" custom>
                <SelectMenu value={duration} onChange={setDuration} options={DURATIONS} ariaLabel="Laufzeit" />
              </Field>
              <Field label="Antworten pro Person" custom>
                <SelectMenu
                  value={String(choices)}
                  onChange={(value) => setMaxChoices(Number(value))}
                  ariaLabel="Antworten pro Person"
                  options={Array.from({ length: Math.max(1, options.length) }, (_, i) => ({
                    value: String(i + 1),
                    label: i === 0 ? "Eine Antwort" : `Bis zu ${i + 1} Antworten`,
                  }))}
                />
              </Field>
            </div>
            <div className="-mx-3 space-y-1">
              <Switch
                checked={effectiveHostResults}
                onChange={setHostResults}
                disabled={visibility === "LIVE"}
                label="Zwischenstände für Ersteller und Team"
                description={
                  visibility === "LIVE"
                    ? "Bei Live-Ergebnissen sieht jeder den Zwischenstand."
                    : "Aus: Auch du und das Dashboard sehen das Ergebnis erst am Ende. Überraschung!"
                }
              />
              <Switch
                checked={allowChange}
                onChange={setAllowChange}
                label="Stimme ändern erlaubt"
                description="Mitglieder können ihre Stimme wechseln oder zurückziehen, solange die Umfrage läuft."
              />
            </div>
            <Field
              label="Wer darf abstimmen? (optional)"
              hint="Leer lassen, damit alle abstimmen können, die den Kanal sehen."
              custom
            >
              <RolePicker
                name="allowedRoleIds"
                roles={roles}
                defaultValue={allowedRoleIds}
                max={25}
                onChange={setAllowedRoleIds}
              />
            </Field>
            <Field
              label="Rolle pingen (optional)"
              hint="Wird beim Start der Umfrage und bei der Nachricht zum Ende erwähnt."
              custom
            >
              <SelectMenu
                value={pingRoleId}
                onChange={setPingRoleId}
                ariaLabel="Rolle pingen"
                searchPlaceholder="Rollen durchsuchen …"
                options={[
                  { value: "", label: "Niemanden pingen" },
                  ...pingable.map((role) => ({ value: role.id, label: role.name, color: roleColor(role.color) })),
                ]}
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold tracking-wide text-faint uppercase">Vorschau</p>
          <Button type="button" onClick={submit} disabled={pending || !channelId}>
            <Send />
            {pending ? "Bitte warten…" : "Umfrage starten"}
          </Button>
        </div>
        <DiscordPreview
          payload={previewPayload}
          botName={bot.name}
          botAvatarUrl={bot.avatarUrl}
          channels={channels}
          roles={roles}
          components={previewComponents}
        />
        <p className="text-xs text-faint">
          {anonymous
            ? "Bei anonymen Umfragen speichert der Bot pro Person nur einen nicht umkehrbaren Code statt der Discord-ID. So wird doppeltes Abstimmen verhindert, ohne dass jemand die Stimme zuordnen kann."
            : "Über „Ergebnisse“ in Discord und hier im Dashboard ist sichtbar, wer wofür gestimmt hat."}
        </p>
      </div>
    </div>
  );
}
