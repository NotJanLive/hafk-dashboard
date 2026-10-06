import { NextResponse, type NextRequest } from "next/server";
import { botApi } from "@/lib/bot-api/client";
import { isSnowflake } from "@/lib/discord/cdn";
import { env } from "@/lib/env";

const WAIT_FOR_JOIN_MS = 6_000;
const POLL_INTERVAL_MS = 750;

export async function GET(request: NextRequest) {
  const { DASHBOARD_URL } = env();
  const guildId = request.nextUrl.searchParams.get("guild_id");
  if (request.nextUrl.searchParams.get("error") || !guildId || !isSnowflake(guildId)) {
    return NextResponse.redirect(new URL("/servers", DASHBOARD_URL));
  }

  const deadline = Date.now() + WAIT_FOR_JOIN_MS;
  while (Date.now() < deadline) {
    const bot = await botApi.bot().catch(() => null);
    if (bot?.guildIds.includes(guildId)) {
      return NextResponse.redirect(new URL(`/servers/${guildId}`, DASHBOARD_URL));
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return NextResponse.redirect(new URL("/servers", DASHBOARD_URL));
}
