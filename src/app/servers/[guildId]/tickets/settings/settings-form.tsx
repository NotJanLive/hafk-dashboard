"use client";

import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { ChannelSelect } from "@/components/ui/channel-select";
import { Field, Input } from "@/components/ui/field";
import { SelectMenu } from "@/components/ui/select-menu";
import { Switch } from "@/components/ui/switch";
import { TargetPicker } from "@/components/ui/target-picker";
import type { Channel, Role, TicketSettings } from "@/lib/bot-api/types";
import { saveTicketSettings, searchMembers } from "../actions";

const DELAYS = [0, 5, 10, 30, 60, 120, 300].map((seconds) => ({
  value: String(seconds),
  label:
    seconds === 0
      ? "Sofort"
      : seconds < 60
        ? `${seconds} Sekunden`
        : `${seconds / 60} Minute${seconds === 60 ? "" : "n"}`,
}));

const RETENTION = [
  { value: "", label: "Unbegrenzt aufbewahren" },
  { value: "30", label: "30 Tage" },
  { value: "90", label: "90 Tage" },
  { value: "180", label: "180 Tage" },
  { value: "365", label: "1 Jahr" },
  { value: "730", label: "2 Jahre" },
];

export function TicketSettingsForm({
  guildId,
  channels,
  roles,
  settings,
}: {
  guildId: string;
  channels: Channel[];
  roles: Role[];
  settings: TicketSettings;
}) {
  const [draft, setDraft] = useState(settings);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<TicketSettings>) => setDraft((current) => ({ ...current, ...patch }));
  const changed = JSON.stringify(draft) !== JSON.stringify(settings);
  const [privateLog, setPrivateLog] = useState(true);
  const logChanged = Boolean(draft.logChannelId) && draft.logChannelId !== settings.logChannelId;

  const save = () =>
    startTransition(async () => {
      const result = await saveTicketSettings(
        guildId,
        {
          ...draft,
          staff: draft.staff.map(({ type, id }) => ({ type, id })),
          transcriptViewers: draft.transcriptViewers.map(({ type, id }) => ({ type, id })),
        },
        logChanged && privateLog,
      );
      if (result.ok) toast.success("Einstellungen gespeichert.");
      else toast.error(result.message, { description: result.errors?.join(" ") });
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Support-Team"
          description="Diese Rollen und Personen sehen und bearbeiten Tickets aller Kategorien, bei denen „Globales Support-Team einbeziehen“ an ist. Kategorien ohne diesen Schalter bearbeiten nur ihre eigenen Support-Rollen."
        />
        <CardBody>
          <TargetPicker
            guildId={guildId}
            roles={roles}
            value={draft.staff}
            onChange={(staff) => set({ staff })}
            search={searchMembers}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Transkripte"
          description="Transkripte sind eigene Seiten und nur nach dem Login sichtbar. Dashboard-Berechtigte sehen sie immer, hier gibst du sie zusätzlich frei, z. B. für Moderatoren ohne Dashboard-Zugriff."
        />
        <CardBody className="space-y-4">
          <Field label="Zusätzlicher Zugriff auf Transkripte" custom>
            <TargetPicker
              guildId={guildId}
              roles={roles}
              value={draft.transcriptViewers}
              onChange={(transcriptViewers) => set({ transcriptViewers })}
              search={searchMembers}
            />
          </Field>
          <Switch
            checked={draft.creatorTranscript}
            onChange={(creatorTranscript) => set({ creatorTranscript })}
            label="Ersteller sehen ihr eigenes Transkript"
            description="Der Link kommt mit der Abschluss-Nachricht per DM. Interne Team-Notizen bleiben für sie unsichtbar."
          />
          <Field
            label="Aufbewahrung"
            hint="Ältere geschlossene Tickets werden samt Dateien automatisch gelöscht."
            custom
          >
            <SelectMenu
              value={draft.retentionDays === null ? "" : String(draft.retentionDays)}
              onChange={(value) => set({ retentionDays: value ? Number(value) : null })}
              options={RETENTION}
              ariaLabel="Aufbewahrung"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Ablauf" description="Wer was in einem Ticket darf." />
        <CardBody className="space-y-1">
          <Switch
            checked={draft.creatorCanClose}
            onChange={(creatorCanClose) => set({ creatorCanClose })}
            label="Ersteller dürfen ihr Ticket selbst schließen"
          />
          <Switch
            checked={draft.claimLock}
            onChange={(claimLock) => set({ claimLock })}
            label="Nach dem Übernehmen schreibt nur noch der Bearbeiter"
            description="Das restliche Team kann das Ticket dann nur noch lesen, bis es freigegeben oder übergeben wird."
          />
          <Switch
            checked={draft.transferToAnyone}
            onChange={(transferToAnyone) => set({ transferToAnyone })}
            label="Übergabe an beliebige Mitglieder"
            description="Aus: Tickets lassen sich nur an Mitglieder des Support-Teams übergeben."
          />
          <Switch
            checked={draft.notesEnabled}
            onChange={(notesEnabled) => set({ notesEnabled })}
            label="Team-Notizen"
            description="Ein privater Thread im Ticket, den nur das Team sieht. Die Notizen landen als interne Nachrichten im Transkript."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Schließen" description="Was beim Schließen eines Tickets passiert." />
        <CardBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Log-Kanal" hint="Hier landet beim Schließen eine Übersicht mit Link zum Transkript." custom>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <ChannelSelect
                    channels={channels}
                    value={draft.logChannelId ?? ""}
                    onChange={(logChannelId) => set({ logChannelId })}
                    placeholder="Kein Log-Kanal"
                    roles={roles}
                    createDefaults={{
                      visibility: "PRIVATE",
                      roleIds: draft.staff.filter((target) => target.type === "ROLE").map((target) => target.id),
                      hint: "Privat für alle, die Tickets bearbeiten. Neue Team-Rollen bekommen später automatisch Zugriff.",
                    }}
                  />
                </div>
                {draft.logChannelId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => set({ logChannelId: null })}
                    aria-label="Log-Kanal entfernen"
                  >
                    <X />
                  </Button>
                )}
              </div>
              {logChanged && (
                <div className="-mx-3 mt-2">
                  <Switch
                    checked={privateLog}
                    onChange={setPrivateLog}
                    label="Nur für das Ticket-Team sichtbar machen"
                    description="Setzt beim Speichern die Rechte: @everyone sieht ihn nicht, alle Ticket-Rollen schon."
                  />
                </div>
              )}
            </Field>
            <Field label="Kanal löschen nach" custom>
              <SelectMenu
                value={String(draft.closeDelaySeconds)}
                onChange={(value) => set({ closeDelaySeconds: Number(value) })}
                options={DELAYS}
                ariaLabel="Verzögerung"
              />
            </Field>
            <Field
              label="Schließantrag: automatisch schließen nach (Stunden)"
              hint="Standard für /ticket close-request. Im Befehl lässt sich eine andere Zeit angeben."
            >
              <Input
                type="number"
                min={1}
                max={336}
                value={draft.closeRequestHours}
                onChange={(event) =>
                  set({ closeRequestHours: Math.max(1, Math.min(336, Number(event.target.value) || 1)) })
                }
              />
            </Field>
          </div>
          <div className="space-y-1">
            <Switch
              checked={draft.dmOnClose}
              onChange={(dmOnClose) => set({ dmOnClose })}
              label="Ersteller per DM benachrichtigen"
              description="Mit Zusammenfassung, Grund und, falls freigegeben, Link zum Transkript."
            />
            <Switch
              checked={draft.ratingsEnabled}
              onChange={(ratingsEnabled) => set({ ratingsEnabled })}
              disabled={!draft.dmOnClose}
              label="Bewertung des Supports"
              description="Mit 1 bis 5 Sternen und optionalem Kommentar. Zählt für den Bearbeiter des Tickets und erscheint in der Team-Statistik."
            />
          </div>
        </CardBody>
        <CardFooter>
          <Button type="button" variant="ghost" onClick={() => setDraft(settings)} disabled={!changed || pending}>
            Zurücksetzen
          </Button>
          <Button type="button" onClick={save} disabled={!changed || pending}>
            {pending ? "Wird gespeichert…" : "Speichern"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
