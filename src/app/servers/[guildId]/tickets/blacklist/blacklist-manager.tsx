"use client";

import { Ban, Shield, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { SelectMenu } from "@/components/ui/select-menu";
import { TargetPicker } from "@/components/ui/target-picker";
import type { AccessTarget, BlacklistEntry, Role } from "@/lib/bot-api/types";
import { roleColor } from "@/lib/discord/cdn";
import { formatDateTime } from "@/lib/utils";
import { addBlacklist, removeBlacklist, searchMembers } from "../actions";

const DURATIONS = [
  { value: "", label: "Dauerhaft" },
  { value: "1", label: "1 Tag" },
  { value: "3", label: "3 Tage" },
  { value: "7", label: "1 Woche" },
  { value: "30", label: "30 Tage" },
  { value: "90", label: "90 Tage" },
];

export function BlacklistManager({
  guildId,
  roles,
  entries,
}: {
  guildId: string;
  roles: Role[];
  entries: BlacklistEntry[];
}) {
  const router = useRouter();
  const [targets, setTargets] = useState<AccessTarget[]>([]);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("");
  const [pending, startTransition] = useTransition();

  const add = () =>
    startTransition(async () => {
      for (const target of targets) {
        const result = await addBlacklist(guildId, {
          type: target.type,
          id: target.id,
          reason: reason.trim() || null,
          days: days ? Number(days) : null,
        });
        if (!result.ok) {
          toast.error(result.message, { description: result.errors?.join(" ") });
          return;
        }
      }
      toast.success(targets.length === 1 ? "Gesperrt." : `${targets.length} Einträge gesperrt.`);
      setTargets([]);
      setReason("");
      router.refresh();
    });

  const remove = (entry: BlacklistEntry) =>
    startTransition(async () => {
      const result = await removeBlacklist(guildId, entry.target.type, entry.target.id);
      if (result.ok) {
        toast.success("Sperre aufgehoben.");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Sperre hinzufügen"
          description="Gesperrte Personen und Mitglieder gesperrter Rollen können keine Tickets mehr öffnen. In Discord geht das auch mit /ticket blacklist."
        />
        <CardBody className="space-y-4">
          <TargetPicker
            guildId={guildId}
            roles={roles}
            value={targets}
            onChange={setTargets}
            max={10}
            search={searchMembers}
          />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Field label="Grund (optional)" count={reason.length} max={500}>
              <Input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
            </Field>
            <Field label="Dauer" custom>
              <SelectMenu value={days} onChange={setDays} options={DURATIONS} ariaLabel="Dauer" />
            </Field>
          </div>
        </CardBody>
        <CardFooter>
          <Button type="button" variant="danger" onClick={add} disabled={targets.length === 0 || pending}>
            <Ban />
            Sperren
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader title={`Aktive Sperren (${entries.length})`} />
        <CardBody className="space-y-2">
          {entries.length === 0 && <p className="text-sm text-faint">Niemand ist gesperrt.</p>}
          {entries.map((entry) => {
            const role =
              entry.target.type === "ROLE" ? roles.find((candidate) => candidate.id === entry.target.id) : null;
            return (
              <div
                key={`${entry.target.type}:${entry.target.id}`}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3"
              >
                {entry.target.type === "ROLE" ? (
                  <Shield className="size-5" style={{ color: roleColor(role?.color ?? 0) ?? "var(--faint)" }} />
                ) : entry.target.avatarUrl ? (
                  <img src={entry.target.avatarUrl} alt="" className="size-8 rounded-full" />
                ) : (
                  <User className="size-5 text-faint" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {entry.target.type === "ROLE"
                      ? `@${role?.name ?? entry.target.name ?? "Gelöschte Rolle"}`
                      : (entry.target.name ?? entry.target.id)}
                  </p>
                  <p className="text-xs text-muted">
                    {entry.expiresAt ? `bis ${formatDateTime(entry.expiresAt)}` : "dauerhaft"}
                    {entry.reason && ` · ${entry.reason}`}
                    {entry.createdBy?.name && ` · von ${entry.createdBy.name}`}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(entry)} disabled={pending}>
                  <Trash2 />
                  Aufheben
                </Button>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
