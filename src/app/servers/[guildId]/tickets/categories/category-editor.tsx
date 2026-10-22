"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DiscordPreview } from "@/components/embeds/discord-preview";
import { MessageEditor } from "@/components/embeds/message-editor";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CategorySelect } from "@/components/ui/channel-select";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Field, Input, Textarea } from "@/components/ui/field";
import { RolePicker } from "@/components/ui/role-picker";
import { SelectMenu } from "@/components/ui/select-menu";
import { Switch } from "@/components/ui/switch";
import type {
  ButtonStyle,
  Channel,
  GuildEmoji,
  MessagePayload,
  Role,
  TicketCategory,
  TicketCategoryInput,
} from "@/lib/bot-api/types";
import { roleColor } from "@/lib/discord/cdn";
import { cleanPayload } from "@/lib/embeds/payload";
import { cn } from "@/lib/utils";
import { saveCategory } from "../actions";
import { FormBuilder } from "./form-builder";

const STYLES: { value: ButtonStyle; label: string; swatch: string }[] = [
  { value: "PRIMARY", label: "Blau", swatch: "bg-[#5865f2]" },
  { value: "SECONDARY", label: "Grau", swatch: "bg-[#4e5058]" },
  { value: "SUCCESS", label: "Grün", swatch: "bg-[#248046]" },
  { value: "DANGER", label: "Rot", swatch: "bg-[#da373c]" },
];

const COOLDOWNS = [
  { value: "0", label: "Keine Wartezeit" },
  { value: "5", label: "5 Minuten" },
  { value: "30", label: "30 Minuten" },
  { value: "60", label: "1 Stunde" },
  { value: "360", label: "6 Stunden" },
  { value: "1440", label: "1 Tag" },
  { value: "10080", label: "1 Woche" },
];

const MAX_OPEN = [
  { value: "1", label: "1 offenes Ticket" },
  { value: "2", label: "2 offene Tickets" },
  { value: "3", label: "3 offene Tickets" },
  { value: "5", label: "5 offene Tickets" },
  { value: "0", label: "Unbegrenzt" },
];

function defaultWelcome(): MessagePayload {
  return {
    embeds: [
      {
        title: "{category} · Ticket #{number}",
        description:
          "Hallo {user}, danke für deine Anfrage!\n\nDas Team meldet sich so schnell wie möglich bei dir. Beschreibe dein Anliegen bitte schon einmal so genau wie möglich.",
        color: 0x5b6cff,
        footer: { text: "Mit 🔒 Schließen beendest du das Ticket." },
      },
    ],
  };
}

function empty(position: number): TicketCategoryInput {
  return {
    name: "",
    emoji: null,
    description: null,
    buttonStyle: "PRIMARY",
    parentId: null,
    channelPattern: "{category}-{number}",
    welcome: null,
    confirmText: null,
    formTitle: null,
    maxOpen: 1,
    cooldownMinutes: 0,
    pingSupport: true,
    includeStaff: true,
    application: false,
    acceptRoleId: null,
    acceptMessage: null,
    denyMessage: null,
    closeOnDecision: false,
    position,
    supportRoleIds: [],
    pingRoleIds: [],
    requiredRoleIds: [],
    fields: [],
  };
}

function previewText(text: string, name: string) {
  return text
    .replaceAll("{user}", "@Max")
    .replaceAll("{username}", "max")
    .replaceAll("{category}", name || "Support")
    .replaceAll("{number}", "42")
    .replaceAll("{server}", "Hans & Friends");
}

export function CategoryEditor({
  guildId,
  channels,
  roles,
  emojis,
  guildInfo,
  bot,
  botHighestRolePosition,
  category,
  position,
}: {
  guildId: string;
  channels: Channel[];
  roles: Role[];
  emojis: GuildEmoji[];
  guildInfo: { name: string; iconUrl: string | null };
  bot: { name: string; avatarUrl: string | null };
  botHighestRolePosition: number;
  category: TicketCategory | null;
  position: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<TicketCategoryInput>(() => {
    if (!category) return empty(position);
    return Object.fromEntries(Object.entries(category).filter(([key]) => key !== "id")) as TicketCategoryInput;
  });
  const [privateParent, setPrivateParent] = useState(true);
  const parentChanged = Boolean(draft.parentId) && draft.parentId !== (category?.parentId ?? null);
  const set = (patch: Partial<TicketCategoryInput>) => setDraft((current) => ({ ...current, ...patch }));
  const assignable = roles.filter((role) => !role.managed && role.id !== guildId);
  const welcome = draft.welcome ?? defaultWelcome();
  const previewPayload: MessagePayload = {
    content: previewText(
      [
        "@Max",
        ...(draft.pingSupport ? draft.supportRoleIds : []).map((id) => `<@&${id}>`),
        ...draft.pingRoleIds.map((id) => `<@&${id}>`),
      ].join(" ") + (welcome.content ? `\n${welcome.content}` : ""),
      draft.name,
    ),
    embeds: (welcome.embeds ?? []).map((embed) => ({
      ...embed,
      title: embed.title ? previewText(embed.title, draft.name) : undefined,
      description: embed.description ? previewText(embed.description, draft.name) : undefined,
      footer: embed.footer
        ? { ...embed.footer, text: embed.footer.text ? previewText(embed.footer.text, draft.name) : undefined }
        : undefined,
      fields: embed.fields?.map((field) => ({
        ...field,
        name: previewText(field.name, draft.name),
        value: previewText(field.value, draft.name),
      })),
    })),
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveCategory(
        guildId,
        category?.id ?? null,
        {
          ...draft,
          welcome: draft.welcome ? cleanPayload(draft.welcome) : null,
          acceptRoleId: draft.application ? draft.acceptRoleId : null,
        },
        parentChanged && privateParent,
      );
      if (result.ok) {
        toast.success(category ? "Kategorie gespeichert." : "Kategorie erstellt.");
        if (!category) router.push(`/servers/${guildId}/tickets/categories`);
        else router.refresh();
      } else {
        toast.error(result.message, { description: result.errors?.join("\n") });
      }
    });

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader title="Grundlagen" description="So erscheint die Kategorie im Panel." />
        <CardBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
            <Field label="Emoji" custom>
              <EmojiPicker
                value={draft.emoji}
                onChange={(emoji) => set({ emoji })}
                serverEmojis={emojis}
                guild={guildInfo}
              />
            </Field>
            <Field label="Name" count={draft.name.length} max={80}>
              <Input
                value={draft.name}
                onChange={(event) => set({ name: event.target.value })}
                maxLength={80}
                placeholder="z. B. Support, Report oder Bewerbung"
              />
            </Field>
          </div>
          <Field
            label="Beschreibung"
            count={draft.description?.length ?? 0}
            max={100}
            hint="Erscheint im Auswahlmenü unter dem Namen."
          >
            <Input
              value={draft.description ?? ""}
              onChange={(event) => set({ description: event.target.value || null })}
              maxLength={100}
              placeholder="z. B. Fragen und Probleme rund um den Server"
            />
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-muted">Button-Farbe (bei Panels mit Buttons)</p>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => set({ buttonStyle: style.value })}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold",
                    draft.buttonStyle === style.value
                      ? "border-primary bg-primary-soft"
                      : "border-border-strong hover:bg-surface-2",
                  )}
                >
                  <span className={cn("size-3.5 rounded", style.swatch)} />
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Ticket-Kanal" description="Wo und wie die Kanäle für diese Tickets entstehen." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Discord-Kategorie" hint="Ist sie voll (50 Kanäle), entsteht der Kanal ohne Kategorie." custom>
            <CategorySelect
              channels={channels}
              value={draft.parentId ?? ""}
              onChange={(value) => set({ parentId: value || null })}
              roles={roles}
              createDefaults={{
                visibility: "PRIVATE",
                roleIds: draft.supportRoleIds,
                hint: "Privat für die Support-Rollen dieser Kategorie. Die Tickets darin bekommen eigene Rechte.",
              }}
            />
            {parentChanged && (
              <div className="-mx-3 mt-2">
                <Switch
                  checked={privateParent}
                  onChange={setPrivateParent}
                  label="Kategorie privat für das Team machen"
                  description="Beim Speichern sieht nur noch das Team diese Discord-Kategorie. Andere Rechte bleiben erhalten."
                />
              </div>
            )}
          </Field>
          <Field
            label="Kanalname"
            hint="Platzhalter: {category}, {number}, {username}"
            count={draft.channelPattern?.length ?? 0}
            max={100}
          >
            <Input
              value={draft.channelPattern ?? ""}
              onChange={(event) => set({ channelPattern: event.target.value || null })}
              maxLength={100}
              placeholder="{category}-{number}"
            />
          </Field>
          <Field label="Offene Tickets pro Person" custom>
            <SelectMenu
              value={String(draft.maxOpen)}
              onChange={(value) => set({ maxOpen: Number(value) })}
              options={MAX_OPEN}
              ariaLabel="Offene Tickets"
            />
          </Field>
          <Field label="Wartezeit bis zum nächsten Ticket" custom>
            <SelectMenu
              value={String(draft.cooldownMinutes)}
              onChange={(value) => set({ cooldownMinutes: Number(value) })}
              options={
                COOLDOWNS.some((option) => option.value === String(draft.cooldownMinutes))
                  ? COOLDOWNS
                  : [...COOLDOWNS, { value: String(draft.cooldownMinutes), label: `${draft.cooldownMinutes} Minuten` }]
              }
              ariaLabel="Wartezeit"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Rollen"
          description="Wer Tickets dieser Kategorie sehen und bearbeiten darf. So können z. B. Reports bei den Moderatoren und Bewerbungen bei einem anderen Team landen."
        />
        <CardBody className="space-y-5">
          <Field label="Support-Rollen" custom>
            <RolePicker
              name="supportRoleIds"
              roles={roles}
              defaultValue={draft.supportRoleIds}
              max={25}
              onChange={(supportRoleIds) => set({ supportRoleIds })}
            />
          </Field>
          <div className="-mx-3">
            <Switch
              checked={draft.includeStaff}
              onChange={(includeStaff) => set({ includeStaff })}
              label="Globales Support-Team einbeziehen"
              description={
                draft.includeStaff
                  ? "Das Support-Team aus den Einstellungen und alle Dashboard-Rollen sehen diese Tickets zusätzlich."
                  : "Nur die Support-Rollen oben sehen und bearbeiten diese Tickets. Administratoren sieht Discord immer alles."
              }
            />
            <Switch
              checked={draft.pingSupport}
              onChange={(pingSupport) => set({ pingSupport })}
              label="Support-Rollen beim Öffnen pingen"
              description="Ohne eigene Support-Rollen wird das globale Support-Team gepingt, sofern es einbezogen ist."
            />
          </div>
          <Field label="Zusätzlich pingen" custom>
            <RolePicker
              name="pingRoleIds"
              roles={roles}
              defaultValue={draft.pingRoleIds}
              max={25}
              onChange={(pingRoleIds) => set({ pingRoleIds })}
            />
          </Field>
          <Field label="Nur für diese Rollen" hint="Leer lassen, damit alle diese Kategorie öffnen dürfen." custom>
            <RolePicker
              name="requiredRoleIds"
              roles={roles}
              defaultValue={draft.requiredRoleIds}
              max={25}
              onChange={(requiredRoleIds) => set({ requiredRoleIds })}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Vor dem Öffnen"
          description="Optionaler Hinweis, den die Person bestätigen muss, z. B. „Hast du schon in die FAQ geschaut?“"
        />
        <CardBody>
          <Field label="Hinweistext" count={draft.confirmText?.length ?? 0} max={2000}>
            <Textarea
              value={draft.confirmText ?? ""}
              onChange={(event) => set({ confirmText: event.target.value || null })}
              maxLength={2000}
              placeholder="Leer lassen, um das Ticket ohne Rückfrage zu öffnen"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`Formular (${draft.fields.length} ${draft.fields.length === 1 ? "Frage" : "Fragen"})`}
          description="Fragen erscheinen als Discord-Formular, bevor das Ticket entsteht. Die Antworten stehen oben im Ticket und im Transkript."
        />
        <CardBody className="space-y-5">
          {draft.fields.length > 0 && (
            <Field
              label="Titel des Formulars"
              count={draft.formTitle?.length ?? 0}
              max={40}
              hint="Standard: Name der Kategorie"
            >
              <Input
                value={draft.formTitle ?? ""}
                onChange={(event) => set({ formTitle: event.target.value || null })}
                maxLength={40}
              />
            </Field>
          )}
          <FormBuilder fields={draft.fields} onChange={(fields) => set({ fields })} emojis={emojis} guild={guildInfo} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Bewerbung"
          description="Das Team kann die Antworten direkt im Ticket annehmen oder ablehnen. Die Person bekommt das Ergebnis per DM."
        />
        <CardBody className="space-y-4">
          <div className="-mx-3">
            <Switch
              checked={draft.application}
              onChange={(application) => set({ application })}
              label="Als Bewerbung behandeln"
              description="Braucht mindestens eine Frage im Formular."
            />
          </div>
          {draft.application && (
            <>
              <Field label="Rolle bei Annahme (optional)" custom>
                <SelectMenu
                  value={draft.acceptRoleId ?? ""}
                  onChange={(value) => set({ acceptRoleId: value || null })}
                  ariaLabel="Rolle bei Annahme"
                  options={[
                    { value: "", label: "Keine Rolle vergeben" },
                    ...assignable.map((role) => ({
                      value: role.id,
                      label: role.name,
                      color: roleColor(role.color),
                      disabled: role.position >= botHighestRolePosition,
                      hint: role.position >= botHighestRolePosition ? "über der Bot-Rolle" : undefined,
                    })),
                  ]}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="DM bei Annahme" count={draft.acceptMessage?.length ?? 0} max={1000}>
                  <Textarea
                    value={draft.acceptMessage ?? ""}
                    onChange={(event) => set({ acceptMessage: event.target.value || null })}
                    maxLength={1000}
                    placeholder="🎉 Deine Bewerbung auf **{server}** wurde angenommen!"
                  />
                </Field>
                <Field label="DM bei Ablehnung" count={draft.denyMessage?.length ?? 0} max={1000}>
                  <Textarea
                    value={draft.denyMessage ?? ""}
                    onChange={(event) => set({ denyMessage: event.target.value || null })}
                    maxLength={1000}
                    placeholder="Deine Bewerbung auf **{server}** wurde leider abgelehnt."
                  />
                </Field>
              </div>
              <div className="-mx-3">
                <Switch
                  checked={draft.closeOnDecision}
                  onChange={(closeOnDecision) => set({ closeOnDecision })}
                  label="Ticket nach der Entscheidung automatisch schließen"
                />
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Begrüßung im Ticket"
            description="Platzhalter: {user}, {username}, {category}, {number}, {server}. Die Buttons hängt der Bot automatisch an."
          />
          <CardBody className="space-y-4">
            <div className="-mx-3">
              <Switch
                checked={draft.welcome !== null}
                onChange={(custom) => set({ welcome: custom ? defaultWelcome() : null })}
                label="Eigene Begrüßung verwenden"
                description="Aus: Der Bot nutzt die Standard-Begrüßung aus der Vorschau."
              />
            </div>
            {draft.welcome && <MessageEditor value={draft.welcome} onChange={(welcome) => set({ welcome })} />}
          </CardBody>
        </Card>
        <div className="xl:sticky xl:top-24 xl:self-start">
          <DiscordPreview
            payload={previewPayload}
            botName={bot.name}
            botAvatarUrl={bot.avatarUrl}
            channels={channels}
            roles={roles}
            components={{
              type: "BUTTONS",
              buttons: [
                { label: "Schließen", emoji: "🔒", style: "DANGER" },
                { label: "Übernehmen", emoji: "🙋", style: "SUCCESS" },
                { label: "Team-Notizen", emoji: "📝", style: "SECONDARY" },
              ],
            }}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/90 backdrop-blur lg:left-[272px]">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 py-3 md:px-8">
          <Button type="button" variant="ghost" onClick={() => router.push(`/servers/${guildId}/tickets/categories`)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={save} disabled={pending || !draft.name.trim()}>
            <Save />
            {pending ? "Wird gespeichert…" : category ? "Speichern" : "Kategorie erstellen"}
          </Button>
        </div>
      </div>
    </div>
  );
}
