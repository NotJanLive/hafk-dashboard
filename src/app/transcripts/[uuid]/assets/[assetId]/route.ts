import type { NextRequest } from "next/server";
import { botFetch } from "@/lib/bot-api/client";
import { getCurrentUser } from "@/lib/dal";

const UUID = /^[0-9a-f-]{36}$/;
const ASSET = /^\d{1,19}$/;

export async function GET(_request: NextRequest, ctx: RouteContext<"/transcripts/[uuid]/assets/[assetId]">) {
  const { uuid, assetId } = await ctx.params;
  if (!UUID.test(uuid) || !ASSET.test(assetId)) return new Response(null, { status: 404 });
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });

  const response = await botFetch(`/transcripts/${uuid}/assets/${assetId}`, user.id).catch(() => null);
  if (!response) return new Response(null, { status: 503 });
  if (!response.ok || !response.body) return new Response(null, { status: response.status === 403 ? 403 : 404 });

  const headers = new Headers({
    "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox",
  });
  const length = response.headers.get("Content-Length");
  if (length) headers.set("Content-Length", length);
  const fileName = response.headers.get("X-File-Name");
  if (fileName) headers.set("Content-Disposition", `inline; filename="${fileName.replace(/[^\w.-]/g, "_")}"`);
  return new Response(response.body, { headers });
}
