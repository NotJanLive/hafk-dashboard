import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { SetupBanner } from "./setup-banner";
import { TicketStatsView } from "./stats";
import { TicketTable } from "./ticket-table";

export const metadata: Metadata = { title: "Tickets" };

export default async function TicketsPage(props: PageProps<"/servers/[guildId]/tickets">) {
  const { guildId } = await props.params;
  const searchParams = await props.searchParams;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const value = (key: string) => {
    const raw = searchParams[key];
    return typeof raw === "string" ? raw : undefined;
  };
  const status = value("status") === "CLOSED" ? "CLOSED" : value("status") === "ALL" ? "ALL" : "OPEN";
  const page = Math.max(0, Number(value("page") ?? 0) || 0);
  const search = value("search") ?? "";
  const categoryId = value("category") ?? "";
  const [stats, list, categories] = await Promise.all([
    botApi.tickets.stats(guild.id, user.id),
    botApi.tickets.list(guild.id, user.id, {
      status: status === "ALL" ? undefined : status,
      search: search || undefined,
      categoryId: categoryId || undefined,
      page,
    }),
    botApi.tickets.categories(guild.id, user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Support-Tickets mit eigenen Kategorien, Formularen und Transkripten, die auch nach dem Schließen abrufbar bleiben."
      />
      <div className="space-y-10">
        <SetupBanner guildId={guild.id} hasCategories={categories.length > 0} />
        <TicketStatsView stats={stats} />
        <TicketTable
          guildId={guild.id}
          page={list}
          status={status}
          search={search}
          categoryId={categoryId}
          categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        />
      </div>
    </>
  );
}
