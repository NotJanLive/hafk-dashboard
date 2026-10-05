import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { getSettings, requireGuild } from "@/lib/dal";

export default async function GuildLayout(props: LayoutProps<"/servers/[guildId]">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireGuild(guildId);
  const settings = await getSettings(guild.id, user.id);

  return (
    <div className="min-h-dvh">
      <Topbar user={user} />
      <div className="lg:flex">
        <Sidebar
          guild={{ id: guild.id, name: guild.name, iconUrl: guild.iconUrl }}
          setupCompleted={settings.setupCompleted}
        />
        <main className="min-w-0 flex-1 px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-5xl">{props.children}</div>
        </main>
      </div>
    </div>
  );
}
