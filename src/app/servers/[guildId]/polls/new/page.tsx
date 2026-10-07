import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { botApi } from "@/lib/bot-api/client";
import { requireConfiguredGuild } from "@/lib/dal";
import { PollEditor } from "../poll-editor";

export const metadata: Metadata = { title: "Neue Umfrage" };

export default async function NewPollPage(props: PageProps<"/servers/[guildId]/polls/new">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireConfiguredGuild(guildId);
  const [bot, emojis] = await Promise.all([
    botApi.bot().catch(() => null),
    botApi.emojis(guild.id, user.id).catch(() => []),
  ]);

  return (
    <>
      <PageHeader
        title="Neue Umfrage"
        description="Stelle eine Frage, lege die Antworten fest und entscheide, wer was sehen darf."
      />
      <PollEditor
        guildId={guild.id}
        channels={guild.channels}
        roles={guild.roles}
        emojis={emojis}
        guildInfo={{ name: guild.name, iconUrl: guild.iconUrl }}
        bot={{ name: bot?.username ?? "HAFK-Bot", avatarUrl: bot?.avatarUrl ?? null }}
      />
    </>
  );
}
