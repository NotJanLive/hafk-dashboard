import "server-only";
import { z } from "zod";

const schema = z.object({
  DASHBOARD_URL: z.url().transform((url) => url.replace(/\/$/, "")),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  DISCORD_CLIENT_ID: z.string().regex(/^\d+$/, "DISCORD_CLIENT_ID must be the application ID"),
  DISCORD_CLIENT_SECRET: z.string().min(1),
  BOT_API_URL: z.url().transform((url) => url.replace(/\/$/, "")),
  SHARED_SECRET: z.string().min(32, "SHARED_SECRET must be identical in bot and dashboard"),
  BOT_INVITE_PERMISSIONS: z.string().regex(/^\d+$/).default("268823632"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const result = schema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      throw new Error(`Invalid dashboard environment:\n${issues.join("\n")}`);
    }
    cached = result.data;
  }
  return cached;
}
