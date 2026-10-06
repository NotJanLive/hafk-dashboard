import { NextResponse } from "next/server";
import { discordOAuth } from "@/lib/auth/discord";
import { getSession } from "@/lib/auth/session";
import { env } from "@/lib/env";

export async function POST() {
  const session = await getSession();
  const token = session.accessToken;
  session.destroy();

  if (token) {
    await discordOAuth()
      .revokeToken(token)
      .catch(() => undefined);
  }
  return NextResponse.redirect(new URL("/", env().DASHBOARD_URL), { status: 303 });
}
