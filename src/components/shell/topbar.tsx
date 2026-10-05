import { Logo } from "@/components/brand/logo";
import { UserMenu } from "@/components/shell/user-menu";
import { Badge } from "@/components/ui/badge";
import type { SessionUser } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";

async function BotStatus() {
  const health = await botApi.health().catch(() => null);
  const online = health?.gateway === "CONNECTED";
  return (
    <Badge tone={online ? "success" : "danger"} dot className="hidden sm:inline-flex">
      {online ? "Bot online" : "Bot offline"}
    </Badge>
  );
}

export function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-bg/90 px-4 backdrop-blur-md md:px-6">
      <Logo />
      <div className="flex-1" />
      <BotStatus />
      <UserMenu user={user} />
    </header>
  );
}
