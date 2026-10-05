import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "hafk_session";

/**
 * Optimistic check only: sends visitors without a session cookie to the login. Real
 * authorization happens in the data access layer (src/lib/dal.ts).
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL("/api/auth/login", request.url);
  login.searchParams.set("returnTo", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/servers/:path*"],
};
