"use client";

import { ArrowLeft, ArrowRight, Check, CircleAlert, ExternalLink, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GuildIcon } from "@/components/ui/guild-icon";
import { RolePicker } from "@/components/ui/role-picker";
import type { Role } from "@/lib/bot-api/types";
import { cn } from "@/lib/utils";
import { completeSetup, type FormState } from "../actions";

const STEPS = [
  { title: "Berechtigungen", icon: ShieldCheck },
  { title: "Zugriff", icon: Users },
  { title: "Fertig", icon: Check },
];

export function SetupWizard({
  guild,
  missingPermissions,
  reinviteUrl,
  roles,
  dashboardRoleIds,
}: {
  guild: { id: string; name: string; iconUrl: string | null };
  missingPermissions: { key: string; label: string }[];
  reinviteUrl: string;
  roles: Role[];
  dashboardRoleIds: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState(dashboardRoleIds.length);
  const [state, formAction, pending] = useActionState<FormState, FormData>(completeSetup, { status: "idle" });

  useEffect(() => {
    if (state.status === "error") toast.error(state.message, { description: state.errors?.join(" ") });
  }, [state]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <GuildIcon name={guild.name} iconUrl={guild.iconUrl} size={56} />
        <div>
          <p className="text-sm font-medium text-muted">Einrichtung</p>
          <h1 className="text-2xl font-bold tracking-tight">{guild.name}</h1>
        </div>
      </div>

      <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Fortschritt">
        {STEPS.map((item, index) => (
          <li key={item.title} aria-current={index === step ? "step" : undefined}>
            <span className={cn("block h-1.5 rounded-full", index <= step ? "bg-primary" : "bg-surface-3")} />
            <span
              className={cn(
                "mt-2 flex items-center gap-1.5 text-[13px] font-semibold",
                index <= step ? "text-text" : "text-faint",
              )}
            >
              <item.icon className="size-3.5" />
              {item.title}
            </span>
          </li>
        ))}
      </ol>

      <form action={formAction}>
        <input type="hidden" name="guildId" value={guild.id} />
        <Card className="overflow-visible">
          <section hidden={step !== 0} className="p-6 md:p-8">
            <h2 className="text-xl font-bold">Willkommen! 👋</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Wir prüfen kurz, ob der Bot alle Rechte hat, die er für seine Funktionen braucht.
            </p>

            {missingPermissions.length === 0 ? (
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-success-soft px-4 py-3.5 text-sm font-semibold text-success">
                <Check className="size-5" />
                Alles bereit, der Bot hat alle benötigten Rechte.
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-warning/30 bg-warning-soft p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                  <CircleAlert className="size-5" />
                  {missingPermissions.length === 1
                    ? "Dem Bot fehlt 1 Recht"
                    : `Dem Bot fehlen ${missingPermissions.length} Rechte`}
                </p>
                <ul className="mt-3 grid gap-1.5 text-sm text-text sm:grid-cols-2">
                  {missingPermissions.map((permission) => (
                    <li key={permission.key} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-warning" />
                      {permission.label}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[13px] text-muted">
                  Gib der Bot-Rolle diese Rechte in den Servereinstellungen oder bestätige die Einladung erneut. Du
                  kannst auch ohne fortfahren, einzelne Funktionen klappen dann aber nicht.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={reinviteUrl} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    <ExternalLink />
                    Rechte erneut vergeben
                  </a>
                  <Button type="button" variant="ghost" size="sm" onClick={() => router.refresh()}>
                    <RefreshCw />
                    Erneut prüfen
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section hidden={step !== 1} className="p-6 md:p-8">
            <h2 className="text-xl font-bold">Wer darf das Dashboard nutzen?</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Admins und Mitglieder mit „Server verwalten“ haben immer Zugriff. Wähle zusätzlich Rollen aus, zum
              Beispiel euer Moderationsteam.
            </p>
            <div className="mt-6">
              <RolePicker
                name="dashboardRoleIds"
                roles={roles}
                defaultValue={dashboardRoleIds}
                max={25}
                onChange={(ids) => setSelectedRoles(ids.length)}
              />
            </div>
          </section>

          <section hidden={step !== 2} className="p-6 text-center md:p-10">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-hover">
              <Check className="size-7" />
            </span>
            <h2 className="mt-5 text-xl font-bold">Alles startklar</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
              {selectedRoles === 0
                ? "Nur Admins können das Dashboard nutzen."
                : `Admins und ${selectedRoles} ${selectedRoles === 1 ? "Rolle" : "Rollen"} können das Dashboard nutzen.`}{" "}
              Danach kannst du die Module für deinen Server aktivieren.
            </p>
          </section>

          <footer className="flex items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-surface-2/50 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((value) => value - 1)}
              className={step === 0 ? "invisible" : undefined}
            >
              <ArrowLeft />
              Zurück
            </Button>
            {step < STEPS.length - 1 ? (
              <Button key="next" type="button" onClick={() => setStep((value) => value + 1)}>
                Weiter
                <ArrowRight />
              </Button>
            ) : (
              <Button key="submit" type="submit" disabled={pending}>
                {pending ? "Wird gespeichert…" : "Einrichtung abschließen"}
              </Button>
            )}
          </footer>
        </Card>
      </form>
    </div>
  );
}
