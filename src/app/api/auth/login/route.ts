import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { DISCORD_SCOPES, discordOAuth } from "@/lib/auth/discord";
import { env } from "@/lib/env";
import { safeReturnTo } from "@/lib/utils";

const OAUTH_COOKIE = "hafk_oauth";
const OAUTH_COOKIE_MAX_AGE = 60 * 10;

export async function GET(request: NextRequest) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  const url = discordOAuth().createAuthorizationURL(state, codeVerifier, DISCORD_SCOPES);
  // Skip the consent screen for users who already authorized the app.
  url.searchParams.set("prompt", "none");

  (await cookies()).set(OAUTH_COOKIE, JSON.stringify({ state, codeVerifier, returnTo }), {
    httpOnly: true,
    secure: env().APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/api/auth",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });

  return NextResponse.redirect(url);
}
