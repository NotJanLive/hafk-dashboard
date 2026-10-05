import Image from "next/image";
import { LogOut } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { userAvatarUrl } from "@/lib/discord/cdn";

export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1">
        <Image
          src={userAvatarUrl(user.id, user.avatar, 64)}
          alt=""
          width={28}
          height={28}
          className="size-7 rounded-full bg-surface-3"
        />
        <span className="hidden max-w-40 truncate text-sm font-medium sm:block">
          {user.globalName ?? user.username}
        </span>
      </div>
      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          className="inline-flex size-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-3 hover:text-text"
          aria-label="Abmelden"
          title="Abmelden"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}
