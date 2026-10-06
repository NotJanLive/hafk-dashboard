import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireGuild } from "@/lib/dal";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Bot zurücksetzen" };

export default async function ResetPage(props: PageProps<"/servers/[guildId]/settings/reset">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireGuild(guildId);

  if (guild.grant === "DASHBOARD_ROLE") {
    return (
      <>
        <PageHeader title="Bot zurücksetzen" />
        <Card className="p-6 text-sm text-muted">
          Nur Admins und Mitglieder mit „Server verwalten“ dürfen den Bot zurücksetzen.
        </Card>
      </>
    );
  }

  const preview = await botApi.reset.preview(guild.id, user.id);
  return (
    <>
      <PageHeader
        title="Bot zurücksetzen"
        description="Setzt den Bot auf diesem Server auf den Ausgangszustand zurück. Du entscheidest, was gelöscht wird und was bleibt."
      />
      <ResetForm guildId={guild.id} guildName={guild.name} preview={preview} />
    </>
  );
}
