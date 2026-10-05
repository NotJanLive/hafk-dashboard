import type { Channel, Role } from "@/lib/bot-api/types";
import { roleColor } from "@/lib/discord/cdn";
import { parseMentions } from "@/lib/discord/mentions";

/** Renders Discord mention markup with names resolved from the guild. */
export function MentionText({ text, channels, roles }: { text: string; channels: Channel[]; roles: Role[] }) {
  return (
    <>
      {parseMentions(text).map((token, index) => {
        switch (token.type) {
          case "text":
            return <span key={index}>{token.value}</span>;
          case "channel": {
            const channel = channels.find((candidate) => candidate.id === token.id);
            return (
              <span key={index} className="rounded bg-surface-3 px-1 font-medium text-text">
                #{channel?.name ?? "unbekannt"}
              </span>
            );
          }
          case "role": {
            const role = roles.find((candidate) => candidate.id === token.id);
            const color = roleColor(role?.color ?? 0);
            return (
              <span
                key={index}
                className="rounded px-1 font-medium"
                style={{ color: color ?? "var(--text)", background: color ? `${color}1f` : "var(--surface-3)" }}
              >
                @{role?.name ?? "gelöschte Rolle"}
              </span>
            );
          }
          case "user":
            return (
              <span key={index} className="rounded bg-surface-3 px-1 font-mono text-[0.9em]">
                @{token.id}
              </span>
            );
        }
      })}
    </>
  );
}
