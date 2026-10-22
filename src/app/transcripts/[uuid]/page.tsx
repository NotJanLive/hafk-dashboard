import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import type { Transcript } from "@/lib/bot-api/types";
import { getCurrentUser } from "@/lib/dal";
import { TranscriptView } from "./transcript-view";

const UUID = /^[0-9a-f-]{36}$/;

export const metadata: Metadata = { title: "Transkript" };

function NoAccess({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Lock className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold">Kein Zugriff</h1>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <Link href="/servers" className={buttonClasses({ variant: "secondary" }, "mt-6")}>
          Zum Dashboard
        </Link>
      </div>
    </main>
  );
}

export default async function TranscriptPage(props: PageProps<"/transcripts/[uuid]">) {
  const { uuid } = await props.params;
  if (!UUID.test(uuid)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/api/auth/login?returnTo=${encodeURIComponent(`/transcripts/${uuid}`)}`);

  let transcript: Transcript;
  try {
    transcript = await botApi.transcripts.get(uuid, user.id);
  } catch (error) {
    if (error instanceof BotApiError && error.status === 404) notFound();
    if (error instanceof BotApiError && error.status === 403) {
      return (
        <NoAccess message="Du bist angemeldet, hast aber keine Berechtigung für dieses Transkript. Frag das Server-Team, ob es dir den Zugriff freigibt." />
      );
    }
    throw error;
  }

  return <TranscriptView transcript={transcript} />;
}
