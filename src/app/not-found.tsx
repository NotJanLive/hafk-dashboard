import { LogoImage } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <LogoImage size={96} className="mx-auto opacity-80" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Seite nicht gefunden</h1>
        <p className="mt-2 text-sm text-muted">
          Diese Seite gibt es nicht, oder du hast keinen Zugriff auf diesen Server.
        </p>
        <ButtonLink href="/servers" className="mt-6">
          Zu meinen Servern
        </ButtonLink>
      </div>
    </main>
  );
}
