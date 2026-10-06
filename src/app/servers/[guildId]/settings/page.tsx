import type { Metadata } from "next";
import { RotateCcw } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { requireConfiguredGuild } from "@/lib/dal";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage(props: PageProps<"/servers/[guildId]/settings">) {
  const { guildId } = await props.params;
  const { guild, settings } = await requireConfiguredGuild(guildId);

  return (
    <>
      <PageHeader title="Einstellungen" description="Allgemeine Einstellungen für diesen Server." />
      <SettingsForm guildId={guild.id} settings={settings} roles={guild.roles} />

      {guild.grant !== "DASHBOARD_ROLE" && (
        <Card className="mt-8 border-danger/30">
          <CardHeader
            title="Gefahrenzone"
            description="Setzt den Bot auf diesem Server zurück: gespeicherte Daten, gesendete Nachrichten und erstellte Kanäle. Du wählst aus, was gelöscht wird."
          />
          <CardBody>
            <ButtonLink href={`/servers/${guild.id}/settings/reset`} variant="danger">
              <RotateCcw />
              Bot zurücksetzen
            </ButtonLink>
          </CardBody>
        </Card>
      )}
    </>
  );
}
