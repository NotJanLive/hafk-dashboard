import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "hafk_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
};

export type SessionData = {
  user?: SessionUser;
  /** Discord OAuth token, only used server-side to list the user's guilds. */
  accessToken?: string;
  accessTokenExpiresAt?: number;
};

function sessionOptions(): SessionOptions {
  const { SESSION_SECRET, APP_URL } = env();
  return {
    cookieName: SESSION_COOKIE,
    password: SESSION_SECRET,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: APP_URL.startsWith("https://"),
      sameSite: "lax",
      path: "/",
    },
  };
}

/** Encrypted, stateless session cookie. Mutations (save/destroy) only work in route handlers and server actions. */
export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}
