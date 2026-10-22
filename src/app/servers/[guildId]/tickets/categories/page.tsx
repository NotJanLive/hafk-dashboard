import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { CategoryList } from "./category-list";

export const metadata: Metadata = { title: "Ticket-Kategorien" };

export default async function CategoriesPage(props: PageProps<"/servers/[guildId]/tickets/categories">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const categories = await botApi.tickets.categories(guild.id, user.id);

  return (
    <>
      <PageHeader
        title="Kategorien"
        description="Jede Kategorie ist eine Ticket-Art mit eigenen Rollen, Begrüßung und optionalem Formular."
        actions={
          <ButtonLink href={`/servers/${guild.id}/tickets/categories/new`}>
            <Plus />
            Neue Kategorie
          </ButtonLink>
        }
      />
      <CategoryList guildId={guild.id} categories={categories} />
    </>
  );
}
