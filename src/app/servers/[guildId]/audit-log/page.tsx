import type { Metadata } from "next";
import { AuditList } from "@/components/audit/audit-list";
import { PageHeader, Panel } from "@/components/ui/panel";
import { botApi } from "@/lib/bot-api/client";
import { requireGuild } from "@/lib/dal";

export const metadata: Metadata = { title: "Audit-Log" };

const LIMIT = 100;

export default async function AuditLogPage(props: PageProps<"/servers/[guildId]/audit-log">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireGuild(guildId);
  const entries = await botApi.auditLog(guild.id, user.id, LIMIT);

  return (
    <>
      <PageHeader
        label="Audit-Log"
        title="Änderungsprotokoll"
        meta={<span>Die letzten {LIMIT} Änderungen an der Konfiguration</span>}
      />
      <Panel>
        <AuditList entries={entries} channels={guild.channels} roles={guild.roles} />
      </Panel>
    </>
  );
}
