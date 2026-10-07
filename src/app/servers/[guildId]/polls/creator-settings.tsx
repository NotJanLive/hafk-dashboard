"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { RolePicker } from "@/components/ui/role-picker";
import type { Role } from "@/lib/bot-api/types";
import { savePollSettings } from "./actions";

export function CreatorSettings({
  guildId,
  roles,
  creatorRoleIds,
}: {
  guildId: string;
  roles: Role[];
  creatorRoleIds: string[];
}) {
  const [selected, setSelected] = useState(creatorRoleIds);
  const [pending, startTransition] = useTransition();
  const changed = [...selected].sort().join(",") !== [...creatorRoleIds].sort().join(",");

  const save = () =>
    startTransition(async () => {
      const result = await savePollSettings(guildId, selected);
      if (result.ok) toast.success("Einstellungen gespeichert.");
      else toast.error(result.message, { description: result.errors?.join(" ") });
    });

  return (
    <Card>
      <CardHeader
        title="Umfragen in Discord starten"
        description="Wer Zugriff aufs Dashboard hat, darf immer /poll create nutzen. Diese Rollen dürfen es zusätzlich."
      />
      <CardBody>
        <RolePicker
          key={creatorRoleIds.join(",")}
          name="creatorRoleIds"
          roles={roles}
          defaultValue={creatorRoleIds}
          max={25}
          onChange={setSelected}
        />
      </CardBody>
      <CardFooter>
        <Button type="button" onClick={save} disabled={pending || !changed}>
          {pending ? "Wird gespeichert…" : "Speichern"}
        </Button>
      </CardFooter>
    </Card>
  );
}
