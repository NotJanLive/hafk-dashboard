import { requireConfiguredGuild } from "@/lib/dal";
import { TicketTabs } from "./tabs";

export default async function TicketsLayout(props: LayoutProps<"/servers/[guildId]/tickets">) {
  const { guildId } = await props.params;
  const { guild } = await requireConfiguredGuild(guildId);

  return (
    <>
      <TicketTabs guildId={guild.id} />
      {props.children}
    </>
  );
}
