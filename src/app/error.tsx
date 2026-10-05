"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60dvh] items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight">Da ist etwas schiefgelaufen</h1>
        <p className="mt-2 text-sm text-muted">
          Möglicherweise ist der Bot gerade nicht erreichbar. Versuche es in einem Moment erneut.
        </p>
        {error.digest && <p className="mt-3 text-xs text-faint">Fehler-ID: {error.digest}</p>}
        <Button className="mt-6" onClick={() => retry()}>
          Erneut versuchen
        </Button>
      </div>
    </main>
  );
}
