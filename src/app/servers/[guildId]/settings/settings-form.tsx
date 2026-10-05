"use client";

import { Save } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChannelSelect } from "@/components/ui/channel-select";
import { FieldRow } from "@/components/ui/panel";
import { RolePicker } from "@/components/ui/role-picker";
import type { Channel, Role, Settings } from "@/lib/bot-api/types";
import { updateSettings, type SettingsFormState } from "./actions";

const MAX_DASHBOARD_ROLES = 25;

export function SettingsForm({
  guildId,
  settings,
  channels,
  roles,
}: {
  guildId: string;
  settings: Settings;
  channels: Channel[];
  roles: Role[];
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(updateSettings, { status: "idle" });

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message, { description: state.errors?.join(" ") });
  }, [state]);

  return (
    <form action={formAction} className="rounded-xl border border-line bg-surface">
      {/* No overflow-hidden on the form: the role picker dropdown must be able to extend beyond it. */}
      <input type="hidden" name="guildId" value={guildId} />

      <header className="flex h-11 items-center border-b border-line px-5">
        <h2 className="label">Allgemein</h2>
      </header>

      {/* React resets forms to their initial defaults after an action, so remount the fields whenever
          the saved state changes. The form itself stays mounted to keep the action state (toasts). */}
      <div key={JSON.stringify(settings)}>
        <FieldRow
          label="Log-Kanal"
          htmlFor="logChannelId"
          description="Der Bot protokolliert hier jede Änderung an der Konfiguration, egal ob aus Discord oder dem Dashboard."
        >
          <ChannelSelect
            id="logChannelId"
            name="logChannelId"
            channels={channels}
            defaultValue={settings.logChannelId}
            emptyLabel="Kein Log-Kanal"
          />
        </FieldRow>

        <FieldRow
          label="Dashboard-Rollen"
          description="Admins und Mitglieder mit „Server verwalten“ haben immer Zugriff. Diese Rollen dürfen das Dashboard zusätzlich nutzen."
        >
          <RolePicker
            name="dashboardRoleIds"
            roles={roles}
            defaultValue={settings.dashboardRoleIds}
            max={MAX_DASHBOARD_ROLES}
          />
        </FieldRow>

        <FieldRow
          label="Setup-Status"
          description="Markiert den Server als eingerichtet. Das kann auch per /setup in Discord passieren."
        >
          <label className="flex h-10 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="setupCompleted"
              defaultChecked={settings.setupCompleted}
              disabled={settings.setupCompleted}
              className="size-4 accent-[var(--accent)]"
            />
            {settings.setupCompleted ? "Setup abgeschlossen" : "Setup als abgeschlossen markieren"}
          </label>
          {/* Disabled checkboxes are not submitted, so keep the completed state explicitly. */}
          {settings.setupCompleted && <input type="hidden" name="setupCompleted" value="on" />}
        </FieldRow>
      </div>

      <footer className="flex items-center justify-between gap-4 rounded-b-xl border-t border-line bg-surface-2 px-5 py-3">
        <p className="text-[12.5px] text-faint">Änderungen werden sofort im Bot übernommen.</p>
        <Button type="submit" disabled={pending}>
          <Save />
          {pending ? "Speichert…" : "Speichern"}
        </Button>
      </footer>
    </form>
  );
}
