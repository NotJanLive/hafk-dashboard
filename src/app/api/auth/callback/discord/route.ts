import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { discordOAuth, fetchDiscordUser } from "@/lib/auth/discord";
import { getSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { safeReturnTo } from "@/lib/utils";

const OAUTH_COOKIE = "hafk_oauth";

const pendingLogin = z.object({
  state: z.string(),
  codeVerifier: z.string(),
  returnTo: z.string(),
});

function fail(reason: string) {
  return NextResponse.redirect(new URL(`/?error=${reason}`, env().APP_URL));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_COOKIE)?.value;
  cookieStore.delete({ name: OAUTH_COOKIE, path: "/api/auth" });

  if (params.get("error")) return fail("access_denied");

  const pending = raw ? pendingLogin.safeParse(JSON.parse(raw)) : null;
  const code = params.get("code");
  if (!pending?.success || !code || params.get("state") !== pending.data.state) {
    return fail("invalid_state");
  }

  try {
    const tokens = await discordOAuth().validateAuthorizationCode(code, pending.data.codeVerifier);
    const user = await fetchDiscordUser(tokens.accessToken());

    const session = await getSession();
    session.user = user;
    session.accessToken = tokens.accessToken();
    session.accessTokenExpiresAt = tokens.accessTokenExpiresAt().getTime();
    await session.save();
  } catch (error) {
    console.error("Discord login failed", error);
    return fail("login_failed");
  }

  return NextResponse.redirect(new URL(safeReturnTo(pending.data.returnTo), env().APP_URL));
}
