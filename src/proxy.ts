import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "hafk_session";

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL("/api/auth/login", request.url);
  login.searchParams.set("returnTo", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/servers/:path*"],
};
