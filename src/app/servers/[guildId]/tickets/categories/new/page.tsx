import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { CategoryEditor } from "../category-editor";

export const metadata: Metadata = { title: "Neue Ticket-Kategorie" };

export default async function NewCategoryPage(props: PageProps<"/servers/[guildId]/tickets/categories/new">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [bot, emojis, categories] = await Promise.all([
    botApi.bot().catch(() => null),
    botApi.emojis(guild.id, user.id).catch(() => []),
    botApi.tickets.categories(guild.id, user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Neue Kategorie"
        description="Eine Ticket-Art mit eigenen Rollen, Begrüßung und optionalem Formular."
      />
      <CategoryEditor
        guildId={guild.id}
        channels={guild.channels}
        roles={guild.roles}
        emojis={emojis}
        guildInfo={{ name: guild.name, iconUrl: guild.iconUrl }}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
        botHighestRolePosition={guild.bot.highestRolePosition}
        category={null}
        position={categories.length}
      />
    </>
  );
}
