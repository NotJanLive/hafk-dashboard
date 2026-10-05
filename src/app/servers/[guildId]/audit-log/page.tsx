import type { Metadata } from "next";
import { AuditList } from "@/components/audit/audit-list";
import { Card, CardBody, PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";

export const metadata: Metadata = { title: "Änderungsprotokoll" };

const LIMIT = 100;

export default async function AuditLogPage(props: PageProps<"/servers/[guildId]/audit-log">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const entries = await botApi.auditLog(guild.id, user.id, LIMIT);

  return (
    <>
      <PageHeader title="Änderungsprotokoll" description="Wer hat wann was an der Konfiguration geändert." />
      <Card>
        <CardBody>
          <AuditList entries={entries} channels={guild.channels} roles={guild.roles} />
        </CardBody>
      </Card>
    </>
  );
}
