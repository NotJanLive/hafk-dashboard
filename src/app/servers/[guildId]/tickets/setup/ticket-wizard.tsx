"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  FolderKanban,
  Hash,
  LayoutTemplate,
  List,
  MousePointerClick,
  PartyPopper,
  Plus,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategorySelect, ChannelSelect } from "@/components/ui/channel-select";
import { type Choice, ChoiceGrid } from "@/components/ui/choice-grid";
import { EmojiPicker, EmojiValue } from "@/components/ui/emoji-picker";
import { Field, Input } from "@/components/ui/field";
import { RolePicker } from "@/components/ui/role-picker";
import { Switch } from "@/components/ui/switch";
import { TargetPicker } from "@/components/ui/target-picker";
import type { AccessTarget, ButtonStyle, Channel, GuildEmoji, Role, TicketPanelStyle } from "@/lib/bot-api/types";
import { blankDraft, type CategoryDraft, draftFromPreset, TICKET_PRESETS } from "@/lib/tickets/presets";
import { cn } from "@/lib/utils";
import { FormBuilder } from "../categories/form-builder";
import { runTicketSetup, searchMembers } from "../actions";

const STEPS = [
  { title: "Kategorien", icon: LayoutTemplate },
  { title: "Teams", icon: Users },
  { title: "Kanäle", icon: Hash },
  { title: "Optionen", icon: SlidersHorizontal },
  { title: "Fertig", icon: Check },
];

const STYLES: Choice<TicketPanelStyle>[] = [
  { value: "SELECT", label: "Auswahlmenü", description: "Übersichtlich, mit Emoji und Beschreibung", icon: List },
  { value: "BUTTONS", label: "Buttons", description: "Ein Klick pro Kategorie", icon: MousePointerClick },
];

const COLORS: { value: ButtonStyle; swatch: string; label: string }[] = [
  { value: "PRIMARY", swatch: "bg-[#5865f2]", label: "Blau" },
  { value: "SECONDARY", swatch: "bg-[#4e5058]", label: "Grau" },
  { value: "SUCCESS", swatch: "bg-[#248046]", label: "Grün" },
  { value: "DANGER", swatch: "bg-[#da373c]", label: "Rot" },
];

function draftProblem(draft: CategoryDraft) {
  if (!draft.name.trim()) return "Jede Kategorie braucht einen Namen.";
  if (draft.fields.some((field) => !field.label.trim())) return `„${draft.name}“: Jede Frage braucht einen Text.`;
  if (draft.fields.some((field) => field.options.some((option) => !option.label.trim()))) {
    return `„${draft.name}“: Jede Auswahlmöglichkeit braucht einen Text.`;
  }
  if (draft.application && draft.fields.length === 0)
    return `„${draft.name}“: Eine Bewerbung braucht mindestens eine Frage.`;
  return null;
}

function DraftEditor({
  draft,
  expanded,
  onToggle,
  onChange,
  onRemove,
  emojis,
  guild,
}: {
  draft: CategoryDraft;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<CategoryDraft>) => void;
  onRemove: () => void;
  emojis: GuildEmoji[];
  guild: { name: string; iconUrl: string | null };
}) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        expanded ? "border-primary/50 bg-surface-2/40" : "border-border",
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
            {draft.emoji ? <EmojiValue value={draft.emoji} /> : <FolderKanban className="size-5 text-faint" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate font-bold", !draft.name.trim() && "text-faint")}>
              {draft.name.trim() || "Neue Kategorie"}
            </span>
            <span className="mt-0.5 flex flex-wrap gap-1.5">
              <Badge>
                {draft.fields.length === 0
                  ? "Ohne Formular"
                  : `${draft.fields.length} ${draft.fields.length === 1 ? "Frage" : "Fragen"}`}
              </Badge>
            </span>
          </span>
          <ChevronDown className={cn("size-5 shrink-0 text-faint transition-transform", expanded && "rotate-180")} />
        </button>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label="Kategorie entfernen">
          <Trash2 />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-5 border-t border-border p-4">
          <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
            <Field label="Emoji" custom>
              <EmojiPicker
                value={draft.emoji}
                onChange={(emoji) => onChange({ emoji })}
                serverEmojis={emojis}
                guild={guild}
              />
            </Field>
            <Field label="Name" count={draft.name.length} max={80}>
              <Input
                value={draft.name}
                onChange={(event) => onChange({ name: event.target.value })}
                maxLength={80}
                placeholder="z. B. Technik-Hilfe, Entbannung, Event-Anmeldung"
                autoFocus={!draft.name}
              />
            </Field>
          </div>
          <Field label="Beschreibung" count={draft.description?.length ?? 0} max={100}>
            <Input
              value={draft.description ?? ""}
              onChange={(event) => onChange({ description: event.target.value || null })}
              maxLength={100}
              placeholder="Erscheint im Auswahlmenü unter dem Namen"
            />
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-muted">Button-Farbe</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => onChange({ buttonStyle: color.value })}
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-lg border px-2.5 text-[13px] font-semibold",
                    draft.buttonStyle === color.value
                      ? "border-primary bg-primary-soft"
                      : "border-border-strong hover:bg-surface-2",
                  )}
                >
                  <span className={cn("size-3 rounded", color.swatch)} />
                  {color.label}
                </button>
              ))}
            </div>
          </div>
          <div className="-mx-3">
            <Switch
              checked={draft.application}
              onChange={(application) => onChange({ application })}
              label="Als Bewerbung behandeln"
              description="Das Team bekommt im Ticket Buttons zum Annehmen und Ablehnen."
            />
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-muted">Fragen beim Öffnen</p>
            <FormBuilder
              fields={draft.fields}
              onChange={(fields) => onChange({ fields })}
              emojis={emojis}
              guild={guild}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function TicketWizard({
  guildId,
  channels,
  roles,
  emojis,
  guildInfo,
  existingCategories,
}: {
  guildId: string;
  channels: Channel[];
  roles: Role[];
  emojis: GuildEmoji[];
  guildInfo: { name: string; iconUrl: string | null };
  existingCategories: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<CategoryDraft[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [staff, setStaff] = useState<AccessTarget[]>([]);
  const [panelChannelId, setPanelChannelId] = useState("");
  const [parentId, setParentId] = useState("");
  const [logChannelId, setLogChannelId] = useState("");
  const [panelStyle, setPanelStyle] = useState<TicketPanelStyle>("SELECT");
  const [ratingsEnabled, setRatingsEnabled] = useState(true);
  const [notesEnabled, setNotesEnabled] = useState(true);
  const [creatorTranscript, setCreatorTranscript] = useState(false);
  const [claimLock, setClaimLock] = useState(false);
  const [applyAccess, setApplyAccess] = useState(true);
  const [done, setDone] = useState(false);

  const update = (uid: string, patch: Partial<CategoryDraft>) =>
    setDrafts((current) => current.map((draft) => (draft.uid === uid ? { ...draft, ...patch } : draft)));
  const add = (draft: CategoryDraft) => {
    setDrafts((current) => [...current, draft]);
    setExpanded(draft.uid);
  };
  const teamRoleIds = [
    ...new Set([
      ...staff.filter((target) => target.type === "ROLE").map((target) => target.id),
      ...drafts.flatMap((draft) => draft.supportRoleIds),
    ]),
  ];
  const channelName = (id: string) => channels.find((channel) => channel.id === id)?.name ?? "neuer Kanal";

  const problem = (() => {
    if (step === 0) {
      if (drafts.length === 0) return "Füge mindestens eine Kategorie hinzu.";
      return drafts.map(draftProblem).find(Boolean) ?? null;
    }
    if (step === 1) {
      const lonely = drafts.find((draft) => draft.onlyTeam && draft.supportRoleIds.length === 0);
      if (lonely)
        return `„${lonely.name}“ soll nur von einem eigenen Team bearbeitet werden. Wähle dafür mindestens eine Rolle.`;
      if (staff.length === 0 && drafts.some((draft) => draft.supportRoleIds.length === 0)) {
        return "Mindestens eine Kategorie hat noch kein Team. Wähle ein allgemeines Support-Team oder Rollen pro Kategorie.";
      }
    }
    if (step === 2 && !panelChannelId) return "Wähle oder erstelle den Kanal, in dem das Ticket-Panel erscheinen soll.";
    return null;
  })();

  const finish = () =>
    startTransition(async () => {
      const result = await runTicketSetup(guildId, {
        categories: drafts.map((draft) => ({
          name: draft.name.trim(),
          emoji: draft.emoji,
          description: draft.description,
          buttonStyle: draft.buttonStyle,
          application: draft.application,
          maxOpen: draft.maxOpen,
          cooldownMinutes: draft.cooldownMinutes,
          fields: draft.fields,
          supportRoleIds: draft.supportRoleIds,
          includeStaff: !draft.onlyTeam,
        })),
        staff: staff.map(({ type, id }) => ({ type, id })),
        parentId: parentId || null,
        panelChannelId,
        panelStyle,
        logChannelId: logChannelId || null,
        ratingsEnabled,
        notesEnabled,
        creatorTranscript,
        claimLock,
        applyAccess,
      });
      if (result.ok) {
        setDone(true);
        router.refresh();
      } else {
        toast.error(result.message, { description: result.errors?.join("\n") });
      }
    });

  if (done) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center md:p-12">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
          <PartyPopper className="size-8" />
        </span>
        <h2 className="mt-5 text-2xl font-bold">Dein Ticketsystem läuft!</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
          {drafts.length} {drafts.length === 1 ? "Kategorie wurde" : "Kategorien wurden"} angelegt und das Panel ist in{" "}
          <span className="font-semibold text-text">#{channelName(panelChannelId)}</span> gesendet. Begrüßung, Rollen
          und alles Weitere passt du jederzeit einzeln an.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/servers/${guildId}/tickets/categories`} className={buttonClasses({ variant: "secondary" })}>
            Kategorien anpassen
          </Link>
          <Link href={`/servers/${guildId}/tickets`} className={buttonClasses()}>
            Zur Übersicht
            <ArrowRight />
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-6 grid grid-cols-5 gap-2" aria-label="Fortschritt">
        {STEPS.map((item, index) => (
          <li key={item.title} aria-current={index === step ? "step" : undefined}>
            <span className={cn("block h-1.5 rounded-full", index <= step ? "bg-primary" : "bg-surface-3")} />
            <span
              className={cn(
                "mt-2 flex items-center gap-1.5 text-[13px] font-semibold",
                index <= step ? "text-text" : "text-faint",
              )}
            >
              <item.icon className="size-3.5 shrink-0" />
              <span className="truncate">{item.title}</span>
            </span>
          </li>
        ))}
      </ol>

      <Card className="overflow-visible">
        {step === 0 && (
          <section className="space-y-5 p-6 md:p-8">
            <div>
              <h2 className="text-xl font-bold">Welche Tickets brauchst du?</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Starte mit einer Vorlage oder baue eine eigene Kategorie. Klick auf eine Kategorie, um Name, Emoji und
                Fragen anzupassen.
                {existingCategories > 0 && ` Deine ${existingCategories} vorhandenen Kategorien bleiben erhalten.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {TICKET_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => add(draftFromPreset(preset))}
                  title={preset.summary}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary-soft"
                >
                  <span>{preset.emoji}</span>
                  {preset.name}
                  <Plus className="size-3.5 text-faint" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => add(blankDraft())}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <Plus className="size-4" />
                Eigene Kategorie
              </button>
            </div>

            <div className="space-y-2">
              {drafts.length === 0 && (
                <p className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted">
                  Noch keine Kategorie. Wähle oben eine Vorlage oder erstelle eine eigene.
                </p>
              )}
              {drafts.map((draft) => (
                <DraftEditor
                  key={draft.uid}
                  draft={draft}
                  expanded={expanded === draft.uid}
                  onToggle={() => setExpanded((current) => (current === draft.uid ? null : draft.uid))}
                  onChange={(patch) => update(draft.uid, patch)}
                  onRemove={() => setDrafts((current) => current.filter((candidate) => candidate.uid !== draft.uid))}
                  emojis={emojis}
                  guild={guildInfo}
                />
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-6 p-6 md:p-8">
            <div>
              <h2 className="text-xl font-bold">Wer bearbeitet die Tickets?</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Ein allgemeines Support-Team sieht alle Kategorien. Zusätzlich kannst du pro Kategorie eigene Rollen
                festlegen, z. B. Reports für Moderatoren und Bewerbungen nur für die Teamleitung.
              </p>
            </div>
            <Field label="Allgemeines Support-Team (optional)" custom>
              <TargetPicker guildId={guildId} roles={roles} value={staff} onChange={setStaff} search={searchMembers} />
            </Field>
            {drafts.map((draft) => (
              <div key={draft.uid} className="rounded-xl border border-border p-4">
                <p className="mb-3 flex items-center gap-2 font-bold">
                  {draft.emoji && <EmojiValue value={draft.emoji} className="size-5 text-lg" />}
                  {draft.name}
                </p>
                <RolePicker
                  name={`support-${draft.uid}`}
                  roles={roles}
                  defaultValue={draft.supportRoleIds}
                  max={25}
                  onChange={(supportRoleIds) => update(draft.uid, { supportRoleIds })}
                />
                <div className="-mx-3 mt-2">
                  <Switch
                    checked={draft.onlyTeam}
                    onChange={(onlyTeam) => update(draft.uid, { onlyTeam })}
                    label="Nur diese Rollen sehen diese Tickets"
                    description="Das allgemeine Support-Team hat dann keinen Zugriff auf diese Kategorie."
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5 p-6 md:p-8">
            <div>
              <h2 className="text-xl font-bold">Wo soll alles hin?</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Wähle vorhandene Kanäle oder lege über „Neuen Kanal erstellen“ direkt neue an, ohne Umweg über Discord.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kanal für das Panel" hint="Hier klicken Mitglieder, um ein Ticket zu öffnen." custom>
                <ChannelSelect
                  channels={channels}
                  value={panelChannelId}
                  onChange={setPanelChannelId}
                  roles={roles}
                  createDefaults={{
                    visibility: "READ_ONLY",
                    hint: "Für das Ticket-Panel: Alle sehen es, schreiben kann nur der Bot.",
                  }}
                />
              </Field>
              <Field
                label="Discord-Kategorie für Ticket-Kanäle"
                hint="Darin entstehen die einzelnen Ticket-Kanäle."
                custom
              >
                <CategorySelect
                  channels={channels}
                  value={parentId}
                  onChange={setParentId}
                  roles={roles}
                  createDefaults={{
                    visibility: "PRIVATE",
                    roleIds: teamRoleIds,
                    hint: "Privat für das Ticket-Team. Die einzelnen Tickets bekommen zusätzlich eigene Rechte.",
                  }}
                />
              </Field>
              <Field label="Log-Kanal (optional)" hint="Zusammenfassung und Transkript-Link beim Schließen." custom>
                <ChannelSelect
                  channels={channels}
                  value={logChannelId}
                  onChange={setLogChannelId}
                  placeholder="Kein Log-Kanal"
                  roles={roles}
                  createDefaults={{
                    visibility: "PRIVATE",
                    roleIds: teamRoleIds,
                    hint: "Privat für alle, die Tickets bearbeiten. Neue Team-Rollen bekommen später automatisch Zugriff.",
                  }}
                />
              </Field>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted">Darstellung des Panels</p>
              <ChoiceGrid options={STYLES} value={panelStyle} onChange={setPanelStyle} columns={2} />
            </div>
            <div className="-mx-3">
              <Switch
                checked={applyAccess}
                onChange={setApplyAccess}
                label="Berechtigungen automatisch setzen"
                description="Auch für bestehende Kanäle: Panel-Kanal nur lesen, Ticket-Kategorie und Log-Kanal nur für das Ticket-Team. Andere Rechte bleiben erhalten."
              />
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="p-6 md:p-8">
            <h2 className="text-xl font-bold">Ein paar Extras</h2>
            <p className="mt-2 mb-4 text-[15px] leading-relaxed text-muted">
              Alles lässt sich später in den Einstellungen ändern.
            </p>
            <div className="-mx-3 space-y-1">
              <Switch
                checked={notesEnabled}
                onChange={setNotesEnabled}
                label="Team-Notizen"
                description="Privater Thread im Ticket, den nur das Team sieht."
              />
              <Switch
                checked={ratingsEnabled}
                onChange={setRatingsEnabled}
                label="Bewertungen"
                description="Nach dem Schließen bewertet die Person den Support mit 1 bis 5 Sternen."
              />
              <Switch
                checked={creatorTranscript}
                onChange={setCreatorTranscript}
                label="Ersteller sehen ihr Transkript"
                description="Der Link kommt per DM, Team-Notizen bleiben unsichtbar."
              />
              <Switch
                checked={claimLock}
                onChange={setClaimLock}
                label="Nur der Bearbeiter schreibt"
                description="Nach dem Übernehmen kann das restliche Team nur noch mitlesen."
              />
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="p-6 md:p-8">
            <h2 className="text-xl font-bold">Bereit zum Erstellen</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Das passiert, wenn du auf „Ticketsystem erstellen“ klickst:
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              {drafts.map((draft) => {
                const roleNames = draft.supportRoleIds
                  .map((id) => roles.find((role) => role.id === id)?.name)
                  .filter(Boolean);
                return (
                  <li key={draft.uid} className="flex items-start gap-3 rounded-xl bg-surface-2 px-4 py-3">
                    {draft.emoji ? (
                      <EmojiValue value={draft.emoji} className="mt-0.5 size-5 text-lg" />
                    ) : (
                      <FolderKanban className="mt-0.5 size-4 text-muted" />
                    )}
                    <span>
                      <span className="font-semibold">Kategorie „{draft.name}“</span>
                      <span className="block text-muted">
                        {draft.fields.length === 0 ? "Ohne Formular" : `${draft.fields.length} Fragen`} ·{" "}
                        {roleNames.length > 0 ? `Team: ${roleNames.join(", ")}` : "Team: allgemeines Support-Team"}
                        {draft.onlyTeam
                          ? " (exklusiv)"
                          : roleNames.length > 0 && staff.length > 0
                            ? " + allgemeines Support-Team"
                            : ""}
                      </span>
                    </span>
                  </li>
                );
              })}
              <li className="flex items-start gap-3 rounded-xl bg-surface-2 px-4 py-3">
                <Hash className="mt-0.5 size-4 text-muted" />
                <span>
                  <span className="font-semibold">
                    Panel als {panelStyle === "SELECT" ? "Auswahlmenü" : "Buttons"} in #{channelName(panelChannelId)}
                  </span>
                  <span className="block text-muted">
                    {logChannelId ? `Log in #${channelName(logChannelId)}` : "Ohne Log-Kanal"}
                  </span>
                </span>
              </li>
            </ul>
          </section>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-surface-2/50 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((value) => value - 1)}
            className={step === 0 ? "invisible" : undefined}
          >
            <ArrowLeft />
            Zurück
          </Button>
          {problem && (
            <p className="order-last w-full text-sm text-warning sm:order-none sm:w-auto sm:flex-1 sm:text-right">
              {problem}
            </p>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              key="next"
              type="button"
              disabled={problem !== null}
              onClick={() => {
                if (step === 0) {
                  setPanelStyle(drafts.length > 2 ? "SELECT" : "BUTTONS");
                  setExpanded(null);
                }
                setStep((value) => value + 1);
              }}
            >
              Weiter
              <ArrowRight />
            </Button>
          ) : (
            <Button key="submit" type="button" onClick={finish} disabled={pending}>
              {pending ? "Wird erstellt…" : "Ticketsystem erstellen"}
            </Button>
          )}
        </footer>
      </Card>
    </div>
  );
}
