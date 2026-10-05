import { ButtonLink } from "@/components/ui/button";
import { Led } from "@/components/ui/led";

export default function NotFound() {
  return (
    <main className="canvas flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <p className="label flex items-center justify-center gap-2">
          <Led state="warn" pulse={false} />
          404 · nicht gefunden
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Hier gibt es nichts zu verwalten</h1>
        <p className="mt-2 text-sm text-muted">
          Die Seite existiert nicht, oder du hast keinen Zugriff auf diesen Server.
        </p>
        <ButtonLink href="/servers" variant="secondary" className="mt-6">
          Zur Serverauswahl
        </ButtonLink>
      </div>
    </main>
  );
}
