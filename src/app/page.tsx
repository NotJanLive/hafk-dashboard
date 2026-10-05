import { redirect } from "next/navigation";
import { LogoImage } from "@/components/brand/logo";
import { getCurrentUser } from "@/lib/dal";

const ERRORS: Record<string, string> = {
  access_denied: "Die Anmeldung wurde abgebrochen.",
  invalid_state: "Die Anmeldung ist abgelaufen. Bitte versuche es erneut.",
  login_failed: "Die Anmeldung bei Discord ist fehlgeschlagen.",
};

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="currentColor">
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.49 0 12.64 12.64 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-1.99a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1 0-.12l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08 0l.37.3a.08.08 0 0 1 0 .12c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .09.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.150-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}

export default async function LoginPage(props: PageProps<"/">) {
  if (await getCurrentUser()) redirect("/servers");
  const { error } = await props.searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="relative mx-auto size-44">
          <div aria-hidden className="brand-glow absolute inset-6 rounded-full" />
          <LogoImage size={176} priority className="relative" />
        </div>

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight">Willkommen zurück</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Melde dich mit Discord an, um den Bot auf deinen Servern einzurichten und zu verwalten.
        </p>

        {message && (
          <p role="alert" className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {message}
          </p>
        )}

        {/* Plain link: the route handler starts the OAuth flow with a server-side redirect. */}
        <a
          href="/api/auth/login"
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#5865f2] text-[15px] font-bold text-white shadow-lg shadow-[#5865f2]/25 transition-colors hover:bg-[#4752c4]"
        >
          <DiscordIcon />
          Mit Discord anmelden
        </a>
        <p className="mt-4 text-xs text-faint">Wir sehen nur deinen Namen und deine Serverliste.</p>
      </div>
    </main>
  );
}
