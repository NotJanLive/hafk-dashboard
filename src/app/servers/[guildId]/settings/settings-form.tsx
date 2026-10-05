"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { RolePicker } from "@/components/ui/role-picker";
import type { Role, Settings } from "@/lib/bot-api/types";
import { updateSettings, type FormState } from "../actions";

export function SettingsForm({ guildId, settings, roles }: { guildId: string; settings: Settings; roles: Role[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateSettings, { status: "idle" });

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message, { description: state.errors?.join(" ") });
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="guildId" value={guildId} />
      <Card>
        <CardHeader
          title="Dashboard-Zugriff"
          description="Admins und Mitglieder mit „Server verwalten“ haben immer Zugriff. Diese Rollen dürfen das Dashboard zusätzlich nutzen."
        />
        <CardBody>
          {/* React resets forms to their initial values after an action; remount on new saved state. */}
          <RolePicker
            key={settings.dashboardRoleIds.join(",")}
            name="dashboardRoleIds"
            roles={roles}
            defaultValue={settings.dashboardRoleIds}
            max={25}
          />
        </CardBody>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Wird gespeichert…" : "Änderungen speichern"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
