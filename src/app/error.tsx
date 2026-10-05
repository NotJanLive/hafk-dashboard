"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Led } from "@/components/ui/led";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="canvas flex min-h-[60dvh] items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <p className="label flex items-center justify-center gap-2">
          <Led state="error" pulse={false} />
          Fehler
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Da ist etwas schiefgelaufen</h1>
        <p className="mt-2 text-sm text-muted">
          Möglicherweise ist der Bot gerade nicht erreichbar. Versuche es in einem Moment erneut.
        </p>
        {error.digest && <p className="mt-3 font-mono text-[11px] text-faint">ref: {error.digest}</p>}
        <Button variant="secondary" className="mt-6" onClick={() => retry()}>
          Erneut versuchen
        </Button>
      </div>
    </main>
  );
}
