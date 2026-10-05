import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { botApi } from "@/lib/bot-api/client";
import { requireGuild } from "@/lib/dal";

export default async function GuildLayout(props: LayoutProps<"/servers/[guildId]">) {
  const { guildId } = await props.params;
  const { user, guild } = await requireGuild(guildId);
  const settings = await botApi.settings(guild.id, user.id);

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        guild={{ id: guild.id, name: guild.name, iconUrl: guild.iconUrl }}
        setupCompleted={settings.setupCompleted}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user}>
          <span className="truncate text-sm font-semibold md:hidden">{guild.name}</span>
        </Topbar>
        <main className="canvas flex-1 px-4 pt-8 pb-24 md:px-8 md:pb-12">
          <div className="mx-auto max-w-5xl">{props.children}</div>
        </main>
      </div>
    </div>
  );
}
