import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { BotApiError, botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { CategoryEditor } from "../category-editor";

export const metadata: Metadata = { title: "Ticket-Kategorie bearbeiten" };

export default async function EditCategoryPage(props: PageProps<"/servers/[guildId]/tickets/categories/[categoryId]">) {
  const { guildId, categoryId } = await props.params;
  if (!/^\d{1,19}$/.test(categoryId)) notFound();
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [bot, emojis, category] = await Promise.all([
    botApi.bot().catch(() => null),
    botApi.emojis(guild.id, user.id).catch(() => []),
    botApi.tickets.category(guild.id, user.id, categoryId).catch((error) => {
      if (error instanceof BotApiError && error.status === 404) notFound();
      throw error;
    }),
  ]);

  return (
    <>
      <PageHeader
        title={category.name}
        description="Änderungen gelten für neue Tickets. Panels mit dieser Kategorie werden automatisch aktualisiert."
      />
      <CategoryEditor
        guildId={guild.id}
        channels={guild.channels}
        roles={guild.roles}
        emojis={emojis}
        guildInfo={{ name: guild.name, iconUrl: guild.iconUrl }}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
        botHighestRolePosition={guild.bot.highestRolePosition}
        category={category}
        position={category.position}
      />
    </>
  );
}
