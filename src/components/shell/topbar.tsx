import type { ReactNode } from "react";
import { UserMenu } from "@/components/shell/user-menu";
import { Led } from "@/components/ui/led";
import type { SessionUser } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";

async function BotStatus() {
  const health = await botApi.health().catch(() => null);
  const online = health?.gateway === "CONNECTED";
  return (
    <span className="flex items-center gap-2 font-mono text-[11.5px] text-muted">
      <Led state={online ? "on" : "error"} />
      {online ? "Bot online" : "Bot nicht erreichbar"}
    </span>
  );
}

export function Topbar({ user, children }: { user: SessionUser; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-line bg-bg/85 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">{children}</div>
      <BotStatus />
      <span className="h-5 w-px bg-line" aria-hidden />
      <UserMenu user={user} />
    </header>
  );
}
