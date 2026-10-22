"use client";

import { Lightbulb, Settings2, Sparkles, Wand2, X } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { buttonClasses } from "@/components/ui/button";

const STORAGE_KEY = "hafk:tickets:assistant-hint";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "hidden";
  } catch {
    return false;
  }
}

export function SetupBanner({ guildId, hasCategories }: { guildId: string; hasCategories: boolean }) {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const assistant = `/servers/${guildId}/tickets/setup`;

  if (!hasCategories) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-surface to-surface p-6 md:p-8">
        <Sparkles className="pointer-events-none absolute -top-6 -right-6 size-40 text-primary/10" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-hover">
          <Wand2 className="size-3.5" />
          In 2 Minuten startklar
        </span>
        <h2 className="mt-3 text-xl font-bold md:text-2xl">Einrichtungsassistent</h2>
        <p className="mt-2 text-[15px] text-muted">Ticket-Arten, Teams und Panel in wenigen Schritten eingerichtet.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={assistant} className={buttonClasses({ size: "lg" })}>
            <Sparkles />
            Assistent starten
          </Link>
          <Link
            href={`/servers/${guildId}/tickets/categories/new`}
            className={buttonClasses({ variant: "secondary", size: "lg" })}
          >
            <Settings2 />
            Selbst einrichten
          </Link>
        </div>
      </section>
    );
  }

  if (dismissed) return null;

  const hide = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "hidden");
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    } catch {}
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-hover">
        <Lightbulb className="size-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm text-muted">
        <span className="font-semibold text-text">Weitere Ticket-Arten anlegen?</span> Der Assistent ergänzt Vorlagen
        wie Report oder Bewerbung samt Team und Panel, deine bestehenden Kategorien bleiben erhalten.
      </p>
      <Link href={assistant} className={buttonClasses({ variant: "secondary", size: "sm" })}>
        <Sparkles />
        Assistent öffnen
      </Link>
      <button
        type="button"
        onClick={hide}
        className="rounded-md p-1.5 text-faint hover:bg-surface-2 hover:text-text"
        aria-label="Hinweis ausblenden"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
